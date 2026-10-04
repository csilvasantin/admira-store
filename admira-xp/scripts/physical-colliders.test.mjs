import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from './premium-three.mjs';
import {GLTFLoader} from './vendor/GLTFLoader.mjs';
import {physicalColliders,actorCollisionRadius} from './physical-colliders.mjs';
import {CATALOG_COLLISION_BOUNDS} from './catalog-collision-bounds.mjs';
import {createPersonPresentation,personProfile} from './best-person-asset.mjs';
import {VISITOR_PROFILES} from './visitor-profiles.mjs';
import {createLifeScene} from './life-scene.mjs';
import {buildCustomerNavigation} from './customer-navigation.mjs';
import {bindImportedObjects,createImportedBridge} from './imported-space.mjs';
import {groundCafe} from '../../xpacios/cafebreria/grounding.mjs';

async function glb(path){
  const bytes=fs.readFileSync(new URL(path,import.meta.url)),loader=new GLTFLoader();
  loader.register(()=>({name:'CPUTextureStub',loadTexture:()=>Promise.resolve(new T.Texture())}));
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
}
function release(gltf){const resources=new Set();gltf.scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.skeleton)resources.add(o.skeleton);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);for(const t of Object.values(m))if(t?.isTexture)resources.add(t);}});for(const r of resources)r.dispose();}
const near=(a,b)=>Math.abs(a-b)<2e-6;

test('collision envelopes contain every published furniture mesh in all three qualities',async()=>{
  const numbers=JSON.parse(fs.readFileSync(new URL('../../inventario/registry.json',import.meta.url))).numbers;
  for(const [id,number]of Object.entries(numbers))for(const quality of ['good','better','best']){
    const path=number===1?`../../inventario/assets/mostrador/counter-interpreted-${quality}.glb`:`../../inventario/assets/catalog/${String(number).padStart(2,'0')}/${quality}.glb`;
    const source=await glb(path),box=new T.Box3().setFromObject(source.scene),bounds=CATALOG_COLLISION_BOUNDS[id];
    assert.ok(box.min.x>=bounds[0]-2e-6&&box.max.x<=bounds[1]+2e-6&&box.min.z>=bounds[2]-2e-6&&box.max.z<=bounds[3]+2e-6,`${id} ${quality} mesh exceeds its physics envelope`);
    release(source);
  }
});

test('the same Starbucks obstacles cover visible bar, chair and wall geometry in Good, Better and Best',()=>{
  for(const rot of [0,1,2,3])for(const sx of [.75,1,1.5])for(const flipX of [false,true]){
    const layout=globalThis.XpaceStarbucks.layout().map(item=>({...item,rot,sx,flipX}));
    const scene={venue:'alsea-sbux-021',cols:14,rows:8,layout},colliders=physicalColliders(scene);
    for(const quality of ['good','better','best'])for(const fixture of globalThis.XpaceStarbucks.build(layout,{quality})){
      for(const part of fixture.parts.filter(p=>p.h>.03&&p.y+p.h>.02&&p.y<1.9)){
        const p=globalThis.XpaceStarbucks.transformPart(part,fixture.item),box=fixture.item?colliders.find(c=>c.id==='geometry:'+fixture.id):colliders.find(c=>c.minCol<=p.x+1e-6&&c.maxCol>=p.x+p.w-1e-6&&c.minRow<=p.z+1e-6&&c.maxRow>=p.z+p.d-1e-6);
        assert.ok(box,`${quality}: ${fixture.id} has no collision cover`);
        assert.ok(p.x>=box.minCol-1e-6&&p.x+p.w<=box.maxCol+1e-6&&p.z>=box.minRow-1e-6&&p.z+p.d<=box.maxRow+1e-6,`${quality}: ${fixture.id} transformed part escaped`);
      }
    }
  }
  const pastry=physicalColliders({venue:'alsea-sbux-021',layout:globalThis.XpaceStarbucks.layout()}).find(c=>c.id==='geometry:sb-pastry');
  assert.ok(near(pastry.maxRow,4.17));assert.ok(near(pastry.minCol,6.94));
});

