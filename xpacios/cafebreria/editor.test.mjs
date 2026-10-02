import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {GLTFLoader} from '../../admira-xp/scripts/vendor/GLTFLoader.mjs';
import {bindImportedObjects} from '../../admira-xp/scripts/imported-space.mjs';
import {validateFurnitureMove} from '../../admira-xp/scripts/distribuit.mjs';
const file=fs.readFileSync(new URL('../../inventario/cafebreria/scene.glb',import.meta.url)),length=file.readUInt32LE(12),json=JSON.parse(file.subarray(20,20+length).toString());delete json.textures;delete json.images;delete json.materials;for(const m of json.meshes)for(const p of m.primitives)delete p.material;
let chunk=Buffer.from(JSON.stringify(json));chunk=Buffer.concat([chunk,Buffer.alloc((4-chunk.length%4)%4,32)]);const bin=file.subarray(20+length),head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(head.length+chunk.length+bin.length,8);head.writeUInt32LE(chunk.length,12);head.writeUInt32LE(0x4e4f534a,16);const packed=Buffer.concat([head,chunk,bin]);const gltf=await new GLTFLoader().parseAsync(packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength),'');const root=gltf.scene,box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());root.position.sub(box.min);root.updateMatrixWorld(true);
const nodes=new Map();root.traverse(n=>{const index=gltf.parser.associations.get(n)?.nodes;if(index!==undefined)nodes.set(index,n);});const manifest=JSON.parse(fs.readFileSync(new URL('../../inventario/cafebreria/scene.inventory.json',import.meta.url)));
const bound=bindImportedObjects(root,manifest.items.map(r=>({...r,object:nodes.get(r.node)}))),scene={layout:bound.layout,cols:size.x,rows:size.z,hardness:{fixed:[]}};
test('every original GLB scene root has a stable ITIL record and pending source records remain honest',()=>{
 const records=manifest.items.filter(r=>Number.isInteger(r.node));
 assert.equal(records.length,82);assert.equal(new Set(records.map(r=>r.node)).size,82);
 assert.deepEqual(records.map(r=>r.node).sort((a,b)=>a-b),json.scenes[0].nodes.slice().sort((a,b)=>a-b));
 assert.equal(manifest.items.length,96);assert.equal(manifest.items.filter(r=>r.sinGeometria).length,13);
 for(const row of manifest.items.filter(r=>r.sinGeometria)){assert.equal(row.medidas,null);assert.equal(row.fabricante,'');assert.equal(row.estado,'pendiente');}
});
test('real chair moves into free space, avoids the adjacent table and architectural base creates no phantom collision',()=>{
 const chair=scene.layout.find(i=>i.id==='silla-1');assert.equal(chair.solid,true);
 assert.equal(scene.layout.find(i=>i.id==='glb-node:794').solid,false);
 assert.equal(validateFurnitureMove(scene,chair.id,{col:chair.col-.25,row:chair.row}).ok,true);
 const blocked=validateFurnitureMove(scene,chair.id,{col:chair.col+.25,row:chair.row});assert.equal(blocked.ok,false);assert.equal(blocked.obstacle,'mesa-1');
 assert.equal(validateFurnitureMove(scene,'glb:suelo',{col:1,row:1}).reason,'fixed');
 const before=new T.Box3().setFromObject(nodes.get(396));
 bound.apply(scene.layout.map(i=>i.id===chair.id?{...i,col:i.col-.25}:i));const after=new T.Box3().setFromObject(nodes.get(396));assert.ok(Math.abs(after.min.x-before.min.x+.25)<1e-6);
 bound.apply(scene.layout);assert.ok(new T.Box3().setFromObject(nodes.get(396)).equals(before));
});
