import * as T from '../admira-xp/scripts/premium-three.mjs';
import {createSurfaceBinding} from '../admira-xp/scripts/surface-materials.mjs?v=surfaces-1';
import {cloneFurniture} from '../admira-xp/scripts/furniture-asset.mjs?v=water-rack-50';

export async function mountCounterStage(host,asset={number:1,name:'Mostrador'},{controlsHost=host,onReady=()=>{}}={}){
 const canvas=host.querySelector('canvas'),status=host.querySelector('[data-status]');
 const en=document.documentElement.lang==='en',t=(es,enText)=>en?enText:es;
 const homeZoom=asset.number===50?1.12:1;
 let renderer,object,binding,editorDispose,disposed=false,angle=Math.PI/4,elevation=.38,zoom=homeZoom,drag=null;
 const owned=new Set(),events=[];
 const on=(element,type,fn)=>{element.addEventListener(type,fn);events.push(()=>element.removeEventListener(type,fn));};
 try{
  renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#edf0e7');
  const ambient=new T.HemisphereLight('#ffffff','#80927f',2.5);scene.add(ambient);
  const key=new T.DirectionalLight('#fff3dc',3.5);key.position.set(3,7,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0003;scene.add(key);
  const fill=new T.DirectionalLight('#d9e8f3',1.5);fill.position.set(-4,3,-3);scene.add(fill);
  if(asset.number===50){
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
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#edf0e7',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);owned.add(floor.geometry);owned.add(floor.material);
  object=await cloneFurniture(asset.number,'best');if(disposed)return;
  binding=createSurfaceBinding(object);const materials=new Map();object.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.set(m,m);});scene.add(object);
  const camera=new T.PerspectiveCamera(36,1,.01,100),bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3()),span=bounds.getSize(new T.Vector3()),extent=Math.max(span.x,span.y,span.z,.2);
  function draw(){
   if(disposed)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
   renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
   const distance=extent*(camera.aspect<1?3.1:2.5)/zoom;
   camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(angle)*Math.cos(elevation)*distance));camera.lookAt(center);renderer.render(scene,camera);
  }
  const setView=(a,e,label)=>{angle=a;elevation=e;zoom=homeZoom;status.textContent=asset.number+'. '+asset.name+' · '+label+t(' · modelo 3D completo',' · complete 3D model');draw();};
  for(const button of controlsHost.querySelectorAll('button[data-view]'))on(button,'click',()=>{const name=button.dataset.view;setView(...({front:[0,.25,'frontal'],back:[Math.PI,.25,'parte posterior'],side:[Math.PI/2,.25,'lateral'],home:[Math.PI/4,.38,'perspectiva']}[name]));});
  for(const button of controlsHost.querySelectorAll('button[data-zoom]'))on(button,'click',()=>{zoom=Math.max(.7,Math.min(2,zoom+(button.dataset.zoom==='in'?.15:-.15)));draw();});
  const api={binding,draw,onPick:null,view:name=>{const values={home:[Math.PI/4,.38,'perspectiva'],front:[0,.25,'frontal'],top:[0,1.35,'planta']};if(values[name])setView(...values[name]);},zoom:delta=>{zoom=Math.max(.7,Math.min(2,zoom+delta));draw();}};let press=null;
  on(canvas,'pointerdown',e=>{press={x:e.clientX,y:e.clientY};});
  on(canvas,'pointerup',e=>{if(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5)return;const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);scene.updateMatrixWorld(true);const hit=ray.intersectObject(object,true)[0];if(hit)api.onPick?.(binding.keyFor(hit.object,hit.face?.materialIndex||0));});
  on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  on(canvas,'pointermove',e=>{if(!drag)return;angle-=(e.clientX-drag.x)*.009;elevation=Math.max(.05,Math.min(1.35,elevation+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};status.textContent=asset.number+'. '+asset.name+t(' · vista libre 360°',' · free 360° view');draw();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])on(canvas,type,()=>{drag=null;});
  on(canvas,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')elevation=Math.min(1.35,elevation+.1);if(e.key==='ArrowDown')elevation=Math.max(.05,elevation-.1);if(e.key==='+')zoom=Math.min(2,zoom+.1);if(e.key==='-')zoom=Math.max(.7,zoom-.1);draw();});
  const wire=controlsHost.querySelector('[data-wire]');for(const m of materials.values())m.wireframe=wire.checked;on(wire,'change',()=>{for(const m of materials.values())m.wireframe=wire.checked;draw();});
  on(canvas,'webglcontextlost',e=>{e.preventDefault();status.textContent=t('Se ha interrumpido la vista 3D. Recarga para recuperarla.','The 3D view was interrupted. Reload to recover it.');});
  const observer=new ResizeObserver(draw);observer.observe(canvas);events.push(()=>observer.disconnect());
  status.textContent=asset.number+'. '+asset.name+t(' · modelo 3D completo · arrastra para girar',' · complete 3D model · drag to orbit');draw();
  editorDispose=await onReady(api);
  return ()=>{disposed=true;editorDispose?.();binding?.dispose();events.forEach(off=>off());owned.forEach(r=>r.dispose());key.shadow.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();};
 }catch(error){editorDispose?.();binding?.dispose();renderer?.dispose();status.textContent=t('No se pudo abrir la vista 3D. Recarga para reintentar; el archivo GLB sigue disponible para descargar.','The 3D view could not open. Reload to retry; the GLB file is still available to download.');return ()=>{disposed=true;events.forEach(off=>off());owned.forEach(r=>r.dispose());};}
}