test('the body radius encloses real Best skinned vertices over full walking cycles and all visitor profiles',async()=>{
  const sources=new Map();for(const profile of ['male','female','child-male','child-female'])sources.set(profile,await glb(`../assets/people/best-v1/${profile}.glb`));
  for(const profile of VISITOR_PROFILES){
    const actor={id:'reach-'+profile.id,kind:'customer',age:profile.age,gender:profile.gender,walking:true,color:'#334455',visitorProfileId:profile.id,visitorStyle:profile.style};
    const person=createPersonPresentation(sources.get(personProfile(actor)),actor),point=new T.Vector3();
    for(let time=0;time<=1600;time+=32){
      person.animate(time,actor,{position:{x:time/800,y:0,z:0}});person.scene.updateMatrixWorld(true);
      person.scene.traverse(mesh=>{if(!mesh.isMesh||!mesh.visible)return;for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,point);point.applyMatrix4(mesh.matrixWorld);assert.ok(Math.hypot(point.x,point.z)<actorCollisionRadius(actor),`${profile.id} ${time}: animated body escapes its collision radius`);}});
    }
    person.dispose();
  }
  for(const source of sources.values())release(source);
});

test('Unitree, staff and special humans in Better and Best never interpolate across a solid divider',()=>{
  for(const quality of ['better','best'])for(const kind of ['staff','unitreeBot','saca','thief','guardiaCivil','opinador','customer']){
    const actor={id:kind,kind,robot:kind==='unitreeBot',col:2,row:3,scale:1,heading:0,color:'#446688',skin:'#ccaa88'},raw={cols:10,rows:8,layout:[{id:'wall',type:'custom',col:4,row:0,fp:[.2,8]}],actors:[actor]};
    const unchanged=JSON.stringify(raw),model=createLifeScene(raw,{canvasFactory:()=>null,assetQuality:quality}),root=model.actors.children[0];
    model.animate(0);model.update({...raw,actors:[{...actor,col:8,walking:true}]});
    const nav=buildCustomerNavigation(model.snapshot,{radius:actorCollisionRadius(actor),allowOutside:true});let previous={col:root.position.x,row:root.position.z};
    for(let time=16;time<=3000;time+=16){model.animate(time);const pose={col:root.position.x,row:root.position.z};assert.ok(nav.isWalkable(pose));assert.ok(nav.segmentClear(previous,pose));assert.ok(pose.col<4);previous=pose;}
    assert.equal(root.visible,true);assert.equal(root.userData.customerMotion.pose.walking,false);assert.equal(JSON.stringify(raw),unchanged);model.dispose();
  }
});

test('Unitree procedural mesh and swing stay within its physical radius at every heading',()=>{
  const actor={id:'robot-radius',kind:'unitreeBot',robot:true,col:5,row:4,heading:0,walking:true,color:'#bcc8cf',skin:'#bcc8cf'},model=createLifeScene({cols:14,rows:8,layout:[],actors:[actor]},{canvasFactory:()=>null}),root=model.actors.children[0],vertex=new T.Vector3(),instance=new T.Matrix4();
  // Exterior classification here only drives the existing visual gait; every
  // vertex is measured in the actor's own coordinates, with no map shortcut.
  root.userData.customerMotion=null;
  for(const heading of [0,Math.PI/4,Math.PI/2,Math.PI*.75,Math.PI])for(let time=0;time<=1000;time+=32){
    model.animate(time);root.rotation.y=heading;root.updateWorldMatrix(true,true);
    root.traverse(mesh=>{if(!mesh.isMesh)return;for(let index=0;index<(mesh.isInstancedMesh?mesh.count:1);index++){
      const matrix=mesh.matrixWorld.clone();if(mesh.isInstancedMesh){mesh.getMatrixAt(index,instance);matrix.multiply(instance);}
      for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,vertex);vertex.applyMatrix4(matrix);assert.ok(Math.hypot(vertex.x-root.position.x,vertex.z-root.position.z)<actorCollisionRadius(actor),'Unitree mesh escapes its swept body radius');}
    }});
  }
  model.dispose();
});

