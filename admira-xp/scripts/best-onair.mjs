// Fichas «En emisión» de Best · Hiperreal (Neo, 13-oct-2026). Al pasar por una pantalla de la sala cuenta qué emite,
// de dónde sale (vista previa, Good, canal por etiqueta o parrilla de la casa) y con qué etiqueta se le dirige
// contenido. /emision las deja fijas y /emision luz enciende o apaga la luz que las pantallas echan sobre la sala.
// Sólo lee: no cambia players, pines ni vistas previas. Guía: admira-xp/docs/hiperreal-vivo.md
import {placeCards,clock} from './screen-light.mjs?v=pantallas-vivas-1';

export const BEST_SCREENS_KEY='xpaceos.best.screens.v1';
export const IMAGE_SECONDS=30;
export function readBestScreens(storage){
 try{const value=JSON.parse(storage?.getItem(BEST_SCREENS_KEY)||'null');return {onAir:value?.onAir===true,light:value?.light!==false};}catch{return {onAir:false,light:true};}
}
const STATE_COPY={live:['En emisión','On air'],paused:['En pausa','Paused'],preview:['Vista previa','Preview'],error:['Sin señal','No signal'],empty:['Sin contenido','No content'],off:['Apagada','Off'],rest:['En reposo','At rest']};
const SOURCE_COPY={good:['Lo que emite Good','What Good is playing'],tag:['Canal por etiqueta','Tagged channel'],house:['Parrilla de la casa','House schedule']};

// Qué contar de una pantalla. `preview` es la pieza en vista previa, `info` lo que dice xtanco-players.mjs y `lit`
// si ahora mismo se ve algo en ella (por ejemplo, el reposo del tótem).
export function describeScreen({name='',preview=null,web=null,info=null,lit=false,t=es=>es}={}){
 const label=info?.name||name,tag=info?.tag||'';
 // Una web fijada en Good (quiosco de pedido, canal admira.tv): se enseña en la sala y se toca aparte.
 if(web&&!preview)return {state:'live',label,tag,title:web.title||t('Web interactiva','Interactive page'),meta:t('Lo que emite Good · web','What Good is playing · web'),next:t('Doble clic para tocarla','Double-click to touch it'),media:null,image:false,web:true};
 if(preview)return {state:'preview',label,tag,title:preview.title||t('Contenido en vista previa','Preview content'),meta:t('Sólo en este navegador','This browser only'),next:'',media:null,image:preview.kind==='image'};
 if(info&&['live','paused','error'].includes(info.state)){
  const source=SOURCE_COPY[info.source];
  return {state:info.state,label,tag,title:info.title||t('Sin título','Untitled'),next:info.next||'',media:info.media||null,image:info.kind==='image',
   meta:[source?t(...source):'',info.total>1&&info.index>=0?(info.index+1)+'/'+info.total:'',info.stock].filter(Boolean).join(' · ')};
 }
 const paused=info?.state==='off';
 if(lit)return {state:'rest',label,tag,title:t('Pantalla en reposo','Screen at rest'),meta:paused?t('Players en pausa · /emision escena on','Players paused · /onair scene on'):'',next:'',media:null,image:true};
 return {state:paused?'off':'empty',label,tag,title:paused?t('Players en pausa','Players paused'):t('Sin contenido','No content'),meta:paused?t('/emision escena on los enciende','/onair scene on turns them on'):'',next:'',media:null,image:true};
}

