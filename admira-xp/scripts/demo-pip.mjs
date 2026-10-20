// Demo 15 en UN monitor (Carlos, 20-oct-2026): «como un vídeo» dentro del gemelo. Bugito, Admirito y Supervisor
// salen en ventanas PiP con su nombre (las caras reales de digitalavatar.ai/nube.html?personaje=…), entran y salen
// con suavidad y nunca tapan la pantalla en rojo. Bugito «lanza» un popup sobre la pantalla elegida y Supervisor lo cierra.
const FACE='https://digitalavatar.ai/nube.html?embed=1&audio=off&contract=20261016-180&langui=host'; // embed: sólo la cara, sin consola
export const CHARACTERS={
 bugito:{name:'Bugito',face:FACE+'&personaje=bugito',color:'#e2302e'},
 admirito:{name:'Admirito',face:FACE,color:'#78f3ff',crop:true}, /* sin personaje, nube.html pinta su menú de estilos arriba: se recorta */
 supervisor:{name:'Supervisor',face:FACE+'&personaje=supervisor',color:'#7fe3a1'}};
const CSS=`.xdp{position:fixed;z-index:2147483000;width:240px;border-radius:16px;overflow:hidden;background:#071015;border:2px solid var(--c);box-shadow:0 18px 50px rgba(0,0,0,.55),0 0 0 4px color-mix(in srgb,var(--c) 25%,transparent);opacity:0;transform:translateY(24px) scale(.92);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.9,.3,1.2),left .8s ease,top .8s ease;pointer-events:none;font:600 13px/1.3 system-ui,sans-serif;color:#eef}
.xdp.on{opacity:1;transform:none}.xdp.crop iframe{width:200%;height:480px;margin-top:-30px;transform:scale(.5);transform-origin:0 0}.xdp .f{height:200px;overflow:hidden}.xdp iframe{display:block;width:100%;height:200px;border:0;background:#071015}
.xdp .n{position:absolute;left:10px;top:10px;padding:3px 10px;border-radius:999px;background:var(--c);color:#041014;font-weight:800;letter-spacing:.04em;font-size:12px}
.xdp .t{padding:9px 12px 11px;min-height:38px;background:linear-gradient(180deg,#0b1a22,#071015)}
.xdp-pop{position:fixed;z-index:2147482990;padding:10px 14px;border-radius:8px;background:#fff;color:#111;border:3px solid #e2302e;box-shadow:0 10px 30px rgba(0,0,0,.6);font:700 14px/1.25 system-ui,sans-serif;max-width:220px;transition:left 1.2s cubic-bezier(.3,.7,.2,1),top 1.2s cubic-bezier(.3,.7,.2,1),transform 1.2s ease,opacity .5s ease;pointer-events:none}
.xdp-pop b{display:block;color:#e2302e;font-size:12px;letter-spacing:.06em}.xdp-pop.out{opacity:0;transform:scale(.4) rotate(-8deg)}
.xdp-end{position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;background:rgba(3,10,14,.0);transition:background .8s ease;pointer-events:none}
.xdp-end.on{background:rgba(3,10,14,.72)}.xdp-end div{opacity:0;transform:scale(.95);transition:all .8s ease;text-align:center;color:#eaffff;font:700 34px/1.25 system-ui,sans-serif}
.xdp-end.on div{opacity:1;transform:none}.xdp-end small{display:block;font:500 18px/1.4 system-ui,sans-serif;color:#9fe;margin-top:10px}`;
const live=new Map();
function style(doc){if(doc.getElementById('xdpStyle'))return;const s=doc.createElement('style');s.id='xdpStyle';s.textContent=CSS;doc.head.append(s);}
const W=240,H=250,M=24;
function overlaps(a,b){return !!b&&a.x<b.right&&a.x+W>b.left&&a.y<b.bottom&&a.y+H>b.top;}
// Esquina libre: abajo-izquierda, abajo-derecha, arriba-izquierda, arriba-derecha… la primera que no pisa lo prohibido.
export function freeCorner(prefer,{vw,vh},avoid=[],taken=[]){const c={bl:{x:M,y:vh-H-M},br:{x:vw-W-M,y:vh-H-M},tl:{x:M,y:70},tr:{x:vw-W-M,y:70},ml:{x:M,y:Math.round(vh/2-H/2)}};
 const order=[prefer,'bl','br','ml','tl','tr'];for(const k of order){const p=c[k];if(!p)continue;if(avoid.some(r=>overlaps(p,r)))continue;if(taken.some(t=>Math.abs(t.x-p.x)<W&&Math.abs(t.y-p.y)<H))continue;return p;}return c[prefer]||c.bl;}
