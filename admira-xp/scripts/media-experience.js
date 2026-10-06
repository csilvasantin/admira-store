/* Creation stages reflect server transitions, never an estimated percentage.
   Enlarged previews are local, never a playlist/device publication. */
(function(root){'use strict';const doc=root.document;if(!doc)return;
 const KINDS=['music','voice','image','video'],states=new Map(),widgets=new Map();
 const stages={preparing:0,pending:1,generating:1,running:1,archiving:2,loading:3,done:4,external:1};
 const labels={preparing:['Preparando la solicitud…','Preparing the request…'],pending:['Generando contenido…','Generating media…'],generating:['Generando contenido…','Generating media…'],running:['Generando contenido…','Generating media…'],archiving:['Guardando en Stock…','Saving to Stock…'],loading:['Preparando el previo…','Preparing the preview…'],done:['Listo · revisa el previo','Ready · review the preview'],external:['En Pixeria · esperando la nueva entrega en Stock','In Pixeria · waiting for the new Stock delivery'],error:['No se pudo completar. Reintenta para recuperar el mismo trabajo.','Could not complete. Retry to recover the same job.'],auth:['Inicia sesión para crear contenido.','Sign in to create media.'],waiting:['Sigue pendiente. Reintenta para consultar el mismo trabajo.','Still pending. Retry to check the same job.'],cancelled:['Espera interrumpida; el trabajo admitido puede seguir en Stock.','Waiting interrupted; an accepted job may still finish in Stock.']};
 const names={music:['Música','Music'],voice:['Locución','Voiceover'],image:['Imagen','Image'],video:['Vídeo','Video']};
 const targets={voice:['#voiceoverStatus','#announcementStatus'],image:['#imagePromptStatus'],video:['#videoPromptStatus'],music:['[data-pixeria-music-create]']};
 const t=(es,en)=>doc.documentElement.lang==='en'?en:es;
 let modal=null,current=null,returnFocus=null,releaseMusic=null;
 function el(tag,cls,text){const n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
 function progress(kind,phase,{title='',requestId=''}={}){
  kind=kind==='audio'?'voice':kind;if(!KINDS.includes(kind))return null;
  const previous=states.get(kind),restart=phase==='preparing'||phase==='external';
  const step=restart?stages[phase]:Math.max(previous?.step||0,stages[phase]??previous?.step??0);
  const value={kind,phase,step,title:title||previous?.title||'',requestId:requestId||previous?.requestId||'',busy:Object.hasOwn(stages,phase)&&phase!=='done'};
  states.set(kind,value);render();return {...value};
 }
 function widget(target){
  let node=widgets.get(target);if(node?.isConnected)return node;
  node=el('section','media-creation-progress');const heading=el('p','mcp-stage'),track=el('div','mcp-track'),fill=el('span','mcp-fill'),activity=el('span','mcp-activity'),steps=el('div','mcp-steps');
  heading.setAttribute('role','status');track.setAttribute('role','progressbar');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','4');track.append(fill,activity);
  for(let i=0;i<4;i++)steps.append(el('span'));
  node.append(heading,track,steps);target.after(node);widgets.set(target,node);return node;
 }
 function render(){
  for(const [kind,state]of states)for(const selector of targets[kind]){
   const target=doc.querySelector(selector);if(!target)continue;const node=widget(target),label=t(...(labels[state.phase]||labels.generating));
   node.dataset.kind=kind;node.dataset.phase=state.phase;node.classList.toggle('is-busy',state.busy);node.classList.toggle('is-error',['error','auth','cancelled'].includes(state.phase));
   node.querySelector('.mcp-stage').textContent=t(...names[kind])+' · '+label;
   const bar=node.querySelector('.mcp-track');bar.setAttribute('aria-label',t('Evolución de la creación','Creation progress')+' · '+t(...names[kind]));bar.setAttribute('aria-valuenow',String(state.step));bar.setAttribute('aria-valuetext',label);bar.setAttribute('aria-busy',String(state.busy));
   node.querySelector('.mcp-fill').style.width=state.step*25+'%';
   const words=doc.documentElement.lang==='en'?['Prepare','Create','Stock','Ready']:['Preparar','Crear','Stock','Listo'];
   node.querySelectorAll('.mcp-steps span').forEach((n,i)=>{n.textContent=words[i];n.classList.toggle('is-complete',i<state.step);n.classList.toggle('is-current',state.busy&&i===state.step);});
  }
  if(modal?.open){modal.querySelector('.media-large-close').textContent=t('✕ Cerrar','✕ Close');modal.setAttribute('aria-label',t('Previo ampliado','Enlarged preview'));}
 }
 function valid(item){
  if(!item||!KINDS.includes(item.kind))return null;try{
   const u=new URL(item.url,root.location?.href);if(u.username||u.password)return null;
   const stock=u.origin==='https://api.admira.store'?u.pathname.match(/^\/stock\/asset\/([-\w]+)$/):u.origin==='https://stock.admira.store'?u.pathname.match(/^\/stock\/([-\w]+)\/asset\.[a-z0-9]+$/):null;
   const local=root.location&&u.origin===root.location.origin&&(['http:','https:'].includes(u.protocol)||u.protocol==='blob:');
   if(!stock&&!local)return null;
  }catch(_){return null;}
  return {...item,title:String(item.title||t(...names[item.kind])).slice(0,160)};
 }
 function release(){releaseMusic?.();releaseMusic=null;}
 function close(){
  if(!modal)return;const media=modal.querySelector('audio,video');if(media){media.pause();media.removeAttribute('src');media.load();}release();
  if(modal.open)modal.close();modal.querySelector('.media-large-body').replaceChildren();current=null;returnFocus?.focus?.({preventScroll:true});returnFocus=null;
 }
 function open(item,trigger){
  item=valid(item);if(!item)return false;
  close();doc.querySelectorAll('#expertCreatedPreviews audio,#expertCreatedPreviews video,.media-ready audio,.media-ready video,.options-playlist-preview audio,.options-playlist-preview video').forEach(n=>n.pause());returnFocus=trigger||doc.activeElement;current=item;
  if(!modal){
   modal=el('dialog','media-large-preview');modal.id='mediaLargePreview';const header=el('header','media-large-head'),title=el('h2','media-large-title'),button=el('button','media-large-close');title.id='mediaLargeTitle';button.type='button';button.addEventListener('click',close);header.append(title,button);modal.append(header,el('div','media-large-body'));modal.setAttribute('aria-labelledby',title.id);
   modal.addEventListener('cancel',e=>{e.preventDefault();close();});modal.addEventListener('click',e=>{if(e.target===modal)close();});modal.addEventListener('close',()=>{if(current)close();});
   modal.addEventListener('keydown',e=>{e.stopPropagation();});doc.body.append(modal);
  }
  modal.querySelector('.media-large-title').textContent=item.title;modal.dataset.kind=item.kind;const body=modal.querySelector('.media-large-body');
  if(item.kind==='music'||item.kind==='voice'){
   const art=el('div','media-large-art');let cover;try{const u=new URL(item.thumbnail);if(u.protocol==='https:'&&!u.username&&!u.password)cover=u.href;}catch(_){}
   if(cover){const image=el('img');image.src=cover;image.alt=item.title;art.append(image);}else art.append(el('span',null,item.kind==='voice'?'🎙':'♫'));
   body.append(art);
  }
  const media=el(item.kind==='image'?'img':item.kind==='video'?'video':'audio');media.src=item.url;
  if(item.kind==='image'){media.alt=item.title;media.draggable=false;}
  else{
   media.controls=true;media.preload='metadata';if(item.kind==='video'){media.muted=true;media.playsInline=true;}
   media.addEventListener('play',()=>{doc.querySelectorAll('#expertCreatedPreviews audio,#expertCreatedPreviews video,.media-ready audio,.media-ready video,.options-playlist-preview audio,.options-playlist-preview video').forEach(n=>n.pause());root.XpaceAnnouncements?.stopStock?.();release();const api=root.XpaceMatrixOptions||root.XpaceOptionsPlayback;if(api?.suppressMusic)releaseMusic=api.suppressMusic();});
   for(const event of ['pause','ended','error'])media.addEventListener(event,release);
  }
  body.append(media);modal.showModal();render();modal.querySelector('.media-large-close').focus();return true;
 }
 function bind(node,item){
  if(!node||!valid(item))return;node.dataset.mediaExpand=JSON.stringify(item);node.tabIndex=0;node.setAttribute('aria-label',t('Ampliar previo de ','Enlarge preview of ')+item.title);node.title=t('Doble clic para ampliar · mantén pulsado para arrastrar','Double-click to enlarge · hold to drag');
 }
 doc.addEventListener('dblclick',e=>{const node=e.target.closest?.('[data-media-expand]');if(!node||e.target.closest?.('button,a,input,select,textarea'))return;let item;try{item=JSON.parse(node.dataset.mediaExpand);}catch(_){return;}e.preventDefault();e.stopPropagation();open(item,node);});
 doc.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target!==e.target.closest?.('[data-media-expand]'))return;let item;try{item=JSON.parse(e.target.dataset.mediaExpand);}catch(_){return;}e.preventDefault();e.stopPropagation();open(item,e.target);});
 doc.addEventListener('click',e=>{if(e.target.closest?.('[data-pixeria-music-create]'))progress('music','external');});
 root.addEventListener('xpace:media-created',e=>{if(e.detail?.kind==='music')progress('music','done');});
 root.addEventListener('pagehide',close);
 root.XpaceMediaExperience={progress,bind,open,close,state:kind=>states.has(kind)?{...states.get(kind)}:null};
 if(root.MutationObserver)new root.MutationObserver(render).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',render,{once:true});
})(typeof window!=='undefined'?window:globalThis);
