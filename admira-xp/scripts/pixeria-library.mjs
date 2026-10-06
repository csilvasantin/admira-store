// The same published index used by Pixeria Stock. Selection never publishes or plays.
export const PIXERIA_LIBRARY_URL='https://stock.admira.store/stock/index.json';
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function libraryMedia(item){
 const audio=['audio','locucion'].includes(item?.type),kind=audio?'music':item?.type;
 if(!['music','image','video'].includes(kind)||item.oculto||!/^[-\w]{1,120}$/.test(item.id||''))return null;
 let url;try{url=new URL(item.url);}catch{return null;}
 if(url.protocol!=='https:'||url.username||url.password)return null;
 if(audio&&!String(item.mime||'').startsWith('audio/')&&!/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(url.pathname))return null;
 // Use the stable Stock asset route; never copy a temporary provider URL.
 const stable=url.origin==='https://api.admira.store'&&url.pathname==='/stock/asset/'+item.id;
 const indexed=['stock.admira.store','pub-bf043a4daa3b43b7a0b769617729d074.r2.dev'].includes(url.hostname)&&url.pathname.startsWith('/stock/'+item.id+'/asset.');
 if(!stable&&!indexed)return null;
 return {id:item.id,num:item.num||null,kind,...(audio?{sourceType:item.type}:{}),title:String(item.title||item.prompt||'Stock '+(item.num||item.id)).slice(0,160),url:'https://api.admira.store/stock/asset/'+item.id,...(item.thumbnail||item.poster?{thumbnail:item.thumbnail||item.poster}:{}),tags:Array.isArray(item.tags)?item.tags.filter(t=>typeof t==='string'):[]};
}
export function filterLibrary(items,kind,query=''){
 const q=fold(query);return items.filter(item=>item.kind===kind&&(!q||q==='all'||q==='todos'||(q.startsWith('#')?item.tags.some(tag=>fold(tag).replace(/^#/,'')===q.slice(1))||String(item.num)===q.slice(1):fold(item.title+' '+item.tags.join(' ')+' '+(item.num||'')).includes(q))));
}
export function libraryTags(items,kind){return [...new Set(items.filter(item=>item.kind===kind).flatMap(item=>item.tags.map(tag=>tag.replace(/^#/,''))))].sort((a,b)=>a.localeCompare(b));}
export async function loadLibrary({fetcher=(...args)=>fetch(...args),signal}={}){
 const response=await fetcher(PIXERIA_LIBRARY_URL,{cache:'no-store',credentials:'omit',signal});if(!response.ok)throw Error('Pixeria HTTP '+response.status);
 const value=await response.json(),items=Array.isArray(value)?value:value.items;if(!Array.isArray(items))throw Error('Invalid Pixeria catalog');
 return items.map(libraryMedia).filter(Boolean);
}
export function mountLibrary(){
 const t=(es,en)=>document.documentElement.lang==='en'?en:es;let items=null,request=null;
 const hosts=[...document.querySelectorAll('[data-pixeria-library]')].map(node=>{
  const kind=node.dataset.pixeriaLibrary,title=document.createElement('strong'),filter=document.createElement('input'),tags=document.createElement('datalist'),info=document.createElement('p'),pick=document.createElement('select'),status=document.createElement('p'),retry=document.createElement('button');
  tags.id='pixeria-tags-'+kind;filter.type='search';filter.maxLength=200;filter.setAttribute('list',tags.id);filter.dataset.pixeriaHashtag=kind;pick.dataset.pixeriaPick=kind;status.setAttribute('role','status');retry.type='button';retry.hidden=true;node.append(title,filter,tags,info,pick,status,retry);
  const host={kind,node,title,filter,tags,info,pick,status,retry};filter.addEventListener('input',()=>render(host));pick.addEventListener('change',()=>{const selected=items?.find(item=>item.id===pick.value&&item.kind===kind);if(!selected)return;window.XpaceMediaOptions.stage(kind,selected);status.textContent=t('Importado para revisar. Arrastra el previo o pulsa Lanzar.','Imported for review. Drag the preview or press Launch.');});retry.addEventListener('click',connect);
  for(const event of ['keydown','keyup','keypress'])filter.addEventListener(event,event=>event.stopPropagation());return host;
 });
 function render(h){const en=document.documentElement.lang==='en',label=h.kind==='music'?t('audio o música','audio or music'):h.kind==='image'?t('imagen','image'):t('vídeo','video'),matches=filterLibrary(items||[],h.kind,h.filter.value),value=h.pick.value;
  h.title.textContent=t('Contenido Stock · Pixeria','Stock content · Pixeria');h.filter.placeholder=t('#hashtag · todos','#hashtag · all');h.filter.setAttribute('aria-label',t('Hashtag de Pixeria · ','Pixeria hashtag · ')+label);h.pick.setAttribute('aria-label',t('Importar ','Import ')+label+' · Pixeria');h.retry.textContent=t('Reconectar con Pixeria','Reconnect Pixeria');
  h.tags.replaceChildren(...libraryTags(items||[],h.kind).map(tag=>new Option('#'+tag,'#'+tag)));
  h.info.textContent=items?matches.length+' '+(en?'ready-made '+label+(matches.length===1?'':'s')+' from the Pixeria library.':'contenidos de '+label+' en la biblioteca Pixeria.'):t('Conectando con Pixeria…','Connecting to Pixeria…');
  h.pick.replaceChildren(new Option(t('Elige una '+(h.kind==='video'?'pieza de vídeo':h.kind==='music'?'pieza de audio o música':'imagen')+'…','Choose a '+label+'…'),''),...matches.map(item=>new Option((item.num?'#'+item.num+' · ':'')+item.title,item.id)));h.pick.value=matches.some(item=>item.id===value)?value:'';h.pick.disabled=!items;
 }
 async function connect(){if(request)return;hosts.forEach(h=>{h.retry.hidden=true;h.status.textContent='';});request=loadLibrary({signal:AbortSignal.timeout(20000)});try{items=await request;hosts.forEach(render);}catch(error){hosts.forEach(h=>{h.status.textContent=t('No se pudo conectar con Pixeria.','Could not connect to Pixeria.');h.retry.hidden=false;});}finally{request=null;}}
 hosts.forEach(render);new MutationObserver(()=>hosts.forEach(render)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});void connect();
}
if(typeof document!=='undefined')mountLibrary();
