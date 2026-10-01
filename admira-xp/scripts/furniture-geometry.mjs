// Shared floor footprints: the same origin, quarter-turns, mirror and horizontal
// scale used by Life's THREE groups. Height (sy) never changes floor occupancy.
export const FLOOR_FOOTPRINTS=Object.freeze({counter:[1,2],shelves:[1,2],wineRack:[2,1],lottery:[2,1],vending:[1,1],magazines:[2,1],manager:[2,1],plant:[1,1],floorLamp:[1,1],rug:[2,2],djBooth:[2,1],tablet:[1,1],turnKiosk:[1,1],aroma:[1,1],metahuman:[1,1],cafeTable:[1,1],bookcase:[1,2],sofa:[2,1]});
const WALL_TYPES=new Set(['led','tft','aroma','door']);
export const isWallFurniture=item=>item?.mount==='wall'||WALL_TYPES.has(item?.type);
export const isSolidFurniture=item=>item&&item.hidden!==true&&!isWallFurniture(item)&&item.type!=='rug';
const number=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
export function furnitureBounds(item,footprints={}){
  const fp=Array.isArray(item?.fp)?item.fp:footprints[item?.type]||FLOOR_FOOTPRINTS[item?.type]||[1,1];
  const w=Math.max(.1,number(fp[0],1)),d=Math.max(.1,number(fp[1],1));
  const scale=Math.max(.1,Math.abs(number(item?.sx,1))),flip=item?.flipX?-1:1;
  const angle=-number(item?.rot,0)*Math.PI/2,cos=Math.cos(angle),sin=Math.sin(angle);
  const corners=[[0,0],[w,0],[w,d],[0,d]].map(([x,z])=>{
    x*=scale*flip;z*=scale;
    return {col:number(item?.col,0)+cos*x+sin*z,row:number(item?.row,0)-sin*x+cos*z};
  });
  return {id:String(item?.id??item?.type),minCol:Math.min(...corners.map(p=>p.col)),maxCol:Math.max(...corners.map(p=>p.col)),minRow:Math.min(...corners.map(p=>p.row)),maxRow:Math.max(...corners.map(p=>p.row))};
}
