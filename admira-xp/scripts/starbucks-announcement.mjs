// Aviso de cierre del Starbucks en dos calidades (Carlos, 30-sep-2026): Estándar = Mónica de
// macOS (gratuita, local); ElevenLabs = eleven_multilingual_v2 generado una vez vía api.admira.store
// y servido como fichero (no gasta créditos al reproducir). Se elige en la línea Avisos del panel
// Experto o con /aviso estandar|elevenlabs en el CLI; la elección se recuerda en este navegador.
const TEXT='Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.';
const audioUrl=file=>new URL('../assets/audio/'+file,import.meta.url).href;
export const ANNOUNCEMENT_QUALITIES=Object.freeze({
 estandar:Object.freeze({id:'estandar',label:{es:'Mónica',en:'Mónica'},voice:'macOS Mónica (free local synthesis)',url:audioUrl('starbucks-cierre-22h.m4a')}),
 elevenlabs:Object.freeze({id:'elevenlabs',label:{es:'ElevenLabs',en:'ElevenLabs'},voice:'ElevenLabs eleven_multilingual_v2',url:audioUrl('starbucks-cierre-22h-elevenlabs.m4a')})
});
export const DEFAULT_ANNOUNCEMENT_QUALITY='estandar';
const STORAGE_KEY='xpaceos.starbucks.announcementQuality';
export function normalizeAnnouncementQuality(value){
 const v=String(value||'').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
 if(['estandar','standard','normal','basica','basic','monica','macos','1'].includes(v))return 'estandar';
 if(['elevenlabs','eleven','11labs','premium','ia','ai','2'].includes(v))return 'elevenlabs';
 return null;
}
export const CLOSING_ANNOUNCEMENT={id:'starbucks-cierre-22h',text:TEXT,url:ANNOUNCEMENT_QUALITIES.estandar.url,language:'es-ES',voice:ANNOUNCEMENT_QUALITIES.estandar.voice};
export const ANNOUNCEMENT_SPEAKER={yaw:-23.289684,pitch:21.400960};
function storedQuality(storage){try{return normalizeAnnouncementQuality(storage?.getItem(STORAGE_KEY))||DEFAULT_ANNOUNCEMENT_QUALITY;}catch{return DEFAULT_ANNOUNCEMENT_QUALITY;}}
export function createAnnouncement({audio,music,onState=()=>{},storage=globalThis.localStorage}){
 let playing=false,pending=false,error='',disposed=false,version=0,release=null,quality=storedQuality(storage);
 audio.src=ANNOUNCEMENT_QUALITIES[quality].url;audio.preload='metadata';audio.volume=1;
 const emit=()=>onState({playing,pending,error,quality});
 function stop(){++version;audio.pause();audio.currentTime=0;playing=false;pending=false;release?.();release=null;emit();}
 async function play(){
  if(disposed)return;stop();error='';pending=true;const ticket=++version;release=music.suppress();emit();
  try{await audio.play();if(disposed||ticket!==version)return;pending=false;playing=true;emit();}
  catch{if(disposed||ticket!==version)return;stop();error='play';emit();}
 }
 function setQuality(value){
  const next=normalizeAnnouncementQuality(value);if(!next)return null;
  if(next!==quality){const wasOn=playing||pending;stop();quality=next;audio.src=ANNOUNCEMENT_QUALITIES[quality].url;try{storage?.setItem(STORAGE_KEY,quality);}catch{}if(wasOn)void play();else emit();}
  return quality;
 }
 const ended=()=>stop(),failed=()=>{stop();error='media';emit();};audio.addEventListener('ended',ended);audio.addEventListener('error',failed);
 return {play,stop,setQuality,get quality(){return quality;},toggle:()=>playing||pending?stop():void play(),state:()=>({playing,pending,error,quality}),dispose(){disposed=true;stop();audio.removeEventListener('ended',ended);audio.removeEventListener('error',failed);audio.removeAttribute('src');audio.load();}};
}
