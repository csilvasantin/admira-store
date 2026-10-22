// Puerta Cam (IEU · Santa Rosa 19) en admira.store (Carlos, 22-oct-2026). El vídeo de la calle llega compartiendo la
// pestaña de IEU, como en el segmentador (admira.tv/mcp/xtore-demo-setup.md): IEU exige sesión y su guía
// (admira.tv/mcp/ieu-puertacam-autostart.md) no admite copiar sesiones ni URLs privadas del stream.
// Un solo dueño de esa pestaña compartida: la ventana del stream y «Contenido segmentado» la reutilizan, así
// Chrome pregunta una vez. El recorte (el recuadro del vídeo dentro de la pestaña) se guarda en este navegador.
export const CROP_KEY='sneakerstore.puertaCam.crop.v1';
const unit=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1;

// Dos esquinas en coordenadas 0..1 del fotograma, en cualquier orden. Un recuadro diminuto es un clic suelto.
export function cropFromCorners(a,b,{min=.04}={}){
  if(![a?.x,a?.y,b?.x,b?.y].every(unit))return null;
  const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(a.x-b.x),h=Math.abs(a.y-b.y);
  return w>=min&&h>=min?{x,y,w,h}:null;
}
export function parseCrop(text){
  try{const c=JSON.parse(text);return c&&[c.x,c.y,c.w,c.h].every(unit)&&c.w>0&&c.h>0&&c.x+c.w<=1+1e-9&&c.y+c.h<=1+1e-9?{x:c.x,y:c.y,w:c.w,h:c.h}:null;}catch{return null;}
}
// Rectángulo de origen en píxeles del vídeo; sin recorte, el fotograma entero.
export function sourceRect(crop,width,height){
  if(!crop)return {sx:0,sy:0,sw:width,sh:height};
  return {sx:Math.round(crop.x*width),sy:Math.round(crop.y*height),sw:Math.max(1,Math.round(crop.w*width)),sh:Math.max(1,Math.round(crop.h*height))};
}

export const SHARE_OPTIONS={video:{displaySurface:'browser',frameRate:{ideal:10,max:15}},audio:false,monitorTypeSurfaces:'exclude',selfBrowserSurface:'exclude',surfaceSwitching:'exclude',systemAudio:'exclude'};

export function createPuertaCam({navigator=globalThis.navigator,storage=null,onChange=()=>{}}={}){
  let stream=null,pending=null,crop=null;
  try{crop=parseCrop(storage?.getItem(CROP_KEY));}catch{}
  const live=()=>!!stream&&stream.getVideoTracks().some(track=>track.readyState==='live');
  function release(){stream=null;onChange();}
  async function share(){
    if(live())return stream;
    if(pending)return pending;
    if(!navigator?.mediaDevices?.getDisplayMedia)throw Error('share_unsupported');
    pending=navigator.mediaDevices.getDisplayMedia(SHARE_OPTIONS).then(next=>{
      stream=next;next.getVideoTracks()[0]?.addEventListener('ended',()=>{if(stream===next)release();});onChange();return next;
    }).finally(()=>{pending=null;});
    return pending;
  }
  function stop(){const old=stream;stream=null;old?.getTracks().forEach(track=>track.stop());if(old)onChange();}
  function setCrop(next){crop=next;try{next?storage?.setItem(CROP_KEY,JSON.stringify(next)):storage?.removeItem(CROP_KEY);}catch{}onChange();}
  return {share,stop,setCrop,get stream(){return live()?stream:null;},get live(){return live();},get crop(){return crop;}};
}
