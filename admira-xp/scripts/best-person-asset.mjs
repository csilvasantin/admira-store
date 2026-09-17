import * as T from './premium-three.mjs';
import {GLTFLoader} from './vendor/GLTFLoader.mjs';

// Public CC0-derived, fully clothed characters built in Blender. A single cached
// mesh per body profile, an independent skeleton/material palette per visitor.
const cache=new Map();
const fabricPixels=new WeakMap(),fabricReferences=new WeakMap();
const hash=value=>{let h=2166136261;for(const c of String(value??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function personProfile(actor={}){
 const style=['customer','passerby'].includes(actor.kind)&&!actor.robot&&actor.visitorProfileId?actor.visitorStyle:null;
 const gender=actor.gender||(['m','male','f','female'].includes(style?.gender)?style.gender:null);
 const age=actor.age||(['adult','adulto','senior','child','nino'].includes(style?.age)?style.age:null);
 const female=gender==='f'||gender==='female'||(!gender&&hash(actor.id)%2===1);
 const child=age==='nino'||age==='child';
 return `${child?'child-':''}${female?'female':'male'}`;
}
export function personAssetURL(profile){
 if(!['male','female','child-male','child-female'].includes(profile))throw Error('Perfil de personaje no válido');
 return new URL(`../assets/people/best-v1/${profile}.glb`,import.meta.url).href;
}

// Object3D.clone deliberately does not rebind skeletons. Reconnect every bone to
// the corresponding cloned node, preserving shared immutable geometry/textures.
export function clonePersonScene(source){
 const clone=source.clone(true),map=new Map(),ownedMaterials=new Set(),skeletons=new Set();
 let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const m of ownedMaterials)m.dispose();for(const s of skeletons)s.dispose();clone.removeFromParent();};
 const pair=(a,b)=>{map.set(a,b);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);};pair(source,clone);
 try{source.traverse(original=>{
  if(!original.isMesh)return;
  const mesh=map.get(original);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
  const copyMaterial=m=>{const copy=m.clone();ownedMaterials.add(copy);return copy;};
  mesh.material=Array.isArray(original.material)?original.material.map(copyMaterial):copyMaterial(original.material);
  if(original.isSkinnedMesh){
   mesh.skeleton=original.skeleton.clone();mesh.skeleton.boneInverses=original.skeleton.boneInverses.map(matrix=>matrix.clone());skeletons.add(mesh.skeleton);mesh.bindMatrix.copy(original.bindMatrix);
   mesh.skeleton.bones=original.skeleton.bones.map(b=>map.get(b));
   if(mesh.skeleton.bones.some(b=>!b))throw Error('Esqueleto incompleto');
   mesh.bind(mesh.skeleton,mesh.bindMatrix);
  }
 });}catch(error){dispose();throw error;}
 return {scene:clone,materials:ownedMaterials,dispose};
}

