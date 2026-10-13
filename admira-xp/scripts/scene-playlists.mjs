// Playlists en escena (Neo, 13-oct-2026). En Good, Better y Best las pantallas del Starbucks reproducen la misma
// programación que en Matrix: playlists de pared, TPV e iPad, estado vivo de MCP, asignaciones y reparto /sincro.
// Sólo lectura: un <video> oculto y mudo por playlist; no cambia playlists, asignaciones ni estado MCP.
// Se despierta cuando una escena pide pintar una pantalla y se duerme sola si nadie pinta (Matrix, pestaña oculta).
// Guía: admira-xp/docs/playlists-en-escena.md
import {createScreenPlaylist} from './screen-playlist.mjs?v=options-preview-1';
import {DEVICE_IDS,assignedPlaylist,emptyDeviceLayout,validateDeviceLayout} from './device-layout.mjs?v=ipad-20261005-1';
import {DEMO_WALL,DEMO_CHRISTMAS,DEMO_TPV} from './starbucks-demo.mjs?v=devices-2';
import {STARBUCKS_IPAD_PLAYLIST} from './starbucks-ipad.mjs?v=ipad-1';
import {watchMatrixState} from './matrix-remote.mjs?v=ipad-20261005-1';
import {getScreenDisplayMode,screenSlice} from './screen-display.mjs?v=number-layout-1';

export const SCENE_PLAYLISTS_KEY='xpaceos.scene-playlists.v1';
export const DEVICE_LAYOUT_KEY='xpaceos.starbucks.device-layout.v1';
export const SCENE_SEEDS=Object.freeze({wall:[...DEMO_WALL,...DEMO_CHRISTMAS],tpv:DEMO_TPV,ipad:STARBUCKS_IPAD_PLAYLIST.tracks});
// Proporción física (ancho/alto) de cada pantalla del modelo: las escenas pintan en un lienzo 2:3 (4:3 el iPad)
// que luego se estira sobre la superficie; pintar con esta proporción evita deformar el contenido.
export const SURFACE_ASPECT=Object.freeze({wall:.86/1.1,tpv:.445/.65,ipad:.6/.45});
export const sceneKind=id=>/ipad/.test(id)?'ipad':/tpv/.test(id)?'tpv':'wall';
const FADE_MS=450,SLEEP_MS=2500,HOLD_MS=120,RETRY_MS=4000;

