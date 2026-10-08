import * as T from '../admira-xp/scripts/premium-three.mjs';
import {RGBELoader} from '../admira-xp/scripts/vendor/RGBELoader.mjs';

// Local light panels provide reflections without a network HDRI or image asset.
export function createMatrixEnvironmentRoom(){
 const room=new T.Scene(),owned=[];
 room.background=new T.Color(.33,.36,.34);
 const add=(geometry,material,position,rotation=[0,0,0])=>{
  const mesh=new T.Mesh(geometry,material);mesh.position.set(...position);mesh.rotation.set(...rotation);room.add(mesh);owned.push(geometry,material);return mesh;
 };
 add(new T.BoxGeometry(10,8,10),new T.MeshBasicMaterial({color:new T.Color(.45,.48,.46),side:T.BackSide}),[0,3,0]);
 for(const [position,size,rotation,color]of [
  [[-3.8,3,0],[3,5],[0,Math.PI/2,0],[5.5,5.8,6]],
  [[3.8,3,1],[3,5],[0,-Math.PI/2,0],[6,5.4,4.6]],
  [[0,6.5,0],[5,5],[Math.PI/2,0,0],[4.2,4.3,4.1]],
  [[0,3,-4.5],[4,4],[0,0,0],[2.1,2.5,2.8]]
 ])add(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({color:new T.Color(...color),side:T.DoubleSide}),position,rotation);
 return {room,dispose(){owned.forEach(resource=>resource.dispose());room.clear();}};
}

export function configureMatrixRenderer(renderer){
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
}

export function createMatrixStudio(renderer,scene){
 configureMatrixRenderer(renderer);
 const {room,dispose:disposeRoom}=createMatrixEnvironmentRoom();
 const pmrem=new T.PMREMGenerator(renderer);let environment;
 try{environment=pmrem.fromScene(room,.04);}finally{pmrem.dispose();disposeRoom();}
 scene.environment=environment.texture;
 const key=new T.DirectionalLight('#fff0df',3.6);key.position.set(4,7,5);key.castShadow=true;
 key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-5;
 key.shadow.camera.near=.1;key.shadow.camera.far=22;key.shadow.bias=-.00015;key.shadow.normalBias=.012;key.shadow.radius=4;
 const fill=new T.DirectionalLight('#d7e5f2',.8);fill.position.set(-4,3,-2);
 const ambient=new T.HemisphereLight('#f8f9f6','#646d60',.45);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshPhysicalMaterial({color:'#e8ebe4',roughness:.8,metalness:0}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;
 scene.add(key,fill,ambient,floor);
 return {dispose(){scene.environment=null;environment.dispose();key.shadow.dispose();floor.geometry.dispose();floor.material.dispose();scene.remove(key,fill,ambient,floor);}};
}

// Hiperreal: luz y reflejos de una cafetería real (HDRI CC0 Poly Haven «Comfy Café»), sombras de contacto
// nítidas y suelo de hormigón pulido. Si el HDRI no carga, usa el estudio Matrix.
export const HIPERREAL_HDRI_URL=new URL('./assets/catalog/47/hiperreal/comfy_cafe_1k.hdr',import.meta.url).href;
let hdriPromise;
export function loadHiperrealHDRI(url=HIPERREAL_HDRI_URL){
 hdriPromise ||= new RGBELoader().loadAsync(url).catch(error=>{hdriPromise=null;throw error;});
 return hdriPromise;
}
export function configureHiperrealRenderer(renderer){
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
}
export async function createHiperrealStudio(renderer,scene,{background=true}={}){
 let hdri;
 try{hdri=await loadHiperrealHDRI();}catch{return createMatrixStudio(renderer,scene);}
 configureHiperrealRenderer(renderer);
 const pmrem=new T.PMREMGenerator(renderer);let environment;
 try{const source=hdri.clone();source.mapping=T.EquirectangularReflectionMapping;source.needsUpdate=true;environment=pmrem.fromEquirectangular(source);source.dispose();}finally{pmrem.dispose();}
 const previous={background:scene.background,blur:scene.backgroundBlurriness,intensity:scene.backgroundIntensity};
 scene.environment=environment.texture;
 if(background){scene.background=environment.texture;scene.backgroundBlurriness=.55;scene.backgroundIntensity=.55;}
 const key=new T.DirectionalLight('#ffe2bf',2.4);key.position.set(2.5,9,-1.5);key.castShadow=true;
 key.shadow.mapSize.set(4096,4096);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;
 key.shadow.camera.near=.1;key.shadow.camera.far=24;key.shadow.bias=-.0001;key.shadow.normalBias=.006;key.shadow.radius=2.5;
 const fill=new T.DirectionalLight('#ffd9b0',.35);fill.position.set(-3,2.5,4);
 // Suelo «atrapasombras»: el mueble se asienta sobre la cafetería del HDRI con sombras de contacto, sin un disco visible.
 const floor=new T.Mesh(new T.PlaneGeometry(60,60),background?new T.ShadowMaterial({color:'#2a1c10',opacity:.42}):new T.MeshPhysicalMaterial({color:'#8d877e',roughness:.48,metalness:0,clearcoat:.35,clearcoatRoughness:.2}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;
 scene.add(key,fill,floor);
 let contact;
 // Sombra de contacto suave bajo el mueble (como una oclusión ambiental horneada en el suelo).
 const ground=object=>{
  contact?.removeFromParent();contact?.geometry.dispose();contact?.material.map?.dispose();contact?.material.dispose();
  object.updateMatrixWorld(true);const box=new T.Box3().setFromObject(object),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.shadowColor='#000';g.shadowBlur=36;g.shadowOffsetX=1000;g.fillStyle='#000';g.fillRect(44-1000,44,168,168);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  contact=new T.Mesh(new T.PlaneGeometry(size.x*1.45+.25,size.z*1.45+.25),new T.MeshBasicMaterial({map,color:'#000000',transparent:true,opacity:.6,depthWrite:false}));
  contact.rotation.x=-Math.PI/2;contact.position.set(center.x,box.min.y+.002,center.z);contact.renderOrder=-1;scene.add(contact);
 };
 return {hiperreal:true,ground,dispose(){contact?.removeFromParent();contact?.geometry.dispose();contact?.material.map?.dispose();contact?.material.dispose();scene.environment=null;scene.background=previous.background;scene.backgroundBlurriness=previous.blur;scene.backgroundIntensity=previous.intensity;environment.dispose();key.shadow.dispose();floor.geometry.dispose();floor.material.dispose();scene.remove(key,fill,floor);}};
}
