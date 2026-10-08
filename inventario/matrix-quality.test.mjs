import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../admira-xp/scripts/premium-three.mjs';
import {qualityProfiles,selectedQuality,comparisonProfiles,catalogFrontAngle} from './quality-model.mjs';
import {furnitureURL,cloneFurniture} from '../admira-xp/scripts/furniture-asset.mjs';
import {coffeeCollectionURL,UNREAL_PROJECT_DOWNLOAD_URL} from './coffee-collection.mjs';
import {preciseTextureSampling} from './finish-rendering.mjs';
import {createMatrixEnvironmentRoom,configureMatrixRenderer} from './matrix-rendering.mjs';
import {stageCamera} from './stage-camera.mjs';

test('Matrix is exclusive to model 47; Hiperreal only exists for published batches; other model URLs reject them',()=>{
 const hiperreal=new Set([44,45,46,47,48,49,50,52]);
 for(let number=1;number<=52;number++){
  assert.deepEqual(comparisonProfiles(number,'all'),['good','better','best',...(number===47?['matrix']:[]),...(hiperreal.has(number)?['hiperreal']:[])]);
  assert.equal(selectedQuality(number,'matrix'),number===47?'matrix':'best');
  if(number!==47)assert.throws(()=>furnitureURL(number,'matrix'),/perfil no válido/);
  if(!hiperreal.has(number))assert.throws(()=>furnitureURL(number,'hiperreal'),/perfil no válido/);
 }
 for(const extension of ['glb','blend']){const url=new URL(furnitureURL(47,'matrix',extension));assert.match(url.pathname,new RegExp('/47/matrix\\.'+extension+'$'));assert.equal(url.searchParams.get('v'),'coffee47-matrix-20261008-1');}
 const profiles=qualityProfiles(47);profiles.pop();assert.equal(qualityProfiles(47).length,5);
 assert.equal(selectedQuality(47,'invalid'),'best');
});

test('Matrix failure requests only the Matrix asset, rejects without Best fallback, and can retry',async()=>{
 const originalFetch=globalThis.fetch,requests=[];
 try{
  globalThis.fetch=async url=>{requests.push(url);return {ok:false};};
  await assert.rejects(cloneFurniture(47,'matrix'),/Modelo 3D no disponible/);
  assert.equal(requests.length,1);assert.match(new URL(requests[0]).pathname,/\/47\/matrix\.glb$/);
  const json=JSON.stringify({asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'Matrix47',extras:{inventoryNumber:47,inventoryId:'native:starbucksShelves'}}]}),padding=' '.repeat((4-json.length%4)%4),body=Buffer.from(json+padding),glb=Buffer.alloc(20+body.length);
  glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(body.length,12);glb.writeUInt32LE(0x4e4f534a,16);body.copy(glb,20);
  globalThis.fetch=async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength)};};
  const first=await cloneFurniture(47,'matrix'),second=await cloneFurniture(47,'matrix');assert.equal(requests.length,2);assert.notEqual(first,second);assert.equal(first.children[0].name,'Matrix47');assert.equal(first.children[0].userData.inventoryId,'native:starbucksShelves');
 }finally{globalThis.fetch=originalFetch;}
});

test('the actual Matrix GLB is distinct from Best and retains all independent visual product identities',()=>{
 const bytes=fs.readFileSync(new URL(furnitureURL(47,'matrix'))),best=fs.readFileSync(new URL(furnitureURL(47,'best')));
 assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);assert.equal(bytes.equals(best),false);
 const doc=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12))),products=doc.nodes.filter(node=>node.extras?.visual_only===true),root=doc.nodes.find(node=>node.extras?.inventoryNumber===47&&node.extras?.inventoryId==='native:starbucksShelves');
 assert.ok(root);assert.equal(products.length,115);assert.equal(new Set(products.map(node=>node.extras.component_id)).size,115);assert.equal(new Set(products.map(node=>node.extras.sku)).size,26);
 assert.ok(products.every(node=>node.children?.length>0));assert.ok(doc.images.length>0);assert.ok(doc.images.every(image=>'bufferView' in image&&!image.uri));assert.ok(doc.buffers.every(buffer=>!buffer.uri));assert.equal(doc.cameras?.length||0,0);
});