// Las escenas pintan en lienzos y texturas, que exigen lectura cruzada (CORS). El dominio público del Stock sólo
// la concede si la petición lleva Origin, y el navegador reutiliza la copia sin ella que deja Matrix: se usa la ruta
// estable del Stock, la misma de Pixeria y las vistas previas, que la concede siempre.
export function sceneTrack(track){
 try{const url=new URL(track.url),match=url.pathname.match(/^\/stock\/([-\w]{1,120})\/asset\.\w+$/);
  if(match&&['stock.admira.store','pub-bf043a4daa3b43b7a0b769617729d074.r2.dev'].includes(url.hostname))return {...track,url:'https://api.admira.store/stock/asset/'+match[1]};
 }catch{}
 return track;
}
// Catálogo base: la semilla del repo o la playlist gestionada por MCP; /navidad filtra la pared como en Matrix.
export function sceneCatalog(state,seeds=SCENE_SEEDS){
 const managed=name=>state?.playlists?.[name]?.managed&&Array.isArray(state.playlists[name].tracks)?state.playlists[name].tracks:null;
 const christmas=state?.controls?.demoMode==='christmas';
 return {wall:{tracks:(managed('wall')||seeds.wall).filter(t=>christmas?t.condition==='/navidad':!t.condition),loop:true},tpv:{tracks:managed('tpv')||seeds.tpv,loop:true},ipad:{tracks:managed('ipad')||seeds.ipad,loop:true}};
}
// Asignaciones de este navegador (las mismas que usa Matrix) o las compartidas por MCP si son más recientes.
export function sceneLayout(saved,state){
 let layout=emptyDeviceLayout(),seen=0;
 try{if(saved){layout=validateDeviceLayout(saved.config);seen=Number(saved.remoteRevision)||0;}}catch{layout=emptyDeviceLayout();seen=0;}
 try{if(state?.deviceLayout&&(state.deviceLayoutRevision||0)>seen)layout=validateDeviceLayout(state.deviceLayout);}catch{}
 return layout;
}
// Una entrada por playlist en uso, con los dispositivos encendidos que la comparten (un reloj por playlist).
export function sceneGroups({devices=DEVICE_IDS,layout=emptyDeviceLayout(),catalog={},off={}}={}){
 const groups=new Map();
 for(const id of devices){
  if(off[id])continue;
  const pid=assignedPlaylist(layout,id),source=layout.playlists[pid]||catalog[pid];if(!source?.tracks?.length)continue;
  if(!groups.has(pid))groups.set(pid,{id:pid,devices:[],tracks:source.tracks.map(sceneTrack),loop:source.loop!==false});
  groups.get(pid).devices.push(id);
 }
 return groups;
}
// Trozo de un vídeo repartido entre varias pantallas (/sincro): sólo si todas comparten playlist, como en Matrix.
export function sceneSlice(id,mode,sameClock=()=>true){
 if(sceneKind(id)!=='wall'||mode==='individual')return null;
 const slice=screenSlice(id,mode);if(!slice||slice.width<=100)return null;
 const numbers=slice.group.split('-').map(Number);if(!sameClock(numbers))return null;
 return {count:slice.width/100,index:Math.round(-slice.left/100)};
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
export function readScenePlaylists(storage){try{return JSON.parse(storage?.getItem(SCENE_PLAYLISTS_KEY)||'null')?.enabled!==false;}catch{return true;}}

export function createScenePlaylists({win=globalThis,doc=win.document,storage,watch=watchMatrixState,sequencer=createScreenPlaylist,seeds=SCENE_SEEDS,mode=getScreenDisplayMode,number=id=>7-Number(id.slice(-1))}={}){
 const store=storage===undefined?win.localStorage:storage,clock=()=>win.performance.now();
 const players=new Map(),byDevice=new Map(),images=new Map();
 let enabled=readScenePlaylists(store),state=null,stopWatch=null,idle=0,lastUse=0,awake=false,disposed=false,off={};
 function image(url){
  let entry=images.get(url);
  if(!entry){const node=new win.Image();node.crossOrigin='anonymous';entry={node,ready:new Promise((resolve,reject)=>{node.onload=resolve;node.onerror=reject;})};entry.ready.catch(()=>{});node.src=url;images.set(url,entry);if(images.size>32)images.delete(images.keys().next().value);}
  return entry;
 }
 function savedLayout(){try{return JSON.parse(store?.getItem(DEVICE_LAYOUT_KEY)||'null');}catch{return null;}}
 function drop(player){win.clearTimeout(player.retry);player.sequence.dispose();player.video.pause();player.video.removeAttribute('src');player.video.load();players.delete(player.id);}
 function make(group){
  const video=doc.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.playsInline=true;video.preload='auto';
  const player={id:group.id,video,tracks:group.tracks,json:JSON.stringify(group.tracks),devices:group.devices,hold:null,held:0,key:'',fadeAt:0,retry:0};
  // Un contenido que no carga no deja la pantalla parada: tras unos segundos se pasa al siguiente.
  player.sequence=sequencer({videos:[video],tracks:group.tracks,loop:group.loop,loadImage:url=>image(url).ready,onState:value=>{
   win.clearTimeout(player.retry);if(!value.error||disposed||player.tracks.length<2)return;
   player.retry=win.setTimeout(()=>{const next=player.tracks[(value.index+1)%player.tracks.length];if(awake&&next)void player.sequence.jump(next.id||next.stockId).catch(()=>{});},RETRY_MS);
  }});
  players.set(group.id,player);if(awake)void player.sequence.play();
  return player;
 }
 function sync(){
  if(disposed)return;
  off=state?.devicesOff||{};
  const groups=enabled?sceneGroups({layout:sceneLayout(savedLayout(),state),catalog:sceneCatalog(state,seeds),off}):new Map();
  for(const player of [...players.values()])if(!groups.has(player.id))drop(player);
  byDevice.clear();
  for(const group of groups.values()){
   let player=players.get(group.id);
   if(!player)player=make(group);
   else{const json=JSON.stringify(group.tracks);player.sequence.setLoop(group.loop);if(json!==player.json){player.json=json;player.tracks=group.tracks;player.sequence.replaceTracks(group.tracks);}player.devices=group.devices;}
   for(const id of group.devices)byDevice.set(id,player);
  }
 }
 function sleep(){
  if(!awake)return;awake=false;win.clearInterval(idle);idle=0;stopWatch?.();stopWatch=null;
  for(const player of players.values()){win.clearTimeout(player.retry);player.sequence.pause();}
 }
 // Sólo trabaja mientras alguna escena pinta: en Matrix, con la pestaña oculta o fuera del Starbucks no consume nada.
 function wake(){
  lastUse=clock();if(awake||disposed||!enabled)return;awake=true;
  sync();for(const player of players.values())void player.sequence.play();
  stopWatch=watch({onState:value=>{state=value;sync();}});
  idle=win.setInterval(()=>{if(clock()-lastUse>SLEEP_MS)sleep();},1000);
 }
 const track=player=>player.tracks[player.sequence.state().index]||null;
 // En Matrix el gestor de colas ocupa el iPad mientras su playlist no trae vídeo; aquí se respeta igual.
 const queueOwns=(id,player)=>sceneKind(id)==='ipad'&&track(player)?.kind==='image'&&!!win.XpaceIpadCola?.on?.();
 function frame(player){
  const video=player.video,src=video.getAttribute('src');
  if(src)return video.readyState>=2&&video.videoWidth?{image:video,sw:video.videoWidth,sh:video.videoHeight,key:src}:null;
  if(video.poster){const node=image(video.poster).node;return node.complete&&node.naturalWidth?{image:node,sw:node.naturalWidth,sh:node.naturalHeight,key:video.poster}:null;}
  return null;
 }
 function hold(player,current,now){
  if(now-player.held<HOLD_MS)return;
  const scale=Math.min(1,480/Math.max(current.sw,current.sh)),width=Math.max(2,Math.round(current.sw*scale)),height=Math.max(2,Math.round(current.sh*scale));
  if(!player.hold){player.hold=doc.createElement('canvas');player.holdContext=player.hold.getContext('2d');}
  if(player.hold.width!==width||player.hold.height!==height){player.hold.width=width;player.hold.height=height;}
  try{player.holdContext.drawImage(current.image,0,0,width,height);player.held=now;player.holdReady=true;}catch{}
 }
 function paint(ctx,w,h,source,aspect,slice,alpha){
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
 function draw(ctx,w,h,id){
  if(!enabled||disposed||!DEVICE_IDS.includes(id))return false;
  wake();
  if(off[id]){ctx.save();ctx.fillStyle='#050606';ctx.fillRect(0,0,w,h);ctx.restore();return true;}
  const player=byDevice.get(id);if(!player||queueOwns(id,player))return false;
  const now=clock(),current=frame(player),aspect=SURFACE_ASPECT[sceneKind(id)];
  if(current&&current.key!==player.key){player.key=current.key;player.fadeAt=player.holdReady?now:0;}
  const fading=!!current&&!!player.fadeAt&&now-player.fadeAt<FADE_MS,kept=player.holdReady?{image:player.hold,sw:player.hold.width,sh:player.hold.height}:null;
  if(!current&&!kept)return false;
  const slice=sceneSlice(id,mode(),numbers=>numbers.every(n=>player.devices.some(device=>number(device)===n)));
  try{
   // Entre piezas se mantiene el último fotograma y se funde con la pieza nueva.
   if(!current||fading)paint(ctx,w,h,kept,aspect,slice,1);
   if(current)paint(ctx,w,h,current,aspect,slice,fading?(now-player.fadeAt)/FADE_MS:1);
  }catch{return false;}
  if(current&&!fading)hold(player,current,now);
  return true;
 }
 function get(id){
  if(!enabled||disposed||!DEVICE_IDS.includes(id))return null;
  wake();
  if(off[id])return {id:'off',kind:'off',title:'',scheduled:true};
  const player=byDevice.get(id);if(!player||queueOwns(id,player))return null;
  const item=track(player);
  return item?{id:item.id||item.stockId,title:item.title||'',url:item.url,kind:item.kind==='image'?'image':'video',playlistId:player.id,scheduled:true}:null;
 }
 return {
  draw,get,
  get enabled(){return enabled;},
  set(value){enabled=value!==false;try{store?.setItem(SCENE_PLAYLISTS_KEY,JSON.stringify({enabled}));}catch{}if(!enabled){sleep();for(const player of [...players.values()])drop(player);byDevice.clear();}return enabled;},
  state:()=>({enabled,awake,revision:state?.revision??null,mode:mode(),groups:[...players.values()].map(player=>{const value=player.sequence.state(),item=track(player);return {playlistId:player.id,devices:[...player.devices],index:value.index,total:player.tracks.length,title:item?.title||'',kind:item?.kind==='image'?'image':'video',playing:value.playing,error:value.error};}),off:Object.keys(off).filter(id=>off[id])}),
  rest:sleep,
  dispose(){if(disposed)return;sleep();disposed=true;for(const player of [...players.values()])drop(player);byDevice.clear();images.clear();}
 };
}

// Montaje: las tres escenas ya pintan cada pantalla con XpaceScreenMedia.draw; la programación entra por debajo de
// las vistas previas (que siguen mandando) y por delante del menú ilustrativo.
if(typeof window!=='undefined'&&window.XpaceScreenMedia?.setSchedule&&!window.XpaceScenePlaylists){
 const runtime=createScenePlaylists({win:window});
 window.XpaceScenePlaylists=runtime;window.XpaceScreenMedia.setSchedule({draw:runtime.draw,get:runtime.get});
 window.addEventListener('pagehide',()=>runtime.rest());
}
