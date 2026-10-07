// Fotos de la pantalla con su tarjeta de incidencia y logo de la marca blanca para el informe de misión de
// /cerrar incidencia (Carlos, 7-oct-2026 21:39). Todo en el navegador: el servidor no tiene canvas.
// · Foto: el 360° de Matrix pintado y copiado en la misma tarea (XpaceMatrixOptions.incidentDemo.snapshot) + la
//   tarjeta de la pantalla (su texto y colores reales del DOM) deformada sobre las esquinas calibradas, recortada
//   alrededor de la pantalla y con rótulo de telemetría. Sin 360° → render del equipo con la tarjeta.
// · Logo: el SVG de la marca del catálogo único (admiranext.com/marcablanca, el de /marca) rasterizado a JPEG.
export const BRAND_API='https://www.admiranext.com/marcablanca/api/marcas/',BRAND_ORIGIN='https://www.admiranext.com';
const BRAND_RE=/^[a-z0-9][a-z0-9-]{1,40}$/;
// Misma regla que el servidor: la marca activa (/marca) o la primera palabra de la tienda del recurso demo.
export function brandIdFor(active,resource){const a=String(active||'').trim().toLowerCase();if(BRAND_RE.test(a)&&a!=='admira')return a;const slug=/^demo:([a-z0-9-]+):/.exec(String(resource||''))?.[1]||'';return slug.split('-')[0]||'';}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Tarjeta de la pantalla en un lienzo plano: colores, borde y líneas de la tarjeta real (o del modelo si no está).
export function chipCanvas(doc,chip,w,h,{lines=[],tone='alert'}={}){
 const c=doc.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');const cs=chip&&doc.defaultView?.getComputedStyle?.(chip);
 const bg=cs?.backgroundColor||(tone==='ok'?'rgba(10,77,44,.95)':tone==='warn'?'rgba(90,58,0,.95)':'rgba(92,10,14,.95)'),border=cs?.borderTopColor||(tone==='ok'?'#3ddc84':tone==='warn'?'#ffb020':'#ff5a5f');
 const txt=chip?[...chip.children].map(e=>e.textContent.trim()).filter(Boolean):lines.filter(Boolean);
 g.fillStyle='#000';g.fillRect(0,0,w,h);g.fillStyle=bg;g.fillRect(0,0,w,h);const bw=Math.max(3,Math.round(Math.min(w,h)*0.035));g.strokeStyle=border;g.lineWidth=bw;g.strokeRect(bw/2,bw/2,w-bw,h-bw);
 const pad=w*0.07,maxW=w-2*pad,wrap=(t,font,max)=>{g.font=font;const words=t.split(/\s+/),out=[];let cur='';for(const wd of words){const n=cur?cur+' '+wd:wd;if(g.measureText(n).width>maxW&&cur){out.push(cur);cur=wd;}else cur=n;}if(cur)out.push(cur);if(out.length>max){out.length=max;out[max-1]=out[max-1].replace(/.{0,2}$/,'…');}return out;};
 for(let fit=1;fit>0.35;fit-=0.08){const big=Math.min(w*0.14,h*0.11)*fit,small=Math.min(w*0.095,h*0.064)*fit,blocks=txt.map((t,i)=>{const font=i?`${i===1?800:600} ${small}px system-ui,sans-serif`:`800 ${big}px ui-monospace,monospace`;return {font,size:i?small:big,lines:i?wrap(t,font,2):[t]};});
  const total=blocks.reduce((a,b)=>a+b.lines.length*b.size*1.15,0)+(blocks.length-1)*h*0.016;if(total>h-2*pad&&fit>0.4)continue;
  let y=(h-total)/2;g.fillStyle='#fff';g.textBaseline='top';for(const b of blocks){g.font=b.font;for(const l of b.lines){let s=l;while(g.measureText(s).width>maxW&&s.length>2)s=s.slice(0,-2)+'…';g.fillText(s,pad,y);y+=b.size*1.15;}y+=h*0.016;}break;}
 return c;
}
// Deforma `img` sobre el cuadrilátero q (TL,TR,BR,BL) con una malla de triángulos afines (bilineal).
function warp(g,img,q,n=8){const W=img.width,H=img.height,P=(u,v)=>{const top={x:q[0].x+(q[1].x-q[0].x)*u,y:q[0].y+(q[1].y-q[0].y)*u},bot={x:q[3].x+(q[2].x-q[3].x)*u,y:q[3].y+(q[2].y-q[3].y)*u};return {x:top.x+(bot.x-top.x)*v,y:top.y+(bot.y-top.y)*v};};
 const tri=(s0,s1,s2,d0,d1,d2)=>{g.save();const cx=(d0.x+d1.x+d2.x)/3,cy=(d0.y+d1.y+d2.y)/3,grow=p=>({x:p.x+(p.x-cx)*0.08,y:p.y+(p.y-cy)*0.08});const e0=grow(d0),e1=grow(d1),e2=grow(d2);g.beginPath();g.moveTo(e0.x,e0.y);g.lineTo(e1.x,e1.y);g.lineTo(e2.x,e2.y);g.closePath();g.clip();
  const ux=s1.x-s0.x,uy=s1.y-s0.y,vx=s2.x-s0.x,vy=s2.y-s0.y,Ux=d1.x-d0.x,Uy=d1.y-d0.y,Vx=d2.x-d0.x,Vy=d2.y-d0.y,det=ux*vy-vx*uy;if(Math.abs(det)<1e-9){g.restore();return;}
  const a=(Ux*vy-Vx*uy)/det,c=(Vx*ux-Ux*vx)/det,b=(Uy*vy-Vy*uy)/det,d=(Vy*ux-Uy*vx)/det,e=d0.x-a*s0.x-c*s0.y,f=d0.y-b*s0.x-d*s0.y;
  g.transform(a,b,c,d,e,f);g.drawImage(img,0,0);g.restore();};
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const u0=i/n,u1=(i+1)/n,v0=j/n,v1=(j+1)/n,s=(u,v)=>({x:u*W,y:v*H});tri(s(u0,v0),s(u1,v0),s(u1,v1),P(u0,v0),P(u1,v0),P(u1,v1));tri(s(u0,v0),s(u1,v1),s(u0,v1),P(u0,v0),P(u1,v1),P(u0,v1));}}
function caption(g,w,h,text,tone){const bh=Math.round(h*0.075);g.fillStyle='rgba(0,0,0,.72)';g.fillRect(0,h-bh,w,bh);g.fillStyle=tone==='ok'?'#3ddc84':'#ff5a5f';g.beginPath();g.arc(bh*0.55,h-bh/2,bh*0.18,0,Math.PI*2);g.fill();g.fillStyle='#fff';g.font=`600 ${Math.round(bh*0.42)}px ui-monospace,monospace`;g.textBaseline='middle';let s=text;while(g.measureText(s).width>w-bh*1.4&&s.length>4)s=s.slice(0,-2);g.fillText(s,bh,h-bh/2);}
// Foto compuesta a partir de un snapshot {canvas, scale, quad, node}. Devuelve un data URL JPEG.
export function composeScreenPhoto(doc,snap,{text='',tone='alert',lines=[],maxW=900}={}){
 const k=snap.scale||1,q=snap.quad.map(p=>({x:p.x*k,y:p.y*k})),src=snap.canvas,chip=snap.node?.querySelector?.(':scope>.matrix-incident-chip')||null;
 const work=doc.createElement('canvas');work.width=src.width;work.height=src.height;const g=work.getContext('2d');g.drawImage(src,0,0);
 const ew=(dist(q[0],q[1])+dist(q[3],q[2]))/2,eh=(dist(q[0],q[3])+dist(q[1],q[2]))/2,cw=Math.round(Math.max(180,Math.min(720,ew*2.2))),ch=Math.round(cw*eh/Math.max(1,ew));
 warp(g,chipCanvas(doc,chip,cw,ch,{lines,tone}),q);
 const xs=q.map(p=>p.x),ys=q.map(p=>p.y),bw=Math.max(...xs)-Math.min(...xs),bh=Math.max(...ys)-Math.min(...ys),cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;
 let cropH=Math.max(bh*1.75,bw*1.6/0.95),cropW=cropH*0.95;cropW=Math.min(cropW,src.width);cropH=Math.min(cropH,src.height);
 const x0=Math.max(0,Math.min(src.width-cropW,cx-cropW/2)),y0=Math.max(0,Math.min(src.height-cropH,cy-cropH/2)),s=Math.min(1,maxW/cropW);
 const out=doc.createElement('canvas');out.width=Math.round(cropW*s);out.height=Math.round(cropH*s);const o=out.getContext('2d');o.drawImage(work,x0,y0,cropW,cropH,0,0,out.width,out.height);
 o.fillStyle='rgba(0,0,0,.55)';o.font=`600 ${Math.round(out.height*0.026)}px ui-monospace,monospace`;o.textBaseline='top';const tag='XPACEOS · GEMELO 360°';o.fillRect(8,8,o.measureText(tag).width+16,out.height*0.026+12);o.fillStyle='#fff';o.fillText(tag,16,14);
 caption(o,out.width,out.height,text,tone);return out.toDataURL('image/jpeg',0.84);}
