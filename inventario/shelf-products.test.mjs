import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../admira-xp/scripts/premium-three.mjs';
import {validateShelfParts,numericPartForHit,partForHit,partGeometry,createPartHighlight} from '../admira-xp/scripts/shelf-parts.mjs';
import {BINDINGS_KEY,PREVIEW_CHANNEL,validContent,loadBindings,saveBinding,removeBinding,sendPreview} from './product-bindings.mjs';

function partsFixture(){
 const products=Array.from({length:45},(_,i)=>({id:`product-${Math.floor(i/9)}-${i%9}`,product_id:`product-${Math.floor(i/9)}-${i%9}`,numeric_id:i+1,kind:'product',product_reference:`A02-0${i%6+1}`,product_name:`Producto ${i%6+1}`,shelf_index:Math.floor(i/9),slot_index:i%9,package_kind:'carton',label:{es:`Producto ${i%6+1}`,en:`Product ${i%6+1}`}}));
 const structureIds=[...Array.from({length:12},(_,i)=>101+i),...Array.from({length:5},(_,i)=>201+i),...Array.from({length:5},(_,i)=>211+i)];
 const structure=structureIds.map((numeric_id,i)=>({id:`structure-${i}`,numeric_id,kind:'structure',label:{es:`Estructura ${i}`,en:`Structure ${i}`}}));
 return {schema_version:1,inventory_id:'native:shelves',inventory_number:2,number:2,quality:'best',revision:'shelves-parts-20261002-3',attribute:'_XP_PART',parts:[...products,...structure]};
}
function geometryFixture({indexed=true}={}){
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,2,0,0,3,0,0,2,1,0],3));
 geometry.setAttribute('_xp_part',new T.Float32BufferAttribute([1,1,1,2,2,2],1));
 if(indexed)geometry.setIndex([0,1,2,3,4,5,0,1,3]);
 return geometry;
}
function memoryStorage(initial={}){
 const values=new Map(Object.entries(initial)),writes=[];
 return {values,writes,getItem:key=>values.get(key)??null,setItem(key,value){writes.push({key,value});values.set(key,String(value));}};
}
const content=(overrides={})=>({kind:'image',url:'https://media.example/cafe.png',title:'Café',...overrides});

test('generated Best map is accepted by the browser and gives each package label and rail card the same owner',async()=>{
 const actual=JSON.parse(await readFile(new URL('./assets/catalog/02/best.parts.json',import.meta.url),'utf8'));
 validateShelfParts(actual);assert.equal(actual.parts.length,67);assert.equal(actual.attribute,'_XP_PART');
 for(const product of actual.parts.filter(p=>p.kind==='product')){
  assert.deepEqual(new Set(product.labels.map(label=>label.role)),new Set(['package','rail']));
  for(const label of product.labels){assert.equal(label.product_id,product.id);assert.equal(label.numeric_id,product.numeric_id);}
 }
});

test('Best shelf map retains 67 components, 45 separate container identities and six shared product references',()=>{
 const fixture=partsFixture();assert.equal(validateShelfParts(fixture),fixture);
 assert.equal(fixture.parts.length,67);assert.equal(new Set(fixture.parts.filter(p=>p.kind==='product').map(p=>p.product_reference)).size,6);
 for(const mutate of [d=>{d.inventory_id='native:counter';},d=>{d.schema_version=2;},d=>{d.parts[1].id=d.parts[0].id;},d=>{d.parts[1].numeric_id=d.parts[0].numeric_id;},d=>{d.parts[0].numeric_id=1.5;},d=>{d.parts.pop();d.parts.shift();}]){
  const invalid=structuredClone(fixture);mutate(invalid);assert.throws(()=>validateShelfParts(invalid));
 }
});

test('map rejects the wrong model revision, profile or product linkage rather than displaying a stale product card',()=>{
 for(const mutate of [d=>{d.inventory_number=47;},d=>{d.number=47;},d=>{d.quality='better';},d=>{d.revision='shelves-labels-20261002-2';},d=>{delete d.parts[0].product_reference;},d=>{d.parts[0].product_reference='A02-99';},d=>{d.parts[0].shelf_index=5;},d=>{d.parts[0].slot_index=-1;},d=>{d.parts[1].slot_index=d.parts[0].slot_index;},d=>{for(const part of d.parts.filter(p=>p.kind==='product'))part.product_reference='A02-01';}]){
  const invalid=partsFixture();mutate(invalid);assert.throws(()=>validateShelfParts(invalid));
 }
});

