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
const PROTECTED=/^INC-CFHI7Z$/i; // incidencia real abierta: el recorrido nunca la toca.
let registry=null;
export function setDemoRegistry(r){registry=r;}
export async function loadDemoRegistry({fetcher=(...a)=>fetch(...a)}={}){
 if(registry)return registry;let r;
 if(REGISTRY_URL.startsWith('file:')){const fs=await import('node:fs/promises');r=JSON.parse(await fs.readFile(new URL(REGISTRY_URL),'utf8'));}
 else{const res=await fetcher(REGISTRY_URL,{cache:'no-cache'});if(!res.ok)throw Error('demos.json HTTP '+res.status);r=await res.json();}
if(!Array.isArray(r?.demos)||!r.demos.length)throw Error('demos.json vacío');registry=r;return r;}
import {norm,parseTourArg} from './demo-tour-args.mjs?v=demos-1';
export {norm,parseTourArg};
export function findDemo(reg,arg){const a=norm(arg).replace(/\s+--?(enviar|send)$/,'');if(!a)return null;const list=reg?.demos||[];
 if(/^\d+$/.test(a))return list.find(d=>d.n===+a)||null;return list.find(d=>d.id===a||(d.aliases||[]).map(norm).includes(a))||null;}
const L=(o,en)=>o?(en?o.en:o.es)||o.es||'':'';
const fmt=(s,en)=>{s=Math.round(s);const m=Math.floor(s/60),r=s%60;return m?m+' min'+(r?' '+r+' s':''):r+' s';};
export function tourTotal(reg){const card=reg?.tour?.title_card_s??2;return (reg?.demos||[]).filter(d=>d.tour).reduce((a,d)=>a+d.duration_s+card,0);}
export function demoHelp(reg,{en=false}={}){const list=reg.demos,tour=list.filter(d=>d.tour),t=(es,e)=>en?e:es,w=String(list.length).length;
 const lines=[t('Demos del gemelo · ','Twin demos · ')+list.length+' · '+t('/demo all recorre ','/demo all runs ')+tour.length+' (≈ '+fmt(tourTotal(reg),en)+')'];
 for(const d of list){const ids=['/demo '+d.n,...(d.kind==='suite'||d.id!==String(d.n)?['/demo '+d.id]:[])].join(' · ');
  lines.push(String(d.n).padStart(w,' ')+'. '+L(d.name,en)+' — '+L(d.shows,en)+' · '+ids+' · '+fmt(d.duration_s,en)+(d.tour?'':' · '+t('solo individual: ','single only: ')+L(d.tour_skip_reason,en))+(d.only?' · '+t('solo en ','only on ')+d.only:''));}
 lines.push(t('▶ /demo all (o /demo todas) las enseña seguidas · /demo next salta · /demo stop o Esc detiene · el informe de incidencia no se envía salvo con /demo all --enviar.','▶ /demo all (or /demo todas) shows them in a row · /demo next skips · /demo stop or Esc stops · the incident report is not sent unless /demo all --enviar.'));
 lines.push(t('Detalle: help.html#demos · registro: admira-xp/demos.json','Details: help.html#demos · registry: admira-xp/demos.json'));
 return lines.join('\n');}

// ── Recorrido ──────────────────────────────────────────────────────────────────────────────
const S={active:false,epoch:0,skip:null,stop:false,index:0,total:0,demo:null,wake:new Set(),card:null,onKey:null,done:null};
export function tourState(){return {active:S.active,index:S.index,total:S.total,demo:S.demo?.id||null};}
function wakeAll(){for(const f of [...S.wake])f();}
function skipSignal(epoch){return ()=>S.stop||S.epoch!==epoch;}
function sleep(ms,cancelled){return new Promise(res=>{if(cancelled())return res();let t;const done=()=>{clearTimeout(t);S.wake.delete(done);res();};t=setTimeout(done,ms);S.wake.add(done);});}
function race(p,cancelled){return new Promise(res=>{let ok=false;const done=v=>{if(ok)return;ok=true;S.wake.delete(w);res(v);};const w=()=>{if(cancelled())done(undefined);};S.wake.add(w);Promise.resolve(p).then(done,()=>done(undefined));});}
export function nextDemo(){if(!S.active)return false;S.epoch++;wakeAll();return true;}
export function stopTour(){if(!S.active)return false;S.stop=true;S.epoch++;wakeAll();return true;}
globalThis.XpaceDemoTour={active:()=>S.active,next:nextDemo,stop:stopTour,state:tourState,done:()=>S.done};

