import {buildCustomerNavigation} from './customer-navigation.mjs';
import {actorCollisionRadius,physicalColliders} from './physical-colliders.mjs';
import {furnitureBounds} from './furniture-geometry.mjs';

const EPS=1e-7,MARGIN=.05,CACHE_LIMIT=16;
const cache=new Map();
const finite=value=>value!==null&&value!==''&&Number.isFinite(Number(value));
const point=value=>value&&finite(value.col)&&finite(value.row)?{col:Number(value.col),row:Number(value.row)}:null;
const distance=(a,b)=>Math.hypot(a.col-b.col,a.row-b.row);
const union=(a,b)=>({minCol:Math.min(a.minCol,b.minCol),maxCol:Math.max(a.maxCol,b.maxCol),minRow:Math.min(a.minRow,b.minRow),maxRow:Math.max(a.maxRow,b.maxRow)});
const validBox=box=>box&&['minCol','maxCol','minRow','maxRow'].every(key=>finite(box[key]))&&Number(box.minCol)<=Number(box.maxCol)&&Number(box.minRow)<=Number(box.maxRow);
const value=(scene,entrance,key,fallback)=>Number(entrance?.[key]??scene[key]??scene.hardness?.[key]??scene.iso?.[key]??fallback);

/** Read-only diagnosis against the same body and solids as live navigation.
 * The diagnostic opens only its copy of the door. A supplied route always
 * belongs to that complete map, never to a counterfactual with solids removed.
 * Imported spaces require a configured right-edge passageEntrance, rather
 * than inheriting an invented retail portal from navigation's defaults.
 */
