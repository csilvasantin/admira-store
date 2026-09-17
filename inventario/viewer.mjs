import * as T from '../admira-xp/scripts/premium-three.mjs';
import {cloneFurniture} from '../admira-xp/scripts/furniture-asset.mjs';
let renderer,queue=Promise.resolve();
export function preview(asset,tier,angle=0){const task=queue.then(()=>render(asset,tier,angle));queue=task.catch(()=>{});return task;}
async function render(asset,tier,angle){

 renderer ||= new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=tier==='best'?1.2:1.1;
 renderer.setClearColor(0x000000,0);const size=tier==='good'?88:420;renderer.setSize(size,size,false);
 let scene,object,dispose;
 object=await cloneFurniture(asset.number||1,tier);scene=new T.Scene();scene.add(object,new T.HemisphereLight('#ffffff','#7e8f81',2.8));const key=new T.DirectionalLight('#fff0d7',3.2);key.position.set(3,6,4);scene.add(key);dispose=()=>scene.clear();

 try{
  scene.background=null;object.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3()),span=bounds.getSize(new T.Vector3());
  const extent=Math.max(span.x,span.y,span.z)*.78+.1,camera=new T.OrthographicCamera(-extent,extent,extent,-extent,.01,100);
  const az=Math.PI/4+angle;camera.position.copy(center).add(new T.Vector3(Math.sin(az)*10,7,Math.cos(az)*10));camera.lookAt(center);renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
 }finally{dispose();}
}
window.addEventListener('pagehide',()=>{renderer?.dispose();renderer?.forceContextLoss();renderer=null;});
