// Registro único de demos del gemelo (admira-xp/demos.json) · /demo help · /demo all · /demo <id|n>
// (Carlos, 7-oct-2026 23:24: «hay que documentar todas las demos y que haya un /demo help que las liste
// todas y un /demo all que las muestre todas»). Las demos 1–5 son del motor común de la suite
// (store-demo-bridge → admiranext.com/suite/experto.js) y se lanzan con ese motor sin cambiarlo; el resto
// usa órdenes ya existentes del gemelo (__xtExec) y la cámara de Matrix. Al terminar o detener, el gemelo
// vuelve a su estado inicial. La demo de incidencia sólo envía correo/Telegram con --enviar.
import {runStoreDemo} from './store-demo-bridge.mjs?v=local-autopilot-1';
import {getScreenDisplayMode,setScreenDisplayMode} from './screen-display.mjs?v=number-layout-1';
export const REGISTRY_URL=new URL('../demos.json',import.meta.url).href;
export const QUALITY_KEY='xpaceos.starbucks.announcementQuality';
const CAPSULA_MOD='./capsula-demo.mjs?v=capsula-1';
const PROTECTED=/^INC-CFHI7Z$/i; // incidencia real abierta: el recorrido nunca la toca.
let registry=null;
export function setDemoRegistry(r){registry=r;}
export async function loadDemoRegistry({fetcher=(...a)=>fetch(...a)}={}){
 if(registry)return registry;let r;
 if(REGISTRY_URL.startsWith('file:')){const fs=await import('node:fs/promises');r=JSON.parse(await fs.readFile(new URL(REGISTRY_URL),'utf8'));}
 else{const res=await fetcher(REGISTRY_URL,{cache:'no-cache'});if(!res.ok)throw Error('demos.json HTTP '+res.status);r=await res.json();}
if(!Array.isArray(r?.demos)||!r.demos.length)throw Error('demos.json vacío');registry=r;return r;}
import {norm,parseTourArg,splitFlags,langToken} from './demo-tour-args.mjs?v=capsula-1';
import {demoIconSvg} from './demo-icons.mjs?v=capsula-1';
import {installStoreDemoSkin,translateDemoText} from './store-demo-skin.mjs?v=demos-3';
export {norm,parseTourArg,splitFlags,langToken};
export function findDemo(reg,arg){const a=splitFlags(arg).rest;if(!a)return null;const list=reg?.demos||[];
 if(/^\d+$/.test(a))return list.find(d=>d.n===+a)||null;return list.find(d=>d.id===a||(d.aliases||[]).map(norm).includes(a))||null;}
const L=(o,en)=>o?(en?o.en:o.es)||o.es||'':'';
const fmt=(s,en)=>{s=Math.round(s);const m=Math.floor(s/60),r=s%60;return m?m+' min'+(r?' '+r+' s':''):r+' s';};
export function tourTotal(reg){const card=reg?.tour?.title_card_s??2;return (reg?.demos||[]).filter(d=>d.tour).reduce((a,d)=>a+d.duration_s+card,0);}
export function demoHelp(reg,{en=false}={}){const list=reg.demos,tour=list.filter(d=>d.tour),t=(es,e)=>en?e:es,w=String(list.length).length;
 const lines=[t('Demos del gemelo · ','Twin demos · ')+list.length+' · '+t('/demo all recorre ','/demo all runs ')+tour.length+' (≈ '+fmt(tourTotal(reg),en)+')'];
 for(const d of list){const ids=['/demo '+d.n,...(d.kind==='suite'||d.id!==String(d.n)?['/demo '+d.id]:[])].join(' · ');
  lines.push(String(d.n).padStart(w,' ')+'. '+L(d.name,en)+' — '+L(d.shows,en)+' · '+ids+' · '+fmt(d.duration_s,en)+(d.tour?'':' · '+t('solo individual: ','single only: ')+L(d.tour_skip_reason,en))+(d.only?' · '+t('solo en ','only on ')+d.only:''));}
 lines.push(t('▶ /demo all (o /demo todas) las enseña seguidas · /demo all es|en (ESP/ENG) elige idioma · /demo pausa · /demo next salta · /demo stop o Esc detiene · el informe de incidencia no se envía salvo con /demo all --enviar.','▶ /demo all (or /demo todas) shows them in a row · /demo all es|en (ESP/ENG) picks the language · /demo pausa · /demo next skips · /demo stop or Esc stops · the incident report is not sent unless /demo all --enviar.'));
 lines.push(t('◆ /demo capsula <tipología> <calidad> (ej. /demo capsula musica good) · /demo capsula help lista tipologías y calidades.','◆ /demo capsula <typology> <quality> (e.g. /demo capsula musica good) · /demo capsula help lists typologies and qualities.'));
 lines.push(t('Detalle: help.html#demos · registro: admira-xp/demos.json','Details: help.html#demos · registry: admira-xp/demos.json'));
 return lines.join('\n');}