test('raycast reads a component only when all three hit vertices agree; mixed triangles cannot select a neighbouring product',()=>{
 const geometry=geometryFixture(),mesh=new T.Mesh(geometry,new T.MeshBasicMaterial());mesh.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(.2,.2,1),new T.Vector3(0,0,-1)),hit=ray.intersectObject(mesh)[0];
 assert.ok(hit);assert.equal(numericPartForHit(hit),1);assert.equal(partForHit(partsFixture(),hit).id,'product-0-0');
 const second=new T.Raycaster(new T.Vector3(2.2,.2,1),new T.Vector3(0,0,-1)).intersectObject(mesh)[0];assert.equal(numericPartForHit(second),2);
 assert.equal(numericPartForHit({object:mesh,face:{a:0,b:1,c:3}}),null);
 assert.equal(numericPartForHit({object:mesh}),null);assert.equal(numericPartForHit({object:{geometry:new T.BufferGeometry()},face:{a:0,b:1,c:2}}),null);
 geometry.getAttribute('_xp_part').setX(0,0);geometry.getAttribute('_xp_part').setX(1,0);geometry.getAttribute('_xp_part').setX(2,0);assert.equal(numericPartForHit(hit),null);
 mesh.material.dispose();geometry.dispose();
});

test('component extraction handles indexed and non-indexed geometry and preserves original attributes and index',()=>{
 for(const indexed of [true,false]){
  const geometry=geometryFixture({indexed}),position=geometry.getAttribute('position'),attribute=geometry.getAttribute('_xp_part'),index=geometry.index;
  const before={position:[...position.array],part:[...attribute.array],index:index?[...index.array]:null};
  const selected=partGeometry(geometry,2);assert.ok(selected);assert.equal(selected.index,null);assert.deepEqual([...selected.getAttribute('position').array],[2,0,0,3,0,0,2,1,0]);
  assert.equal(partGeometry(geometry,999),null);assert.equal(geometry.getAttribute('position'),position);assert.equal(geometry.getAttribute('_xp_part'),attribute);assert.equal(geometry.index,index);
  assert.deepEqual([...position.array],before.position);assert.deepEqual([...attribute.array],before.part);assert.deepEqual(index?[...index.array]:null,before.index);
  selected.dispose();geometry.dispose();
 }
});

test('highlight follows the placed source and disposes only its own geometry and material',()=>{
 const scene=new T.Scene(),root=new T.Group(),geometry=geometryFixture(),material=new T.MeshBasicMaterial({color:'#286b63'}),source=new T.Mesh(geometry,material);scene.add(root);root.add(source);root.position.set(4,2,3);source.scale.set(2,1,1);
 let sourceGeometryDisposed=0,sourceMaterialDisposed=0;geometry.addEventListener('dispose',()=>sourceGeometryDisposed++);material.addEventListener('dispose',()=>sourceMaterialDisposed++);
 const originalColor=material.color.getHex(),highlight=createPartHighlight(root,scene);highlight.select(1);const group=scene.children.find(c=>c!==root),overlay=group.children[0];assert.ok(overlay);assert.equal(highlight.selected(),1);assert.deepEqual(overlay.matrix.elements,source.matrixWorld.elements);
 root.position.set(7,3,1);highlight.update();assert.deepEqual(overlay.matrix.elements,source.matrixWorld.elements);
 let ownGeometryDisposed=0,ownMaterialDisposed=0;overlay.geometry.addEventListener('dispose',()=>ownGeometryDisposed++);overlay.material.addEventListener('dispose',()=>ownMaterialDisposed++);
 highlight.select(2);assert.equal(ownGeometryDisposed,1);assert.equal(group.children.length,1);highlight.dispose();assert.equal(ownMaterialDisposed,1);assert.equal(group.parent,null);
 assert.equal(sourceGeometryDisposed,0);assert.equal(sourceMaterialDisposed,0);assert.equal(source.geometry,geometry);assert.equal(source.material,material);assert.equal(material.color.getHex(),originalColor);
 geometry.dispose();material.dispose();
});

