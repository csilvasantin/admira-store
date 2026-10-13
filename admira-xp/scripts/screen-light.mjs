// Pantallas vivas · Matrix (Neo, 13-oct-2026). Cada pantalla mapeada emite la luz de su contenido sobre la sala,
// funde entre piezas y cuenta qué emite. Sólo lee los <video> y el estado de reproducción del gemelo:
// no cambia playlists, relojes, mapeo ni estado MCP. Guía: admira-xp/docs/pantallas-vivas.md
export const SCREEN_LIGHT_KEY='xpaceos.matrix.screen-light.v1';
export const SCREEN_LIGHT_DEFAULTS=Object.freeze({light:true,onAir:false});
export function readScreenLight(storage){
 try{const v=JSON.parse(storage?.getItem(SCREEN_LIGHT_KEY)||'null');return {light:v?.light!==false,onAir:v?.onAir===true};}catch{return {...SCREEN_LIGHT_DEFAULTS};}
}
export function writeScreenLight(storage,value){
 const next={light:value?.light!==false,onAir:value?.onAir===true};
 try{storage?.setItem(SCREEN_LIGHT_KEY,JSON.stringify(next));}catch{}
 return next;
}

// Derrame por tipo de superficie, en fracción del tamaño de la pantalla: la pared recibe luz ancha; TPV e iPad, un cerco.
export const HALO=Object.freeze({wall:{x:.62,y:.4,blur:44,gain:.72},tpv:{x:.22,y:.15,blur:26,gain:.45},ipad:{x:.15,y:.18,blur:58,gain:.42}});
export const deviceKind=id=>/ipad/.test(id)?'ipad':/tpv/.test(id)?'tpv':'wall';
export const IMAGE_SECONDS=30;

