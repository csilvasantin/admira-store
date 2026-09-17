import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from './premium-three.mjs';
import {GLTFLoader} from './vendor/GLTFLoader.mjs';
import {clonePersonScene,createPersonPresentation,personProfile,personAssetURL} from './best-person-asset.mjs';
import {VISITOR_PROFILES} from './visitor-profiles.mjs';

const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≠ ${b}`);
const meshes=scene=>{const result=[];scene.traverse(node=>{if(node.isMesh)result.push(node);});return result;};
function fixture({constant=false}={}){
 const scene=new T.Group(),hips=new T.Bone(),leg=new T.Bone();hips.name='hips';leg.name='leg';hips.add(leg);scene.add(hips);
 const texture=new T.Texture(),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute([-.2,0,0,.2,0,0,0,1.7,0],3));
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute([1,0,0,0,1,0,0,0,0,0,0,0],4));
 geometry.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const shirt=new T.MeshStandardMaterial({color:'#ffffff',map:texture});shirt.name='shirt';
 const skin=new T.MeshStandardMaterial({color:'#ffffff',map:texture});skin.userData.personPart='skin';
 const skeleton=new T.Skeleton([hips,leg]);
 const mesh=new T.SkinnedMesh(geometry,[shirt,skin]);mesh.name='body';scene.add(mesh);scene.updateMatrixWorld(true);mesh.bind(skeleton);
 const shoes=new T.Mesh(geometry,shirt);shoes.name='shoes';scene.add(shoes);
 const quaternion=angle=>new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),angle).toArray();
 const clip=(name,angles)=>new T.AnimationClip(name,2,[new T.QuaternionKeyframeTrack('leg.quaternion',[0,1,2],angles.flatMap(quaternion))]);
 const animations=[clip('Idle',[0,0,0]),clip('Walk',constant?[1,1,1]:[-.6,.6,-.6])];
 return {scene,animations,skeleton,leg,geometry,texture,shirt,skin,dispose(){skeleton.dispose();geometry.dispose();texture.dispose();shirt.dispose();skin.dispose();}};
}

test('actual visitor metadata selects adult/child profiles without changing identity or source data',()=>{
 for(const [actor,expected] of [[{id:'visitor-1',gender:'m',age:'adulto'},'male'],[{id:'visitor-2',gender:'f',age:'senior'},'female'],
  [{id:'visitor-3',gender:'m',age:'nino'},'child-male'],[{id:'visitor-4',gender:'f',age:'nino'},'child-female'],
  [{id:'visitor-5',gender:'male',age:'child'},'child-male'],[{id:'visitor-6',gender:'female'},'female']]){
  const raw=structuredClone(actor);assert.equal(personProfile(actor),expected);assert.deepEqual(actor,raw);
  assert.equal(new URL(personAssetURL(expected)).pathname.endsWith(`/people/best-v1/${expected}.glb`),true);
 }
 const fallback=personProfile({id:'unchanging'});assert.equal(personProfile({id:'unchanging',col:5,walking:true}),fallback);
 assert.throws(()=>personAssetURL('../male'),/Perfil/);assert.throws(()=>personAssetURL('robot'),/Perfil/);
});

test('a visitor without source gender uses the assigned shared profile, while explicit and protected identities keep precedence',()=>{
 const actor={id:'untyped',kind:'customer',gender:null,age:null,visitorProfileId:'shared-female',visitorStyle:{gender:'f',age:'child'}};
 const unchanged=JSON.stringify(actor);
 assert.equal(personProfile(actor),'child-female');assert.equal(personProfile({...actor,kind:'passerby'}),'child-female');
 assert.equal(personProfile({...actor,gender:'m',age:'adulto'}),'male');assert.equal(JSON.stringify(actor),unchanged);
 for(const extra of [{kind:'staff'},{robot:true},{kind:'special'}])assert.equal(personProfile({...actor,...extra}),personProfile({id:actor.id,...extra}));
 for(const gender of ['not-a-gender',{},null])assert.equal(personProfile({...actor,age:'adulto',visitorStyle:{gender,age:'not-an-age'}}),personProfile({id:actor.id}));
});

test('clones have independent skeletons and palettes while shared cached geometry/textures survive disposal',()=>{
 const source=fixture(),a=clonePersonScene(source.scene),b=clonePersonScene(source.scene),meshA=a.scene.getObjectByName('body'),meshB=b.scene.getObjectByName('body');
 let geometryDisposals=0,textureDisposals=0,cacheBoneTextureDisposals=0,sourceMaterialDisposals=0,ownedMaterialDisposals=0,ownedBoneTextureDisposals=0;
 source.geometry.addEventListener('dispose',()=>geometryDisposals++);source.texture.addEventListener('dispose',()=>textureDisposals++);
 source.shirt.addEventListener('dispose',()=>sourceMaterialDisposals++);source.skin.addEventListener('dispose',()=>sourceMaterialDisposals++);
 source.skeleton.computeBoneTexture();source.skeleton.boneTexture.addEventListener('dispose',()=>cacheBoneTextureDisposals++);
 for(const material of a.materials)material.addEventListener('dispose',()=>ownedMaterialDisposals++);
 meshA.skeleton.computeBoneTexture();meshA.skeleton.boneTexture.addEventListener('dispose',()=>ownedBoneTextureDisposals++);
 assert.notEqual(meshA.skeleton,source.skeleton);assert.notEqual(meshA.skeleton,meshB.skeleton);
 assert.notEqual(meshA.skeleton.boneMatrices,meshB.skeleton.boneMatrices);assert.notEqual(meshA.skeleton.boneInverses[0],meshB.skeleton.boneInverses[0]);
 assert.equal(meshA.skeleton.bones[1],a.scene.getObjectByName('leg'));assert.equal(meshB.skeleton.bones[1],b.scene.getObjectByName('leg'));
 assert.notEqual(meshA.skeleton.bones[1],meshB.skeleton.bones[1]);assert.deepEqual(meshA.bindMatrix.toArray(),source.scene.getObjectByName('body').bindMatrix.toArray());
 for(const mesh of [...meshes(a.scene),...meshes(b.scene)])assert.equal(mesh.geometry,source.geometry);
 for(const material of [...a.materials,...b.materials]){assert.equal(material.map,source.texture);assert.notEqual(material,source.shirt);assert.notEqual(material,source.skin);}
 meshA.material[0].color.set('#ff0000');assert.equal(meshB.material[0].color.getHexString(),'ffffff');assert.equal(source.shirt.color.getHexString(),'ffffff');
 meshA.skeleton.bones[1].rotation.x=.5;near(meshB.skeleton.bones[1].rotation.x,0);near(source.leg.rotation.x,0);
 const parent=new T.Group();parent.add(a.scene,b.scene);a.dispose();a.dispose();
 assert.equal(a.scene.parent,null);assert.equal(b.scene.parent,parent);assert.equal(ownedMaterialDisposals,a.materials.size);assert.equal(ownedBoneTextureDisposals,1);
 assert.equal(geometryDisposals,0);assert.equal(textureDisposals,0);assert.equal(cacheBoneTextureDisposals,0);assert.equal(sourceMaterialDisposals,0);
 b.dispose();assert.equal(geometryDisposals,0);assert.equal(textureDisposals,0);assert.equal(sourceMaterialDisposals,0);source.dispose();
});

test('invalid skeleton clone cleans allocated materials before rejecting',()=>{
 const source=fixture(),missing=new T.Bone();source.skeleton.bones[1]=missing;
 let disposed=0;for(const material of [source.shirt,source.skin]){const clone=material.clone.bind(material);material.clone=()=>{const result=clone();result.addEventListener('dispose',()=>disposed++);return result;};}
 assert.throws(()=>clonePersonScene(source.scene),/Esqueleto incompleto/);assert.equal(disposed,2);source.dispose();
});

test('each visitor owns its animation clock, skeleton and clothing tint',()=>{
 const source=fixture(),actor={id:'ana',gender:'f',walking:true,color:'#ab1234',pants:'#112233',skin:'#aa7744'},unchanged=JSON.stringify(actor);
 const a=createPersonPresentation(source,actor),b=createPersonPresentation(source,{...actor,id:'bea',color:'#245678'});
 const legA=a.scene.getObjectByName('leg'),legB=b.scene.getObjectByName('leg'),initialB=legB.quaternion.clone();
 a.animate(430,actor);assert.ok(legB.quaternion.equals(initialB));const poseA=legA.quaternion.clone();
 b.animate(1110,{...actor,walking:true});assert.ok(legA.quaternion.equals(poseA));assert.ok(!legB.quaternion.equals(initialB));
 assert.equal(source.leg.rotation.x,0);assert.equal(a.scene.userData.personProfile,'female');assert.equal(a.scene.userData.visualQuality,'best');
 const tintA=a.scene.getObjectByName('body').material[0].color,tintB=b.scene.getObjectByName('body').material[0].color;
 assert.notEqual(tintA.getHexString(),tintB.getHexString());assert.ok(tintA.r>tintA.g&&tintA.r>tintA.b);assert.ok(tintB.b>tintB.r,'textured shirts retain each visitor palette family without requiring a saturated flat fill');
 assert.equal(source.shirt.color.getHexString(),'ffffff');assert.equal(JSON.stringify(actor),unchanged);
 a.dispose();const disposedPose=legA.quaternion.clone();a.animate(1600);assert.ok(legA.quaternion.equals(disposedPose));b.animate(1900);assert.ok(legA.quaternion.equals(disposedPose));b.dispose();source.dispose();
});

test('walking blends smoothly into and out of idle without moving the simulation root',()=>{
 const source=fixture({constant:true}),actor={id:'smooth',walking:false},person=createPersonPresentation(source,actor),leg=person.scene.getObjectByName('leg');
 person.scene.position.set(2,0,3);person.animate(1000,actor);near(leg.rotation.x,0);
 person.animate(1016,{walking:true});const first=leg.rotation.x;assert.ok(first>0&&first<1);
 person.animate(1032,{walking:true});const next=leg.rotation.x;assert.ok(next>first&&next<1);
 for(let time=1048;time<=2048;time+=16)person.animate(time,{walking:true});assert.ok(leg.rotation.x>.999);
 person.animate(2064,{walking:false});assert.ok(leg.rotation.x>0&&leg.rotation.x<1);
 for(let time=2080;time<=3104;time+=16)person.animate(time,{walking:false});assert.ok(Math.abs(leg.rotation.x)<.00001);
 assert.deepEqual(person.scene.position.toArray(),[2,0,3]);person.animate(NaN,actor);assert.ok(leg.quaternion.toArray().every(Number.isFinite));
 person.dispose();source.dispose();
});

test('walking phase follows displayed distance rather than wall time and ignores teleports',()=>{
 const source=fixture(),actor={id:'distance',walking:true},a=createPersonPresentation(source,actor),b=createPersonPresentation(source,actor);
 const legA=a.scene.getObjectByName('leg'),legB=b.scene.getObjectByName('leg');
 const pose=(x,z=0)=>({position:{x,y:0,z},heading:0});
 a.animate(1000,actor,pose(0));const start=legA.quaternion.clone();a.animate(8000,actor,pose(0));assert.ok(legA.quaternion.equals(start),'walking flag alone cannot produce foot sliding in place');
 b.animate(40,actor,pose(0));a.animate(8016,actor,pose(.06));const slow=legA.quaternion.clone();
 b.animate(56,actor,pose(.12));const fast=legB.quaternion.clone();assert.ok(!slow.equals(fast),'different distances advance different gait phases');
 a.animate(8032,actor,pose(.12));assert.ok(legA.quaternion.angleTo(fast)<1e-6,'same distance yields same gait regardless of time or render cadence');
 a.animate(8048,actor,pose(8));assert.ok(legA.quaternion.angleTo(fast)<1e-6,'teleport establishes a new position baseline');
 a.animate(8064,actor,pose(8.03));b.animate(10056,actor,pose(.15));assert.ok(legA.quaternion.angleTo(legB.quaternion)<1e-6,'walking resumes from new baseline after teleport');
 const inputPose=pose(8.03),raw=JSON.stringify(inputPose);a.animate(9000,actor,inputPose);assert.equal(JSON.stringify(inputPose),raw);assert.deepEqual(a.scene.position.toArray(),[0,0,0]);
 a.dispose();b.dispose();source.dispose();
});

test('an unusually large non-teleport frame has a bounded gait advance',()=>{
 const source=fixture(),actor={id:'bounded',walking:true},a=createPersonPresentation(source,actor),b=createPersonPresentation(source,actor);
 const pose=x=>({position:{x,y:0,z:0}});
 a.animate(0,actor,pose(0));b.animate(0,actor,pose(0));a.animate(16,actor,pose(2));b.animate(16,actor,pose(.36));
 assert.ok(a.scene.getObjectByName('leg').quaternion.angleTo(b.scene.getObjectByName('leg').quaternion)<1e-6);
 a.dispose();b.dispose();source.dispose();
});

test('missing idle/walk clips remain finite and release only their instance resources',()=>{
 for(const clipNames of [[],['Idle'],['Walk']]){
  const source=fixture();source.animations=source.animations.filter(clip=>clipNames.includes(clip.name));
  const person=createPersonPresentation(source,{id:'partial',walking:false}),bone=person.scene.getObjectByName('leg');
  for(const [time,walking] of [[0,false],[100,true],[180,false],[-100,true],[Infinity,false]]){person.animate(time,{walking});assert.ok(bone.quaternion.toArray().every(Number.isFinite));}
  let materialDisposals=0;const materials=new Set(meshes(person.scene).flatMap(mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material]));
  for(const material of materials)material.addEventListener('dispose',()=>materialDisposals++);
  person.dispose();person.dispose();assert.equal(materialDisposals,materials.size);source.dispose();
 }
});

function readGLB(profile){
 const bytes=fs.readFileSync(new URL(personAssetURL(profile)));
 assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 const jsonLength=bytes.readUInt32LE(12);assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
 const gltf=JSON.parse(bytes.toString('utf8',20,20+jsonLength)),binOffset=20+jsonLength;
 assert.equal(bytes.readUInt32LE(binOffset+4),0x004e4942);
 const bin=bytes.subarray(binOffset+8,binOffset+8+bytes.readUInt32LE(binOffset));
 function accessor(index){
  const a=gltf.accessors[index],view=gltf.bufferViews[a.bufferView],width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
  const [size,method]={5121:[1,'readUInt8'],5123:[2,'readUInt16LE'],5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']}[a.componentType]||[];
  assert.ok(size&&width);return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,j)=>bin[method]((view.byteOffset||0)+(a.byteOffset||0)+i*(view.byteStride||width*size)+j*size)));
 }
 return {gltf,bytes,bin,accessor};
}
for(const profile of ['male','female','child-male','child-female'])test(`published ${profile} has a complete editable, textured and animated human rig`,()=>{
 const {gltf,bytes,bin,accessor}=readGLB(profile),manifest=JSON.parse(fs.readFileSync(new URL(`../assets/people/best-v1/${profile}.json`,import.meta.url)));
 assert.equal(gltf.asset.version,'2.0');assert.equal(manifest.profile,profile);assert.equal(manifest.license,'CC0-1.0');assert.equal(manifest.measured,false);
 assert.ok(fs.statSync(new URL(`../assets/people/best-v1/${profile}.blend`,import.meta.url)).size>1000);
 assert.ok(bytes.length<16*1024*1024,'profile should remain practical for a shared cached web asset');
 assert.equal(gltf.cameras?.length||0,0);assert.equal(gltf.extensions?.KHR_lights_punctual,undefined);
 assert.equal(gltf.buffers.length,1);assert.equal(gltf.buffers[0].uri,undefined);assert.ok(gltf.buffers[0].byteLength<=bin.length);
 assert.ok(gltf.images?.length>0);
 for(const image of gltf.images){assert.equal(image.uri,undefined);assert.ok(Number.isInteger(image.bufferView));assert.match(image.mimeType,/^image\/(png|jpeg|webp)$/);}
 for(const view of gltf.bufferViews){assert.equal(view.buffer,0);assert.ok((view.byteOffset||0)+view.byteLength<=bin.length);}
 const rig=gltf.nodes.find(node=>node.extras?.profile===profile);assert.ok(rig);assert.equal(rig.extras.forward,'+Z in glTF');assert.equal(rig.extras.units,'uncalibrated_grid_units');
 const bounds=new T.Box3(),visited=new Set();let skinned=0;
 function visit(index,parent=new T.Matrix4()){
  assert.ok(!visited.has(index),'scene hierarchy must not contain cycles or multiply-parented nodes');visited.add(index);
  const node=gltf.nodes[index],local=node.matrix?new T.Matrix4().fromArray(node.matrix):new T.Matrix4().compose(new T.Vector3().fromArray(node.translation||[0,0,0]),new T.Quaternion().fromArray(node.rotation||[0,0,0,1]),new T.Vector3().fromArray(node.scale||[1,1,1]));
  const world=parent.clone().multiply(local);
  if(Number.isInteger(node.mesh)){
   assert.ok(Number.isInteger(node.skin),`${node.name} must follow the animated skeleton`);skinned++;
   const skin=gltf.skins[node.skin];assert.ok(skin.joints.length>=18);assert.equal(new Set(skin.joints).size,skin.joints.length);
   assert.equal(gltf.accessors[skin.inverseBindMatrices].count,skin.joints.length);
   for(const joint of skin.joints)assert.ok(gltf.nodes[joint]);
   for(const primitive of gltf.meshes[node.mesh].primitives){
    const position=gltf.accessors[primitive.attributes.POSITION];assert.ok(position.count>=3);assert.ok([...position.min,...position.max].every(Number.isFinite));
    bounds.union(new T.Box3(new T.Vector3().fromArray(position.min),new T.Vector3().fromArray(position.max)).applyMatrix4(world));
    const joints=accessor(primitive.attributes.JOINTS_0),weights=accessor(primitive.attributes.WEIGHTS_0);
    assert.equal(joints.length,position.count);assert.equal(weights.length,position.count);
    for(let i=0;i<weights.length;i++){assert.ok(joints[i].every(j=>Number.isInteger(j)&&j>=0&&j<skin.joints.length));assert.ok(weights[i].every(w=>Number.isFinite(w)&&w>=0&&w<=1));near(weights[i].reduce((a,b)=>a+b,0),1,.001);}
   }
  }
  for(const child of node.children||[])visit(child,world);
 }
 for(const node of gltf.scenes[gltf.scene||0].nodes)visit(node);
 assert.ok(skinned>=5);assert.ok(bounds.min.y>-.08&&bounds.min.y<.08,'feet stay near the grid floor');
 assert.ok(bounds.max.y>1.6&&bounds.max.y<1.85,'profiles use a shared nominal height; snapshot scale controls child height');
 for(const clipName of ['Idle','Walk']){
  const clip=gltf.animations.find(animation=>animation.name===clipName);assert.ok(clip);assert.ok(clip.channels.length>0);
  let changingRotation=false;
  for(const channel of clip.channels){
   assert.ok(gltf.nodes[channel.target.node]);const sampler=clip.samplers[channel.sampler],times=accessor(sampler.input).flat(),values=accessor(sampler.output);
   assert.ok(times.length>1);assert.ok(times.at(-1)>times[0]);assert.ok(times.every((time,i)=>Number.isFinite(time)&&(!i||time>=times[i-1])));
   assert.ok(values.flat().every(Number.isFinite));assert.equal(values.length,times.length);
   if(channel.target.path==='rotation'&&values.some(row=>row.some((value,i)=>Math.abs(value-values[0][i])>1e-5)))changingRotation=true;
  }
  assert.ok(changingRotation,`${clipName} must contain actual skeletal motion`);
 }
});

for(const profile of ['male','female','child-male','child-female'])test(`${profile} runtime skin bounds are correct before the first render and remain human-sized in Idle/Walk`,async()=>{
 const {bytes}=readGLB(profile),loader=new GLTFLoader();
 // The real exported geometry, skins and animations go through the shipped
 // glTF loader. Only image decoding is replaced for this CPU-only Node test.
 loader.register(()=>({name:'CPUTextureStub',loadTexture:()=>Promise.resolve(new T.Texture())}));
 const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const actor={id:'bounds-review',gender:profile.endsWith('female')?'f':'m',age:profile.startsWith('child')?'nino':'adulto',walking:false};
 const person=createPersonPresentation(gltf,actor);
 const automatic=new T.Box3().setFromObject(person.scene),accurate=new T.Box3().setFromObject(person.scene,true);
 near(automatic.getSize(new T.Vector3()).y,accurate.getSize(new T.Vector3()).y,.0001);
 assert.ok(automatic.max.y>1.6&&automatic.max.y<1.85,'initial camera fitting sees the full body, not the stale untransformed skeleton');
 assert.ok(automatic.min.y>-.08&&automatic.min.y<.08);
 for(const walking of [false,true])for(const time of [250,500,750]){
  person.animate(time,{...actor,walking});person.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(person.scene,true);assert.ok(bounds.getSize(new T.Vector3()).y>1.6&&bounds.getSize(new T.Vector3()).y<1.85);
  const eyes=person.scene.getObjectByName('eyes'),eyeBounds=new T.Box3().setFromObject(eyes,true);
  assert.ok(eyeBounds.getCenter(new T.Vector3()).z>0,'face remains forward +Z at neutral actor heading');
 }
 person.dispose();
 const geometries=new Set(),materials=new Set(),textures=new Set(),skeletons=new Set();
 gltf.scene.traverse(node=>{if(!node.isMesh)return;geometries.add(node.geometry);if(node.isSkinnedMesh)skeletons.add(node.skeleton);for(const material of Array.isArray(node.material)?node.material:[node.material]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
 for(const resource of [...geometries,...materials,...textures,...skeletons])resource.dispose();
});

test('the 24 shared profiles dress real rigs without changing source geometry, simulation data or skeletal ownership',async()=>{
 const sources=new Map(),sourceGeometry=new Set(),sourceMaterials=new Set(),sourceTextures=new Set(),sourceSkeletons=new Set();
 let sharedDisposals=0;
 for(const name of ['male','female','child-male','child-female']){
  const {bytes}=readGLB(name),loader=new GLTFLoader();loader.register(()=>({name:'CPUTextureStub',loadTexture:()=>Promise.resolve(new T.Texture())}));
  const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');sources.set(name,gltf);
  gltf.scene.traverse(node=>{if(!node.isMesh)return;sourceGeometry.add(node.geometry);if(node.isSkinnedMesh)sourceSkeletons.add(node.skeleton);
   for(const material of Array.isArray(node.material)?node.material:[node.material]){sourceMaterials.add(material);for(const value of Object.values(material))if(value?.isTexture)sourceTextures.add(value);}
  });
 }
 for(const resource of [...sourceGeometry,...sourceMaterials,...sourceTextures])resource.addEventListener('dispose',()=>sharedDisposals++);
 const originalPositions=new Map([...sourceGeometry].map(geometry=>[geometry,Array.from(geometry.attributes.position.array)]));
 const appearances=new Set();
 for(const profile of VISITOR_PROFILES){
  const actor={id:`real-${profile.id}`,kind:'customer',age:profile.age,gender:profile.gender,walking:false,color:'#ff00ff',skin:'#ff0000',visitorProfileId:profile.id,visitorStyle:profile.style};
  const unchanged=JSON.stringify(actor),source=sources.get(personProfile(actor)),person=createPersonPresentation(source,actor);
  const {scene}=person,head=scene.getObjectByName('head'),chest=scene.getObjectByName('spine01');
  const hair=scene.getObjectByName(`visitor-hair:${profile.style.hairstyle}`),outfit=scene.getObjectByName(`visitor-outfit:${profile.style.outfit}`);
  assert.equal(hair.parent,head);assert.equal(outfit.parent,chest);
  assert.equal(hair.userData.accessory,profile.style.accessory);assert.equal(scene.userData.visitorProfileId,profile.id);
  assert.deepEqual(scene.scale.toArray(),[profile.style.width,profile.style.height,Math.sqrt(profile.style.width)]);
  assert.equal(scene.getObjectByName('hair').visible,profile.style.hairstyle!=='bald');
  for(const time of [0,250,500]){
   person.animate(time,{...actor,walking:time>0},{position:{x:time/2000,z:0}});scene.updateMatrixWorld(true);
   const bounds=new T.Box3().setFromObject(scene,true);
   assert.ok(bounds.min.y>-.10&&bounds.min.y<.08,`${profile.id} retains grounded feet`);
   assert.ok(bounds.max.y>1.5&&bounds.max.y<2.05,`${profile.id} retains a human silhouette`);
   assert.ok(bounds.getSize(new T.Vector3()).x<1.05,`${profile.id} accessories stay close to the body`);
  }
  const ownedMaterials=new Set(meshes(scene).flatMap(mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material]));
  const ownedGeometry=new Set(meshes(scene).map(mesh=>mesh.geometry).filter(geometry=>!sourceGeometry.has(geometry)));
  let disposedMaterials=0,disposedGeometry=0;
  for(const material of ownedMaterials)material.addEventListener('dispose',()=>disposedMaterials++);
  for(const geometry of ownedGeometry)geometry.addEventListener('dispose',()=>disposedGeometry++);
  const shirt=[...ownedMaterials].find(material=>material.userData?.personPart==='shirt');
  appearances.add(JSON.stringify([scene.scale.toArray(),profile.style.hairstyle,profile.style.accessory,profile.style.outfit,shirt.color.getHexString()]));
  assert.equal(JSON.stringify(actor),unchanged);
  assert.notEqual(head,source.scene.getObjectByName('head'));
  person.dispose();person.dispose();assert.equal(disposedMaterials,ownedMaterials.size);assert.equal(disposedGeometry,ownedGeometry.size);
  assert.equal(sharedDisposals,0);assert.equal(hair.parent,null);assert.equal(outfit.parent,null);
 }
 assert.equal(appearances.size,24);
 for(const [geometry,positions] of originalPositions)assert.deepEqual(Array.from(geometry.attributes.position.array),positions);
 for(const resource of [...sourceGeometry,...sourceMaterials,...sourceTextures,...sourceSkeletons])resource.dispose();
});

test('profile styling cannot override Best staff uniforms or robot appearance',()=>{
 const profile=VISITOR_PROFILES[2],source=fixture();
 for(const extra of [{kind:'staff'},{kind:'customer',robot:true}]){
  const person=createPersonPresentation(source,{id:'protected',...extra,visitorProfileId:profile.id,visitorStyle:profile.style});
  assert.equal(person.scene.userData.visitorProfileId,undefined);assert.deepEqual(person.scene.scale.toArray(),[1,1,1]);
  assert.equal(person.scene.getObjectByName(`visitor-hair:${profile.style.hairstyle}`),undefined);person.dispose();
 }
 source.dispose();
});

test('profiled fabric recolors each UV island while preserving original maps, normal detail, alpha and material ownership',()=>{
 const source=fixture(),profile=VISITOR_PROFILES[0];
 const texture=new T.DataTexture(new Uint8Array([24,30,42,255,24,30,42,255,180,190,200,255,180,190,200,255]),4,1);
 texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;
 source.geometry.setAttribute('uv',new T.Float32BufferAttribute([.75,.5,.75,.5,.75,.5],2));
 source.shirt.map=texture;source.shirt.normalMap=source.texture;source.skin.map=texture;
 const geometry=source.geometry.clone();geometry.setAttribute('uv',new T.Float32BufferAttribute([.125,.5,.125,.5,.125,.5],2));
 const trousers=new T.MeshStandardMaterial({map:texture,normalMap:source.texture});trousers.userData.personPart='trousers';
 const pants=new T.Mesh(geometry,trousers);pants.name='pants';source.scene.add(pants);
 const sourceHook=source.shirt.onBeforeCompile,sourceKey=source.shirt.customProgramCacheKey(),pixels=Array.from(texture.image.data);
 const actor={id:'fabric-a',kind:'customer',visitorProfileId:profile.id,visitorStyle:profile.style};
 const a=createPersonPresentation(source,actor),b=createPersonPresentation(source,{...actor,id:'fabric-b'});
 const shirtA=a.scene.getObjectByName('body').material[0],pantsA=a.scene.getObjectByName('pants').material;
 const pantsB=b.scene.getObjectByName('pants').material,skinA=a.scene.getObjectByName('body').material[1];
 const compile=material=>{const shader={uniforms:{},fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);return shader;};
 const shirtShader=compile(shirtA),pantsShader=compile(pantsA),otherShader=compile(pantsB),skinShader=compile(skinA);
 assert.ok(pantsShader.uniforms.visitorFabricReference.value<shirtShader.uniforms.visitorFabricReference.value*.1,'dark trouser UV island has its own normalization, independent of the shared bright shirt atlas');
 assert.ok(pantsShader.uniforms.visitorFabricReference.value>.001);
 assert.equal(shirtA.color.getHexString(),profile.style.palette.color.slice(1));assert.equal(pantsA.color.getHexString(),profile.style.palette.pants.slice(1));
 assert.match(pantsShader.fragmentShader,/diffuseColor\.rgb \*= visitorFabricShade/);
 assert.match(pantsShader.fragmentShader,/diffuseColor\.a \*= sampledDiffuseColor\.a/);
 assert.match(pantsShader.fragmentShader,/visitorFabricLuminance.*dot/);
 assert.match(pantsShader.fragmentShader,/#include <normal_fragment_maps>/);
 assert.equal(pantsShader.fragmentShader.includes('#include <map_fragment>'),false);
 assert.notEqual(pantsShader.uniforms.visitorFabricReference,otherShader.uniforms.visitorFabricReference);
 const otherReference=otherShader.uniforms.visitorFabricReference.value;pantsShader.uniforms.visitorFabricReference.value=.9;
 assert.equal(otherShader.uniforms.visitorFabricReference.value,otherReference);
 assert.equal(pantsA.customProgramCacheKey(),pantsB.customProgramCacheKey());assert.notEqual(pantsA.customProgramCacheKey(),sourceKey);
 assert.equal(skinShader.uniforms.visitorFabricReference,undefined);assert.ok(skinShader.fragmentShader.includes('#include <map_fragment>'));
 for(const material of [shirtA,pantsA,pantsB]){assert.equal(material.map,texture);assert.equal(material.normalMap,source.texture);}
 assert.equal(source.shirt.onBeforeCompile,sourceHook);assert.equal(source.shirt.customProgramCacheKey(),sourceKey);assert.deepEqual(Array.from(texture.image.data),pixels);
 let mapDisposals=0,sourceDisposals=0,ownedDisposals=0;
 texture.addEventListener('dispose',()=>mapDisposals++);source.texture.addEventListener('dispose',()=>mapDisposals++);
 source.shirt.addEventListener('dispose',()=>sourceDisposals++);trousers.addEventListener('dispose',()=>sourceDisposals++);
 pantsA.addEventListener('dispose',()=>ownedDisposals++);a.dispose();a.dispose();assert.equal(ownedDisposals,1);assert.equal(mapDisposals,0);assert.equal(sourceDisposals,0);
 b.dispose();assert.equal(mapDisposals,0);assert.equal(sourceDisposals,0);
 const staff=createPersonPresentation(source,{...actor,kind:'staff'}),staffMaterial=staff.scene.getObjectByName('pants').material;
 assert.equal(compile(staffMaterial).uniforms.visitorFabricReference,undefined);staff.dispose();
 geometry.dispose();trousers.dispose();texture.dispose();source.dispose();
});
