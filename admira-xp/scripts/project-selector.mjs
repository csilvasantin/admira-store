import {ADAPTERS,projectContext} from './project-context.mjs?v=projects-2';
import {CENTRAL,ProjectClient,connectCentral,venueUrl,validAccess} from './central-project-client.mjs?v=local-playlist-349';
import {marcaQueLimita,proyectosPermitidos} from './marca-proyectos.mjs?v=alsea-1';
const $=id=>document.getElementById(id),select=$('projectSelector'),venueSelect=$('projectVenueSelector'),chip=$('projectContextChip'),space=$('xpaceActiveSpace');
let storage;try{storage=sessionStorage;}catch{}
const leerMarca=k=>{try{return storage&&typeof storage.getItem==='function'?storage.getItem(k):null;}catch{return null;}};
const marcaLimite=()=>marcaQueLimita({marca:leerMarca('mb:marca'),manual:leerMarca('mb:manual')});
const nombreMarca=id=>{try{const a=window.AdmiraMarca&&window.AdmiraMarca.actual&&window.AdmiraMarca.actual();if(a&&a.id===id&&a.nombre)return a.nombre;}catch{}return id.charAt(0).toUpperCase()+id.slice(1);};
const client=new ProjectClient({storage}),chosenQuality=()=>document.querySelector('#visualQualityOptions [aria-pressed="true"]')?.dataset.visualMode;
const english=()=>document.documentElement.lang==='en',text=(en,es)=>english()?en:es;
let venuesDe='',pendingProject='',catalog={projects:[],venues:[]},mode=client.access||client.expired?'account':'demo',error='',busy=false,last='',popup;
function sceneId(){return new URL(location.href).searchParams.get('project')||projectContext(location.href,window.__xtancoVisualState?.()?.vertical).id;}
function currentId(){return pendingProject||sceneId();}
function currentVenue(project){if(project!==sceneId())return null;const p=new URL(location.href).searchParams;return catalog.venues.find(v=>v.project_id===project&&v.id===p.get('venue'))||catalog.venues.find(v=>v.project_id===project&&new URL(v.xpace_url).searchParams.get('loc')===p.get('loc'));}
function draw(){
 const marca=marcaLimite(),visibles=proyectosPermitidos(marca,catalog.projects),limitado=visibles.length<catalog.projects.length;
 const id=currentId(),project=visibles.find(p=>p.id===id),venue=project?currentVenue(id):null;
 const stamp=JSON.stringify([catalog,mode,error,busy,english(),id,sceneId(),venue?.id,marca]);if(stamp===last)return;last=stamp;
 $('projectSelectorLabel').textContent=text('Project and venue','Proyecto y local');$('projectFieldLabel').textContent=text('Project','Proyecto');$('projectVenueLabel').textContent=text('Venue','Local');
 $('projectVenueFieldLabel').textContent=text('Choose venue','Elegir local');
 select.replaceChildren(new Option(text('Choose a project','Escoge un proyecto'),''));
 for(const p of visibles){const o=new Option(p.name,p.id);select.add(o);}select.value=project?.id||'';select.disabled=busy||!visibles.length;
 // Con una marca que limita y una escena de otro proyecto, los locales son los de la marca (si es uno solo).
 venuesDe=project?project.id:(limitado&&visibles.length===1?visibles[0].id:(limitado?'':id));
 venueSelect.replaceChildren(new Option(text('Choose a venue','Escoge un local'),''));for(const v of catalog.venues.filter(v=>v.project_id===venuesDe))venueSelect.add(new Option(v.name,v.id));venueSelect.value=venue?.id||'';venueSelect.disabled=busy||venueSelect.options.length<2;
 const activeId=sceneId();space.textContent=catalog.projects.find(p=>p.id===activeId)?.name||({estancos:'Estancos',cafebreria:'Cafebrería',starbucks:'Starbucks'}[activeId]||'');space.title=space.textContent;
 chip.textContent=(catalog.projects.find(p=>p.id===sceneId())?.name||text('Choose project','Elegir proyecto'))+(mode==='demo'?' · Demo':'');chip.title=chip.textContent;
 $('projectVenueName').textContent=venue?.name||'—';
 const aviso=limitado?' · '+text(`${nombreMarca(marca)} brand: only its projects · /marca off shows them all`,`Marca ${nombreMarca(marca)}: sólo sus proyectos · /marca off los muestra todos`):'';
 $('projectSelectionStatus').textContent=(error||(mode==='demo'?text('Public demos · no account permissions','Demos públicas · sin permisos de cuenta'):!project?text('Choose one of your permitted projects','Escoge uno de tus proyectos autorizados'):!catalog.venues.some(v=>v.project_id===id)?text('No associated venue. Manage it in AdmiraNext.','Sin local asociado. Gestiónalo en AdmiraNext.'):text('Authorized venues · AdmiraNext','Locales autorizados · AdmiraNext')))+(error?'':aviso);
 $('projectConnect').textContent=text('Connect with AdmiraNext','Conectar con AdmiraNext');$('projectConnect').disabled=busy;
 $('projectDisconnect').hidden=mode!=='account';$('projectDisconnect').textContent=text('Disconnect','Desconectar');
 $('projectDemos').hidden=mode==='demo';$('projectDemos').textContent=text('View public demos','Ver demos públicas');
 $('projectRefresh').textContent=text('Refresh','Actualizar');$('projectRefresh').disabled=busy;
 $('projectBackofficeLink').textContent=text('Manage projects and venues ↗','Gestionar proyectos y locales ↗');
 const controls=document.querySelector('#visualQualityOptions .visual-tier-controls');
 if(mode==='demo'&&project&&!pendingProject&&window.__xtancoVisualTiers&&controls?.getAttribute('aria-busy')==='false'){const u=new URL(location.href);u.searchParams.set('project',project.id);u.searchParams.set('circuit',project.circuit);const quality=chosenQuality();if(quality){u.searchParams.delete('visual');u.searchParams.set('quality',quality);}if(u.href!==location.href)history.replaceState(history.state,'',u);}
}
async function load(){busy=true;error='';draw();try{catalog=mode==='account'?await client.context():await client.demos();}catch(e){pendingProject='';catalog={projects:[],venues:[]};error=e.message==='SESSION_EXPIRED'?text('Connection expired or revoked. Reconnect with AdmiraNext.','Conexión caducada o revocada. Reconecta con AdmiraNext.'):text('AdmiraNext is unavailable. Your selection has not changed.','AdmiraNext no está disponible. Tu selección no ha cambiado.');}finally{busy=false;last='';draw();}}
async function navigate(projectId,venueId){busy=true;draw();try{if(mode==='account')catalog=await client.context();const project=proyectosPermitidos(marcaLimite(),catalog.projects).find(p=>p.id===projectId),venues=catalog.venues.filter(v=>v.project_id===projectId);if(!project)throw Error('SESSION_EXPIRED');const venue=venues.find(v=>v.id===venueId)||(venues.length===1?venues[0]:null);if(!venue){pendingProject=project.id;error=venues.length?text('Choose the venue to open.','Escoge el local que quieres abrir.'):text('This project has no associated venue.','Este proyecto no tiene un local asociado.');return;}const href=venueUrl(location.href,venue,project,chosenQuality(),{publicDemo:mode==='demo',language:english()?'en':'es'});try{const dest=new URL(href);const id=dest.searchParams.get('loc')==='alsea-sbux-021'?'starbucks':(dest.searchParams.get('project')||'');if(id&&window.AdmiraMarca&&typeof window.AdmiraMarca.aplicarProyecto==='function')window.AdmiraMarca.aplicarProyecto(id);if(id&&typeof window.dispatchEvent==='function')window.dispatchEvent(new CustomEvent('xpaceos:project-change',{detail:{id}}));}catch(err){}location.assign(href);}catch(e){if(e.message==='SESSION_EXPIRED'){catalog={projects:[],venues:[]};pendingProject='';}error=e.message==='SESSION_EXPIRED'?text('Access changed. Reconnect with AdmiraNext.','El acceso ha cambiado. Reconecta con AdmiraNext.'):text('Unable to verify the selected venue.','No se pudo verificar el local seleccionado.');}finally{busy=false;last='';draw();}}
select.addEventListener('change',()=>{if(select.value)navigate(select.value);});venueSelect.addEventListener('change',()=>{if(venueSelect.value)navigate(venuesDe||select.value,venueSelect.value);});
$('projectRefresh').onclick=load;
$('projectDisconnect').onclick=async()=>{await client.disconnect();pendingProject='';catalog={projects:[],venues:[]};error=text('Disconnected. Reconnect or choose public demos.','Desconectado. Reconecta o elige demos públicas.');last='';draw();};
$('projectDemos').onclick=async()=>{await client.disconnect();mode='demo';await load();};
let cancelConnection=null;
$('projectConnect').onclick=()=>{
 if(cancelConnection){cancelConnection();cancelConnection=null;error=text('Connection cancelled.','Conexión cancelada.');last='';draw();return;}
 cancelConnection=connectCentral(client,{onWaiting(){error=text('Complete the login in AdmiraNext. Press Connect again to cancel.','Completa el login en AdmiraNext. Pulsa Conectar otra vez para cancelar.');last='';draw();},onComplete(){cancelConnection=null;mode='account';load();},onError(e){cancelConnection=null;error=e.message==='POPUP_BLOCKED'?text('Allow the login window.','Permite abrir la ventana de login.'):text('Unable to connect. You can try again.','No se pudo conectar. Puedes volver a intentarlo.');last='';draw();}});
};
chip.addEventListener('click',()=>{$('topbarXpace').open=true;select.focus({preventScroll:true});});
window.addEventListener('xpaceos:project-change',()=>{last='';draw();});try{document.addEventListener('admira:marca',()=>{last='';draw();});}catch{}window.addEventListener('resize',draw);new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
setInterval(()=>{if(mode==='account'&&client.access&&!validAccess(client.access)){client.clear();pendingProject='';catalog={projects:[],venues:[]};error=text('Connection expired. Reconnect with AdmiraNext.','Conexión caducada. Reconecta con AdmiraNext.');}draw();},1000);
load();
