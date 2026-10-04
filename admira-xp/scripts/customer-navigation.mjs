import {FLOOR_FOOTPRINTS as DEFAULT_FOOTPRINTS,furnitureBounds,isSolidFurniture} from './furniture-geometry.mjs';
// One floor-space collision contract for the simulation and its three views.
// Furniture rotates around its layout origin, exactly as life-scene does.
const EPS=1e-7,STEP=.5,CORNER_CLEARANCE=1e-5;
// Includes the animated hands, shoulders, carried bag and robot shell. Callers
// may request a different radius for a scaled body, but never infer it from the
// quality tier: Good, Better and Best occupy the same floor space.
export const ACTOR_BODY_RADIUS=.72;
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const point=value=>({col:Number(value?.col),row:Number(value?.row)});
const valid=p=>Number.isFinite(p.col)&&Number.isFinite(p.row);
const distance=(a,b)=>Math.hypot(a.col-b.col,a.row-b.row);
function touchesSegment(a,b,box,padding){
  let lo=0,hi=1;
  // Explicit slabs avoid allocating axis arrays for every visibility edge.
  const dc=b.col-a.col,minCol=box.minCol-padding,maxCol=box.maxCol+padding;
  if(Math.abs(dc)<EPS){if(a.col<minCol||a.col>maxCol)return false;}
  else{
    const t1=(minCol-a.col)/dc,t2=(maxCol-a.col)/dc;
    lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));
    if(lo>hi)return false;
  }
  const dr=b.row-a.row,minRow=box.minRow-padding,maxRow=box.maxRow+padding;
  if(Math.abs(dr)<EPS){if(a.row<minRow||a.row>maxRow)return false;}
  else{
    const t1=(minRow-a.row)/dr,t2=(maxRow-a.row)/dr;
    lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));
    if(lo>hi)return false;
  }
  return hi>=0&&lo<=1;
}