// Sin 360° (otros gemelos): render del equipo vertical con la tarjeta.
export function deviceRender(doc,chip,{text='',tone='alert',lines=[]}={}){const w=720,h=900,c=doc.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#1d232b');gr.addColorStop(1,'#0b0e12');g.fillStyle=gr;g.fillRect(0,0,w,h);
 const sh=h*0.78,sw=sh*9/16,x=(w-sw)/2,y=h*0.05;g.fillStyle='#050505';g.fillRect(x-14,y-14,sw+28,sh+28);g.drawImage(chipCanvas(doc,chip,Math.round(sw),Math.round(sh),{lines,tone}),x,y,sw,sh);caption(g,w,h,text,tone);return c.toDataURL('image/jpeg',0.84);}
// Captura la pantalla del gemelo cuando su tarjeta está en el estado pedido (abierta / cerrada). null si no se puede.
export async function captureIncidentPhoto(demo,deviceId,{stage='abierta',text='',lines=[],wait=8000,doc=globalThis.document}={}){
 if(!doc||!demo)return null;const want=stage==='cerrada',tone=want?'ok':'alert',t0=Date.now();let snap=null,chip=null;
 try{while(true){snap=demo.snapshot?.(deviceId)||null;chip=snap?.node?.querySelector?.(':scope>.matrix-incident-chip')||null;const ok=chip&&((chip.dataset.stage==='cerrada')===want);if(ok||Date.now()-t0>=wait)break;await sleep(300);}
  const src=snap?composeScreenPhoto(doc,snap,{text,tone,lines}):deviceRender(doc,chip,{text,tone,lines});return src&&src.startsWith('data:image/jpeg')?{src,at:Date.now()}:null;}catch(e){console.warn('incident photo failed',e?.message);return null;}}