// ── Recorrido ──────────────────────────────────────────────────────────────────────────────
// Tarjeta flotante (Carlos, 8-oct-2026 07:20): se arrastra por el asa (ratón y táctil, dentro de la ventana,
// posición recordada; doble clic en el asa = arriba al centro), cristal con los colores de la marca blanca
// (--mbx-brand/--mbx-accent), icono grande animado por demo con anillo de pasos, Pausa/Siguiente/Detener,
// barra con brillo y píldora ES/EN que cambia el idioma en marcha. Respeta prefers-reduced-motion.
export const CARD_POS_KEY='xpaceos.demoTour.cardPos.v1';
const S={active:false,epoch:0,stop:false,paused:false,index:0,total:0,demo:null,wake:new Set(),card:null,onKey:null,done:null,ctx:null};
export function tourState(){return {active:S.active,index:S.index,total:S.total,demo:S.demo?.id||null,paused:S.paused,lang:S.ctx?.lang||null};}
function wakeAll(){for(const f of [...S.wake])f();}
function skipSignal(epoch){return ()=>S.stop||S.epoch!==epoch;}
// Espera que se congela en pausa; onProgress(0..1) mueve la barra.
function sleep(ms,cancelled,onProgress){return new Promise(res=>{if(cancelled())return res();let left=ms,last=Date.now(),t;
 const done=()=>{clearTimeout(t);S.wake.delete(wake);res();};const wake=()=>{if(cancelled())done();};S.wake.add(wake);
 const tick=()=>{const now=Date.now();if(!S.paused)left-=now-last;last=now;try{onProgress?.(Math.min(1,1-left/ms));}catch{}if(cancelled()||left<=0)return done();t=setTimeout(tick,Math.min(100,Math.max(10,left)));};tick();});}
function race(p,cancelled){return new Promise(res=>{let ok=false;const done=v=>{if(ok)return;ok=true;S.wake.delete(w);res(v);};const w=()=>{if(cancelled())done(undefined);};S.wake.add(w);Promise.resolve(p).then(done,()=>done(undefined));});}
export function nextDemo(){if(!S.active)return false;S.paused=false;S.epoch++;wakeAll();paintButtons();return true;}
export function stopTour(){if(!S.active)return false;S.stop=true;S.paused=false;S.epoch++;wakeAll();return true;}
export function pauseTour(on=!S.paused){if(!S.active)return false;if(S.paused===!!on)return true;S.paused=!!on;
 const c=S.ctx;if(c&&S.demo?.kind==='suite')Promise.resolve(c.suite(on?'/demo pausa':'/demo reanudar',{lang:c.lang})).catch(()=>{});
 S.card?.classList?.toggle('paused',S.paused);paintButtons();return true;}
export function setTourLanguage(l){const c=S.ctx;if(!S.active||!c||!['es','en'].includes(l))return false;if(c.lang!==l){c.lang=l;c.en=l==='en';applyPageLang(c.doc,l);}paintTexts();return true;}
globalThis.XpaceDemoTour={active:()=>S.active,next:nextDemo,stop:stopTour,pause:pauseTour,language:setTourLanguage,state:tourState,done:()=>S.done};

export function pageLang(doc){const l=String(doc?.documentElement?.lang||'').slice(0,2).toLowerCase();return l==='en'?'en':l==='es'?'es':null;}
// Misma convención que /idioma (ESP|ENG): el shell común cambia idioma de la página, la CLI y los contenidos.
export function applyPageLang(doc,l){if(!doc||pageLang(doc)===l)return false;const g=globalThis;
 try{if(g.XpaceShell?.language){g.XpaceShell.language('/idioma '+(l==='en'?'ENG':'ESP'));return true;}}catch{}
 try{if(typeof g.setLanguage==='function'){g.setLanguage(l);return true;}}catch{}doc.documentElement.lang=l;return true;}

