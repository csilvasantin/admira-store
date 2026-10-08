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
// Devuelve {play:()=>Promise, stop()} para el reproductor de reglas.
export function createVoiceSpeaker(action,{win=globalThis,lang=()=>win.document?.documentElement?.lang,timeoutMs=20000}={}){
 let stopped=false;
 return {plan:()=>voicePlan(action,lang()),
  async play(){stopped=false;const out=[];for(const p of voicePlan(action,lang())){if(stopped)break;out.push(await sayOne(p,{win,timeoutMs}));}return out;},
  stop(){stopped=true;try{win.XpaceAnnouncements?.stopStock?.();}catch{}try{win.speechSynthesis?.cancel();}catch{}}};
}