// Logo de la marca del catálogo rasterizado (JPEG sobre blanco, en el color primario de la marca). null si no hay.
export async function brandLogoJpeg(id,{fetcher=(...a)=>fetch(...a),doc=globalThis.document,timeout=6000}={}){
 if(!BRAND_RE.test(String(id||''))||!doc)return null;try{const sig=AbortSignal.timeout(timeout);const b=await (await fetcher(BRAND_API+encodeURIComponent(id),{signal:sig})).json();const path=b?.logo?.svg;if(!path)return null;
  const color=b.colores?.claro?.primario||b.colores?.[b.modo]?.primario||'#000';let svg=await (await fetcher(new URL(path,BRAND_ORIGIN).href,{signal:sig})).text();if(!/<svg[\s>]/i.test(svg))return null;svg=svg.replace(/currentColor/g,color);
  const vb=/viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/.exec(svg),ar=vb?(+vb[1])/(+vb[2]):3,H=200,Wd=Math.round(Math.min(900,Math.max(200,H*ar)));
  if(!/<svg[^>]*\swidth=/.test(svg))svg=svg.replace(/<svg/i,`<svg width="${Wd}" height="${H}"`);
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const img=new Image();img.decoding='async';await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(Error('logo'));img.src=url;});
   const pad=Math.round(H*0.12),c=doc.createElement('canvas');c.width=Wd+2*pad;c.height=H+2*pad;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,pad,pad,Wd,H);return c.toDataURL('image/jpeg',0.92);}finally{URL.revokeObjectURL(url);}
 }catch(e){console.warn('brand logo failed',e?.message);return null;}}
