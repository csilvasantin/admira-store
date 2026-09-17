import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifeSnapshot} from './life-snapshot.mjs';

const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185};
const at=(col,row,projection=iso)=>({x:projection.ox+(col-row)*projection.tileW/2-7,y:projection.oy+(col+row)*projection.tileH/2-20});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function fixture(){
  return {active:true,iso,layout:[{id:'counter',type:'counter',col:1,row:2}],footprints:{counter:[1,2]},
    game:{staff:[{...at(3,2),hired:true,name:'Player',shirt:0,hair:3,role:3,dir:1,
      look:{skin:0,pants:2,shoes:1}}],custs:[{...at(6,4),id:12,dir:-1,st:'browse',num:8,
      look:{shirt:2,hair:1,skin:4,pants:3,shoes:2,age:'nino',gender:'f',accessory:1}}],
    passersby:[{...at(15,4),outside:true,dir:1,look:{shirt:4,hair:5,skin:1,age:'senior'}}],
    custIn:17,gameTime:14,doorAnim:.4}};
}

test('immersive view retains layout, canonical navigation anchors and indexed appearance without mutating state',()=>{
  const input=fixture(),before=JSON.stringify(input),snapshot=createLifeSnapshot(),scene=snapshot(input);
  assert.equal(JSON.stringify(input),before);assert.deepEqual(scene.layout[0].fp,[1,2]);
  const [staff,customer,passerby]=scene.actors;
  near(staff.col,3);near(staff.row,2);near(customer.col,6);near(customer.row,4);
  assert.equal(staff.color,'#4466cc');assert.equal(staff.hair,'#111111');assert.equal(staff.skin,'#ffe0bd');
  assert.equal(staff.pants,'#4a3a2a');assert.equal(staff.shoes,'#1a1a2a');assert.equal(staff.isPlayer,true);
  assert.equal(customer.color,'#44aa55');assert.equal(customer.hair,'#cc4422');assert.equal(customer.skin,'#8d5524');
  assert.equal(customer.scale,.72);assert.equal(customer.gender,'f');assert.equal(customer.skirt,true);assert.equal(customer.number,8);
  assert.equal(passerby.scale,.9);assert.equal(scene.inside,1);assert.equal(scene.entries,17);
  scene.layout[0].fp[0]=99;customer.color='red';assert.equal(JSON.stringify(input),before);
});

test('nino and child keep the same child profile and scale without rewriting their source age',()=>{
  const input=fixture(),snapshot=createLifeSnapshot(),first=snapshot(input).actors.find(a=>a.kind==='customer');
  input.game.custs[0].look.age='child';
  const before=JSON.stringify(input),second=snapshot(input).actors.find(a=>a.kind==='customer');
  assert.equal(first.age,'nino');assert.equal(second.age,'child');
  assert.equal(first.scale,.72);assert.equal(second.scale,first.scale);
  assert.equal(second.id,first.id);assert.equal(second.visitorProfileId,first.visitorProfileId);
  assert.equal(second.visitorStyle.age,'child');assert.equal(JSON.stringify(input),before);
});

test('live palette overrides defaults and named character uniforms follow the running renderer',()=>{
  const input=fixture(),snapshot=createLifeSnapshot();
  input.palette={shirts:['#010101','#020202','#030303'],skins:['#eeeeee']};
  input.game.staff.push({...at(2,3),hired:true,role:4,shirt:1,hair:5});
  input.game.guardiaCivil={...at(9,3),phase:'patrolling'};
  input.game.saca={...at(12,3),phase:'unloading'};
  input.game.unitreeBot={...at(8,2),phase:'scanning'};
  const scene=snapshot(input);
  assert.equal(scene.actors.find(a=>a.kind==='customer').color,'#030303');
  assert.equal(scene.actors.find(a=>a.kind==='customer').skin,'#eeeeee');
  assert.equal(scene.actors.find(a=>a.isDJ).color,'#ddaa22');
  assert.equal(scene.actors.find(a=>a.kind==='guardiaCivil').color,'#315f33');
  assert.equal(scene.actors.find(a=>a.kind==='saca').hat,'hardhat');
  assert.equal(scene.actors.find(a=>a.kind==='unitreeBot').robot,true);
});

test('stable identities and world headings follow actual movement and stop on unchanged input',()=>{
  const input=fixture(),snapshot=createLifeSnapshot(),first=snapshot(input),customer=input.game.custs[0];
  near(first.actors[0].heading,3*Math.PI/4);near(first.actors[1].heading,-Math.PI/4);
  Object.assign(customer,at(6.5,4));
  const second=snapshot(input);assert.equal(second.actors[1].id,first.actors[1].id);
  near(second.actors[1].heading,Math.PI/2);assert.equal(second.actors[1].walking,true);
  const third=snapshot(input);assert.equal(third.actors[1].walking,false);near(third.actors[1].heading,Math.PI/2);
  customer.dir=1;near(snapshot(input).actors[1].heading,3*Math.PI/4);
});

test('camera traffic suppresses synthetic pedestrians without creating measured trajectories or changing counters',()=>{
  const input=fixture(),snapshot=createLifeSnapshot();input.realTrafficActive=true;
  const before=JSON.stringify(input),scene=snapshot(input);
  assert.equal(scene.realTrafficActive,true);assert.equal(scene.actors.some(a=>a.kind==='passerby'),false);
  assert.equal(scene.actors.length,2);assert.equal(scene.entries,17);assert.equal(scene.inside,1);
  assert.equal(JSON.stringify(input),before);
  assert.equal(snapshot({...input,realTrafficActive:false}).actors.filter(a=>a.kind==='passerby').length,1);
});

test('editor and inactive scenes match visibility; unavailable telemetry and invalid positions stay absent',()=>{
  const input=fixture(),snapshot=createLifeSnapshot();
  assert.equal(snapshot({...input,active:false}),null);
  assert.deepEqual(snapshot({...input,editor:true}).actors,[]);
  assert.equal(snapshot({...input,iso:{...iso,tileW:0}}),null);
  input.game.staff[0].x=NaN;input.game.thief={...at(4,1),phase:'idle'};
  delete input.game.custIn;delete input.game.gameTime;
  const scene=snapshot(input);assert.equal(scene.actors.some(a=>a.kind==='staff'||a.kind==='thief'),false);
  assert.equal(scene.entries,null);assert.equal(scene.time,null);assert.ok(Number.isNaN(input.game.staff[0].x));
});

test('moving presentation keeps the room geometry but supplies no furniture or actors',()=>{
  const input=fixture(),snapshot=createLifeSnapshot(),before=JSON.stringify(input);
  const scene=snapshot({...input,moving:true,layout:[]});
  assert.deepEqual(scene.layout,[]);assert.deepEqual(scene.actors,[]);
  assert.equal(scene.cols,14);assert.equal(scene.rows,8);assert.equal(JSON.stringify(input),before);
});

test('presentation metadata copies existing customer fields without assigning numbers or changing timers',()=>{
  const input=fixture(),snapshot=createLifeSnapshot(),customer=input.game.custs[0];
  delete customer.num;Object.assign(customer,{bTimer:40,bMsg:'Hola',emoteTimer:2,emote:'👋',fanCustomerId:'member',bought:true,st:'leave'});
  const before=JSON.stringify(customer),actor=snapshot(input).actors.find(a=>a.kind==='customer');
  assert.equal(actor.number,null);assert.equal(actor.bubble,'Hola');assert.equal(actor.emote,'👋');assert.equal(actor.clubMember,true);assert.equal(actor.bag,true);
  assert.equal(JSON.stringify(customer),before);
});
