// Locución de texto de las reglas IF·THEN·DO THAT (Carlos, 8-oct-2026): al dejar una botella de agua en la caja
// suena «Gracias por comprar agua de proximidad» / «Thank you for buying locally sourced water» por el canal de
// megafonía del local (XpaceAnnouncements.playStock: para el hilo musical y lo devuelve, respeta /audio mute).
// Los textos por defecto están pregenerados con la voz Estándar de los avisos (Mónica de macOS, como el aviso de
// cierre) y se sirven como fichero: no gastan nada al sonar. Un texto editado que no tenga fichero se lee con la
// síntesis del navegador (Mónica / voz inglesa del sistema si existen), también parando la música.
export const WATER_THANKS=Object.freeze({es:'Gracias por comprar agua de proximidad',en:'Thank you for buying locally sourced water'});
export const VOICE_MODES=Object.freeze(['auto','es','en','both']);
const audioUrl=file=>new URL('../assets/audio/'+file,import.meta.url).href;
export const VOICE_CACHE=Object.freeze({
 [WATER_THANKS.es]:Object.freeze({url:audioUrl('agua-proximidad-es.m4a'),language:'es',voice:'macOS Mónica (Estándar)'}),
 [WATER_THANKS.en]:Object.freeze({url:audioUrl('agua-proximidad-en.m4a'),language:'en',voice:'macOS Daniel (Standard)'})
});
const clean=v=>String(v??'').replace(/\s+/g,' ').trim().slice(0,200);
// auto = idioma de la página (/idioma o el de /demo all) · es · en · both = castellano y después inglés.
export function voiceLanguages(mode,lang){return mode==='both'?['es','en']:mode==='es'||mode==='en'?[mode]:[lang==='en'?'en':'es'];}
export function voicePlan(action,lang){
 const text={es:clean(action?.text?.es??action?.value)||WATER_THANKS.es,en:clean(action?.text?.en)||WATER_THANKS.en};
 return voiceLanguages(VOICE_MODES.includes(action?.voice)?action.voice:'auto',lang).map(language=>{const t=text[language],c=VOICE_CACHE[t];return {language,text:t,url:c?.url||'',voice:c?.voice||'browser'};});
}
function pickVoice(win,language){
 try{const voices=win.speechSynthesis.getVoices()||[],want=language==='en'?/^(samantha|daniel|karen|serena)/i:/^m[oó]nica/i,pre=language==='en'?/^en/i:/^es/i;
  return voices.find(v=>want.test(v.name)&&pre.test(v.lang))||voices.find(v=>/^es-ES/i.test(v.lang)&&language==='es')||voices.find(v=>pre.test(v.lang))||null;}catch{return null;}
}
function sayOne(p,{win,timeoutMs}){
 return new Promise(resolve=>{let done=false;const finish=phase=>{if(done)return;done=true;clearTimeout(timer);resolve(phase);};const timer=setTimeout(()=>finish('timeout'),timeoutMs);
  const A=win.XpaceAnnouncements;
  if(p.url&&A?.playStock){try{const r=A.playStock(p.url,p.text,{language:p.language,onState:s=>{if(['done','stopped','error'].includes(s.phase))finish(s.phase);}});if(r===false)finish('muted');}catch{finish('error');}return;}
  if(win.dsMasterMute){finish('muted');return;}
  const S=win.speechSynthesis,U=win.SpeechSynthesisUtterance;if(!S||typeof U!=='function'){finish('unsupported');return;}
  const release=win.XpaceMusicHold?.();const u=new U(p.text);u.lang=p.language==='en'?'en-US':'es-ES';const v=pickVoice(win,p.language);if(v)u.voice=v;
  u.onend=()=>{release?.();finish('done');};u.onerror=()=>{release?.();finish('error');};try{S.cancel();S.speak(u);}catch{release?.();finish('error');}
 });
}
// Señal visible mientras suena (Carlos, 8-oct-2026): pulso en el altavoz de avisos del gemelo, subtítulo con el texto
// y línea en la CLI «🔊 Locución: «…»» (en inglés con la página en inglés).
const VOICE_CSS='#xpaceVoiceToast{position:fixed;left:50%;bottom:118px;transform:translate(-50%,12px);z-index:2147483640;display:flex;align-items:center;gap:12px;max-width:min(640px,92vw);padding:10px 18px 10px 12px;border-radius:999px;color:#f3fffa;font:600 15px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;background:rgba(6,40,30,.82);background:linear-gradient(150deg,color-mix(in srgb,var(--mbx-brand,#00704A) 55%,rgba(8,22,18,.85)),rgba(6,16,13,.9));border:1px solid rgba(160,255,220,.45);box-shadow:0 14px 40px rgba(0,0,0,.45),0 0 26px rgba(0,229,168,.25);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:0;transition:opacity .25s,transform .25s,left .25s,bottom .25s;pointer-events:none}'
 +'#xpaceVoiceToast.on{opacity:1;transform:translate(-50%,0)}#xpaceVoiceToast .sp{position:relative;flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12)}'
 +'#xpaceVoiceToast .sp::before,#xpaceVoiceToast .sp::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid #7dffd0;animation:xvt 1.4s ease-out infinite}#xpaceVoiceToast .sp::after{animation-delay:.7s}'
 +'#xpaceVoiceToast small{display:block;font:700 10px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#9dffd6}'
 +'@keyframes xvt{from{transform:scale(1);opacity:.9}to{transform:scale(1.9);opacity:0}}'
 +'.matrix-announcement[data-voice-pulse]{display:block!important}.matrix-announcement[data-voice-pulse]::before{opacity:1!important;border-color:#7dffd0!important;background:#00e5a833!important;box-shadow:0 0 18px #00e5a8aa!important}'
 +'.matrix-announcement[data-voice-pulse]::after{content:"";position:absolute;inset:-8px;border-radius:10px;border:2px solid #7dffd0;animation:xvt 1.2s ease-out infinite;pointer-events:none}'
 +'@media (prefers-reduced-motion:reduce){#xpaceVoiceToast{transition:none}#xpaceVoiceToast .sp::before,#xpaceVoiceToast .sp::after,.matrix-announcement[data-voice-pulse]::after{animation:none}}';
