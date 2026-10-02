import {furnitureBounds,isSolidFurniture,isWallFurniture} from './furniture-geometry.mjs?v=imported-space-1';
const EPS=1e-7;
export const SCALE_LIMITS=Object.freeze({min:.25,max:3});
export const furniturePose=item=>({col:item.col,row:item.row,rot:item.rot??0,sx:item.sx??1,sy:item.sy??1});
export const sameFurniturePose=(a,b)=>['col','row','rot','sx','sy'].every(key=>furniturePose(a)[key]===furniturePose(b)[key]);
const union=(a,b)=>({minCol:Math.min(a.minCol,b.minCol),maxCol:Math.max(a.maxCol,b.maxCol),minRow:Math.min(a.minRow,b.minRow),maxRow:Math.max(a.maxRow,b.maxRow)});
const outside=(box,scene)=>box.minCol<-EPS||box.minRow<-EPS||box.maxCol>scene.cols+EPS||box.maxRow>scene.rows+EPS;
const turnDelta=(a,b)=>((b-a)%4+6)%4-2;
// Exact extrema of every corner throughout a rotation interval, including the
// critical angles between its endpoints. Recursion narrows this conservative
// envelope around obstacles; a possible sub-pixel contact is rejected safely.
function rotationEnvelope(item,footprints,lo,hi){
  const angles=[lo,hi];
  const dimensions=furnitureBounds({...item,col:0,row:0,rot:0,sx:1,flipX:false},footprints),fp=[dimensions.maxCol,dimensions.maxRow],flip=item.flipX?-1:1;
  for(const [x,z] of [[fp[0]*flip,0],[fp[0]*flip,fp[1]],[0,fp[1]]]){
    const critical=Math.atan2(-z,x)/(Math.PI/2);
    for(let k=Math.floor(lo-critical)-1;k<=Math.ceil(hi-critical)+1;k++)if(critical+k>lo&&critical+k<hi)angles.push(critical+k);
  }
  return angles.map(rot=>furnitureBounds({...item,rot},footprints)).reduce(union);
}
function rotatedOverlap(item,footprints,angle,box){
  const dimensions=furnitureBounds({...item,col:0,row:0,rot:0,sx:1,flipX:false},footprints),fp=[dimensions.maxCol,dimensions.maxRow],s=item.sx??1,flip=item.flipX?-1:1,a=angle*Math.PI/2,c=Math.cos(a),n=Math.sin(a);
  const points=[[0,0],[fp[0],0],[fp[0],fp[1]],[0,fp[1]]].map(([x,z])=>[item.col+s*(c*x*flip-n*z),item.row+s*(n*x*flip+c*z)]);
  const other=[[box.minCol,box.minRow],[box.maxCol,box.minRow],[box.maxCol,box.maxRow],[box.minCol,box.maxRow]];
  for(const [x,z] of [[1,0],[0,1],[c,n],[-n,c]]){
    const p=points.map(v=>v[0]*x+v[1]*z),q=other.map(v=>v[0]*x+v[1]*z);
    if(Math.max(...p)<=Math.min(...q)+EPS||Math.min(...p)>=Math.max(...q)-EPS)return false;
  }
  return true;
}
function rotationCrosses(item,footprints,lo,hi,box,depth=0){
  if(!overlap(rotationEnvelope(item,footprints,lo,hi),box))return false;
  const mid=(lo+hi)/2;
  if(rotatedOverlap(item,footprints,mid,box)||depth>=14)return true;
  return rotationCrosses(item,footprints,lo,mid,box,depth+1)||rotationCrosses(item,footprints,mid,hi,box,depth+1);
}
const overlap=(a,b)=>a.minCol<b.maxCol-EPS&&a.maxCol>b.minCol+EPS&&a.minRow<b.maxRow-EPS&&a.maxRow>b.minRow+EPS;
const area=(a,b)=>Math.max(0,Math.min(a.maxCol,b.maxCol)-Math.max(a.minCol,b.minCol))*Math.max(0,Math.min(a.maxRow,b.maxRow)-Math.max(a.minRow,b.minRow));
function sweptOverlap(start,end,box){
  const dx=end.minCol-start.minCol,dz=end.minRow-start.minRow;
  let lo=0,hi=1;
  for(const [delta,min,max,bmin,bmax] of [[dx,start.minCol,start.maxCol,box.minCol,box.maxCol],[dz,start.minRow,start.maxRow,box.minRow,box.maxRow]]){
    if(Math.abs(delta)<EPS){if(max<=bmin+EPS||min>=bmax-EPS)return false;}
    else{const t1=(bmin+EPS-max)/delta,t2=(bmax-EPS-min)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>=hi)return false;}
  }
  return lo<hi&&hi>0&&lo<1;
}
export function validateFurnitureMove(scene,id,destination,{from,swept=true}={}){
  const item=scene?.layout?.find(value=>String(value.id)===String(id));
  if(!item)return {ok:false,reason:'missing'};
  if(isWallFurniture(item)||item.locked===true)return {ok:false,reason:'fixed'};
  if(!destination||typeof destination!=='object')return {ok:false,reason:'invalid'};
  const startPose=furniturePose({...item,...from}),position=furniturePose({...startPose,...destination});
  if(!Object.values(position).every(Number.isFinite)||!Number.isInteger(position.rot)||position.sx<=0||position.sy<=0)return {ok:false,reason:'invalid'};
  const moved=position.col!==startPose.col||position.row!==startPose.row,turned=position.rot!==startPose.rot,scaled=position.sx!==startPose.sx||position.sy!==startPose.sy;
  if(scaled&&(position.sx<SCALE_LIMITS.min-EPS||position.sx>SCALE_LIMITS.max+EPS))return {ok:false,reason:'scale'};
  // Gestures move, rotate or scale separately. A stored path may contain each.
  if((moved&&(turned||scaled))||(turned&&scaled))return {ok:false,reason:'invalid'};
  const next={...item,...position},end=furnitureBounds(next,scene.footprints),startItem={...item,...startPose},start=furnitureBounds(startItem,scene.footprints);
  const angle=startPose.rot+turnDelta(startPose.rot,position.rot),lo=Math.min(startPose.rot,angle),hi=Math.max(startPose.rot,angle);
  const envelope=turned?rotationEnvelope(startItem,scene.footprints,lo,hi):union(start,end);
  if(outside(end,scene)||(swept&&outside(envelope,scene)))return {ok:false,reason:'bounds',bounds:end};
  const obstacles=scene.layout.filter(other=>String(other.id)!==String(id)&&isSolidFurniture(other)).map(other=>furnitureBounds(other,scene.footprints));
  for(const cell of scene.hardness?.fixed||[]){
    const [col,row]=String(cell).split(',').map(Number);if(Number.isFinite(col)&&Number.isFinite(row))obstacles.push({id:'hardness:'+cell,minCol:col,maxCol:col+1,minRow:row,maxRow:row+1});
  }
  for(const obstacle of obstacles){
    if(overlap(end,obstacle))return {ok:false,reason:'occupied',obstacle:obstacle.id,bounds:end};
    const escaping=moved&&overlap(start,obstacle)&&area(end,obstacle)<area(start,obstacle)
      &&(end.minCol-start.minCol)*(start.minCol+start.maxCol-obstacle.minCol-obstacle.maxCol)>=-EPS
      &&(end.minRow-start.minRow)*(start.minRow+start.maxRow-obstacle.minRow-obstacle.maxRow)>=-EPS;
    const crosses=turned?rotationCrosses(startItem,scene.footprints,lo,hi,obstacle):scaled?overlap(envelope,obstacle):sweptOverlap(start,end,obstacle);
    if(swept&&crosses&&!escaping)return {ok:false,reason:'path',obstacle:obstacle.id,bounds:end};
  }
  return {ok:true,position,bounds:end};
}
export function validateFurniturePath(scene,id,path){
  const item=scene?.layout?.find(value=>String(value.id)===String(id));
  if(!item||!Array.isArray(path)||!path.length||path.length>4096)return {ok:false,reason:'invalid'};
  let from=furniturePose(item),result;
  for(const point of path){result=validateFurnitureMove(scene,id,point,{from});if(!result.ok)return result;from=result.position;}
  return result;
}

export function parseDistribuitCommand(text){
  const match=String(text||'').trim().match(/^\/?(?:cli\s+)?(?:distribuir|distribute|distribuit)(?:\s+(off|close|cerrar|salir|on))?$/i);
  return match?{close:/^(off|close|cerrar|salir)$/i.test(match[1]||'')}:null;
}
export async function executeDistribuitCommand(text,{router,open,close,lang='es'}={}){
  const parsed=parseDistribuitCommand(text);if(!parsed)return null;
  if(parsed.close){close?.();return {ok:true,local:true,kind:'distribuit',message:lang==='en'?'Distribute closed.':'Distribuir cerrado.'};}
  const ready=await router?.choose('better');
  if(!ready?.ok||ready.mode!=='better')return {ok:false,local:true,kind:'distribuit',message:lang==='en'?'Better could not open for editing.':'No se pudo abrir Better para editar.'};
  const started=await open?.();
  return {ok:!!started,local:true,kind:'distribuit',message:lang==='en'?(started?'Distribute · select furniture and drag it.':'The furniture editor is unavailable.'):(started?'Distribuir · selecciona un mueble y arrástralo.':'El editor de muebles no está disponible.')};
}