// Read-only, bounded sampling of the original garment atlas. A single atlas can
// contain both a dark trouser island and a light shirt island, so the reference
// comes from this primitive's UVs rather than an average of the whole picture.
function fabricReference(geometry,texture){
 if(!fabricReferences.has(geometry))fabricReferences.set(geometry,new WeakMap());
 const references=fabricReferences.get(geometry);if(references.has(texture))return references.get(texture);
 const image=texture.image;let pixels=null;
 if(image&&typeof image==='object'){
  if(fabricPixels.has(image))pixels=fabricPixels.get(image);
  else{
   try{
    if(image.data&&Number.isFinite(image.width)&&Number.isFinite(image.height))pixels={data:image.data,width:image.width,height:image.height};
    else if(image.width>0&&image.height>0){
     const ratio=Math.min(1,256/Math.max(image.width,image.height)),width=Math.max(1,Math.round(image.width*ratio)),height=Math.max(1,Math.round(image.height*ratio));
     const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(width,height):typeof document!=='undefined'?document.createElement('canvas'):null;
     if(canvas){canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{willReadFrequently:true});
      if(context){context.drawImage(image,0,0,width,height);pixels={data:context.getImageData(0,0,width,height).data,width,height};}
     }
    }
   }catch{/* Texture decoding/access may be unavailable; keep a finite fallback. */}
   fabricPixels.set(image,pixels);
  }
 }
 let reference=.08;
 if(pixels){
  const values=[],{data,width,height}=pixels;
  const linear=value=>texture.colorSpace===T.SRGBColorSpace?(value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4)):value;
  const sample=(x,y)=>{const i=(Math.max(0,Math.min(height-1,y))*width+Math.max(0,Math.min(width-1,x)))*4;
   if(data[i+3]<128)return;const value=.2126*linear(data[i]/255)+.7152*linear(data[i+1]/255)+.0722*linear(data[i+2]/255);
   if(Number.isFinite(value)&&value>.00001)values.push(value);
  };
  const uv=geometry.getAttribute(texture.channel?`uv${texture.channel}`:'uv');
  if(uv){
   const matrix=new T.Matrix3().setUvTransform(texture.offset.x,texture.offset.y,texture.repeat.x,texture.repeat.y,texture.rotation,texture.center.x,texture.center.y);
   const wrap=(value,mode)=>mode===T.RepeatWrapping?((value%1)+1)%1:mode===T.MirroredRepeatWrapping?(Math.abs(Math.floor(value)%2)===1?1-(value-Math.floor(value)):value-Math.floor(value)):Math.max(0,Math.min(1,value));
   const index=geometry.index,count=index?index.count:uv.count,step=Math.max(1,Math.ceil(count/3/1024)),point=new T.Vector2();
   for(let face=0;face+2<count;face+=3*step){
    point.set(0,0);for(let vertex=0;vertex<3;vertex++){const i=index?index.getX(face+vertex):face+vertex;point.x+=uv.getX(i)/3;point.y+=uv.getY(i)/3;}
    point.applyMatrix3(matrix);point.x=wrap(point.x,texture.wrapS);point.y=wrap(point.y,texture.wrapT);if(texture.flipY)point.y=1-point.y;
    sample(Math.floor(point.x*width),Math.floor(point.y*height));
   }
  }else{
   const step=Math.max(1,Math.ceil(width*height/1024));for(let pixel=0;pixel<width*height;pixel+=step)sample(pixel%width,Math.floor(pixel/width));
  }
  if(values.length){values.sort((a,b)=>a-b);reference=Math.max(.001,values[Math.floor((values.length-1)*.60)]);}
 }
 references.set(texture,reference);return reference;
}
function recolorFabric(material,geometry){
 if(!material.map)return;
 const reference=fabricReference(geometry,material.map),previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
 const chunk=T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',`
 float visitorFabricLuminance = dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
 float visitorFabricShade = clamp( pow( max( visitorFabricLuminance, 0.00001 ) / max( visitorFabricReference, 0.001 ), 0.60 ), 0.34, 1.24 );
 diffuseColor.rgb *= visitorFabricShade;
 diffuseColor.a *= sampledDiffuseColor.a;`);
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.uniforms.visitorFabricReference={value:reference};
  shader.fragmentShader=`uniform float visitorFabricReference;\n${shader.fragmentShader.replace('#include <map_fragment>',chunk)}`;
 };
 material.customProgramCacheKey=()=>`${previousKey}|visitor-fabric-v1`;
 material.userData.visitorFabricReference=reference;material.needsUpdate=true;
}
function tintMaterials(materials,actor,scene){
 const safeColor=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
 const profiled=['customer','passerby'].includes(actor.kind)&&!actor.robot&&!!actor.visitorProfileId;
 for(const mat of materials){
  const part=mat.userData?.personPart||mat.name;
  if(part.includes('shirt')){mat.color.set(safeColor(actor.kind==='staff'?'#35574f':actor.color,'#52696e'));if(mat.map&&!profiled)mat.color.lerp(new T.Color('#ffffff'),.72);}
  if(part.includes('trousers')){mat.color.set(safeColor(actor.pants,'#344251'));if(mat.map&&!profiled)mat.color.lerp(new T.Color('#ffffff'),.64);}
  if(part.includes('shoe_upper')){mat.color.set(safeColor(actor.shoes,'#333136'));if(mat.map)mat.color.lerp(new T.Color('#ffffff'),.55);}
  if(part.includes('hair')||part.includes('brows')){
   const c=new T.Color(safeColor(actor.hair,'#302720')),hsl={};c.getHSL(hsl);
   // The palette's saturated blue/orange hair belongs to the retro tier. Best
   // uses the same seed/palette family interpreted as everyday natural hair.
   if(hsl.s>.58&&(hsl.h>.4&&hsl.h<.82))c.set('#22242a');
   else c.lerp(new T.Color('#241b16'),.28);
   mat.color.copy(c);
  }
  if(part.includes('skin')){
   // Diffuse skin carries natural facial detail. A modest tint preserves that
   // detail while keeping the simulation's explicit, fictional skin palette.
   const color=new T.Color(safeColor(actor.skin,'#e0b495'));
   color.lerp(new T.Color('#ffffff'),.34);mat.color.copy(color);
  }
 }
 if(profiled){
  const colored=new Set();scene.traverse(node=>{
   if(!node.isMesh)return;
   for(const material of Array.isArray(node.material)?node.material:[node.material]){
    if(colored.has(material))continue;
    const part=material.userData?.personPart||material.name;
    if(part.includes('shirt')||part.includes('trousers')){recolorFabric(material,node.geometry);colored.add(material);}
   }
  });
 }
}
function addVisitorDetails(scene,actor,style){
 const resources=new Set(),groups=[];
 const own=resource=>{resources.add(resource);return resource;};
 const material=(color,extra={})=>own(new T.MeshStandardMaterial({color,roughness:.84,...extra}));
 const safeColor=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
 const cloth=material(safeColor(actor.color,'#52696e')),dark=material('#242829'),light=material('#e8dfd0'),hair=material(safeColor(actor.hair,'#302720'));
 scene.updateMatrixWorld(true);
 const head=scene.getObjectByName('head'),chest=scene.getObjectByName('spine01');
 const sourceHair=scene.getObjectByName('hair'),eyes=scene.getObjectByName('eyes');
 const eyeBounds=eyes?new T.Box3().setFromObject(eyes,true):null;
 const hairBounds=sourceHair?new T.Box3().setFromObject(sourceHair,true):null;
 const headPosition=head?.getWorldPosition(new T.Vector3())||new T.Vector3(0,1.55,.04);
 const eyePosition=eyeBounds&&!eyeBounds.isEmpty()?eyeBounds.getCenter(new T.Vector3()):new T.Vector3(0,1.59,.14);
 const crown=hairBounds&&!hairBounds.isEmpty()?hairBounds.max.y:1.71;
 const radius=Math.max(.09,Math.min(.12,(eyeBounds?.getSize(new T.Vector3()).x||.086)*1.12));
 const garment=[];
 scene.traverse(node=>{
  if(!node.isMesh)return;
  const materials=Array.isArray(node.material)?node.material:[node.material];
  if(!materials.some(mat=>(mat.userData?.personPart||mat.name).includes('shirt')))return;
  const positions=node.geometry.attributes.position;
  for(let i=0;i<positions.count;i++)if(Math.abs(positions.getX(i))<.16&&positions.getZ(i)>0)garment.push([positions.getY(i),positions.getZ(i)]);
 });
 const garmentFront=y=>{
  const near=garment.filter(point=>Math.abs(point[0]-y)<.05);
  return near.length?Math.max(...near.map(point=>point[1])):.15;
 };
 const headDetails=new T.Group(),bodyDetails=new T.Group();
 headDetails.name=`visitor-hair:${style.hairstyle||'short'}`;bodyDetails.name=`visitor-outfit:${style.outfit||'shirt'}`;
 headDetails.userData.accessory=bodyDetails.userData.accessory=style.accessory||'none';
 const mesh=(parent,geometry,mat,x,y,z,sx=1,sy=1,sz=1)=>{const object=new T.Mesh(geometry,mat);object.position.set(x,y,z);object.scale.set(sx,sy,sz);object.castShadow=object.receiveShadow=true;parent.add(object);return object;};
 const sphere=own(new T.SphereGeometry(1,24,16)),cube=own(new T.BoxGeometry(1,1,1));
 const oval=(parent,mat,x,y,z,rx,ry,rz)=>mesh(parent,sphere,mat,x,y,z,rx,ry,rz);
 const box=(parent,mat,x,y,z,w,h,d)=>mesh(parent,cube,mat,x,y,z,w,h,d);
 // Hair deformation owns a private geometry copy. The cached glTF geometry and
 // all other visitors remain unchanged, including when this actor disappears.
 if(sourceHair){
  sourceHair.visible=style.hairstyle!=='bald';
  if(sourceHair.isMesh&&sourceHair.geometry&&['short','bob','curly'].includes(style.hairstyle)){
   const geometry=own(sourceHair.geometry.clone()),positions=geometry.attributes.position;
   geometry.computeBoundingBox();const originalBottom=geometry.boundingBox.min.y;
   const wantedBottom=eyePosition.y-(style.hairstyle==='bob'?.15:.055);
   if(originalBottom<wantedBottom)for(let i=0;i<positions.count;i++){
    const y=positions.getY(i);if(y<eyePosition.y)positions.setY(i,eyePosition.y-(eyePosition.y-y)*(eyePosition.y-wantedBottom)/(eyePosition.y-originalBottom));
   }
   positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();sourceHair.geometry=geometry;
  }
 }
 if(style.hairstyle==='curly')for(let row=0;row<2;row++)for(let i=0;i<12;i++){
  const angle=i*Math.PI/6+row*.23,r=radius*(row?.61:.96);
  oval(headDetails,hair,Math.cos(angle)*r,crown-.068+row*.051+Math.sin(i*2.6)*.006,headPosition.z+Math.sin(angle)*radius*.9,.029,.033,.029);
 }
 if(['bob','long'].includes(style.hairstyle)&&(!hairBounds||hairBounds.min.y>eyePosition.y-.14)){
  const long=style.hairstyle==='long',length=long?.21:.135;
  oval(headDetails,hair,0,crown-.16,headPosition.z-.078,radius*.92,length,.047);
  for(const side of [-1,1])oval(headDetails,hair,side*radius*.83,crown-.15,headPosition.z-.022,.037,length,.060);
 }
 switch(style.accessory){
  case 'glasses':{
   const frame=own(new T.TorusGeometry(1,.13,8,24)),lens=material('#34444b',{roughness:.24,transparent:true,opacity:.62});
   for(const side of [-1,1]){
    mesh(headDetails,frame,dark,side*radius*.32,eyePosition.y,eyePosition.z+.018,.029,.020,.027);
    oval(headDetails,lens,side*radius*.32,eyePosition.y,eyePosition.z+.018,.025,.016,.002);
    box(headDetails,dark,side*radius*.65,eyePosition.y,eyePosition.z-.022,.005,.006,.09);
   }
   box(headDetails,dark,0,eyePosition.y+.002,eyePosition.z+.020,.018,.005,.008);break;
  }
  case 'cap':{
   const cap=own(new T.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI*.5));
   mesh(headDetails,cap,cloth,0,crown-.033,headPosition.z,radius*1.13,.066,radius*1.15);
   oval(headDetails,cloth,0,crown-.034,eyePosition.z+.040,radius*.90,.009,.077);break;
  }
  case 'headphones':{
   const band=own(new T.TorusGeometry(1,.043,8,28,Math.PI));
   mesh(headDetails,band,dark,0,eyePosition.y-.014,headPosition.z,radius*1.15,crown-eyePosition.y+.026,radius);
   for(const side of [-1,1])oval(headDetails,dark,side*radius*1.13,eyePosition.y-.018,headPosition.z,.022,.047,.037);break;
  }
  case 'scarf':{
   const accent=material('#b27c50');
   oval(bodyDetails,accent,0,headPosition.y-.115,headPosition.z,.095,.034,.073);
   const y=headPosition.y-.220;box(bodyDetails,accent,.043,y,garmentFront(y)+.012,.050,.19,.022).rotation.z=.10;break;
  }
  case 'backpack':{
   const bag=material(safeColor(actor.pants,'#384958'));
   oval(bodyDetails,bag,0,1.22,-.142,.145,.21,.079);
   box(bodyDetails,cloth,0,1.14,-.221,.19,.12,.022);
   for(const side of [-1,1])box(bodyDetails,bag,side*.13,1.27,garmentFront(1.27)+.006,.025,.29,.019).rotation.z=side*.08;break;
  }
 }
 if(style.outfit==='jacket'){
  for(const y of [1.18,1.255,1.33])box(bodyDetails,light,0,y,garmentFront(y)+.004,.085,.076,.010);
  for(const side of [-1,1])box(bodyDetails,cloth,side*.065,1.30,garmentFront(1.30)+.015,.045,.18,.018).rotation.z=side*.24;
 }else if(style.outfit==='knit'){
  // A ribbed collar and cuffs identify knitwear while the exported garment keeps
  // its real mesh, UVs and skin weights during the shared walk animation.
  oval(bodyDetails,cloth,0,headPosition.y-.142,headPosition.z,.078,.024,.062);
  for(const y of [1.08,1.12,1.16])box(bodyDetails,light,0,y,garmentFront(y)+.005,.27,.011,.008);
 }else if(style.outfit==='shirt')for(const y of [1.12,1.20,1.28])oval(bodyDetails,light,0,y,garmentFront(y)+.007,.005,.006,.003);
 for(const [group,bone] of [[headDetails,head],[bodyDetails,chest]]){
  scene.add(group);scene.updateMatrixWorld(true);if(bone)bone.attach(group);groups.push(group);
 }
 return {dispose(){for(const group of groups)group.removeFromParent();for(const resource of resources)resource.dispose();resources.clear();},resources};
}
export function createPersonPresentation(gltf,actor={}){
 const style=['customer','passerby'].includes(actor.kind)&&!actor.robot&&actor.visitorProfileId?actor.visitorStyle:null;
 const visualActor=style?.palette?{...actor,...style.palette}:actor;
 const instance=clonePersonScene(gltf.scene);tintMaterials(instance.materials,visualActor,instance.scene);
 const scene=instance.scene;scene.name=`best-person:${actor.id||'visitor'}`;
 scene.userData.personProfile=personProfile(actor);scene.userData.visualQuality='best';
 const details=style?addVisitorDetails(scene,visualActor,style):null;
 if(style){
  const dimension=(value,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):1;
  scene.scale.set(dimension(style.width,.87,1.16),dimension(style.height,.94,1.07),Math.sqrt(dimension(style.width,.87,1.16)));
  scene.userData.visitorProfileId=actor.visitorProfileId;
 }
 const mixer=new T.AnimationMixer(scene),clips=gltf.animations||[];
 const idleClip=clips.find(c=>c.name.toLowerCase().includes('idle'));
 const walkClip=clips.find(c=>c.name.toLowerCase().includes('walk'));
 const idle=idleClip?mixer.clipAction(idleClip).play():null;
 const walk=walkClip?mixer.clipAction(walkClip).play():null;
 const phase=(hash(actor.id)%1000)/1000;let lastTime=null,blend=actor.walking?1:0,disposed=false,walkPhase=phase,previousPosition=null;
 function animate(timeMs,currentActor=actor,pose){
  if(disposed)return;
  const time=Number.isFinite(timeMs)?timeMs/1000:0;
  const dt=lastTime===null?0:Math.max(0,Math.min(.1,time-lastTime));lastTime=time;
  const target=currentActor.walking?1:0;
  blend+= (target-blend)*(1-Math.exp(-dt*12));
  const position=pose?.position;
  if(Number.isFinite(position?.x)&&Number.isFinite(position?.z)){
   if(previousPosition){
    const distance=Math.hypot(position.x-previousPosition.x,position.z-previousPosition.z);
    // Sample the distance already displayed by the live actor interpolation.
    // Standing actors never treadmill; teleports do not fast-forward a gait.
    // At most half a stride cycle can be advanced in a single rendered frame.
    if(distance<=3)walkPhase=(walkPhase+Math.min(distance,.36)/.72)%1;
   }
   previousPosition={x:position.x,z:position.z};
  }else{
   previousPosition=null;
   if(walkClip)walkPhase=((time/walkClip.duration+phase)%1+1)%1;
  }
  if(idle){idle.enabled=true;idle.setEffectiveWeight(walk?1-blend:1);idle.time=(time+phase*idleClip.duration)%idleClip.duration;}
  if(walk){walk.enabled=true;walk.setEffectiveWeight(idle?blend:1);walk.time=walkPhase*walkClip.duration;}
  mixer.update(0);
 }
 animate(0,actor);
 // Camera fitting may run before the first renderer frame. Mesh nodes precede
 // their bones in glTF, so a Box3 traversal alone can skin against stale clone
 // matrices and report a quarter-height body. Initialize the whole rig first.
 scene.updateMatrixWorld(true);
 scene.traverse(node=>{if(node.isSkinnedMesh){node.boundingBox=null;node.boundingSphere=null;}});
 return {scene,animate,dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(scene);details?.dispose();instance.dispose();}};
}
export async function loadBestPerson(actor={}){
 const profile=personProfile(actor),url=personAssetURL(profile);
 if(!cache.has(profile))cache.set(profile,(async()=>{
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Personaje Best no disponible');
  return new GLTFLoader().parseAsync(await response.arrayBuffer(),url);
 })().catch(error=>{cache.delete(profile);throw error;}));
 return createPersonPresentation(await cache.get(profile),actor);
}
