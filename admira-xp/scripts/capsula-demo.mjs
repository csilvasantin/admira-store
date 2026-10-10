// /demo capsula <tipología> <calidad> — cápsulas «¿Sabías que…?» de una página (Carlos, 10-oct-2026 16:2x:
// «una batería de sabías que… de todas las tipologías que nos interesen (música, tecnología, sociedad…) en modo
// experto: /demo capsula musical good»). Regla de oro good · better · best:
//  · GOOD   = modelo abierto gratuito (NVIDIA Nemotron 3 Ultra) + voces del sistema Mac (Mónica / Daniel). La
//             batería se genera OFFLINE (tools/capsulas-good.py, con verificación) y aquí sólo se lee: instantáneo y 0 €.
//             La clave de NVIDIA nunca llega al navegador.
//  · BETTER = modelo frontera de pago · BEST = hecho por personas → por ahora «próximamente / requiere encargo».
// La tarjeta se pinta en un lienzo 480×800 con los 4 colores de la tinta electrónica (negro, blanco, amarillo, rojo):
// lo que se ve en la tienda es exactamente el PNG que acepta la pantalla de tinta (botón PNG 480×800).
import {demoIconSvg} from './demo-icons.mjs?v=capsula-1';
export const BANK_URL=new URL('../capsulas/capsulas-good.json',import.meta.url).href;
export const AUDIO_BASE=new URL('../capsulas/audio/',import.meta.url).href;
export const RECENT_KEY='xpaceos.capsulas.recent.v1';
export const EINK={w:480,h:800,colors:{black:'#000000',white:'#ffffff',yellow:'#ffd400',red:'#d40000'}};
const nrm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export const TIPO_ALIASES=Object.freeze({
 musica:['musica','musical','music','musicas'],tecnologia:['tecnologia','tecnologica','tech','technology','tecno'],
 sociedad:['sociedad','social','society','sociedades'],ciencia:['ciencia','ciencias','science','cientifica'],
 deporte:['deporte','deportes','deportiva','sport','sports'],arte:['arte','artes','art','artistica'],
 gastronomia:['gastronomia','gastronomica','food','comida','cocina','cooking'],naturaleza:['naturaleza','nature','natural'],
 historia:['historia','history','historica'],cine:['cine','cinema','film','films','movies','peliculas','pelicula']});
export const QUALITIES=Object.freeze({
 good:{aliases:['good','8bit','8-bit','gratis','free','buena'],ready:true,
  es:'GOOD · modelo abierto gratuito (NVIDIA Nemotron 3 Ultra) + voces Mac Mónica/Daniel · 0 €',en:'GOOD · free open model (NVIDIA Nemotron 3 Ultra) + Mac voices Mónica/Daniel · €0'},
 better:{aliases:['better','16bit','16-bit','mejor','pago','paid'],ready:false,
  es:'BETTER · modelo frontera de pago · próximamente: requiere encargo',en:'BETTER · paid frontier model · coming soon: requires a commission'},
 best:{aliases:['best','32bit','32-bit','humano','human','hecha','handmade'],ready:false,
  es:'BEST · hecha por personas (admira.studio) · requiere encargo',en:'BEST · human-made (admira.studio) · requires a commission'}});
const RANDOM=['','random','aleatoria','aleatorio','azar','cualquiera','any','mix','todas','all'];
export function tipoFrom(w){const v=nrm(w);if(RANDOM.includes(v))return 'random';for(const [id,al] of Object.entries(TIPO_ALIASES))if(al.includes(v))return id;return null;}
export function qualityFrom(w){const v=nrm(w);for(const [id,q] of Object.entries(QUALITIES))if(q.aliases.includes(v))return id;return null;}
// «musica good» · «good musica» · «help» · «tecnologia» · «musica good muda»: devuelve {action,tipo,calidad,voice} o {action:'invalid',bad}.
export function parseCapsulaArgs(arg){const words=nrm(arg).split(/\s+/).filter(Boolean);let tipo=null,calidad=null,voice=true;const bad=[];
 if(!words.length)return {action:'show',tipo:'random',calidad:'good',voice};
 if(words.length===1&&['help','ayuda','?','lista','list','tipos','tipologias','types'].includes(words[0]))return {action:'help'};
 for(const w of words){if(['muda','mudo','mute','silencio','--mute','--muda','--sin-voz','sinvoz'].includes(w)){voice=false;continue;}
  if(['voz','voice','--voz','--voice'].includes(w)){voice=true;continue;}
  const q=qualityFrom(w);if(q&&!calidad){calidad=q;continue;}const t=tipoFrom(w);if(t&&!tipo){tipo=t;continue;}bad.push(w);}
 if(bad.length)return {action:'invalid',bad,tipo,calidad};
 return {action:'show',tipo:tipo||'random',calidad:calidad||'good',voice};}

