import * as T from './premium-three.mjs';
import {createPremiumScene} from './premium-scene.mjs';
import {configureIntegratedCamera,projectWorld,unprojectToFloor} from './premium-projection.mjs';

/** Presentation only. Caller supplies snapshots and drives render; never creates a media element or clock loop. */
export function createPremiumRenderer({canvas,mode='best',getPlayer=()=>null,snapshot={},controls=true,integrated=false}={}){
  if(!canvas)throw new TypeError('Premium renderer requires a canvas');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:integrated,preserveDrawingBuffer:integrated,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const model=createPremiumScene(snapshot,{integrated}),camera=new T.OrthographicCamera(-10,10,10,-10,.1,200);
  let width=0,height=0,pixelRatio=0,disposed=false,lastMedia=-Infinity,zoom=1,azimuth=Math.PI/4,elevation=.46,drag=null;
  const target=new T.Vector3();
  function frameCamera(){
    if(integrated&&model.snapshot.projection){configureIntegratedCamera(camera,model.snapshot.projection);return;}
    const s=model.snapshot;target.set(s.cols*.49,.55,s.rows*.5);elevation=s.elevation;
    const radius=Math.hypot(s.cols,s.rows)*2.5;
    camera.position.set(target.x+Math.cos(azimuth)*Math.cos(elevation)*radius,target.y+Math.sin(elevation)*radius,target.z+Math.sin(azimuth)*Math.cos(elevation)*radius);
    camera.lookAt(target);camera.updateMatrixWorld(true);
    // Project all building and streetscape bounds, so wide and portrait windows both fit without clipped corners.
    const bounds=new T.Box3(new T.Vector3(-1.6,-.5,-.5),new T.Vector3(s.cols+3.1,s.wallHeight+.25,s.rows+1.25));
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const p=new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
    }
    const aspect=width/height,vertical=Math.max(maxY-minY,(maxX-minX)/aspect)*1.07/zoom,horizontal=vertical*aspect;
    const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
    camera.left=centerX-horizontal/2;camera.right=centerX+horizontal/2;camera.top=centerY+vertical/2;camera.bottom=centerY-vertical/2;camera.updateProjectionMatrix();
  }
  function resize(w,h,dpr=globalThis.devicePixelRatio||1){if(disposed)return;const nw=Math.max(1,Math.floor(w)),nh=Math.max(1,Math.floor(h)),ratio=Math.min(2,Math.max(1,dpr));if(nw===width&&nh===height&&ratio===pixelRatio)return;width=nw;height=nh;pixelRatio=ratio;renderer.setPixelRatio(pixelRatio);renderer.setSize(width,height,false);frameCamera();}
  function update(s){if(disposed)return;const old=model.snapshot;model.update(s);if(old.cols!==model.snapshot.cols||old.rows!==model.snapshot.rows||old.wallHeight!==model.snapshot.wallHeight||old.elevation!==model.snapshot.elevation||JSON.stringify(old.projection)!==JSON.stringify(model.snapshot.projection))frameCamera();}
  function setMode(m){model.setMode(m);renderer.shadowMap.enabled=model.mode==='best';}
  function render(timeMs=performance.now()){
    if(disposed||(integrated&&!model.snapshot.projection))return;model.animate(timeMs);if(!integrated&&timeMs-lastMedia>=66){model.refreshMedia(getPlayer());lastMedia=timeMs;}renderer.render(model.scene,camera);
  }
  const handlers={
    pointerdown:e=>{if(e.button!==0)return;drag={x:e.clientX,azimuth};canvas.setPointerCapture?.(e.pointerId);},
    pointermove:e=>{if(!drag)return;azimuth=Math.max(.15,Math.min(Math.PI/2-.15,drag.azimuth-(e.clientX-drag.x)*.004));frameCamera();},
    pointerup:()=>{drag=null;},pointercancel:()=>{drag=null;},
    wheel:e=>{e.preventDefault();zoom=Math.max(.7,Math.min(2.2,zoom*Math.exp(-e.deltaY*.001)));frameCamera();}
  };
  if(controls&&!integrated){canvas.style.touchAction='none';for(const [name,fn]of Object.entries(handlers))canvas.addEventListener(name,fn,{passive:false});}
  function fit(){zoom=1;azimuth=Math.PI/4;frameCamera();}
  function dispose(){if(disposed)return;disposed=true;for(const [name,fn]of Object.entries(handlers))canvas.removeEventListener(name,fn);model.dispose();renderer.dispose();}
  setMode(mode);resize(canvas.clientWidth||800,canvas.clientHeight||500);
  return {update,render,resize,setMode,fit,dispose,scene:model.scene,camera,project:point=>projectWorld(camera,point,model.snapshot.projection?.width||width,model.snapshot.projection?.height||height),unproject:(x,y,floorHeight=0)=>unprojectToFloor(camera,x,y,model.snapshot.projection?.width||width,model.snapshot.projection?.height||height,floorHeight),get mode(){return model.mode;},get renderer(){return renderer;}};
}
