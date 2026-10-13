import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCREEN_LIGHT_KEY,readScreenLight,writeScreenLight,HALO,deviceKind,clock,screenRange,pointInQuad,quadBounds,visibleSlice,focusTarget,onAirGroups,isArrival,placeCards} from './screen-light.mjs';
import {parseVisualCommand,executeVisualCommand} from './xtanco-visual-command.mjs';

const storage=()=>{const data=new Map();return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),data};};
const number=id=>({'starbucks-wall-06':1,'starbucks-wall-05':2,'starbucks-wall-04':3,'starbucks-wall-03':4,'starbucks-wall-02':5,'starbucks-wall-01':6})[id]??null;
const wall=[6,5,4,3,2,1].map(n=>'starbucks-wall-0'+n);
const tracks=[{id:'a',title:'Frappuccino',url:'https://stock.admira.store/a.mp4',stockNumber:1310},{id:'b',title:'Horchata',url:'https://stock.admira.store/b.mp4',stockNumber:'1312'},{id:'c',title:'El Salvador',url:'https://stock.admira.store/c.mp4'}];
const playlist=id=>({wall:{title:'Pared · Starbucks',tracks},tpv:{title:'TPV · Publicidad local',tracks:[{id:'t',title:'TPV 1',url:'https://stock.admira.store/t.mp4'}]},ipad:{title:'iPad',tracks:[{id:'i',title:'Taza',url:'https://stock.admira.store/i.png',kind:'image'}]}})[id]||null;

test('preferences default to light on and cards on hover, and survive storage failures',()=>{
 assert.deepEqual(readScreenLight(storage()),{light:true,onAir:false});
 const s=storage();assert.deepEqual(writeScreenLight(s,{light:false,onAir:true}),{light:false,onAir:true});
 assert.deepEqual(JSON.parse(s.data.get(SCREEN_LIGHT_KEY)),{light:false,onAir:true});assert.deepEqual(readScreenLight(s),{light:false,onAir:true});
 s.data.set(SCREEN_LIGHT_KEY,'{broken');assert.deepEqual(readScreenLight(s),{light:true,onAir:false});
 assert.deepEqual(readScreenLight(null),{light:true,onAir:false});
 assert.deepEqual(writeScreenLight({setItem(){throw Error('quota');}},{onAir:1}),{light:true,onAir:false});
});

test('light spill is wide on the wall and tight on counter devices',()=>{
 assert.equal(deviceKind('starbucks-wall-03'),'wall');assert.equal(deviceKind('starbucks-tpv-01'),'tpv');assert.equal(deviceKind('starbucks-ipad-01'),'ipad');
 assert.ok(HALO.wall.x>HALO.tpv.x&&HALO.wall.x>HALO.ipad.x);
 for(const spec of Object.values(HALO))assert.ok(spec.gain>0&&spec.gain<1&&spec.blur>0);
});

test('clock, screen ranges and hit testing',()=>{
 assert.equal(clock(0),'0:00');assert.equal(clock(7.9),'0:07');assert.equal(clock(75),'1:15');assert.equal(clock(NaN),'');assert.equal(clock(-1),'');
 assert.equal(screenRange([3,1,2,5]),'1–3, 5');assert.equal(screenRange([4]),'4');assert.equal(screenRange([6,5,2,2,1]),'1–2, 5–6');assert.equal(screenRange([]),'');
 const quad=[{x:10,y:10},{x:110,y:20},{x:100,y:210},{x:5,y:200}];
 assert.equal(pointInQuad({x:60,y:100},quad),true);assert.equal(pointInQuad({x:60,y:100},[...quad].reverse()),true);
 assert.equal(pointInQuad({x:140,y:100},quad),false);assert.equal(pointInQuad({x:60,y:100},[quad[0],null,quad[2],quad[3]]),false);assert.equal(pointInQuad(null,quad),false);
 assert.deepEqual(quadBounds([quad,null,[{x:300,y:0},{x:320,y:0},{x:320,y:50},{x:300,y:50}]]),{left:5,right:320,top:0,bottom:210});
 assert.equal(quadBounds([null]),null);
});

