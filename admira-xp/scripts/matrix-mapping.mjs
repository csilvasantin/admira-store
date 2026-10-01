export const MATRIX_CAPTURE={id:'alsea-starbucks-360',source:'https://panorama-viewer-d8j.pages.dev/',image:'https://panorama-viewer-d8j.pages.dev/img/starbucks-demo.webp',yaw:160.4651749580645,pitch:-13.367460789032352,fov:100,sphereX:-3};
export const MAPPING_KEY='xpace_matrix_alsea_players_v1';
export function previewURL(value){
 if(!String(value||'').trim())return '';
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validateMapping(value){
 if(!value||value.version!==1||value.capture!==MATRIX_CAPTURE.id||!Array.isArray(value.players)||value.players.length>24)throw Error('Invalid capture or player list');
 const ids=new Set();
 const players=value.players.map(p=>{
  if(!p||typeof p.id!=='string'||!p.id||p.id.length>100||ids.has(p.id)||!Array.isArray(p.corners)||p.corners.length!==4)throw Error('Invalid player');ids.add(p.id);
  const corners=p.corners.map(c=>{if(!c||!Number.isFinite(c.yaw)||!Number.isFinite(c.pitch)||Math.abs(c.pitch)>90||Math.abs(c.yaw)>360)throw Error('Invalid screen corner');return {yaw:c.yaw,pitch:c.pitch};});
  const url=previewURL(p.url);if(url===null)throw Error('HTTPS preview URL required');
  if(!['frame','video','image'].includes(p.type))throw Error('Invalid preview type');
  const size={};if(p.width!==undefined||p.height!==undefined){if(!Number.isFinite(p.width)||!Number.isFinite(p.height)||p.width<64||p.height<64||p.width>4096||p.height>4096)throw Error('Invalid player dimensions');size.width=p.width;size.height=p.height;}
  return {...size,id:p.id,name:String(p.name||'Player').slice(0,100),playerId:String(p.playerId||'').slice(0,200),url,type:p.type,corners};
 });
 return {version:1,capture:MATRIX_CAPTURE.id,players};
}
// Homography from a unit rectangle to four viewport corners, in TL/TR/BR/BL order.
export function quadTransform(points,width=640,height=360){
 if(points.length!==4||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 const turns=points.map((p,i)=>{const q=points[(i+1)%4],r=points[(i+2)%4];return (q.x-p.x)*(r.y-q.y)-(q.y-p.y)*(r.x-q.x);});
 if(!turns.every(n=>n>1e-6)&&!turns.every(n=>n< -1e-6))return null;
 const src=[[0,0],[1,0],[1,1],[0,1]],rows=[];
 for(let i=0;i<4;i++){const [x,y]=src[i],{x:u,y:v}=points[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 for(let col=0;col<8;col++){
  let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
  if(Math.abs(rows[pivot][col])<1e-9)return null;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];
  const d=rows[col][col];for(let j=col;j<9;j++)rows[col][j]/=d;
  for(let row=0;row<8;row++){if(row===col)continue;const f=rows[row][col];for(let j=col;j<9;j++)rows[row][j]-=f*rows[col][j];}
 }
 const h=rows.map(row=>row[8]);return [h[0]/width,h[3]/width,0,h[6]/width,h[1]/height,h[4]/height,0,h[7]/height,0,0,1,0,h[2],h[5],0,1];
}
