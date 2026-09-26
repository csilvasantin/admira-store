import {createLifeSnapshot} from './life-snapshot.mjs?v=px-1';
import {buildCustomerNavigation} from './customer-navigation.mjs?v=customer-motion-1';
import {assetForInstance} from '../../inventario/model.mjs?v=catalog-43';
import {projectMatrixFloor} from './matrix-floor.mjs?v=matrix-furniture-1';
import {MATRIX_ATLAS_URL,MATRIX_ATLAS_SIZE,MATRIX_ARCHITECTURE_DETAILS,photoPieceFor} from './matrix-photo-pieces.mjs?v=customer-motion-1';

const MANIFEST_URL=new URL('../assets/matrix-furniture/catalog/manifest.json',import.meta.url);
const SVG='http://www.w3.org/2000/svg';
const [AW,AH]=MATRIX_ATLAS_SIZE;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(n,fallback)=>Number.isFinite(n)?n:fallback;
let sequence=0,assetsPromise;

function loadImage(url){return new Promise((resolve,reject)=>{
  const image=new Image();const timer=setTimeout(()=>finish(Error('Tiempo de carga agotado')),25000);
  function finish(error){clearTimeout(timer);image.onload=null;image.onerror=null;error?reject(error):resolve(image);}
  image.onload=()=>finish();image.onerror=()=>finish(Error('Imagen no disponible'));image.src=url;
});}
function loadAssets(){
  assetsPromise ||= Promise.all([
    fetch(MANIFEST_URL,{signal:AbortSignal.timeout(25000)}).then(r=>{if(!r.ok)throw Error('Catálogo Matrix no disponible');return r.json();}),
    loadImage(MATRIX_ATLAS_URL)
  ]).then(([catalog])=>{
    if(!Array.isArray(catalog.items)||catalog.items.length!==43)throw Error('Catálogo Matrix incompleto');
    return catalog;
  }).catch(error=>{assetsPromise=null;throw error;});
  return assetsPromise;
}

function bounds(polygons){
  const points=polygons.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys);return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
}
function rotation(item){return ((Math.round(finite(item.rot,0))%4)+4)%4;}
function scale(item){return {x:clamp(Math.abs(finite(item.sx,1)),.1,6),y:clamp(Math.abs(finite(item.sy,1)),.1,6)};}
function anchorFor(item,photo,scene){
  const actual=projectMatrixFloor(item.col,item.row,scene.cols,scene.rows);
  if(!photo?.wall)return actual;
  // Wall cutouts keep their mounting height while following layout changes.
  const original=projectMatrixFloor(photo.base[0],photo.base[1],scene.cols,scene.rows);
  return {x:actual.x+photo.target[0]-original.x,y:actual.y+photo.target[1]-original.y,depth:actual.depth};
}

function calibratePhotoGround(photo,placement){
  const zone=placement.floorZone,supports=photo.ground;
  if(placement.wall||!zone||!Array.isArray(supports)||supports.length<3)return null;
  const center={x:zone.reduce((sum,p)=>sum+p[0],0)/zone.length,y:zone.reduce((sum,p)=>sum+p[1],0)/zone.length,depth:placement.floorCenter?.depth??placement.anchor.depth};
  const source=[supports.reduce((sum,p)=>sum+p[0],0)/supports.length,supports.reduce((sum,p)=>sum+p[1],0)/supports.length];
  const offsets=supports.map(p=>[(p[0]-source[0])/AW*placement.sx*(placement.flip?-1:1),(p[1]-source[1])/AH*placement.sy]);
  let factor=photo.scale;
  // The four projected corners form a convex floor polygon. Every support
  // remains inside every edge half-plane after the final CSS scale/mirror.
  const area=zone.reduce((sum,p,i)=>sum+p[0]*zone[(i+1)%zone.length][1]-zone[(i+1)%zone.length][0]*p[1],0),sign=Math.sign(area)||1;
  for(let i=0;i<zone.length;i++){
    const a=zone[i],b=zone[(i+1)%zone.length],dx=b[0]-a[0],dy=b[1]-a[1];
    const room=sign*(dx*(center.y-a[1])-dy*(center.x-a[0]));
    for(const offset of offsets){const change=sign*(dx*offset[1]-dy*offset[0]);if(change<0)factor=Math.min(factor,room/-change);}
  }
  factor=Math.max(0,factor*.995);
  return {anchor:center,source,factor,supports:offsets.map(p=>[center.x+p[0]*factor,center.y+p[1]*factor])};
}

