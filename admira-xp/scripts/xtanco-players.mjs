// Players virtuales del Xtanco en Best · Hiperreal (Neo, 13-oct-2026). Cada pantalla de la sala es un player con su
// etiqueta (XT-GRACIA-…). Qué emite, por orden: 1) lo que Good tenga fijado en esa misma pantalla (sus cuatro
// superficies: pines, canal admira.tv y admira.studio), con el mismo <video>, así el gemelo es uno; 2) el contenido
// del Stock que lleve su etiqueta; 3) la parrilla de la casa en el formato que mejor encaja. Una vista previa
// (XpaceScreenMedia) siempre gana y se resuelve fuera de aquí.
// Sólo lectura: un <video> oculto y mudo por canal en uso; no publica, no guarda y no cambia el Stock ni los pines.
// Guía: admira-xp/docs/hiperreal-vivo.md
import {createPainterPool,sceneTrack,coverRect} from './playlist-painter.mjs?v=hiperreal-vivo-1';

export const XTANCO_PLAYERS_KEY='xpaceos.xtanco-players.v1';
export const XTANCO_STORE_TAG='XT-GRACIA';
export const XTANCO_STOCK_URL='https://stock.admira.store/stock/index.json';
const stock=id=>'https://api.admira.store/stock/asset/'+id;
// Parrilla de la casa: el anuncio «Tu sitio de siempre» en sus cuatro formatos. Cada pantalla toma el más parecido.
export const XTANCO_HOUSE=Object.freeze([
 {format:'9:16',aspect:9/16,id:'1790932601282-l5omzp',stockNumber:1343},
 {format:'4:5',aspect:4/5,id:'1790932896582-vc9x7t',stockNumber:1346},
 {format:'1:1',aspect:1,id:'1790932802558-6pdss9',stockNumber:1345},
 {format:'16:9',aspect:16/9,id:'1790932708532-mq8mlu',stockNumber:1344}
].map(item=>Object.freeze({...item,title:'JTI · Tu sitio de siempre · '+item.format,url:stock(item.id),kind:'video'})));
const SLEEP_MS=2500,REFRESH_MS=60000;
// Las cuatro superficies que Good ya gobierna: mismo identificador y misma etiqueta en todas las vistas.
const FIXED={metahuman:'MH',escaparate:'ESC',ds1:'P1',ds2:'P2'};
export const XTANCO_SHARED_SCREENS=Object.freeze(Object.keys(FIXED));
const BY_TYPE={counter:'TPV',led:'LED',tft:'ESC',metahuman:'MH',manager:'OFICINA',tablet:'TABLET',turnKiosk:'TURNOS',lottery:'LOTERIA'};
const NAMES={MH:['Tótem Metahuman','Metahuman totem'],ESC:['Pantalla de escaparate','Window display'],P1:['Pantalla de pared 1','Wall screen 1'],P2:['Pantalla de pared 2','Wall screen 2'],
 TPV:['TPV del mostrador','Counter POS'],LED:['LED Banner','LED banner'],OFICINA:['Pantalla del escritorio','Desk screen'],TABLET:['Tablet de satisfacción','Feedback tablet'],TURNOS:['Gestor de turnos','Queue kiosk'],LOTERIA:['Terminal de lotería','Lottery terminal']};
const slug=value=>String(value||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,18);

// Etiqueta de un player: la misma que usa Good para las pantallas que ya existían, y una por tipo de mueble para el resto.
export function playerTag(id,item=null){
 const suffix=FIXED[id]||BY_TYPE[item?.type]||slug(item?.label||item?.type||String(id).replace(/^inventory:/,''));
 return XTANCO_STORE_TAG+'-'+(suffix||'PANTALLA');
}
export function playerName(id,item=null,lang='es'){
 const pair=NAMES[playerTag(id,item).slice(XTANCO_STORE_TAG.length+1)];
 return pair?pair[lang==='en'?1:0]:String(item?.label||item?.type||id);
}
export function houseTrack(aspect){
 const target=Number.isFinite(aspect)&&aspect>0?aspect:9/16;
 return [...XTANCO_HOUSE].sort((a,b)=>Math.abs(Math.log(a.aspect/target))-Math.abs(Math.log(b.aspect/target)))[0];
}
const kindOf=item=>{const type=String(item?.type||'').toLowerCase();return ['video','animation'].includes(type)?'video':['image','digital-twin','twin-npc'].includes(type)?'image':null;};
// Contenido del Stock dirigido a una etiqueta: en tags[] o como hashtag en el comentario (misma regla que Good).
export function stockChannel(items,tag){
 const wanted=String(tag||'').toLowerCase();if(!wanted||!Array.isArray(items))return [];
 const seen=new Set(),tracks=[];
 for(const item of items){
  const kind=kindOf(item);if(!kind||!item?.url||item.oculto||!/^[-\w]{1,120}$/.test(String(item.id||''))||seen.has(item.id))continue;
  const tagged=(Array.isArray(item.tags)?item.tags:[]).some(value=>String(value).toLowerCase()===wanted)||String(item.comment||'').toLowerCase().includes(wanted);
  if(!tagged)continue;
  let url;try{url=new URL(item.url);}catch{continue;}
  if(url.protocol!=='https:'||url.username||url.password)continue;
  seen.add(item.id);
  tracks.push({id:String(item.id),title:String(item.title||item.comment||item.prompt||'Contenido').split('\n')[0].slice(0,160),url:sceneTrack({url:url.href}).url,stockNumber:item.num??null,...(kind==='image'?{kind:'image'}:{})});
  if(tracks.length>=100)break;
 }
 return tracks;
}
export function readXtancoPlayers(storage){try{return JSON.parse(storage?.getItem(XTANCO_PLAYERS_KEY)||'null')?.enabled!==false;}catch{return true;}}

