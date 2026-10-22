// Puerta Cam (IEU · Santa Rosa 19) en admira.store (Carlos, 22-oct-2026). El servidor de admira.store pide a IEU un
// enlace firmado al directo con su token de cámaras (functions/xpacios/sneakerstore/puerta-cam-stream.js) y aquí se
// reproduce con hls.js, sin abrir IEU. Un solo dueño del vídeo: la ventana Puerta Cam y «Contenido segmentado» lo
// reutilizan. La ventana es solo directo; compartir la pestaña de IEU queda únicamente para el segmentado.
export const STREAM_ENDPOINT='/xpacios/sneakerstore/puerta-cam-stream';
export const HLS_URL='https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.light.min.mjs';

export const SHARE_OPTIONS={video:{displaySurface:'browser',frameRate:{ideal:10,max:15}},audio:false,monitorTypeSurfaces:'exclude',selfBrowserSurface:'exclude',surfaceSwitching:'exclude',systemAudio:'exclude'};

// Error con código: login_required, not_configured, camera_not_configured, ieu_*… (o hls_unsupported).
export class StreamError extends Error{constructor(code,login=''){super(code);this.code=code;this.login=login;}}

export function createPuertaCam({navigator=globalThis.navigator,document=globalThis.document,fetcher=globalThis.fetch?.bind(globalThis),loadHls=()=>import(HLS_URL),onChange=()=>{}}={}){
  let stream=null,source=null,pending=null,player=null;
  const live=()=>!!stream&&stream.getVideoTracks().some(track=>track.readyState==='live');
  function release(){stream=null;source=null;closePlayer();onChange();}
  function closePlayer(){const p=player;player=null;if(!p)return;try{p.hls?.destroy();}catch{}p.video.pause();p.video.removeAttribute('src');p.video.load();}
  function adopt(next,kind){stream=next;source=kind;next.getVideoTracks()[0]?.addEventListener('ended',()=>{if(stream===next)release();});onChange();return next;}
  // Directo de IEU: enlace firmado de nuestro servidor, reproducido con hls.js (o HLS nativo) y convertido en
  // MediaStream con captureStream. IEU sirve con CORS abierto, así que el vídeo se puede analizar.
  async function playDirect(){
    const r=await fetcher(STREAM_ENDPOINT,{method:'POST',credentials:'same-origin',headers:{Accept:'application/json'}});
    const data=await r.json().catch(()=>null);
    if(!r.ok||!data?.ok||typeof data.url!=='string')throw new StreamError(data?.error||'http_'+r.status,data?.login||'');
    const video=Object.assign(document.createElement('video'),{muted:true,playsInline:true,crossOrigin:'anonymous'});
    const p={video,hls:null};closePlayer();player=p;
    if(video.canPlayType('application/vnd.apple.mpegurl'))video.src=data.url;
    else{
      const {default:Hls}=await loadHls();if(!Hls?.isSupported?.())throw new StreamError('hls_unsupported');
      p.hls=new Hls({lowLatencyMode:true,liveDurationInfinity:true});p.hls.loadSource(data.url);p.hls.attachMedia(video);
      // Un enlace caducado (12 h) o un corte de red cierran el directo; el siguiente «Ver stream» pide otro.
      p.hls.on(Hls.Events.ERROR,(_,d)=>{if(d?.fatal&&player===p)stop();});
    }
    await video.play();
    if(player!==p)throw new StreamError('cancelled');
    return adopt(video.captureStream(),'direct');
  }
  function connect(){
    if(live())return Promise.resolve(stream);
    if(!pending)pending=playDirect().catch(e=>{if(player&&source!=='direct')closePlayer();throw e instanceof StreamError?e:new StreamError(e?.message||'play_failed');}).finally(()=>{pending=null;});
    return pending;
  }
  // Pestaña de IEU compartida, solo para el segmentado; con direct=true intenta antes el directo, sin selector.
  async function share({direct=false}={}){
    if(live())return stream;
    if(direct)try{return await connect();}catch{}
    if(pending)return pending;
    if(!navigator?.mediaDevices?.getDisplayMedia)throw Error('share_unsupported');
    pending=navigator.mediaDevices.getDisplayMedia(SHARE_OPTIONS).then(next=>adopt(next,'tab')).finally(()=>{pending=null;});
    return pending;
  }
  function stop(){const old=stream;stream=null;source=null;old?.getTracks().forEach(track=>track.stop());closePlayer();if(old)onChange();}
  return {connect,share,stop,get stream(){return live()?stream:null;},get live(){return live();},get source(){return live()?source:null;}};
}