function card(doc){if(!doc?.body)return null;if(S.card?.isConnected)return S.card;
 const el=doc.createElement('div');el.id='xpaceDemoTourCard';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 try{el.setAttribute('popover','manual');}catch{}
 el.innerHTML='<style>#xpaceDemoTourCard{position:fixed;inset:auto;left:50%;top:18px;transform:translateX(-50%);margin:0;z-index:2147483646;min-width:min(560px,92vw);max-width:92vw;padding:14px 18px 12px;border:1px solid #00e5a8;border-radius:14px;background:rgba(3,12,18,.92);color:#e9fbf5;font:15px/1.35 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45);transition:top .5s,transform .5s,font-size .5s}#xpaceDemoTourCard.big{top:38%;font-size:22px}#xpaceDemoTourCard .k{font:600 12px/1 ui-monospace,monospace;letter-spacing:.12em;color:#00e5a8;text-transform:uppercase}#xpaceDemoTourCard h3{margin:6px 0 4px;font-size:1.35em}#xpaceDemoTourCard p{margin:0;opacity:.85;font-size:.9em}#xpaceDemoTourCard .bar{height:3px;background:#173b33;border-radius:2px;margin-top:10px;overflow:hidden}#xpaceDemoTourCard .bar i{display:block;height:100%;width:0;background:#00e5a8}#xpaceDemoTourCard .b{position:absolute;top:10px;right:12px;display:flex;gap:6px}#xpaceDemoTourCard button{background:#0d2a24;color:#e9fbf5;border:1px solid #1f6b5a;border-radius:8px;padding:3px 9px;font:13px system-ui;cursor:pointer}</style><div class="k"></div><h3></h3><p class="s"></p><p class="c"></p><div class="bar"><i></i></div><div class="b"><button type="button" data-a="next"></button><button type="button" data-a="stop"></button></div>';
 el.addEventListener('click',e=>{const a=e.target?.closest?.('button')?.dataset?.a;if(a==='next')nextDemo();else if(a==='stop')stopTour();});
 doc.body.append(el);try{el.showPopover?.();}catch{}S.card=el;return el;}
function paint(doc,{kicker,title,sub,cmd,big,ms,en}){const el=card(doc);if(!el)return;const q=s=>el.querySelector(s);
 q('.k').textContent=kicker||'';q('h3').textContent=title||'';q('.s').textContent=sub||'';q('.c').textContent=cmd?'› '+cmd:'';
 q('[data-a="next"]').textContent=en?'Next ›':'Siguiente ›';q('[data-a="stop"]').textContent=en?'✕ Stop':'✕ Detener';
 el.classList.toggle('big',!!big);const bar=q('.bar i');if(ms!=null){bar.style.transition='none';bar.style.width='0';void bar.offsetWidth;bar.style.transition='width '+ms+'ms linear';bar.style.width='100%';}
 try{if(el.matches?.(':popover-open')===false){el.hidePopover?.();el.showPopover?.();}}catch{}}
function unpaint(){try{S.card?.hidePopover?.();}catch{}S.card?.remove?.();S.card=null;}

function snapshot(ctx){const g=globalThis,m=g.XpaceMatrixOptions;let quality=null;try{quality=g.localStorage?.getItem(QUALITY_KEY)??null;}catch{}
 return {mode:ctx.router?.mode||null,display:(()=>{try{return getScreenDisplayMode();}catch{return null;}})(),ipad:g.XpaceIpadCola?.on?.()??null,quality,camera:m?.isActive?.()?m.camera?.get?.()||null:null,music:m?.isActive?.()?!!m.state?.('music')?.playing:null};}
