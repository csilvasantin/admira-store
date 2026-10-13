// Relojes de playlist para las escenas que pintan en lienzo (Good, Better, Best y Best · Hiperreal del Xtanco).
// Cada reloj es un <video> oculto y mudo que recorre su playlist; aquí se guarda su último fotograma y se funde con
// la pieza siguiente, para que una pantalla nunca caiga al negro ni a su dibujo de reserva entre dos contenidos.
// Sólo lectura: no publica, no guarda y no habla con ningún servicio salvo para leer las piezas.
import {createScreenPlaylist} from './screen-playlist.mjs?v=options-preview-1';

export const FADE_MS=450,HOLD_MS=120,RETRY_MS=4000;

// Las escenas pintan en lienzos y texturas, que exigen lectura cruzada (CORS). El dominio público del Stock sólo
// la concede si la petición lleva Origin, y el navegador reutiliza la copia sin ella que deja Matrix: se usa la ruta
// estable del Stock, la misma de Pixeria y las vistas previas, que la concede siempre.
export function sceneTrack(track){
 try{const url=new URL(track.url),match=url.pathname.match(/^\/stock\/([-\w]{1,120})\/asset\.\w+$/);
  if(match&&['stock.admira.store','pub-bf043a4daa3b43b7a0b769617729d074.r2.dev'].includes(url.hostname))return {...track,url:'https://api.admira.store/stock/asset/'+match[1]};
 }catch{}
 return track;
}
// Recorte del fotograma sw×sh que cubre `count` pantallas de proporción `aspect` puestas en fila; devuelve la parte de `index`.
export function coverRect({sw,sh,aspect,count=1,index=0}){
 const scale=Math.max(count*aspect/sw,1/sh),left=(count*aspect-sw*scale)/2,top=(1-sh*scale)/2;
 return {x:(index*aspect-left)/scale,y:-top/scale,w:aspect/scale,h:1/scale};
}
// Rectángulo del lienzo w×h donde cabe entero el fotograma, medido con la proporción física de la pantalla.
export function containRect({sw,sh,w,h,aspect}){
 const frame=sw/sh,width=frame<aspect?frame:aspect,height=frame<aspect?1:aspect/frame;
 return {x:(aspect-width)/2*w/aspect,y:(1-height)/2*h,w:width*w/aspect,h:height*h};
}