export const clock=seconds=>{if(!Number.isFinite(seconds)||seconds<0)return '';const n=Math.floor(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
// [1,2,3,5] → «1–3, 5»
export function screenRange(numbers){
 const list=[...new Set(numbers)].filter(Number.isFinite).sort((a,b)=>a-b),out=[];
 for(let i=0;i<list.length;i++){let j=i;while(list[j+1]===list[j]+1)j++;out.push(j>i?list[i]+'–'+list[j]:String(list[i]));i=j;}
 return out.join(', ');
}
// Punto dentro de un cuadrilátero convexo (cualquier sentido de giro), en píxeles de la escena.
export function pointInQuad(point,quad){
 if(!point||!Array.isArray(quad)||quad.length!==4||quad.some(p=>!p))return false;
 let sign=0;
 for(let i=0;i<4;i++){const a=quad[i],b=quad[(i+1)%4],cross=(b.x-a.x)*(point.y-a.y)-(b.y-a.y)*(point.x-a.x);if(Math.abs(cross)<1e-9)continue;if(sign&&Math.sign(cross)!==sign)return false;sign=Math.sign(cross);}
 return sign!==0;
}
export function quadBounds(quads){
 const points=quads.filter(Boolean).flat().filter(Boolean);if(!points.length)return null;
 return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
}
// Trozo del fotograma que una pantalla enseña cuando un vídeo se reparte entre varias (anchura y desplazamiento en %).
export function visibleSlice(width='100%',left='0%'){
 const w=Math.max(100,parseFloat(width)||100),l=Math.min(0,parseFloat(left)||0);
 return {x:Math.min(1-100/w,Math.max(0,-l/w)),width:100/w};
}
// Encuadre de un grupo de pantallas: centro de sus esquinas y un campo de visión que las deja respirar.
export function focusTarget(corners,aspect=16/9){
 const list=(corners||[]).filter(c=>c&&Number.isFinite(c.yaw)&&Number.isFinite(c.pitch));if(!list.length)return null;
 const first=list[0].yaw,yaws=list.map(c=>first+(((c.yaw-first+540)%360)-180)),pitches=list.map(c=>c.pitch);
 const spanYaw=Math.max(...yaws)-Math.min(...yaws),spanPitch=Math.max(...pitches)-Math.min(...pitches);
 const yaw=(Math.max(...yaws)+Math.min(...yaws))/2,pitch=(Math.max(...pitches)+Math.min(...pitches))/2;
 return {yaw:((yaw+540)%360)-180,pitch,fov:Math.max(30,Math.min(75,Math.max(spanPitch*1.9,spanYaw/Math.max(.5,aspect)*1.7)))};
}

// Qué se emite ahora, agrupado por reloj compartido y por zona física (pared, TPV, iPad).
// `buckets` es runtime.nowPlaying(ids); `playlist(pid)` devuelve {title,tracks}; `preview(id)` la pieza en vista previa.
// `overlay(id)` dice si otra capa ocupa esa pantalla: {type:'incident'|'app'|'reaction',title}.
export function onAirGroups({buckets=[],playlist=()=>null,preview=()=>null,number=()=>null,overlay=()=>null,off=[],ia=null,t=es=>es}={}){
 const label=ids=>{const kind=deviceKind(ids[0]);if(kind==='ipad')return 'iPad';if(kind==='tpv')return 'TPV';const n=ids.map(number).filter(Number.isFinite);return (n.length===1?t('Pantalla ','Screen '):t('Pantallas ','Screens '))+screenRange(n);};
 const groups=[],covers=new Map();
 for(const bucket of buckets){
  const source=playlist(bucket.playlistId)||{title:'',tracks:[]},tracks=source.tracks||[];
  for(const kind of ['wall','tpv','ipad']){
   const zone=(bucket.deviceIds||[]).filter(id=>deviceKind(id)===kind),ids=zone.filter(id=>!covers.has(id)&&!overlay(id));
   for(const id of zone){const top=!covers.has(id)&&overlay(id);if(top)covers.set(id,top);}
   if(!ids.length)continue;
   const track=bucket.preview?preview(ids[0])||{}:tracks.find(x=>(x.id||x.stockId)===bucket.trackId)||tracks[bucket.index]||null;
   const index=bucket.preview?-1:tracks.indexOf(track),total=bucket.preview?0:tracks.length,stock=track?.stockNumber??track?.num;
   const last=bucket.loop===false&&index===total-1,next=total>1&&index>=0&&!last?tracks[(index+1)%total]:null;
   groups.push({key:(bucket.preview?'preview':bucket.playlistId)+':'+kind+':'+ids[0],ids,kind,label:label(ids),leader:ids[0],
    state:bucket.error?'error':!track&&!bucket.preview?'empty':bucket.preview?'preview':bucket.playing?'live':'paused',
    playlistId:bucket.preview?'':bucket.playlistId,playlistTitle:bucket.preview?t('Vista previa','Preview'):source.title||'',
    title:track?.title||track?.name||(bucket.preview?t('Contenido en vista previa','Preview content'):t('Sin contenido','No content')),
    stock:stock===undefined||stock===null||stock===''?'':'#'+stock,index,total,next:next?.title||'',image:(track?.kind||'')==='image'});
  }
 }
 const iaIds=(ia?.ids||[]).filter(id=>!overlay(id));
 if(iaIds.length)groups.push({key:'ia:wall',ids:iaIds,kind:'wall',label:label(iaIds),leader:iaIds[0],state:ia.playing?'live':'paused',playlistId:'sincroIA',playlistTitle:'Sincro IA',
  title:t('Una pieza distinta por pantalla · reloj común','A different clip per screen · shared clock'),stock:'',index:-1,total:ia.count||iaIds.length,next:'',image:false});
 if(ia?.ids)for(const id of ia.ids){const top=overlay(id);if(top)covers.set(id,top);}
 for(const [id,top] of covers)groups.push({key:top.type+':'+id,ids:[id],kind:deviceKind(id),label:label([id]),leader:id,state:top.type,playlistId:'',playlistTitle:{incident:t('Incidencia abierta','Open incident'),app:t('Aplicación interactiva','Interactive app'),reaction:t('Reacción de una regla','Rule reaction')}[top.type]||'',title:top.title||'',stock:'',index:-1,total:0,next:'',image:false});
 for(const id of off)if(!covers.has(id))groups.push({key:'off:'+id,ids:[id],kind:deviceKind(id),label:label([id]),leader:id,state:'off',playlistId:'',playlistTitle:'',title:t('Apagada · incidencia abierta','Off · open incident'),stock:'',index:-1,total:0,next:'',image:false});
 const order={wall:0,tpv:1,ipad:2},first=g=>Math.min(...g.ids.map(number).filter(Number.isFinite),99);
 return groups.sort((a,b)=>order[a.kind]-order[b.kind]||first(a)-first(b));
}
// Una pieza «llega» cuando cambia sin ser el avance natural de la playlist: vista previa, salto, playlist nueva o aviso MCP.
export function isArrival(before,after){
 if(!before||!after||['off','empty','error','incident','app'].includes(after.state))return false;
 if(before.title===after.title&&before.state===after.state&&before.playlistId===after.playlistId)return false;
 if(before.state!==after.state)return ['preview','reaction'].includes(after.state)||['preview','off','incident'].includes(before.state);
 if(before.playlistId!==after.playlistId)return true;
 return !(after.total>0&&after.index===(before.index+1)%after.total);
}
// Coloca cada ficha bajo su zona; si no cabe o pisa otra, encima. Devuelve posiciones en píxeles de la escena.
export function placeCards(items,viewport,{gap=12,margin=8}={}){
 const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v)),placed=[];
 const hit=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
 for(const item of items){
  if(!item.bounds)continue;
  const centre=(item.bounds.left+item.bounds.right)/2,x=clamp(centre-item.width/2,margin,viewport.width-item.width-margin);
  const fits=y=>y>=margin&&y+item.height<=viewport.height-margin;
  const at={below:item.bounds.bottom+gap,above:item.bounds.top-gap-item.height},blocker=y=>placed.find(p=>hit(p,{x,y,width:item.width,height:item.height}));
  const options=(item.prefer==='above'?['above','below']:['below','above']).map(side=>({y:at[side],side})).filter(o=>fits(o.y));
  let pick=options.find(o=>!blocker(o.y));
  // Sin hueco libre: se apila pegada a la ficha que estorba, alejándose de su zona.
  if(!pick){
   const starts=options.length?options:[{y:at.below,side:'below'}];
   const walk=start=>{let y=start.y;for(let n=0,b;n<=placed.length&&(b=blocker(y));n++)y=start.side==='above'?b.y-item.height-6:b.y+b.height+6;return fits(y)&&!blocker(y)?{y,side:start.side}:null;};
   pick=starts.map(walk).find(Boolean)||{y:clamp(starts[0].y,margin,viewport.height-item.height-margin),side:starts[0].side};
  }
  placed.push({key:item.key,x,y:pick.y,width:item.width,height:item.height,side:pick.side,caret:clamp(centre-x,14,item.width-14)});
 }
 return placed;
}

