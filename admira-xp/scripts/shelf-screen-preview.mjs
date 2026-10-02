// Local, transient priority layer. The underlying DS player/pins keep running.
export const SHELF_PREVIEW_CHANNEL='xpaceos:shelf-screen-preview:v1';
export const SHELF_PREVIEW_STATUS_CHANNEL=SHELF_PREVIEW_CHANNEL+':status';
export const SHELF_PREVIEW_TTL=30000;
const phases=new Set(['ready','showing','error','stopped']);
const textFor={loading:'Preparando vista previa del producto…',ready:'Contenido preparado para la pantalla.',showing:'Contenido mostrado en la pantalla.',error:'No se pudo preparar el contenido.',stopped:'Vista previa detenida; programación restaurada.'};

export function validateShelfPreview(input){
 if(!input||input.surfaceId!=='ds1')throw Error('La vista previa admite únicamente la superficie Xtanco ds1.');
 if(!['image','video'].includes(input.kind))throw Error('El contenido debe ser una imagen o un vídeo.');
 let url;try{url=new URL(input.url);}catch{throw Error('Usa una URL HTTPS de contenido.');}
 if(url.protocol!=='https:'||url.username||url.password||url.href.length>4096)throw Error('Usa una URL HTTPS sin credenciales.');
 if(typeof input.productId!=='string'||!input.productId.trim()||input.productId.length>200)throw Error('Falta la identidad del producto.');
 if(input.title!=null&&(typeof input.title!=='string'||input.title.length>200))throw Error('El título debe tener hasta 200 caracteres.');
 return {surfaceId:'ds1',kind:input.kind,url:url.href,title:input.title||'',productId:input.productId,requestId:typeof input.requestId==='string'?input.requestId:''};
}

export function createShelfScreenPreview({acquireSurface,drawMedia,createVideo=()=>document.createElement('video'),createImage=()=>new Image(),timeoutMs=15000}={}){
 if(typeof acquireSurface!=='function'||typeof drawMedia!=='function')throw Error('Se requieren los adaptadores de superficie y dibujo existentes.');
 let active=null,disposed=false,current={phase:'stopped',requestId:'',text:textFor.stopped};const listeners=new Set();
 const notify=()=>{for(const listener of listeners)try{listener({...current});}catch{ /* A UI observer must not interrupt rendering or cleanup. */ }};
 function release(entry){
  clearTimeout(entry.timer);for(const remove of entry.events)remove();entry.events.length=0;
  const element=entry.media.video||entry.media.img;if(!element)return;
  if(entry.media.video){element.pause?.();element.muted=true;element.volume=0;}
  element.removeAttribute?.('src');element.remove?.();if(entry.media.video)element.load?.();
 }
 function endPending(entry,result,error){if(entry.settled)return;entry.settled=true;error?entry.reject(error):entry.resolve(result);}
 function stop(requestId){
  const entry=active;active=null;if(entry){release(entry);endPending(entry,{ready:false,cancelled:true});}
  current={...current,phase:'stopped',requestId:typeof requestId==='string'?requestId:current.requestId,text:textFor.stopped,error:undefined};notify();
 }
 function fail(entry,error){
  if(active!==entry||disposed)return;active=null;release(entry);const message=error?.message||textFor.error;
  current={...entry.input,phase:'error',text:message,error:message};notify();endPending(entry,null,error instanceof Error?error:Error(message));
 }
 function prepared(entry){
  if(active!==entry||disposed)return;clearTimeout(entry.timer);entry.media.ready=true;entry.ready=true;
  current={...entry.input,phase:'ready',text:textFor.ready};notify();endPending(entry,{ready:true,status:{...current}});
 }
 function preview(input){
  if(disposed)return Promise.reject(Error('La vista previa ya está cerrada.'));
  let value;try{value=validateShelfPreview(input);if(!acquireSurface(value.surfaceId))throw Error('La superficie ds1 no está disponible.');}catch(error){return Promise.reject(error);}
  if(active)stop();
  return new Promise((resolve,reject)=>{
   const entry={input:value,media:{kind:value.kind,name:value.title,ready:false},events:[],resolve,reject,settled:false,ready:false,starting:false};active=entry;
   current={...value,phase:'loading',text:textFor.loading};notify();
   const on=(element,type,handler)=>{element.addEventListener(type,handler);entry.events.push(()=>element.removeEventListener(type,handler));};
   try{
    const element=value.kind==='video'?createVideo():createImage();entry.media[value.kind==='video'?'video':'img']=element; element.crossOrigin='anonymous';
    on(element,'error',()=>fail(entry,Error('No se pudo cargar el contenido de la vista previa.')));
    const ready=()=>{
     if(active!==entry||entry.ready||entry.starting)return;
     const usable=value.kind==='video'?element.readyState>=2&&element.videoWidth>0&&element.videoHeight>0:element.naturalWidth>0&&element.naturalHeight>0;
     if(!usable)return;
     if(value.kind==='image'){prepared(entry);return;}
     entry.starting=true;Promise.resolve().then(()=>{if(active!==entry||disposed)return;return element.play();}).then(()=>prepared(entry),error=>fail(entry,error));
    };
    on(element,value.kind==='video'?'loadeddata':'load',ready);
    if(value.kind==='video'){element.muted=true;element.defaultMuted=true;element.volume=0;element.loop=true;element.playsInline=true;element.preload='auto';}else element.decoding='async';
    entry.timer=setTimeout(()=>fail(entry,Error('El contenido tardó demasiado en prepararse.')),timeoutMs);
    element.src=value.url;if(value.kind==='video')element.load?.();ready();
   }catch(error){fail(entry,error);}
  });
 }
 return {
  preview,stop,status:()=>({...current}),
  subscribe(listener){listeners.add(listener);listener({...current});return()=>listeners.delete(listener);},
  draw(context,width,height,surfaceId){
   const entry=active;if(disposed||!entry?.ready||entry.input.surfaceId!==surfaceId||!(width>0&&height>0))return false;
   try{const drawn=drawMedia(context,entry.media,width,height)===true;if(drawn&&current.phase!=='showing'){current={...current,phase:'showing',text:textFor.showing};notify();}return drawn;}catch(error){fail(entry,error);return false;}
  },
  dispose(){if(disposed)return;stop();disposed=true;listeners.clear();}
 };
}

