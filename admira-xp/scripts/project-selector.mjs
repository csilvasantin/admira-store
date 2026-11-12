import {ADAPTERS,projectContext} from './project-context.mjs?v=projects-4';
import {CENTRAL,ProjectClient,connectCentral,venueUrl,validAccess} from './central-project-client.mjs?v=tres-combos-2';
import {marcaQueLimita,proyectosPermitidos} from './marca-proyectos.mjs?v=alsea-1';
// Un local con puerta de Google Maps pasa primero por su calle (Carlos, 15-oct-2026).
import {conPuerta} from '../../assets/puertas.mjs?v=puerta-1';
// Xpace «Computer» (Carlos, 4-nov-2026 / renombre 10-nov-2026): locales = gemelos Supercomputer AdmiraNeXT01 (antes Metahuman) y PC-Cocina (assets/computer-xpace.mjs).
// Se conserva el id «metahuman» y /supercomputer/metahuman/ para no romper enlaces; alias admiranext01.
const COMPUTER_ID='computer',COMPUTER_PROJECT={id:COMPUTER_ID,name:'Computer'},COMPUTER_VENUES=[{id:'metahuman',name:'AdmiraNeXT01',url:'/supercomputer/metahuman/'},{id:'pc-cocina',name:'PC-Cocina',url:'/supercomputer/pc-cocina/'}],COMPUTER_ALIAS={admiranext01:'metahuman'},computerVenue=id=>COMPUTER_VENUES.find(v=>v.id===(COMPUTER_ALIAS[id]||id))||null;
// Xpace «Objeto» (Carlos, 5-nov-2026): locales = gemelos de objetos físicos (Stream Deck XL en METAHUMAN).
const OBJET_ID='objeto',OBJET_PROJECT={id:OBJET_ID,name:'Objeto'},OBJET_VENUES=[{id:'stream-deck',name:'Stream Deck',url:'/objeto/stream-deck/'},{id:'galleon-100',name:'Corsair Galleon 100 SD',url:'/objeto/galleon-100/'},{id:'galaxy-z-fold5',name:'Samsung Galaxy Z Fold5',url:'/objeto/galaxy-z-fold5/'}],objetoVenue=id=>OBJET_VENUES.find(v=>v.id===id)||null;

