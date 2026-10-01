import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {planFurnitureObjectChange as plan,findFurniturePlacement,validateFurniturePlacement,sameFurnitureObject} from './distribuit-objects.mjs';
import {validateFurniturePath,furniturePose,sameFurniturePose,validateFurnitureMove} from './distribuit.mjs';
import {createDistribuitController} from './distribuit-controller.mjs';
import {pixeriaFurnitureAsset,fitPixeriaModel} from './pixeria-furniture.mjs';
import {Group,Mesh,BoxGeometry,MeshBasicMaterial,Box3} from './premium-three.mjs';
import {createLifeSnapshot} from './life-snapshot.mjs';
import {createLifeScene} from './life-scene.mjs';
const piece={id:'a',type:'plant',col:1.25,row:2.5,rot:0,sx:1,sy:1,label:'Planta'};
function state(){return {scene:{active:true,roomId:'test',cols:8,rows:6,layout:[structuredClone(piece)],hardness:{fixed:[]}},layout:[structuredClone(piece)],ledger:{removed:{},added:{},undo:null},visibility:{}};}
function apply(s,request){const change=plan(s,request);Object.assign(s,change);s.scene.layout=structuredClone(s.layout);return change.receipt;}
test('a user lock blocks every transform; undo restores the prior lock and ledger',()=>{
 const s=state(),receipt=apply(s,{action:'lock',id:'a',from:piece,locked:true});
 for(const pose of [{col:2.25},{rot:1},{sx:1.2,sy:1.2}])assert.equal(validateFurnitureMove(s.scene,'a',pose).reason,'fixed');
 assert.equal(s.ledger.added.a.locked,true);apply(s,{action:'undo',change:receipt});
 assert.equal(s.layout[0].locked,undefined);assert.equal(s.ledger.added.a,undefined);assert.equal(validateFurnitureMove(s.scene,'a',{col:2.25}).ok,true);
});
test('delete removes exactly one locked instance and restores its full pose without affecting another',()=>{
 const s=state();s.layout.push({...piece,id:'b',col:4});s.scene.layout=structuredClone(s.layout);
 const receipt=apply(s,{action:'remove',id:'a',from:piece});
 assert.deepEqual(s.layout.map(i=>i.id),['b']);assert.deepEqual(s.ledger.removed.a,piece);
 apply(s,{action:'undo',change:receipt});assert.deepEqual(s.layout[0],piece);assert.equal(s.layout[1].id,'b');assert.equal(s.ledger.removed.a,undefined);
});
test('undo of deletion rejects an occupied original footprint and keeps its history',()=>{
 const s=state(),receipt=apply(s,{action:'remove',id:'a',from:piece});
 s.layout.push({...piece,id:'new'});s.scene.layout=structuredClone(s.layout);
 assert.throws(()=>apply(s,{action:'undo',change:receipt}),/occupied/);assert.equal(s.layout.length,1);assert.ok(s.ledger.removed.a);
});
test('stale object and tombstone edits are never overwritten; unrelated ledger changes are retained',()=>{
 const s=state();assert.throws(()=>plan(s,{action:'remove',id:'a',from:{...piece,col:2}}),/changed/);
 const receipt=apply(s,{action:'remove',id:'a',from:piece});s.ledger.removed.other={id:'other'};
 apply(s,{action:'undo',change:receipt});assert.ok(s.ledger.removed.other);
 const again=apply(s,{action:'remove',id:'a',from:piece});s.ledger.removed.a.col=7;
 assert.throws(()=>plan(s,{action:'undo',change:again}),/changed/);
});
test('structural elements remain fixed; mounting alone does not prevent reversible deletion',()=>{
 const s=state();s.scene.layout[0].nativeFixed=true;
 for(const action of ['lock','remove'])assert.throws(()=>plan(s,{action,id:'a',from:s.scene.layout[0],locked:true}),/structural/);
 s.scene.layout[0].nativeFixed=false;s.scene.layout[0].mount='wall';
 assert.ok(plan(s,{action:'remove',id:'a',from:s.scene.layout[0]}).receipt);
});
test('adding searches whole transformed footprints and fixed hardness; a full room rejects insertion',()=>{
 const s=state(),item={id:'new',type:'custom',fp:[2,1],col:0,row:0,sx:1.5,sy:1.5,rot:1};
 s.scene.hardness.fixed=['3,2','4,2'];const receipt=apply(s,{action:'add',item});
 assert.equal(validateFurniturePlacement({...s.scene,layout:s.scene.layout.filter(i=>i.id!=='new')},receipt.after).ok,true);
 assert.ok(s.ledger.added.new);apply(s,{action:'undo',change:receipt});assert.equal(s.layout.length,1);assert.equal(s.ledger.added.new,undefined);
 const full={...s.scene,cols:2,rows:2,layout:[{id:'wall',type:'custom',fp:[2,2],col:0,row:0}]};
 assert.equal(findFurniturePlacement(full,{...item,fp:[1,1],sx:1,rot:0}),null);
 assert.throws(()=>plan({...state(),scene:full},{action:'add',item}),/noSpace/);
});
test('object undo compares complete stored content and preserves invisible furniture',()=>{
 assert.equal(sameFurnitureObject(piece,{...piece,mount:'floor',nativeFixed:false,locked:false}),true);
 assert.equal(sameFurnitureObject(piece,{...piece,label:'Changed'}),false);
 const s=state();s.layout.push({...piece,id:'hidden',col:6});s.visibility.hidden={visible:false};
 const r=apply(s,{action:'lock',id:'a',from:piece,locked:true});assert.equal(s.layout.length,2);
 apply(s,{action:'undo',change:r});assert.equal(s.visibility.hidden.visible,false);assert.equal(s.layout.length,2);
});
test('catalog normalization distinguishes GLB and raster previews and rejects unsupported sources',()=>{
 const base={id:'abc-123',type:'furni',url:'https://api.admira.store/stock/asset/abc-123',mime:'model/gltf-binary',poster:'https://api.admira.store/stock/poster/abc-123',prompt:'{"dimensionsCm":[50,75,150]}'};
 const asset=pixeriaFurnitureAsset(base);assert.equal(asset.modelUrl,base.url);assert.equal(asset.img,base.poster);assert.deepEqual(asset.fp,[.5,.75]);
 assert.equal(pixeriaFurnitureAsset({...base,mime:'image/png'}).modelUrl,null);
 for(const value of [{...base,url:'javascript:alert(1)'},{...base,url:'https://example.com/model.glb'},{...base,url:base.url+'-other'},{...base,type:'video'},{...base,mime:'text/html'}])assert.equal(pixeriaFurnitureAsset(value),null);
 assert.equal(pixeriaFurnitureAsset({...base,poster:'https://example.com/img.png'}).img,null);
 assert.deepEqual(pixeriaFurnitureAsset({...base,fp:[NaN,-1],prompt:'bad'}).fp,[1,1]);
});
test('real models fit the declared floor footprint, retain proportions and sit on the floor',()=>{
 const root=new Group(),mesh=new Mesh(new BoxGeometry(200,400,100),new MeshBasicMaterial());root.position.set(40,30,-70);root.scale.setScalar(2);mesh.position.set(-90,400,70);root.add(mesh);
 const fitted=fitPixeriaModel(root,[1,.75]),box=new Box3().setFromObject(fitted),size=box.getSize(new Group().position);
 assert.ok(Math.abs(box.min.y)<1e-9);assert.ok(box.min.x>=-1e-9&&box.max.x<=1+1e-9);assert.ok(box.min.z>=-1e-9&&box.max.z<=.75+1e-9);assert.equal(size.y/size.x,2);
 assert.throws(()=>fitPixeriaModel(new Group(),[1,1]),/asset/);
});
test('PixerIA identity and model URL survive the live adapter, render in Starbucks, and release scene-owned resources',async()=>{
 const item={...piece,id:'pixeria-test',type:'custom',source:'PixerIA',sourceAssetId:'asset-123',img:'https://api.admira.store/stock/poster/asset-123',modelUrl:'https://api.admira.store/stock/asset/asset-123',fp:[.5,.5]};
 const snapshot=createLifeSnapshot()({active:true,venue:'alsea-sbux-021',iso:{cols:14,rows:8,ox:0,oy:0,tileW:64,tileH:32,wallH:120},game:{staff:[],custs:[],passersby:[]},layout:[item]});
 assert.equal(snapshot.layout[0].source,'PixerIA');assert.equal(snapshot.layout[0].modelUrl,item.modelUrl);assert.equal(snapshot.layout[0].sourceAssetId,'asset-123');
 let loads=0,released=0;const geometry=new BoxGeometry(.5,1,.5),material=new MeshBasicMaterial();geometry.addEventListener('dispose',()=>released++);
 const model=createLifeScene(snapshot,{canvasFactory:()=>null,loadFurniture:actual=>{loads++;assert.equal(actual.modelUrl,item.modelUrl);const group=new Group();group.userData.pixeria=true;group.add(new Mesh(geometry,material));return group;}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loads,1);assert.equal(model.scene.getObjectByName('furniture:pixeria-test').userData.assetStatus,'ready');model.dispose();assert.equal(released,1);
});
test('controller history undoes locks, deletes and imports in order and rejects double submits',async()=>{
 const s=state(),notices=[];
 const bridge={begin:()=>({}),end(){},read:()=>structuredClone(s.scene),async mutate(r){return apply(s,r);},async importItem(){return apply(s,{action:'add',item:{...piece,id:'imported',source:'PixerIA'}});},async catalog(){return [{assetId:'demo'}];}};
 const c=createDistribuitController({bridge,onChange:x=>notices.push(x)});c.select('a');
 const pending=c.setLocked(true);assert.equal(await c.remove(),false);await pending;assert.equal(c.movable,false);
 assert.equal(await c.remove(),true);assert.equal(c.selected,null);assert.equal(await c.undo(),true);assert.equal(c.selected.locked,true);
 assert.equal(await c.undo(),true);assert.equal(c.movable,true);
 assert.equal(await c.add('demo'),true);assert.equal(c.selected.id,'imported');assert.equal(await c.undo(),true);assert.equal(c.selected,null);assert.equal(s.layout.length,1);
 s.scene.roomId='other';assert.equal(await c.catalog(),null);assert.equal(notices.at(-1).notice,'room');c.dispose();
});
test('closing the editor cancels a pending import and discards a late catalog result',async()=>{
 const s=state();let release,request,saves=0;
 const bridge={begin:()=>({}),end(){},read:()=>s.scene,async importItem(r){request=r;await new Promise(resolve=>release=resolve);if(r.signal.aborted)throw Error('cancelled');saves++;return {};},async catalog(){await new Promise(resolve=>release=resolve);return [{assetId:'demo'}];}};
 const c=createDistribuitController({bridge});const pending=c.add('demo');c.dispose();assert.equal(request.signal.aborted,true);release();assert.equal(await pending,false);assert.equal(saves,0);
 const next=createDistribuitController({bridge}),catalog=next.catalog();next.dispose();release();assert.equal(await catalog,null);
});
test('the real bridge rolls layout, tombstones, visibility and walk grid back atomically',async()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const code=html.slice(html.indexOf('window.__xtancoFurnitureEditor={'),html.indexOf('\nloop();',html.indexOf('window.__xtancoFurnitureEditor={'))).replace("await import('./scripts/distribuit.mjs?v=distribuir-3')",'await validators()').replace("await import('./scripts/distribuit-objects.mjs?v=distribuir-3')",'await objects()');
 const values=new Map([['current','old'],['backup','old'],['schema','old']]);let failure=true;
 const root={localStorage:{getItem:k=>values.get(k)??null,setItem(k,v){if(k==='backup'&&failure){failure=false;throw Error('quota');}values.set(k,v);},removeItem:k=>values.delete(k)},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(new URL('../../inventario/store.js',import.meta.url),'utf8'),{window:root});
 const c=vm.createContext({window:{...root,__xtancoVisualState:()=>({active:true,hardness:{blocked:[]}})},G:{},S:{GAME:1,PAUSE:2},state:1,ISO:{cols:8,rows:6},FURNITURE_SIZE:{},shopLayout:[structuredClone(piece)],walkGrid:'old',LAYOUT_SCHEMA_VERSION:'1',cloneLayoutData:structuredClone,getLayoutStoragePrefix:()=> 'test',getItemMount:()=> 'floor',getFurnitureFootprint:i=>({col:i.col,row:i.row,w:1,d:1}),getLayoutSlotKeys:()=>({current:'current',backup:'backup',schema:'schema'}),inventorySpace:()=> 'test',localStorage:root.localStorage,validators:()=>({validateFurniturePath,furniturePose,sameFurniturePose}),objects:()=>({planFurnitureObjectChange:plan}),buildWalkGrid:()=>{c.shopLayout=root.XpaceInventory.retained('test',c.shopLayout);c.walkGrid='new';},inventoryPresentationLayout:()=>root.XpaceInventory.filter('test',c.shopLayout),console});
 vm.runInContext(code,c);const bridge=c.window.__xtancoFurnitureEditor;
 root.XpaceInventory.writeVisibility('test',{a:{visible:false}});assert.equal(bridge.read().layout[0].inventoryHidden,true);
 const request={roomId:'test',id:'a',from:bridge.read().layout[0],action:'remove'};
 await assert.rejects(bridge.mutate(request),/quota/);assert.equal(c.shopLayout.length,1);assert.equal(c.walkGrid,'old');assert.equal(values.get('current'),'old');assert.equal(Object.keys(root.XpaceInventory.removals('test').removed).length,0);
 const receipt=await bridge.mutate(request);assert.equal(c.shopLayout.length,0);
 // A factory reload cannot resurrect a deleted object.
 assert.equal(root.XpaceInventory.retained('test',[piece]).length,0);
 await bridge.mutate({roomId:'test',action:'undo',change:receipt});assert.equal(c.shopLayout[0].col,1.25);
 await bridge.mutate({roomId:'test',id:'a',from:bridge.read().layout[0],action:'lock',locked:true});
 assert.equal(JSON.parse(values.get('current'))[0].locked,true);assert.equal(root.XpaceInventory.retained('test',[])[0].locked,true);
 await assert.rejects(bridge.commit({roomId:'test',id:'a',from:piece,col:2,row:2,path:[{col:2,row:2}]}),/fixed/);
 const lifetime=new AbortController();lifetime.abort();await assert.rejects(bridge.mutate({roomId:'test',id:'a',from:bridge.read().layout[0],action:'remove',signal:lifetime.signal}),/cancelled/);assert.equal(c.shopLayout.length,1);
});
