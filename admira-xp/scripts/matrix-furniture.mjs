import {createLifeSnapshot} from './life-snapshot.mjs?v=actor-collision-20261004-1';
import {buildCustomerNavigation} from './customer-navigation.mjs?v=actor-collision-20261004-1';
import {assetForInstance} from '../../inventario/model.mjs?v=ipad-20261005-1';
import {projectMatrixFloor} from './matrix-floor.mjs?v=matrix-furniture-1';
import {MATRIX_ATLAS_URL,MATRIX_ATLAS_SIZE,MATRIX_ARCHITECTURE_DETAILS,photoPieceFor} from './matrix-photo-pieces.mjs?v=hiperreal-vivo-1';
import {quadTransform} from './matrix-mapping.mjs?v=surface-fit-1';

const MANIFEST_URL=new URL('../assets/matrix-furniture/catalog/manifest.json',import.meta.url);
// Cycles renders of the same 43 models, each with its floor shadow and the
// measured corners of its screens (tools/xpacios-blender/render_hiperreal_sprites.py).
const HIPERREAL_URL=new URL('../assets/matrix-furniture/hiperreal/manifest.json',import.meta.url);
const ASSET_ROOT=new URL('../',import.meta.url);
const SVG='http://www.w3.org/2000/svg';
const [AW,AH]=MATRIX_ATLAS_SIZE;
// Paint order inside the room: rugs lie on the floor, shadows fall on them and
// screen light pools over both; standing pieces and visitors sort above by
// depth. A piece carried in the hand is drawn over the whole room.
export const FLOOR_Z=3,SHADOW_Z=6,POOL_Z=8,HELD_Z=1900;
const SCREEN_LONG=384,SPILL=16,SPILL_MS=120,PAINT_MS=30;
// Old 384 px catalog views of the wall screen, used only without the Hiperreal renders.
const LEGACY_TFT={0:[[125,35],[247,75],[247,170],[124,128]],3:[[135,78],[256,36],[256,125],[135,169]]};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(n,fallback)=>Number.isFinite(n)?n:fallback;
let sequence=0,assetsPromise;