let bank=null;
export function setCapsulaBank(b){bank=b;}
export async function loadCapsulaBank({fetcher=(...a)=>fetch(...a)}={}){if(bank)return bank;let b;
 if(BANK_URL.startsWith('file:')){const fs=await import('node:fs/promises');b=JSON.parse(await fs.readFile(new URL(BANK_URL),'utf8'));}
 else{const r=await fetcher(BANK_URL,{cache:'no-cache'});if(!r.ok)throw Error('capsulas-good.json HTTP '+r.status);b=await r.json();}
 if(!Array.isArray(b?.capsulas)||!b.capsulas.length)throw Error('capsulas-good.json vacío');bank=b;return b;}
const L=(o,en)=>o?(en?o.en:o.es)||o.es||'':'';
export function tipoMeta(b,id){return (b?.tipologias||[]).find(t=>t.id===id)||{id,name:{es:id,en:id},icon:'lightbulb'};}
function recent(storage){try{const v=JSON.parse(storage?.getItem(RECENT_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return [];}}
// Al azar entre las que no se han enseñado hace poco (últimas 40); si de esa tipología ya salieron todas, se vuelve a empezar.
export function pickCapsule(b,tipo,{storage=globalThis.localStorage,rnd=Math.random}={}){
 const pool=b.capsulas.filter(c=>tipo==='random'||c.tipo===tipo);if(!pool.length)return null;const seen=recent(storage);
 let fresh=pool.filter(c=>!seen.includes(c.id));if(!fresh.length)fresh=pool.filter(c=>c.id!==seen[seen.length-1]);if(!fresh.length)fresh=pool;
 const c=fresh[Math.floor(rnd()*fresh.length)%fresh.length];try{storage?.setItem(RECENT_KEY,JSON.stringify([...seen.filter(x=>x!==c.id),c.id].slice(-40)));}catch{}return c;}
const body=t=>String(t||'').replace(/^\s*(…|\.\.\.)\s*/,'').trim();
export function spokenText(c,lang){const t=body(L(c.texto,lang==='en')).replace(/[.!]+$/,'');return lang==='en'?'Did you know '+t+'?':'¿Sabías que '+t+'?';}
export function capsulaHelp(b,{en=false}={}){const t=(es,e)=>en?e:es;const lines=[t('Cápsulas «¿Sabías que…?» · ','“Did you know…?” capsules · ')+b.capsulas.length+' GOOD · '+(b.tipologias||[]).length+t(' tipologías',' typologies')];
 lines.push(t('Uso: /demo capsula <tipología> <calidad> [muda] · ej. /demo capsula musica good','Usage: /demo capsula <typology> <quality> [mute] · e.g. /demo capsula musica good'));
 lines.push(t('Tipologías: ','Typologies: ')+(b.tipologias||[]).map(x=>x.id+(en?' ('+x.name.en+')':'')+' · '+x.count).join(' | ')+t(' · sin tipología: al azar',' · no typology: random'));
 lines.push(t('Calidades:','Qualities:'));for(const q of Object.values(QUALITIES))lines.push('  · '+(en?q.en:q.es));
 lines.push(t('Batería pregenerada con ','Pre-generated bank with ')+'Nemotron 3 Ultra'+t(' (verificada; 0 € al usarla). Formato 480×800 de 4 colores: vale para la tinta electrónica (botón PNG).',' (fact-checked; €0 at runtime). 480×800 4-colour format: fits the e-ink display (PNG button).'));
 return lines.join('\n');}

// ── Lienzo 480×800 BWRY ────────────────────────────────────────────────────────────────────────
function wrap(ctx,text,maxW){const words=String(text).split(/\s+/);const lines=[];let cur='';for(const w of words){const tr=cur?cur+' '+w:w;if(ctx.measureText(tr).width<=maxW||!cur)cur=tr;else{lines.push(cur);cur=w;}}if(cur)lines.push(cur);return lines;}
function fit(ctx,text,{maxW,maxH,max,min,weight,lh}){for(let s=max;s>=min;s-=2){ctx.font=weight+' '+s+'px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';const lines=wrap(ctx,text,maxW);if(lines.length*s*lh<=maxH)return {size:s,lines};}
 ctx.font=weight+' '+min+'px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';return {size:min,lines:wrap(ctx,text,maxW)};}
function iconImage(doc,name,color){return new Promise(res=>{try{const I=doc.defaultView.Image,img=new I();const svg=demoIconSvg(name,{size:96}).replace('stroke="currentColor"','stroke="'+color+'"');img.onload=()=>res(img);img.onerror=()=>res(null);img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}catch{res(null);}});}
export async function renderCapsule(c,{lang='es',doc=globalThis.document,b=bank,canvas=null}={}){const en=lang==='en',{w,h,colors:K}=EINK;
 const cv=canvas||doc.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');if(!x)return cv;const meta=tipoMeta(b,c.tipo),pad=36;
 x.fillStyle=K.white;x.fillRect(0,0,w,h);
 // Cabecera roja «¿SABÍAS QUE…?» + bombilla
 x.fillStyle=K.red;x.fillRect(0,0,w,150);x.fillStyle=K.white;x.textBaseline='alphabetic';
 x.font='800 50px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';x.fillText(en?'DID YOU':'¿SABÍAS',pad,70);x.fillText(en?'KNOW…?':'QUE…?',pad,126);
 const bulb=await iconImage(doc,'lightbulb',K.white);if(bulb)x.drawImage(bulb,w-pad-92,28,92,92);
 // Píldora amarilla con la tipología e icono
 const chipY=180,label=L(meta.name,en).toUpperCase();x.font='800 26px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';const lw=x.measureText(label).width;
 x.fillStyle=K.yellow;x.beginPath();x.roundRect?x.roundRect(pad,chipY,lw+96,56,28):x.rect(pad,chipY,lw+96,56);x.fill();x.lineWidth=3;x.strokeStyle=K.black;x.stroke();
 const ic=await iconImage(doc,meta.icon,K.black);if(ic)x.drawImage(ic,pad+16,chipY+10,36,36);x.fillStyle=K.black;x.fillText(label,pad+64,chipY+38);
 // Título y texto (se encogen hasta caber)
 const tt=fit(x,L(c.titulo,en),{maxW:w-2*pad,maxH:130,max:46,min:30,weight:'800',lh:1.12});let y=chipY+56+30;x.fillStyle=K.black;x.font='800 '+tt.size+'px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';
 for(const l of tt.lines){y+=tt.size*1.12;x.fillText(l,pad,y);}
 y+=22;x.fillStyle=K.red;x.fillRect(pad,y,90,8);y+=26;
 const bt=fit(x,L(c.texto,en),{maxW:w-2*pad,maxH:h-110-y,max:38,min:22,weight:'500',lh:1.3});x.fillStyle=K.black;x.font='500 '+bt.size+'px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';
 for(const l of bt.lines){y+=bt.size*1.3;x.fillText(l,pad,y);}
 // Pie negro: marca, calidad y procedencia
 x.fillStyle=K.black;x.fillRect(0,h-84,w,84);x.fillStyle=K.yellow;x.font='800 24px system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif';x.fillText('admira · GOOD',pad,h-46);
 x.fillStyle=K.white;x.font='500 17px ui-monospace,SFMono-Regular,Menlo,monospace';x.fillText('Nemotron 3 Ultra · 0 € · '+c.id,pad,h-20);
 return cv;}

// ── Tarjeta en el gemelo ────────────────────────────────────────────────────────────────────────
const CSS='#xpaceCapsula{--xb:var(--mbx-brand,#00704A);--xa:var(--mbx-accent,#00e5a8);position:fixed;right:20px;top:50%;transform:translateY(-50%);z-index:2147483645;display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:22px;color:#f2fbf7;font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;'
 +'background:linear-gradient(150deg,color-mix(in srgb,var(--xb) 60%,rgba(8,16,14,.4)),rgba(8,16,14,.7));-webkit-backdrop-filter:blur(18px) saturate(160%);backdrop-filter:blur(18px) saturate(160%);border:1px solid rgba(255,255,255,.22);box-shadow:0 18px 50px rgba(0,0,0,.5),0 0 34px color-mix(in srgb,var(--xa) 30%,transparent);animation:xcpIn .6s cubic-bezier(.2,.9,.25,1.2) both}'
 +'#xpaceCapsula .hd{display:flex;align-items:center;gap:8px;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--xa) 75%,#fff)}#xpaceCapsula .hd svg{width:16px;height:16px}#xpaceCapsula .hd span{flex:1}'
 +'#xpaceCapsula canvas{display:block;height:min(68vh,600px);width:auto;aspect-ratio:480/800;border-radius:10px;box-shadow:0 6px 22px rgba(0,0,0,.45);background:#fff}'
 +'#xpaceCapsula .b{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}#xpaceCapsula .b button{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:inherit;font:600 12.5px/1 system-ui;padding:7px 11px;border-radius:999px;cursor:pointer}#xpaceCapsula .b button:hover{background:rgba(255,255,255,.2)}#xpaceCapsula .b button[data-a="next"]{background:var(--xa);color:#06231b;border-color:transparent}'
 +'#xpaceCapsula .x{border:0;background:transparent;color:inherit;font:700 16px/1 system-ui;cursor:pointer;opacity:.8;padding:2px 4px}'
 +'@keyframes xcpIn{from{opacity:0;transform:translate(30px,-50%) scale(.95);filter:blur(4px)}to{opacity:1;transform:translateY(-50%);filter:none}}@media (prefers-reduced-motion:reduce){#xpaceCapsula{animation:none}}';
const C={el:null,cap:null,lang:'es',tipo:'random',screen:null,timer:0,audio:null,voice:true,onKey:null};
export function capsulaState(){return {open:!!C.el?.isConnected,id:C.cap?.id||null,lang:C.lang,screen:C.screen};}
function stopVoice(){try{C.audio?.pause();}catch{}C.audio=null;try{globalThis.XpaceAnnouncements?.stopStock?.();}catch{}try{globalThis.speechSynthesis?.cancel();}catch{}}
export function speakCapsule(c,lang,{win=globalThis}={}){stopVoice();if(win.dsMasterMute)return 'muted';const text=spokenText(c,lang),url=AUDIO_BASE+c.id+'-'+(lang==='en'?'en':'es')+'.m4a';
 try{const A=win.XpaceAnnouncements;if(A?.playStock){A.playStock(url,text,{language:lang});return 'stock';}}catch{}
 try{const a=new win.Audio(url);C.audio=a;const fallback=()=>{if(C.audio!==a)return;C.audio=null;const S=win.speechSynthesis,U=win.SpeechSynthesisUtterance;if(!S||typeof U!=='function')return;const u=new U(text);u.lang=lang==='en'?'en-GB':'es-ES';
   const v=(S.getVoices()||[]).find(v=>(lang==='en'?/^daniel/i:/^m[oó]nica/i).test(v.name));if(v)u.voice=v;S.cancel();S.speak(u);};a.onerror=fallback;a.play()?.catch?.(fallback);return 'file';}catch{return 'error';}}
async function putOnScreen(cv){const m=globalThis.XpaceMatrixOptions;if(!m?.isActive?.()||!m.previewScreen)return null;
 try{const ids=m.incidentDemo?.candidates?.()||[];const id=C.screen||ids[Math.floor(Math.random()*ids.length)];if(!id)return null;
  const url=cv.toDataURL('image/png');await m.previewScreen(id,{kind:'image',url,title:'¿Sabías que…? · '+C.cap.id,id:'capsula-'+C.cap.id});C.screen=id;try{m.incidentDemo?.focus?.(id);}catch{}return id;}catch{return null;}}
function restoreScreen(){const m=globalThis.XpaceMatrixOptions,id=C.screen;C.screen=null;if(!id)return;try{m?.restoreScreen?.(id);}catch{}}
export function closeCapsula(){clearTimeout(C.timer);stopVoice();restoreScreen();try{C.el?.ownerDocument?.defaultView?.removeEventListener('keydown',C.onKey,true);}catch{}C.el?.remove();C.el=null;C.cap=null;return true;}
function downloadPng(cv){try{const a=cv.ownerDocument.createElement('a');a.href=cv.toDataURL('image/png');a.download='capsula-'+C.cap.id+'-'+C.lang+'-480x800.png';a.click();}catch{}}
async function paint(doc){const en=C.lang==='en',t=(es,e)=>en?e:es;let el=C.el;
 if(!el?.isConnected){el=doc.createElement('div');el.id='xpaceCapsula';el.setAttribute('role','dialog');el.setAttribute('aria-label','¿Sabías que…?');
  el.innerHTML='<style>'+CSS+'</style><div class="hd">'+demoIconSvg('lightbulb',{size:16})+'<span></span><button type="button" class="x" data-a="close" aria-label="Cerrar">×</button></div><canvas width="480" height="800"></canvas><div class="b"><button type="button" data-a="next"></button><button type="button" data-a="voice"></button><button type="button" data-a="png"></button><button type="button" data-a="lang"></button></div>';
  el.addEventListener('click',e=>{const a=e.target?.closest?.('button')?.dataset?.a;if(!a)return;if(a==='close')closeCapsula();else if(a==='next')showCapsule({tipo:C.tipo,lang:C.lang,voice:C.voice,doc});else if(a==='voice'&&C.cap)speakCapsule(C.cap,C.lang);else if(a==='png')downloadPng(el.querySelector('canvas'));else if(a==='lang'&&C.cap){C.lang=en?'es':'en';paint(doc).then(()=>C.voice&&speakCapsule(C.cap,C.lang));}});
  C.onKey=e=>{if(e.key==='Escape'&&C.el&&!globalThis.XpaceDemoTour?.active?.())closeCapsula();};doc.defaultView?.addEventListener('keydown',C.onKey,true);doc.body.append(el);C.el=el;}
 const q=s=>el.querySelector(s);q('.hd span').textContent=t('¿Sabías que…? · ','Did you know…? · ')+L(tipoMeta(bank,C.cap.tipo).name,en)+' · GOOD';
 q('[data-a="next"]').textContent=t('Otra','Another');q('[data-a="voice"]').textContent=t('Escuchar','Listen');q('[data-a="png"]').textContent='PNG 480×800';q('[data-a="lang"]').textContent=en?'ES':'EN';q('.x').setAttribute('aria-label',t('Cerrar','Close'));
 el.dataset.capsula=C.cap.id;el.dataset.lang=C.lang;const cv=await renderCapsule(C.cap,{lang:C.lang,doc,canvas:q('canvas')});await putOnScreen(cv);return el;}
// Enseña una cápsula: tarjeta 480×800 a la derecha + (en Matrix) una pantalla vertical del local + locución opcional.
export async function showCapsule({tipo='random',lang='es',voice=true,doc=globalThis.document,autoCloseMs=0,storage=globalThis.localStorage}={}){
 const b=await loadCapsulaBank();const c=pickCapsule(b,tipo,{storage});if(!c)return null;C.cap=c;C.lang=lang==='en'?'en':'es';C.tipo=tipo;C.voice=voice;clearTimeout(C.timer);
 if(doc?.body)await paint(doc);if(voice)speakCapsule(c,C.lang);if(autoCloseMs)C.timer=setTimeout(closeCapsula,autoCloseMs);return c;}

// Entrada desde /demo capsula … (demo-tour.mjs → handleDemoTour). Devuelve el mensaje de la CLI.
export async function handleCapsula(arg,{lang='es',doc=globalThis.document}={}){const en=lang==='en',t=(es,e)=>en?e:es;const p=parseCapsulaArgs(arg);
 let b;try{b=await loadCapsulaBank();}catch(e){return {ok:false,local:true,message:t('No se pudo cargar la batería de cápsulas: ','Could not load the capsule bank: ')+e.message};}
 if(p.action==='help')return {ok:true,local:true,message:capsulaHelp(b,{en})};
 if(p.action==='invalid')return {ok:false,local:true,message:t('No conozco «','Unknown “')+p.bad.join(' ')+t('». ','”. ')+capsulaHelp(b,{en})};
 if(p.calidad!=='good'){const q=QUALITIES[p.calidad];return {ok:true,local:true,pending:true,message:'◆ '+(en?q.en:q.es)+'\n'+t('Mientras tanto: /demo capsula ','Meanwhile: /demo capsula ')+(p.tipo==='random'?'':p.tipo+' ')+'good'+t(' (gratis, al momento).',' (free, instant).')};}
 const c=await showCapsule({tipo:p.tipo,lang,voice:p.voice,doc});if(!c)return {ok:false,local:true,message:t('No hay cápsulas de esa tipología todavía.','No capsules of that typology yet.')};
 return {ok:true,local:true,capsula:c.id,message:'◆ '+t('¿Sabías que…? · ','Did you know…? · ')+L(tipoMeta(b,c.tipo).name,en)+' · GOOD · '+c.id+'\n'+spokenText(c,lang)+'\n'+t('Nemotron 3 Ultra · voz ','Nemotron 3 Ultra · voice ')+(en?'Daniel':'Mónica')+t(' · 0 € · Otra / Escuchar / PNG 480×800 en la tarjeta · Esc cierra',' · €0 · Another / Listen / PNG 480×800 on the card · Esc closes')};}