async function restore(ctx,snap){const g=globalThis,errors=[];const tryIt=async(f)=>{try{await f();}catch(e){errors.push(e?.message||String(e));}};
 await tryIt(async()=>{const st=g.XpaceMatrixOptions?.isActive?.()&&g.XpaceStarbucksDemo;if(ctx.changedDemoMode&&st)await g.XpaceStarbucksDemo.setMode('linear');});
 await tryIt(async()=>{if(snap.mode&&ctx.router&&ctx.router.mode!==snap.mode)await ctx.router.choose(snap.mode);});
 await tryIt(()=>{if(snap.display&&getScreenDisplayMode()!==snap.display)setScreenDisplayMode(snap.display);});
 await tryIt(()=>{const c=g.XpaceIpadCola;if(c&&snap.ipad!=null&&c.on?.()!==snap.ipad)c.command(snap.ipad?'cola':'off');c?.close?.();});
 await tryIt(async()=>{let now=null;try{now=g.localStorage?.getItem(QUALITY_KEY)??null;}catch{}if(now!==snap.quality){if(snap.quality)await ctx.exec('/aviso '+snap.quality);else g.localStorage?.removeItem(QUALITY_KEY);}});
 await tryIt(async()=>{const m=g.XpaceMatrixOptions;if(m?.isActive?.()&&snap.camera)await m.camera?.look?.(snap.camera,{ms:900});});
 return errors;}

async function step(s,ctx,cancelled){const g=globalThis,m=()=>g.XpaceMatrixOptions,en=ctx.en;
 if(s.say){ctx.sub(L(s.say,en));return;}
 if(s.wait!=null){ctx.bar(s.wait);return sleep(s.wait,cancelled);}
 if(s.cli){ctx.cmd(s.cli);if(/^\/(navidad|sincro\s+ia)/i.test(s.cli))ctx.changedDemoMode=true;const out=await race(ctx.exec(s.cli),cancelled);if(typeof out==='string'&&out)ctx.sub(out.split('\n')[0].slice(0,160));return;}
 if(s.suite){ctx.cmd(s.suite);const r=await race(ctx.suite(s.suite,{lang:ctx.lang}),cancelled);if(r?.message)ctx.sub(String(r.message).split('\n')[0].slice(0,160));return;}
 if(s.mode){if(ctx.router&&ctx.router.mode!==s.mode)await race(ctx.router.choose(s.mode),cancelled);const t0=Date.now();while(s.mode==='matrix'&&ctx.doc&&!m()?.isActive?.()&&Date.now()-t0<20000&&!cancelled())await sleep(250,cancelled);return;}
 if(s.look){await race(m()?.camera?.look?.(s.look,{ms:1200}),cancelled);return;}
 if(s.pan){const cam=m()?.camera;const v=cam?.get?.();if(!v)return;const n=Math.max(1,Math.round(s.pan/90)),each=(s.ms||12000)/n;for(let i=1;i<=n&&!cancelled();i++)await race(cam.look({yaw:v.yaw+90*i,pitch:v.pitch,fov:Math.max(v.fov,70)},{ms:each}),cancelled);return;}
 if(s.focus){await race(m()?.incidentDemo?.focus?.(s.focus),cancelled);return;}
 if(s.avatar){m()?.focusAvatar?.();return;}
 if(s.music){const api=m();if(!api?.isActive?.())return;const playing=!!api.state?.('music')?.playing;
  if(s.music==='on'){if(ctx.musicBefore==null)ctx.musicBefore=playing;if(!playing)api.control('musicToggle');}
  else if(s.music==='next')api.control('musicNext');
  else if(s.music==='restore'){if(ctx.musicBefore===false&&playing)api.control('musicToggle');ctx.musicBefore=null;}return;}
 if(s.announcement==='stop'){const st=g.document?.querySelector?.('.matrix-announcement-status[data-playing="true"]');if(st)await ctx.exec('/aviso');return;}
 if(s.ipad){const c=g.XpaceIpadCola;if(s.ipad==='open')c?.open?.();else c?.close?.();return;}
 if(s.waitPos){const t0=Date.now();while(Date.now()-t0<s.waitPos&&!cancelled()){const p=g.XpacePOSExperience?.demo?.state?.()?.phase;if(['completed','error'].includes(p))break;await sleep(400,cancelled);}return;}
 if(s.incident){await incidentStep(ctx,cancelled);return;}}