test('a split video lights each screen with its own slice',()=>{
 assert.deepEqual(visibleSlice('100%','0%'),{x:0,width:1});assert.deepEqual(visibleSlice('',''),{x:0,width:1});
 const middle=visibleSlice('300%','-100%');assert.ok(Math.abs(middle.x-1/3)<1e-9&&Math.abs(middle.width-1/3)<1e-9);
 const last=visibleSlice('600%','-500%');assert.ok(Math.abs(last.x+last.width-1)<1e-9);
 assert.ok(visibleSlice('200%','-400%').x<=.5);
});

test('focus frames a screen group across the ±180° seam and keeps a usable field of view',()=>{
 const one=focusTarget([{yaw:10,pitch:20},{yaw:20,pitch:20},{yaw:20,pitch:0},{yaw:10,pitch:0}],16/9);
 assert.equal(one.yaw,15);assert.equal(one.pitch,10);assert.equal(one.fov,38);
 const seam=focusTarget([{yaw:175,pitch:5},{yaw:-175,pitch:5},{yaw:-175,pitch:-5},{yaw:175,pitch:-5}]);
 assert.ok(Math.abs(Math.abs(seam.yaw)-180)<1e-9);assert.equal(seam.pitch,0);assert.equal(seam.fov,30);
 assert.equal(focusTarget([{yaw:0,pitch:60},{yaw:0,pitch:-60}]).fov,75);
 assert.equal(focusTarget([]),null);assert.equal(focusTarget([{yaw:NaN,pitch:0}]),null);
});

test('on-air groups follow shared clocks, physical zones and the playlist order',()=>{
 const groups=onAirGroups({number,playlist,buckets:[
  {playlistId:'tpv',deviceIds:['starbucks-tpv-01'],trackId:'t',index:0,playing:false,preview:false},
  {playlistId:'wall',deviceIds:wall,trackId:'b',index:1,playing:true,preview:false}]});
 assert.deepEqual(groups.map(g=>g.kind),['wall','tpv']);
 const g=groups[0];
 assert.equal(g.label,'Pantallas 1–6');assert.equal(g.state,'live');assert.equal(g.title,'Horchata');assert.equal(g.playlistTitle,'Pared · Starbucks');
 assert.equal(g.index,1);assert.equal(g.total,3);assert.equal(g.next,'El Salvador');assert.equal(g.stock,'#1312');assert.equal(g.leader,wall[0]);
 assert.equal(groups[1].label,'TPV');assert.equal(groups[1].state,'paused');assert.equal(groups[1].next,'');assert.equal(groups[1].stock,'');
 const en=onAirGroups({number,playlist,t:(es,en)=>en,buckets:[{playlistId:'wall',deviceIds:[wall[0]],trackId:'c',index:2,playing:true,loop:false}]})[0];
 assert.equal(en.label,'Screen 1');assert.equal(en.next,'');
 assert.equal(onAirGroups({number,playlist,buckets:[{playlistId:'wall',deviceIds:[wall[0]],trackId:'c',index:2,playing:true}]})[0].next,'Frappuccino');
});