export function mountBestOnAir({stage,furniture,players=null,web=()=>null,media=()=>globalThis.XpaceScreenMedia,busy=()=>false,win=globalThis,storage,lang=()=>stage.ownerDocument.documentElement?.lang==='en'?'en':'es'}={}){
 if(!stage||!furniture)throw Error('Falta la escena o el mobiliario');
 const doc=stage.ownerDocument,store=storage===undefined?win.localStorage:storage,controls=new AbortController(),options={signal:controls.signal};
 const t=(es,en)=>lang()==='en'?en:es;
 let prefs=readBestScreens(store),disposed=false,frame=0,last=-Infinity,pointer=null,hover='',touchTimer=0,snapshot=[];
 const cards=new Map(),since=new Map();
 // data-i18n-live: la ficha cambia varias veces por segundo y lleva su propio idioma.
 const layer=doc.createElement('div');layer.className='best-onair-layer';layer.dataset.i18nLive='';layer.setAttribute('aria-live','off');stage.append(layer);

 function card(key){
  let c=cards.get(key);if(c)return c;
  const node=doc.createElement('div');node.className='matrix-onair-card';
  node.innerHTML='<div class="onair-kicker"><i></i><span></span><b></b></div><strong class="onair-title"></strong><div class="onair-meta"></div><div class="onair-progress"><div class="onair-bar"><i></i></div><span class="onair-time"></span></div><div class="onair-next"></div>';
  layer.append(node);
  c={node,parts:{state:node.querySelector('.onair-kicker span'),label:node.querySelector('.onair-kicker b'),title:node.querySelector('.onair-title'),meta:node.querySelector('.onair-meta'),progress:node.querySelector('.onair-progress'),bar:node.querySelector('.onair-bar i'),time:node.querySelector('.onair-time'),next:node.querySelector('.onair-next')},text:{},size:null};
  cards.set(key,c);return c;
 }
 const write=(c,part,value,resize=true)=>{if(c.text[part]===value)return;const shown=!!c.text[part];c.text[part]=value;c.parts[part].textContent=value;c.parts[part].hidden=!value;if(resize||shown!==!!value)c.size=null;};
 const show=(c,part,visible)=>{if(c.parts[part].hidden===!visible)return;c.parts[part].hidden=!visible;c.size=null;};
 function progress(id,model,now){
  const node=model.media;
  if(node?.tagName==='VIDEO'&&Number.isFinite(node.duration)&&node.duration>0)return {ratio:Math.min(1,node.currentTime/node.duration),text:clock(node.currentTime)+' / '+clock(node.duration)};
  if(model.image&&model.state==='live')return {ratio:Math.min(1,(now-(since.get(id)?.at||now))/(IMAGE_SECONDS*1000)),text:t('Imagen · ','Image · ')+IMAGE_SECONDS+' s'};
  return null;
 }
 function render(now){
  const room=stage.getBoundingClientRect(),quiet=!!busy(),api=media(),byId=new Map();
  // Un mismo player puede tener más de una pantalla en escena (dos tótems): una ficha, con todas sus zonas.
  for(const screen of furniture.screens()){const group=byId.get(screen.id)||{...screen,rects:[]};const rect=screen.canvas.getBoundingClientRect();if(rect.width>1&&rect.height>1)group.rects.push(rect);group.lit=group.lit||screen.lit;byId.set(screen.id,group);}
  try{players?.retain([...byId.keys()]);}catch{}
  const models=[],items=[];
  for(const [id,screen] of byId){
   let preview=null,info=null,page=null;
   try{preview=api?.previewed?.(id)?api.get(id):null;}catch{}
   try{info=players?.info(id,lang(),screen.item)||null;}catch{}
   try{page=screen.web?web(id)||null:null;}catch{}
   const model={id,...describeScreen({name:screen.label,preview,web:page,info,lit:screen.lit,t})};
   const key=model.state+'|'+model.title;if(since.get(id)?.key!==key)since.set(id,{key,at:now});
   models.push(model);
   if(quiet||!screen.rects.length||!(prefs.onAir||id===hover))continue;
   const c=card(id),p=progress(id,model,now);
   c.node.dataset.state=model.state==='rest'?'paused':model.state;c.node.dataset.kind='best';
   write(c,'state',t(...STATE_COPY[model.state]));write(c,'label',model.label);write(c,'title',model.title);write(c,'meta',model.meta);
   write(c,'time',p?.text||'',false);show(c,'progress',!!p);if(p)c.parts.bar.style.transform='scaleX('+p.ratio.toFixed(4)+')';
   write(c,'next',[model.tag?t('Etiqueta ','Tag ')+model.tag:'',model.next?(model.web?'':t('Siguiente · ','Next · '))+model.next:''].filter(Boolean).join(' · '));
   if(!c.size)c.size={width:c.node.offsetWidth,height:c.node.offsetHeight};
   items.push({key:id,...c.size,prefer:'above',bounds:{left:Math.min(...screen.rects.map(r=>r.left))-room.left,right:Math.max(...screen.rects.map(r=>r.right))-room.left,top:Math.min(...screen.rects.map(r=>r.top))-room.top,bottom:Math.max(...screen.rects.map(r=>r.bottom))-room.top}});
  }
  snapshot=models;
  for(const id of [...since.keys()])if(!byId.has(id))since.delete(id);
  const placed=new Map(placeCards(items,{width:room.width,height:room.height}).map(p=>[p.key,p]));
  for(const [key,c] of cards){
   const p=placed.get(key);c.node.classList.toggle('is-visible',!!p);
   if(p){c.node.style.transform='translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px)';c.node.dataset.side=p.side;c.node.style.setProperty('--caret',Math.round(p.caret)+'px');}
   else if(!byId.has(key)){c.node.remove();cards.delete(key);}
  }
 }
 function tick(now){
  if(disposed)return;frame=win.requestAnimationFrame(tick);
  if(doc.hidden)return;
  let over='';if(pointer&&!busy())try{over=furniture.screenAt(pointer.x,pointer.y)||'';}catch{}
  if(over!==hover||now-last>180){hover=over;last=now;render(now);}
 }
 const track=event=>{pointer={x:event.clientX,y:event.clientY};};
 stage.addEventListener('pointermove',track,options);
 stage.addEventListener('pointerdown',track,options);
 // Con el dedo no hay «pasar por encima»: el toque deja la ficha unos segundos.
 stage.addEventListener('pointerleave',event=>{win.clearTimeout(touchTimer);if(event.pointerType==='touch')touchTimer=win.setTimeout(()=>{pointer=null;},4000);else pointer=null;},options);
 function apply(){stage.classList.toggle('screens-dark',!prefs.light);last=-Infinity;}
 const api={
  light:()=>prefs.light,
  state:()=>({...prefs,hover,screens:snapshot.map(({media:_,...model})=>({...model}))}),
  set(value={}){prefs={onAir:value.onAir===undefined?prefs.onAir:value.onAir===true,light:value.light===undefined?prefs.light:value.light!==false};try{store?.setItem(BEST_SCREENS_KEY,JSON.stringify(prefs));}catch{}apply();return {...prefs};},
  dispose(){if(disposed)return;disposed=true;win.cancelAnimationFrame(frame);win.clearTimeout(touchTimer);controls.abort();cards.clear();since.clear();layer.remove();stage.classList.remove('screens-dark');}
 };
 apply();frame=win.requestAnimationFrame(tick);
 return api;
}