// Un conjunto de relojes que comparten caché de imágenes. `awake()` dice si deben avanzar: dormidos no reintentan.
export function createPainterPool({win=globalThis,doc=win.document,sequencer=createScreenPlaylist,awake=()=>true}={}){
 const painters=new Map(),images=new Map(),clock=()=>win.performance.now();
 let disposed=false;
 function image(url){
  let entry=images.get(url);
  if(!entry){const node=new win.Image();node.crossOrigin='anonymous';entry={node,ready:new Promise((resolve,reject)=>{node.onload=resolve;node.onerror=reject;})};entry.ready.catch(()=>{});node.src=url;images.set(url,entry);if(images.size>32)images.delete(images.keys().next().value);}
  return entry;
 }
 function drop(painter){win.clearTimeout(painter.retry);painter.sequence.dispose();painter.video.pause();painter.video.removeAttribute('src');painter.video.load();painters.delete(painter.id);}
 function make(id,tracks,loop=true){
  const video=doc.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.playsInline=true;video.preload='auto';
  const painter={id,video,tracks,json:JSON.stringify(tracks),hold:null,held:0,key:'',fadeAt:0,retry:0};
  // Un contenido que no carga no deja la pantalla parada: tras unos segundos se pasa al siguiente.
  painter.sequence=sequencer({videos:[video],tracks,loop,loadImage:url=>image(url).ready,onState:value=>{
   win.clearTimeout(painter.retry);if(!value.error||disposed||painter.tracks.length<2)return;
   painter.retry=win.setTimeout(()=>{const next=painter.tracks[(value.index+1)%painter.tracks.length];if(awake()&&next)void painter.sequence.jump(next.id||next.stockId).catch(()=>{});},RETRY_MS);
  }});
  painter.update=(next,nextLoop=true)=>{const json=JSON.stringify(next);painter.sequence.setLoop(nextLoop);if(json!==painter.json){painter.json=json;painter.tracks=next;painter.sequence.replaceTracks(next);}};
  painter.track=()=>painter.tracks[painter.sequence.state().index]||null;
  painters.set(id,painter);if(awake())void painter.sequence.play();
  return painter;
 }
 function frame(painter){
  const video=painter.video,src=video.getAttribute('src');
  if(src)return video.readyState>=2&&video.videoWidth?{image:video,sw:video.videoWidth,sh:video.videoHeight,key:src}:null;
  if(video.poster){const node=image(video.poster).node;return node.complete&&node.naturalWidth?{image:node,sw:node.naturalWidth,sh:node.naturalHeight,key:video.poster}:null;}
  return null;
 }
 function keep(painter,current,now){
  if(now-painter.held<HOLD_MS)return;
  const scale=Math.min(1,480/Math.max(current.sw,current.sh)),width=Math.max(2,Math.round(current.sw*scale)),height=Math.max(2,Math.round(current.sh*scale));
  if(!painter.hold){painter.hold=doc.createElement('canvas');painter.holdContext=painter.hold.getContext('2d');}
  if(painter.hold.width!==width||painter.hold.height!==height){painter.hold.width=width;painter.hold.height=height;}
  try{painter.holdContext.drawImage(current.image,0,0,width,height);painter.held=now;painter.holdReady=true;}catch{}
 }
 function fill(ctx,w,h,source,aspect,slice,alpha){
  ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;
  if(slice){const cut=coverRect({sw:source.sw,sh:source.sh,aspect,count:slice.count,index:slice.index});ctx.drawImage(source.image,cut.x,cut.y,cut.w,cut.h,0,0,w,h);}
  else{
   const fit=containRect({sw:source.sw,sh:source.sh,w,h,aspect});
   // Las bandas no quedan negras: se rellenan con el propio fotograma, ampliado y oscurecido.
   if(fit.w<w-1||fit.h<h-1){const cut=coverRect({sw:source.sw,sh:source.sh,aspect});ctx.drawImage(source.image,cut.x,cut.y,cut.w,cut.h,0,0,w,h);ctx.fillStyle='rgba(0,0,0,.58)';ctx.fillRect(0,0,w,h);}
   ctx.drawImage(source.image,fit.x,fit.y,fit.w,fit.h);
  }
  ctx.restore();
 }
 // Pinta la pieza actual del reloj en un lienzo w×h que se verá con la proporción física `aspect`.
 function paint(painter,ctx,w,h,{aspect=w/h,slice=null}={}){
  const now=clock(),current=frame(painter);
  if(current&&current.key!==painter.key){painter.key=current.key;painter.fadeAt=painter.holdReady?now:0;}
  const fading=!!current&&!!painter.fadeAt&&now-painter.fadeAt<FADE_MS,kept=painter.holdReady?{image:painter.hold,sw:painter.hold.width,sh:painter.hold.height}:null;
  if(!current&&!kept)return false;
  try{
   // Entre piezas se mantiene el último fotograma y se funde con la pieza nueva.
   if(!current||fading)fill(ctx,w,h,kept,aspect,slice,1);
   if(current)fill(ctx,w,h,current,aspect,slice,fading?(now-painter.fadeAt)/FADE_MS:1);
  }catch{return false;}
  if(current&&!fading)keep(painter,current,now);
  return true;
 }
 return {
  image,make,drop,paint,frame,
  get:id=>painters.get(id)||null,
  values:()=>[...painters.values()],
  play(){for(const painter of painters.values())void painter.sequence.play();},
  pause(){for(const painter of painters.values()){win.clearTimeout(painter.retry);painter.sequence.pause();}},
  dispose(){disposed=true;for(const painter of [...painters.values()])drop(painter);images.clear();}
 };
}