test('one saved product association is shared by its model slots and survives reload without altering another reference',()=>{
 const storage=memoryStorage(),fixture=partsFixture(),same=fixture.parts.filter(p=>p.product_reference==='A02-01');assert.ok(same.length>1);
 saveBinding(same[0].product_reference,content({contentId:'stock-123'}),storage);saveBinding('A02-02',content({url:'https://media.example/te.mp4',kind:'video'}),storage);
 const persisted=loadBindings(storage);assert.equal(persisted.schema_version,1);assert.equal(persisted.context,'xtanco');
 for(const slot of same)assert.equal(persisted.bindings[slot.product_reference].url,'https://media.example/cafe.png');
 assert.equal(persisted.bindings['A02-01'].surfaceId,'ds1');assert.equal(persisted.bindings['A02-01'].contentId,'stock-123');assert.equal(persisted.bindings['A02-02'].kind,'video');
 removeBinding('A02-01',storage);assert.equal(loadBindings(storage).bindings['A02-01'],undefined);assert.equal(loadBindings(storage).bindings['A02-02'].kind,'video');
});

test('invalid content or a storage write rejection preserves the last saved association',()=>{
 const storage=memoryStorage();saveBinding('A02-01',content(),storage);const before=storage.getItem(BINDINGS_KEY);
 for(const input of [content({url:'http://media.example/cafe.png'}),content({url:'javascript:alert(1)'}),content({url:'https://user:pass@media.example/cafe.png'}),content({kind:'audio'}),content({url:'not-a-url'})]){
  assert.throws(()=>saveBinding('A02-01',input,storage));assert.equal(storage.getItem(BINDINGS_KEY),before);
 }
 assert.throws(()=>saveBinding('A02-99',content(),storage));assert.equal(storage.getItem(BINDINGS_KEY),before);
 const denied={getItem:key=>storage.getItem(key),setItem(){throw Error('Quota exceeded');}};
 assert.throws(()=>saveBinding('A02-01',content({url:'https://media.example/new.png'}),denied),/Quota/);assert.equal(storage.getItem(BINDINGS_KEY),before);
 assert.throws(()=>removeBinding('A02-01',denied),/Quota/);assert.equal(storage.getItem(BINDINGS_KEY),before);
 assert.equal(validContent(content()).surfaceId,'ds1');
});

test('malformed binding storage, other contexts and array-shaped maps cannot claim a saved association',()=>{
 for(const stored of ['not-json',JSON.stringify({schema_version:1,context:'matrix',bindings:{'A02-01':content()}}),JSON.stringify({schema_version:1,context:'xtanco',bindings:[]})]){
  const storage=memoryStorage({[BINDINGS_KEY]:stored});assert.deepEqual(loadBindings(storage),{schema_version:1,context:'xtanco',bindings:{}});
 }
});

test('preview commands are local and transient; a storage failure cannot dispatch an unapplied command',()=>{
 const storage=memoryStorage(),target=new EventTarget(),received=[];target.addEventListener(PREVIEW_CHANNEL,e=>received.push(e.detail));
 const id=sendPreview('preview',{id:'product-0-0'},content(),{target,storage});assert.equal(received.length,1);assert.equal(received[0].id,id);assert.equal(received[0].context,'xtanco');assert.equal(received[0].surfaceId,'ds1');assert.equal(received[0].productId,'product-0-0');assert.ok(Number.isFinite(received[0].createdAt));
 assert.equal(storage.writes.length,1);assert.equal(storage.writes[0].key,PREVIEW_CHANNEL);assert.equal(JSON.parse(storage.writes[0].value).id,id);
 assert.throws(()=>sendPreview('preview',{id:'product-0-1'},content(),{target,storage:{setItem(){throw Error('Storage blocked');}}}),/Storage/);assert.equal(received.length,1);
 assert.throws(()=>sendPreview('preview',{id:'product-0-1'},content({url:'http://media.example/unsafe.png'}),{target,storage}));assert.equal(received.length,1);
});
