import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {furnitureBounds} from './furniture-geometry.mjs';
import {furniturePose,sameFurniturePose,validateFurnitureMove as move,validateFurniturePath as path,parseDistribuitCommand,executeDistribuitCommand} from './distribuit.mjs';
import {createDistribuitController} from './distribuit-controller.mjs';
const item={id:'a',type:'plant',col:1,row:2,sx:1,sy:1};
const scene={roomId:'cafe',active:true,cols:10,rows:8,layout:[item,{id:'b',type:'custom',fp:[1,3],col:4,row:1}],hardness:{fixed:[]}};
test('the whole transformed footprint fits; height does not enlarge the floor',()=>{
  const base={...item,type:'counter',col:3,row:2,sx:2,sy:9,rot:1,flipX:true};
  const b=furnitureBounds(base);assert.equal(b.minCol,-1);assert.equal(b.maxCol,3);assert.ok(Math.abs(b.minRow)<1e-9);assert.ok(Math.abs(b.maxRow-2)<1e-9);
  assert.equal(move({...scene,layout:[base]},'a',{col:3,row:2}).reason,'bounds');
  assert.equal(move({...scene,layout:[item]},'a',{col:9,row:7}).ok,true);assert.equal(move(scene,'a',{col:9.25,row:7}).reason,'bounds');
});
test('destination overlap, crossed barriers, fixed cells and corner contact',()=>{
  assert.equal(move(scene,'a',{col:4,row:2}).reason,'occupied');
  assert.equal(move(scene,'a',{col:7,row:2}).reason,'path');
  assert.equal(move(scene,'a',{col:3,row:2}).ok,true);
  assert.equal(move({...scene,hardness:{fixed:['2,2']}},'a',{col:2,row:2}).reason,'occupied');
  assert.equal(move({...scene,layout:[{...item,mount:'wall'}]},'a',{col:2,row:2}).reason,'fixed');
});
test('a routed drag can go around an obstacle and undo along the same path',()=>{
  const points=[{col:1,row:5},{col:7,row:5},{col:7,row:2}];
  assert.equal(path(scene,'a',points).ok,true);
  const moved={...scene,layout:scene.layout.map(i=>i.id==='a'?{...i,...points.at(-1)}:i)};
  assert.equal(path(moved,'a',[...points.slice(0,-1).reverse(),{col:1,row:2}]).ok,true);
  assert.equal(path(scene,'a',[{col:1,row:5},{col:4,row:2}]).reason,'occupied');
  assert.equal(path(scene,'a',[]).ok,false);assert.equal(path(scene,'a',[{col:NaN,row:0}]).ok,false);
});
test('an overlapping legacy item may escape outward, but cannot pass through its neighbour',()=>{
  const old={...scene,layout:[{...item,col:3.5,row:2},scene.layout[1]]};
  assert.equal(move(old,'a',{col:3,row:2}).ok,true);assert.equal(move(old,'a',{col:5,row:2}).reason,'path');
});
test('CLI accepts requested spelling and English alias, and waits for Better readiness',async()=>{
  for(const command of ['/cli distribuit','distribuit','/distribuit','/cli distribute','/cli distribuir','distribuir','/distribuir'])assert.ok(parseDistribuitCommand(command));
  assert.equal(parseDistribuitCommand('/cli distribute nonsense'),null);
  const calls=[];const opened=await executeDistribuitCommand('/cli distribuit',{router:{async choose(mode){calls.push(mode);return {ok:true,mode};}},open:()=>{calls.push('editor');return true;}});
  assert.equal(opened.ok,true);assert.deepEqual(calls,['better','editor']);
  assert.equal((await executeDistribuitCommand('/distribuit',{router:{choose:()=>({ok:false,mode:'good'})},open:()=>assert.fail()})).ok,false);
  await executeDistribuitCommand('/distribuit off',{close:()=>calls.push('close')});assert.equal(calls.at(-1),'close');
});
function harness({saveFails=false}={}){
  let source=structuredClone(scene),ends=0,saves=0;const notices=[];
  const bridge={begin:()=>({}),end:()=>ends++,read:()=>structuredClone(source),async commit(request){
    saves++;if(saveFails)throw Error('storage');assert.equal(path(source,request.id,request.path).ok,true);
    source.layout=source.layout.map(i=>i.id===request.id?{...i,...furniturePose(request)}:i);
  }};
  const controller=createDistribuitController({bridge,onChange:s=>notices.push(s)});
  return {controller,notices,get source(){return source;},get ends(){return ends;},get saves(){return saves;},changeRoom(){source.roomId='other';}};
}
test('preview never mutates the source; a blocked candidate keeps the last valid pose',async()=>{
  const h=harness(),c=h.controller;c.select('a');c.preview({col:2,row:2});c.preview({col:4,row:2});
  assert.equal(h.source.layout[0].col,1);assert.equal(c.decorate(h.source).layout[0].col,2);assert.equal(c.draft.result.reason,'occupied');
  assert.equal(await c.commit(),true);assert.equal(h.source.layout[0].col,2);assert.equal(h.notices.at(-1).notice,'saved');
  assert.equal(await c.undo(),true);assert.equal(h.source.layout[0].col,1);c.dispose();c.dispose();assert.equal(h.ends,1);
});
test('cancel, save failure and room changes preserve the source layout',async()=>{
  const h=harness({saveFails:true}),c=h.controller;c.select('a');c.preview({col:2,row:2});c.cancel();assert.equal(h.saves,0);
  assert.equal(await c.move({col:2,row:2}),false);assert.equal(h.source.layout[0].col,1);assert.equal(h.notices.at(-1).notice,'saveError');
  h.changeRoom();assert.equal(await c.move({col:2,row:2}),false);assert.equal(h.saves,1);assert.equal(h.notices.at(-1).notice,'room');c.dispose();
});
test('busy gestures cannot save or select twice',async()=>{
  const h=harness(),c=h.controller;c.select('a');c.preview({col:2,row:2});const pending=c.commit();
  const duplicate=c.commit();c.select('b');assert.equal(c.selected.id,'a');assert.equal(await duplicate,false);await pending;assert.equal(h.saves,1);c.dispose();
});
test('the real saved-layout bridge revalidates stale edits and rolls storage back',async()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const code=html.slice(html.indexOf('window.__xtancoFurnitureEditor={'),html.indexOf('\nloop();',html.indexOf('window.__xtancoFurnitureEditor={')))
    .replace("await import('./scripts/distribuit.mjs?v=distribuir-3')",'await loadValidator()');
  const storage=new Map([['current','old'],['backup','old'],['schema','old']]);let failed=false;
  const context=vm.createContext({window:{__xtancoVisualState:()=>({active:true,hardness:{blocked:[]}})},G:{},S:{GAME:1,PAUSE:2},state:1,
    ISO:{cols:10,rows:8},FURNITURE_SIZE:{},shopLayout:structuredClone(scene.layout),walkGrid:'old',LAYOUT_SCHEMA_VERSION:'1',
    getLayoutStoragePrefix:()=>scene.roomId,inventoryPresentationLayout:()=>context.shopLayout,cloneLayoutData:structuredClone,getItemMount:()=> 'floor',getFurnitureFootprint:i=>({col:i.col,row:i.row,w:1,d:1}),
    getLayoutSlotKeys:()=>({current:'current',backup:'backup',schema:'schema'}),buildWalkGrid:()=>{context.walkGrid='new';},inventorySpace:()=> 'cafe',
    localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){if(key==='backup'&&!failed){failed=true;throw Error('quota');}storage.set(key,value);},removeItem:key=>storage.delete(key)},loadValidator:()=>({validateFurniturePath:path,furniturePose,sameFurniturePose})});
  vm.runInContext(code,context);const bridge=context.window.__xtancoFurnitureEditor,token=bridge.begin();assert.equal(context.state,2);
  const request={roomId:'cafe',id:'a',from:{col:1,row:2},col:2,row:2,path:[{col:2,row:2}]};
  await assert.rejects(bridge.commit(request),/quota/);assert.equal(context.shopLayout[0].col,1);assert.equal(context.walkGrid,'old');assert.equal(storage.get('current'),'old');
  await bridge.commit(request);assert.equal(context.shopLayout[0].col,2);assert.equal(JSON.parse(storage.get('current'))[0].col,2);
  await assert.rejects(bridge.commit(request),/changed/);
  const origin=furniturePose(context.shopLayout[0]),turned={...origin,rot:1},scaled={...turned,sx:1.5,sy:1.5};
  await bridge.commit({roomId:'cafe',id:'a',from:origin,...scaled,path:[turned,scaled]});
  const saved=JSON.parse(storage.get('current'))[0];assert.equal(saved.rot,1);assert.equal(saved.sx,1.5);assert.equal(saved.sy,1.5);
  await assert.rejects(bridge.commit({roomId:'cafe',id:'a',from:origin,...origin,path:[origin]}),/changed/);
  bridge.end(token);assert.equal(context.state,1);
});