function parseMessage(value){try{return typeof value==='string'?JSON.parse(value):value;}catch{return null;}}
function eventWithDetail(target,type,detail){
 const Constructor=target.CustomEvent||globalThis.CustomEvent;if(Constructor)return new Constructor(type,{detail});
 const event=new Event(type);Object.defineProperty(event,'detail',{value:detail});return event;
}
// Listen only to fresh commands delivered after connection. Never read saved state.
export function connectShelfPreviewChannel(controller,{target=window,storage,channel=SHELF_PREVIEW_CHANNEL,now=Date.now,onError=()=>{}}={}){
 let closed=false;const seen=new Map(),statusChannel=channel+':status';
 if(storage===undefined)try{storage=target.localStorage;}catch{storage=null;}
 function publish(status){
  if(closed||!status.requestId||!phases.has(status.phase))return;
  const message={schema_version:1,context:'xtanco',createdAt:now(),...status};
  try{storage?.setItem(statusChannel,JSON.stringify(message));}catch(error){onError(error);}
  target.dispatchEvent(eventWithDetail(target,statusChannel,message));
 }
 const unsubscribe=controller.subscribe(publish);
 function receive(value){
  if(closed)return;const message=parseMessage(value),age=message?now()-message.createdAt:Infinity;
  if(!message||message.schema_version!==1||message.context!=='xtanco'||!Number.isFinite(message.createdAt)||age<0||age>SHELF_PREVIEW_TTL||typeof message.id!=='string'||!/^[-\w:.]{1,120}$/.test(message.id)||!['preview','stop'].includes(message.action)||seen.has(message.id))return;
  for(const [id,createdAt]of seen)if(now()-createdAt>SHELF_PREVIEW_TTL)seen.delete(id);
  seen.set(message.id,message.createdAt);
  if(message.action==='stop'){controller.stop(message.id);return;}
  void controller.preview({...message,requestId:message.id}).catch(error=>{
   if(closed)return;if(controller.status().requestId!==message.id||controller.status().phase!=='error')publish({phase:'error',requestId:message.id,text:error.message,error:error.message});onError(error);
  });
 }
 const onStorage=event=>{if(event.key===channel&&event.newValue!=null)receive(event.newValue);};
 const onLocal=event=>receive(event.detail);
 target.addEventListener('storage',onStorage);target.addEventListener(channel,onLocal);
 return ()=>{if(closed)return;closed=true;unsubscribe();target.removeEventListener('storage',onStorage);target.removeEventListener(channel,onLocal);seen.clear();};
}