// Carlos (4-nov-2026): «no hay que cambiar la interface de admira.store» — el gemelo se incrusta bajo la
// barra Xpaces (iframe), sin salir del shell. URLs directas /supercomputer/… y /objeto/… siguen valiendo.
// Xpace «PortAventura» (Neo, 9-nov-2026): los 4 locales de NetflixVentura. Viven en la zona protegida (DMZ,
// Cloudflare Access) de portaventuranext.com; aquí solo se enlazan, sin copiar código privado. Access no se deja
// incrustar en iframe (12-nov-2026): «Ver aquí» abre el gemelo propio /portaventura/<espacio>/ y la DMZ va en pestaña nueva.
const PA_ID='portaventura',PA_PROJECT={id:PA_ID,name:'PortAventura'},PA_BASE='https://www.portaventuranext.com',PA_VENUES=[{id:'store',name:'Store',url:PA_BASE+'/dmz/netflixventura/store',sub:'Stranger Things · Hawkins',here:'/portaventura/store/hawkins/'},{id:'restaurant',name:'Restaurant',url:PA_BASE+'/dmz/netflixventura/restaurante',sub:"Benny's Burgers",here:'/portaventura/restaurante/bennys/'},{id:'hotel',name:'Hotel',url:PA_BASE+'/dmz/netflixventura/hotel',sub:'Casa Creel',here:'/portaventura/hotel/casa-creel/?maqueta=1'},{id:'atracciones',name:'Atracciones',url:PA_BASE+'/dmz/netflixventura',sub:'NetflixVentura',here:'/portaventura/hotel/casa-creel/dentro/'}],PA_ALIAS={restaurante:'restaurant',atraccion:'atracciones'},paVenue=id=>PA_VENUES.find(v=>v.id===(PA_ALIAS[id]||id))||null;
// Style (Neo, 9-nov-2026): estudio que tematiza los locales. Hoy solo Netflix tiene contenido; el resto, paleta
// propia y «próximamente» (sin logos ni arte de esas marcas).
const PA_STYLES=[{id:'netflix',name:'Netflix',live:true,c1:'#e50914',c2:'#2a0508',ink:'#ffd0d0'},{id:'universal',name:'Universal',c1:'#2f6bff',c2:'#06122e',ink:'#d6e2ff'},{id:'sony',name:'Sony',c1:'#c9ccd3',c2:'#141518',ink:'#eceef2'},{id:'skydance',name:'Skydance',c1:'#ff8a1f',c2:'#08243a',ink:'#ffe2c4'}],paStyleOf=id=>PA_STYLES.find(x=>x.id===id)||PA_STYLES[0];
let paStyle='netflix';
let computerChosen='',objetoChosen='',paChosen='';
const XPACE_TWIN_PANES=['computerPane','objetoPane','portaventuraPane'];
function hideTwinPanes(except){for(const id of XPACE_TWIN_PANES){if(id===except)continue;const p=document.getElementById(id);if(p&&p.tagName&&p.style)p.style.display='none';}if(typeof setTimeout==='function')setTimeout(syncTwinOpen,0);}
// Con un gemelo abierto, body.xp-twin-open sube los menús (Opciones, Avanzado, Experto) por encima del panel (Neo, 12-nov-2026).
function syncTwinOpen(){const b=document.body;if(!b||!b.classList)return;b.classList.toggle('xp-twin-open',XPACE_TWIN_PANES.some(id=>{const p=document.getElementById(id);return !!(p&&p.style&&p.style.display&&p.style.display!=='none');}));}
function embedXpaceTwin(paneId,title,xpaceId,cv,chosenRef){
 chosenRef.v=cv.id;
 if(typeof document.createElement!=='function'){location.assign(cv.url);return;}
 hideTwinPanes(paneId);
 let pane=document.getElementById(paneId);
 if(!pane||!pane.tagName){pane=document.createElement('div');pane.id=paneId;document.body.appendChild(pane);}
 const bar=document.getElementById('topBar'),top=bar&&bar.getBoundingClientRect?Math.round(bar.getBoundingClientRect().bottom):48;
 pane.style.cssText=`position:fixed;left:0;right:0;bottom:0;top:${top}px;z-index:9000;background:#000;display:block;`;
 let f=pane.querySelector('iframe');
 if(!f){f=document.createElement('iframe');f.title=title;f.allow='fullscreen; autoplay; xr-spatial-tracking';f.allowFullscreen=true;f.style.cssText='border:0;width:100%;height:100%;display:block';pane.appendChild(f);}
 if(f.getAttribute('src')!==cv.url)f.setAttribute('src',cv.url);
 try{const u=new URL(location.href);u.searchParams.set('xpace',xpaceId);u.searchParams.set('venue',cv.id);history.replaceState(null,'',u.pathname+u.search+u.hash);}catch{}
 try{window.addEventListener('resize',()=>{const b=document.getElementById('topBar');if(b&&pane.isConnected)pane.style.top=Math.round(b.getBoundingClientRect().bottom)+'px';});}catch{}
}
function embedComputer(cv){embedXpaceTwin('computerPane','Computer',COMPUTER_ID,cv,{set v(id){computerChosen=id;},get v(){return computerChosen;}});}
// La DMZ pide sesión de Cloudflare Access y su cookie no viaja dentro de un iframe de otro dominio: primero una
// ficha con «Entrar ↗» (pestaña nueva, con login) y, si ya hay sesión, «Ver aquí» la incrusta bajo la barra.
function embedPortaventura(cv){
 paChosen=cv.id;
 if(typeof document.createElement!=='function'){if(paStyleOf(paStyle).live)location.assign(cv.url);return;}
 hideTwinPanes('portaventuraPane');
 let pane=document.getElementById('portaventuraPane');
 if(!pane||!pane.tagName){pane=document.createElement('div');pane.id='portaventuraPane';document.body.appendChild(pane);}
 const st=paStyleOf(paStyle),bar=document.getElementById('topBar'),top=bar&&bar.getBoundingClientRect?Math.round(bar.getBoundingClientRect().bottom):48;
 pane.style.cssText=`position:fixed;left:0;right:0;bottom:0;top:${top}px;z-index:9000;background:radial-gradient(circle at 50% 30%,${st.c2},#07080d 72%);display:block;`;
 const en=document.documentElement.lang==='en',esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const body=st.live?`<p style="opacity:.8;margin:0 0 22px">${en?'Protected zone (DMZ) of portaventuranext.com: it opens in a new tab (Access does not allow iframes). «View here» shows its digital twin.':'Zona protegida (DMZ) de portaventuranext.com: se abre en otra pestaña (Access no deja incrustarla). «Ver aquí» enseña su gemelo digital.'}</p><a class="xpace-open" href="${esc(cv.url)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 22px;border-radius:8px;background:${st.c1};color:#fff;text-decoration:none;font-weight:700">${en?'Enter ↗':'Entrar ↗'}</a> <button type="button" class="xpace-here" style="margin-left:8px;padding:12px 18px;border-radius:8px;border:1px solid ${st.c1};background:transparent;color:${st.ink};font:inherit;cursor:pointer">${en?'View here':'Ver aquí'}</button><div style="margin-top:14px;font-size:11px;opacity:.55">${esc(cv.url.replace('https://',''))}</div>`:`<p style="opacity:.8;margin:0 0 22px">${en?'Coming soon: this style has no content yet.':'Próximamente: este estilo aún no tiene contenido.'}</p><span class="xpace-soon" style="display:inline-block;padding:10px 20px;border-radius:8px;border:1px dashed ${st.c1};color:${st.ink}">${en?'Coming soon':'Próximamente'}</span>`;
 pane.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace;color:#f3e9e9;text-align:center;padding:24px"><div style="max-width:560px"><div style="font-size:12px;letter-spacing:.3em;color:${st.c1}">PORTAVENTURA · ${esc(st.name.toUpperCase())}</div><h2 style="font-size:34px;margin:14px 0 4px;color:#fff">${esc(cv.name)}</h2>${st.live?`<div style="font-size:15px;color:${st.ink};margin-bottom:10px">${esc(cv.sub)}</div>`:''}${body}</div></div>`;
 const here=pane.querySelector('.xpace-here');
 const abrir=()=>{pane.innerHTML='';const f=document.createElement('iframe');f.title='PortAventura · '+cv.name;f.src=cv.here||cv.url;f.allow='fullscreen; autoplay; xr-spatial-tracking';f.allowFullscreen=true;f.style.cssText='position:absolute;inset:0;border:0;width:100%;height:100%;background:#000';pane.appendChild(f);const a=document.createElement('a');a.href=cv.url;a.target='_blank';a.rel='noopener';a.textContent=en?'Open ↗':'Abrir ↗';a.style.cssText=`position:absolute;top:10px;right:12px;z-index:2;padding:6px 10px;border:1px solid ${st.c1};border-radius:6px;background:rgba(7,8,13,.85);color:${st.ink};font:12px ui-monospace,monospace;text-decoration:none`;pane.appendChild(a);};
 // Neo 12-nov-2026: sin página intermedia; con un estilo vivo se carga el destino directamente (copia propia, incrustable).
 if(st.live)abrir();else if(here)here.onclick=abrir;
 try{const u=new URL(location.href);u.searchParams.set('xpace',PA_ID);u.searchParams.set('venue',cv.id);u.searchParams.set('style',st.id);history.replaceState(null,'',u.pathname+u.search+u.hash);}catch{}
}