const STATE_COPY={live:['En emisión','On air'],paused:['En pausa','Paused'],preview:['Vista previa','Preview'],error:['Sin señal','No signal'],empty:['Sin contenido','No content'],off:['Apagada','Off'],incident:['Incidencia','Incident'],app:['App en pantalla','App on screen'],reaction:['Reacción','Reaction']};

export function mountScreenLight({surface,layer,nodes,previews,groups=()=>[],music=()=>null,focus=()=>{},camera=null,busy=()=>false,buttons=[],t=es=>es,win=globalThis,storage}={}){
 const doc=surface.ownerDocument,store=storage===undefined?win.localStorage:storage,controls=new AbortController(),options={signal:controls.signal};
 const reduced=()=>!!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const el=(tag,name)=>{const node=doc.createElement(tag);node.className=name;return node;};
 let prefs=readScreenLight(store),disposed=false,frame=0,lastCards=0,pointer=null,hover='',focused=null,returnTo=null,musicPoint=null,seen=new Map(),snapshot=[];
 const devices=new Map(),cards=new Map(),toast=new Map(),posters=new Map();
 const haloLayer=el('div','matrix-halo-layer');haloLayer.setAttribute('aria-hidden','true');layer.before(haloLayer);
 // data-i18n-live: la ficha cambia varias veces por segundo y lleva su propio idioma; el traductor no debe recorrerla.
 const cardLayer=el('div','matrix-onair-layer');cardLayer.dataset.i18nLive='';cardLayer.setAttribute('aria-live','off');surface.append(cardLayer);

 function device(id){
  let d=devices.get(id);if(d)return d;
  const kind=deviceKind(id),spec=HALO[kind],halo=el('div','matrix-halo'),light=el('div','matrix-halo-light'),lightCanvas=doc.createElement('canvas'),ring=el('div','matrix-halo-ring'),freeze=el('canvas','matrix-screen-freeze');
  halo.dataset.kind=kind;halo.dataset.deviceId=id;halo.hidden=true;[lightCanvas.width,lightCanvas.height]=kind==='ipad'?[24,18]:[18,32];
  // El desenfoque va en el envoltorio: la marca blanca y el lienzo 8-bit del gemelo fijan filter e image-rendering en todo <canvas>.
  light.append(lightCanvas);
  for(const [key,value] of Object.entries({'--halo-x':spec.x,'--halo-y':spec.y,'--halo-blur':spec.blur+'px','--halo-gain':spec.gain}))halo.style.setProperty(key,value);
  halo.append(light,ring);haloLayer.append(halo);freeze.width=216;freeze.height=384;
  d={id,kind,halo,light,lightCanvas,ring,freeze,lightContext:lightCanvas.getContext('2d'),freezeContext:freeze.getContext('2d'),media:null,abort:null,quad:null,captured:0,holding:false,timer:0,source:'',sourceAt:0,lastDraw:0};
  devices.set(id,d);return d;
 }
 function release(d,instant=false){
  if(!d.holding)return;d.holding=false;win.clearTimeout(d.timer);d.captured=0;
  d.freeze.classList.remove('is-holding');d.freeze.classList.toggle('is-fading',!instant);
 }
 // El secuenciador corta en seco (pause → src → load). Aquí se retiene el último fotograma y se funde con la pieza nueva.
 function hold(d){
  const node=nodes.get(d.id),media=d.media;
  if(!prefs.light||reduced()||!media?.isConnected)return;
  if(d.captured&&win.performance.now()-d.captured<1500&&!node?.classList.contains('device-off')){
   Object.assign(d.freeze.style,{width:media.style.width||'100%',left:media.style.left||'0%',objectFit:media.style.objectFit||''});
   d.freeze.classList.remove('is-fading');d.freeze.classList.add('is-holding');d.holding=true;
   win.clearTimeout(d.timer);d.timer=win.setTimeout(()=>release(d),4000);
   // Una imagen llega como «poster»: no habrá evento «playing» que suelte el fotograma retenido.
   if(!media.getAttribute('src')&&media.poster){const image=new win.Image();image.onload=image.onerror=()=>release(d);image.src=media.poster;}
  }
  d.halo.classList.remove('is-pulse');void d.halo.offsetWidth;d.halo.classList.add('is-pulse');
 }
 function bind(d,media){
  d.abort?.abort();d.abort=null;release(d,true);d.media=media||null;d.captured=0;d.freeze.remove();
  if(media?.tagName!=='VIDEO')return;
  d.abort=new AbortController();const o={signal:d.abort.signal};
  media.after(d.freeze);
  media.addEventListener('emptied',()=>hold(d),o);
  media.addEventListener('playing',()=>release(d),o);
  media.addEventListener('error',()=>release(d,true),o);
 }
 const drawable=node=>!!node&&(node.tagName==='VIDEO'?node.readyState>=2&&node.videoWidth>0:node.tagName==='IMG'?node.complete&&node.naturalWidth>0:false);
 function poster(url){let image=posters.get(url);if(!image){image=new win.Image();image.decoding='async';image.src=url;posters.set(url,image);if(posters.size>24)posters.delete(posters.keys().next().value);}return image.complete&&image.naturalWidth?image:null;}
 // De dónde sale la luz: lo que de verdad se ve en la pantalla, de arriba abajo.
 function lightSource(d,node){
  if(!node||node.hidden||node.classList.contains('device-off'))return null;
  const reaction=node.querySelector('.retail-reaction-media');if(drawable(reaction))return {image:reaction,key:'reaction'};
  const chip=node.querySelector('.matrix-incident-chip,.matrix-pos-checkout');if(chip)return {color:win.getComputedStyle(chip).backgroundColor,key:'overlay'};
  const app=node.querySelector('iframe');if(app){const color=win.getComputedStyle(app).backgroundColor;return /rgba?\(0, 0, 0(, 0)?\)|transparent/.test(color)?null:{color,key:'app'};}
  const media=d.media;if(!media)return null;
  if(drawable(media))return {image:media,key:media.currentSrc||media.src||'',slice:visibleSlice(media.style.width,media.style.left),video:media.tagName==='VIDEO'};
  if(media.tagName==='VIDEO'&&!media.getAttribute('src')&&media.poster){const image=poster(media.poster);return image?{image,key:media.poster,slice:visibleSlice(media.style.width,media.style.left)}:null;}
  return null;
 }
 function paint(d,now){
  const node=nodes.get(d.id),media=previews.get(d.id)||null;
  if(media!==d.media)bind(d,media);
  const source=prefs.light?lightSource(d,node):null;
  d.halo.classList.toggle('is-lit',!!source);
  const key=(source?.key||'');if(key!==d.source){d.source=key;d.sourceAt=now;}
  if(!source)return;
  const ending=source.video&&Number.isFinite(media.duration)&&media.duration-media.currentTime<.6;
  if(now-d.lastDraw<(reduced()?1500:ending?0:110))return;d.lastDraw=now;
  const {lightContext:lc,lightCanvas:light}=d;
  try{
   if(source.color){lc.fillStyle=source.color;lc.fillRect(0,0,light.width,light.height);return;}
   const w=source.image.videoWidth||source.image.naturalWidth,h=source.image.videoHeight||source.image.naturalHeight,slice=source.slice||{x:0,width:1};
   lc.drawImage(source.image,w*slice.x,0,w*slice.width,h,0,0,light.width,light.height);
   if(source.video&&!d.holding&&!media.paused){
    const width=Math.max(64,Math.min(512,Math.round(384*w/h)));if(d.freeze.width!==width)d.freeze.width=width;
    d.freezeContext.drawImage(media,0,0,d.freeze.width,d.freeze.height);d.captured=now;
   }
  }catch{}
 }

 function card(key){
  let c=cards.get(key);if(c)return c;
  const node=el('div','matrix-onair-card');
  node.innerHTML='<div class="onair-kicker"><i></i><span></span><b></b></div><strong class="onair-title"></strong><div class="onair-meta"></div><div class="onair-progress"><div class="onair-bar"><i></i></div><span class="onair-time"></span></div><div class="onair-next"></div>';
  cardLayer.append(node);
  c={node,parts:{state:node.querySelector('.onair-kicker span'),label:node.querySelector('.onair-kicker b'),title:node.querySelector('.onair-title'),meta:node.querySelector('.onair-meta'),progress:node.querySelector('.onair-progress'),bar:node.querySelector('.onair-bar i'),time:node.querySelector('.onair-time'),next:node.querySelector('.onair-next')},text:{},size:null};
  cards.set(key,c);return c;
 }
 const write=(c,part,value,resize=true)=>{if(c.text[part]===value)return;const shown=!!c.text[part];c.text[part]=value;c.parts[part].textContent=value;c.parts[part].hidden=!value;if(resize||shown!==!!value)c.size=null;};
 const show=(c,part,visible)=>{if(c.parts[part].hidden===!visible)return;c.parts[part].hidden=!visible;c.size=null;};
 function progress(group,now){
  const d=devices.get(group.leader),media=d?.media;
  if(group.image&&d)return {ratio:Math.min(1,(now-d.sourceAt)/(IMAGE_SECONDS*1000)),text:t('Imagen · ','Image · ')+IMAGE_SECONDS+' s'};
  if(media?.tagName==='VIDEO'&&Number.isFinite(media.duration)&&media.duration>0)return {ratio:Math.min(1,media.currentTime/media.duration),text:clock(media.currentTime)+' / '+clock(media.duration)};
  return null;
 }
 function renderCards(now){
  let list=[];try{list=groups()||[];}catch{list=[];}
  snapshot=list;
  const quiet=busy(),hovered=list.find(g=>g.ids.includes(hover));
  // Llegadas: la ficha aparece sola unos segundos cuando una pieza entra fuera del orden de la playlist.
  const next=new Map();
  for(const g of list)for(const id of g.ids){const before=seen.get(id);next.set(id,g);if(prefs.light&&!quiet&&isArrival(before,g))toast.set(g.key,now+4500);}
  seen=next;
  for(const [key,until] of toast)if(until<now||!list.some(g=>g.key===key))toast.delete(key);
  const visible=quiet?[]:list.filter(g=>prefs.onAir||g===hovered||toast.has(g.key));
  const tune=prefs.onAir&&!quiet?music():null,near=!quiet&&pointer&&musicPoint&&Math.hypot(pointer.x-musicPoint.x,pointer.y-musicPoint.y)<34?music():null,sound=musicPoint?(tune||near):null;
  const items=[];
  for(const g of visible){
   const bounds=quadBounds(g.ids.map(id=>devices.get(id)?.quad));if(!bounds)continue;
   const c=card(g.key),p=['live','paused','preview'].includes(g.state)?progress(g,now):null;
   c.node.dataset.state=g.state;c.node.dataset.kind=g.kind;
   write(c,'state',t(...STATE_COPY[g.state]));write(c,'label',g.label);write(c,'title',g.title);
   write(c,'meta',[g.playlistTitle,g.total>0&&g.index>=0?(g.index+1)+'/'+g.total:g.playlistId==='sincroIA'?g.total+' '+t('piezas','clips'):'',g.stock].filter(Boolean).join(' · '));
   write(c,'time',p?.text||'',false);show(c,'progress',!!p);if(p)c.parts.bar.style.transform='scaleX('+p.ratio.toFixed(4)+')';
   write(c,'next',g.next?t('Siguiente · ','Next · ')+g.next:'');
   items.push({key:g.key,bounds,c,prefer:g.kind==='wall'?'above':'below'});
  }
  if(sound){
   const c=card('music');c.node.dataset.state=sound.state==='live'?'live':'paused';c.node.dataset.kind='music';
   write(c,'state',t('Hilo musical','Background music'));write(c,'label','♪');write(c,'title',sound.title||t('Sin pista musical','No music track'));
   write(c,'meta',[{live:t('Sonando','Playing'),muted:t('Silenciado · la playlist continúa','Muted · playlist continues'),suppressed:t('Aviso activo · música en pausa','Announcement active · music paused'),idle:t('Pulsa el altavoz para escuchar','Click the speaker to listen')}[sound.state]||'',sound.count?sound.count+' '+(sound.count===1?t('pieza','track'):t('piezas','tracks')):''].filter(Boolean).join(' · '));
   write(c,'time','',false);show(c,'progress',false);write(c,'next','');
   items.push({key:'music',bounds:{left:musicPoint.x-20,right:musicPoint.x+20,top:musicPoint.y-24,bottom:musicPoint.y+24},c});
  }
  for(const item of items){if(!item.c.size)item.c.size={width:item.c.node.offsetWidth,height:item.c.node.offsetHeight};Object.assign(item,item.c.size);}
  const placed=new Map(placeCards(items,{width:surface.clientWidth,height:surface.clientHeight}).map(p=>[p.key,p]));
  for(const [key,c] of cards){
   const p=placed.get(key);c.node.classList.toggle('is-visible',!!p);
   if(p){c.node.style.transform='translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px)';c.node.dataset.side=p.side;c.node.style.setProperty('--caret',Math.round(p.caret)+'px');}
   else if(!list.some(g=>g.key===key)&&key!=='music'){c.node.remove();cards.delete(key);}
  }
  const lit=new Set(quiet?[]:(hovered?.ids||[]));
  for(const d of devices.values())d.halo.classList.toggle('is-hover',lit.has(d.id));
 }
 function hit(){if(!pointer||busy())return '';for(const d of devices.values())if(!d.halo.hidden&&pointInQuad(pointer,d.quad))return d.id;return '';}
 function tick(now){
  if(disposed)return;frame=win.requestAnimationFrame(tick);
  if(doc.hidden)return;
  for(const id of nodes.keys())if(nodes.get(id)?.dataset.deviceId)device(id);
  for(const [id,d] of devices){if(!nodes.has(id)){bind(d,null);d.halo.remove();devices.delete(id);continue;}paint(d,now);}
  const over=hit();
  if(over!==hover||now-lastCards>180){hover=over;lastCards=now;renderCards(now);}
 }
 const track=e=>{const r=surface.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};};
 surface.addEventListener('pointermove',track,options);
 surface.addEventListener('pointerdown',track,options);
 // Con el dedo no hay «pasar por encima»: el toque deja la ficha unos segundos.
 let touchTimer=0;
 surface.addEventListener('pointerleave',e=>{win.clearTimeout(touchTimer);if(e.pointerType==='touch')touchTimer=win.setTimeout(()=>{pointer=null;},4000);else pointer=null;},options);
 // Doble clic: la cámara entra en esa pantalla (o en las que se reparten un mismo vídeo); otro doble clic la devuelve a donde estaba.
 surface.addEventListener('dblclick',e=>{
  if(busy()||!camera||e.target.closest?.('button,a,input,select,textarea,iframe,.matrix-wall-avatar,.matrix-mapped-player'))return;
  track(e);const id=hit(),own=devices.get(id),span=own?.media?.dataset?.screenGroup||'',ids=!id?[]:span.includes('-')?[...devices.values()].filter(d=>d.kind===own.kind&&d.media?.dataset?.screenGroup===span).map(d=>d.id):[id];
  if(ids.length&&focused!==ids.join()){if(!focused)returnTo=camera.get();focused=ids.join();void focus(ids);}
  else if(focused){const back=returnTo;focused=null;returnTo=null;if(back)void camera.look(back,{ms:800});}
 },options);

 function apply(){
  surface.classList.toggle('screen-light',prefs.light);haloLayer.hidden=!prefs.light;
  if(!prefs.light)for(const d of devices.values()){release(d,true);d.halo.classList.remove('is-pulse');}
  for(const button of buttons){const on=prefs[button.dataset.screenLight==='onair'?'onAir':'light'];button.setAttribute('aria-pressed',String(on));}
  lastCards=0;
 }
 for(const button of buttons)button.addEventListener('click',()=>{const key=button.dataset.screenLight==='onair'?'onAir':'light';api.set({[key]:!prefs[key]});},options);
 const api={
  // matrix-panorama.mjs coloca cada halo con la misma homografía que su pantalla.
  place(id,matrix,quad){const d=devices.get(id)||(nodes.get(id)?.dataset.deviceId?device(id):null);if(!d)return;const node=nodes.get(id);d.quad=matrix?quad:null;d.halo.hidden=!matrix;if(!matrix)return;d.halo.style.width=node.style.width;d.halo.style.height=node.style.height;d.halo.style.transform='matrix3d('+matrix.join(',')+')';},
  anchor(name,point){if(name==='music')musicPoint=point||null;},
  state:()=>({...prefs,hover,focused,groups:snapshot.map(g=>({...g}))}),
  set(value={}){prefs=writeScreenLight(store,{...prefs,...value});apply();return {...prefs};},
  dispose(){if(disposed)return;disposed=true;win.cancelAnimationFrame(frame);win.clearTimeout(touchTimer);controls.abort();for(const d of devices.values()){d.abort?.abort();win.clearTimeout(d.timer);d.freeze.remove();}devices.clear();cards.clear();posters.clear();haloLayer.remove();cardLayer.remove();surface.classList.remove('screen-light');}
 };
 apply();frame=win.requestAnimationFrame(tick);
 return api;
}