export function diagnosePassage(scene={}, {actor='human',targetId=null,from,to}={}){
  const validScene=scene&&typeof scene==='object'&&!Array.isArray(scene);
  const radius=actorCollisionRadius({robot:actor==='unitree'}),actualDoorOpen=validScene?value(scene,null,'doorOpen',0):NaN;
  const result={status:'unavailable',reason:'invalid_scene',actor,radius,origin:null,target:null,targetId:targetId==null?null:String(targetId),route:null,blockers:[],navigationKey:null,doorMode:'open',actualDoorOpen:Number.isFinite(actualDoorOpen)?actualDoorOpen:null};
  const unavailable=reason=>({...result,reason});
  if(actor!=='human'&&actor!=='unitree')return unavailable('invalid_actor');
  if(!validScene||scene.active===false)return unavailable('invalid_scene');
  const cols=Number(scene.cols??scene.iso?.cols),rows=Number(scene.rows??scene.iso?.rows);
  if(!Number.isFinite(cols)||!Number.isFinite(rows)||cols<=0||rows<=0||!Array.isArray(scene.layout))return unavailable('invalid_scene');
  const entrance=scene.passageEntrance;
  if(entrance?.configured===false||((scene.imported===true||scene.roomId==='cafebreria')&&!entrance))return unavailable('entrance_unconfigured');
  if(entrance&&(typeof entrance!=='object'||!point(entrance.from)))return unavailable('entrance_unconfigured');
  if(entrance&&(Number(entrance.from.col)<cols||['doorRow','doorHalfWidth','outsideDepth'].some(key=>!finite(entrance[key]??scene[key]??scene.iso?.[key]))))return unavailable('entrance_unconfigured');
  const doorRow=value(scene,entrance,'doorRow',3.35),doorHalfWidth=value(scene,entrance,'doorHalfWidth',1),outsideDepth=value(scene,entrance,'outsideDepth',3.5);
  if(![doorRow,doorHalfWidth,outsideDepth].every(Number.isFinite)||doorHalfWidth<0||outsideDepth<=0)return unavailable('invalid_scene');
  const layout=scene.layout.filter(item=>item?.presentationExcluded!==true).map(item=>({...item,hidden:false}));
  if(layout.some(item=>!item?.id||!finite(item.col)||!finite(item.row)||['rot','sx','sy'].some(key=>item[key]!==undefined&&!finite(item[key]))||item.fp!==undefined&&(!Array.isArray(item.fp)||item.fp.length<2||item.fp.some(v=>!finite(v)||Number(v)<=0))))return unavailable('invalid_scene');
  const items=new Map(layout.map(item=>[String(item.id),item]));
  if(result.targetId!==null&&!items.has(result.targetId))return unavailable('target_missing');
  const physicalScene={...scene,cols,rows,layout,doorRow,doorHalfWidth,outsideDepth,doorOpen:1};
  if(scene.hardness?.fixed!==undefined&&!Array.isArray(scene.hardness.fixed))return unavailable('invalid_scene');
  if((scene.hardness?.fixed||[]).some(cell=>{
    const parts=String(cell).split(',');return parts.length!==2||parts.some(v=>!finite(v.trim()));
  }))return unavailable('invalid_scene');
  // Draft furniture must not coexist with the saved pose's old envelope. Only
  // architecture/fixed bounds survive from input; dynamic envelopes are rebuilt.
  if(scene.colliders!==undefined&&!Array.isArray(scene.colliders)||scene.hardness?.colliders!==undefined&&!Array.isArray(scene.hardness.colliders))return unavailable('invalid_scene');
  const source=[...(Array.isArray(scene.colliders)?scene.colliders:[]),...(Array.isArray(scene.hardness?.colliders)?scene.hardness.colliders:[])];
  const byId=new Map();
  for(const [index,box] of source.entries()){
    if(!validBox(box))return unavailable('invalid_scene');
    const id=String(box.id??'collider:'+index);
    const structural=id.startsWith('architecture:')||box.kind==='architecture'||box.kind==='hardness';
    if((!structural&&(id.startsWith('geometry:')||box.kind==='furniture'||box.itemId!=null||items.has(id)))||id==='architecture:door-leaf')continue;
    byId.set(id,{...box,id});
  }
  for(const box of physicalColliders(physicalScene))byId.set(String(box.id),box);
  const nav=buildCustomerNavigation({...physicalScene,colliders:[...byId.values()]},{radius,allowOutside:true});
  result.navigationKey=nav.key;
  const boundsOnly=buildCustomerNavigation({cols,rows,doorRow,doorHalfWidth,outsideDepth,layout:[]},{radius,allowOutside:true});
  const exteriorMargin=Math.min(.1,outsideDepth/2,Math.max(0,(outsideDepth-radius)/2));
  const requestedOrigin=from===undefined?(entrance?.from??{col:cols+outsideDepth-exteriorMargin,row:doorRow}):from;
  let origin=point(requestedOrigin);
  if(from===undefined&&outsideDepth<radius){
    result.origin=origin;
    return {...result,status:'blocked',reason:'boundary_blocked',blockers:[boundary(cols,doorRow,doorHalfWidth)]};
  }
  if(!origin||!boundsOnly.isWalkable(origin)){
    if(from!==undefined)return unavailable('invalid_origin');
    result.origin=origin;
    return {...result,status:'blocked',reason:'boundary_blocked',blockers:[boundary(cols,doorRow,doorHalfWidth)]};
  }
  if(from===undefined&&!nav.isWalkable(origin)){
    // Prefer a free point in the real exterior apron, without correcting an
    // entrance to an interior point or to the other side of an obstacle.
    const low=Math.max(radius,doorRow-doorHalfWidth+radius),high=Math.min(rows-radius,doorRow+doorHalfWidth-radius);
    const candidates=[low,high,(low+high)/2].map(row=>({col:origin.col,row}));
    origin=candidates.filter(p=>boundsOnly.isWalkable(p)&&nav.isWalkable(p)).sort((a,b)=>distance(a,origin)-distance(b,origin))[0]||origin;
  }
  result.origin=origin;
  let goals;
  if(to!==undefined){
    const destination=point(to);
    if(!destination||destination.col>cols-radius+EPS||!boundsOnly.isWalkable(destination))return unavailable('invalid_target');
    goals=[destination];
  }else if(result.targetId!==null){
    const item=items.get(result.targetId),boxes=nav.obstacles.filter(box=>box.id===result.targetId||box.id==='geometry:'+result.targetId);
    const box=boxes.length?boxes.reduce(union):furnitureBounds(item,scene.footprints);
    goals=approaches(box,radius,nav).filter(p=>p.col<=cols-radius+EPS&&boundsOnly.isWalkable(p));
    if(!goals.length)return unavailable('target_unavailable');
  }else{
    const center={col:cols/2,row:rows/2};
    // Pick the nearest free centre position independently of the entrance's
    // reachable component. A sealed partition cannot relocate the goal to the
    // starting side and pretend to be a successful passage.
    const goal=nav.resolve(center,{accept:p=>p.col<=cols-radius+EPS})||center;
    if(!boundsOnly.isWalkable(goal))return unavailable('target_unavailable');
    goals=[goal];
  }
  goals.sort((a,b)=>distance(origin,a)-distance(origin,b)||a.col-b.col||a.row-b.row);
  result.target={...goals[0]};
  const cacheKey=JSON.stringify([nav.key,result.targetId,origin,goals,layout.map(item=>[item.id,item.label,item.name,item.nativeFixed,item.navigationSolid]),[...byId.values()].map(box=>[box.id,box.label,box.kind,box.itemId])]);
  const previous=cache.get(cacheKey);
  if(previous)return {...copyResult(previous),actualDoorOpen:result.actualDoorOpen};
  const finish=answer=>{
    if(cache.size>=CACHE_LIMIT)cache.delete(cache.keys().next().value);
    cache.set(cacheKey,copyResult(answer));return answer;
  };
  const findRoute=navigation=>{
    for(const target of goals){
      const waypoints=navigation.route(origin,target);
      if(waypoints!==null)return {target:{...target},route:[{...origin},...waypoints.map(p=>({...p}))]};
    }
    return null;
  };
  const clear=findRoute(nav);
  if(clear)return finish({...result,...clear,status:'clear',reason:'clear'});

  const groups=new Map();
  for(const box of nav.obstacles){
    const linked=box.id.startsWith('geometry:')?box.id.slice('geometry:'.length):box.id;
    const item=items.get(linked),structuralItem=item?.nativeFixed===true||item?.navigationSolid===true;
    const kind=item?(structuralItem?'architecture':'furniture'):box.id.startsWith('hardness:')||byId.get(box.id)?.kind==='hardness'?'hardness':'architecture';
    const groupKey=item?'item:'+linked:'solid:'+box.id;
    const previous=groups.get(groupKey);
    const descriptor={id:item?linked:box.id,itemId:item&&!structuralItem?linked:null,kind,label:String(item?.label??item?.name??byId.get(box.id)?.label??box.id),...box};
    descriptor.id=item?linked:box.id;
    if(previous){previous.boxes.push(box);Object.assign(previous.blocker,union(previous.blocker,box));}
    else groups.set(groupKey,{boxes:[box],blocker:descriptor});
  }
  const entries=[...groups.entries()],removed=new Set(groups.keys());
  const counterfactual=()=>buildCustomerNavigation({cols,rows,doorRow,doorHalfWidth,outsideDepth,layout:[],colliders:entries.filter(([key])=>!removed.has(key)).flatMap(([,entry])=>entry.boxes)},{radius,allowOutside:true});
  let relaxedRoute=findRoute(counterfactual());
  if(!relaxedRoute)return finish({...result,status:'blocked',reason:'boundary_blocked',blockers:[boundary(cols,doorRow,doorHalfWidth)]});
  // Restore every unrelated solid to reduce a sufficient obstruction set,
  // including multiple serial barriers; this is not a global minimum. It is
  // explanatory only: the altered route is never exposed as a free passage.
  for(const [key] of entries){
    removed.delete(key);
    const candidate=counterfactual();
    // Most objects do not intersect the last verified route. Recheck its
    // swept segments first, avoiding a new visibility graph for each object.
    if(relaxedRoute.route.every((p,i,path)=>i===0?candidate.isWalkable(p):candidate.segmentClear(path[i-1],p)))continue;
    const alternate=findRoute(candidate);
    if(alternate)relaxedRoute=alternate;else removed.add(key);
  }
  const blockers=entries.filter(([key])=>removed.has(key)).map(([,entry])=>({...entry.blocker}));
  return finish({...result,target:{...relaxedRoute.target},status:'blocked',reason:'obstructed',blockers});
}