test('Matrix collection navigation preserves explicit context while choosing the distinct package',()=>{
 const source='https://www.xpaceos.com/inventario/?asset=47&lang=en&project=starbucks&loc=alsea-sbux-021&token=secret';
 const matrix=coffeeCollectionURL(source,{quality:'matrix'}),best=coffeeCollectionURL(source);
 assert.equal(matrix.pathname,'/inventario/assets/catalog/47/collection-matrix/preview/');assert.equal(best.pathname,'/inventario/assets/catalog/47/collection/preview/');assert.equal(matrix.searchParams.get('lang'),'en');assert.equal(matrix.searchParams.get('loc'),'alsea-sbux-021');assert.equal(matrix.searchParams.has('token'),false);
 assert.equal(UNREAL_PROJECT_DOWNLOAD_URL,'https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip');
 assert.equal(new URL('unreal-studio.png',matrix).origin,'https://www.xpaceos.com');
});

test('Matrix physical materials preserve authored PBR channels and isolate cached Best materials',()=>{
 const map=new T.Texture(),standard=new T.MeshStandardMaterial({color:'#1a674e',map,roughness:.28,metalness:.7}),glass=new T.MeshPhysicalMaterial({transmission:.85,thickness:.18,ior:1.48,clearcoat:.65,clearcoatRoughness:.12});
 standard.name='painted_metal';standard.userData.surface='preserved';glass.thicknessMap=map;
 const base=new T.Group(),geometry=new T.BoxGeometry();base.add(new T.Mesh(geometry,standard),new T.Mesh(geometry,standard),new T.Mesh(geometry,glass));
 const copy=base.clone(true),dispose=preciseTextureSampling(copy,8,{physical:true}),material=copy.children[0].material,physicalGlass=copy.children[2].material;
 assert.ok(material.isMeshPhysicalMaterial);assert.equal(material.defines.PHYSICAL,'');assert.equal(material.name,standard.name);assert.equal(material.roughness,.28);assert.equal(material.metalness,.7);assert.equal(material.color.getHex(),standard.color.getHex());assert.equal(material.userData.surface,'preserved');assert.equal(copy.children[1].material,material);
 assert.notEqual(material,standard);assert.notEqual(material.map,map);assert.equal(material.map.anisotropy,8);assert.equal(map.anisotropy,1);assert.equal(base.children[0].material,standard);assert.equal(standard.isMeshPhysicalMaterial,undefined);
 assert.equal(physicalGlass.transmission,.85);assert.equal(physicalGlass.thickness,.18);assert.equal(physicalGlass.ior,1.48);assert.equal(physicalGlass.clearcoat,.65);assert.notEqual(physicalGlass.thicknessMap,map);assert.equal(physicalGlass.thicknessMap,material.map);dispose();
});

test('Matrix reflections use local HDR light panels, and their resources are disposable',()=>{
 const {room,dispose}=createMatrixEnvironmentRoom(),resources=[];
 room.traverse(object=>{if(object.isMesh){resources.push(object.geometry,object.material);assert.equal(object.material.map,null);}});
 assert.equal(room.children.length,5);assert.ok(room.children.some(object=>object.material.color.r>1));
 let disposed=0;resources.forEach(resource=>resource.addEventListener('dispose',()=>disposed++));dispose();assert.equal(room.children.length,0);assert.equal(disposed,resources.length);
 const renderer={shadowMap:{}};configureMatrixRenderer(renderer);assert.equal(renderer.toneMapping,T.ACESFilmicToneMapping);assert.equal(renderer.outputColorSpace,T.SRGBColorSpace);assert.equal(renderer.shadowMap.type,T.PCFSoftShadowMap);assert.equal(renderer.shadowMap.enabled,true);
});

test('all five finishes share one camera and model 47 frontal view faces the +X cabinet front',()=>{
 const camera=stageCamera(),views=qualityProfiles(47).map(()=>[]),detach=views.map(view=>camera.subscribe(state=>view.push(state)));
 camera.update({angle:catalogFrontAngle(47),elevation:.25,zoom:1.4});assert.equal(catalogFrontAngle(47),Math.PI/2);assert.equal(catalogFrontAngle(2),Math.PI/2);assert.equal(catalogFrontAngle(1),0);
 assert.deepEqual(views.map(view=>view[0]),Array(5).fill(camera.get()));detach[3]();camera.update({zoom:2});assert.equal(views[3].length,1);assert.equal(views[0].length,2);
});