/** Pure, read-only presentation plan. IDs stay instance IDs, not array indices. */
export function planMatrixFurniture(scene,catalog){
  if(!scene)return [];
  const byIdentity=new Map(catalog.items.map(p=>[p.inventoryId,p]));
  const footprints=new Map(buildCustomerNavigation(scene,{radius:0}).obstacles.map(obstacle=>[obstacle.id,obstacle]));
  const placements=[];
  for(const item of scene.layout||[]){
    if(!item||!Number.isFinite(item.col)||!Number.isFinite(item.row))continue;
    const record=byIdentity.get(assetForInstance(item));
    if(!record){placements.push({id:item.id,number:null,label:item.label||item.type,unsupported:true});continue;}
    const rot=rotation(item);let photo=rot===0?photoPieceFor(item,record.number):null;
    const anchor=anchorFor(item,photo,scene),s=scale(item);
    const common={id:String(item.id),number:record.number,label:item.label||record.name||`Mueble ${record.number}`,anchor,
      flip:!!item.flipX!==!!photo?.mirrorX,sx:s.x,sy:s.y,wall:!!photo?.wall||['led','tft','aroma'].includes(item.type),item};
    const footprint=footprints.get(String(item.id));common.footprint=footprint||null;
    common.floorZone=footprint?[[footprint.minCol,footprint.minRow],[footprint.maxCol,footprint.minRow],
      [footprint.maxCol,footprint.maxRow],[footprint.minCol,footprint.maxRow]].map(([col,row])=>{
        const point=projectMatrixFloor(col,row,scene.cols,scene.rows);return [point.x,point.y];
      }):null;
    common.floorCenter=footprint?projectMatrixFloor((footprint.minCol+footprint.maxCol)/2,(footprint.minRow+footprint.maxRow)/2,scene.cols,scene.rows):null;
    common.depthY=!common.wall&&common.floorZone?Math.max(...common.floorZone.map(point=>point[1])):anchor.y;
    let calibration=photo?calibratePhotoGround(photo,common):null;
    if(calibration&&calibration.factor/photo.scale<.60){
      // A photograph taken from an incompatible orientation must not become a
      // miniature just to fit. The catalog already has the correct Blender view.
      common.photoFallback='orientation-fit';common.flip=!!item.flipX;photo=null;calibration=null;
    }
    if(photo){
      const box=bounds(photo.polygons);
      const factor=calibration?.factor??photo.scale,source=calibration?.source??photo.anchor,groundAnchor=calibration?.anchor??anchor;
      placements.push({...common,anchor:groundAnchor,kind:'photo',photo,box,groundSupports:calibration?.supports||null,groundScale:factor,
        left:groundAnchor.x-(source[0]-box.x)/AW*factor,
        top:groundAnchor.y-(source[1]-box.y)/AH*factor,
        width:box.width/AW*factor,height:box.height/AH*factor,
        origin:[(source[0]-box.x)/box.width,(source[1]-box.y)/box.height]});
    }else{
      const view=record.views.find(v=>v.rotation===rot);
      if(!view){placements.push({...common,unsupported:true});continue;}
      const origin=projectMatrixFloor(0,0,scene.cols,scene.rows),col=projectMatrixFloor(1,0,scene.cols,scene.rows);
      const targetPixelsPerUnit=Math.abs(col.x-origin.x)*AW*Math.SQRT2;
      // Pixeria stores the intended display height in the shared scene. Its
      // Blender source uses a normalized model height, so restore that scale.
      const modelHeight=record.bounds_gltf?.max?.[1]-record.bounds_gltf?.min?.[1];
      const customScale=item.type==='custom'&&Number.isFinite(item.ph)&&modelHeight>0?clamp(item.ph/modelHeight,.1,6):1;
      const factor=targetPixelsPerUnit/view.pixelsPerGridUnit*customScale;
      const ay=anchor.y-(common.wall?finite(item.wallY,1.8)*targetPixelsPerUnit/AH:0);
      const url=new URL(view.url,new URL('../',import.meta.url)).href;
      placements.push({...common,kind:'sprite',view,url,
        left:anchor.x-view.anchor[0]/AW*factor,top:ay-view.anchor[1]/AH*factor,
        width:view.width/AW*factor,height:view.height/AH*factor,
        origin:[view.anchor[0]/view.width,view.anchor[1]/view.height]});
    }
  }
  return placements;
}