const RING=2*Math.PI*40;
const CSS='#xpaceDemoTourCard{--xb:var(--mbx-brand,#00704A);--xa0:var(--mbx-accent,#00e5a8);--xa:color-mix(in srgb,var(--xa0) 45%,#e6fff5);position:fixed;inset:auto;left:50%;top:16px;transform:translateX(-50%);margin:0;z-index:2147483646;width:min(600px,94vw);padding:12px 16px 12px;border-radius:22px;color:#f2fbf7;font:15px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden;'
 +'background:rgba(6,40,30,.72);background:linear-gradient(135deg,color-mix(in srgb,var(--xb) 62%,rgba(8,16,14,.35)),rgba(8,16,14,.58));-webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);'
 +'border:1px solid color-mix(in srgb,var(--xa) 55%,rgba(255,255,255,.25));box-shadow:0 18px 50px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.06) inset,0 0 36px color-mix(in srgb,var(--xa) 28%,transparent)}'
  +'@supports (color:oklch(from red l c h)){#xpaceDemoTourCard{--xa:oklch(from var(--xa0) max(l,.8) max(c,.15) h)}}'
 +'#xpaceDemoTourCard.placed{transform:none}#xpaceDemoTourCard.dragging{transition:none;cursor:grabbing;opacity:.94}'
 +'#xpaceDemoTourCard .gl{position:absolute;inset:-40% -10% auto;height:120%;background:radial-gradient(closest-side,color-mix(in srgb,var(--xa) 45%,transparent),transparent 70%);opacity:0;pointer-events:none}'
 +'#xpaceDemoTourCard .top{display:flex;align-items:center;gap:10px;margin:-2px 0 8px}'
 +'#xpaceDemoTourCard .grip{display:grid;place-items:center;width:34px;height:22px;border:0;border-radius:8px;background:rgba(255,255,255,.08);color:inherit;cursor:grab;touch-action:none;padding:0;opacity:.8}#xpaceDemoTourCard .grip:hover{background:rgba(255,255,255,.16);opacity:1}'
 +'#xpaceDemoTourCard .k{flex:1;font:700 11.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--xa) 80%,#fff)}'
 +'#xpaceDemoTourCard .lang{display:flex;padding:2px;border-radius:999px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14)}#xpaceDemoTourCard .lang button{border:0;background:transparent;color:inherit;font:700 11px/1 system-ui;padding:5px 9px;border-radius:999px;cursor:pointer;opacity:.7}#xpaceDemoTourCard .lang button[aria-pressed="true"]{background:var(--xa);color:#06231b;opacity:1}'
 +'#xpaceDemoTourCard .main{display:flex;gap:16px;align-items:center}'
 +'#xpaceDemoTourCard .ico{position:relative;flex:0 0 auto;width:88px;height:88px;display:grid;place-items:center}#xpaceDemoTourCard .ring{position:absolute;inset:0;transform:rotate(-90deg)}#xpaceDemoTourCard .ring circle{fill:none;stroke-width:5}#xpaceDemoTourCard .ring .rt{stroke:rgba(255,255,255,.14)}#xpaceDemoTourCard .ring .rp{stroke:var(--xa);stroke-linecap:round;stroke-dasharray:'+RING.toFixed(2)+';stroke-dashoffset:'+RING.toFixed(2)+';transition:stroke-dashoffset .6s ease;filter:drop-shadow(0 0 6px var(--xa))}'
 +'#xpaceDemoTourCard .ig{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.28),color-mix(in srgb,var(--xb) 70%,#000) 70%);box-shadow:0 0 22px color-mix(in srgb,var(--xa) 45%,transparent),inset 0 0 0 1px rgba(255,255,255,.2);animation:xdtFloat 3.2s ease-in-out infinite}#xpaceDemoTourCard .ig svg{width:36px;height:36px;color:#fff;filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))}'
 +'#xpaceDemoTourCard .txt{min-width:0;flex:1}#xpaceDemoTourCard h3{margin:0 0 4px;font-size:21px;line-height:1.2;font-weight:750;letter-spacing:-.01em}#xpaceDemoTourCard .s{margin:0;font-size:14px;opacity:.9}#xpaceDemoTourCard .c{margin:6px 0 0;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;opacity:.75;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;overflow-wrap:anywhere}'
 +'#xpaceDemoTourCard .bar{position:relative;height:4px;margin:12px 0 10px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}#xpaceDemoTourCard .bar i{position:absolute;inset:0 auto 0 0;width:0;border-radius:4px;background:linear-gradient(90deg,var(--xa),#fff 50%,var(--xa));background-size:220% 100%;animation:xdtShim 1.8s linear infinite;box-shadow:0 0 10px var(--xa)}'
 +'#xpaceDemoTourCard .b{display:flex;gap:8px;justify-content:flex-end}#xpaceDemoTourCard .b button{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:inherit;font:600 13px/1 system-ui;padding:7px 12px;border-radius:999px;cursor:pointer}#xpaceDemoTourCard .b button:hover{background:rgba(255,255,255,.2)}#xpaceDemoTourCard button *{pointer-events:none}#xpaceDemoTourCard .b button[data-a="next"]{background:var(--xa);color:#06231b;border-color:transparent}#xpaceDemoTourCard .b svg{width:14px;height:14px}'
 +'#xpaceDemoTourCard.paused .bar i,#xpaceDemoTourCard.paused .ig{animation-play-state:paused}#xpaceDemoTourCard.paused .k::after{content:" · II"}'
 +'#xpaceDemoTourCard.in0 .main{animation:xdtInL .7s cubic-bezier(.2,.9,.25,1.2) both}#xpaceDemoTourCard.in1 .main{animation:xdtInR .7s cubic-bezier(.2,.9,.25,1.2) both}#xpaceDemoTourCard.in2 .main{animation:xdtInS .7s cubic-bezier(.2,.9,.25,1.2) both}'
 +'#xpaceDemoTourCard.in0 .ig,#xpaceDemoTourCard.in1 .ig,#xpaceDemoTourCard.in2 .ig{animation:xdtPop .8s cubic-bezier(.2,.9,.25,1.3) both,xdtFloat 3.2s ease-in-out .8s infinite}#xpaceDemoTourCard.in0 .gl,#xpaceDemoTourCard.in1 .gl,#xpaceDemoTourCard.in2 .gl{animation:xdtGlow 1.4s ease-out both}'
 +'@keyframes xdtInL{from{opacity:0;transform:translateX(-28px) scale(.96);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}@keyframes xdtInR{from{opacity:0;transform:translateX(28px) scale(.96);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}@keyframes xdtInS{from{opacity:0;transform:scale(.86);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}'
 +'@keyframes xdtPop{0%{transform:scale(.4) rotate(-25deg);opacity:0}70%{transform:scale(1.12) rotate(4deg);opacity:1}100%{transform:none}}@keyframes xdtFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes xdtGlow{0%{opacity:0}30%{opacity:1}100%{opacity:0}}@keyframes xdtShim{from{background-position:120% 0}to{background-position:-120% 0}}'
 +'@media (prefers-reduced-motion:reduce){#xpaceDemoTourCard *,#xpaceDemoTourCard{animation:none!important;transition:none!important}}';
