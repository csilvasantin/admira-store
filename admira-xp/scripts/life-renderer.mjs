import {createLibraryRuntime} from '../../inventario/cafebreria/library-runtime.mjs?v=windows-menu-1';
import * as T from './premium-three.mjs';
import {createLifeScene} from './life-scene.mjs?v=pixeria-screens-3';
import {numericPartForHit,createPartHighlight} from './shelf-parts.mjs?v=shelf-products-1';
import {inventoryIdFor} from './furniture-asset.mjs?v=windows-menu-1';
import {furnitureBounds,isSolidFurniture} from './furniture-geometry.mjs?v=imported-space-1';
import {mappedCameraFrame,fitBoxFrame} from './life-camera.mjs';
import {appendPassageOverlay} from './passage-overlay.mjs?v=check-passage-1';
import {physicalColliders} from './physical-colliders.mjs?v=actor-collision-20261004-1';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
/** Presentation only: no simulation, media owner or autonomous animation loop. */
export function createLifeRenderer({canvas,snapshot,getPlayer=()=>null,getSurfacePreview=()=>null,getScreenPreview=()=>null,onSelect=()=>{},onCameraChange=()=>{},assetQuality='better',sceneFactory=createLifeScene,stockCamera=false}={}){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.setClearColor('#e7e8dc');renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  let model;
  try{model=sceneFactory(snapshot,{
    assetQuality,
    loadFurniture:item=>import('./furniture-asset.mjs?v=windows-menu-1').then(m=>m.loadFurniture(item,assetQuality)),
    loadPerson:assetQuality==='best'?actor=>import('./best-person-asset.mjs?v=visitors-24').then(m=>m.loadBestPerson(actor)):null
  });}catch(error){renderer.dispose();renderer.forceContextLoss();throw error;}
  const camera=new T.OrthographicCamera(-15,15,10,-10,.1,200);
  const target=new T.Vector3(),raycaster=new T.Raycaster(),pointers=new Map();
  let clipBox=null;
  let width=1,height=1,lastMedia=-Infinity,disposed=false,gesture=null,selected=null,selectedId=null,editor=null,drag=null;
  let partMode=false,partNumericId=null,partHighlight=null,partRoot=null,partAsset=null;
  const nativeShelf=node=>assetQuality==='best'&&model.snapshot.venue!=='alsea-sbux-021'&&node?.userData.item?.type==='shelves'&&node.userData.item.id!=='sb-mugs'&&inventoryIdFor(node.userData.item)==='native:shelves';
  function clearPart(){partHighlight?.dispose();partHighlight=null;partRoot=null;partAsset=null;partNumericId=null;}
  function refreshPart(){
    if(!partNumericId||!selected?.parent||!nativeShelf(selected)){if(partNumericId)clearPart();return;}
    const asset=selected.children[0];if(partRoot!==selected||partAsset!==asset){partHighlight?.dispose();partHighlight=createPartHighlight(selected,model.scene);partRoot=selected;partAsset=asset;partHighlight.select(partNumericId);}else if(partHighlight.selected()!==partNumericId)partHighlight.select(partNumericId);
    partHighlight.update();halo.visible=false;
  }
  function setPartMode(value){partMode=!!value&&assetQuality==='best'&&!editor&&model.snapshot.venue!=='alsea-sbux-021';if(!partMode)clearPart();}
  function selectPart(instanceId,numericId){
    if(!partMode||editor||!Number.isSafeInteger(numericId)||numericId<1){clearPart();return;}
    selectItem(instanceId);if(!nativeShelf(selected)){clearPart();return;}partNumericId=numericId;refreshPart();
  }
  const initial=mappedCameraFrame(model.snapshot);
  const current={zoom:1,angle:initial.angle,elevation:initial.elevation,panX:0,panY:0};let desired={...current},mode='mapped',framing='mapped';
  const angleLimit=v=>stockCamera?v:clamp(v,.10,Math.PI/2-.10),zoomLimit=v=>clamp(v,stockCamera?.25:.7,stockCamera?24:3.2);
  const cameraState=()=>Object.freeze({mode,registration:framing==='mapped'?mappedCameraFrame(model.snapshot,width,height).registration:'room-fit',...desired});
  function changeMode(next){if(mode!==next){mode=next;onCameraChange(cameraState());}}
  const haloGeometry=new T.RingGeometry(.55,.59,64),haloMaterial=new T.MeshBasicMaterial({color:'#4d967a',transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide});
  const halo=new T.Mesh(haloGeometry,haloMaterial);halo.rotation.x=-Math.PI/2;halo.position.y=.035;halo.visible=false;model.scene.add(halo);
  function frameCamera(){
    const s=stockCamera==='furniture'?snapshot:model.snapshot,radius=Math.max(Math.hypot(s.cols,s.rows),s.wallHeight)*2.8,{angle,elevation,zoom,panX,panY}=current;
    target.set(s.cols*.5,stockCamera==='furniture'?s.wallHeight/2:.65,s.rows*.5);
    camera.position.set(target.x+Math.cos(angle)*Math.cos(elevation)*radius,target.y+Math.sin(elevation)*radius,target.z+Math.sin(angle)*Math.cos(elevation)*radius);
    camera.lookAt(target);camera.updateMatrixWorld(true);
    // Modo detalle (#ver-mueble): recorta lo que queda entre la cámara y el objeto encuadrado.
    let near=.1;if(clipBox){const dir=camera.getWorldDirection(new T.Vector3());let d=Infinity;for(const x of [clipBox.min.x,clipBox.max.x])for(const y of [clipBox.min.y,clipBox.max.y])for(const z of [clipBox.min.z,clipBox.max.z])d=Math.min(d,new T.Vector3(x,y,z).sub(camera.position).dot(dir));near=Math.max(.1,d-.06);}
    if(camera.near!==near){camera.near=near;camera.updateProjectionMatrix();}
    const mapped=framing==='mapped'?mappedCameraFrame(s,width,height):null;
    if(mapped?.frustum){
      const f=mapped.frustum,centerX=(f.left+f.right)/2+panX,centerY=(f.top+f.bottom)/2+panY;
      const horizontal=(f.right-f.left)/zoom,vertical=(f.top-f.bottom)/zoom;
      camera.left=centerX-horizontal/2;camera.right=centerX+horizontal/2;camera.top=centerY+vertical/2;camera.bottom=centerY-vertical/2;camera.updateProjectionMatrix();return;
    }
    const {minX,maxX,minY,maxY}=roomExtents(camera,s);
    const aspect=width/height,vertical=Math.max(maxY-minY,(maxX-minX)/aspect)*1.06/zoom,horizontal=vertical*aspect;
    const centerX=(minX+maxX)/2+panX,centerY=(minY+maxY)/2+panY;
    camera.left=centerX-horizontal/2;camera.right=centerX+horizontal/2;camera.top=centerY+vertical/2;camera.bottom=centerY-vertical/2;camera.updateProjectionMatrix();
  }
  function roomExtents(cam,s){
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    const pad=stockCamera==='furniture'?Math.max(s.cols,s.rows,s.wallHeight)*.12:null;
    for(const x of [pad===null?-.8:-pad,s.cols+(pad??2.1)])for(const y of [pad===null?-.5:-pad,s.wallHeight+(pad??.5)])for(const z of [pad===null?-.7:-pad,s.rows+(pad??1.2)]){
      const p=new T.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse);
      minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
    }
    return {minX,maxX,minY,maxY};
  }
  // «Ver» en el inventario: anima la órbita existente hasta encuadrar la caja del objeto.
  function frameObject(object,{margin=1.4,angle:fixedAngle,elevation:fixedElevation,clip=false}={}){
    if(disposed||!object)return false;
    model.scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(object);if(box.isEmpty())return false;
    const s=stockCamera==='furniture'?snapshot:model.snapshot,radius=Math.max(Math.hypot(s.cols,s.rows),s.wallHeight)*2.8;
    const angle=Number.isFinite(fixedAngle)?fixedAngle:desired.angle,elevation=Number.isFinite(fixedElevation)?clamp(fixedElevation,.02,Math.PI/2-.001):clamp(desired.elevation,.35,1.0),aim=new T.Vector3(s.cols*.5,stockCamera==='furniture'?s.wallHeight/2:.65,s.rows*.5);
    const cam=new T.OrthographicCamera();cam.position.set(aim.x+Math.cos(angle)*Math.cos(elevation)*radius,aim.y+Math.sin(elevation)*radius,aim.z+Math.sin(angle)*Math.cos(elevation)*radius);cam.lookAt(aim);cam.updateMatrixWorld(true);
    const ext={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).applyMatrix4(cam.matrixWorldInverse);ext.minX=Math.min(ext.minX,p.x);ext.maxX=Math.max(ext.maxX,p.x);ext.minY=Math.min(ext.minY,p.y);ext.maxY=Math.max(ext.maxY,p.y);}
    const fit=fitBoxFrame(roomExtents(cam,s),ext,width/height,margin);
    desired={...desired,angle,elevation,zoom:zoomLimit(fit.zoom),panX:fit.panX,panY:fit.panY};framing='room-fit';clipBox=clip?box.clone().expandByScalar(.02):null;mode='free';onCameraChange(cameraState());return true;
  }
  function pick(x,y,objects){
    const bounds=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1),camera);
    model.scene.updateMatrixWorld(true);
    return raycaster.intersectObjects(objects,true).filter(hit=>{for(let n=hit.object;n;n=n.parent)if(!n.visible)return false;return true;});
  }
  function screenAt(x,y){if(disposed||document.elementFromPoint(x,y)!==canvas)return null;const hit=pick(x,y,[model.world]).find(hit=>hit.object.userData.screenTarget||(hit.object.userData.liveMedia&&hit.object.userData.surfaceId));return hit?.object.userData.screenTarget||hit?.object.userData.surfaceId||null;}
  let dropOutline=null,dropId=null;
  function clearDropOutline(){dropOutline?.geometry.dispose();dropOutline?.material.dispose();dropOutline?.removeFromParent();dropOutline=null;dropId=null;}
  function screenHighlight(id){if(id===dropId)return;clearDropOutline();canvas.dataset.screenDropTarget=id||'';if(!id)return;let mesh;model.world.traverse(node=>{if(node.userData.surfaceId===id&&node.userData.liveMedia)mesh=node;});if(!mesh)return;dropOutline=new T.LineSegments(new T.EdgesGeometry(mesh.geometry),new T.LineBasicMaterial({color:'#78f3ff',depthTest:false}));dropOutline.renderOrder=10000;mesh.add(dropOutline);dropId=id;}

  function clearClip(){clipBox=null;}
  function project(v){const p=new T.Vector3(v.x,v.y,v.z).project(camera),b=canvas.getBoundingClientRect();return {x:b.left+(p.x+1)/2*b.width,y:b.top+(1-p.y)/2*b.height};}
  function resize(w,h,dpr=globalThis.devicePixelRatio||1){if(disposed)return;width=Math.max(1,w);height=Math.max(1,h);renderer.setPixelRatio(clamp(dpr,1,1.75));renderer.setSize(width,height,false);frameCamera();}
  function update(next){if(disposed)return;model.update(next);if(selectedId)selectItem(selectedId);refreshPart();if(mode==='mapped'){const mapped=mappedCameraFrame(model.snapshot);desired.angle=current.angle=mapped.angle;desired.elevation=current.elevation=mapped.elevation;}}
  function selectAt(x,y){
    const bounds=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1),camera);
    model.scene.updateMatrixWorld(true);selected=null;let selectedHit;
    for(const hit of raycaster.intersectObjects([model.world,model.actors],true)){
      let visible=true;for(let n=hit.object;n;n=n.parent)if(!n.visible)visible=false;if(!visible)continue;
      for(let node=hit.object;node;node=node.parent){if(node.userData.item||node.userData.actor){selected=node;break;}}
      if(selected){selectedHit=hit;break;}
    }
    if(!editor&&libraries.select(selected)){selected=null;selectedId=null;halo.visible=false;return;}
    selectedId=selected?.userData.item?.id??null;halo.visible=!!selected;
    if(partMode&&!editor&&nativeShelf(selected)){
      const numericId=numericPartForHit(selectedHit);if(numericId){selectPart(selectedId,numericId);onSelect({item:selected.userData.item,layoutId:selectedId,partNumericId:numericId});return;}
    }
    clearPart();onSelect(selected?.userData||null);
  }
  function render(now=performance.now()){
    if(disposed)return;
    for(const key of Object.keys(current))current[key]+=(desired[key]-current[key])*.16;
    frameCamera();model.animate(now);libraries.reconcile(model.world);
    if(now-lastMedia>125){model.refreshMedia(getPlayer(),getSurfacePreview(),getScreenPreview());canvas.dataset.screenPreviewIds=model.screenPreviewIds.join(',');lastMedia=now;}
    if(selected){if(!selected.parent){selected=null;halo.visible=false;}else{const item=selected.userData.item,p=item?new T.Vector3(item.col,0,item.row):selected.getWorldPosition(new T.Vector3());halo.position.set(p.x,.04,p.z);}}
    refreshPart();renderer.render(model.scene,camera);
  }
  const pinchDistance=()=>{const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;};
  const handlers={
    pointerdown(event){
      if(event.button!==0&&event.button!==2)return;
      if(editor&&event.button===0&&!event.shiftKey){
        if(drag)return;
        selectAt(event.clientX,event.clientY);const point=floorPoint(event.clientX,event.clientY),item=selected?.userData.item;
        if(point&&item){drag={pointer:event.pointerId,point,col:item.col,row:item.row};canvas.setPointerCapture?.(event.pointerId);canvas.focus();}
        return;
      }
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.setPointerCapture?.(event.pointerId);
      gesture={x:event.clientX,y:event.clientY,...desired,pinch:pinchDistance(),moved:false,pan:event.shiftKey||event.button===2};
    },
    pointermove(event){
      if(drag&&event.pointerId===drag.pointer){const point=floorPoint(event.clientX,event.clientY);if(point)editor?.onPreview?.({col:Math.round((drag.col+point.x-drag.point.x)*4)/4,row:Math.round((drag.row+point.z-drag.point.z)*4)/4});return;}
      if(!pointers.has(event.pointerId)||!gesture)return;pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(Math.hypot(dx,dy)>5)gesture.moved=true;
      if(!gesture.moved&&pointers.size===1)return;
      changeMode('free');
      if(pointers.size>1){if(gesture.pinch>0)desired.zoom=zoomLimit(gesture.zoom*pinchDistance()/gesture.pinch);gesture.moved=true;}
      else if(gesture.pan){desired.panX=gesture.panX-dx/width*(camera.right-camera.left);desired.panY=gesture.panY+dy/height*(camera.top-camera.bottom);}
      else{clipBox=null;desired.angle=angleLimit(gesture.angle-dx*.005);desired.elevation=clamp(gesture.elevation+dy*.003,stockCamera?.02:.32,stockCamera?Math.PI/2-.001:1.16);}
    },
    pointerup(event){
      if(drag&&event.pointerId===drag.pointer){drag=null;editor?.onCommit?.();return;}
      if(gesture&&!gesture.moved&&pointers.size===1)selectAt(event.clientX,event.clientY);pointers.delete(event.pointerId);
      const remaining=[...pointers.values()][0];gesture=remaining?{...remaining,...desired,pinch:0,moved:true,pan:false}:null;
    },
    pointercancel(event){if(drag?.pointer===event.pointerId){drag=null;editor?.onCancel?.();}pointers.delete(event.pointerId);gesture=null;},
    wheel(event){event.preventDefault();desired.zoom=zoomLimit(desired.zoom*Math.exp(-event.deltaY*.001));changeMode('free');},
    contextmenu(event){event.preventDefault();}
  };
  for(const [event,handler]of Object.entries(handlers))canvas.addEventListener(event,handler,{passive:false});
  function preset(name){
    clipBox=null;desired={zoom:1,angle:Math.PI/4,elevation:.64,panX:0,panY:0};framing=name==='mapped'?'mapped':'room-fit';
    if(name==='mapped'){const mapped=mappedCameraFrame(model.snapshot,width,height);Object.assign(desired,{angle:mapped.angle,elevation:mapped.elevation});Object.assign(current,desired);}
    if(name==='floor')desired.elevation=stockCamera?Math.PI/2-.001:1.12;if(stockCamera&&name==='front')Object.assign(desired,{angle:Math.PI/2,elevation:.02});if(name==='detail')Object.assign(desired,{zoom:1.65,angle:.88,elevation:.51});
    const next=name==='mapped'?'mapped':'free';mode=next;onCameraChange(cameraState());frameCamera();
  }
  function rotate(direction){clipBox=null;desired.angle=angleLimit(desired.angle+direction*.18);changeMode('free');}
  function zoomBy(factor){desired.zoom=zoomLimit(desired.zoom*factor);changeMode('free');}
  function clearSelection(){selected=null;selectedId=null;halo.visible=false;clearPart();onSelect(null);}
  function setLighting(mode){model.setLighting(mode);renderer.setClearColor(mode==='night'?'#202d3d':mode==='sunset'?'#e9d9c4':'#e7e8dc');}
  const overlay=new T.Group();overlay.name='distribuit:hardness';model.scene.add(overlay);
  function selectItem(id){selectedId=id??null;selected=null;model.world.traverse(node=>{if(node.userData.item&&String(node.userData.item.id)===String(id))selected=node;});halo.visible=!!selected;}
  function floorPoint(x,y){const bounds=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((x-bounds.left)/bounds.width*2-1,-(y-bounds.top)/bounds.height*2+1),camera);return raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());}
  function setEditor(value){editor=value;if(editor)setPartMode(false);drag=null;gesture=null;pointers.clear();}
  function clearOverlay(){for(const child of [...overlay.children]){child.geometry.dispose();child.material.dispose();overlay.remove(child);}}
  function setEditorOverlay(value){
    clearOverlay();if(!value)return;
    const {scene,selectedId,showMap,candidate,valid,passage}=value;
    function outline(b,color){const g=new T.BufferGeometry().setFromPoints([new T.Vector3(b.minCol,.075,b.minRow),new T.Vector3(b.maxCol,.075,b.minRow),new T.Vector3(b.maxCol,.075,b.maxRow),new T.Vector3(b.minCol,.075,b.maxRow),new T.Vector3(b.minCol,.075,b.minRow)]);const m=new T.LineBasicMaterial({color,transparent:true,opacity:.8,depthTest:false});const line=new T.Line(g,m);line.renderOrder=15;overlay.add(line);}
    if(showMap){
      outline({minCol:0,minRow:0,maxCol:scene.cols,maxRow:scene.rows},'#86e3bd');
      for(const item of scene.layout)if(isSolidFurniture({...item,hidden:false})&&String(item.id)!==String(selectedId))outline(furnitureBounds(item,scene.footprints),'#ea9e77');
      for(const cell of scene.hardness?.fixed||[]){const [col,row]=cell.split(',').map(Number);outline({minCol:col,maxCol:col+1,minRow:row,maxRow:row+1},'#ea9e77');}
      const mapScene=passage?.doorMode==='open'?{...scene,doorOpen:1}:scene;
      const supplied=[...(scene.colliders||[]),...(scene.hardness?.colliders||[])].filter(c=>{
        const id=String(c.id),structural=id.startsWith('architecture:')||c.kind==='architecture'||c.kind==='hardness';
        return id!=='architecture:door-leaf'&&(structural||(!id.startsWith('geometry:')&&c.itemId==null&&c.kind!=='furniture'&&!scene.layout.some(item=>String(item.id)===id)));
      });
      for(const collider of supplied.concat(physicalColliders(mapScene)))outline(collider,'#ea9e77');
      appendPassageOverlay(overlay,passage);
    }
    const item=scene.layout.find(i=>String(i.id)===String(selectedId));
    if(item){const b=furnitureBounds({...item,...candidate},scene.footprints);outline(b,valid===false?'#ff6457':'#70f2b4');const g=new T.PlaneGeometry(b.maxCol-b.minCol,b.maxRow-b.minRow),m=new T.MeshBasicMaterial({color:valid===false?'#ff6457':'#70f2b4',transparent:true,opacity:.2,depthTest:false,depthWrite:false,side:T.DoubleSide}),mesh=new T.Mesh(g,m);mesh.rotation.x=-Math.PI/2;mesh.position.set((b.minCol+b.maxCol)/2,.07,(b.minRow+b.maxRow)/2);mesh.renderOrder=14;overlay.add(mesh);}
  }
  function peopleStatus(){
    const result={ready:0,loading:0,fallback:0,total:0};
    for(const actor of model.actors.children){const status=actor.userData.personAssetStatus;if(status&&Object.hasOwn(result,status)){result[status]++;result.total++;}}
    return result;
  }
  function dispose(){if(disposed)return;disposed=true;clearDropOutline();for(const [event,handler]of Object.entries(handlers))canvas.removeEventListener(event,handler);pointers.clear();libraries.dispose();clearPart();clearOverlay();overlay.removeFromParent();haloGeometry.dispose();haloMaterial.dispose();halo.removeFromParent();model.dispose();renderer.dispose();renderer.forceContextLoss();}
  const libraryViewer={frameObject,pick,clearClip,project,preset,invalidateShadows:()=>{renderer.shadowMap.needsUpdate=true;}};
  const libraries=createLibraryRuntime({canvas,scene:model.scene,viewer:libraryViewer,isEditing:()=>!!editor});
  resize(canvas.clientWidth||1000,canvas.clientHeight||700);
  onCameraChange(cameraState());
  return {invalidateShadows:()=>{renderer.shadowMap.needsUpdate=true;},frameObject,pick,screenAt,screenHighlight,clearClip,project,get clipping(){return !!clipBox;},setEditor,setEditorOverlay,setPartMode,selectPart,selectItem,resize,update,render,preset,rotate,zoomBy,setLighting,clearSelection,dispose,get bestPeopleCount(){return peopleStatus().ready;},get bestPeopleStatus(){return peopleStatus();},get blenderAssets(){return model.world.children.filter(o=>o.userData.assetStatus==='ready').length;},get blenderCounters(){return model.world.children.filter(o=>o.userData.type==='counter'&&o.userData.assetStatus==='ready').length;},get snapshot(){return model.snapshot;},get cameraState(){return cameraState();}};
}