// Floor box, paint depth and on-screen rectangle (stage fractions, after the
// CSS scale about its origin) of a standing piece: what visitors sort against.
export function placementOccluder(p){
  const sx=Math.abs(p.sx??1),sy=Math.abs(p.sy??1),ox=p.left+p.origin[0]*p.width,oy=p.top+p.origin[1]*p.height;
  const x0=ox-(ox-p.left)*sx,x1=ox+(p.left+p.width-ox)*sx,y0=oy-(oy-p.top)*sy,y1=oy+(p.top+p.height-oy)*sy;
  const depthY=finite(p.depthY,p.anchor.y);
  return {id:p.id,box:p.footprint,z:10+Math.round(depthY*1000),rect:{x0:Math.min(x0,x1),x1:Math.max(x0,x1),y0,y1}};
}
export function placementZone(p){
  if(p.unsupported||p.wall)return null;
  // The projected inventory footprint owns collisions; sprite pixel dimensions
  // describe a camera view, not the area occupied on the shop floor.
  return p.floorZone||null;
}
function photoContent(photo,box,prefix){
  const svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox',`${box.x} ${box.y} ${box.width} ${box.height}`);svg.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(SVG,'defs'),clip=document.createElementNS(SVG,'clipPath');clip.id=prefix;
  for(const points of photo.polygons){const polygon=document.createElementNS(SVG,'polygon');polygon.setAttribute('points',points.map(p=>p.join(',')).join(' '));clip.append(polygon);}
  defs.append(clip);svg.append(defs);
  const image=document.createElementNS(SVG,'image');image.setAttribute('href',MATRIX_ATLAS_URL);image.setAttribute('width',AW);image.setAttribute('height',AH);image.setAttribute('preserveAspectRatio','none');image.setAttribute('clip-path',`url(#${prefix})`);svg.append(image);return svg;
}
function applyPlacement(node,p){
  // A cabinet must cover people whose feet are behind its front ground edge.
  // Its rear origin or photograph center would incorrectly draw them on top.
  const depthY=p.wall?p.anchor.y:finite(p.depthY,p.anchor.y);
  Object.assign(node.style,{left:`${p.left*100}%`,top:`${p.top*100}%`,width:`${p.width*100}%`,height:`${p.height*100}%`,
    transformOrigin:`${p.origin[0]*100}% ${p.origin[1]*100}%`,transform:`scale(${p.sx*(p.flip?-1:1)},${p.sy})`,zIndex:String(10+Math.round(depthY*1000))});
  node.setAttribute('data-furniture-depth-y',String(depthY));
  if(p.floorZone)node.setAttribute('data-furniture-floor-zone',JSON.stringify(p.floorZone));
}