const GRIP='<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><circle cx="3" cy="3" r="1.6"/><circle cx="9" cy="3" r="1.6"/><circle cx="15" cy="3" r="1.6"/><circle cx="3" cy="9" r="1.6"/><circle cx="9" cy="9" r="1.6"/><circle cx="15" cy="9" r="1.6"/></svg>';
const BTN_ICONS={pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m7 4 13 8-13 8z"/>',next:'<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>',stop:'<path d="M18 6 6 18M6 6l12 12"/>'};
const bsvg=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+BTN_ICONS[k]+'</svg>';
function loadPos(win){try{const p=JSON.parse(win?.localStorage?.getItem(CARD_POS_KEY)||'null');return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?p:null;}catch{return null;}}
export function clampPos(p,{w,h,vw,vh}){return {x:Math.round(Math.min(Math.max(8,p.x),Math.max(8,vw-w-8))),y:Math.round(Math.min(Math.max(8,p.y),Math.max(8,vh-h-8)))};}
function placeCard(el,p){const win=el.ownerDocument.defaultView;if(!p){el.classList.remove('placed');el.style.left='';el.style.top='';return;}
 const r=el.getBoundingClientRect(),q=clampPos(p,{w:r.width,h:r.height,vw:win.innerWidth,vh:win.innerHeight});el.classList.add('placed');el.style.left=q.x+'px';el.style.top=q.y+'px';return q;}
function makeDraggable(el){const grip=el.querySelector('.grip'),win=el.ownerDocument.defaultView;let start=null;
 grip.addEventListener('pointerdown',e=>{if(e.button!=null&&e.button>0)return;const r=el.getBoundingClientRect();start={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId};try{grip.setPointerCapture(e.pointerId);}catch{}el.classList.add('dragging');e.preventDefault();});
 grip.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id)return;placeCard(el,{x:e.clientX-start.dx,y:e.clientY-start.dy});});
 const end=e=>{if(!start||e.pointerId!==start.id)return;start=null;el.classList.remove('dragging');try{grip.releasePointerCapture(e.pointerId);}catch{}
  if(el.classList.contains('placed'))try{win.localStorage.setItem(CARD_POS_KEY,JSON.stringify({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}));}catch{}};
 grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);
 grip.addEventListener('dblclick',()=>{try{win.localStorage.removeItem(CARD_POS_KEY);}catch{}placeCard(el,null);});
 grip.addEventListener('keydown',e=>{const d={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(!d)return;e.preventDefault();const r=el.getBoundingClientRect();const q=placeCard(el,{x:r.left+d[0],y:r.top+d[1]});try{win.localStorage.setItem(CARD_POS_KEY,JSON.stringify(q));}catch{}});
 const onResize=()=>{if(el.classList.contains('placed'))placeCard(el,{x:parseFloat(el.style.left),y:parseFloat(el.style.top)});};win.addEventListener('resize',onResize);el._xdtOff=()=>win.removeEventListener('resize',onResize);}
function card(doc){if(!doc?.body)return null;if(S.card?.isConnected)return S.card;
 const el=doc.createElement('div');el.id='xpaceDemoTourCard';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 try{el.setAttribute('popover','manual');}catch{}
 el.innerHTML='<style>'+CSS+'</style><div class="gl"></div><div class="top"><button type="button" class="grip">'+GRIP+'</button><span class="k"></span><div class="lang" role="group" aria-label="Idioma / Language"><button type="button" data-l="es">ES</button><button type="button" data-l="en">EN</button></div></div>'
  +'<div class="main"><div class="ico"><svg class="ring" viewBox="0 0 88 88" aria-hidden="true"><circle class="rt" cx="44" cy="44" r="40"/><circle class="rp" cx="44" cy="44" r="40"/></svg><div class="ig"></div></div><div class="txt"><h3></h3><p class="s"></p><p class="c"></p></div></div>'
  +'<div class="bar"><i></i></div><div class="b"><button type="button" data-a="pause"></button><button type="button" data-a="next"></button><button type="button" data-a="stop"></button></div>';
 // Detener responde ya en pointerdown: entre pasos se repintan los botones y un clic podía perderse (Carlos, 8-oct-2026).
 let stopAt=0;el.addEventListener('pointerdown',e=>{if(e.button>0)return;const b=e.target?.closest?.('button[data-a="stop"]');if(!b)return;stopAt=Date.now();stopTour();},true);
 el.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(!b)return;const a=b.dataset.a,l=b.dataset.l;if(a==='next')nextDemo();else if(a==='stop'){if(Date.now()-stopAt>1500)stopTour();}else if(a==='pause')pauseTour();else if(l)setTourLanguage(l);});
 doc.body.append(el);try{el.showPopover?.();}catch{}makeDraggable(el);const p=loadPos(doc.defaultView);if(p)placeCard(el,p);S.card=el;return el;}
