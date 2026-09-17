import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {loadCatalog} from '../model.mjs?v=catalog-43';
import {cloneFurniture,furnitureURL} from '../../admira-xp/scripts/furniture-asset.mjs';
const $=s=>document.querySelector(s),canvas=$('#scene'),status=$('#progress');
let renderer,disposed=false,revision=0,angle=.7,elevation=.8,distance=36,drag=null,objects=[],assets=[],selected=null;
const owned=new Set(),events=[],target=new T.Vector3(0,0,0),scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.02,200),ray=new T.Raycaster();
const on=(el,name,fn,options)=>{el.addEventListener(name,fn,options);events.push(()=>el.removeEventListener(name,fn,options));};
function draw(){if(disposed||!renderer)return;const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();camera.position.copy(target).add(new T.Vector3(Math.sin(angle)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(angle)*Math.cos(elevation)*distance));camera.lookAt(target);renderer.render(scene,camera);}
function overview(){for(const o of objects)o.visible=true;for(const o of scene.children)if(o.userData.displayNumber)o.visible=true;target.set(0,0,0);angle=.7;elevation=.85;distance=canvas.clientWidth<700?55:36;selected=null;$('#piece').value='all';$('#selection').textContent='Arrastra para girar · rueda para acercar · pulsa una pieza';$('#download').hidden=true;draw();}
function focus(number){const o=objects.find(o=>o.userData.number===number),a=assets.find(a=>a.number===number);if(!o||!a){status.textContent='Esta pieza todavía se está cargando.';return;}selected=number;for(const model of objects)model.visible=model===o;for(const fixture of scene.children)if(fixture.userData.displayNumber)fixture.visible=fixture.userData.displayNumber===number;const box=new T.Box3().setFromObject(o);target.copy(box.getCenter(new T.Vector3()));distance=5;elevation=.38;$('#piece').value=String(number);$('#selection').textContent=number+'. '+a.name+' · arrastra para ver laterales y trasera';$('#download').href=furnitureURL(number,$('#quality').value);$('#download').hidden=false;draw();}
async function build(){
 const current=++revision,tier=$('#quality').value;for(const o of objects){scene.remove(o);}objects=[];overview();let count=0,failed=[];
 for(const a of assets){
  if(disposed||current!==revision)return;
  try{const model=await cloneFurniture(a.number,tier);if(disposed||current!==revision)return;
   const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=2.2/Math.max(size.x,size.y,size.z,.1);
   const group=new T.Group();group.userData.number=a.number;model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);group.add(model);group.position.set(((a.number-1)%8-3.5)*3.1,0,(Math.floor((a.number-1)/8)-2.5)*3.1);scene.add(group);objects.push(group);count++;
  }catch{failed.push(a.number);}
  status.textContent=count+' / 43 modelos '+tier+' cargados'+(failed.length?' · error en '+failed.join(', '):'');draw();await new Promise(r=>requestAnimationFrame(r));
 }
 if(current===revision)status.textContent=failed.length?'No se pudieron cargar las piezas '+failed.join(', ')+'. Cambia de acabado para reintentar.':'43 / 43 · '+tier+' · pulsa una pieza para acercarte';
}
try{
 renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;scene.background=new T.Color('#e7ebe2');scene.add(new T.HemisphereLight('#ffffff','#788970',2.6));const light=new T.DirectionalLight('#fff0d8',3.3);light.position.set(8,15,12);scene.add(light);const fill=new T.DirectionalLight('#dce9fb',1.2);fill.position.set(-8,7,-10);scene.add(fill);
 ({assets}=await loadCatalog());
 const padGeo=new T.BoxGeometry(2.8,.08,2.8),padMat=new T.MeshStandardMaterial({color:'#d4ddce',roughness:1});owned.add(padGeo);owned.add(padMat);
 for(const a of assets){const option=document.createElement('option');option.value=a.number;option.textContent=a.number+'. '+a.name;$('#piece').append(option);
  const x=((a.number-1)%8-3.5)*3.1,z=(Math.floor((a.number-1)/8)-2.5)*3.1,pad=new T.Mesh(padGeo,padMat);pad.userData.displayNumber=a.number;pad.position.set(x,-.045,z);scene.add(pad);
  const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#294c3a';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText(a.number+'. '+a.name,256,56,490);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide}),geo=new T.PlaneGeometry(2.8,.525),label=new T.Mesh(geo,mat);label.userData.displayNumber=a.number;label.rotation.x=-Math.PI/2;label.position.set(x,.008,z+1.32);scene.add(label);owned.add(tex);owned.add(mat);owned.add(geo);
 }
 on($('#piece'),'change',()=>$('#piece').value==='all'?overview():focus(Number($('#piece').value)));on($('#quality'),'change',build);on($('#reset'),'click',overview);
 on($('#zoom-in'),'click',()=>{distance=Math.max(2,distance*.8);draw();});on($('#zoom-out'),'click',()=>{distance=Math.min(70,distance*1.25);draw();});
 on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
 on(canvas,'pointermove',e=>{if(!drag)return;drag.moved ||=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5;angle-=(e.clientX-drag.x)*.008;elevation=Math.max(.07,Math.min(1.4,elevation+(e.clientY-drag.y)*.006));drag.x=e.clientX;drag.y=e.clientY;draw();});
 on(canvas,'pointerup',e=>{if(drag&&!drag.moved){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(objects,true)[0];if(hit)for(let o=hit.object;o;o=o.parent)if(o.userData.number){focus(o.userData.number);break;}}drag=null;});
 for(const n of ['pointercancel','lostpointercapture'])on(canvas,n,()=>drag=null);
 on(canvas,'wheel',e=>{e.preventDefault();distance=Math.max(2,Math.min(70,distance*Math.exp(e.deltaY*.001)));draw();},{passive:false});
 on(canvas,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key))return;e.preventDefault();if(e.key==='Escape')return overview();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')elevation=Math.min(1.4,elevation+.1);if(e.key==='ArrowDown')elevation=Math.max(.07,elevation-.1);draw();});
 const resize=new ResizeObserver(draw);resize.observe(canvas);events.push(()=>resize.disconnect());await build();
}catch(e){status.textContent='No se pudo abrir la exposición 3D. Recarga para reintentar.';}
on(window,'pagehide',()=>{disposed=true;revision++;events.forEach(off=>off());owned.forEach(x=>x.dispose());scene.clear();renderer?.dispose();renderer?.forceContextLoss();});