function loadImage(url){return new Promise((resolve,reject)=>{
  const image=new Image();const timer=setTimeout(()=>finish(Error('Tiempo de carga agotado')),25000);
  function finish(error){clearTimeout(timer);image.onload=null;image.onerror=null;error?reject(error):resolve(image);}
  image.onload=()=>finish();image.onerror=()=>finish(Error('Imagen no disponible'));image.src=url;
});}
/** Attaches the Hiperreal renders to the base catalog by stable inventory identity. */
export function withHiperreal(catalog,hiperreal){
  const usable=view=>view&&Number.isInteger(view.rotation)&&typeof view.url==='string'&&view.width>0&&view.height>0&&view.pixelsPerGridUnit>0&&Array.isArray(view.anchor)&&view.anchor.every(Number.isFinite);
  const items=(Array.isArray(hiperreal?.items)?hiperreal.items:[]).filter(item=>item&&typeof item.inventoryId==='string'&&Array.isArray(item.views)&&item.views.every(usable));
  return {...catalog,hiperreal:new Map(items.map(item=>[item.inventoryId,item]))};
}
function loadAssets(){
  assetsPromise ||= Promise.all([
    fetch(MANIFEST_URL,{signal:AbortSignal.timeout(25000)}).then(r=>{if(!r.ok)throw Error('Catálogo Matrix no disponible');return r.json();}),
    loadImage(MATRIX_ATLAS_URL),
    // A refinement, never a requirement: without it Best keeps the base catalog.
    fetch(HIPERREAL_URL,{signal:AbortSignal.timeout(25000)}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]).then(([catalog,,hiperreal])=>{
    if(!Array.isArray(catalog.items)||catalog.items.length!==43)throw Error('Catálogo Matrix incompleto');
    return withHiperreal(catalog,hiperreal);
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

// A screen keeps the identity Good already gives it, so a preview, a pin or a
// tagged channel reaches the same player in every view of the twin.
export function screenIdFor(item,surface='main'){
  if(item?.type==='metahuman')return 'metahuman';
  if(item?.type==='tft')return 'escaparate';
  return 'inventory:'+item?.id+(surface&&surface!=='main'?':'+surface:'');
}
// Corners become fractions of the piece's own box: they survive any stage size.
function screensFor(list,item,width,height,x=0,y=0){
  return (Array.isArray(list)?list:[]).filter(screen=>Array.isArray(screen?.quad)&&screen.quad.length===4).map(screen=>({
    id:screen.id||screenIdFor(item,screen.surface),aspect:finite(screen.aspect,9/16)>0?finite(screen.aspect,9/16):9/16,
    quad:screen.quad.map(point=>[(point[0]-x)/width,(point[1]-y)/height])
  }));
}

/** Pure, read-only presentation plan. IDs stay instance IDs, not array indices. */
export function planMatrixFurniture(scene,catalog){
  if(!scene)return [];
  const byIdentity=new Map(catalog.items.map(p=>[p.inventoryId,p])),hiperreal=catalog.hiperreal instanceof Map?catalog.hiperreal:null;
  const footprints=new Map(buildCustomerNavigation(scene,{radius:0}).obstacles.map(obstacle=>[obstacle.id,obstacle]));
  const origin=projectMatrixFloor(0,0,scene.cols,scene.rows),col=projectMatrixFloor(1,0,scene.cols,scene.rows);
  const targetPixelsPerUnit=Math.abs(col.x-origin.x)*AW*Math.SQRT2;
  const placements=[];
  for(const item of scene.layout||[]){
    if(!item||!Number.isFinite(item.col)||!Number.isFinite(item.row))continue;
    const identity=assetForInstance(item),record=byIdentity.get(identity);
    if(!record){placements.push({id:item.id,number:null,label:item.label||item.type,unsupported:true});continue;}
    const rot=rotation(item);let photo=rot===0?photoPieceFor(item,record.number):null;
    const anchor=anchorFor(item,photo,scene),s=scale(item);
    const common={id:String(item.id),number:record.number,label:item.label||record.name||`Mueble ${record.number}`,anchor,
      flip:!!item.flipX!==!!photo?.mirrorX,sx:s.x,sy:s.y,wall:!!photo?.wall||['led','tft','aroma'].includes(item.type),floor:item.type==='rug',item};
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
    // Pixeria stores the intended display height in the shared scene. Its
    // Blender source uses a normalized model height, so restore that scale.
    const modelHeight=record.bounds_gltf?.max?.[1]-record.bounds_gltf?.min?.[1];
    const customScale=item.type==='custom'&&Number.isFinite(item.ph)&&modelHeight>0?clamp(item.ph/modelHeight,.1,6):1;
    const fine=hiperreal?.get(identity)?.views.find(v=>v.rotation===rot)||null,cast=fine?.shadow;
    // The shadow is rendered from the model standing on its own layout origin:
    // it follows the floor footprint, never the height or the picture in use.
    if(!common.wall&&!common.floor&&cast?.url&&cast.pixelsPerGridUnit>0){
      const factor=targetPixelsPerUnit/cast.pixelsPerGridUnit*customScale,point=photo?projectMatrixFloor(item.col,item.row,scene.cols,scene.rows):anchor;
      common.shadow={url:new URL(cast.url,ASSET_ROOT).href,left:point.x-cast.anchor[0]/AW*factor,top:point.y-cast.anchor[1]/AH*factor,
        width:cast.width/AW*factor,height:cast.height/AH*factor,origin:[cast.anchor[0]/cast.width,cast.anchor[1]/cast.height],sx:s.x*(item.flipX?-1:1),sy:s.x};
    }else common.shadow=null;
    if(photo){
      const box=bounds(photo.polygons);
      const factor=calibration?.factor??photo.scale,source=calibration?.source??photo.anchor,groundAnchor=calibration?.anchor??anchor;
      placements.push({...common,anchor:groundAnchor,kind:'photo',photo,box,groundSupports:calibration?.supports||null,groundScale:factor,
        screens:screensFor(photo.screens,item,box.width,box.height,box.x,box.y),
        left:groundAnchor.x-(source[0]-box.x)/AW*factor,
        top:groundAnchor.y-(source[1]-box.y)/AH*factor,
        width:box.width/AW*factor,height:box.height/AH*factor,
        origin:[(source[0]-box.x)/box.width,(source[1]-box.y)/box.height]});
    }else{
      const view=fine||record.views.find(v=>v.rotation===rot);
      if(!view){placements.push({...common,unsupported:true});continue;}
      const factor=targetPixelsPerUnit/view.pixelsPerGridUnit*customScale;
      const ay=anchor.y-(common.wall?finite(item.wallY,1.8)*targetPixelsPerUnit/AH:0);
      const url=new URL(view.url,ASSET_ROOT).href;
      const screens=Array.isArray(view.screens)?view.screens:record.number===13&&LEGACY_TFT[view.rotation]?[{quad:LEGACY_TFT[view.rotation],aspect:16/9}]:[];
      placements.push({...common,kind:'sprite',view,url,screens:screensFor(screens,item,view.width,view.height),
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
// Pixel size of a screen's canvas: its long side fixed, its shape the panel's own.
export function screenSize(aspect,long=SCREEN_LONG){
  const ratio=Number.isFinite(aspect)&&aspect>0?aspect:9/16;
  return ratio>=1?[long,Math.max(8,Math.round(long/ratio))]:[Math.max(8,Math.round(long*ratio)),long];
}
// Where on the floor a screen throws its light: one tile in front of the piece,
// towards whichever side of the room its picture is facing.
export function screenPool(p,quad,scene){
  const box=p.footprint;if(!box||p.wall||!quad)return null;
  // As it is seen: a mirrored piece shows its panel from the other side.
  const [tl,tr]=p.flip?[quad[1],quad[0]]:quad,slope=tr[1]-tl[1];
  const cols=(box.maxCol-box.minCol)/2,rows=(box.maxRow-box.minRow)/2,cx=(box.minCol+box.maxCol)/2,cy=(box.minRow+box.maxRow)/2;
  // A top edge falling to the right is a panel facing the left of the picture (+row); rising, the right (+col).
  const centre=slope>0?[cx,cy+rows+.85]:[cx+cols+.85,cy];
  // A piece against the open side of the room would light the street: no pool.
  if(centre[0]<0||centre[1]<0||centre[0]>scene.cols||centre[1]>scene.rows)return null;
  // The floor axes are measured one tile inside, where the projection is not clamped by the room.
  const at=(c,r)=>projectMatrixFloor(c,r,scene.cols,scene.rows),o=at(...centre),c0=Math.min(centre[0],scene.cols-1),r0=Math.min(centre[1],scene.rows-1),b=at(c0,r0),u=at(c0+1,r0),v=at(c0,r0+1);
  return {x:o.x,y:o.y,u:[u.x-b.x,u.y-b.y],v:[v.x-b.x,v.y-b.y]};
}
// Tótem «14. Metahuman AI» en Best/Hiperreal (fix 10-oct-2026 r3): el sprite del atlas trae un marcador gris (sol + monte)
// que en el local parecía una imagen rota. Sin contenido propio se pinta una pantalla en reposo; cualquier preview
// (cápsulas, arrastrar medios) la sustituye y al restaurar vuelve aquí.
function drawIdleTotem(ctx,w,h){ctx.save();ctx.scale(w/512,h/768);const g=ctx.createLinearGradient(0,0,0,768);g.addColorStop(0,'#071a2b');g.addColorStop(1,'#02060c');ctx.fillStyle=g;ctx.fillRect(0,0,512,768);
  ctx.fillStyle='rgba(120,243,255,.16)';ctx.beginPath();ctx.arc(256,300,118,0,Math.PI*2);ctx.fill();ctx.fillStyle='#78f3ff';ctx.beginPath();ctx.arc(256,300,64,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e9fbff';ctx.textAlign='center';ctx.font='bold 54px system-ui,sans-serif';ctx.fillText('Metahuman AI',256,520);ctx.fillStyle='#6ce6a2';ctx.font='32px system-ui,sans-serif';ctx.fillText('admira',256,580);ctx.restore();}
// The pane over the picture: a faint reflection and a darker rim. Drawn once per size.
const panes=new Map();
function pane(w,h){
  const key=w+'x'+h;let canvas=panes.get(key);if(canvas)return canvas;
  canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext?.('2d');
  if(ctx){
    const shine=ctx.createLinearGradient(0,0,w,h);shine.addColorStop(0,'rgba(255,255,255,.17)');shine.addColorStop(.16,'rgba(255,255,255,.05)');shine.addColorStop(.32,'rgba(255,255,255,0)');shine.addColorStop(.72,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(255,255,255,.06)');
    ctx.fillStyle=shine;ctx.fillRect(0,0,w,h);
    const rim=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.42,w/2,h/2,Math.hypot(w,h)*.62);rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(1,'rgba(0,0,0,.34)');
    ctx.fillStyle=rim;ctx.fillRect(0,0,w,h);
  }
  panes.set(key,canvas);return canvas;
}
const defaultScreen=(ctx,w,h,screen)=>!!globalThis.XpaceScreenMedia?.draw(ctx,w,h,screen.id);
function inside(polygon,x,y){
  let hit=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;}
  return hit;
}
function photoContent(photo,box,prefix){
  const svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox',`${box.x} ${box.y} ${box.width} ${box.height}`);svg.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(SVG,'defs'),clip=document.createElementNS(SVG,'clipPath');clip.id=prefix;
  for(const points of photo.polygons){const polygon=document.createElementNS(SVG,'polygon');polygon.setAttribute('points',points.map(p=>p.join(',')).join(' '));clip.append(polygon);}
  defs.append(clip);svg.append(defs);
  const image=document.createElementNS(SVG,'image');image.setAttribute('href',MATRIX_ATLAS_URL);image.setAttribute('width',AW);image.setAttribute('height',AH);image.setAttribute('preserveAspectRatio','none');image.setAttribute('clip-path',`url(#${prefix})`);svg.append(image);return svg;
}
function applyPlacement(node,p,view=null){
  // A cabinet must cover people whose feet are behind its front ground edge.
  // Its rear origin or photograph center would incorrectly draw them on top.
  const depthY=p.wall?p.anchor.y:finite(p.depthY,p.anchor.y),pose=view?.pose||null;
  Object.assign(node.style,{left:`${p.left*100}%`,top:`${p.top*100}%`,width:`${p.width*100}%`,height:`${p.height*100}%`,
    transformOrigin:`${p.origin[0]*100}% ${p.origin[1]*100}%`,transform:`scale(${p.sx*(p.flip?-1:1)},${p.sy})`,
    zIndex:String(pose?.front?HELD_Z:p.floor?FLOOR_Z:10+Math.round(depthY*1000)),
    // The hand moves a piece with the independent transform properties, which
    // compose outside its own scale and mirror and share its floor origin.
    translate:pose?`${pose.x.toFixed(2)}px ${pose.y.toFixed(2)}px`:'',rotate:pose?.tilt?`${pose.tilt.toFixed(3)}deg`:'',scale:pose&&(pose.sx!==1||pose.sy!==1)?`${pose.sx.toFixed(4)} ${pose.sy.toFixed(4)}`:''});
  node.dataset.lift=view?.state||'';
  node.setAttribute('data-furniture-depth-y',String(depthY));
  if(p.floorZone)node.setAttribute('data-furniture-floor-zone',JSON.stringify(p.floorZone));
}
function applyShadow(node,shadow,view=null){
  const pose=view?.pose||null;
  Object.assign(node.style,{left:`${shadow.left*100}%`,top:`${shadow.top*100}%`,width:`${shadow.width*100}%`,height:`${shadow.height*100}%`,
    transformOrigin:`${shadow.origin[0]*100}% ${shadow.origin[1]*100}%`,transform:`scale(${shadow.sx},${shadow.sy})`,zIndex:String(SHADOW_Z),
    // The shadow stays on the floor: it follows the piece sideways, never up.
    translate:pose?`${pose.x.toFixed(2)}px ${(pose.floorY??0).toFixed(2)}px`:''});
  node.dataset.lift=view?.state||'';
  node.style.setProperty?.('--lift',String(pose?.lift??0));
}

export function mountMatrixFurniture(container,{getState=()=>window.__xtancoVisualState?.(),requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,onReady=()=>{},onSelect=()=>{},load=loadAssets,
  // Optional collaborators of Best · Hiperreal. `decorate` may move a piece that is being carried before it is saved;
  // `present` says how a piece is being handled; `live` asks for every frame; `paintScreen` fills a screen and
  // answers whether it is on air; `light` turns the glow of the screens on or off.
  // `webScreen` names the interactive page a screen shows instead of a picture ({src,title}), as Good's totem does.
  decorate=scene=>scene,present=()=>null,live=()=>false,paintScreen=defaultScreen,light=()=>true,webScreen=()=>null}={}){
  if(!container)throw Error('Falta el contenedor Best');
  const snapshot=createLifeSnapshot(),nodes=new Map(),prefix=`matrix-furniture-${++sequence}`,layer=document.createElement('div'),status=document.createElement('p');
  layer.className='matrix-furniture-layer';status.className='matrix-furniture-status';status.setAttribute('role','status');status.style.display='none';status.textContent='Preparando el mobiliario de Best…';container.append(layer,status);
  let catalog,disposed=false,frame=0,last=-Infinity,painted=-Infinity,reported=false,selected=null,zones=[],count=0,occluders=[],current=null;
  const decorators=[],masks=new Map();
  function report(error=''){if(disposed||reported)return;reported=true;onReady(error);}
  function select(p){selected=p.id;onSelect({id:p.id,number:p.number,label:p.label});}
  function updateStatus(){
    const entries=[...nodes.values()],failed=entries.filter(n=>n.failed).length,loading=entries.filter(n=>!n.loaded&&!n.failed).length;
    count=entries.filter(n=>n.loaded).length;
    zones=entries.filter(n=>n.loaded&&!n.failed).map(n=>placementZone(n.current)).filter(Boolean);
    occluders=entries.filter(n=>n.loaded&&!n.failed&&n.current&&!n.current.wall&&n.current.footprint).map(n=>placementOccluder(n.current));
    status.textContent=`BEST · ${count} muebles visibles · inventario compartido${loading?` · ${loading} cargando`:''}${failed?` · ${failed} sin representación`:''}`;
    if(!loading)report(failed?'No se han podido cargar todos los muebles de Best.':'');
  }
  function removeScreen(screen){screen.canvas.remove();screen.glow.remove();screen.pool?.remove();screen.frame?.remove();screen.frame=null;}
  // A web page on a screen: an inert frame laid on the same aperture, at the size it is seen so that a
  // responsive page composes itself for a small panel. It only shows; touching it is another view's job.
  function placeWeb(screen,corners,owner){
    let web=null;try{web=webScreen({id:screen.id,aspect:screen.spec.aspect})||null;}catch{}
    const src=/^https:\/\//i.test(String(web?.src||''))?String(web.src):'';
    if(!src||!corners.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y))){if(screen.frame){screen.frame.remove();screen.frame=null;screen.web='';}return;}
    if(!screen.frame){
      const frame=document.createElement('iframe');frame.className='matrix-furniture-web';frame.inert=true;frame.tabIndex=-1;frame.referrerPolicy='no-referrer-when-downgrade';
      frame.setAttribute('allow','autoplay');frame.setAttribute('aria-hidden','true');frame.dataset.ready='0';
      frame.style.cssText='position:absolute;left:0;top:0;border:0;transform-origin:0 0;pointer-events:none';
      frame.addEventListener('load',()=>{frame.dataset.ready='1';});
      owner.append(frame);screen.frame=frame;screen.web='';
    }
    const frame=screen.frame;
    if(screen.web!==src){screen.web=src;frame.dataset.ready='0';frame.title=String(web.title||'');frame.src=src;}
    const width=Math.max(24,Math.round(Math.hypot(corners[1].x-corners[0].x,corners[1].y-corners[0].y))),height=Math.max(24,Math.round(Math.hypot(corners[3].x-corners[0].x,corners[3].y-corners[0].y)));
    if(frame.width!==String(width)||frame.height!==String(height)){frame.width=String(width);frame.height=String(height);frame.style.width=width+'px';frame.style.height=height+'px';}
    const matrix=quadTransform(corners,width,height);
    if(matrix)frame.style.transform='matrix3d('+matrix.join(',')+')';
  }
  function removeEntry(entry){entry.node?.remove();entry.shadow?.remove();for(const screen of entry.screens?.values()||[])removeScreen(screen);entry.screens?.clear();}
  // A screen is a canvas mapped onto the aperture of its piece, a blurred copy
  // of its own picture behind it, and for standing pieces a pool on the floor.
  function createScreen(spec,owner,pooled){
    const [w,h]=screenSize(spec.aspect),canvas=document.createElement('canvas'),glow=document.createElement('div'),haze=document.createElement('div'),spill=document.createElement('canvas');
    canvas.width=w;canvas.height=h;canvas.className='matrix-furniture-screen';canvas.dataset.mediaScreen=spec.id;canvas.dataset.lit='0';
    canvas.style.cssText=`position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;pointer-events:auto`;
    glow.className='matrix-screen-glow';glow.dataset.lit='0';glow.setAttribute('aria-hidden','true');glow.style.cssText=`position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;pointer-events:none`;
    haze.className='matrix-screen-haze';spill.width=spill.height=SPILL;haze.append(spill);glow.append(haze);
    const screen={id:spec.id,spec,canvas,glow,w,h,ctx:canvas.getContext?.('2d')||null,spillCtx:spill.getContext?.('2d')||null,pool:null,poolCtx:null,lit:false,spilled:-Infinity,owner};
    if(pooled){
      const pool=document.createElement('div'),light=document.createElement('canvas');pool.className='matrix-screen-pool';pool.dataset.lit='0';pool.setAttribute('aria-hidden','true');
      light.width=light.height=SPILL;pool.append(light);pool.style.zIndex=String(POOL_Z);layer.append(pool);screen.pool=pool;screen.poolCtx=light.getContext?.('2d')||null;
    }
    owner.append(glow,canvas);return screen;
  }
  function placeScreen(screen,spec,p,stage){
    screen.spec=spec;
    const width=stage.width*p.width,height=stage.height*p.height,quad=p.flip?[spec.quad[1],spec.quad[0],spec.quad[3],spec.quad[2]]:spec.quad;
    const corners=quad.map(([x,y])=>({x:x*width,y:y*height})),matrix=quadTransform(corners,screen.w,screen.h);
    if(matrix)screen.canvas.style.transform=screen.glow.style.transform='matrix3d('+matrix.join(',')+')';
    placeWeb(screen,corners,screen.owner);
    if(!screen.pool)return;
    const pool=current&&screenPool(p,spec.quad,current);
    if(!pool){screen.pool.hidden=true;return;}
    // An isometric disc: the unit floor axes around the pool, in stage pixels.
    const reach=1.35;
    Object.assign(screen.pool.style,{left:`${pool.x*100}%`,top:`${pool.y*100}%`,
      transform:`translate(-50%,-50%) matrix(${[pool.u[0]*stage.width,pool.u[1]*stage.height,pool.v[0]*stage.width,pool.v[1]*stage.height].map(n=>(n*reach*2/100).toFixed(5)).join(',')},0,0)`});
    screen.pool.hidden=false;
  }
  function syncScreens(entry,p,stage,owner){
    const wanted=new Set(p.screens.map(spec=>spec.id));
    for(const [id,screen] of entry.screens)if(!wanted.has(id)){removeScreen(screen);entry.screens.delete(id);}
    for(const spec of p.screens){
      let screen=entry.screens.get(spec.id);
      if(!screen){screen=createScreen(spec,owner,!p.wall&&!!p.footprint);entry.screens.set(spec.id,screen);}
      screen.piece=p;placeScreen(screen,spec,p,stage);
    }
  }
  function everyScreen(){
    const list=[];
    for(const entry of nodes.values())if(entry.loaded&&!entry.failed)for(const screen of entry.screens.values())list.push(screen);
    for(const detail of decorators)if(!detail.node.hidden)for(const screen of detail.screens.values())list.push(screen);
    return list;
  }
  // Screens run at the pace of their pictures; the layout only at that of the shop.
  function paint(now){
    if(disposed)return;
    let glowing=true;try{glowing=light()!==false;}catch{}
    for(const screen of everyScreen()){
      const {ctx,w,h}=screen;if(!ctx)continue;
      let lit=false;
      try{ctx.clearRect(0,0,w,h);lit=!!paintScreen(ctx,w,h,{id:screen.id,aspect:screen.spec.aspect,item:screen.piece?.item||null,label:screen.piece?.label||''});}catch{lit=false;}
      if(!lit&&screen.id==='metahuman'){drawIdleTotem(ctx,w,h);lit=true;}
      if(lit)try{ctx.drawImage(pane(w,h),0,0);}catch{}
      if(lit!==screen.lit){screen.lit=lit;screen.canvas.dataset.lit=lit?'1':'0';}
      const held=!!screen.piece?.id&&(nodes.get(screen.piece.id)?.node?.dataset.lift||'')==='held',shine=lit&&glowing?'1':'0';
      if(screen.glow.dataset.lit!==shine)screen.glow.dataset.lit=shine;
      if(screen.pool){const pooled=lit&&glowing&&!held?'1':'0';if(screen.pool.dataset.lit!==pooled)screen.pool.dataset.lit=pooled;}
      if(lit&&glowing&&now-screen.spilled>=SPILL_MS){
        screen.spilled=now;
        try{screen.spillCtx?.drawImage(screen.canvas,0,0,SPILL,SPILL);screen.poolCtx?.drawImage(screen.canvas,0,0,SPILL,SPILL);}catch{}
      }
    }
  }
  function update(){
    if(disposed||!catalog)return;
    let scene;try{scene=snapshot(getState?.());}catch{}
    if(scene)try{scene=decorate(scene)||scene;}catch{}
    current=scene||null;
    if(!scene){for(const entry of nodes.values())removeEntry(entry);nodes.clear();zones=[];count=0;for(const detail of decorators)detail.node.hidden=true;if(selected!==null){selected=null;onSelect(null);}status.textContent='Esperando al Xtanco para mostrar su inventario…';return;}
    const plan=planMatrixFurniture(scene,catalog),active=new Set(plan.map(p=>p.id));zones=plan.map(placementZone).filter(Boolean);
    const stage={width:layer.clientWidth,height:layer.clientHeight};
    for(const [id,entry]of nodes)if(!active.has(id)){removeEntry(entry);nodes.delete(id);if(selected===id){selected=null;onSelect(null);}}
    for(const p of plan){
      const signature=p.unsupported?'unsupported':p.kind==='photo'?`photo:${p.number}:${p.photo===photoPieceFor({id:'plant3'},9)?'plant3':'base'}`:`sprite:${p.url}`;
      let entry=nodes.get(p.id);
      if(entry&&entry.signature!==signature){removeEntry(entry);nodes.delete(p.id);entry=null;}
      if(!entry){
        entry={signature,loaded:false,failed:!!p.unsupported,node:null,current:p,shadow:null,shadowUrl:'',screens:new Map()};nodes.set(p.id,entry);
        if(p.unsupported)continue;
        const node=document.createElement('button');node.type='button';node.className='matrix-furniture-item';node.dataset.inventoryNumber=String(p.number);node.dataset.instanceId=p.id;
        node.setAttribute('aria-label',`${p.number}. ${p.label}`);node.title=`${p.number}. ${p.label}`;node.addEventListener('click',event=>{event.stopPropagation();select(entry.current);});
        if(p.kind==='photo'){node.append(photoContent(p.photo,p.box,`${prefix}-${++sequence}`));entry.loaded=true;}
        else{
          const image=document.createElement('img');image.alt='';image.draggable=false;
          const own=entry;
          image.onload=()=>{if(disposed||nodes.get(p.id)!==own)return;own.loaded=true;updateStatus();};
          image.onerror=()=>{if(disposed||nodes.get(p.id)!==own)return;own.failed=true;node.hidden=true;if(own.shadow)own.shadow.hidden=true;updateStatus();};image.src=p.url;node.append(image);
        }
        entry.node=node;layer.append(node);
      }
      entry.current=p;
      let view=null;try{view=present(p)||null;}catch{}
      if(entry.node){entry.node.setAttribute('aria-label',`${p.number}. ${p.label}`);entry.node.title=`${p.number}. ${p.label}`;if(p.wall)entry.node.dataset.wall='1';else delete entry.node.dataset.wall;applyPlacement(entry.node,p,view);}
      if(entry.shadow&&(!p.shadow||entry.shadowUrl!==p.shadow.url)){entry.shadow.remove();entry.shadow=null;}
      if(p.shadow&&entry.node&&!entry.failed){
        if(!entry.shadow){
          const cast=document.createElement('img');cast.className='matrix-furniture-shadow';cast.alt='';cast.draggable=false;cast.setAttribute('aria-hidden','true');
          cast.onerror=()=>{cast.hidden=true;};cast.src=p.shadow.url;entry.shadow=cast;entry.shadowUrl=p.shadow.url;layer.append(cast);
        }
        applyShadow(entry.shadow,p.shadow,view);
      }
      // Screen apertures follow the actual cutout or render and its existing transform.
      if(entry.node&&!entry.failed)syncScreens(entry,p,stage,entry.node);
    }
    if(!decorators.length){
      for(const photo of MATRIX_ARCHITECTURE_DETAILS){const box=bounds(photo.polygons),node=document.createElement('div');node.className='matrix-furniture-item matrix-architecture-detail';node.append(photoContent(photo,box,`${prefix}-detail-${++sequence}`));
        const p={anchor:{x:photo.target[0],y:photo.target[1]},left:photo.target[0]-(photo.anchor[0]-box.x)/AW*photo.scale,top:photo.target[1]-(photo.anchor[1]-box.y)/AH*photo.scale,width:box.width/AW*photo.scale,height:box.height/AH*photo.scale,origin:[(photo.anchor[0]-box.x)/box.width,(photo.anchor[1]-box.y)/box.height],sx:1,sy:1,wall:true,flip:false,label:'',
          screens:screensFor(photo.screens,null,box.width,box.height,box.x,box.y)};
        applyPlacement(node,p);node.style.pointerEvents='none';layer.append(node);decorators.push({node,placement:p,screens:new Map()});}
    }
    for(const detail of decorators){detail.node.hidden=scene.moving;if(!scene.moving&&detail.placement.screens.length)syncScreens(detail,detail.placement,stage,detail.node);}
    updateStatus();
  }
  // Opaque pixels of a sprite, read once per image: who is under the pointer and where the piece really ends.
  function maskFor(entry){
    const p=entry.current,image=entry.node.querySelector('img');if(!image?.naturalWidth)return null;
    let mask=masks.get(p.url);
    if(mask===undefined){
      mask=null;
      try{
        const size=160,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,size,size);
        const data=ctx.getImageData(0,0,size,size).data,alpha=new Uint8Array(size*size);let u0=size,v0=size,u1=-1,v1=-1;
        for(let i=0;i<alpha.length;i++){const value=alpha[i]=data[i*4+3];if(value>40){const u=i%size,v=(i-u)/size;if(u<u0)u0=u;if(u>u1)u1=u;if(v<v0)v0=v;if(v>v1)v1=v;}}
        mask={size,alpha,box:u1<0?[0,0,1,1]:[u0/size,v0/size,(u1+1)/size,(v1+1)/size]};
      }catch{}
      masks.set(p.url,mask);if(masks.size>96)masks.delete(masks.keys().next().value);
    }
    return mask;
  }
  // Pixel-accurate choice of the piece under a point: a transparent corner of a nearer picture never steals it.
  function opaque(entry,x,y){
    const p=entry.current,rect=entry.node.getBoundingClientRect?.();
    if(!rect||!(rect.width>0)||!(rect.height>0))return false;
    let u=(x-rect.left)/rect.width;const v=(y-rect.top)/rect.height;
    if(u<0||u>1||v<0||v>1)return false;
    if(p.flip)u=1-u;
    if(p.kind==='photo'){const ax=p.box.x+u*p.box.width,ay=p.box.y+v*p.box.height;return p.photo.polygons.some(polygon=>inside(polygon,ax,ay));}
    const mask=maskFor(entry);if(!mask)return true;
    return mask.alpha[Math.min(mask.size-1,Math.floor(v*mask.size))*mask.size+Math.min(mask.size-1,Math.floor(u*mask.size))]>40;
  }
  // Rectangle of the window that the piece itself covers, without the empty margin of its picture.
  function visibleRect(entry){
    const rect=entry.node.getBoundingClientRect?.();if(!rect)return null;
    let [u0,v0,u1,v1]=entry.current.kind==='sprite'?maskFor(entry)?.box||[0,0,1,1]:[0,0,1,1];
    if(entry.current.flip)[u0,u1]=[1-u1,1-u0];
    return {left:rect.left+u0*rect.width,right:rect.left+u1*rect.width,top:rect.top+v0*rect.height,bottom:rect.top+v1*rect.height};
  }
  function pick(x,y){
    const seen=new Set();
    for(const element of document.elementsFromPoint?.(x,y)||[]){
      const node=element.closest?.('.matrix-furniture-item[data-instance-id]');if(!node||seen.has(node))continue;seen.add(node);
      const entry=nodes.get(node.dataset.instanceId);if(!entry||entry.node!==node||!entry.loaded||entry.failed)continue;
      if(opaque(entry,x,y))return entry.current.id;
    }
    return null;
  }
  // The screen under a point, unless a piece standing in front really covers it there.
  function screenAt(x,y){
    const seen=new Set();
    for(const element of document.elementsFromPoint?.(x,y)||[]){
      if(element.dataset?.mediaScreen&&layer.contains(element))return element.dataset.mediaScreen;
      const node=element.closest?.('.matrix-furniture-item[data-instance-id]');if(!node||seen.has(node))continue;seen.add(node);
      const entry=nodes.get(node.dataset.instanceId);if(entry?.node===node&&entry.loaded&&!entry.failed&&opaque(entry,x,y))return null;
    }
    return null;
  }
  function tick(now){
    if(disposed)return;
    if(!document.hidden){
      let moving=false;try{moving=!!live();}catch{}
      if(moving||now-last>=100){last=now;update();}
      if(now-painted>=PAINT_MS){painted=now;paint(now);}
    }
    frame=requestFrame(tick);
  }
  Promise.resolve().then(load).then(value=>{if(disposed)return;catalog=value;update();frame=requestFrame(tick);},()=>{if(disposed)return;status.textContent='No se ha podido cargar el mobiliario Best. Cambia de vista y reintenta.';report('No se ha podido cargar el mobiliario Best.');});
  return {update,pick,screenAt,layer,
    get count(){return count;},get zones(){return zones;},get occluders(){return occluders;},get scene(){return current;},
    // What the hand and the on-air cards need to know about a piece or a screen as it is drawn now.
    piece(id){const entry=nodes.get(String(id));return entry?.node&&!entry.failed?{id:entry.current.id,node:entry.node,shadow:entry.shadow,placement:entry.current,rect:visibleRect(entry)}:null;},
    screens(){return everyScreen().map(screen=>({id:screen.id,canvas:screen.canvas,lit:screen.lit,web:!!screen.frame,aspect:screen.spec.aspect,item:screen.piece?.item||null,label:screen.piece?.label||'',pieceId:screen.piece?.id||null}));},
    dispose(){if(disposed)return;disposed=true;cancelFrame(frame);for(const e of nodes.values()){const img=e.node?.querySelector('img');if(img){img.onload=null;img.onerror=null;}if(e.shadow)e.shadow.onerror=null;}nodes.clear();masks.clear();zones=[];count=0;current=null;if(selected!==null){selected=null;onSelect(null);}layer.remove();status.remove();}};
}
