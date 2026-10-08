import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HIPERREAL_REVISION} from './quality-model.mjs';
import {furnitureURL} from '../admira-xp/scripts/furniture-asset.mjs';

const glb=url=>{const bytes=fs.readFileSync(url);assert.equal(bytes.toString('ascii',0,4),'glTF');return {bytes,doc:JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)))};};
const local=href=>{const u=new URL(href);u.search='';return u;};
const pad=n=>String(n).padStart(2,'0');
const cat=(n,f)=>new URL(`./assets/catalog/${pad(n)}/${f}`,import.meta.url);
const PARTS={4:['barra reposapiés','terminal de lotería','pantalla del terminal','boleto impreso'],6:['varilla retención 0','varilla retención 1','varilla retención 2'],17:['barra reposapiés','potenciómetro izq 0','fader canal 1'],18:['dispensador de tiques','botón de tique','tique','brida del poste']};

test('r23 · hand-made parts on 4, 6, 17, 18: named Hiperreal parts, same inventory IDs, web ≤ 5 MB, no glass in the web LOD',()=>{
 for(const [n,parts] of Object.entries(PARTS).map(([n,p])=>[Number(n),p])){
  assert.equal(HIPERREAL_REVISION[n],2);assert.match(furnitureURL(n,'hiperreal'),/-20261008-2$/);
  const web=glb(local(furnitureURL(n,'hiperreal'))),hd=glb(cat(n,'hiperreal/hiperreal-hd.glb')),best=glb(cat(n,'best.glb'));
  assert.ok(web.bytes.length<=5e6,n+' web ≤ 5 MB');assert.ok(!web.doc.materials.some(m=>m.extensions?.KHR_materials_transmission),n+' web without glass');
  const bestRoot=best.doc.nodes.find(x=>x.extras?.inventoryNumber!==undefined);
  for(const {doc} of [web,hd]){
   const names=new Set(doc.nodes.map(x=>x.name));
   for(const p of parts)assert.ok(names.has('Hiperreal '+p),n+' has '+p);
   for(const node of best.doc.nodes)assert.ok(names.has(node.name),n+' keeps Best node '+node.name);
   if(bestRoot){const root=doc.nodes.find(x=>x.name===bestRoot.name);assert.equal(root.extras.inventoryNumber,bestRoot.extras.inventoryNumber);for(const k of ['inventoryId','assetId'])if(bestRoot.extras[k]!==undefined)assert.equal(root.extras[k],bestRoot.extras[k]);}
  }
  const m=JSON.parse(fs.readFileSync(cat(n,'hiperreal.manifest.json')));for(const p of parts)assert.ok(m.added_parts.includes(p),n+' manifest lists '+p);
 }
});

test('r23 · piece 2 keeps every printed pack label on its front (flat decals are never jittered)',()=>{
 assert.equal(HIPERREAL_REVISION[2],4);
 const web=glb(local(furnitureURL(2,'hiperreal'))).doc;
 const labels=web.nodes.filter(x=>/printed label|front label/i.test(x.name));assert.ok(labels.length>=40,'pack labels exported');
 for(const l of labels)assert.ok(!l.translation&&!l.rotation&&!l.scale,'label '+l.name+' stays where Best prints it');
 const m=JSON.parse(fs.readFileSync(cat(2,'hiperreal.manifest.json')));assert.equal(m.jittered_items,0);
});