async function incidentStep(ctx,cancelled){const t=(es,e)=>ctx.en?e:es;const run=ctx.incident||(async(text,o)=>(await import('./incident-demo.mjs?v=cli-incidencia-5')).runIncidentDemo(text,o));
 ctx.cmd('/crear incidencia');const r=await run('/crear incidencia',{router:ctx.router,lang:ctx.lang,progress:m=>ctx.sub(m)});
 if(!r?.ok||!r.id){ctx.sub(r?.message||t('No se pudo abrir la incidencia de demo.','The demo incident could not be opened.'));return;}
 if(PROTECTED.test(r.id))return; // imposible (las nuevas tienen id nuevo), pero nunca se cierra una real.
 ctx.created.push(r.id);ctx.sub(r.message.split('\n')[0]);await sleep(4000,cancelled);await closeCreated(ctx);}
async function closeCreated(ctx){const run=ctx.incident||(async(text,o)=>(await import('./incident-demo.mjs?v=cli-incidencia-5')).runIncidentDemo(text,o));
 while(ctx.created.length){const id=ctx.created.shift();if(PROTECTED.test(id))continue;ctx.cmd('/cerrar incidencia '+id);
  const r=await run('/cerrar incidencia '+id,{router:ctx.router,lang:ctx.lang,send:ctx.send,progress:m=>ctx.sub(m)});ctx.results.push(r?.message||'');if(r?.message)ctx.sub(r.message.split('\n').slice(-1)[0]);}}

export async function runTour({ids=null,send=false,lang='es',router=globalThis.__xtancoVisualTiers,exec=globalThis.__xtExec,suite=runStoreDemo,incident=null,doc=globalThis.document,show=globalThis.XpaceShowResponse,reg=null}={}){
 if(S.active)return {ok:false,busy:true};reg=reg||await loadDemoRegistry();const en=lang==='en',t=(es,e)=>en?e:es;
 const list=ids?ids.map(i=>findDemo(reg,String(i))).filter(Boolean):reg.demos.filter(d=>d.tour);if(!list.length)return {ok:false};
 if(typeof exec!=='function')exec=async()=>'';
 S.active=true;S.stop=false;S.total=list.length;const card_s=reg.tour?.title_card_s??2;
 const ctx={en,lang,router,exec,suite,incident,send,doc,created:[],results:[],changedDemoMode:false,musicBefore:null,
  sub:s=>{const el=S.card?.querySelector?.('.s');if(el)el.textContent=String(s||'');},cmd:c=>{const el=S.card?.querySelector?.('.c');if(el)el.textContent='› '+c;},bar:ms=>{const b=S.card?.querySelector?.('.bar i');if(b){b.style.transition='none';b.style.width='0';void b.offsetWidth;b.style.transition='width '+ms+'ms linear';b.style.width='100%';}}};
 const snap=snapshot(ctx);
 S.onKey=e=>{if(e.key==='Escape'&&S.active){stopTour();}};try{doc?.defaultView?.addEventListener?.('keydown',S.onKey,true);}catch{}
 const shown=[];let resolveDone;S.done=new Promise(r=>resolveDone=r);
 try{for(let i=0;i<list.length&&!S.stop;i++){const d=list[i];S.index=i+1;S.demo=d;const epoch=++S.epoch,cancelled=skipSignal(epoch);
   const kicker=list.length>1?'Demo '+(i+1)+'/'+list.length:'Demo '+d.n;
   paint(doc,{kicker,title:L(d.name,en),sub:L(d.shows,en),cmd:d.command,big:true,ms:card_s*1000,en});
   try{show?.(kicker+' · '+L(d.name,en),'ok','local-visual');}catch{}
   await sleep(card_s*1000,cancelled);paint(doc,{kicker,title:L(d.name,en),sub:L(d.shows,en),cmd:d.command,big:false,en});
   try{for(const s of d.steps||[]){if(cancelled())break;await step(s,ctx,cancelled);}}catch(e){ctx.sub('⚠ '+(e?.message||e));}
   const skipped=cancelled();
   for(const s of d.cleanup||[]){try{await step(s,ctx,()=>false);}catch{}}
   if(ctx.created.length)await closeCreated(ctx); // una incidencia de demo nunca se queda abierta al saltar.
   shown.push({id:d.id,skipped});}
 }finally{
  const errors=await restore(ctx,snap);try{doc?.defaultView?.removeEventListener?.('keydown',S.onKey,true);}catch{}unpaint();
  const stopped=S.stop;S.active=false;S.stop=false;S.demo=null;S.index=0;
  const msg=(stopped?t('■ Recorrido detenido · ','■ Tour stopped · '):'✓ '+t('Recorrido completo · ','Tour complete · '))+shown.length+'/'+list.length+' · '+t('gemelo restaurado','twin restored')+(errors.length?' ('+errors.length+' ⚠)':'')+(ctx.results.length?'\n'+ctx.results.join('\n'):'');
  try{show?.(msg,'ok','local-visual');}catch{}const out={ok:true,stopped,shown,errors,message:msg};resolveDone(out);}
 return S.done;}