function paintButtons(){const el=S.card,c=S.ctx;if(!el||!c)return;const t=(es,e)=>c.en?e:es,q=s=>el.querySelector(s);
 const set=(s,h)=>{const b=q(s);if(b&&b.__xdtHtml!==h){b.innerHTML=h;b.__xdtHtml=h;}}; // sin repintar si no cambia: el clic no pierde su destino
 set('[data-a="pause"]',bsvg(S.paused?'play':'pause')+(S.paused?t('Seguir','Resume'):t('Pausa','Pause')));
 set('[data-a="next"]',t('Siguiente','Next')+bsvg('next'));set('[data-a="stop"]',bsvg('stop')+t('Detener','Stop'));
 q('.grip').title=t('Arrastra para mover · doble clic: arriba al centro','Drag to move · double-click: top centre');q('.grip').setAttribute('aria-label',q('.grip').title);
 for(const b of el.querySelectorAll('.lang button'))b.setAttribute('aria-pressed',String(b.dataset.l===c.lang));}
function paintTexts(){const el=S.card,c=S.ctx,d=S.demo;if(!el||!c||!d)return;const q=s=>el.querySelector(s);
 q('.k').textContent=c.kicker+(c.stepTotal?' · '+(c.en?'step ':'paso ')+Math.min(c.stepDone+1,c.stepTotal)+'/'+c.stepTotal:'');
 q('h3').textContent=L(d.name,c.en);if(!c.subLocked)q('.s').textContent=L(d.shows,c.en);paintButtons();}
function paintDemo(doc,d,i,ctx){const el=card(doc);if(!el)return;const q=s=>el.querySelector(s);
 q('.ig').innerHTML=demoIconSvg(d.icon,{size:36});ctx.lastCmd='';q('.c').textContent='› '+d.command;ctx.subLocked=false;paintTexts();ring(0);bar(0);
 el.classList.remove('in0','in1','in2');void el.offsetWidth;el.classList.add('in'+(i%3));
 try{if(el.matches?.(':popover-open')===false){el.hidePopover?.();el.showPopover?.();}}catch{}}
