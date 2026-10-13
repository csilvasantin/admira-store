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
// Inverse of projectMatrixFloor: the floor cell under a point of the image. The
// result is not clamped, so a pointer outside the room still pulls a piece
// towards the nearest wall instead of freezing it.
export function unprojectMatrixFloor(x,y,cols=14,rows=8){
  const [a,b,c,d]=MATRIX_FLOOR_POLYGON,cross=(p,q)=>p[0]*q[1]-p[1]*q[0];
  const e=[b[0]-a[0],b[1]-a[1]],f=[d[0]-a[0],d[1]-a[1]],g=[a[0]-b[0]+c[0]-d[0],a[1]-b[1]+c[1]-d[1]],h=[x-a[0],y-a[1]];
  const k2=cross(g,f),k1=cross(e,f)+cross(h,g),k0=cross(h,e);
  const along=v=>{const dx=e[0]+g[0]*v,dy=e[1]+g[1]*v;return Math.abs(dx)>=Math.abs(dy)?(h[0]-f[0]*v)/dx:(h[1]-f[1]*v)/dy;};
  let roots;
  if(Math.abs(k2)<1e-9)roots=[-k0/k1];
  else{const w=Math.sqrt(Math.max(0,k1*k1-4*k0*k2));roots=[(-k1-w)/(2*k2),(-k1+w)/(2*k2)];}
  // Of the two mathematical solutions only one lies on this side of the floor.
  const outside=n=>Math.max(0,-n,n-1);
  const [u,v]=roots.map(v=>[along(v),v]).filter(p=>p.every(Number.isFinite)).sort((p,q)=>outside(p[0])+outside(p[1])-outside(q[0])-outside(q[1]))[0]||[0,0];
  const width=Number.isFinite(cols)&&cols>0?cols:14,depth=Number.isFinite(rows)&&rows>0?rows:8;
  return {col:u*width,row:v*depth};
}
