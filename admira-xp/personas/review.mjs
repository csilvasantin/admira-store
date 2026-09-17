import * as T from '../scripts/premium-three.mjs';
import {loadBestPerson,personAssetURL} from '../scripts/best-person-asset.mjs?v=best-people-1';
const $=selector=>document.querySelector(selector),canvas=$('#scene'),status=$('#status'),selector=$('#profile');
const events=[],owned=[],scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.01,100),target=new T.Vector3(0,.75,0);
let renderer,model,actor,frame=0,disposed=false,contextLost=false,request=0,drag=null,angle=.22,elevation=.10,distance=3.8,walking=true,bounds,resize;
const on=(element,type,handler,options)=>{element.addEventListener(type,handler,options);events.push(()=>element.removeEventListener(type,handler));};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function cameraFrame(){if(!renderer)return;const r=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();camera.position.copy(target).add(new T.Vector3(Math.sin(angle)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(angle)*Math.cos(elevation)*distance));camera.lookAt(target);}
function focus(face=false){
 if(!model)return;
 // A skinned mesh's cached bind-pose box can be stale after cloning/animation.
 // Evaluate the actual posed vertices before deciding the camera distance.
 scene.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(model.scene,true);
 if(bounds.isEmpty())return;
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 target.set(center.x,face?bounds.max.y-size.y*.09:center.y,center.z);angle=face?0:.22;elevation=face?.02:.08;
 const rect=canvas.getBoundingClientRect(),aspect=Math.max(.1,rect.width/Math.max(1,rect.height));
 const tanY=Math.tan(camera.fov*Math.PI/360),tanX=tanY*aspect;
 if(face)distance=size.y*.44;
 else{
  const outward=new T.Vector3(Math.sin(angle)*Math.cos(elevation),Math.sin(elevation),Math.cos(angle)*Math.cos(elevation));
  const right=new T.Vector3(Math.cos(angle),0,-Math.sin(angle)),up=new T.Vector3().crossVectors(outward,right);
  // Fit the true posed bounds to 80% of the frame, accounting for perspective
  // depth and the current aspect; no rest-pose width multiplier is involved.
  distance=.35;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const point=new T.Vector3(x,y,z).sub(target),depth=point.dot(outward);
   distance=Math.max(distance,depth+Math.abs(point.dot(up))/(tanY*.8),depth+Math.abs(point.dot(right))/(tanX*.8));
  }
 }
 cameraFrame();
}
function setBusy(busy){for(const control of document.querySelectorAll('.toolbar button,.toolbar select'))control.disabled=busy;}
function fail(message){status.textContent=message;status.classList.add('is-error');status.setAttribute('role','alert');}
function showStaticFallback(message){
 if(disposed)return;
 contextLost=true;request++;cancelAnimationFrame(frame);setBusy(true);canvas.hidden=true;
 const fallback=$('#fallback');fallback.hidden=false;
 $('#review-help').textContent='Render fijo de Blender de los cuatro perfiles Best. Puedes volver al Xtanco desde el enlace superior.';
 fail(message+' Cargando un render fijo de Blender de los cuatro perfiles…');
 fallback.onload=()=>{if(!disposed)fail(message+' Se muestra un render fijo de Blender de los cuatro perfiles; la cámara y la animación no están activas.');};
 fallback.onerror=()=>{if(!disposed){fallback.hidden=true;fail(message+' Tampoco se ha podido cargar el render fijo. Puedes volver al Xtanco desde el enlace superior.');}};
 // Load the studio image only when the live WebGL surface cannot be used.
 fallback.src=new URL('../assets/people/best-v1/preview.png',import.meta.url).href;
}