export function mountMatrixFurniture(container,{getState=()=>window.__xtancoVisualState?.(),requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,onReady=()=>{},onSelect=()=>{},load=loadAssets}={}){
  if(!container)throw Error('Falta el contenedor Matrix');
  const snapshot=createLifeSnapshot(),nodes=new Map(),prefix=`matrix-furniture-${++sequence}`,layer=document.createElement('div'),status=document.createElement('p');
  layer.className='matrix-furniture-layer';status.className='matrix-furniture-status';status.setAttribute('role','status');status.textContent='Preparando el mobiliario de Matrix…';container.append(layer,status);
  let catalog,disposed=false,frame=0,last=-Infinity,reported=false,selected=null,zones=[],count=0,occluders=[];
  const decorators=[];
  function report(error=''){if(disposed||reported)return;reported=true;onReady(error);}
  function select(p){selected=p.id;onSelect({id:p.id,number:p.number,label:p.label});}
  function updateStatus(){
    const entries=[...nodes.values()],failed=entries.filter(n=>n.failed).length,loading=entries.filter(n=>!n.loaded&&!n.failed).length;
    count=entries.filter(n=>n.loaded).length;
    zones=entries.filter(n=>n.loaded&&!n.failed).map(n=>placementZone(n.current)).filter(Boolean);
    occluders=entries.filter(n=>n.loaded&&!n.failed&&n.current&&!n.current.wall&&n.current.footprint).map(n=>placementOccluder(n.current));
    status.textContent=`MATRIX · ${count} muebles visibles · inventario compartido${loading?` · ${loading} cargando`:''}${failed?` · ${failed} sin representación`:''}`;
    if(!loading)report(failed?'No se han podido cargar todos los muebles de Matrix.':'');
  }
  function update(){
    if(disposed||!catalog)return;
    let scene;try{scene=snapshot(getState?.());}catch{}
    if(!scene){for(const entry of nodes.values())entry.node?.remove();nodes.clear();zones=[];count=0;for(const node of decorators)node.hidden=true;if(selected!==null){selected=null;onSelect(null);}status.textContent='Esperando al Xtanco para mostrar su inventario…';return;}
    const plan=planMatrixFurniture(scene,catalog),active=new Set(plan.map(p=>p.id));zones=plan.map(placementZone).filter(Boolean);
    for(const [id,entry]of nodes)if(!active.has(id)){entry.node?.remove();nodes.delete(id);if(selected===id){selected=null;onSelect(null);}}
    for(const p of plan){
      const signature=p.unsupported?'unsupported':p.kind==='photo'?`photo:${p.number}:${p.photo===photoPieceFor({id:'plant3'},9)?'plant3':'base'}`:`sprite:${p.url}`;
      let entry=nodes.get(p.id);
      if(entry&&entry.signature!==signature){entry.node?.remove();nodes.delete(p.id);entry=null;}
      if(!entry){
        entry={signature,loaded:false,failed:!!p.unsupported,node:null,current:p};nodes.set(p.id,entry);
        if(p.unsupported)continue;
        const node=document.createElement('button');node.type='button';node.className='matrix-furniture-item';node.dataset.inventoryNumber=String(p.number);node.dataset.instanceId=p.id;
        node.setAttribute('aria-label',`${p.number}. ${p.label}`);node.title=`${p.number}. ${p.label}`;node.addEventListener('click',event=>{event.stopPropagation();select(entry.current);});
        if(p.kind==='photo'){node.append(photoContent(p.photo,p.box,`${prefix}-${++sequence}`));entry.loaded=true;}
        else{
          const image=document.createElement('img');image.alt='';image.draggable=false;
          const own=entry;
          image.onload=()=>{if(disposed||nodes.get(p.id)!==own)return;own.loaded=true;updateStatus();};
          image.onerror=()=>{if(disposed||nodes.get(p.id)!==own)return;own.failed=true;node.hidden=true;updateStatus();};image.src=p.url;node.append(image);
        }
        entry.node=node;layer.append(node);
      }
      entry.current=p;if(entry.node){entry.node.setAttribute('aria-label',`${p.number}. ${p.label}`);entry.node.title=`${p.number}. ${p.label}`;applyPlacement(entry.node,p);}
    }
    if(!decorators.length){
      for(const photo of MATRIX_ARCHITECTURE_DETAILS){const box=bounds(photo.polygons),node=document.createElement('div');node.className='matrix-furniture-item matrix-architecture-detail';node.append(photoContent(photo,box,`${prefix}-detail-${++sequence}`));
        applyPlacement(node,{anchor:{x:photo.target[0],y:photo.target[1]},left:photo.target[0]-(photo.anchor[0]-box.x)/AW*photo.scale,top:photo.target[1]-(photo.anchor[1]-box.y)/AH*photo.scale,width:box.width/AW*photo.scale,height:box.height/AH*photo.scale,origin:[(photo.anchor[0]-box.x)/box.width,(photo.anchor[1]-box.y)/box.height],sx:1,sy:1});node.style.pointerEvents='none';layer.append(node);decorators.push(node);}
    }
    for(const node of decorators)node.hidden=scene.moving;
    updateStatus();
  }
  function tick(now){if(disposed)return;if(!document.hidden&&now-last>=100){last=now;update();}frame=requestFrame(tick);}
  Promise.resolve().then(load).then(value=>{if(disposed)return;catalog=value;update();frame=requestFrame(tick);},()=>{if(disposed)return;status.textContent='No se ha podido cargar el mobiliario Matrix. Cambia de vista y reintenta.';report('No se ha podido cargar el mobiliario Matrix.');});
  return {update,get count(){return count;},get zones(){return zones;},get occluders(){return occluders;},dispose(){if(disposed)return;disposed=true;cancelFrame(frame);for(const e of nodes.values()){const img=e.node?.querySelector('img');if(img){img.onload=null;img.onerror=null;}}nodes.clear();zones=[];count=0;if(selected!==null){selected=null;onSelect(null);}layer.remove();status.remove();}};
}