test('previews, images, errors, power-off, overlays and Sincro IA are told apart',()=>{
 const groups=onAirGroups({number,playlist,preview:id=>id===wall[2]?{id:'p',title:'Campaña nueva',num:1500}:null,
  overlay:id=>id===wall[0]?{type:'incident',title:'INC-1'}:id==='starbucks-ipad-01'?{type:'app',title:'Gestor de colas'}:null,off:[wall[5]],
  buckets:[{playlistId:'wall',deviceIds:[wall[0],wall[1]],trackId:'a',index:0,playing:true},
   {playlistId:'__preview',preview:true,deviceIds:[wall[2]],trackId:'p',index:0,playing:true},
   {playlistId:'playlist-mixta',deviceIds:[wall[3],'starbucks-tpv-01'],trackId:'x',index:0,playing:false,error:true},
   {playlistId:'ipad',deviceIds:['starbucks-ipad-01'],trackId:'i',index:0,playing:true}]});
 const by=label=>groups.find(g=>g.label===label);
 assert.equal(by('Pantalla 2').state,'live');assert.deepEqual(by('Pantalla 2').ids,[wall[1]]);
 assert.equal(by('Pantalla 1').state,'incident');assert.equal(by('Pantalla 1').title,'INC-1');assert.equal(by('Pantalla 1').total,0);
 assert.equal(by('Pantalla 3').state,'preview');assert.equal(by('Pantalla 3').title,'Campaña nueva');assert.equal(by('Pantalla 3').stock,'#1500');assert.equal(by('Pantalla 3').playlistTitle,'Vista previa');
 assert.equal(by('Pantalla 4').state,'error');assert.equal(by('TPV').state,'error');assert.notEqual(by('Pantalla 4').key,by('TPV').key);
 assert.equal(by('Pantalla 6').state,'off');assert.equal(by('iPad').state,'app');assert.equal(by('iPad').title,'Gestor de colas');
 assert.equal(new Set(groups.map(g=>g.key)).size,groups.length);
 assert.equal(onAirGroups({number,playlist,buckets:[{playlistId:'ipad',deviceIds:['starbucks-ipad-01'],trackId:'i',index:0,playing:true}]})[0].image,true);
 assert.equal(onAirGroups({number,playlist:()=>({title:'Vacía',tracks:[]}),buckets:[{playlistId:'wall',deviceIds:[wall[0]],index:0,playing:false}]})[0].state,'empty');
 const ia=onAirGroups({number,ia:{ids:wall,playing:true,count:6},overlay:id=>id===wall[0]?{type:'incident',title:'INC-2'}:null});
 assert.deepEqual(ia.map(g=>[g.label,g.state,g.playlistTitle]),[['Pantalla 1','incident','Incidencia abierta'],['Pantallas 2–6','live','Sincro IA']]);
});

test('a card announces content that arrives outside the natural playlist order',()=>{
 const live={state:'live',playlistId:'wall',title:'A',index:0,total:3};
 assert.equal(isArrival(undefined,live),false);assert.equal(isArrival(live,{...live}),false);
 assert.equal(isArrival(live,{...live,title:'B',index:1}),false,'natural advance');
 assert.equal(isArrival({...live,index:2},{...live,title:'A2',index:0}),false,'loop restart');
 assert.equal(isArrival(live,{...live,title:'C',index:2}),true,'jump');
 assert.equal(isArrival(live,{state:'preview',playlistId:'',title:'X',index:-1,total:0}),true,'preview dropped');
 assert.equal(isArrival({state:'preview',playlistId:'',title:'X'},live),true,'schedule restored');
 assert.equal(isArrival(live,{...live,playlistId:'playlist-b',title:'Z'}),true,'new playlist');
 assert.equal(isArrival(live,{...live,state:'paused'}),false);assert.equal(isArrival(live,{...live,state:'incident'}),false);assert.equal(isArrival(live,{...live,state:'off'}),false);
});

test('cards sit by their zone, stay inside the scene and never overlap',()=>{
 const viewport={width:800,height:600},overlap=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
 const placed=placeCards([
  {key:'wall',bounds:{left:100,right:700,top:200,bottom:300},width:240,height:90,prefer:'above'},
  {key:'ipad',bounds:{left:360,right:440,top:320,bottom:370},width:200,height:60},
  {key:'edge',bounds:{left:-40,right:20,top:560,bottom:590},width:200,height:80},
  {key:'hidden',bounds:null,width:200,height:80}],viewport);
 assert.deepEqual(placed.map(p=>p.key),['wall','ipad','edge']);
 assert.equal(placed[0].side,'above');assert.equal(placed[0].y,200-12-90);assert.equal(placed[0].x,280);assert.equal(placed[0].caret,120);
 assert.equal(placed[1].side,'below');assert.equal(placed[2].side,'above');assert.equal(placed[2].x,8);assert.equal(placed[2].caret,14);
 for(const p of placed){assert.ok(p.x>=8&&p.x+p.width<=792);assert.ok(p.y>=8&&p.y+p.height<=592);}
 const stacked=placeCards([1,2,3].map(n=>({key:'k'+n,bounds:{left:300,right:500,top:100,bottom:200},width:220,height:70,prefer:'above'})),viewport);
 for(const [i,a] of stacked.entries())for(const b of stacked.slice(i+1))assert.equal(overlap(a,b),false);
 assert.equal(placeCards([{key:'low',bounds:{left:300,right:500,top:20,bottom:60},width:220,height:70,prefer:'above'}],viewport)[0].side,'below');
});