// Entrada desde /demo … (xtanco-visual-command.mjs). Devuelve la respuesta inmediata; el recorrido sigue en segundo plano.
export async function handleDemoTour(command,{lang='es',router,exec,reg}={}){const en=lang==='en',t=(es,e)=>en?e:es;
 if(command.action==='next'){return nextDemo()?{ok:true,local:true,message:t('⏭ Siguiente demo','⏭ Next demo')}:null;}
 if(command.action==='stop'){return stopTour()?{ok:true,local:true,message:t('■ Deteniendo el recorrido y restaurando el gemelo…','■ Stopping the tour and restoring the twin…')}:null;}
 if(command.action==='status'){const st=tourState();return st.active?{ok:true,local:true,message:'Demo '+st.index+'/'+st.total+' · '+st.demo}:null;}
 try{reg=reg||await loadDemoRegistry();}catch(e){return {ok:false,local:true,message:t('No se pudo cargar el registro de demos: ','Could not load the demo registry: ')+e.message};}
 if(command.action==='help')return {ok:true,local:true,message:demoHelp(reg,{en})};
 if(S.active)return {ok:false,local:true,message:t('Ya hay un recorrido en curso (/demo next salta · /demo stop detiene).','A tour is already running (/demo next skips · /demo stop stops).')};
 if(command.action==='all'){const n=reg.demos.filter(d=>d.tour).length;runTour({send:!!command.send,lang,router,exec,reg});
  return {ok:true,local:true,message:t('▶ /demo all · ','▶ /demo all · ')+n+' demos ≈ '+fmt(tourTotal(reg),en)+' · '+t('/demo next salta · /demo stop o Esc detiene · ','/demo next skips · /demo stop or Esc stops · ')+(command.send?t('el informe de incidencia SE ENVÍA (correo + Telegram).','the incident report IS SENT (email + Telegram).'):t('informe de incidencia en vista previa (no se envía).','incident report in preview (not sent).'))};}
 if(command.action==='run'){const d=findDemo(reg,command.id);if(!d)return null;
  const host=String(globalThis.location?.hostname||'');if(d.only&&host&&!host.endsWith(d.only)&&!/^(127\.0\.0\.1|localhost)$/.test(host))return {ok:false,local:true,message:'Demo '+d.n+' · '+L(d.name,en)+': '+t('solo en ','only on ')+d.only+'.'};runTour({ids:[d.id],send:!!command.send,lang,router,exec,reg});
  return {ok:true,local:true,message:'▶ Demo '+d.n+' · '+L(d.name,en)+' · '+fmt(d.duration_s,en)+' · '+t('/demo stop o Esc detiene','/demo stop or Esc stops')+(d.id==='incidencia'&&!command.send?' · '+t('informe en vista previa (no se envía; añade --enviar)','report preview (not sent; add --enviar)'):'')};}
 return null;}
