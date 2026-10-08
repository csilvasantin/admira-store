import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coffeeCollectionURL} from './coffee-collection.mjs';
import {createLifeScene} from '../admira-xp/scripts/life-scene.mjs';
import * as T from '../admira-xp/scripts/premium-three.mjs';
import '../admira-xp/scripts/starbucks-room.js';
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('collection link preserves origin and explicit display context without forwarding secrets',()=>{
 const u=coffeeCollectionURL('https://www.admira.store/inventario/?lang=en&marca=starbucks&project=starbucks&token=secret');
 assert.equal(u.origin,'https://www.admira.store');assert.equal(u.pathname,'/inventario/assets/catalog/47/collection/preview/');assert.equal(u.searchParams.get('lang'),'en');assert.equal(u.searchParams.get('project'),'starbucks');assert.equal(u.searchParams.has('token'),false);
});
test('Starbucks cabinet loads its registered GLB with pose and identity retained',async()=>{
 const item={...globalThis.XpaceStarbucks.layout().find(x=>x.id==='sb-mugs'),rot:1,sx:1.2,sy:.9},requests=[],asset=new T.Group();
 const model=createLifeScene({venue:'alsea-sbux-021',cols:14,rows:8,layout:[item]},{canvasFactory:()=>null,loadFurniture:async input=>{requests.push(input.id);return asset;}});
 const root=model.scene.getObjectByName('starbucks:sb-mugs');assert.ok(root);const pose=[...root.position,...root.scale,root.rotation.y];await flush();assert.deepEqual(requests,['sb-mugs']);assert.equal(root.userData.assetStatus,'ready');assert.equal(root.children[0],asset);assert.deepEqual([...root.position,...root.scale,root.rotation.y],pose);assert.equal(root.userData.item.id,'sb-mugs');model.dispose();
});
test('late cabinet response cannot reinsert removed fixture and failed loads keep fallback',async()=>{
 let finish;const item=globalThis.XpaceStarbucks.layout().find(x=>x.id==='sb-mugs'),asset=new T.Group();const snapshot={venue:'alsea-sbux-021',cols:14,rows:8,layout:[item]};
 const model=createLifeScene(snapshot,{canvasFactory:()=>null,loadFurniture:()=>new Promise(r=>finish=r)});await flush();model.update({...snapshot,layout:[]});finish(asset);await flush();assert.equal(asset.parent,null);assert.equal(model.scene.getObjectByName('starbucks:sb-mugs'),undefined);model.dispose();
 const fallback=createLifeScene(snapshot,{canvasFactory:()=>null,loadFurniture:async()=>{throw Error('missing');}});await flush();const root=fallback.scene.getObjectByName('starbucks:sb-mugs');assert.equal(root.userData.assetStatus,'fallback');assert.ok(root.children.length);fallback.dispose();
});
test('catalogue, venue record and ITIL detail expose the separated collection link',()=>{for(const file of ['app.mjs','starbucks/app.mjs','workspace.mjs']){const text=readFileSync(new URL(file,import.meta.url),'utf8');assert.match(text,/coffeeCollectionURL/);assert.match(text,/data(?:set)?\.coffeeCollection|data-coffee-collection/);}});
