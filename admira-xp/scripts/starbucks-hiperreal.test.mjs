import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './premium-three.mjs';
import './starbucks-room.js';
import {createLifeScene,STARBUCKS_CATALOG_BODY} from './life-scene.mjs';
import {createSceneSnapshot} from './xtanco-scene-snapshot.mjs';
import {cloneTwinFurniture} from './furniture-asset.mjs';
const room=globalThis.XpaceStarbucks,flush=()=>new Promise(r=>setTimeout(r,0));
const snapshot=()=>createSceneSnapshot()({venue:room.id,active:true,iso:{cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:0,oy:0},game:{staff:[],custs:[]},layout:room.layout()});

test('catalog bodies match the first procedural parts of each Best fixture (44 barra 10, 45 caja 43, 46 vitrina all)',()=>{
 const groups=room.build(room.layout(),{quality:'best'}),byId=Object.fromEntries(groups.map(g=>[g.id,g.parts]));
 assert.equal(byId['sb-pastry'].length,185);
 assert.ok(byId['sb-backbar'].slice(0,STARBUCKS_CATALOG_BODY['sb-backbar']).every(p=>!p.device&&!p.round));
 const pos=byId['sb-pos'],body=pos.slice(0,STARBUCKS_CATALOG_BODY['sb-pos']);
 assert.equal(body.filter(p=>p.color==='#745640').length,40);assert.ok(body.every(p=>!p.device));
 assert.equal(pos.slice(STARBUCKS_CATALOG_BODY['sb-pos']).filter(p=>p.device==='pos').length,1,'TPV screen stays procedural and live');
});

test('Best Starbucks scene swaps procedural bodies for catalog models and keeps the live TPV screen',async()=>{
 const asked=[];const loadFurniture=async item=>{asked.push(item.id);const g=new T.Group();g.name='catalog:'+item.id;g.userData.assetQuality='hiperreal';g.add(new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial()));return g;};
 const model=createLifeScene(snapshot(),{assetQuality:'best',canvasFactory:()=>null,loadFurniture});
 await flush();await flush();
 for(const id of ['sb-backbar','sb-pos','sb-pastry','sb-mugs'])assert.ok(asked.includes(id),id+' requested from the catalog');
 for(const id of ['sb-backbar','sb-pos','sb-pastry']){const body=model.scene.getObjectByName('starbucks:'+id);assert.ok(body);assert.equal(body.userData.assetStatus,'ready');assert.ok(body.getObjectByName('catalog:'+id));}
 const equipment=model.scene.getObjectByName('starbucks:sb-pos:equipo');assert.ok(equipment,'POS equipment root');
 let tpv=false;equipment.traverse(o=>{if(o.userData?.surfaceId==='starbucks-tpv-01'||o.userData?.screenTarget==='starbucks-tpv-01')tpv=true;});assert.ok(tpv,'TPV screen kept');
 assert.ok(model.scene.getObjectByName('starbucks:sb-backbar:equipo'),'espresso machines and cups kept');
 assert.equal(model.scene.getObjectByName('starbucks:sb-pastry:equipo'),undefined,'vitrina comes whole from the catalog');
 model.dispose();
});

test('Better keeps the procedural Starbucks fixtures; a failed catalog download keeps the procedural body',async()=>{
 const better=createLifeScene(snapshot(),{assetQuality:'better',canvasFactory:()=>null,loadFurniture:async()=>null});
 assert.equal(better.scene.getObjectByName('starbucks:sb-pos:equipo'),undefined);better.dispose();
 const failing=createLifeScene(snapshot(),{assetQuality:'best',canvasFactory:()=>null,loadFurniture:async()=>{throw Error('offline');}});
 await flush();await flush();const body=failing.scene.getObjectByName('starbucks:sb-backbar');
 assert.equal(body.userData.assetStatus,'fallback');assert.ok(body.children.length>0,'procedural body still visible');failing.dispose();
});

test('twin Best prefers Hiperreal, then Matrix, then Best when a download fails',async()=>{
 const tried=[];const clone=quality=>async(number,tier)=>{tried.push(number+':'+tier);if(tier!==quality)throw Error('404');return new T.Group();};
 let root=await cloneTwinFurniture(44,'best',clone('best'));assert.deepEqual(tried,['44:hiperreal','44:best']);assert.equal(root.userData.assetQuality,'best');
 tried.length=0;root=await cloneTwinFurniture(47,'best',clone('matrix'));assert.deepEqual(tried,['47:hiperreal','47:matrix']);assert.equal(root.userData.assetQuality,'matrix');
 tried.length=0;root=await cloneTwinFurniture(46,'best',clone('hiperreal'));assert.deepEqual(tried,['46:hiperreal']);
 tried.length=0;root=await cloneTwinFurniture(1,'best',clone('best'));assert.deepEqual(tried,['1:best']);
 tried.length=0;root=await cloneTwinFurniture(44,'better',clone('better'));assert.deepEqual(tried,['44:better']);
});

test('/inventario añadir in the Starbucks venue places the catalog model through the shared loader',async()=>{
 const raw=snapshot(),asked=[];raw.layout=[...raw.layout,{id:'inv-50-a',type:'starbucksWaterRack',label:'Botellero',fp:[.44,.46],col:12,row:5,sx:1,sy:1,rot:0}];
 const model=createLifeScene(raw,{assetQuality:'best',canvasFactory:()=>null,loadFurniture:async item=>{asked.push(item.id);const g=new T.Group();g.userData.assetQuality='hiperreal';return g;}});
 await flush();await flush();
 assert.ok(asked.includes('inv-50-a'));const root=model.scene.getObjectByName('furniture:inv-50-a');assert.ok(root);assert.equal(root.userData.assetStatus,'ready');
 model.dispose();
});

test('Better in the Starbucks venue behaves as before: no added catalog items or water rack, only PixerIA extras',async()=>{
 const raw=snapshot();raw.layout=[...raw.layout,{id:'inv-50-b',type:'starbucksWaterRack',label:'Botellero',fp:[.44,.46],col:12,row:5,sx:1,sy:1,rot:0}];
 const asked=[];const model=createLifeScene(raw,{assetQuality:'better',canvasFactory:()=>null,loadFurniture:async item=>{asked.push(item.id);return new T.Group();}});
 await flush();await flush();
 assert.equal(model.scene.getObjectByName('furniture:inv-50-b'),undefined,'added catalog item not drawn in Better');
 assert.equal(model.scene.getObjectByName('furniture:sb-water-rack'),undefined,'water rack not drawn in Better');
 assert.deepEqual(asked.filter(id=>id!=='sb-mugs'),[],'only the photographed mug cabinet uses the loader, as before');model.dispose();
});