function approaches(box,radius,navigation){
  const margin=radius+MARGIN,minCol=box.minCol-margin,maxCol=box.maxCol+margin,minRow=box.minRow-margin,maxRow=box.maxRow+margin,points=[];
  const samples=(low,high)=>{
    const count=Math.max(1,Math.min(128,Math.ceil((high-low)/.5)));
    return Array.from({length:count+1},(_,i)=>low+(high-low)*i/count);
  };
  for(const col of samples(minCol,maxCol))points.push({col,row:minRow},{col,row:maxRow});
  for(const row of samples(minRow,maxRow))points.push({col:minCol,row},{col:maxCol,row});
  // Include exact clearance changes from neighbouring surfaces, so an
  // off-grid access interval is not lost between the half-tile samples.
  for(const obstacle of navigation.obstacles){
    for(const col of [obstacle.minCol-radius-1e-5,obstacle.maxCol+radius+1e-5]){
      if(col>=minCol&&col<=maxCol)points.push({col,row:minRow},{col,row:maxRow});
    }
    for(const row of [obstacle.minRow-radius-1e-5,obstacle.maxRow+radius+1e-5]){
      if(row>=minRow&&row<=maxRow)points.push({col:minCol,row},{col:maxCol,row});
    }
  }
  return [...new Map(points.map(p=>[p.col.toFixed(8)+','+p.row.toFixed(8),p])).values()];
}

function boundary(cols,row,half){return {id:'boundary:doorway',itemId:null,kind:'boundary',label:'boundary:doorway',minCol:cols,maxCol:cols,minRow:row-half,maxRow:row+half};}
function copyResult(result){return {...result,origin:result.origin&&{...result.origin},target:result.target&&{...result.target},route:result.route?.map(p=>({...p}))??null,blockers:result.blockers.map(box=>({...box}))};}