test('/emision and /onair toggle cards and light only inside Matrix',async()=>{
 assert.deepEqual(parseVisualCommand('/emision'),{onAir:{key:'onAir',value:null}});
 assert.deepEqual(parseVisualCommand('/emisión on'),{onAir:{key:'onAir',value:true}});
 assert.deepEqual(parseVisualCommand('/ONAIR off'),{onAir:{key:'onAir',value:false}});
 assert.deepEqual(parseVisualCommand('/emision luz'),{onAir:{key:'light',value:null}});
 assert.deepEqual(parseVisualCommand('/onair light off'),{onAir:{key:'light',value:false}});
 assert.deepEqual(parseVisualCommand('/emision estado'),{onAir:{status:true}});
 assert.deepEqual(parseVisualCommand('/emision todo'),{onAir:{invalid:true}});
 assert.equal(parseVisualCommand('/emisiones'),null);
 const router={mode:'matrix',choose:async()=>({ok:true})},prefs={light:true,onAir:false},calls=[];
 globalThis.XpaceMatrixOptions={screenLight:{state:()=>({...prefs}),set:value=>{calls.push(value);Object.assign(prefs,value);return {...prefs};}}};
 try{
  const on=await executeVisualCommand('/emision',{router});assert.equal(on.ok,true);assert.deepEqual(on.screenLight,{light:true,onAir:true});assert.match(on.message,/«En emisión» ON · luz de pantallas ON/);
  const dark=await executeVisualCommand('/onair light off',{router,lang:'en'});assert.deepEqual(dark.screenLight,{light:false,onAir:true});assert.match(dark.message,/screen light OFF/);
  const status=await executeVisualCommand('/emision estado',{router});assert.deepEqual(status.screenLight,{light:false,onAir:true});assert.equal(calls.length,2);
  assert.match((await executeVisualCommand('/emision todo',{router})).message,/Uso: \/emision/);
  assert.equal((await executeVisualCommand('/emision',{router:{mode:'better',choose:async()=>({cancelled:true})}})).ok,false);
 }finally{delete globalThis.XpaceMatrixOptions;}
});

test('the Matrix wiring keeps players clipped and survives global canvas rules',()=>{
 const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
 const panorama=read('./matrix-panorama.mjs'),module=read('./screen-light.mjs'),css=read('./screen-light.css'),html=read('../index.html');
 for(const text of ["from './screen-light.mjs?v=","mountScreenLight({surface,layer,nodes,previews,t,","screenLight.place(p.id,matrix||null,pts)","screenLight.anchor('music',marking?null:speakerPoint)","screenLight.dispose();wallAvatar.dispose()","screenLight:{state:()=>screenLight.state(),set:value=>screenLight.set(value)}",'data-screen-light="light"','data-screen-light="onair"'])assert.ok(panorama.includes(text),text);
 assert.match(html,/scripts\/screen-light\.css\?v=/);
 // Halo and cards live outside the player; inside it only the frozen frame and the glass, under incidents and offers.
 assert.match(module,/layer\.before\(haloLayer\)/);assert.match(module,/media\.after\(d\.freeze\)/);assert.match(module,/cardLayer\.dataset\.i18nLive=''/);
 assert.match(css,/\.matrix-halo-layer\{[^}]*pointer-events:none[^}]*mix-blend-mode:screen/);
 assert.match(css,/\.matrix-onair-layer\{[^}]*pointer-events:none/);
 assert.match(css,/\.matrix-mapped-player \.matrix-screen-freeze\{[^}]*z-index:1;[^}]*filter:none/);
 assert.match(css,/::after\{[^}]*z-index:2;pointer-events:none/);
 // index.html styles every <canvas> for the 8-bit view and white label resets its filter: the blur lives on a wrapper.
 assert.match(css,/\.matrix-halo-light canvas\{[^}]*image-rendering:auto/);assert.match(css,/\.matrix-halo-light\{[^}]*filter:blur\(var\(--halo-blur\)\)/);
 assert.match(module,/light=el\('div','matrix-halo-light'\)/);
 assert.doesNotMatch(module,/getImageData|toDataURL|toBlob|fetch\(|localStorage\.|\.src=(?!media\.poster|url)/,'read-only: no pixel reads, network or media changes');
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(module,/prefers-reduced-motion: reduce/);
});
