import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './premium-three.mjs';
import {bindImportedObjects,createImportedBridge} from './imported-space.mjs';
import {createDistribuitController} from './distribuit-controller.mjs';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};};
test('imported objects retain geometry, transform around a footprint corner and restore independently',()=>{
 const root=new T.Group();root.position.set(2,0,3);const a=new T.Mesh(new T.BoxGeometry(1,1,1));a.position.set(2,.5,2);root.add(a);root.updateMatrixWorld(true);
 const before=new T.Box3().setFromObject(a),bound=bindImportedObjects(root,[{id:'table',nombre:'Table',object:a}]);
 const unchanged=new T.Box3().setFromObject(a);assert.ok(before.equals(unchanged));assert.equal(bound.layout[0].col,3.5);
 bound.apply([{...bound.layout[0],col:5,row:6,rot:1,sx:2,sy:1}]);const moved=new T.Box3().setFromObject(a);assert.ok(Math.abs(moved.min.x-3)<1e-6);assert.ok(Math.abs(moved.min.z-6)<1e-6);
 bound.apply([]);assert.equal(bound.bindings.get('table').group.visible,false);
 bound.apply(bound.layout);assert.ok(new T.Box3().setFromObject(a).equals(before));
});
test('common controller persists move, rotate, scale, lock, remove and guarded undo for an imported scene',async()=>{
 const storage=memory(),layout=[{id:'chair',type:'custom',col:2,row:2,fp:[.5,.5],rot:0,sx:1,sy:1},{id:'wall',type:'custom',col:0,row:0,fp:[6,.1],solid:false,locked:true,nativeFixed:true}];
 const bridge=createImportedBridge({roomId:'cafe',cols:6,rows:6,layout,storage});const editor=createDistribuitController({bridge});editor.select('chair');
 assert.equal(await editor.move({col:2.25,row:2}),true);assert.equal(bridge.read().layout[0].col,2.25);
 assert.equal(await editor.move({rot:1}),true);assert.equal(await editor.move({sx:1.2,sy:1.2}),true);
 assert.equal(await editor.setLocked(true),true);assert.equal(await editor.move({col:3}),false);assert.equal(await editor.undo(),true);
 assert.equal(await editor.remove(),true);assert.equal(bridge.read().layout.length,1);assert.equal(await editor.undo(),true);
 assert.equal(await editor.undo(),true);assert.equal(await editor.undo(),true);assert.equal(await editor.undo(),true);assert.equal(bridge.read().layout[0].col,2);
 bridge.editRecord('chair',{fabricante:'Unknown',nombre:'Chair',unsafe:'ignored'});assert.equal(bridge.records.chair.unsafe,undefined);
 const reloaded=createImportedBridge({roomId:'cafe',cols:6,rows:6,layout,storage});assert.equal(reloaded.records.chair.fabricante,'Unknown');
 editor.dispose();bridge.dispose();
});
test('failed persistence, stale edits and physical obstacles retain the previous imported pose',async()=>{
 const layout=[{id:'a',type:'custom',col:1,row:1,fp:[1,1]},{id:'b',type:'custom',col:3,row:1,fp:[1,1]}];
 const bridge=createImportedBridge({roomId:'cafe',cols:6,rows:6,layout,storage:{getItem:()=>null,setItem:()=>{throw Error('quota');}}});const editor=createDistribuitController({bridge});editor.select('a');
 assert.equal(await editor.move({col:3}),false);assert.equal(await editor.move({row:1.25}),false);assert.equal(bridge.read().layout[0].row,1);editor.dispose();
});
test('PixerIA uses the shared import and undo flow and never saves undecodable furniture',async()=>{
 const storage=memory(),layout=[],assets=[{assetId:'demo',label:'Demo',fp:[.5,.5],source:'PixerIA'}];let imports=0,releases=0;
 const bridge=createImportedBridge({roomId:'cafe',cols:4,rows:4,layout,storage,catalogProvider:async()=>assets,prepareAsset:async()=>({decoded:true}),releaseAsset:()=>releases++,onImport:()=>imports++});
 const editor=createDistribuitController({bridge});assert.equal((await editor.catalog()).length,1);assert.equal(await editor.add('demo'),true);assert.equal(imports,1);assert.equal(bridge.read().layout.length,1);assert.equal(await editor.undo(),true);assert.equal(bridge.read().layout.length,0);assert.equal(releases,0);
 const broken=createImportedBridge({roomId:'cafe2',cols:4,rows:4,layout,storage,catalogProvider:async()=>assets,prepareAsset:async()=>{throw Error('asset');}});
 await assert.rejects(broken.importItem({roomId:'cafe2',assetId:'demo'}));assert.equal(broken.read().layout.length,0);editor.dispose();
});
