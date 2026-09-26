// Pixeria personas (Anonimizador) as visitors in every tier (24-sep-2026).
// Good (8 bits) already draws the NPC sprite Pixeria sends. For the other
// tiers the worker builds, once per persona, a package: a style card (gender,
// age, palette, hair, outfit) that Better 16 and Best 32 apply to their bodies,
// and two 3x3 walk grids (front/back) that Matrix 64 turns here into a 9x2 walk
// sheet: chroma keyed, each frame realigned to XpaceOS' own base body (feet on
// the same line, torso on the same axis) and cut with that body as a mould.
// Tests and local runs may point to a local worker (wrangler dev).
const LOCAL_WORKER=/^http:\/\/(127\.0\.0\.1|localhost):\d+$/;
const localOverride=(()=>{try{const v=new URLSearchParams(location.search).get('personaWorker');return v&&LOCAL_WORKER.test(v)?v:null;}catch{return null;}})();
const WORKER=(typeof window!=='undefined'&&window.__xtancoPersonaWorker)||localOverride||'https://api.admira.store';
const BASE='assets/people/matrix-walk/';
const W=192,H=288,COLS=9;
const personas=new Map();
const listeners=new Set();
const HAIR={short:'short',long:'long',curly:'curly',bob:'bob',bald:'short',ponytail:'long'};
const OUTFIT={tshirt:'tshirt',shirt:'shirt',jacket:'jacket',knit:'knit',suit:'jacket',coat:'jacket',dress:'tshirt'};
const ACCESSORY={none:'none',glasses:'glasses',cap:'cap',backpack:'backpack',headphones:'headphones',scarf:'scarf',bag:'backpack'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

export function normalizePersonaStyle(style){
  if(!style||typeof style!=='object')return null;
  const hex=v=>/^#[0-9a-f]{6}$/i.test(v||'')?v:null,p=style.palette||{};
  return Object.freeze({
    gender:style.gender==='f'?'f':'m',
    age:['child','adult','senior'].includes(style.age)?style.age:'adult',
    hairstyle:HAIR[style.hairstyle]||'short',outfit:OUTFIT[style.outfit]||'tshirt',accessory:ACCESSORY[style.accessory]||'none',
    height:1,width:1,
    palette:Object.freeze({skin:hex(p.skin)||'#c9a283',hair:hex(p.hair)||'#3b3028',color:hex(p.color)||'#8a8a8a',pants:hex(p.pants)||'#4a4a4a',shoes:hex(p.shoes)||'#2a2a2a'})
  });
}
export function subscribePixeriaPersonas(fn){listeners.add(fn);return()=>listeners.delete(fn);}
const emit=id=>{for(const fn of listeners){try{fn(id);}catch{}}};

/** Style card for Better/Best once described; null until then or without persona. */
export function pixeriaPersonaStyle(id){const p=ensure(id);return p?.style||null;}
/** Blob URL of the processed 9x2 walk sheet for Matrix; null until ready. */
export function pixeriaWalkSheet(id){const p=ensure(id);return p?.sheet||null;}
export function pixeriaPersonaState(id){return personas.get(id)?.state||'unknown';}

function ensure(id){
  if(!id||typeof id!=='string'||!/^npc_[a-z0-9-]{4,}$/i.test(id)||typeof fetch!=='function')return null;
  let p=personas.get(id);
  if(!p){p={id,state:'loading',style:null,sheet:null};personas.set(id,p);drive(p).catch(()=>{p.state='failed';emit(id);});}
  return p;
}
async function api(path,method='GET'){
  const r=await fetch(WORKER+path,{method,cache:'no-store'});
  return {status:r.status,body:await r.json().catch(()=>({}))};
}
// Walk the worker's steps in order. Another open store may hold a step: then
// we just poll the manifest. Nothing is generated twice.
async function drive(p){
  for(let round=0;round<120;round++){
    const {status,body}=await api(`/twin/persona?id=${p.id}`);
    if(status===404){p.state='none';emit(p.id);return;}
    if(body.style&&!p.style){p.style=normalizePersonaStyle(body.style);p.body=body.body;emit(p.id);}
    if(body.ready&&body.walk?.front&&body.walk?.back){
      p.sheet=await buildSheet(body.body,body.walk.front,body.walk.back);p.state='ready';emit(p.id);return;
    }
    const next=['describe','front','back'].find(s=>!body.steps?.[s]?.done);
    const step=body.steps?.[next];
    if(step?.failed&&Date.now()-step.failed<60000){await sleep(15000);continue;}
    if(step?.claimed&&Date.now()-step.claimed<180000){await sleep(4000);continue;}
    const built=await api(`/twin/persona/build?id=${p.id}&step=${next}`,'POST');
    if(built.status===202)await sleep(4000);
    else if(built.status>=400)await sleep(15000);
  }
  p.state='failed';emit(p.id);
}

function loadImage(src,cors){
  return new Promise((resolve,reject)=>{const im=new Image();if(cors)im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('img '+src));im.src=src;});
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function alphaBox(data,w,h,thr=40){
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>thr){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  return x1<0?null:{x0,y0,x1,y1};
}
function torsoX(data,w,box){
  let sum=0,n=0;const yEnd=box.y0+Math.round((box.y1-box.y0)*.45);
  for(let y=box.y0;y<=yEnd;y++)for(let x=box.x0;x<=box.x1;x++)if(data[(y*w+x)*4+3]>40){sum+=x;n++;}
  return n?sum/n:(box.x0+box.x1)/2;
}
// Chroma key with despill, straight on the pixels (same thresholds as the offline pass).
export function keyChroma(data){
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2],green=g-Math.max(r,b);
    const alpha=1-Math.min(1,Math.max(0,(green-18)/(55-18)));
    data[i+1]=Math.min(g,Math.max(r,b)+6);data[i+3]=Math.round(alpha*255);
  }
  return data;
}
// Dilated mould of the reference silhouette (+7 px), as a 0/1 mask.
function mould(ref,w,h,radius=7){
  const solid=new Uint8Array(w*h);for(let i=0;i<w*h;i++)solid[i]=ref[i*4+3]>30?1:0;
  const row=new Uint8Array(w*h),out=new Uint8Array(w*h);
  for(let y=0;y<h;y++){let last=-1e9;for(let x=0;x<w;x++){if(solid[y*w+x])last=x;row[y*w+x]=x-last<=radius?1:0;}last=1e9;for(let x=w-1;x>=0;x--){if(solid[y*w+x])last=x;if(last-x<=radius)row[y*w+x]=1;}}
  for(let x=0;x<w;x++){let last=-1e9;for(let y=0;y<h;y++){if(row[y*w+x])last=y;out[y*w+x]=y-last<=radius?1:0;}last=1e9;for(let y=h-1;y>=0;y--){if(row[y*w+x])last=y;if(last-y<=radius)out[y*w+x]=1;}}
  return out;
}
async function buildSheet(body,frontUrl,backUrl){
  const [base,front,back]=await Promise.all([loadImage(new URL('../'+BASE+`base-${body}.webp`,import.meta.url).href),loadImage(frontUrl,true),loadImage(backUrl,true)]);
  const sheet=canvas(W*COLS,H*2),sctx=sheet.getContext('2d');
  const baseC=canvas(W*COLS,H*2),bctx=baseC.getContext('2d',{willReadFrequently:true});bctx.drawImage(base,0,0,W*COLS,H*2);
  for(const [row,grid] of [[0,front],[1,back]]){
    const g=canvas(W*6,H*6),gctx=g.getContext('2d',{willReadFrequently:true});gctx.drawImage(grid,0,0,W*6,H*6);
    const img=gctx.getImageData(0,0,W*6,H*6);keyChroma(img.data);gctx.putImageData(img,0,0);
    const cells=[],refs=[],ratios=[];
    for(let k=0;k<9;k++){
      const c=canvas(W,H),cctx=c.getContext('2d',{willReadFrequently:true});
      cctx.drawImage(g,(k%3)*W*2,Math.floor(k/3)*H*2,W*2,H*2,0,0,W,H);
      const out=cctx.getImageData(0,0,W,H),ref=bctx.getImageData(k*W,row*H,W,H);
      const ob=alphaBox(out.data,W,H),rb=alphaBox(ref.data,W,H);
      cells.push({c,out,ob});refs.push({ref,rb});
      if(ob&&rb)ratios.push((rb.y1-rb.y0)/(ob.y1-ob.y0));
    }
    ratios.sort((a,b)=>a-b);const s=ratios.length?ratios[ratios.length>>1]:1;
    for(let k=0;k<9;k++){
      const {c,out,ob}=cells[k],{ref,rb}=refs[k];if(!ob||!rb)continue;
      const own=(rb.y1-rb.y0)/(ob.y1-ob.y0),scale=Math.abs(own/s-1)>.10?own:s;
      const dx=torsoX(ref.data,W,rb)-torsoX(out.data,W,ob)*scale,dy=rb.y1-ob.y1*scale;
      const cell=canvas(W,H),x=cell.getContext('2d',{willReadFrequently:true});
      x.drawImage(c,0,0,W,H,dx,dy,W*scale,H*scale);
      const d=x.getImageData(0,0,W,H),m=mould(ref.data,W,H);
      for(let i=0;i<W*H;i++)if(!m[i])d.data[i*4+3]=0;
      x.putImageData(d,0,0);sctx.drawImage(cell,k*W,row*H);
    }
  }
  const blob=await new Promise(r=>sheet.toBlob(r,'image/webp',.88));
  return blob?URL.createObjectURL(blob):sheet.toDataURL('image/png');
}