function ring(p){const c=S.card?.querySelector?.('.ring .rp');if(c)c.style.strokeDashoffset=String(RING*(1-Math.max(0,Math.min(1,p))));}
function bar(p){const b=S.card?.querySelector?.('.bar i');if(b)b.style.width=(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%';}
function unpaint(){try{S.card?.hidePopover?.();}catch{}try{S.card?._xdtOff?.();}catch{}S.card?.remove?.();S.card=null;}

function snapshot(ctx){const g=globalThis,m=g.XpaceMatrixOptions;let quality=null;try{quality=g.localStorage?.getItem(QUALITY_KEY)??null;}catch{}
 return {lang:pageLang(ctx.doc),mode:ctx.router?.mode||null,display:(()=>{try{return getScreenDisplayMode();}catch{return null;}})(),ipad:g.XpaceIpadCola?.on?.()??null,ipadTouched:g.XpaceIpadCola?.touched?.()??null,quality,camera:m?.isActive?.()?m.camera?.get?.()||null:null,music:m?.isActive?.()?!!m.state?.('music')?.playing:null};}
async function restore(ctx,snap){const g=globalThis,errors=[];const tryIt=async(f)=>{try{await f();}catch(e){errors.push(e?.message||String(e));}};
 await tryIt(()=>{while((ctx.waterGiven||0)>0){ctx.waterGiven--;g.XpacePOSExperience?.water?.giveBack?.();}});
 await tryIt(async()=>{const st=g.XpaceMatrixOptions?.isActive?.()&&g.XpaceStarbucksDemo;if(ctx.changedDemoMode&&st)await g.XpaceStarbucksDemo.setMode('linear');});
 await tryIt(async()=>{if(snap.mode&&ctx.router&&ctx.router.mode!==snap.mode)await ctx.router.choose(snap.mode);});
 await tryIt(()=>{if(snap.display&&getScreenDisplayMode()!==snap.display)setScreenDisplayMode(snap.display);});
 await tryIt(()=>{const c=g.XpaceIpadCola;if(c&&snap.ipad!=null&&c.on?.()!==snap.ipad)c.command(snap.ipad?'cola':'off');c?.close?.();if(snap.ipadTouched===false)c?.untouch?.();g.document?.getElementById?.('xpaceDemoIpadPreload')?.remove();});
 await tryIt(async()=>{let now=null;try{now=g.localStorage?.getItem(QUALITY_KEY)??null;}catch{}if(now!==snap.quality){if(snap.quality)await ctx.exec('/aviso '+snap.quality);else g.localStorage?.removeItem(QUALITY_KEY);}});
 await tryIt(async()=>{const m=g.XpaceMatrixOptions;if(m?.isActive?.()&&snap.camera)await m.camera?.look?.(snap.camera,{ms:900});});
 await tryIt(()=>{if(snap.lang)applyPageLang(ctx.doc,snap.lang);}); // el idioma elegido para el recorrido no se queda
 return errors;}

async function step(s,ctx,cancelled){const g=globalThis,m=()=>g.XpaceMatrixOptions,en=ctx.en;
 if(s.say){ctx.sub(L(s.say,en),true);return;}
 if(s.wait!=null)return sleep(s.wait,cancelled,bar);
 if(s.cli){ctx.cmd(s.cli);if(/^\/(navidad|sincro\s+ia)/i.test(s.cli))ctx.changedDemoMode=true;const out=await race(ctx.exec(s.cli),cancelled);if(typeof out==='string'&&out)ctx.sub(out.split('\n')[0].slice(0,160));return;}
 if(s.suite){ctx.cmd(s.suite);try{installStoreDemoSkin(g.document);}catch{}const r=await race(ctx.suite(s.suite,{lang:ctx.lang}),cancelled);
  // Etiqueta corta y en el idioma del recorrido: «Demo 2 · Music management» (la descripción ya está en la tarjeta).
  if(r?.message){const first=String(r.message).split('\n')[0];ctx.sub((ctx.en?translateDemoText(first):first).split(' — ')[0].slice(0,120));}return;}
 if(s.mode){if(ctx.router&&ctx.router.mode!==s.mode)await race(ctx.router.choose(s.mode),cancelled);const t0=Date.now();while(s.mode==='matrix'&&ctx.doc&&!m()?.isActive?.()&&Date.now()-t0<20000&&!cancelled())await sleep(250,cancelled);return;}
 if(s.look){await race(m()?.camera?.look?.(s.look,{ms:1200}),cancelled);return;}
 if(s.pan){const cam=m()?.camera;const v=cam?.get?.();if(!v)return;const n=Math.max(1,Math.round(s.pan/90)),each=(s.ms||12000)/n;for(let i=1;i<=n&&!cancelled();i++)await race(cam.look({yaw:v.yaw+90*i,pitch:v.pitch,fov:Math.max(v.fov,70)},{ms:each}),cancelled);return;}
 if(s.focus){await race(m()?.incidentDemo?.focus?.(s.focus),cancelled);return;}
 if(s.avatar){m()?.focusAvatar?.();return;}
 if(s.music){const api=m();if(!api?.isActive?.())return;const playing=!!api.state?.('music')?.playing;
  if(s.music==='on'){if(ctx.musicBefore==null)ctx.musicBefore=playing;if(!playing)api.control('musicToggle');}
  else if(s.music==='next')api.control('musicNext');
  else if(s.music==='restore'){if(ctx.musicBefore===false&&playing)api.control('musicToggle');ctx.musicBefore=null;}return;}
 // /demo 14: una botella de agua a la caja dispara la regla del agua (oferta en iPad y pared + locución); después se devuelve.
 if(s.water){const w=g.XpacePOSExperience?.water;if(!w)return;
  if(s.water==='focus'){w.focus?.();return;}
  if(s.water==='deliver'){if(w.deliver?.()){ctx.waterGiven=(ctx.waterGiven||0)+1;ctx.sub(en?'Water at the register → offer on the iPad + voiceover':'Agua en la caja → oferta en el iPad + locución');}return;}
  if(s.water==='giveback'){while((ctx.waterGiven||0)>0){ctx.waterGiven--;w.giveBack?.();}return;}return;}
 if(s.announcement==='stop'){const st=g.document?.querySelector?.('.matrix-announcement-status[data-playing="true"]');if(st)await ctx.exec('/aviso');return;}
 if(s.ipad){const c=g.XpaceIpadCola,doc=g.document;
  if(s.ipad==='preload'){if(!doc?.body||!c?.url||doc.getElementById('xpaceDemoIpadPreload'))return;const f=doc.createElement('iframe');f.id='xpaceDemoIpadPreload';f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.style.cssText='position:fixed;left:-9999px;top:0;width:1024px;height:768px;opacity:0;pointer-events:none';f.src=c.url();doc.body.append(f);return;}
  if(s.ipad==='open'){c?.open?.();const f=doc?.getElementById?.('ipadColaModal')?.querySelector?.('iframe');ctx.sub(en?'Loading the queue manager…':'Cargando el gestor de colas…');
   if(f)await race(new Promise(res=>{const t=setTimeout(res,9000);f.addEventListener('load',()=>{clearTimeout(t);res();},{once:true});}),cancelled);
   try{S.card?.hidePopover?.();S.card?.showPopover?.();}catch{} // la tarjeta vuelve por encima de la ventana del iPad
   await sleep(1500,cancelled);ctx.subLocked=false;paintTexts();return;}
  c?.close?.();doc?.getElementById?.('xpaceDemoIpadPreload')?.remove();return;}
 if(s.waitPos){const t0=Date.now();while(Date.now()-t0<s.waitPos&&!cancelled()){const p=g.XpacePOSExperience?.demo?.state?.()?.phase;if(['completed','error'].includes(p))break;await sleep(400,cancelled);}return;}
 if(s.incident){await incidentStep(ctx,cancelled);return;}
 // /demo 24: una cápsula «¿Sabías que…?» GOOD al azar en la tarjeta 480×800 y en una pantalla vertical, con locución.
 if(s.capsula){const m=await import(CAPSULA_MOD);if(s.capsula==='close'){m.closeCapsula();return;}
  const c=await race(m.showCapsule({tipo:s.capsula==='random'?'random':s.capsula,lang:ctx.lang,voice:s.voice!==false,doc:ctx.doc}),cancelled);
  if(c)ctx.sub((ctx.en?'Did you know…? · ':'¿Sabías que…? · ')+c.id+' · GOOD · Nemotron 3 Ultra · 0 €');return;}}

async function incidentStep(ctx,cancelled){const t=(es,e)=>ctx.en?e:es;const run=ctx.incident||(async(text,o)=>(await import('./incident-demo.mjs?v=cli-incidencia-5')).runIncidentDemo(text,o));
 ctx.cmd('/crear incidencia');const r=await run('/crear incidencia',{router:ctx.router,lang:ctx.lang,progress:m=>ctx.sub(m)});
 if(!r?.ok||!r.id){ctx.sub(r?.message||t('No se pudo abrir la incidencia de demo.','The demo incident could not be opened.'));return;}
 if(PROTECTED.test(r.id))return; // imposible (las nuevas tienen id nuevo), pero nunca se cierra una real.
 ctx.created.push(r.id);ctx.sub(r.message.split('\n')[0]);await sleep(4000,cancelled);await closeCreated(ctx);}
async function closeCreated(ctx){const run=ctx.incident||(async(text,o)=>(await import('./incident-demo.mjs?v=cli-incidencia-5')).runIncidentDemo(text,o));
 while(ctx.created.length){const id=ctx.created.shift();if(PROTECTED.test(id))continue;ctx.cmd('/cerrar incidencia '+id);
  // Siempre se cierra la incidencia que abrió la demo: si el primer intento falla (red, ficha ocupada), se reintenta hasta 2 veces.
  let r=null;for(let k=0;k<3;k++){r=await run('/cerrar incidencia '+id,{router:ctx.router,lang:ctx.lang,send:ctx.send,progress:m=>ctx.sub(m)}).catch(e=>({ok:false,message:String(e?.message||e)}));if(r?.ok||/portal|técnico|technician/i.test(r?.message||''))break;await sleep(3000,()=>false);}
  ctx.results.push(r?.message||'');if(r?.message)ctx.sub(r.message.split('\n').slice(-1)[0]);}}

export async function runTour({ids=null,send=false,lang='es',router=globalThis.__xtancoVisualTiers,exec=globalThis.__xtExec,suite=runStoreDemo,incident=null,doc=globalThis.document,show=globalThis.XpaceShowResponse,reg=null}={}){
 if(S.active)return {ok:false,busy:true};reg=reg||await loadDemoRegistry();
 const list=ids?ids.map(i=>findDemo(reg,String(i))).filter(Boolean):reg.demos.filter(d=>d.tour);if(!list.length)return {ok:false};
 if(typeof exec!=='function')exec=async()=>'';
 S.active=true;S.stop=false;S.paused=false;S.total=list.length;const card_s=reg.tour?.title_card_s??2;
 const ctx={en:lang==='en',lang,router,exec,suite,incident,send,doc,created:[],results:[],changedDemoMode:false,musicBefore:null,kicker:'',stepDone:0,stepTotal:0,subLocked:false,
  // .s = descripción corta de la demo (o un «say»); .c = orden en curso y su respuesta / progreso.
  sub:(s,lock)=>{const v=String(s||'');if(lock){const el=S.card?.querySelector?.('.s');if(el)el.textContent=v;ctx.subLocked=true;return;}const el=S.card?.querySelector?.('.c');if(el)el.textContent=(ctx.lastCmd?'› '+ctx.lastCmd+' · ':'')+v;},
  cmd:c=>{ctx.lastCmd=c;const el=S.card?.querySelector?.('.c');if(el)el.textContent='› '+c;}};
 const t=(es,e)=>ctx.en?e:es;S.ctx=ctx;
 const snap=snapshot(ctx);applyPageLang(doc,lang); // /demo all es|en: la página, la CLI y los contenidos hablan el idioma del recorrido
 S.onKey=e=>{if(e.key==='Escape'&&S.active){stopTour();}};try{doc?.defaultView?.addEventListener?.('keydown',S.onKey,true);}catch{}
 const shown=[];let resolveDone;S.done=new Promise(r=>resolveDone=r);
 try{for(let i=0;i<list.length&&!S.stop;i++){const d=list[i];S.index=i+1;S.demo=d;const epoch=++S.epoch,cancelled=skipSignal(epoch);
   ctx.kicker=list.length>1?'Demo '+(i+1)+'/'+list.length:'Demo '+d.n;ctx.demo=d;ctx.stepDone=0;ctx.stepTotal=0;
   for(const s of d.preload||[]){try{await step(s,ctx,()=>false);}catch{}} // p. ej. el gestor de colas del iPad carga mientras se ve la tarjeta
   paintDemo(doc,d,i,ctx);
   try{show?.(ctx.kicker+' · '+L(d.name,ctx.en),'ok','local-visual');}catch{}
   await sleep(card_s*1000,cancelled,bar);
   const steps=d.steps||[];ctx.stepTotal=steps.length;paintTexts();
   try{for(const s of steps){if(cancelled())break;bar(0);await step(s,ctx,cancelled);ctx.stepDone++;ring(ctx.stepDone/steps.length);paintTexts();}}catch(e){ctx.sub('⚠ '+(e?.message||e));}
   const skipped=cancelled();
   for(const s of d.cleanup||[]){try{await step(s,ctx,()=>false);}catch{}}
   if(ctx.created.length)await closeCreated(ctx); // una incidencia de demo nunca se queda abierta al saltar.
   shown.push({id:d.id,skipped});}
 }finally{
  const errors=await restore(ctx,snap);try{doc?.defaultView?.removeEventListener?.('keydown',S.onKey,true);}catch{}unpaint();
  const stopped=S.stop;S.active=false;S.stop=false;S.paused=false;S.demo=null;S.index=0;S.ctx=null;
  // El cierre se escribe ya en el idioma restaurado (no en el del recorrido): «■ Recorrido detenido · 7/16 · gemelo restaurado».
  const en=(pageLang(doc)||snap?.lang||ctx.lang)==='en',tr=(es,e)=>en?e:es;
  const msg=(stopped?tr('■ Recorrido detenido · ','■ Tour stopped · '):'✓ '+tr('Recorrido completo · ','Tour complete · '))+shown.length+'/'+list.length+' · '+tr('gemelo restaurado','twin restored')+(errors.length?' ('+errors.length+' ⚠)':'')+(ctx.results.length?'\n'+ctx.results.join('\n'):'');
  try{show?.(msg,'ok','local-visual');}catch{}const out={ok:true,stopped,shown,errors,lang:ctx.lang,message:msg};resolveDone(out);}
 return S.done;}

// Entrada desde /demo … (xtanco-visual-command.mjs). Devuelve la respuesta inmediata; el recorrido sigue en segundo plano.
export async function handleDemoTour(command,{lang='es',router,exec,reg}={}){if(command.lang)lang=command.lang;else if(S.active&&S.ctx)lang=S.ctx.lang;const en=lang==='en',t=(es,e)=>en?e:es;
 if(command.action==='pause'||command.action==='resume'){return pauseTour(command.action==='pause')?{ok:true,local:true,message:command.action==='pause'?t('⏸ Recorrido en pausa · /demo reanudar','⏸ Tour paused · /demo reanudar'):t('▶ Recorrido reanudado','▶ Tour resumed')}:null;}
 if(command.action==='language'){return setTourLanguage(command.lang)?{ok:true,local:true,message:t('Idioma del recorrido: español','Tour language: English')}:null;}
 if(command.action==='next'){return nextDemo()?{ok:true,local:true,message:t('⏭ Siguiente demo','⏭ Next demo')}:null;}
 if(command.action==='stop'){return stopTour()?{ok:true,local:true,message:t('■ Deteniendo el recorrido y restaurando el gemelo…','■ Stopping the tour and restoring the twin…')}:null;}
 if(command.action==='status'){const st=tourState();return st.active?{ok:true,local:true,message:'Demo '+st.index+'/'+st.total+' · '+st.demo}:null;}
 if(command.action==='capsula'){const {handleCapsula}=await import(CAPSULA_MOD);return handleCapsula(command.arg||'',{lang});}
 try{reg=reg||await loadDemoRegistry();}catch(e){return {ok:false,local:true,message:t('No se pudo cargar el registro de demos: ','Could not load the demo registry: ')+e.message};}
 if(command.action==='help')return {ok:true,local:true,message:demoHelp(reg,{en})};
 if(S.active)return {ok:false,local:true,message:t('Ya hay un recorrido en curso (/demo next salta · /demo stop detiene).','A tour is already running (/demo next skips · /demo stop stops).')};
 if(command.action==='all'){const n=reg.demos.filter(d=>d.tour).length;runTour({send:!!command.send,lang,router,exec,reg});
  return {ok:true,local:true,message:t('▶ /demo all · ','▶ /demo all · ')+n+' demos ≈ '+fmt(tourTotal(reg),en)+' · '+t('/demo next salta · /demo stop o Esc detiene · ','/demo next skips · /demo stop or Esc stops · ')+(command.send?t('el informe de incidencia SE ENVÍA (correo + Telegram).','the incident report IS SENT (email + Telegram).'):t('informe de incidencia en vista previa (no se envía).','incident report in preview (not sent).'))+' · '+t('idioma: español (ES/EN en la tarjeta)','language: English (ES/EN on the card)')};}
 if(command.action==='run'){const d=findDemo(reg,command.id);if(!d)return null;
  const host=String(globalThis.location?.hostname||'');if(d.only&&host&&!host.endsWith(d.only)&&!/^(127\.0\.0\.1|localhost)$/.test(host))return {ok:false,local:true,message:'Demo '+d.n+' · '+L(d.name,en)+': '+t('solo en ','only on ')+d.only+'.'};runTour({ids:[d.id],send:!!command.send,lang,router,exec,reg});
  return {ok:true,local:true,message:'▶ Demo '+d.n+' · '+L(d.name,en)+' · '+fmt(d.duration_s,en)+' · '+t('/demo stop o Esc detiene','/demo stop or Esc stops')+(d.id==='incidencia'&&!command.send?' · '+t('informe en vista previa (no se envía; añade --enviar)','report preview (not sent; add --enviar)'):'')};}
 return null;}
