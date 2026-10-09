// Shared active-aperture projection. Corners are TL/TR/BR/BL; the source is [0,1]².
// A valid transform has one convex footprint and a positive denominator everywhere.
const EPS=1e-10;
export function surfaceHomography(points){
 if(!Array.isArray(points)||points.length!==4||points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 const cx=points.reduce((n,p)=>n+p.x/4,0),cy=points.reduce((n,p)=>n+p.y/4,0);
 const scale=Math.max(...points.map(p=>Math.max(Math.abs(p.x-cx),Math.abs(p.y-cy))));
 if(!Number.isFinite(scale)||scale<=0)return null;
 const normalized=points.map(p=>({x:(p.x-cx)/scale,y:(p.y-cy)/scale}));
 const turns=normalized.map((p,i)=>{const q=normalized[(i+1)%4],r=normalized[(i+2)%4];return (q.x-p.x)*(r.y-q.y)-(q.y-p.y)*(r.x-q.x);});
 if(!turns.every(n=>n>EPS)&&!turns.every(n=>n< -EPS))return null;
 const rows=[],source=[[0,0],[1,0],[1,1],[0,1]];
 for(let i=0;i<4;i++){const [u,v]=source[i],{x,y}=normalized[i];rows.push([u,v,1,0,0,0,-x*u,-x*v,x],[0,0,0,u,v,1,-y*u,-y*v,y]);}
 for(let col=0;col<8;col++){
  let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
  if(Math.abs(rows[pivot][col])<EPS)return null;
  [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
  const d=rows[col][col];for(let j=col;j<9;j++)rows[col][j]/=d;
  for(let row=0;row<8;row++){if(row===col)continue;const f=rows[row][col];for(let j=col;j<9;j++)rows[row][j]-=f*rows[col][j];}
 }
 const h=rows.map(row=>row[8]),denominators=[1,1+h[6],1+h[6]+h[7],1+h[7]];
 if(denominators.some(d=>!Number.isFinite(d)||d<=EPS))return null;
 const result=[scale*h[0]+cx*h[6],scale*h[1]+cx*h[7],scale*h[2]+cx,scale*h[3]+cy*h[6],scale*h[4]+cy*h[7],scale*h[5]+cy,h[6],h[7],1];
 return result.every(Number.isFinite)?result:null;
}
export function projectSurfacePoint(h,u,v){
 if(!Array.isArray(h)||h.length!==9||!h.every(Number.isFinite)||!Number.isFinite(u)||!Number.isFinite(v)||u<0||u>1||v<0||v>1)return null;
 const d=h[6]*u+h[7]*v+h[8];if(!Number.isFinite(d)||d<=EPS)return null;
 const point={x:(h[0]*u+h[1]*v+h[2])/d,y:(h[3]*u+h[4]*v+h[5])/d};
 return Number.isFinite(point.x)&&Number.isFinite(point.y)?point:null;
}
