/* Experto → PREVIOS (tercera columna del menú inferior, a la derecha del todo).
   Lo que se crea en Crear contenidos (imagen, música/audio, locución, vídeo) se abre aquí,
   el último primero: miniatura o reproductor, título, Lanzar y Ver en Stock.
   Crear nunca emite: Lanzar añade y reproduce en los players virtuales de este Xpacio;
   una locución se emite tres veces sólo al pulsar Emitir. El formulario sigue en el centro.
   Expert → PREVIEWS (third, far-right slot). Newly created media opens here, newest first. */
(function(root){'use strict';
 const KEY='xpaceos.expert-previews.v1',MAX=6,KINDS=['image','video','music','voice'];
 function preview(kind,value){
  if(!KINDS.includes(kind)||!value)return null;const id=String(value.id||'');let u;try{u=new URL(value.url);}catch(_){return null;}
  if(!id||u.username||u.password||u.origin!=='https://api.admira.store'||u.pathname!=='/stock/asset/'+id)return null;
  let cover='';try{const c=new URL(value.thumbnail||value.poster);if(c.protocol==='https:'&&!c.username&&!c.password)cover=c.href;}catch(_){}
  const title=String(value.title||value.prompt||value.text||'').replace(/\s+/g,' ').trim().slice(0,160)||'Stock '+(value.num||id);
  return {kind,id,url:u.href,num:Number(value.num)||null,title,...(cover?{thumbnail:cover}:{}),...(value.language?{language:value.language==='en'?'en':'es'}:{}),at:Number(value.at)||Date.now()};
 }
 function merge(list,item,max=MAX){
  const old=list.find(x=>x.kind===item.kind&&x.id===item.id);
  // media-stock.link() avisa antes con el título genérico «Stock N»; se conserva el título del brief.
  const keep=old&&/^Stock /.test(item.title)&&!/^Stock /.test(old.title)?{...item,title:old.title}:item;
  return [keep,...list.filter(x=>x!==old)].slice(0,max);
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={preview,merge,MAX};
 const doc=root.document;if(!doc||!doc.querySelector)return;
 const t=(es,en)=>doc.documentElement.lang==='en'?en:es;
 const LABEL={image:['IMAGEN','IMAGE'],video:['VÍDEO','VIDEO'],music:['MÚSICA','MUSIC'],voice:['LOCUCIÓN','VOICEOVER']};
 let items=[],section=null,list=null,empty=null,releases=[];const cards=new Map(),notes=new Map(),playing=new Map();
 try{const saved=JSON.parse(root.sessionStorage.getItem(KEY)||'[]');if(Array.isArray(saved))for(const v of saved.reverse()){const p=preview(v?.kind,v);if(p)items=merge(items,p);}}catch(_){}
 if(root.XpaceCreatedMedia){items=[];for(const v of root.XpaceCreatedMedia.list().reverse()){const p=preview(v.kind,v);if(p)items=merge(items,p);}}
 function persist(){try{root.sessionStorage.setItem(KEY,JSON.stringify(items));}catch(_){}}
 const uid=item=>item.kind+':'+item.id;
 function el(tag,cls,text){const e=doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
 function pane(){return doc.querySelector('#telegramDock .expert-view-pane')||doc.querySelector('#xsExpert .expert-view-pane');}
 function mount(){
  if(section?.isConnected)return section;const host=pane();if(!host)return null;
  section=el('section','expert-created-previews');section.id='expertCreatedPreviews';section.setAttribute('aria-live','polite');
  list=el('div','expert-preview-list');empty=el('p','expert-preview-empty');section.append(empty,list);
  const label=host.querySelector('#expertPreviewLabel');if(label)label.after(section);else host.prepend(section);return section;
 }
 function quiet(except){for(const release of releases)release();releases=[];for(const media of doc.querySelectorAll('#expertCreatedPreviews audio,#expertCreatedPreviews video,.media-ready audio,.options-playlist-preview audio,.options-playlist-preview video'))if(media!==except&&!media.paused)media.pause();}
 function duck(){const api=root.XpaceMatrixOptions||root.XpaceOptionsPlayback;if(api?.suppressMusic)return api.suppressMusic();const music=[doc.getElementById('bgMusic'),doc.getElementById('starbucksMusic')].filter(Boolean).map(a=>({a,v:a.volume}));for(const m of music)m.a.volume=0;return ()=>{for(const m of music)if(m.a.volume===0)m.a.volume=m.v;};}
 function player(item){
  const media=el(item.kind==='image'?'img':item.kind==='video'?'video':'audio');
  if(item.kind==='image'){media.alt=item.title;media.loading='lazy';media.decoding='async';media.draggable=false;}
  else{media.controls=true;media.preload='metadata';if(item.kind==='video'){media.muted=true;media.playsInline=true;media.setAttribute('playsinline','');if(item.thumbnail)media.poster=item.thumbnail;}
   media.addEventListener('play',()=>{quiet(media);if(item.kind!=='video'){root.XpaceAnnouncements?.stopStock?.();releases.push(duck());}});
   for(const ev of ['pause','ended'])media.addEventListener(ev,()=>{if(item.kind!=='video'){for(const release of releases)release();releases=[];}});}
  media.src=item.url;return media;
 }
 function stockHref(item){return 'https://www.pixeria.com/stock.html?highlight='+encodeURIComponent(item.id);}
 function texts(card,item){
  const time=new Date(item.at),hh=String(time.getHours()).padStart(2,'0')+':'+String(time.getMinutes()).padStart(2,'0');
  card.querySelector('.epc-kind').textContent=t(...LABEL[item.kind]);
  card.querySelector('.epc-when').textContent=(item.num?'#'+item.num+' · ':'')+hh;
  const title=card.querySelector('.epc-title');title.textContent=item.title;title.title=item.title;
  const launch=card.querySelector('[data-preview-launch]');
  launch.textContent=item.kind==='voice'?(playing.has(uid(item))?t('⏹ Detener','⏹ Stop'):t('📢 Emitir ×3','📢 Play ×3')):item.kind==='music'?t('▶ Lanzar al hilo','▶ Launch to music'):t('▶ Lanzar a pantallas','▶ Launch to screens');
  launch.title=item.kind==='voice'?t('Emitir la locución tres veces en el Xpacio','Play the voiceover three times in the Xpace'):t('Añadir a la playlist y reproducir en el Xpacio','Add to the playlist and play in the Xpace');
  const stock=card.querySelector('[data-preview-stock]');stock.textContent=item.kind==='voice'?t('Ver en Stock · Megafonía','Open in Stock · Announcements'):t('Ver en Stock','Open in Stock');
  card.setAttribute('aria-label',t(...LABEL[item.kind])+' · '+item.title);
  const media=card.querySelector('.epc-media img');if(media)media.alt=item.title;
  const note=card.querySelector('.epc-status');const n=notes.get(uid(item));note.textContent=n?t(n[0],n[1]):'';note.hidden=!n;
 }
 function say(item,es,en){notes.set(uid(item),[es,en]);const card=cards.get(uid(item));if(card)texts(card,item);}
 async function launchItem(item,button){
  if(item.kind==='voice'){
   const key=uid(item);if(playing.has(key)){root.XpaceAnnouncements?.stopStock?.();return;}
   if(!root.XpaceAnnouncements?.playStock){say(item,'La megafonía no está disponible en esta vista.','Announcements are unavailable in this view.');return;}
   quiet();playing.set(key,true);texts(cards.get(key),item);
   root.XpaceAnnouncements.playStock(item.url,item.title,{language:item.language||(doc.documentElement.lang==='en'?'en':'es'),onState(s){
    if(['done','stopped','error'].includes(s.phase))playing.delete(key);
    if(s.phase==='generating')say(item,'Preparando la locución de Stock…','Loading the Stock voiceover…');
    else if(['starting','speaking','between'].includes(s.phase))say(item,'Emitiendo locución · '+(s.completed+1)+'/3','Playing voiceover · '+(s.completed+1)+'/3');
    else if(s.phase==='done')say(item,'Locución completada · 3/3','Voiceover complete · 3/3');
    else if(s.phase==='stopped')say(item,'Locución detenida.','Voiceover stopped.');
    else if(s.phase==='error')say(item,'No se pudo emitir la locución.','Could not play the voiceover.');
    else{const card=cards.get(key);if(card)texts(card,item);}
   }});return;
  }
  if(!root.XpaceMediaOptions?.launch){say(item,'Los reproductores aún no están listos.','Players are not ready yet.');return;}
  button.disabled=true;quiet();
  try{await root.XpaceMediaOptions.launch(item.kind,item);say(item,'Lanzado al reproductor del Xpacio.','Launched to the Xpace player.');}
  catch(e){say(item,'No se pudo lanzar: '+e.message,'Could not launch: '+e.message);}
  finally{button.disabled=false;}
 }
 function card(item){
  const c=el('article','expert-preview-card');c.dataset.kind=item.kind;c.dataset.stockId=item.id;
  const media=el('div','epc-media');
  if(item.kind==='image'||item.kind==='video')media.append(player(item));
  else{const art=item.thumbnail?Object.assign(el('img'),{src:item.thumbnail,alt:'',draggable:false}):el('span','epc-glyph',item.kind==='voice'?'🎙':'♫');art.setAttribute?.('aria-hidden','true');media.classList.add('epc-art');media.append(art);}
  const meta=el('div','epc-meta'),tag=el('p','epc-tag');tag.append(el('b','epc-kind'),el('span','epc-when'));
  const actions=el('div','epc-actions'),launch=el('button');launch.type='button';launch.dataset.previewLaunch=item.kind;launch.addEventListener('click',()=>launchItem(item,launch));
  const stock=el('a');stock.dataset.previewStock=item.kind;stock.href=stockHref(item);stock.target='_blank';stock.rel='noopener';
  actions.append(launch,stock);const status=el('p','epc-status');status.setAttribute('role','status');status.hidden=true;
  meta.append(tag,el('p','epc-title'),actions,status);c.append(media,meta);
  if(item.kind==='music'||item.kind==='voice'){const audio=el('div','epc-audio');audio.append(player(item));c.append(audio);}
  texts(c,item);return c;
 }
 function render(fresh){
  if(!mount())return;section.hidden=false;empty.hidden=!!items.length;empty.textContent=t('Aquí aparecerán la imagen, el vídeo, la música y la locución que crees. Crear no emite; revisa el previo y pulsa Lanzar o Emitir.','Your created images, videos, music and voiceovers will appear here. Creating does not play; review the preview, then press Launch or Play.');
  section.setAttribute('aria-label',t('Contenidos creados · el último primero','Created media · newest first'));
  const keep=new Set(items.map(uid));
  for(const [key,node]of cards)if(!keep.has(key)){node.querySelectorAll('audio,video').forEach(m=>m.pause());node.remove();cards.delete(key);notes.delete(key);}
  items.forEach((item,i)=>{const key=uid(item);let node=cards.get(key);if(!node){node=card(item);cards.set(key,node);}else texts(node,item);if(list.children[i]!==node)list.insertBefore(node,list.children[i]||null);});
  if(fresh){const node=cards.get(uid(fresh));if(node){node.classList.add('is-fresh');root.setTimeout(()=>node.classList.remove('is-fresh'),2400);const host=pane();if(host)host.scrollTop=0;}}
 }
 function add(kind,value){const item=preview(kind,{...value,at:Date.now()});if(!item)return null;items=merge(items,item);persist();render(item);return {...item};}
 function clear(){items=[];root.XpaceCreatedMedia?.clear();persist();render();}
 root.XpaceExpertPreviews={add:(kind,value)=>root.XpaceCreatedMedia?root.XpaceCreatedMedia.add(kind,value):add(kind,value),clear,list:()=>items.map(x=>({...x}))};
 root.addEventListener('xpace:media-created',event=>{const d=event.detail||{};add(d.kind,d.track);});
 if(root.MutationObserver)new root.MutationObserver(()=>render()).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 root.addEventListener('pagehide',()=>quiet());
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>render(),{once:true});else render();
})(typeof window!=='undefined'?window:globalThis);