const drawable=node=>!!node&&(node.tagName==='VIDEO'?node.readyState>=2&&node.videoWidth>0:node.complete!==false&&node.naturalWidth>0);

export function createXtancoPlayers({win=globalThis,doc=win.document,storage,fetcher=(...args)=>win.fetch(...args),sequencer,stockUrl=XTANCO_STOCK_URL,pinned=id=>win.__xtancoSurfaceMedia?.(id)||null}={}){
 const store=storage===undefined?win.localStorage:storage,clock=()=>win.performance.now(),players=new Map();
 let enabled=readXtancoPlayers(store),awake=false,disposed=false,idle=0,refresh=0,lastUse=0,library=null,loading=false,failed=false;
 const pool=createPainterPool({win,doc,awake:()=>awake,...(sequencer?{sequencer}:{})});
 // Lo que Good tiene fijado en esa pantalla, si es una de las suyas. Manda aunque su vídeo aún esté cargando:
 // entre dos piezas se mantiene el último fotograma en vez de dejar pasar la parrilla de la casa.
 function external(id){
  if(!XTANCO_SHARED_SCREENS.includes(id))return null;
  let pin=null;try{pin=pinned(id);}catch{}
  return pin?.element&&['image','video'].includes(pin.kind)?pin:null;
 }
 // Un player dirigido tiene su propio reloj; los que emiten la parrilla comparten uno por formato.
 function channel(player){
  if(player.external)return null;
  const tagged=library?stockChannel(library,player.tag):[];
  if(tagged.length)return {key:'tag:'+player.tag,source:'tag',tracks:tagged};
  if(player.fallback===false)return null;
  const house=XTANCO_HOUSE.find(item=>item.format===player.format)||houseTrack(player.aspect);
  return {key:'house:'+house.format,source:'house',tracks:[house]};
 }
 function sync(){
  if(disposed)return;
  const used=new Set();
  for(const player of players.values()){
   const next=enabled?channel(player):null;player.channel=next;
   if(!next){player.painter=null;continue;}
   used.add(next.key);
   const painter=pool.get(next.key)||pool.make(next.key,next.tracks,true);painter.update(next.tracks,true);player.painter=painter;
  }
  for(const painter of pool.values())if(!used.has(painter.id))pool.drop(painter);
 }
 async function load(){
  if(loading||disposed)return;loading=true;
  try{const response=await fetcher(stockUrl,{cache:'no-store'});if(!response.ok)throw Error('stock');const data=await response.json();library=Array.isArray(data?.items)?data.items:[];failed=false;}
  catch{failed=true;}
  finally{loading=false;if(!disposed)sync();}
 }
 function sleep(){if(!awake)return;awake=false;win.clearInterval(idle);win.clearInterval(refresh);idle=refresh=0;pool.pause();}
 // Sólo trabaja mientras la vista pinta sus pantallas.
 function wake(){
  lastUse=clock();if(awake||disposed||!enabled)return;awake=true;
  sync();pool.play();void load();
  idle=win.setInterval(()=>{if(clock()-lastUse>SLEEP_MS)sleep();},1000);
  refresh=win.setInterval(()=>{void load();},REFRESH_MS);
 }
 const shape=meta=>Number.isFinite(meta?.aspect)&&meta.aspect>0?meta.aspect:9/16;
 // Un player es una pantalla con un formato de parrilla. Dos pantallas con el mismo identificador (dos tótems,
 // uno fotografiado y otro girado) comparten player si piden el mismo formato; su proporción exacta sólo cuenta al pintar.
 function player(id,meta={},outside=false){
  const aspect=shape(meta),format=houseTrack(aspect).format,key=id+'@'+format;
  let value=players.get(key);
  const item=meta.item||value?.item||null,tag=playerTag(id,item),fallback=meta.fallback!==false;
  if(!value||value.tag!==tag||value.fallback!==fallback||value.external!==outside){value={key,id,aspect,format,tag,fallback,external:outside,item,painter:null,channel:null};players.set(key,value);if(awake)sync();}
  return value;
 }
 const byScreen=id=>{for(const value of players.values())if(value.id===id)return value;return null;};
 function draw(ctx,w,h,id,meta){
  if(disposed||!id)return false;
  const pin=external(id),value=player(id,meta,!!pin),aspect=shape(meta);
  if(pin){
   const node=pin.element;
   try{
    if(!drawable(node)){if(!value.kept)return false;ctx.drawImage(value.kept,0,0,w,h);return true;}
    // Como en Good: la pieza fijada cubre la pantalla entera.
    const sw=node.videoWidth||node.naturalWidth,sh=node.videoHeight||node.naturalHeight,cut=coverRect({sw,sh,aspect});
    ctx.drawImage(node,cut.x,cut.y,cut.w,cut.h,0,0,w,h);
    const now=clock();
    if(now-(value.keptAt||0)>160){
     if(!value.kept){value.kept=doc.createElement('canvas');value.keptContext=value.kept.getContext('2d');}
     if(value.kept.width!==w||value.kept.height!==h){value.kept.width=w;value.kept.height=h;}
     value.keptContext.drawImage(node,cut.x,cut.y,cut.w,cut.h,0,0,w,h);value.keptAt=now;
    }
    return true;
   }catch{return false;}
  }
  if(!enabled)return false;
  wake();
  if(!value.painter)return false;
  return pool.paint(value.painter,ctx,w,h,{aspect});
 }
 // Qué emite un player. Una pantalla que aún no ha pedido imagen (por ejemplo, la que enseña una web) sigue
 // teniendo nombre y etiqueta: `piece` es su mueble.
 function info(id,lang='es',piece=null){
  const value=byScreen(id);
  if(!value)return id?{id,tag:playerTag(id,piece),name:playerName(id,piece,lang),source:null,state:enabled?'empty':'off',title:'',stock:'',kind:'video',index:-1,total:0,next:'',media:null}:null;
  const base={id,tag:value.tag,name:playerName(id,value.item,lang)},pin=external(id);
  if(pin){const node=pin.element,video=node.tagName==='VIDEO';
   return {...base,source:'good',state:!drawable(node)&&!value.kept?'empty':video&&node.paused?'paused':'live',title:String(pin.title||''),stock:'',kind:video?'video':'image',index:-1,total:0,next:'',media:node};}
  const painter=value.painter,state=painter?.sequence.state(),item=painter?.track()||null,total=painter?.tracks.length||0;
  return {...base,source:value.channel?.source||null,
   state:!enabled?'off':!painter?'empty':state.error?'error':state.playing?'live':'paused',
   title:item?.title||'',stock:item?.stockNumber==null?'':'#'+item.stockNumber,kind:item?.kind==='image'?'image':'video',
   index:state?state.index:-1,total,next:total>1?painter.tracks[(state.index+1)%total]?.title||'':'',media:painter?.video||null};
 }
 return {
  draw,info,
  get enabled(){return enabled;},
  set(value){enabled=value!==false;try{store?.setItem(XTANCO_PLAYERS_KEY,JSON.stringify({enabled}));}catch{}if(!enabled){sleep();for(const painter of pool.values())pool.drop(painter);for(const value of players.values())value.painter=value.channel=null;}return enabled;},
  // Deja de atender a las pantallas que ya no están en escena (mueble retirado o girado de espaldas).
  retain(ids){const keep=new Set(ids);let changed=false;for(const [key,value] of [...players])if(!keep.has(value.id)){players.delete(key);changed=true;}if(changed&&awake)sync();},
  state:()=>({enabled,awake,library:library?library.length:null,failed,players:[...players.values()].map(value=>({id:value.id,tag:value.tag,aspect:value.aspect,source:value.external?'good':value.channel?.source||null,channel:value.channel?.key||null,title:value.external?String(external(value.id)?.title||''):value.painter?.track()?.title||''})),channels:pool.values().map(painter=>({key:painter.id,total:painter.tracks.length,...painter.sequence.state()}))}),
  rest:sleep,
  dispose(){if(disposed)return;sleep();disposed=true;pool.dispose();players.clear();}
 };
}
