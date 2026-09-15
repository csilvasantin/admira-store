import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createTrafficProjection,mapTrafficPoint,drawTrafficSprites,TRAFFIC_TTL} from './real-traffic.mjs';
const iso={cols:14,rows:8,ox:270,oy:185,tileW:80,tileH:28};
const track=(id=1,extra={})=>({id,kind:'person',x:.4,y:.5,observedAt:10000,confirmed:true,...extra});
const frame=(tracks,extra={})=>({source:'puerta-cam',status:'live',frameAt:10000,tracks,...extra});
test('Only fresh measured trajectories draw; totals, unconfirmed and invalid positions create no actors',()=>{
  const p=createTrafficProjection({now:()=>10000});
  p.update(frame([track(),track(2,{confirmed:false}),track(3,{x:1.1}),track(4,{kind:'unknown'}),track(5,{observedAt:8400})],{counts:{person:99}}));
  assert.deepEqual(p.read(iso).map(a=>a.id),[1]);
  p.update(frame([],{frameAt:10001}));assert.equal(p.read(iso).length,0);assert.equal(p.status,'live');
});
test('Motion interpolates only between observations, then stops and expires on the original timestamp',()=>{
  let now=10000;const p=createTrafficProjection({now:()=>now});p.update(frame([track()]));const initial=p.read(iso)[0];
  now=10200;p.update(frame([track(1,{x:.7,observedAt:now})],{frameAt:now}));assert.equal(p.read(iso)[0].x,initial.x);
  now=10260;const midway=p.read(iso)[0];assert.ok(midway.progress>.4&&midway.progress<.7);
  now=10330;const stopped=p.read(iso)[0];assert.equal(stopped.progress,.7);assert.equal(stopped.moving,false);
  now=10600;p.update(frame([track(1,{x:.7,observedAt:10200})],{frameAt:10200}));assert.equal(p.read(iso)[0].x,stopped.x);
  now=10200+TRAFFIC_TTL;assert.equal(p.read(iso).length,0);assert.equal(p.status,'stale');
});
test('Stale, disconnected and missing data remove actors immediately; older frames cannot overwrite newer tracks',()=>{
  let now=10000;const p=createTrafficProjection({now:()=>now});p.update(frame([track()]));
  p.update(frame([track(2)],{frameAt:9999}));assert.equal(p.read(iso)[0].id,1);
  p.update({status:'disconnected'});assert.equal(p.read(iso).length,0);assert.equal(p.status,'disconnected');
  p.update(frame([track()]));p.update(null);assert.equal(p.read(iso).length,0);
});
test('Each track TTL is independent of a fresher batch; manual scooters require a real confirmed trajectory',()=>{
  let now=10000;const p=createTrafficProjection({now:()=>now});
  p.update(frame([track(1,{kind:'bicycle'}),track(2,{kind:'scooter'}),track(3,{kind:'scooter',manual:true})]));
  const before=p.read(iso).find(a=>a.id===1);assert.deepEqual(p.read(iso).map(a=>a.id).sort(),[1,3]);
  p.update(frame([track(1,{kind:'scooter',manual:true})]));assert.equal(p.read(iso)[0].kind,'scooter');assert.equal(p.read(iso)[0].observedAt,10000);assert.equal(p.read(iso)[0].moving,false);
  now=10100;p.update(frame([track(1,{kind:'scooter',manual:true,observedAt:now})],{frameAt:now}));
  assert.equal(p.read(iso)[0].appearance,before.appearance);assert.equal(p.read(iso)[0].manual,true);
  now=11501;p.update(frame([track(1,{kind:'scooter',manual:true,observedAt:10000})],{frameAt:now}));assert.equal(p.read(iso).length,0);
});
test('Mapped support points remain outside the store and preserve observed direction and depth',()=>{
  for(const kind of ['person','car','motorcycle','bicycle','scooter']){
    const a=mapTrafficPoint({kind,x:0,y:.2},iso),b=mapTrafficPoint({kind,x:1,y:.2},iso),deep=mapTrafficPoint({kind,x:0,y:.9},iso);
    assert.ok(a.col>iso.cols);assert.ok(b.col>iso.cols);assert.ok(b.row>a.row);assert.ok(b.x<a.x);assert.ok(deep.col>a.col);
    for(const x of [0,.5,1])for(const y of [0,.5,1]){const pos=mapTrafficPoint({kind,x,y},iso);assert.ok(pos.x>=20&&pos.x<=780);assert.ok(pos.y<=492);assert.ok(pos.visible);}
  }
});
test('Pixel output is deterministic and neither source nor actors acquire demographic/game fields',()=>{
  const input=frame(['person','car','motorcycle','bicycle','scooter'].map((kind,i)=>track(i,{kind,manual:kind==='scooter'}))),original=JSON.stringify(input);
  const p=createTrafficProjection({now:()=>10000});p.update(input);const actors=p.read(iso),before=JSON.stringify(actors);
  const render=mode=>{const out=[],ctx={};for(const name of ['save','restore','beginPath','rect','clip','translate','scale','fillRect','moveTo','lineTo','stroke'])ctx[name]=(...args)=>out.push([name,...args]);drawTrafficSprites(ctx,actors,{mode});return out;};
  for(const mode of ['good','better','best'])assert.deepEqual(render(mode),render(mode));
  assert.equal(JSON.stringify(actors),before);assert.equal(JSON.stringify(input),original);
  for(const a of actors)for(const key of ['gender','age','skin','look','bought'])assert.equal(Object.hasOwn(a,key),false);
});
test('The actual Xtanco suppresses simulated exterior spawning without changing cumulative or interior state',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const start=html.indexOf('function xtoreRealExteriorActive()'),end=html.indexOf('function getCustomerRoamAnchor(',start);assert.ok(start>0&&end>start);
  const context={window:{__xtoreWindowPlayer:{}},G:{custs:[{id:'inside'}],passersby:[{id:'simulated'}],passersbyToday:27,passersbyTotal:45,extAdImpacts:{old:3},audOutQueue:2},Math};
  vm.runInNewContext(html.slice(start,end),context);assert.equal(context.spawnPasserby(),null);context.updatePassersby();
  assert.equal(context.G.passersby.length,0);assert.equal(context.G.custs[0].id,'inside');assert.equal(context.G.passersbyToday,27);assert.equal(context.G.passersbyTotal,45);assert.equal(context.G.extAdImpacts.old,3);assert.equal(context.G.audOutQueue,2);
  assert.ok(html.includes("drawShopOperation(()=>window.__xtoreRealTraffic?.draw(cx,ISO,W,H),'actor')"));
  assert.ok(html.includes("window.__xtoreWindowPlayer.draw(cx,vW,vH,'exterior')"));
  assert.ok(html.includes("window.__xtoreWindowPlayer.draw(ctx,w,h);return;"));
});
test('The three visible passage labels read the authoritative cumulative source without writing game counters',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf('function xtoreRealExteriorActive()'),end=html.indexOf('function spawnPasserby()',start);
  let measured=91;const context={window:{__xtoreWindowPlayer:{exterior:()=>measured}},G:{passersbyToday:27,customersToday:8}};
  vm.runInNewContext(html.slice(start,end),context);assert.equal(context.exteriorPersonPassagesForDisplay(),91);
  measured=0;assert.equal(context.exteriorPersonPassagesForDisplay(),0);measured=null;assert.equal(context.exteriorPersonPassagesForDisplay(),'—');
  measured=NaN;assert.equal(context.exteriorPersonPassagesForDisplay(),'—');assert.equal(context.G.passersbyToday,27);assert.equal(context.G.customersToday,8);
  delete context.window.__xtoreWindowPlayer;assert.equal(context.exteriorPersonPassagesForDisplay(),27);
  assert.ok(html.includes("document.getElementById('bbCli').textContent=exteriorPersonPassagesForDisplay()"));
  assert.ok(html.includes("tx('↔'+exteriorPersonPassagesForDisplay()"));
  assert.ok(html.includes("${lang==='es'?'PASAN':'PASS'}: ${exteriorPersonPassagesForDisplay()}"));
});
