import {assetForInstance} from '../../inventario/model.mjs?v=scope-20261004-1';
import {isSolidFurniture} from './furniture-geometry.mjs';
import {CATALOG_COLLISION_BOUNDS} from './catalog-collision-bounds.mjs?v=actor-collision-20261004-1';
import './starbucks-room.js?v=surfaces-1';

const finite=(v,f)=>Number.isFinite(Number(v))?Number(v):f;
// Body clearance is independent of the selected quality. The largest published
// Best walking mesh reaches .593 from its root; the widest profile is 1.16.
export function actorCollisionRadius(actor={}){
  const scale=Math.max(1,Math.min(2,finite(actor.scale,1)));
  return (actor.robot||actor.kind==='unitreeBot'?.52:.72)*scale;
}

function transformedBounds(item,bounds,id){
  const [minX,maxX,minZ,maxZ]=bounds,sx=Math.abs(finite(item.sx,1)),flip=item.flipX?-1:1;
  const angle=-finite(item.rot,0)*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
  const corners=[[minX,minZ],[minX,maxZ],[maxX,minZ],[maxX,maxZ]].map(([x,z])=>{
    x*=sx*flip;z*=sx;return [finite(item.col,0)+c*x+s*z,finite(item.row,0)-s*x+c*z];
  });
  return {id,minCol:Math.min(...corners.map(p=>p[0])),maxCol:Math.max(...corners.map(p=>p[0])),minRow:Math.min(...corners.map(p=>p[1])),maxRow:Math.max(...corners.map(p=>p[1]))};
}

/** Additional solids from visible geometry, independent of image resolution.
 * Nominal furniture footprints remain in the navigation map. These envelopes
 * cover actual mesh overhangs and architecture that has no inventory unit.
 */
export function physicalColliders(scene={}){
  // Visibility is a presentation preference. A hidden physical cabinet still
  // occupies the floor until removed from the layout.
  const layout=(Array.isArray(scene.layout)?scene.layout:[]).filter(item=>item?.presentationExcluded!==true&&isSolidFurniture({...item,hidden:false})),colliders=[];
  if(scene.venue==='alsea-sbux-021'){
    const fixtures=globalThis.XpaceStarbucks.build(layout.filter(i=>i.source!=='PixerIA'),{quality:'best',moving:false});
    for(const fixture of fixtures){
      const parts=fixture.parts.filter(part=>part.h>0&&part.y+part.h>.02&&part.y<1.9);
      if(fixture.item){
        if(!parts.length)continue;
        const item=fixture.item,bounds=[Math.min(...parts.map(p=>p.x-item.col)),Math.max(...parts.map(p=>p.x+p.w-item.col)),Math.min(...parts.map(p=>p.z-item.row)),Math.max(...parts.map(p=>p.z+p.d-item.row))];
        colliders.push(transformedBounds(item,bounds,'geometry:'+fixture.id));
      }else{
        // Floor slabs and ceiling lights do not impede a body. Retain walls,
        // steps and the balustrade, including their measured thickness.
        const remaining=parts.filter(p=>p.h>.03&&!(p.y<=0&&p.h<=.02));
        for(const [name,test] of [['rear',p=>p.z+p.d<=.5],['left',p=>p.x+p.w<=.5]]){
          const wall=remaining.filter(test);if(!wall.length)continue;
          colliders.push({id:'architecture:'+name,minCol:Math.min(...wall.map(p=>p.x)),maxCol:Math.max(...wall.map(p=>p.x+p.w)),minRow:Math.min(...wall.map(p=>p.z)),maxRow:Math.max(...wall.map(p=>p.z+p.d))});
          for(const p of wall)remaining.splice(remaining.indexOf(p),1);
        }
        remaining.forEach((p,i)=>colliders.push({id:'architecture:'+i,minCol:p.x,maxCol:p.x+p.w,minRow:p.z,maxRow:p.z+p.d}));
      }
    }
  }
  for(const item of layout){
    if(scene.venue==='alsea-sbux-021'&&item.id?.startsWith('sb-'))continue;
    const bounds=CATALOG_COLLISION_BOUNDS[assetForInstance(item)];
    if(bounds)colliders.push(transformedBounds(item,bounds,'geometry:'+item.id));
  }
  if(scene.venue!=='alsea-sbux-021'&&scene.roomId!=='cafebreria'&&scene.imported!==true){
    // The retail cutaway's window reveals, sill and wall screens extend into
    // the room beyond its mathematical zero-width perimeter.
    const cols=finite(scene.cols,14),rows=finite(scene.rows,8);
    colliders.push({id:'architecture:rear-wall',minCol:-.19,maxCol:cols+.19,minRow:-.26,maxRow:.315});
    colliders.push({id:'architecture:left-wall',minCol:-.26,maxCol:.16,minRow:-.19,maxRow:rows+.19});
    const center=finite(scene.doorRow,3.35),half=Math.max(.1,finite(scene.doorHalfWidth,1)),open=Math.max(0,Math.min(1,finite(scene.doorOpen,0)));
    for(const row of [center-half,center+half])colliders.push({id:'architecture:door-jamb:'+row,minCol:cols+.045,maxCol:cols+.115,minRow:row-.035,maxRow:row+.035});
    const width=Math.max(.06,half*2-.14),hinge={col:cols+.08,row:center+half-.035,rot:open*.96};
    colliders.push(transformedBounds(hinge,[-.015,.015,-width-.035,-.035],'architecture:door-leaf'));
  }
  return colliders;
}