async function load(){if(disposed||contextLost)return;const ticket=++request,profile=selector.value;setBusy(true);$('#download-glb').hidden=true;$('#download-blend').hidden=true;status.classList.remove('is-error');status.setAttribute('role','status');status.textContent='Cargando '+selector.selectedOptions[0].textContent.toLowerCase()+'…';
 const nextActor={id:'review-'+profile,kind:'customer',gender:profile.endsWith('female')?'f':'m',age:profile.startsWith('child-')?'nino':'adulto',color:profile.endsWith('female')?'#887a63':'#50655b',pants:'#344656',skin:'#d8ab8a',hair:'#34271f',shoes:'#35312c',walking};
 try{const next=await loadBestPerson(nextActor);if(disposed||contextLost||ticket!==request){next.dispose();return;}
  model?.dispose();model=next;actor=nextActor;scene.add(model.scene);model.animate(0,actor);scene.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(model.scene,true);focus();
  $('#download-glb').href=personAssetURL(profile);$('#download-blend').href=new URL('../assets/people/best-v1/'+profile+'.blend',import.meta.url).href;$('#download-glb').hidden=false;$('#download-blend').hidden=false;
  status.textContent=selector.selectedOptions[0].textContent+' · Best 3D · '+(walking?'caminando':'en reposo');setBusy(false);
 }catch{if(disposed||contextLost||ticket!==request)return;fail('No se pudo cargar este personaje. Cambia de perfil para reintentar.');selector.disabled=false;}
}
function dispose(){if(disposed)return;disposed=true;request++;cancelAnimationFrame(frame);resize?.disconnect();for(const off of events)off();model?.dispose();for(const resource of owned)resource.dispose();scene.clear();renderer?.dispose();renderer?.forceContextLoss();}
on(window,'pagehide',dispose);
try{
 renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;scene.background=new T.Color('#e7ece3');
 scene.add(new T.HemisphereLight('#ffffff','#83947f',2));const key=new T.DirectionalLight('#fff3e1',2.7);key.position.set(3,6,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=key.shadow.camera.bottom=-3;key.shadow.camera.right=key.shadow.camera.top=3;key.shadow.bias=-.0003;scene.add(key);const rim=new T.DirectionalLight('#dfebff',1.4);rim.position.set(-3,3,-4);scene.add(rim);
 const groundGeometry=new T.PlaneGeometry(200,200),groundMaterial=new T.MeshStandardMaterial({color:'#e7ece3',roughness:.94});owned.push(groundGeometry,groundMaterial);const ground=new T.Mesh(groundGeometry,groundMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-.006;ground.receiveShadow=true;scene.add(ground);
 on(selector,'change',load);on($('#walking'),'click',()=>{walking=!walking;$('#walking').setAttribute('aria-pressed',String(walking));$('#walking').textContent=walking?'Caminando':'En reposo';if(actor)actor.walking=walking;status.textContent=selector.selectedOptions[0].textContent+' · Best 3D · '+(walking?'caminando':'en reposo');});
 on($('#full'),'click',()=>focus());on($('#face'),'click',()=>focus(true));
 const zoom=factor=>{distance=clamp(distance*factor,.35,8);cameraFrame();};on($('#zoom-in'),'click',()=>zoom(.8));on($('#zoom-out'),'click',()=>zoom(1.25));
 on(canvas,'pointerdown',event=>{if(event.button!==0)return;canvas.focus();drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture?.(event.pointerId);});
 on(canvas,'pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;angle-=(event.clientX-drag.x)*.007;elevation=clamp(elevation+(event.clientY-drag.y)*.004,-.18,1.2);drag.x=event.clientX;drag.y=event.clientY;cameraFrame();});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])on(canvas,name,()=>drag=null);
 on(canvas,'wheel',event=>{event.preventDefault();zoom(Math.exp(event.deltaY*.001));},{passive:false});
 on(canvas,'keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0','Home'].includes(event.key))return;event.preventDefault();if(event.key==='0'||event.key==='Home')return focus();if(event.key==='+'||event.key==='=')return zoom(.8);if(event.key==='-')return zoom(1.25);if(event.key==='ArrowLeft')angle-=.15;if(event.key==='ArrowRight')angle+=.15;if(event.key==='ArrowUp')elevation=clamp(elevation+.1,-.18,1.2);if(event.key==='ArrowDown')elevation=clamp(elevation-.1,-.18,1.2);cameraFrame();});
 on(canvas,'webglcontextlost',event=>{event.preventDefault();if(!contextLost)showStaticFallback('La conexión gráfica se ha interrumpido.');});
 resize=new ResizeObserver(cameraFrame);resize.observe(canvas);
 function tick(now){if(disposed||contextLost)return;try{if(!document.hidden){model?.animate(now,actor);renderer.render(scene,camera);}frame=requestAnimationFrame(tick);}catch{showStaticFallback('No se pudo dibujar el personaje en 3D.');}}
 cameraFrame();frame=requestAnimationFrame(tick);void load();
}catch{showStaticFallback('El visor 3D no está disponible en este navegador.');}