test('imported floor and overhead beams stay traversable while the actual wall remains a collider',()=>{
  const root=new T.Group(),entries=[];
  for(const [id,w,h,d,x,y,z]of [['glb:suelo',8,.1,8,4,-.05,4],['wall',.2,3,8,4,1.5,4],['lintel',2,.2,.2,2,2.8,2]]){
    const object=new T.Mesh(new T.BoxGeometry(w,h,d));object.position.set(x,y,z);root.add(object);entries.push({id,object,categoria:'Arquitectura',nombre:id});
  }
  const bound=bindImportedObjects(root,entries),storage={getItem:()=>null,setItem:()=>{}},bridge=createImportedBridge({roomId:'cafebreria',cols:8,rows:8,layout:bound.layout,storage});
  const scene=bridge.read();assert.equal(scene.colliders.length,1);assert.equal(scene.colliders[0].id,'architecture:wall');
  assert.equal(scene.layout.find(i=>i.id==='wall').solid,false,'fixed architecture retains its inventory/edit contract');
  const nav=buildCustomerNavigation(scene,{radius:.72});assert.equal(nav.isWalkable({col:4,row:4}),false);assert.equal(nav.route({col:2,row:4},{col:6,row:4}),null);
  bridge.setVisible('wall',false);assert.deepEqual(bridge.read().colliders,scene.colliders,'hiding a structural wall cannot open a ghost passage');bridge.dispose();
});

test('Cafebrería structural colliders enclose the published wall geometry without changing its GLB or inventory',async()=>{
  const source=await glb('../../inventario/cafebreria/scene.glb'),manifest=JSON.parse(fs.readFileSync(new URL('../../inventario/cafebreria/scene.inventory.json',import.meta.url))),original=JSON.stringify(manifest),nodes=new Map();
  source.scene.traverse(node=>{const index=source.parser.associations.get(node)?.nodes;if(index!==undefined)nodes.set(index,node);});
  const grounding=groundCafe(source.scene,nodes,manifest),bound=bindImportedObjects(source.scene,manifest.items.map(entry=>({...entry,object:nodes.get(entry.node)}))),storage={getItem:()=>null,setItem:()=>{}};
  const bridge=createImportedBridge({roomId:'cafebreria',cols:grounding.size.x,rows:grounding.size.z,layout:bound.layout,storage}),scene=bridge.read();
  assert.ok(scene.colliders.length>10,'walls and opening jambs are represented independently of furniture inventory');
  for(const box of scene.colliders){const id=box.id.slice('architecture:'.length),object=bound.bindings.get(id).entry.object,mesh=new T.Box3().setFromObject(object);assert.ok(mesh.min.x>=box.minCol-1e-6&&mesh.max.x<=box.maxCol+1e-6&&mesh.min.z>=box.minRow-1e-6&&mesh.max.z<=box.maxRow+1e-6,`${id} actual wall escapes its collider`);}
  assert.equal(scene.colliders.some(c=>c.id==='architecture:glb:suelo'),false);assert.equal(JSON.stringify(manifest),original);bridge.dispose();release(source);
});

test('hiding furniture keeps its physical overhang occupied until the inventory unit is removed',()=>{
  const item={id:'sb-pastry',type:'vending',col:7,row:3,fp:[6,1],hidden:true},scene={venue:'alsea-sbux-021',cols:14,rows:8,layout:[item]};
  const nav=buildCustomerNavigation({...scene,colliders:physicalColliders(scene)},{radius:.52});
  assert.equal(nav.isWalkable({col:10,row:4.5}),false);assert.equal(nav.isWalkable({col:10,row:5}),true);
  const removed=buildCustomerNavigation({...scene,layout:[],colliders:physicalColliders({...scene,layout:[]})},{radius:.52});assert.equal(removed.isWalkable({col:10,row:4.5}),true);
});

test('the actual Xtanco door and jambs match navigation through every open and closed pose',()=>{
  const raw={cols:14,rows:8,doorRow:3.35,doorHalfWidth:1,layout:[],actors:[]};
  for(const open of [0,.25,.5,.75,1]){
    const model=createLifeScene({...raw,doorOpen:open},{canvasFactory:()=>null}),door=model.scene.getObjectByName('architectural:door');door.updateWorldMatrix(true,true);
    const leaf=door.children[0],box=new T.Box3().setFromObject(leaf),collider=physicalColliders({...raw,doorOpen:open}).find(c=>c.id==='architecture:door-leaf');
    assert.ok(near(box.min.x,collider.minCol)&&near(box.max.x,collider.maxCol)&&near(box.min.z,collider.minRow)&&near(box.max.z,collider.maxRow),`door open=${open} rendered leaf differs from physics`);
    const nav=buildCustomerNavigation(model.snapshot,{radius:.72,allowOutside:true}),from={col:14.9,row:3.3},to={col:12,row:3.3};
    if(open===0)assert.equal(nav.segmentClear(from,to),false,'a closed visible door blocks passage');
    if(open===1)assert.equal(nav.segmentClear(from,to),true,'a physically open door leaves a body-width passage');
    model.dispose();
  }
});