const SPK='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
export function voiceLogLine(p){return (p.language==='en'?'🔊 Voiceover: “':'🔊 Locución: «')+p.text+(p.language==='en'?'”':'»');}
// Sitio del aviso: centrado sobre el 360° (o la ventana), encima del dock, y sin pisar la tarjeta del recorrido:
// si la toca, pasa al lado libre de la tarjeta o, si no cabe, por encima de ella (Carlos, 8-oct-2026).
export function toastPlacement({vw,vh,w,h,stage=null,card=null,dockTop=null,gap=12}){
 const area=stage&&stage.right-stage.left>w?stage:{left:0,right:vw};const base=Math.max(24,dockTop!=null&&dockTop<vh?vh-dockTop+14:24);
 const fits=(cx,bottom)=>cx-w/2>=8&&cx+w/2<=vw-8&&vh-bottom-h>=56;
 const hit=(cx,bottom)=>!!card&&cx-w/2<card.right+8&&cx+w/2>card.left-8&&vh-bottom>card.top-8&&vh-bottom-h<card.bottom+8;
 const cx0=Math.round((area.left+area.right)/2);if(!hit(cx0,base))return {cx:cx0,bottom:base,mode:'centre'};
 const right=Math.round(card.right+gap+w/2),left=Math.round(card.left-gap-w/2),above=Math.round(vh-card.top+gap);
 const sides=(vw-card.right>=card.left)?[['right',right],['left',left]]:[['left',left],['right',right]];
 for(const [mode,cx] of sides)if(fits(cx,base)&&!hit(cx,base))return {cx,bottom:base,mode};
 if(fits(cx0,above))return {cx:cx0,bottom:above,mode:'above'};
 return {cx:cx0,bottom:Math.round(vh-card.bottom-gap-h)>=base?Math.round(vh-card.bottom-gap-h):base,mode:'below'};
}
// El aviso se queda al menos VOICE_TOAST_MIN_MS y, dentro de un recorrido /demo, hasta que avanza la demo (máx. 12 s).
export const VOICE_TOAST_MIN_MS=4500;
export function createVoiceIndicator(win=globalThis,{minMs=VOICE_TOAST_MIN_MS,maxTourMs=12000}={}){
 const doc=win.document;let timer=0,shownAt=0,follow=0;
 function place(t){try{const vw=win.innerWidth,vh=win.innerHeight;if(!vw||!vh||!t.getBoundingClientRect)return;const vis=e=>{if(!e?.isConnected)return null;const r=e.getBoundingClientRect();return r.width>0&&r.height>0?r:null;};
  const dock=vis(doc.getElementById('telegramDock')),p=toastPlacement({vw,vh,w:t.offsetWidth,h:t.offsetHeight,stage:vis(doc.querySelector('dialog.matrix-panorama-dialog[open]')),card:vis(doc.getElementById('xpaceDemoTourCard')),dockTop:dock?dock.top:null});
  t.style.left=p.cx+'px';t.style.bottom=p.bottom+'px';t.dataset.place=p.mode;}catch{}}
 function el(){if(!doc?.body)return null;if(!doc.getElementById('xpaceVoiceCSS')){const st=doc.createElement('style');st.id='xpaceVoiceCSS';st.textContent=VOICE_CSS;doc.head.append(st);}
  let t=doc.getElementById('xpaceVoiceToast');if(!t){t=doc.createElement('div');t.id='xpaceVoiceToast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');t.innerHTML='<span class="sp">'+SPK+'</span><span class="tx"><small></small><span class="q"></span></span>';doc.body.append(t);}return t;}
 return {show(p){const line=voiceLogLine(p);try{win.XpaceAppendLog?.('bot','AdmiraXPBot',line);}catch{}try{win.XpaceShowResponse?.(line,'ok','local-visual');}catch{}try{win.dispatchEvent?.(new win.CustomEvent('xpace:voiceover',{detail:{phase:'start',...p,line}}));}catch{}
   const t=el();if(t){clearTimeout(timer);t.querySelector('small').textContent=p.language==='en'?'Voiceover · announcement speaker':'Locución · altavoz de avisos';t.querySelector('.q').textContent=(p.language==='en'?'“':'«')+p.text+(p.language==='en'?'”':'»');t.classList.add('on');shownAt=Date.now();place(t);clearInterval(follow);follow=setInterval(()=>place(t),250);}
   for(const b of doc?.querySelectorAll?.('.matrix-announcement[data-announcement]')||[])b.setAttribute('data-voice-pulse','');},
  hide(){try{win.dispatchEvent?.(new win.CustomEvent('xpace:voiceover',{detail:{phase:'end'}}));}catch{}
   const tour=()=>{try{return win.XpaceDemoTour?.state?.()||null;}catch{return null;}},s0=tour(),idx=s0?.active?s0.index:null,t0=Date.now();
   const off=()=>{clearInterval(follow);const t=doc?.getElementById?.('xpaceVoiceToast');t?.classList.remove('on');for(const b of doc?.querySelectorAll?.('[data-voice-pulse]')||[])b.removeAttribute('data-voice-pulse');};
   const tick=()=>{const now=Date.now(),s=tour(),same=idx!=null&&s?.active&&s.index===idx;if(now<shownAt+minMs||now<t0+900||(same&&now<t0+maxTourMs)){timer=setTimeout(tick,250);return;}off();};
   clearTimeout(timer);timer=setTimeout(tick,250);}};
}
// Devuelve {play:()=>Promise, stop()} para el reproductor de reglas.
export function createVoiceSpeaker(action,{win=globalThis,lang=()=>win.document?.documentElement?.lang,timeoutMs=20000,indicator=createVoiceIndicator(win)}={}){
 let stopped=false;
 return {plan:()=>voicePlan(action,lang()),
  async play(){stopped=false;const out=[];try{for(const p of voicePlan(action,lang())){if(stopped)break;indicator?.show(p);out.push(await sayOne(p,{win,timeoutMs}));}}finally{indicator?.hide();}return out;},
  stop(){stopped=true;indicator?.hide();try{win.XpaceAnnouncements?.stopStock?.();}catch{}try{win.speechSynthesis?.cancel();}catch{}}};
}
