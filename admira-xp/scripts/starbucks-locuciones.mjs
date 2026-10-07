// Locuciones de los dos altavoces del Starbucks en Matrix · 360 (Carlos, 7-oct-2026 · presentación Alsea).
//  · «altavoz»   = el altavoz de música junto al cartel EXIT → locución en INGLÉS.
//  · «videowall» = el altavoz negro de la pared del videowall (junto a la escalera) → locución en CASTELLANO.
// Las dos ya están creadas en Stock con ElevenLabs v4 a 44,1 kHz / 192 kbps (máxima calidad): aquí sólo se
// reproducen, no se genera ni se gasta nada. Cada una suena DOS veces seguidas y baja el hilo musical.
const asset=id=>'https://api.admira.store/stock/asset/'+id;
export const SPEAKER_LOCUTIONS=Object.freeze({
 altavoz:Object.freeze({id:'altavoz',stock:'1791236723173-oh9hkl',url:asset('1791236723173-oh9hkl'),language:'en',voice:'James',times:2,
  text:'This is gonna be the best coffee shop in the world!! From Mexico to Spain, 24/7'}),
 videowall:Object.freeze({id:'videowall',stock:'1791237899912-uicfm4',url:asset('1791237899912-uicfm4'),language:'es',voice:'Sara Martín',times:2,
  text:'Hoy para nuestros socios de Starbucks, si acumulan puntos les daremos un refill de Chai Latte'})
});
// buttons = {altavoz:<button>,videowall:<button>} ya colocados en la escena por el panorama.
export function mountSpeakerLocutions(buttons,{status,onBeforePlay=()=>{},win=globalThis,signal}={}){
 const doc=win.document,t=(es,en)=>doc?.documentElement?.lang==='en'?en:es;
 let active='',revision=0,disposed=false;
 const say=text=>{if(status)status.textContent=text;};
 const name=k=>k==='altavoz'?t('Altavoz · inglés','Speaker · English'):t('Altavoz del videowall · castellano','Videowall speaker · Spanish');
 function render(){for(const [k,b] of Object.entries(buttons)){if(!b)continue;const L=SPEAKER_LOCUTIONS[k],on=active===k;
  const label=(on?t('Detener locución · ','Stop voiceover · '):t('Emitir locución ×'+L.times+' · ','Play voiceover ×'+L.times+' · '))+name(k);
  b.title=label+' — «'+L.text+'»';b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(on));}}
 function stop(){if(!active)return;revision++;win.XpaceAnnouncements?.stopStock?.();const k=active;active='';render();say(t('Locución detenida · ','Voiceover stopped · ')+name(k));}
 function play(k){const L=SPEAKER_LOCUTIONS[k];if(disposed||!L)return false;
  if(active===k){stop();return false;}
  const A=win.XpaceAnnouncements;if(!A?.playStock){say(t('No se pudo reproducir · ','Playback failed · ')+name(k));return false;}
  const ticket=++revision;onBeforePlay();active=k;render();
  A.playStock(L.url,L.text,{language:L.language,times:L.times,onState(s){if(disposed||ticket!==revision)return;
   if(['done','stopped','error'].includes(s.phase)){active='';render();}
   say(s.phase==='error'&&s.error==='muted'?t('Audio silenciado · /audio unmute','Audio muted · /audio unmute'):s.phase==='error'?t('No se pudo reproducir · ','Playback failed · ')+name(k):s.phase==='done'?t('Locución completada · ','Voiceover complete · ')+name(k)+' · '+L.times+'/'+L.times:s.phase==='stopped'?t('Locución detenida · ','Voiceover stopped · ')+name(k):t('Emitiendo · ','Playing · ')+name(k)+' · '+Math.min(L.times,s.completed+1)+'/'+L.times);}});
  return true;}
 for(const [k,b] of Object.entries(buttons)){if(!b)continue;
  for(const type of ['pointerdown','pointerup'])b.addEventListener(type,e=>e.stopPropagation(),{signal});
  b.addEventListener('click',e=>{e.stopPropagation();play(k);},{signal});}
 render();
 return {play,stop,state:()=>({active}),render,dispose(){disposed=true;revision++;if(active)win.XpaceAnnouncements?.stopStock?.();active='';}};
}
