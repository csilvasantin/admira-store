import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {libraryEntry,LIBRARY_ID} from './library-runtime.mjs';
import {selectBooks} from './capsulas.mjs?v=20261003-panels-2';
import {numberedCatalog} from '../model.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),pkg=read('./library.package.json');
test('piece 51 appends an independent wall template without changing the first 50 identities',()=>{
 const registry=read('../registry.json'),catalog=read('../catalog.json'),stock=read('../pixeria-cache.json'),assets=numberedCatalog(catalog.native,stock.items,registry),library=assets.at(-1);
 assert.equal(assets.length,51);assert.equal(library.id,LIBRARY_ID);assert.equal(library.number,51);assert.equal(library.mount,'wall');assert.deepEqual(library.fp,[1.6,.28]);assert.equal(library.wallY,1.15);
 assert.equal(registry.numbers['native:shelves'],2);assert.equal(registry.numbers['native:starbucksWaterRack'],50);
 const scene=fs.readFileSync(new URL('./scene.glb',import.meta.url));assert.equal(createHash('sha256').update(scene).digest('hex'),pkg.source.sceneSha256);assert.equal(pkg.classification,'reusable_visual_template');assert.equal(pkg.physical_stock,undefined);for(const key of ['manufacturer','model','serial','warranty'])assert.equal(pkg[key],'');
});
test('all independent downloads match contract hashes, contain editable parts and exclude café fixtures',()=>{
 for(const tier of ['good','better','best'])for(const ext of ['glb','blend']){
  const file=fs.readFileSync(new URL('../../'+pkg.profiles[tier][ext].url.replace(/^\//,''),import.meta.url));assert.equal(createHash('sha256').update(file).digest('hex'),pkg.profiles[tier][ext].sha256);
  if(ext==='glb'){const g=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12))),names=g.nodes.map(n=>n.name);for(const name of ['estanteria-libros','libros-capsulas','tele-sabias-que','tv-display','library-side-left','library-board-3','library-back'])assert.ok(names.includes(name),name);assert.equal(g.meshes.length,32);assert.equal(g.cameras?.length||0,0);assert.ok(!names.some(n=>/sofa|bar-counter|espresso|floor/i.test(n)));}
 }
 const seed=selectBooks(read('./capsules.seed.json'));assert.ok(seed.length>=6);assert.ok(seed.some(b=>b.libro==='The Science of Storytelling'&&b.autor==='Will Storr'));
});
test('runtime owns one controller per imported identity, ignores other objects and aborts removed instances',()=>{
 const source=fs.readFileSync(new URL('./library-runtime.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','').replaceAll('import.meta.url',"'file:///unused/'");const controls=[],listeners=[];
 const canvas={parentElement:{},addEventListener:(type,fn,options)=>listeners.push({type,fn,options})},scene=new T.Scene(),world=new T.Group();let editing=false;
 const mountCapsulas=({entries,signal})=>{const c={entries,signal,opens:0,setViewer(v){this.viewer=v;},attachUI({on}){on(canvas,'pointerup',()=>this.opens++);},enterDetail(){this.opens++;}};controls.push(c);return c;};
 const context=vm.createContext({T,mountCapsulas,AbortController});vm.runInContext(source,context);const runtime=context.createLibraryRuntime({canvas,scene,viewer:{},isEditing:()=>editing});
 const owner=new T.Group();owner.userData.item={id:'library-a',type:'cafebreriaLibrary'};const asset=new T.Group();asset.userData.cafebreriaLibrary=true;const shelf=new T.Group();shelf.name='estanteria-libros';shelf.userData.shelf={};asset.add(shelf);owner.add(asset);world.add(owner);
 runtime.reconcile(world);runtime.reconcile(world);assert.equal(controls.length,1);assert.equal(controls[0].entries[0].id,'library-a');assert.equal(runtime.select(new T.Group()),false);assert.equal(runtime.select(owner),true);
 editing=true;listeners[0].fn({});assert.equal(controls[0].opens,1);editing=false;listeners[0].fn({});assert.equal(controls[0].opens,2);
 owner.removeFromParent();runtime.reconcile(world);assert.equal(controls[0].signal.aborted,true);runtime.dispose();runtime.reconcile(world);assert.equal(controls.length,1);
});
