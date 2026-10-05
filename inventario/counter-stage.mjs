import * as T from '../admira-xp/scripts/premium-three.mjs';
import {createSurfaceBinding} from '../admira-xp/scripts/surface-materials.mjs?v=surfaces-1';
import {cloneFurniture} from '../admira-xp/scripts/furniture-asset.mjs?v=ipad-20261005-1';
import {stageCamera} from './stage-camera.mjs?v=shelf-products-1';
import {pixelFinish,pixelLayout,preciseTextureSampling} from './finish-rendering.mjs?v=shelf-products-1';
import {createPartHighlight,numericPartForHit} from '../admira-xp/scripts/shelf-parts.mjs?v=shelf-products-1';

export async function mountCounterStage(host,asset={number:1,name:'Mostrador'},{controlsHost=host,onReady=()=>{},quality='best',cameraState}={}){
 const canvas=host.querySelector('canvas'),status=host.querySelector('[data-status]');
 const en=document.documentElement.lang==='en',t=(es,enText)=>en?enText:es;
 const homeZoom=asset.number===50?1.12:1;
 const pixel=quality==='good',state=cameraState||stageCamera(homeZoom),output=pixel?canvas.getContext('2d'):null;
 let renderer,object,binding,editorDispose,finishDispose,partHighlight,disposed=false,drag=null;
 const owned=new Set(),events=[];
 const on=(element,type,fn)=>{element.addEventListener(type,fn);events.push(()=>element.removeEventListener(type,fn));};
 try{
  renderer=new T.WebGLRenderer({canvas:pixel?document.createElement('canvas'):canvas,antialias:!pixel,alpha:false});renderer.setPixelRatio(pixel?1:Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=pixel?T.NoToneMapping:T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=!pixel;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#edf0e7');
  const ambient=pixel?new T.AmbientLight('#ffffff',.9):new T.HemisphereLight('#ffffff','#80927f',2.5);scene.add(ambient);
  const key=new T.DirectionalLight(pixel?'#ffffff':'#fff3dc',pixel?.8:3.5);key.position.set(3,7,4);key.castShadow=!pixel;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0003;scene.add(key);
  const fill=new T.DirectionalLight('#d9e8f3',pixel?0:1.5);fill.position.set(-4,3,-3);scene.add(fill);
  if(asset.number===50&&!pixel){
   // Reflection panels let blue PET and thin black wire show their PBR finish.
   renderer.toneMappingExposure=.9;ambient.intensity=.75;key.intensity=2.6;fill.intensity=.65;
   const room=new T.Scene();room.background=new T.Color('#9ca5aa');
   const panelResources=[];
   for(const [x,y,z,w,h,rotation] of [[-3,2,0,3,4,Math.PI/2],[3,2,0,3,4,-Math.PI/2],[0,4,0,4,4,0]]){
    const geometry=new T.PlaneGeometry(w,h),material=new T.MeshBasicMaterial({color:new T.Color(3,3,3),side:T.DoubleSide}),panel=new T.Mesh(geometry,material);
    panel.position.set(x,y,z);if(y===4)panel.rotation.x=Math.PI/2;else panel.rotation.y=rotation;
    room.add(panel);panelResources.push(geometry,material);
   }
   const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04);
   scene.environment=environment.texture;owned.add(environment);pmrem.dispose();panelResources.forEach(r=>r.dispose());room.clear();
  }
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),pixel?new T.MeshBasicMaterial({color:'#edf0e7'}):new T.MeshStandardMaterial({color:'#edf0e7',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=!pixel;scene.add(floor);owned.add(floor.geometry);owned.add(floor.material);
  object=await cloneFurniture(asset.number,quality);if(disposed)return;
  finishDispose=pixel?pixelFinish(object):preciseTextureSampling(object,renderer.capabilities.getMaxAnisotropy());binding=createSurfaceBinding(object);const materials=new Map();object.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.set(m,m);});scene.add(object);
  const camera=new T.PerspectiveCamera(36,1,.01,100),bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3()),span=bounds.getSize(new T.Vector3()),extent=Math.max(span.x,span.y,span.z,.2);
  partHighlight=createPartHighlight(object,scene);
  function draw(){
   if(disposed)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
   const {angle,elevation,zoom,wire}=state.get();for(const material of materials.values())material.wireframe=wire;
   if(pixel){const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr),layout=pixelLayout(w,h);canvas.width=w;canvas.height=h;renderer.setSize(layout.width,layout.height,false);camera.aspect=layout.width/layout.height;canvas.dataset.pixelScale=layout.scale;}else{renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;}camera.updateProjectionMatrix();
   const distance=extent*(camera.aspect<1?3.1:2.5)/zoom;
   camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(angle)*Math.cos(elevation)*distance));camera.lookAt(center);partHighlight.update();renderer.render(scene,camera);
   if(pixel){const layout=pixelLayout(canvas.width,canvas.height);output.imageSmoothingEnabled=false;output.fillStyle='#edf0e7';output.fillRect(0,0,canvas.width,canvas.height);output.drawImage(renderer.domElement,layout.x,layout.y,layout.width*layout.scale,layout.height*layout.scale);}
   canvas.dataset.camera=JSON.stringify(state.get());
  }
  const setView=(a,e,label)=>{state.update({angle:a,elevation:e,zoom:homeZoom});status.textContent=asset.number+'. '+asset.name+' · '+label+' · '+quality.toUpperCase()+t(' · modelo 3D completo',' · complete 3D model');draw();};
  for(const button of controlsHost.querySelectorAll('button[data-view]'))on(button,'click',()=>{const name=button.dataset.view;setView(...({front:[asset.number===2?Math.PI/2:0,.25,'frontal'],back:[asset.number===2?-Math.PI/2:Math.PI,.25,'parte posterior'],side:[asset.number===2?0:Math.PI/2,.25,'lateral'],home:[Math.PI/4,.38,'perspectiva']}[name]));});
  for(const button of controlsHost.querySelectorAll('button[data-zoom]'))on(button,'click',()=>state.update({zoom:state.get().zoom+(button.dataset.zoom==='in'?.15:-.15)}));
  const api={root:object,canvas,scene,camera,binding,draw,pick:(x,y,objects)=>{const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);scene.updateMatrixWorld(true);return ray.intersectObjects(objects,true);},frameObject:()=>{state.update({angle:0,elevation:.05,zoom:1.15});draw();return true;},clearClip:()=>{},invalidateShadows:draw,preset:()=>state.update({angle:Math.PI/4,elevation:.38,zoom:1}),onPick:null,onPartPick:null,setPartSelection:id=>{partHighlight.select(id);canvas.dataset.selectedPart=id||'';draw();},view:name=>{const values={home:[Math.PI/4,.38,'perspectiva'],front:[asset.number===2?Math.PI/2:0,.25,'frontal'],top:[0,1.35,'planta']};if(values[name])setView(...values[name]);},zoom:delta=>state.update({zoom:state.get().zoom+delta})};let press=null;
  on(canvas,'pointerdown',e=>{press={x:e.clientX,y:e.clientY};});
  on(canvas,'pointerup',e=>{if(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5)return;const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);scene.updateMatrixWorld(true);const hit=ray.intersectObject(object,true)[0];if(hit){api.onPick?.(binding.keyFor(hit.object,hit.face?.materialIndex||0));api.onPartPick?.(numericPartForHit(hit));}});
  on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  on(canvas,'pointermove',e=>{if(!drag)return;const current=state.get();state.update({angle:current.angle-(e.clientX-drag.x)*.009,elevation:current.elevation+(e.clientY-drag.y)*.008});drag={x:e.clientX,y:e.clientY};status.textContent=asset.number+'. '+asset.name+t(' · vista libre 360°',' · free 360° view');});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])on(canvas,type,()=>{drag=null;});
  on(canvas,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();const {angle,elevation,zoom}=state.get();state.update({angle:angle+(e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0),elevation:elevation+(e.key==='ArrowUp'?.1:e.key==='ArrowDown'?-.1:0),zoom:zoom+(e.key==='+'?.1:e.key==='-'?-.1:0)});});
  canvas.addEventListener('wheel',wheel,{passive:false});function wheel(e){e.preventDefault();state.update({zoom:state.get().zoom*Math.exp(-e.deltaY*.001)});}events.push(()=>canvas.removeEventListener('wheel',wheel));
  const wire=controlsHost.querySelector('[data-wire]');if(wire){state.update({wire:wire.checked});on(wire,'change',()=>state.update({wire:wire.checked}));}events.push(state.subscribe(draw));
  on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();status.textContent=t('Se ha interrumpido la vista 3D. Recarga para recuperarla.','The 3D view was interrupted. Reload to recover it.');});
  const observer=new ResizeObserver(draw);observer.observe(canvas);events.push(()=>observer.disconnect());
  status.textContent=asset.number+'. '+asset.name+' · '+quality.toUpperCase()+t(' · modelo 3D completo · arrastra para girar',' · complete 3D model · drag to orbit');draw();
  editorDispose=await onReady(api);
  return ()=>{editorDispose?.();disposed=true;partHighlight?.dispose();binding?.dispose();finishDispose?.();events.forEach(off=>off());owned.forEach(r=>r.dispose());key.shadow.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();};
 }catch(error){editorDispose?.();partHighlight?.dispose();binding?.dispose();finishDispose?.();renderer?.dispose();renderer?.forceContextLoss();status.textContent=t('No se pudo abrir la vista 3D. Recarga para reintentar; el archivo GLB sigue disponible para descargar.','The 3D view could not open. Reload to retry; the GLB file is still available to download.');return ()=>{disposed=true;events.forEach(off=>off());owned.forEach(r=>r.dispose());};}
}