export function avoidRects(doc){const out=[];for(const s of ['.matrix-incident-chip','#xpaceDemoTourCard'])for(const el of doc.querySelectorAll(s)){const r=el.getBoundingClientRect();if(r.width>2)out.push({left:r.left-12,right:r.right+12,top:r.top-12,bottom:r.bottom+12});}
 for(const el of doc.querySelectorAll('body > div'))if(/admira\.app\s*·\s*(Ticket|ficha)/i.test(el.textContent?.slice(0,60)||'')){const r=el.getBoundingClientRect();if(r.width>2&&r.width<700)out.push(r);}return out;}
export function pipShow(doc,id,text,prefer='bl'){style(doc);const ch=CHARACTERS[id];let el=live.get(id);
 if(!el){el=doc.createElement('div');el.className='xdp';el.style.setProperty('--c',ch.color);if(ch.crop)el.classList.add('crop');el.innerHTML='<div class="f"><iframe title="'+ch.name+'" allow="autoplay" loading="eager"></iframe></div><span class="n">'+ch.name+'</span><div class="t"></div>';
  el.querySelector('iframe').src=ch.face+(ch.face.includes('?')?'&':'?')+'lang='+(doc.documentElement.lang||'es').slice(0,2);doc.body.append(el);live.set(id,el);}
 const win=doc.defaultView,taken=[...live.entries()].filter(([k])=>k!==id).map(([,e])=>({x:parseFloat(e.style.left),y:parseFloat(e.style.top)}));
 const p=freeCorner(prefer,{vw:win.innerWidth,vh:win.innerHeight},avoidRects(doc),taken);el.style.left=p.x+'px';el.style.top=p.y+'px';
 el.querySelector('.t').textContent=text||'';requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));return el;}
export function pipSay(doc,id,text){const el=live.get(id);if(el)el.querySelector('.t').textContent=text;else pipShow(doc,id,text);}
export function pipHide(id){const el=live.get(id);if(!el)return;live.delete(id);el.classList.remove('on');setTimeout(()=>el.remove(),700);}
export function pipClear(doc){for(const id of [...live.keys()])pipHide(id);doc?.getElementById?.('xdpPop')?.remove();doc?.getElementById?.('xdpEnd')?.remove();}
// Bugito lanza el popup desde su PiP hasta (x,y) de la pantalla; luego se recoloca sobre el borde de la pantalla en rojo.
export function popupThrow(doc,{title,body,from,to}){style(doc);let el=doc.getElementById('xdpPop');if(!el){el=doc.createElement('div');el.id='xdpPop';el.className='xdp-pop';doc.body.append(el);}
 el.innerHTML='<b></b><span></span>';el.querySelector('b').textContent=title;el.querySelector('span').textContent=body;el.classList.remove('out');
 el.style.left=from.x+'px';el.style.top=from.y+'px';el.style.transform='scale(.3) rotate(-25deg)';void el.offsetWidth;
 el.style.left=to.x+'px';el.style.top=to.y+'px';el.style.transform='rotate(-4deg)';return el;}
export function popupMove(doc,to){const el=doc.getElementById('xdpPop');if(el){el.style.left=to.x+'px';el.style.top=to.y+'px';}}
export function popupClose(doc){const el=doc.getElementById('xdpPop');if(!el)return;el.classList.add('out');setTimeout(()=>el.remove(),700);}
export function endCard(doc,title,sub){style(doc);let el=doc.getElementById('xdpEnd');if(!el){el=doc.createElement('div');el.id='xdpEnd';el.className='xdp-end';el.innerHTML='<div><span></span><small></small></div>';doc.body.append(el);}
 el.querySelector('span').textContent=title;el.querySelector('small').textContent=sub;requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));return el;}
export function chipRect(doc,id){for(const el of doc.querySelectorAll('.matrix-incident-chip'))if(!id||el.textContent.includes(id)){const r=el.getBoundingClientRect();if(r.width>2)return r;}return null;}
