import * as T from '../admira-xp/scripts/premium-three.mjs';
import {cloneFurniture} from '../admira-xp/scripts/furniture-asset.mjs?v=shelf-products-1';
import {pixelFinish,preciseTextureSampling} from './finish-rendering.mjs?v=shelf-products-1';
let renderers=new Map(),queue=Promise.resolve();
export function preview(asset,tier,angle=0){const task=queue.then(()=>render(asset,tier,angle));queue=task.catch(()=>{});return task;}
async function render(asset,tier,angle){

 const pixel=tier==='good',key=pixel?'pixel':'smooth';if(!renderers.has(key))renderers.set(key,new T.WebGLRenderer({alpha:true,antialias:!pixel,preserveDrawingBuffer:true}));const renderer=renderers.get(key);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=pixel?T.NoToneMapping:T.ACESFilmicToneMapping;renderer.toneMappingExposure=tier==='best'?1.2:1.1;
 renderer.setClearColor(0x000000,0);const size=pixel?112:tier==='best'?840:420;renderer.setSize(size,size,false);
 let scene,object,dispose;
 object=await cloneFurniture(asset.number||1,tier);const finishDispose=pixel?pixelFinish(object):preciseTextureSampling(object,renderer.capabilities.getMaxAnisotropy());scene=new T.Scene();scene.add(object,pixel?new T.AmbientLight('#ffffff',.9):new T.HemisphereLight('#ffffff','#7e8f81',2.8));const light=new T.DirectionalLight(pixel?'#ffffff':'#fff0d7',pixel?.8:3.2);light.position.set(3,6,4);scene.add(light);dispose=()=>{finishDispose();scene.clear();};

 try{
  scene.background=null;object.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3()),span=bounds.getSize(new T.Vector3());
  const extent=Math.max(span.x,span.y,span.z)*.78+.1,camera=new T.OrthographicCamera(-extent,extent,extent,-extent,.01,100);
  const az=Math.PI/4+angle;camera.position.copy(center).add(new T.Vector3(Math.sin(az)*10,7,Math.cos(az)*10));camera.lookAt(center);renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
 }finally{dispose();}
}
window.addEventListener('pagehide',()=>{for(const renderer of renderers.values()){renderer.dispose();renderer.forceContextLoss();}renderers.clear();});
