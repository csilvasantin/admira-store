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
import {createPainterPool,sceneTrack,coverRect,containRect} from './playlist-painter.mjs?v=hiperreal-vivo-1';
export {sceneTrack,coverRect,containRect};

export const SCENE_PLAYLISTS_KEY='xpaceos.scene-playlists.v1';
export const DEVICE_LAYOUT_KEY='xpaceos.starbucks.device-layout.v1';
export const SCENE_SEEDS=Object.freeze({wall:[...DEMO_WALL,...DEMO_CHRISTMAS],tpv:DEMO_TPV,ipad:STARBUCKS_IPAD_PLAYLIST.tracks});
// Proporción física (ancho/alto) de cada pantalla del modelo: las escenas pintan en un lienzo 2:3 (4:3 el iPad)
// que luego se estira sobre la superficie; pintar con esta proporción evita deformar el contenido.
export const SURFACE_ASPECT=Object.freeze({wall:.86/1.1,tpv:.445/.65,ipad:.6/.45});
export const sceneKind=id=>/ipad/.test(id)?'ipad':/tpv/.test(id)?'tpv':'wall';
const SLEEP_MS=2500;

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
export function readScenePlaylists(storage){try{return JSON.parse(storage?.getItem(SCENE_PLAYLISTS_KEY)||'null')?.enabled!==false;}catch{return true;}}

export function createScenePlaylists({win=globalThis,doc=win.document,storage,watch=watchMatrixState,sequencer=createScreenPlaylist,seeds=SCENE_SEEDS,mode=getScreenDisplayMode,number=id=>7-Number(id.slice(-1))}={}){
 const store=storage===undefined?win.localStorage:storage,clock=()=>win.performance.now(),byDevice=new Map();
 let enabled=readScenePlaylists(store),state=null,stopWatch=null,idle=0,lastUse=0,awake=false,disposed=false,off={};
 const pool=createPainterPool({win,doc,sequencer,awake:()=>awake});
 function savedLayout(){try{return JSON.parse(store?.getItem(DEVICE_LAYOUT_KEY)||'null');}catch{return null;}}
 function sync(){
  if(disposed)return;
  off=state?.devicesOff||{};
  const groups=enabled?sceneGroups({layout:sceneLayout(savedLayout(),state),catalog:sceneCatalog(state,seeds),off}):new Map();
  for(const player of pool.values())if(!groups.has(player.id))pool.drop(player);
  byDevice.clear();
  for(const group of groups.values()){
   let player=pool.get(group.id);
   if(!player)player=pool.make(group.id,group.tracks,group.loop);else player.update(group.tracks,group.loop);
   player.devices=group.devices;
   for(const id of group.devices)byDevice.set(id,player);
  }
 }
 function sleep(){
  if(!awake)return;awake=false;win.clearInterval(idle);idle=0;stopWatch?.();stopWatch=null;pool.pause();
 }
 // Sólo trabaja mientras alguna escena pinta: en Matrix, con la pestaña oculta o fuera del Starbucks no consume nada.
 function wake(){
  lastUse=clock();if(awake||disposed||!enabled)return;awake=true;
  sync();pool.play();
  stopWatch=watch({onState:value=>{state=value;sync();}});
  idle=win.setInterval(()=>{if(clock()-lastUse>SLEEP_MS)sleep();},1000);
 }
 // En Matrix el gestor de colas ocupa el iPad mientras su playlist no trae vídeo; aquí se respeta igual.
 const queueOwns=(id,player)=>sceneKind(id)==='ipad'&&player.track()?.kind==='image'&&!!win.XpaceIpadCola?.on?.();
 function draw(ctx,w,h,id){
  if(!enabled||disposed||!DEVICE_IDS.includes(id))return false;
  wake();
  if(off[id]){ctx.save();ctx.fillStyle='#050606';ctx.fillRect(0,0,w,h);ctx.restore();return true;}
  const player=byDevice.get(id);if(!player||queueOwns(id,player))return false;
  const slice=sceneSlice(id,mode(),numbers=>numbers.every(n=>player.devices.some(device=>number(device)===n)));
  return pool.paint(player,ctx,w,h,{aspect:SURFACE_ASPECT[sceneKind(id)],slice});
 }
 function get(id){
  if(!enabled||disposed||!DEVICE_IDS.includes(id))return null;
  wake();
  if(off[id])return {id:'off',kind:'off',title:'',scheduled:true};
  const player=byDevice.get(id);if(!player||queueOwns(id,player))return null;
  const item=player.track();
  return item?{id:item.id||item.stockId,title:item.title||'',url:item.url,kind:item.kind==='image'?'image':'video',playlistId:player.id,scheduled:true}:null;
 }
 return {
  draw,get,
  get enabled(){return enabled;},
  set(value){enabled=value!==false;try{store?.setItem(SCENE_PLAYLISTS_KEY,JSON.stringify({enabled}));}catch{}if(!enabled){sleep();for(const player of pool.values())pool.drop(player);byDevice.clear();}return enabled;},
  state:()=>({enabled,awake,revision:state?.revision??null,mode:mode(),groups:pool.values().map(player=>{const value=player.sequence.state(),item=player.track();return {playlistId:player.id,devices:[...player.devices],index:value.index,total:player.tracks.length,title:item?.title||'',kind:item?.kind==='image'?'image':'video',playing:value.playing,error:value.error};}),off:Object.keys(off).filter(id=>off[id])}),
  rest:sleep,
  dispose(){if(disposed)return;sleep();disposed=true;pool.dispose();byDevice.clear();}
 };
}

// Montaje: las tres escenas ya pintan cada pantalla con XpaceScreenMedia.draw; la programación entra por debajo de
// las vistas previas (que siguen mandando) y por delante del menú ilustrativo.
if(typeof window!=='undefined'&&window.XpaceScreenMedia?.setSchedule&&!window.XpaceScenePlaylists){
 const runtime=createScenePlaylists({win:window});
 window.XpaceScenePlaylists=runtime;window.XpaceScreenMedia.setSchedule({draw:runtime.draw,get:runtime.get});
 window.addEventListener('pagehide',()=>runtime.rest());
}
