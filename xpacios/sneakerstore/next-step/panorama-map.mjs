import {JORDAN_PANELS} from '../jordan-reference.mjs';

// Photographic calibration on the original 2048 × 1024 equirectangular grid.
// Corners: top left, top right, bottom left, bottom right. No device inventory changes.
const q=(installation,quad,screen)=>({installation,quad,screen});
const row=(x0,x1,y0,y1)=>q('strip',[[x0,y0],[x1,y0+3],[x0,y1],[x1,y1+3]]);
export const PANORAMA_MAP={
 entrada:{yaw:2.65,surfaces:[
  q('portrait',[[257,479],[394,485],[256,724],[390,770]]),
  q('tablet',[[421,535],[463,537],[421,593],[461,596]]),
  ...JORDAN_PANELS.map((p,n)=>q('jordan',p.quad,n)),
  q('landscape',[[926,480],[947,479],[926,514],[947,515]]),
  q('column',[[1408,348],[1490,340],[1413,800],[1522,804]]),
  q('landscape',[[1194,331],[1287,267],[1204,390],[1299,346]]),
  q('landscape',[[1628,218],[1812,265],[1625,288],[1799,331]]),
  q('landscape',[[1123,390],[1145,376],[1124,426],[1148,413]]),
  q('strip',[[1298,454],[1405,442],[1299,464],[1406,453]]),
  q('strip',[[1295,551],[1408,552],[1295,560],[1409,562]]),
  q('strip',[[1310,647],[1414,654],[1310,656],[1414,666]]),
  q('rear',[[990,495],[1047,497],[990,552],[1047,552]])
 ],occluders:[[[1007,524],[1035,524],[1035,552],[1007,552]]]},
 centro:{yaw:2.25,surfaces:[
  q('landscape',[[532,343],[890,426],[532,684],[890,608]]),
  q('landscape',[[194,400],[282,374],[194,472],[282,445]]),
  q('landscape',[[1379,230],[1617,219],[1377,297],[1614,293]]),
  q('landscape',[[1804,280],[1885,321],[1796,343],[1875,382]]),
  q('landscape',[[1161,362],[1217,325],[1168,406],[1225,375]]),
  q('landscape',[[1945,382],[1960,397],[1940,415],[1957,429]]),
  ...[
   [[97,439],[109,433],[97,488],[109,482]],[[111,416],[125,409],[111,494],[125,487]],
   [[128,411],[143,406],[128,501],[143,495]],[[145,427],[152,425],[145,491],[152,488]],
   [[154,440],[160,438],[154,484],[160,481]]
  ].map((quad,n)=>q('jordan',quad,n)),
  q('rear',[[953,461],[1076,461],[953,564],[1076,564]]),
  row(1438,1580,516,533),row(1601,1714,517,531),row(1590,1691,658,672),
  row(1750,1810,525,537),row(1726,1787,626,638)
 ],occluders:[[[994,507],[1038,507],[1038,563],[994,563]],[[993,563],[1076,563],[1076,600],[993,600]]]},
 fondo:{yaw:Math.PI,surfaces:[
  q('rear',[[850,397],[941,387],[845,659],[934,655]],0),
  q('rear',[[941,387],[1039,386],[939,498],[1040,498]],1),
  q('rear',[[1039,386],[1140,397],[1045,655],[1147,656]],2),
  q('landscape',[[347,396],[488,393],[347,432],[488,432]]),
  q('landscape',[[1843,319],[1898,347],[1837,369],[1892,399]]),
  q('landscape',[[1943,390],[1963,406],[1939,422],[1959,438]]),
  row(326,492,493,509),row(319,495,577,594),row(316,490,647,664),row(315,486,705,721),
  q('strip',[[1558,533],[1734,527],[1559,546],[1734,541]]),
  q('strip',[[1572,638],[1763,621],[1573,651],[1764,635]]),
  q('strip',[[1580,705],[1782,681],[1581,719],[1783,695]]),
  q('strip',[[1591,767],[1789,732],[1593,780],[1790,746]])
 ],occluders:[
  [[939,498],[1040,498],[1045,635],[934,639]],
  [[842,659],[886,659],[895,651],[906,652],[918,641],[939,632],[951,636],[969,647],[1009,649],[1010,634],[1023,626],[1023,612],[1034,606],[1054,606],[1064,613],[1061,627],[1081,633],[1094,639],[1096,646],[1132,643],[1146,640],[1150,650],[1150,683],[842,683]],
  [[1175,604],[1230,604],[1230,661],[1175,661]]
 ]}
};

export function photoRay([x,y]){const phi=x/2048*Math.PI*2,theta=y/1024*Math.PI;return [Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)];}
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const normal=a=>{const n=Math.hypot(...a);return a.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// Project the four observed rays to a tangent plane, then solve a homography.
// Straight physical edges remain straight in a perspective view, even at the seam.
export function projectQuad(quad){
 const rays=quad.map(photoRay),n=normal(rays.reduce((a,r)=>a.map((v,i)=>v+r[i]),[0,0,0])),right=normal(cross([0,1,0],n)),up=cross(n,right);
 const points=rays.map(r=>[dot(r,right)/dot(r,n),dot(r,up)/dot(r,n)]),a=[];
 [[0,0],[1,0],[0,1],[1,1]].forEach(([u,v],i)=>{const [x,y]=points[i];a.push([u,v,1,0,0,0,-u*x,-v*x,x],[0,0,0,u,v,1,-u*y,-v*y,y]);});
 for(let col=0;col<8;col++){let pivot=col;for(let j=col+1;j<8;j++)if(Math.abs(a[j][col])>Math.abs(a[pivot][col]))pivot=j;[a[col],a[pivot]]=[a[pivot],a[col]];const k=a[col][col];if(Math.abs(k)<1e-12)throw Error('Degenerate panorama screen');for(let j=col;j<9;j++)a[col][j]/=k;for(let row=0;row<8;row++){if(row===col)continue;const f=a[row][col];for(let j=col;j<9;j++)a[row][j]-=f*a[col][j];}}
 const h=a.map(row=>row[8]);return(u,v)=>{const d=h[6]*u+h[7]*v+1,x=(h[0]*u+h[1]*v+h[2])/d,y=(h[3]*u+h[4]*v+h[5])/d;return normal(n.map((z,i)=>z+x*right[i]+y*up[i]));};
}