test('the real layout loader preserves quarter-tile positions after reload',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),code=html.slice(html.indexOf('function loadLayout(){'),html.indexOf('function saveLayout(){'));
  const saved=[{...item,col:.25,row:2.75},{...item,id:'mirrored',col:14,row:8,flipX:true}];
  const context=vm.createContext({window:{},console:{log(){},warn(){}},DEFAULT_LAYOUT:[],shopLayout:[],shopStaffPos:null,shopStaffZones:null,LAYOUT_SCHEMA_VERSION:'1',
    getLayoutStoragePrefix:()=> 'cafe',getLayoutSlotKeys:()=>({current:'current',schema:'schema'}),syncLayout0(){},isClusteredFurnitureLayout:()=>false,syncFactoryFurniture:items=>items,
    localStorage:{getItem:key=>key==='current'?JSON.stringify(saved):key==='schema'?'1':null},isBlankXpace:()=>false});
  vm.runInContext(code+';loadLayout();',context);assert.equal(context.shopLayout[0].col,.25);assert.equal(context.shopLayout[0].row,2.75);assert.equal(context.shopLayout[1].col,14);assert.equal(context.shopLayout[1].row,8);
});

test('rotation checks intermediate swept floor bounds even when both endpoints fit',()=>{
 const table={id:'a',type:'custom',fp:[2,1],col:1,row:2,rot:0,sx:1,sy:1},room={...scene,layout:[table]};
 assert.equal(move(room,'a',{col:1,row:2,rot:1}).ok,true);
 const near={...table,col:3,row:6},tight={...room,layout:[near]};
 assert.equal(move(tight,'a',{col:3,row:6,rot:1}).reason,'bounds'); // intermediate corner crosses the far edge
 assert.equal(move(room,'a',{col:1,row:2,rot:.5}).reason,'invalid');
});
test('rotation cannot swing through an obstacle between clear endpoints',()=>{
 const long={id:'a',type:'custom',fp:[3,.2],col:4,row:2,rot:0},obstacle={id:'b',type:'custom',fp:[.1,.1],col:5.7,row:3.7};
 const room={...scene,layout:[long,obstacle]};
 assert.equal(move(room,'a',{rot:1}).reason,'path');
 assert.equal(move({...room,layout:[long,{...obstacle,col:6.8,row:4.8}]},'a',{rot:1}).ok,true);
 const at90={...room,layout:[{...long,rot:1},obstacle]};assert.equal(move(at90,'a',{rot:0}).reason,'path');
});
test('proportional scaling checks the enlarged footprint, fixed hardness and limits',()=>{
 assert.equal(move(scene,'a',{sx:2,sy:2}).ok,true);
 assert.equal(move({...scene,layout:[{...item,col:1.25},scene.layout[1]]},'a',{sx:3,sy:3}).reason,'occupied');
 assert.equal(move(scene,'a',{sx:.1,sy:.1}).reason,'scale');assert.equal(move(scene,'a',{sx:4,sy:4}).reason,'scale');
 assert.equal(move(scene,'a',{sx:NaN}).reason,'invalid');assert.equal(move(scene,'a',{sy:0}).reason,'invalid');
 assert.equal(move({...scene,hardness:{fixed:['2,2']}},'a',{sx:1.5,sy:1.5}).reason,'occupied');
 const small={...scene,layout:[{...item,col:9,row:7}]};assert.equal(move(small,'a',{sx:1.1,sy:1.1}).reason,'bounds');
 assert.equal(move(scene,'a',{col:2,rot:1}).reason,'invalid');
});
test('full poses persist and undo scale, rotate, then move without losing proportions',async()=>{
 const h=harness(),c=h.controller;c.select('a');
 assert.equal(await c.move({sx:1.5,sy:1.5}),true);assert.equal(h.source.layout[0].sx,1.5);
 assert.equal(await c.move({rot:1}),false); // original anchor is too close to the edge at this size
 assert.equal(await c.move({col:2,row:2}),true);assert.equal(h.source.layout[0].sx,1.5);
 assert.equal(await c.move({rot:1}),true);assert.equal(h.source.layout[0].rot,1);
 assert.equal(await c.undo(),true);assert.equal(h.source.layout[0].rot,0);
 assert.equal(await c.undo(),true);assert.equal(h.source.layout[0].col,1);
 assert.equal(await c.undo(),true);assert.equal(h.source.layout[0].sx,1);assert.equal(h.source.layout[0].sy,1);c.dispose();
});
test('the main walk grid matches transformed floor bounds after rotation, scale and mirroring',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const code=html.slice(html.indexOf('function getFurnitureFootprint(item){'),html.indexOf('// Check if a tile is blocked'));
 const context=vm.createContext({FURNITURE_SIZE:{counter:[1,2]}});vm.runInContext(code,context);
 for(const rot of [0,1,2,3])for(const flipX of [false,true])for(const sx of [.25,1,1.5,3]){
  const i={id:'x',type:'counter',col:4.25,row:4.5,rot,flipX,sx,sy:7},b=furnitureBounds(i),fp=context.getFurnitureFootprint(i);
  assert.equal(fp.col,Math.floor(b.minCol+1e-7));assert.equal(fp.row,Math.floor(b.minRow+1e-7));
  assert.equal(fp.col+fp.w,Math.ceil(b.maxCol-1e-7));assert.equal(fp.row+fp.d,Math.ceil(b.maxRow-1e-7));
 }
});