export function buildCustomerNavigation(scene={}, {radius=ACTOR_BODY_RADIUS,allowOutside=false}={}){
  const cols=Math.max(1,finite(scene.cols??scene.iso?.cols,14)),rows=Math.max(1,finite(scene.rows??scene.iso?.rows,8));
  radius=Math.max(0,finite(radius,ACTOR_BODY_RADIUS));
  const doorRow=finite(scene.doorRow??scene.iso?.doorRow,3.35);
  const doorHalfWidth=Math.max(0,finite(scene.doorHalfWidth??scene.iso?.doorHalfWidth,1.15));
  const outsideDepth=Math.max(0,finite(scene.outsideDepth??scene.iso?.outsideDepth,1.5));
  const footprints={...DEFAULT_FOOTPRINTS,...scene.footprints};
  const obstacles=[];
  for(const item of Array.isArray(scene.layout)?scene.layout:[]){
    if(!isSolidFurniture(item))continue;
    obstacles.push(furnitureBounds(item,footprints));
  }
  // Physical architecture is independent of its visibility or its inventory
  // classification. The same bounds contract covers imported geometry, fixed
  // partitions and structural columns excluded from the furniture catalogue.
  for(const [index,collider] of (Array.isArray(scene.colliders)?scene.colliders:[]).entries()){
    if(!collider||!['minCol','maxCol','minRow','maxRow'].every(k=>Number.isFinite(Number(collider[k]))))continue;
    const box={id:String(collider.id??'collider:'+index),minCol:Number(collider.minCol),maxCol:Number(collider.maxCol),minRow:Number(collider.minRow),maxRow:Number(collider.maxRow)};
    if(box.minCol<=box.maxCol&&box.minRow<=box.maxRow)obstacles.push(box);
  }
  // Distribuir's fixed hardness cells represent architecture, rather than the
  // transient blocked/occupied grid which already contains furniture/people.
  for(const cell of Array.isArray(scene.hardness?.fixed)?scene.hardness.fixed:[]){
    const coordinates=String(cell).split(',');if(coordinates.length!==2||coordinates.some(value=>!value.trim()))continue;
    const [col,row]=coordinates.map(Number);
    if(Number.isFinite(col)&&Number.isFinite(row))obstacles.push({id:'hardness:'+cell,minCol:col,maxCol:col+1,minRow:row,maxRow:row+1});
  }
  const key=JSON.stringify([cols,rows,radius,allowOutside,doorRow,doorHalfWidth,outsideDepth,obstacles]);
  function inBounds(p){
    // Isometric projection and its inverse can move an exact portal vertex by
    // a few ulps. Share the slab epsilon, so that numerical noise does not
    // classify a room-edge point as an outside wall crossing.
    if(p.row<radius-EPS||p.row>rows-radius+EPS||p.col<radius-EPS)return false;
    if(p.col<=cols-radius+EPS)return true;
    return allowOutside&&p.col<=cols+outsideDepth+EPS&&p.row>=doorRow-doorHalfWidth+radius-EPS&&p.row<=doorRow+doorHalfWidth-radius+EPS;
  }
  function isWalkable(value){const p=point(value);return valid(p)&&inBounds(p)&&!obstacles.some(box=>touchesSegment(p,p,box,radius));}
  function segmentClear(start,end){
    const a=point(start),b=point(end);
    if(!valid(a)||!valid(b)||!inBounds(a)||!inBounds(b))return false;
    // The room plus vestibule is non-convex. At their shared boundary a
    // segment must cross the actual opening, even for a sub-pixel corner cut.
    const roomEdge=cols-radius;
    if((a.col>roomEdge+EPS)!==(b.col>roomEdge+EPS)){
      const t=Math.max(0,Math.min(1,(roomEdge-a.col)/(b.col-a.col))),crossRow=a.row+(b.row-a.row)*t;
      if(crossRow<doorRow-doorHalfWidth+radius-EPS||crossRow>doorRow+doorHalfWidth-radius+EPS)return false;
    }
    return !obstacles.some(box=>touchesSegment(a,b,box,radius));
  }
  // Coarse samples are only a compatibility fallback for an invalid target;
  // routing itself never depends on a passage lining up with this grid.
  let samples;
  function recoverySamples(){
    if(samples)return samples;
    samples=[];
    for(let col=.25;col<cols+(allowOutside?outsideDepth:0);col+=STEP)for(let row=.25;row<rows;row+=STEP){
      const p={col,row};if(isWalkable(p))samples.push(p);
    }
    return samples;
  }
  let visibility;
  function visibilityGraph(){
    if(visibility)return visibility;
    const nodes=[],seen=new Set();
    const add=(col,row)=>{
      const p={col,row},id=col.toFixed(8)+','+row.toFixed(8);
      if(!seen.has(id)&&isWalkable(p)){seen.add(id);nodes.push(p);}
    };
    // A shortest route around axis-aligned solids bends at their expanded
    // corners. Keeping those vertices supports arbitrary fractional layouts
    // and leaves at most four candidates per solid, rather than a dense grid.
    for(const box of obstacles){
      for(const col of [box.minCol-radius-CORNER_CLEARANCE,box.maxCol+radius+CORNER_CLEARANCE]){
        for(const row of [box.minRow-radius-CORNER_CLEARANCE,box.maxRow+radius+CORNER_CLEARANCE])add(col,row);
      }
    }
    for(const col of [radius,cols-radius])for(const row of [radius,rows-radius])add(col,row);
    if(allowOutside){
      const low=Math.max(radius,doorRow-doorHalfWidth+radius),high=Math.min(rows-radius,doorRow+doorHalfWidth-radius);
      if(low<=high)for(const col of [cols-radius,cols+outsideDepth])for(const row of [low,high])add(col,row);
    }
    const edges=nodes.map(()=>[]);
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      if(!segmentClear(nodes[i],nodes[j]))continue;
      const d=distance(nodes[i],nodes[j]);edges[i].push([j,d]);edges[j].push([i,d]);
    }
    return visibility={nodes,edges};
  }
  function resolve(value,{from,accept,strict=false}={}){
    const p=point(value);if(!valid(p))return null;
    const origin=from===undefined?null:point(from);
    if(origin&&!isWalkable(origin))return null;
    if(accept!==undefined&&typeof accept!=='function')return null;
    // A visit's semantic destination may belong to a specific side of a door.
    // Correcting a blocked inside target to the vestibule is not an entry, nor
    // is reaching an inside waiting position a completed exit. This predicate
    // only filters corrections; it never adds an edge through a solid.
    const acceptable=candidate=>!accept||accept({...candidate})===true;
    let reachableNodes;
    const reachable=candidate=>{
      if(!origin||segmentClear(origin,candidate))return true;
      const graph=visibilityGraph();
      if(!reachableNodes){
        const pending=[];reachableNodes=new Set();
        for(let i=0;i<graph.nodes.length;i++)if(segmentClear(origin,graph.nodes[i])){pending.push(i);reachableNodes.add(i);}
        for(let at=0;at<pending.length;at++)for(const [next] of graph.edges[pending[at]]){
          if(!reachableNodes.has(next)){reachableNodes.add(next);pending.push(next);}
        }
      }
      for(const i of reachableNodes)if(segmentClear(graph.nodes[i],candidate))return true;
      return false;
    };
    // An already walkable destination on the other side of a sealed partition
    // stays unreachable. Only invalid destinations may receive a correction.
    if(isWalkable(p))return acceptable(p)&&reachable(p)?p:null;
    if(strict)return null;
    let best=null,score=Infinity;
    const consider=candidate=>{const d=distance(p,candidate);if(d<score&&isWalkable(candidate)&&acceptable(candidate)&&reachable(candidate)){score=d;best=candidate;}};
    // Project onto expanded surfaces as well as their corners. Recovery then
    // works inside a narrow off-grid region and need not jump half a tile.
    const bounded={col:Math.max(radius,Math.min(cols-radius,p.col)),row:Math.max(radius,Math.min(rows-radius,p.row))};
    consider(bounded);
    for(const box of obstacles){
      const minCol=box.minCol-radius-CORNER_CLEARANCE,maxCol=box.maxCol+radius+CORNER_CLEARANCE;
      const minRow=box.minRow-radius-CORNER_CLEARANCE,maxRow=box.maxRow+radius+CORNER_CLEARANCE;
      for(const col of [minCol,maxCol])consider({col,row:Math.max(minRow,Math.min(maxRow,p.row))});
      for(const row of [minRow,maxRow])consider({col:Math.max(minCol,Math.min(maxCol,p.col)),row});
    }
    for(const candidate of visibilityGraph().nodes)consider(candidate);
    for(const candidate of recoverySamples())consider(candidate);
    return best?{...best}:null;
  }
  function route(start,end){
    const a=point(start),b=point(end);
    // Never invent a safe start and then draw a line through the intervening
    // furniture. A newly placed obstacle requires waiting for a safe route.
    if(!isWalkable(a)||!isWalkable(b))return null;
    if(distance(a,b)<EPS)return [];
    if(segmentClear(a,b))return [b];
    const graph=visibilityGraph(),all=[a,...graph.nodes,b],last=all.length-1;
    // Static visibility is cached for the lifetime of this layout. Only the
    // two moving endpoints need collision checks for each new journey.
    const edges=[[],...graph.edges.map(list=>list.map(([i,d])=>[i+1,d])),[]];
    for(let i=1;i<last;i++){
      if(segmentClear(a,all[i]))edges[0].push([i,distance(a,all[i])]);
      if(segmentClear(all[i],b))edges[i].push([last,distance(all[i],b)]);
    }
    const open=new Set([0]),closed=new Set(),cost=new Map([[0,0]]),parent=new Map();
    while(open.size){
      let current=-1,score=Infinity;
      for(const i of open){const f=cost.get(i)+distance(all[i],b);if(f<score){score=f;current=i;}}
      if(current===last){
        const raw=[];let i=last;while(i!==0){raw.unshift(all[i]);i=parent.get(i);}
        // Only remove waypoints when the entire swept body segment is clear.
        const smooth=[];let from=a;
        for(let at=0;at<raw.length;){let next=at;for(let j=at+1;j<raw.length;j++)if(segmentClear(from,raw[j]))next=j;smooth.push({...raw[next]});from=raw[next];at=next+1;}
        return smooth;
      }
      open.delete(current);closed.add(current);
      for(const [next,d] of edges[current]){
        if(closed.has(next))continue;
        const candidate=cost.get(current)+d;
        if(candidate<(cost.get(next)??Infinity)){parent.set(next,current);cost.set(next,candidate);open.add(next);}
      }
    }
    return null;
  }
  return {cols,rows,radius,doorRow,doorHalfWidth,outsideDepth,allowOutside,obstacles,key,isWalkable,segmentClear,resolve,route};
}
