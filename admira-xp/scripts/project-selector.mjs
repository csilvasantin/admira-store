import {ADAPTERS,projectContext} from './project-context.mjs?v=projects-2';
import {CENTRAL,ProjectClient,connectCentral,venueUrl,validAccess} from './central-project-client.mjs?v=central-1';
const $=id=>document.getElementById(id),select=$('projectSelector'),venueSelect=$('projectVenueSelector'),chip=$('projectContextChip');
let storage;try{storage=sessionStorage;}catch{}
const client=new ProjectClient({storage}),chosenQuality=()=>document.querySelector('#visualQualityOptions [aria-pressed="true"]')?.dataset.visualMode;
const english=()=>document.documentElement.lang==='en',text=(en,es)=>english()?en:es;
let pendingProject='',catalog={projects:[],venues:[]},mode=client.access||client.expired?'account':'demo',error='',busy=false,last='',popup;
function sceneId(){return new URL(location.href).searchParams.get('project')||projectContext(location.href,window.__xtancoVisualState?.()?.vertical).id;}
function currentId(){return pendingProject||sceneId();}
function currentVenue(project){if(project!==sceneId())return null;const p=new URL(location.href).searchParams;return catalog.venues.find(v=>v.project_id===project&&v.id===p.get('venue'))||catalog.venues.find(v=>v.project_id===project&&new URL(v.xpace_url).searchParams.get('loc')===p.get('loc'));}
function draw(){
 const id=currentId(),project=catalog.projects.find(p=>p.id===id),venue=currentVenue(id);
 const stamp=JSON.stringify([catalog,mode,error,busy,english(),id,venue?.id]);if(stamp===last)return;last=stamp;
 $('projectSelectorLabel').textContent=text('Project and venue','Proyecto y local');$('projectFieldLabel').textContent=text('Project','Proyecto');$('projectVenueLabel').textContent=text('Venue','Local');
 $('projectVenueFieldLabel').textContent=text('Choose venue','Elegir local');
 select.replaceChildren(new Option(text('Choose a project','Escoge un proyecto'),''));
 for(const p of catalog.projects){const o=new Option(p.name,p.id);select.add(o);}select.value=project?.id||'';select.disabled=busy||!catalog.projects.length;
 venueSelect.replaceChildren(new Option(text('Choose a venue','Escoge un local'),''));for(const v of catalog.venues.filter(v=>v.project_id===id))venueSelect.add(new Option(v.name,v.id));venueSelect.value=venue?.id||'';venueSelect.disabled=busy||venueSelect.options.length<2;
 chip.textContent=(catalog.projects.find(p=>p.id===sceneId())?.name||text('Choose project','Elegir proyecto'))+(mode==='demo'?' · Demo':'');chip.title=chip.textContent;
 $('projectVenueName').textContent=venue?.name||'—';
 $('projectSelectionStatus').textContent=error||(mode==='demo'?text('Public demos · no account permissions','Demos públicas · sin permisos de cuenta'):!project?text('Choose one of your permitted projects','Escoge uno de tus proyectos autorizados'):!catalog.venues.some(v=>v.project_id===id)?text('No associated venue. Manage it in AdmiraNext.','Sin local asociado. Gestiónalo en AdmiraNext.'):text('Authorized venues · AdmiraNext','Locales autorizados · AdmiraNext'));
 $('projectConnect').textContent=text('Connect with AdmiraNext','Conectar con AdmiraNext');$('projectConnect').disabled=busy;
 $('projectDisconnect').hidden=mode!=='account';$('projectDisconnect').textContent=text('Disconnect','Desconectar');
 $('projectDemos').hidden=mode==='demo';$('projectDemos').textContent=text('View public demos','Ver demos públicas');
 $('projectRefresh').textContent=text('Refresh','Actualizar');$('projectRefresh').disabled=busy;
 $('projectBackofficeLink').textContent=text('Manage projects and venues ↗','Gestionar proyectos y locales ↗');
 const controls=document.querySelector('#visualQualityOptions .visual-tier-controls');
 if(mode==='demo'&&project&&!pendingProject&&window.__xtancoVisualTiers&&controls?.getAttribute('aria-busy')==='false'){const u=new URL(location.href);u.searchParams.set('project',project.id);u.searchParams.set('circuit',project.circuit);const quality=chosenQuality();if(quality){u.searchParams.delete('visual');u.searchParams.set('quality',quality);}if(u.href!==location.href)history.replaceState(history.state,'',u);}
}
async function load(){busy=true;error='';draw();try{catalog=mode==='account'?await client.context():await client.demos();}catch(e){pendingProject='';catalog={projects:[],venues:[]};error=e.message==='SESSION_EXPIRED'?text('Connection expired or revoked. Reconnect with AdmiraNext.','Conexión caducada o revocada. Reconecta con AdmiraNext.'):text('AdmiraNext is unavailable. Your selection has not changed.','AdmiraNext no está disponible. Tu selección no ha cambiado.');}finally{busy=false;last='';draw();}}
async function navigate(projectId,venueId){busy=true;draw();try{if(mode==='account')catalog=await client.context();const project=catalog.projects.find(p=>p.id===projectId),venues=catalog.venues.filter(v=>v.project_id===projectId);if(!project)throw Error('SESSION_EXPIRED');const venue=venues.find(v=>v.id===venueId)||(venues.length===1?venues[0]:null);if(!venue){pendingProject=project.id;error=venues.length?text('Choose the venue to open.','Escoge el local que quieres abrir.'):text('This project has no associated venue.','Este proyecto no tiene un local asociado.');return;}location.assign(venueUrl(location.href,venue,project,chosenQuality()));}catch(e){error=e.message==='SESSION_EXPIRED'?text('Access changed. Reconnect with AdmiraNext.','El acceso ha cambiado. Reconecta con AdmiraNext.'):text('Unable to verify the selected venue.','No se pudo verificar el local seleccionado.');}finally{busy=false;last='';draw();}}
select.addEventListener('change',()=>{if(select.value)navigate(select.value);});venueSelect.addEventListener('change',()=>{if(venueSelect.value)navigate(select.value,venueSelect.value);});
$('projectRefresh').onclick=load;
$('projectDisconnect').onclick=async()=>{await client.disconnect();pendingProject='';catalog={projects:[],venues:[]};error=text('Disconnected. Reconnect or choose public demos.','Desconectado. Reconecta o elige demos públicas.');last='';draw();};
$('projectDemos').onclick=async()=>{await client.disconnect();mode='demo';await load();};
let cancelConnection=null;
$('projectConnect').onclick=()=>{
 if(cancelConnection){cancelConnection();cancelConnection=null;error=text('Connection cancelled.','Conexión cancelada.');last='';draw();return;}
 cancelConnection=connectCentral(client,{onWaiting(){error=text('Complete the login in AdmiraNext. Press Connect again to cancel.','Completa el login en AdmiraNext. Pulsa Conectar otra vez para cancelar.');last='';draw();},onComplete(){cancelConnection=null;mode='account';load();},onError(e){cancelConnection=null;error=e.message==='POPUP_BLOCKED'?text('Allow the login window.','Permite abrir la ventana de login.'):text('Unable to connect. You can try again.','No se pudo conectar. Puedes volver a intentarlo.');last='';draw();}});
};
chip.addEventListener('click',()=>{if($('pfOptions').getAttribute('aria-expanded')!=='true')$('pfOptions').click();select.focus({preventScroll:true});});
window.addEventListener('xpaceos:project-change',()=>{last='';draw();});window.addEventListener('resize',draw);new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
setInterval(()=>{if(mode==='account'&&client.access&&!validAccess(client.access)){client.clear();pendingProject='';catalog={projects:[],venues:[]};error=text('Connection expired. Reconnect with AdmiraNext.','Conexión caducada. Reconecta con AdmiraNext.');}last='';draw();},1000);
load();
