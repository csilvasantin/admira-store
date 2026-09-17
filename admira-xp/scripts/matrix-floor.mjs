// Floor corners measured on the empty Avenida Admira room, in image coordinates.
// Furniture and visitors use the same projection, independently of quality tier.
export const MATRIX_FLOOR_POLYGON=Object.freeze([
  [.348,.318],[.966,.720],[.570,.943],[.020,.531]
].map(point=>Object.freeze(point)));
export function projectMatrixFloor(col,row,cols=14,rows=8){
  const unit=(n,d,fallback)=>Math.max(0,Math.min(1,n/(Number.isFinite(d)&&d>0?d:fallback)));
  const u=unit(col,cols,14),v=unit(row,rows,8);
  const [back,right,front,left]=MATRIX_FLOOR_POLYGON;
  const blend=i=>(1-u)*(1-v)*back[i]+u*(1-v)*right[i]+u*v*front[i]+(1-u)*v*left[i];
  return {x:blend(0),y:blend(1),depth:(u+v)/2};
}