function embedObjeto(cv){embedXpaceTwin('objetoPane','Objeto',OBJET_ID,cv,{set v(id){objetoChosen=id;},get v(){return objetoChosen;}});}
const $=id=>document.getElementById(id),select=$('projectSelector'),venueSelect=$('projectVenueSelector'),styleSelect=$('projectStyleSelector'),styleBox=$('topbarStyle'),chip=$('projectContextChip');
let storage;try{storage=sessionStorage;}catch{}
const leerMarca=k=>{try{return storage&&typeof storage.getItem==='function'?storage.getItem(k):null;}catch{return null;}};
const marcaLimite=()=>marcaQueLimita({marca:leerMarca('mb:marca'),manual:leerMarca('mb:manual')});
const nombreMarca=id=>{try{const a=window.AdmiraMarca&&window.AdmiraMarca.actual&&window.AdmiraMarca.actual();if(a&&a.id===id&&a.nombre)return a.nombre;}catch{}return id.charAt(0).toUpperCase()+id.slice(1);};
const client=new ProjectClient({storage}),chosenQuality=()=>document.querySelector('#visualQualityOptions [aria-pressed="true"]')?.dataset.visualMode;
const english=()=>document.documentElement.lang==='en',text=(en,es)=>english()?en:es;
const put=(id,value)=>{const n=$(id);if(n)n.textContent=value;};
// Elegir un Xpacio aplica ya su marca (Starbucks, Altadis; los demás son Admira) aunque falte el local.
function aplicarMarca(id){try{if(id&&window.AdmiraMarca&&typeof window.AdmiraMarca.aplicarProyecto==='function')window.AdmiraMarca.aplicarProyecto(id);}catch{}}
// Al elegir un Xpacio se entra en su primer local sin volver a elegir (Carlos, 24-oct-2026); el combo Local
// sirve para cambiar de local después. Solo si el proyecto no tiene ninguno se abre el combo vacío.
// En el combo Local sobra el nombre del Xpacio: «Starbucks Diagonal 634 · Barcelona» → «Diagonal 634 · Barcelona».
function nombreLocal(v){const n=String(v.name||''),pr=catalog.projects.find(p=>p.id===v.project_id),pre=pr?String(pr.name||'')+' ':'';return pre.trim()&&n.toLowerCase().startsWith(pre.toLowerCase())&&n.length>pre.length?n.slice(pre.length):n;}
function abrirLocal(){try{venueSelect.focus({preventScroll:true});if(typeof venueSelect.showPicker==='function')venueSelect.showPicker();}catch{}}
let venuesDe='',pendingProject='',chosenProject='',catalog={projects:[],venues:[]},mode=client.access||client.expired?'account':'demo',error='',busy=false,last='',popup;
function sceneId(){return new URL(location.href).searchParams.get('project')||projectContext(location.href,window.__xtancoVisualState?.()?.vertical).id;}
function currentId(){return pendingProject||chosenProject||sceneId();}
function currentVenue(project){if(project!==sceneId())return null;const p=new URL(location.href).searchParams;return catalog.venues.find(v=>v.project_id===project&&v.id===p.get('venue'))||catalog.venues.find(v=>v.project_id===project&&new URL(v.xpace_url).searchParams.get('loc')===p.get('loc'));}
function draw(){
 const marca=marcaLimite(),visibles=proyectosPermitidos(marca,catalog.projects),limitado=visibles.length<catalog.projects.length;
 const id=currentId(),project=visibles.find(p=>p.id===id),venue=project?currentVenue(id):null;
 const stamp=JSON.stringify([catalog,mode,error,busy,english(),id,sceneId(),venue?.id,marca]);if(stamp===last)return;last=stamp;
 put('projectSelectorLabel',text('Projects · AdmiraNext','Proyectos · AdmiraNext'));put('projectVenueLabel',text('Venue','Local'));
 select.replaceChildren(new Option(text('Choose a Xpace','Escoge un Xpacio'),''));
 for(const p of visibles){const o=new Option(p.name,p.id);select.add(o);}if(visibles.length){select.add(new Option(COMPUTER_PROJECT.name,COMPUTER_ID));select.add(new Option(OBJET_PROJECT.name,OBJET_ID));select.add(new Option(PA_PROJECT.name,PA_ID));}select.value=pendingProject===COMPUTER_ID||pendingProject===OBJET_ID||pendingProject===PA_ID?pendingProject:(project?.id||'');select.disabled=busy||!visibles.length;
 // Con una marca que limita y una escena de otro proyecto, los locales son los de la marca (si es uno solo).
 venuesDe=project?project.id:(limitado&&visibles.length===1?visibles[0].id:(limitado?'':id));
 if(pendingProject===COMPUTER_ID)venuesDe=COMPUTER_ID;if(pendingProject===OBJET_ID)venuesDe=OBJET_ID;if(pendingProject===PA_ID)venuesDe=PA_ID;
 venueSelect.replaceChildren(new Option(text('Choose a venue','Escoge un local'),''));if(venuesDe===COMPUTER_ID)for(const v of COMPUTER_VENUES)venueSelect.add(new Option(v.name,v.id));if(venuesDe===OBJET_ID)for(const v of OBJET_VENUES)venueSelect.add(new Option(v.name,v.id));if(venuesDe===PA_ID)for(const v of PA_VENUES)venueSelect.add(new Option(v.name,v.id));for(const v of catalog.venues.filter(v=>v.project_id===venuesDe))venueSelect.add(new Option(nombreLocal(v),v.id));venueSelect.value=venuesDe===COMPUTER_ID?computerChosen:venuesDe===OBJET_ID?objetoChosen:venuesDe===PA_ID?paChosen:(venue?.id||'');venueSelect.disabled=venuesDe===COMPUTER_ID||venuesDe===OBJET_ID||venuesDe===PA_ID?false:busy||venueSelect.options.length<2;
 if(styleSelect&&styleBox){const on=venuesDe===PA_ID;styleBox.hidden=!on;if(on){styleSelect.replaceChildren();for(const x of PA_STYLES)styleSelect.add(new Option(x.live?x.name:x.name+' · '+text('soon','próximamente'),x.id));styleSelect.value=paStyle;}}
 chip.textContent=(catalog.projects.find(p=>p.id===sceneId())?.name||text('Choose project','Elegir proyecto'))+(mode==='demo'?' · Demo':'');chip.title=chip.textContent;
 $('projectVenueName').textContent=venue?.name||'—';
 const aviso=limitado?' · '+text(`${nombreMarca(marca)} brand: only its projects · /marca off shows them all`,`Marca ${nombreMarca(marca)}: sólo sus proyectos · /marca off los muestra todos`):'';
 $('projectSelectionStatus').textContent=(error||(mode==='demo'?text('Public demos · no account permissions','Demos públicas · sin permisos de cuenta'):!project?text('Choose one of your permitted projects','Escoge uno de tus proyectos autorizados'):!catalog.venues.some(v=>v.project_id===id)?text('No associated venue. Manage it in AdmiraNext.','Sin local asociado. Gestiónalo en AdmiraNext.'):text('Authorized venues · AdmiraNext','Locales autorizados · AdmiraNext')))+(error?'':aviso);
 $('projectConnect').textContent=text('Connect with AdmiraNext','Conectar con AdmiraNext');$('projectConnect').disabled=busy;
 $('projectDisconnect').hidden=mode!=='account';$('projectDisconnect').textContent=text('Disconnect','Desconectar');
 $('projectDemos').hidden=mode==='demo';$('projectDemos').textContent=text('View public demos','Ver demos públicas');
 $('projectRefresh').textContent=text('Refresh','Actualizar');$('projectRefresh').disabled=busy;
 $('projectBackofficeLink').textContent=text('Manage projects and venues ↗','Gestionar proyectos y locales ↗');
 // El estado (marca que limita, demos públicas, errores) también al pasar el ratón por los combos.
 select.title=venueSelect.title=$('projectSelectionStatus').textContent;
 const controls=document.querySelector('#visualQualityOptions .visual-tier-controls');
 if(mode==='demo'&&project&&!pendingProject&&window.__xtancoVisualTiers&&controls?.getAttribute('aria-busy')==='false'){const u=new URL(location.href);u.searchParams.set('project',project.id);u.searchParams.set('circuit',project.circuit);const quality=chosenQuality();if(quality){u.searchParams.delete('visual');u.searchParams.set('quality',quality);}if(u.href!==location.href)history.replaceState(history.state,'',u);}
}
async function load(){busy=true;error='';draw();try{catalog=mode==='account'?await client.context():await client.demos();}catch(e){pendingProject='';catalog={projects:[],venues:[]};error=e.message==='SESSION_EXPIRED'?text('Connection expired or revoked. Reconnect with AdmiraNext.','Conexión caducada o revocada. Reconecta con AdmiraNext.'):text('AdmiraNext is unavailable. Your selection has not changed.','AdmiraNext no está disponible. Tu selección no ha cambiado.');}finally{busy=false;last='';draw();}}
async function navigate(projectId,venueId){busy=true;draw();try{if(mode==='account')catalog=await client.context();const project=proyectosPermitidos(marcaLimite(),catalog.projects).find(p=>p.id===projectId),venues=catalog.venues.filter(v=>v.project_id===projectId);if(!project)throw Error('SESSION_EXPIRED');const venue=venues.find(v=>v.id===venueId)||venues[0]||null;if(!venue){pendingProject=project.id;error=venues.length?text('Choose the venue to open.','Escoge el local que quieres abrir.'):text('This project has no associated venue.','Este proyecto no tiene un local asociado.');return;}chosenProject=project.id;const href=venueUrl(location.href,venue,project,chosenQuality(),{publicDemo:mode==='demo',language:english()?'en':'es'});try{const dest=new URL(href);const id=dest.searchParams.get('loc')==='alsea-sbux-021'?'starbucks':(dest.searchParams.get('project')||'');if(id&&window.AdmiraMarca&&typeof window.AdmiraMarca.aplicarProyecto==='function')window.AdmiraMarca.aplicarProyecto(id);if(id&&typeof window.dispatchEvent==='function')window.dispatchEvent(new CustomEvent('xpaceos:project-change',{detail:{id}}));}catch(err){}location.assign(await conPuerta(venue,href));}catch(e){if(e.message==='SESSION_EXPIRED'){catalog={projects:[],venues:[]};pendingProject='';}error=e.message==='SESSION_EXPIRED'?text('Access changed. Reconnect with AdmiraNext.','El acceso ha cambiado. Reconecta con AdmiraNext.'):text('Unable to verify the selected venue.','No se pudo verificar el local seleccionado.');}finally{busy=false;last='';draw();}}
select.addEventListener('change',()=>{const id=select.value;if(!id)return;if(id===COMPUTER_ID||id===OBJET_ID||id===PA_ID){pendingProject=id;last='';draw();abrirLocal();return;}hideTwinPanes();aplicarMarca(id);navigate(id).then(()=>{if(pendingProject===id)abrirLocal();});});venueSelect.addEventListener('change',()=>{const cv=venuesDe===COMPUTER_ID&&computerVenue(venueSelect.value);if(cv){embedComputer(cv);last='';draw();return;}const ov=venuesDe===OBJET_ID&&objetoVenue(venueSelect.value);if(ov){embedObjeto(ov);last='';draw();return;}const pv=venuesDe===PA_ID&&paVenue(venueSelect.value);if(pv){embedPortaventura(pv);last='';draw();return;}if(venueSelect.value){hideTwinPanes();navigate(venuesDe||select.value,venueSelect.value);}});
if(styleSelect&&styleSelect.addEventListener)styleSelect.addEventListener('change',()=>{paStyle=paStyleOf(styleSelect.value).id;const pv=paVenue(paChosen);if(pv)embedPortaventura(pv);last='';draw();});
$('projectRefresh').onclick=load;
$('projectDisconnect').onclick=async()=>{await client.disconnect();pendingProject='';catalog={projects:[],venues:[]};error=text('Disconnected. Reconnect or choose public demos.','Desconectado. Reconecta o elige demos públicas.');last='';draw();};
$('projectDemos').onclick=async()=>{await client.disconnect();mode='demo';await load();};
let cancelConnection=null;
$('projectConnect').onclick=()=>{
 if(cancelConnection){cancelConnection();cancelConnection=null;error=text('Connection cancelled.','Conexión cancelada.');last='';draw();return;}
 cancelConnection=connectCentral(client,{onWaiting(){error=text('Complete the login in AdmiraNext. Press Connect again to cancel.','Completa el login en AdmiraNext. Pulsa Conectar otra vez para cancelar.');last='';draw();},onComplete(){cancelConnection=null;mode='account';load();},onError(e){cancelConnection=null;error=e.message==='POPUP_BLOCKED'?text('Allow the login window.','Permite abrir la ventana de login.'):text('Unable to connect. You can try again.','No se pudo conectar. Puedes volver a intentarlo.');last='';draw();}});
};
chip.addEventListener('click',()=>{select.focus({preventScroll:true});try{if(typeof select.showPicker==='function')select.showPicker();}catch{}});
window.addEventListener('xpaceos:project-change',()=>{last='';draw();});try{document.addEventListener('admira:marca',()=>{last='';draw();});}catch{}window.addEventListener('resize',draw);new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
setInterval(()=>{if(mode==='account'&&client.access&&!validAccess(client.access)){client.clear();pendingProject='';catalog={projects:[],venues:[]};error=text('Connection expired. Reconnect with AdmiraNext.','Conexión caducada. Reconecta con AdmiraNext.');}draw();},1000);
try{const q=new URL(location.href).searchParams;const cv=q.get('xpace')===COMPUTER_ID&&computerVenue(q.get('venue'));if(cv){pendingProject=COMPUTER_ID;embedComputer(cv);}const ov=q.get('xpace')===OBJET_ID&&objetoVenue(q.get('venue'));if(ov){pendingProject=OBJET_ID;embedObjeto(ov);}if(q.get('xpace')===PA_ID&&q.get('style'))paStyle=paStyleOf(q.get('style')).id;const pv=q.get('xpace')===PA_ID&&paVenue(q.get('venue'));if(pv){pendingProject=PA_ID;embedPortaventura(pv);}}catch{}
load();
