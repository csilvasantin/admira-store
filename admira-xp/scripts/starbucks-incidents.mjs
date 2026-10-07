import {interfaceTranslator} from './interface-language.mjs?v=options-language-1';
import {attachFloatingPanel} from './floating-panels.mjs?v=windows-menu-1';
export const STARBUCKS_STORE='starbucks-alsea-paseo-de-gracia';
export function incidentPayload({equipo,problema='',gravedad='alta',demo=false,resolve=false,uuid=crypto.randomUUID()}){
 if(!/^(pantalla-[1-6]|tpv|PDG103-IPAD-01)$/.test(equipo))throw Error('Equipo inválido / Invalid device');if(!['urgente','alta','normal','baja'].includes(gravedad))throw Error('Gravedad inválida / Invalid severity');
 if(!demo&&!problema.trim())throw Error('Describe el problema / Describe the problem');
 const resource='demo:'+STARBUCKS_STORE+':'+equipo+(demo?'':':manual:'+uuid);
 return {subject:'Starbucks Paseo de Gracia 103 · '+(demo?'Pantalla '+equipo.replace('pantalla-','')+' sin señal (desenchufada)':equipo+' · '+problema.slice(0,120)),resource,kind:'screen',severity:gravedad,source:demo?'xpaceos-demo':'xpaceos-manual',project_id:'xpaceos',loc:'Starbucks Alsea · Paseo de Gracia 103',detail:problema,by:'XpaceOS Matrix',...(resolve?{resolve:true}:{})};
}
export async function sendIncident(args,fetcher=fetch){const payload=incidentPayload(args);const response=await fetcher('https://api.yokup.com/incident',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let data;try{data=await response.json();}catch{throw Error('Respuesta inválida de Yokup / Invalid Yokup response');}if(!response.ok||!data.ok)throw Error(data.error||'Yokup HTTP '+response.status);return {...data,resource:payload.resource};}
// Cerrar incidencia desde el gemelo (Carlos, 7-oct-2026): POST /incident {close:true} — carril público sólo para recursos demo:,
// idempotente; si la lleva un técnico del portal responde 409 y se cierra allí con evidencia.
export async function closeIncident({id='',resource='',note='',by='admira.store · XpaceOS Matrix'}={},fetcher=fetch){if(!id&&!equipoFromResource(resource))throw Error('Incidencia inválida / Invalid incident');const response=await fetcher('https://api.yokup.com/incident',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({close:true,id,resource,by,note:String(note||'').slice(0,500)})});let data;try{data=await response.json();}catch{throw Error('Respuesta inválida de Yokup / Invalid Yokup response');}if(!response.ok||!data.ok){const e=Error(data.error||'Yokup HTTP '+response.status);e.status=response.status;e.data=data;throw e;}return data;}
// Vuelta del ciclo Yokup → gemelo (DEC-munpe1fhy7kq): el estado del ticket se pinta sobre la pantalla.
export const YOKUP_STATUS_URL='https://api.yokup.com/incident/status',STATUS_POLL_MS=15000,CLOSED_VISIBLE_MS=10*60000,CLOSED_RESUME_MS=5000;
export function equipoFromResource(resource){const m=/^demo:([^:]+):(pantalla-[1-6]|tpv|PDG103-IPAD-01)(?::|$)/.exec(String(resource||''));return m&&m[1]===STARBUCKS_STORE?m[2]:null;}
export async function fetchIncidentStatus(ids=[],fetcher=fetch){const q=new URLSearchParams({prefix:'demo:'+STARBUCKS_STORE+':'});if(ids.length)q.set('ids',ids.slice(-20).join(','));const response=await fetcher(YOKUP_STATUS_URL+'?'+q,{cache:'no-store'});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.error||'Yokup HTTP '+response.status);return data;}
// Detalle en Yokup (Carlos, 01-10-2026): pulsar la pantalla averiada abre la FICHA de su incidencia
// (www.yokup.com/ticket?id=INC-…), no el listado genérico. Sin id válido se queda en /incidencias.
export const YOKUP_INCIDENTS_URL='https://www.yokup.com/incidencias',YOKUP_TICKET_URL='https://www.yokup.com/ticket?id=';
export function incidentDetailUrl(id){const v=String(id||'').trim();return /^[A-Z]{3}-[A-Z0-9]{4,10}$/.test(v)?YOKUP_TICKET_URL+encodeURIComponent(v):YOKUP_INCIDENTS_URL;}
// Por equipo: la incidencia activa más reciente; si no hay, la última cerrada hace menos de 10 min.
export function pickIncidentPerDevice(incidents,now=Date.now()){const out=new Map();for(const inc of incidents||[]){const equipo=equipoFromResource(inc.resource);if(!equipo||inc.stage==='cancelada')continue;const closed=inc.stage==='cerrada';if(closed&&now-(inc.resolved_at||0)>CLOSED_VISIBLE_MS)continue;const prev=out.get(equipo);const rank=i=>(i.stage==='cerrada'?0:1)*1e15+(i.created_at||0);if(!prev||rank(inc)>rank(prev))out.set(equipo,inc);}return out;}
const clock=ms=>{const s=Math.max(0,Math.round(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(r).padStart(2,'0');};
export function chipModel(inc,now=Date.now(),lang='es'){const t=(es,en)=>lang==='en'?en:es,sla=inc.sla||{},stageText={abierta:t('ABIERTA','OPEN'),en_curso:t('EN CURSO','IN PROGRESS'),recuperada:t('RECUPERADA','RECOVERED'),cerrada:t('CERRADA','CLOSED')}[inc.stage]||inc.stage.toUpperCase(),prio={urgente:t('URGENTE','URGENT'),alta:t('ALTA','HIGH'),normal:'NORMAL',baja:t('BAJA','LOW')}[inc.priority]||'';
 const lines=[inc.id,stageText+(prio?' · '+prio:''),t('Técnico: ','Technician: ')+(inc.assignee||'—')];let tone=inc.stage==='cerrada'?'ok':inc.stage==='abierta'?'alert':'warn';
 if(inc.stage==='cerrada'){lines.push(sla.resolution_ok===false||sla.response_ok===false?t('Cerrada fuera de SLA','Closed outside SLA'):t('Cerrada en SLA ✓','Closed within SLA ✓'));if(inc.closed_by||inc.resolved_at)lines.push(t('Cerrada por ','Closed by ')+(inc.closed_by||'Yokup')+(inc.resolved_at?' · '+new Date(inc.resolved_at).toLocaleTimeString(lang==='en'?'en-GB':'es-ES',{hour:'2-digit',minute:'2-digit'}):''));if(inc.resolution)lines.push('«'+String(inc.resolution).slice(0,80)+'»');lines.push(t('Vuelve a emitir en unos segundos','Resuming playback in a few seconds'));}
 else if(inc.stage==='recuperada')lines.push(t('Señal recuperada · falta verificar en Yokup','Signal back · pending verification in Yokup'));
 else{const responding=!sla.responded_at,due=responding?sla.response_due:sla.resolution_due,label=responding?t('Respuesta ≤ ','Response ≤ ')+sla.response_min+' min':t('Resolución ≤ ','Resolution ≤ ')+Math.round(sla.resolution_min/60)+' h',left=(due||0)-now;if(left<0)tone='alert';lines.push(label+' · '+(left>=0?t('quedan ','left ')+clock(left):t('fuera de SLA +','SLA breached +')+clock(-left)));}
 return {tone,lines};}
export function mountIncidentPanel({root,surface=root,lang='es',devices,onPower,nodeFor=()=>null,fetcher=(...a)=>fetch(...a)}){
 const copy=interfaceTranslator(),t=copy.t,off=new Set(),tracked=new Map(),dismissed=new Map();let statusData=[],pollTimer=0,tickTimer=0,lastKey=0,lastPointer=0;const closedSeen=new Map(),chipKey=new WeakMap();
 try{for(const [k,v] of Object.entries(JSON.parse(localStorage.getItem('xpaceos.starbucks.tickets.v1')||'{}')))if(/^[A-Z]{3}-[A-Z0-9]{4,10}$/.test(k))tracked.set(k,Number(v)||Date.now());}catch{}let target=devices[0].id,busy=false,manualId=crypto.randomUUID();
 try{for(const id of JSON.parse(localStorage.getItem('xpaceos.starbucks.off.v1')||'[]'))if(devices.some(d=>d.id===id))off.add(id);}catch{}
 try{for(const [id,at] of Object.entries(JSON.parse(localStorage.getItem('xpaceos.starbucks.dismissed.v1')||'{}')))dismissed.set(id,Number(at)||0);}catch{}
 const panel=document.createElement('section');panel.className='matrix-device-editor matrix-incident-editor';panel.hidden=true;panel.innerHTML=`<header><strong>${t('Incidencia · Starbucks','Incident · Starbucks')}</strong><button type="button" data-incident="close">×</button></header><label>${t('Equipo','Device')}<select class="incident-device"></select></label><button type="button" data-incident="power"></button><p>${t('Demo: desenchufar abre una incidencia; enchufar comunica su recuperación.','Demo: unplugging opens an incident; plugging back in reports recovery.')}</p><label>${t('¿Qué problema hay?','What is the problem?')}<textarea class="incident-problem" rows="3" maxlength="5000"></textarea></label><label>${t('Gravedad','Severity')}<select class="incident-severity"><option value="urgente">${t('Urgente','Urgent')}</option><option value="alta" selected>${t('Alta','High')}</option><option value="normal">Normal</option><option value="baja">${t('Baja','Low')}</option></select></label><button type="button" data-incident="send">${t('Abrir ticket','Open ticket')}</button><div class="incident-close" hidden><p class="incident-current"></p><label>${t('Nota de resolución (opcional)','Resolution note (optional)')}<textarea class="incident-close-note" rows="2" maxlength="500"></textarea></label><button type="button" data-incident="resolve">${t('Cerrar incidencia','Close incident')}</button></div><p class="incident-result" role="status"></p><small>${t('Se registra en la bandeja de campo de Yokup.','This creates an entry in the Yokup field inbox.')}</small>`;root.append(panel);
 const select=panel.querySelector('.incident-device'),problem=panel.querySelector('textarea'),severity=panel.querySelector('.incident-severity'),result=panel.querySelector('.incident-result'),power=panel.querySelector('[data-incident=power]'),abort=new AbortController(),opts={signal:abort.signal};for(const d of devices)select.add(new Option(d.name,d.id));
 const closeButton=panel.querySelector('[data-incident="close"]');closeButton.setAttribute('aria-label',t('Cerrar panel','Close panel'));const closeBox=panel.querySelector('.incident-close'),closeNote=panel.querySelector('.incident-close-note'),currentText=panel.querySelector('.incident-current');
 const floating=attachFloatingPanel(panel,{label:t('Incidencia · Starbucks','Incident · Starbucks'),handle:panel.querySelector('header'),closeButton,bounds:surface,key:'xpaceos.window.matrix-incidents.v1',menu:'matrix-incidents',onOpen:()=>{if(abort.signal.aborted)return;panel.hidden=false;refresh();}});
for(const event of ['pointerdown','pointerup','click','keydown','keyup','keypress','input','beforeinput','wheel'])panel.addEventListener(event,e=>{if(event==='keydown')lastKey=Date.now();if(event==='pointerdown')lastPointer=Date.now();e.stopPropagation();},opts);
  // Escribir sin cortes (Carlos, 7-oct-2026): si algo del gemelo roba el foco mientras se teclea en el panel
  // (sondeo, pintado de tarjetas, foco del avatar…), se devuelve al campo con su texto y su cursor.
  doc0().addEventListener('pointerdown',()=>{lastPointer=Date.now();},{...opts,capture:true});
  for(const field of panel.querySelectorAll('textarea,input'))field.addEventListener('blur',e=>{if(panel.hidden||busy||abort.signal.aborted)return;const to=e.relatedTarget;if(to&&panel.contains(to))return;const now=Date.now();if(now-lastPointer<400||now-lastKey>1500)return;const a=field.selectionStart,b=field.selectionEnd;setTimeout(()=>{if(panel.hidden||doc0().activeElement===field)return;const act=doc0().activeElement;if(act&&act!==doc0().body&&act.matches?.('input,textarea,select,[contenteditable=true]')&&!panel.contains(act))return;field.focus({preventScroll:true});try{field.setSelectionRange(a,b);}catch{}},0);},opts);
 const activeFor=id=>{const d=devices.find(x=>x.id===id),inc=d&&pickIncidentPerDevice(statusData).get(d.equipo);return inc&&!['cerrada','cancelada'].includes(inc.stage)?inc:null;};
const refresh=()=>{if(doc0().activeElement!==select)select.value=target;power.textContent=off.has(target)?t('Enchufar','Plug in'):t('Desenchufar','Unplug');const inc=activeFor(target);closeBox.hidden=!inc;if(inc)currentText.textContent=inc.id+' · '+(chipModel(inc,Date.now(),document.documentElement.lang).lines[1]||'');};
 function setPower(id,value){value?off.add(id):off.delete(id);localStorage.setItem('xpaceos.starbucks.off.v1',JSON.stringify([...off]));onPower(id,value);refresh();}
 select.addEventListener('change',()=>{target=select.value;refresh();},opts);
 panel.addEventListener('click',async e=>{const action=e.target.closest('[data-incident]')?.dataset.incident;if(action==='close'){panel.hidden=true;return;}
  if(action==='resolve'&&!busy){const inc=activeFor(target);if(!inc)return;if(!confirm(t('¿Cerrar la incidencia ','Close incident ')+inc.id+'?'))return;busy=true;for(const b of panel.querySelectorAll('button'))b.disabled=true;result.textContent=t('Cerrando…','Closing…');
   try{const data=await closeIncident({id:inc.id,resource:inc.resource,note:closeNote.value});closeNote.value='';if(off.has(target))setPower(target,false);track(data.id);await poll();result.textContent=data.applied===false?t('Ya estaba cerrada · ','Already closed · ')+data.id:'✓ '+data.id+' · '+t('cerrada','closed');}
   catch(error){result.textContent=t('No cerrada: ','Not closed: ')+error.message;}finally{busy=false;for(const b of panel.querySelectorAll('button'))b.disabled=false;refresh();}return;}
  if(busy||!['power','send'].includes(action))return;const d=devices.find(d=>d.id===target);busy=true;for(const b of panel.querySelectorAll('button'))b.disabled=true;result.textContent=t('Enviando…','Sending…');
  try{const demo=action==='power',resolve=demo&&off.has(d.id);const data=await sendIncident({equipo:d.equipo,problema:problem.value,gravedad:severity.value,demo,resolve,uuid:manualId});if(demo)setPower(d.id,!resolve);else{manualId=crypto.randomUUID();problem.value='';}track(data.id||data.resolved);poll();const a=document.createElement('a');a.href=incidentDetailUrl(data.id);a.target='_blank';a.rel='noopener';a.textContent=(data.id||data.resolved||t('Resuelta','Resolved'))+' · Yokup';result.replaceChildren(a);
  }catch(error){result.textContent=t('No enviado: ','Not sent: ')+error.message;}finally{busy=false;for(const b of panel.querySelectorAll('button'))b.disabled=false;refresh();}
 },opts);refresh();
function doc0(){return root.ownerDocument||document;}
 // La tarjeta nunca se sale del marco: si el texto desborda se reduce --fit hasta que quepa (mínimo 45 %).
 function fitChip(chip){if(!chip.isConnected||!chip.clientHeight)return false;let fit=1;chip.style.setProperty('--fit','1');while(fit>0.45&&(chip.scrollHeight>chip.clientHeight+1||chip.scrollWidth>chip.clientWidth+1)){fit=Math.round((fit-0.07)*100)/100;chip.style.setProperty('--fit',String(fit));}return true;}
 // Volver a emitir: si el navegador bloquea el autoplay con sonido, la pantalla sigue en silencio.
 function resumeMedia(node){if(!node)return;setTimeout(()=>{for(const v of node.querySelectorAll('video')){if(!v.paused||!(v.currentSrc||v.getAttribute('src')))continue;const p=v.play();if(p&&p.catch)p.catch(()=>{v.muted=true;v.play()?.catch?.(()=>{});});}},400);}
 function track(id){if(!id)return;tracked.set(id,Date.now());while(tracked.size>20)tracked.delete(tracked.keys().next().value);try{localStorage.setItem('xpaceos.starbucks.tickets.v1',JSON.stringify(Object.fromEntries(tracked)));}catch{}}
 function resumeClosed(id,inc){
  if(inc.stage!=='cerrada')return;
setPower(id,false);
  resumeMedia(nodeFor(id));
  dismissed.set(inc.id,inc.resolved_at||0);closedSeen.delete(inc.id);
  while(dismissed.size>50)dismissed.delete(dismissed.keys().next().value);
  try{localStorage.setItem('xpaceos.starbucks.dismissed.v1',JSON.stringify(Object.fromEntries(dismissed)));}catch{}
  paint();
 }
function paint(){const now=Date.now(),picked=pickIncidentPerDevice(statusData,now),resumes=[];for(const d of devices){
  const node=nodeFor(d.id);if(!node)continue;let chip=node.querySelector(':scope>.matrix-incident-chip');const inc=picked.get(d.equipo);
if(!inc||(inc.stage==='cerrada'&&dismissed.get(inc.id)===(inc.resolved_at||0))){chip?.remove();node.querySelector(':scope>.matrix-incident-quickclose')?.remove();continue;}
  // Cerrada → la tarjeta verde se ve ~5 s y la pantalla vuelve sola a emitir (sin esperar un clic).
  if(inc.stage==='cerrada'){if(!closedSeen.has(inc.id))closedSeen.set(inc.id,now);if(now-closedSeen.get(inc.id)>=CLOSED_RESUME_MS){resumes.push([d.id,inc]);continue;}}
  if(!chip){
chip=document.createElement('a');chip.className='matrix-incident-chip';chip.dataset.i18nLive='';chip.target='_blank';chip.rel='noopener';
   for(const ev of ['pointerdown','pointerup','click','keydown'])chip.addEventListener(ev,e=>e.stopPropagation(),opts);
   const activate=e=>{const current=pickIncidentPerDevice(statusData).get(d.equipo);if(current?.stage==='cerrada'){e.preventDefault();resumeClosed(d.id,current);}};
   chip.addEventListener('click',activate,opts);
   chip.addEventListener('keydown',e=>{if(chip.dataset.stage==='cerrada'&&['Enter',' '].includes(e.key))activate(e);},opts);
   node.append(chip);
  }
  const closed=inc.stage==='cerrada';
  let quick=node.querySelector(':scope>.matrix-incident-quickclose');if(!closed&&!quick){quick=document.createElement('button');quick.type='button';quick.className='matrix-incident-quickclose';quick.textContent=t('✓ Cerrar incidencia','✓ Close incident');for(const ev of ['pointerdown','pointerup','keydown'])quick.addEventListener(ev,e=>e.stopPropagation(),opts);quick.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();target=d.id;floating.open();refresh();closeNote.focus();},opts);node.append(quick);}else if(closed&&quick)quick.remove();
  if(closed){chip.removeAttribute('href');chip.setAttribute('role','button');chip.tabIndex=0;}
  else{chip.href=incidentDetailUrl(inc.id);chip.removeAttribute('role');chip.removeAttribute('tabindex');}
  const model=chipModel(inc,now,document.documentElement.lang);if(closed){const left=Math.max(1,Math.ceil((CLOSED_RESUME_MS-(now-closedSeen.get(inc.id)))/1000));model.lines[model.lines.length-1]=t('Vuelve a emitir en ','Resuming playback in ')+left+' s';}
  if(chip.dataset.tone!==model.tone)chip.dataset.tone=model.tone;if(chip.dataset.stage!==inc.stage)chip.dataset.stage=inc.stage;
  const title=(inc.subject||inc.id)+(closed?' · '+t('Pulsa para volver a emitir ya','Click to resume playback now'):' · '+t('Abrir la ficha en Yokup','Open the ticket in Yokup'));if(chip.title!==title)chip.title=title;
  // Sólo se toca el DOM si cambia algo (antes se reescribía cada segundo y el panel iba a saltos al teclear).
  const prev=chipKey.get(chip)||[];if(prev.length!==model.lines.length||chip.children.length!==model.lines.length){chip.replaceChildren(...model.lines.map((line,i)=>{const el=document.createElement(i?'span':'strong');el.textContent=line;return el;}));}
  else model.lines.forEach((line,i)=>{if(prev[i]!==line)chip.children[i].textContent=line;});chipKey.set(chip,model.lines);
  const note=inc.resolution?'«'+String(inc.resolution).slice(0,80)+'»':'';for(const el of chip.children)el.classList.toggle('matrix-incident-note',!!note&&el.textContent===note);
  // Encaje: sólo se recalcula si cambia la forma del texto (no cada segundo de la cuenta atrás).
  const shape=model.lines.map(l=>l.replace(/\d/g,'0')).join('\n');if(chip.dataset.fitShape!==shape&&fitChip(chip))chip.dataset.fitShape=shape;
 }
 for(const [id,inc] of resumes)resumeClosed(id,inc);}
 async function poll(){clearTimeout(pollTimer);if(abort.signal.aborted)return;try{const data=await fetchIncidentStatus([...tracked.keys()],fetcher);statusData=data.incidents||[];if(!panel.hidden&&!busy)refresh();const now=Date.now();for(const inc of statusData)if(inc.stage==='cerrada'&&now-(inc.resolved_at||0)>CLOSED_VISIBLE_MS&&tracked.delete(inc.id))try{localStorage.setItem('xpaceos.starbucks.tickets.v1',JSON.stringify(Object.fromEntries(tracked)));}catch{}paint();}catch{}pollTimer=setTimeout(poll,document.hidden?STATUS_POLL_MS*4:STATUS_POLL_MS);}
 tickTimer=setInterval(()=>{if(statusData.length)paint();},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();},opts);abort.signal.addEventListener('abort',()=>{clearTimeout(pollTimer);clearInterval(tickTimer);for(const d of devices){nodeFor(d.id)?.querySelector(':scope>.matrix-incident-chip')?.remove();nodeFor(d.id)?.querySelector(':scope>.matrix-incident-quickclose')?.remove();}});poll();
 const stopLanguage=copy.observe(panel);
 // ── Demo guiada desde la CLI del modo experto (/crear incidencia · /cerrar incidencia, Carlos 7-oct-2026) ──
 // Todo se ve: el panel se abre, el motivo se escribe letra a letra, se pulsa «Abrir ticket»; al cerrar se pulsa
 // la tarjeta (el enlace a la ficha), se abre la ficha de admira.app y se finaliza con nota por el carril real.
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function typeInto(field,text,total=1800){field.focus({preventScroll:true});field.value='';const step=Math.max(8,Math.min(45,Math.round(total/Math.max(1,text.length))));for(const ch of text){if(abort.signal.aborted)return;field.value+=ch;await wait(step);}field.dispatchEvent(new Event('input',{bubbles:true}));}
 function press(el){el?.classList.add('is-demo-press');setTimeout(()=>el?.classList.remove('is-demo-press'),700);}
 let ficha=null;
 // La ficha es un <dialog> modal: va a la capa superior (top layer), por encima del menú ☰, del dock experto y
 // del propio Matrix, a la derecha para no tapar la pantalla que se está cerrando (Carlos, r46: se abría detrás).
 function fichaPanel(){if(!(ficha&&ficha.isConnected)){ficha=document.createElement('dialog');ficha.className='matrix-device-editor matrix-incident-editor matrix-ficha';ficha.dataset.i18nLive='';ficha.setAttribute('aria-label','admira.app · ficha');
   for(const ev of ['pointerdown','pointerup','click','keydown','keyup','keypress','input','wheel'])ficha.addEventListener(ev,e=>e.stopPropagation(),opts);root.append(ficha);}
  if(!ficha.open){try{ficha.showModal();}catch{ficha.setAttribute('open','');}}return ficha;}
 function closeFicha(){if(!ficha)return;try{if(ficha.open)ficha.close();}catch{}ficha.remove();ficha=null;}
 function paintFicha(inc,{note='',phase=''}={}){const f=fichaPanel(),L=document.documentElement.lang==='en',tt=(es,en)=>L?en:es;const stage={abierta:tt('Abierta','Open'),en_curso:tt('En curso','In progress'),cerrada:tt('Finalizada','Finished'),recuperada:tt('Recuperada','Recovered')}[inc.stage]||inc.stage;const m=chipModel(inc,Date.now(),L?'en':'es');
  const time=v=>v?new Date(v).toLocaleTimeString(L?'en-GB':'es-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—';const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  f.innerHTML=`<header><strong>admira.app · ${tt('Ficha','Ticket')} ${esc(inc.id)}</strong><button type="button" data-ficha="close" aria-label="${tt('Cerrar ficha','Close ticket')}">×</button></header><p class="ficha-url">www.admira.app/ticket?id=${esc(inc.id)}</p><p class="ficha-stage" data-stage="${esc(inc.stage)}">${esc(stage)}</p><dl><dt>${tt('Asunto','Subject')}</dt><dd>${esc(inc.subject||inc.id)}</dd><dt>${tt('Prioridad','Priority')}</dt><dd>${esc(m.lines[1]||'')}</dd><dt>${tt('Técnico','Technician')}</dt><dd>${esc(inc.assignee||'—')}</dd><dt>${tt('Abierta','Opened')}</dt><dd>${time(inc.created_at)}</dd>${inc.stage==='cerrada'?`<dt>${tt('Finalizada','Finished')}</dt><dd>${time(inc.resolved_at)} · ${esc(inc.closed_by||'')}</dd><dt>${tt('Nota','Note')}</dt><dd>«${esc(inc.resolution||'')}»</dd>`:''}</dl>${inc.stage==='cerrada'?'':`<label>${tt('Nota de resolución','Resolution note')}<textarea class="ficha-note" rows="2" readonly>${esc(note)}</textarea></label><div class="ficha-actions"><button type="button" data-ficha="start" ${inc.stage==='abierta'?'':'disabled'}>▶ ${tt('Iniciar','Start')}</button><button type="button" data-ficha="finish">✓ ${tt('Finalizar','Finish')}</button></div>`}<p class="ficha-phase" role="status">${esc(phase)}</p><a href="https://www.admira.app/ticket?id=${encodeURIComponent(inc.id)}" target="_blank" rel="noopener">${tt('Abrir en admira.app ↗','Open in admira.app ↗')}</a>`;
  f.querySelector('[data-ficha="close"]').addEventListener('click',closeFicha,opts);f.hidden=false;return f;}
 const findInc=id=>statusData.find(i=>i.id===id)||null;
 async function freshInc(id){track(id);for(let i=0;i<8;i++){await poll();const inc=findInc(id);if(inc)return inc;await wait(800);}return findInc(id);}
 const demo={
  candidates(){return devices.filter(d=>/^pantalla-[2-6]$/.test(d.equipo)&&!off.has(d.id)&&!activeFor(d.id)).map(d=>d.id);},
  activeFor:id=>activeFor(id),
  stage:id=>findInc(id)?.stage||null,
  // Todas las incidencias activas de las pantallas del gemelo (no sólo las de la CLI), con su pantalla.
  async listOpen(){await poll();return statusData.filter(i=>i&&!['cerrada','cancelada'].includes(i.stage)&&equipoFromResource(i.resource)).map(i=>{const equipo=equipoFromResource(i.resource),d=devices.find(x=>x.equipo===equipo);return {id:i.id,stage:i.stage,priority:i.priority||'',assignee:i.assignee||'',created_at:i.created_at||0,resource:i.resource,equipo,deviceId:d?.id||null,name:d?.name||equipo,via:/:manual:cli-/.test(i.resource)?'cli':/:manual:/.test(i.resource)?'manual':'auto',url:incidentDetailUrl(i.id)};}).sort((a,b)=>(b.created_at||0)-(a.created_at||0));},
  async open({deviceId,problem:text,severity:sev='alta',uuid=crypto.randomUUID(),step=()=>{}}){
   const d=devices.find(x=>x.id===deviceId);if(!d)throw Error('Equipo inválido');if(activeFor(d.id))throw Error(t('Esa pantalla ya tiene una incidencia activa','That screen already has an active incident'));
   target=d.id;floating.open();refresh();step(t('Formulario «Incidencia · Starbucks» abierto en ','“Incident · Starbucks” form opened on ')+d.name);await wait(500);
   await typeInto(problem,text);severity.value=sev;severity.dispatchEvent(new Event('change',{bubbles:true}));step(t('Motivo escrito · gravedad ','Reason typed · severity ')+sev);await wait(400);
   const send=panel.querySelector('[data-incident="send"]');press(send);busy=true;for(const b of panel.querySelectorAll('button'))b.disabled=true;result.textContent=t('Enviando…','Sending…');
   try{const data=await sendIncident({equipo:d.equipo,problema:text,gravedad:sev,demo:false,uuid:'cli-'+uuid});problem.value='';track(data.id);const a=document.createElement('a');a.href=incidentDetailUrl(data.id);a.target='_blank';a.rel='noopener';a.textContent=data.id+' · Yokup';result.replaceChildren(a);step(t('«Abrir ticket» pulsado → ','“Open ticket” pressed → ')+data.id);await freshInc(data.id);return {id:data.id,resource:data.resource,deviceId:d.id,name:d.name};}
   finally{busy=false;for(const b of panel.querySelectorAll('button'))b.disabled=false;refresh();}
  },
  // Si algo falla a mitad, la ficha modal se cierra para no bloquear el gemelo.
  close(o){return demoClose(o).finally(closeFicha);},
  async __close({id,note,by='admira.store · XpaceOS Matrix · CLI',step=()=>{},hold=3000}){
   let inc=await freshInc(id);if(!inc)throw Error(t('No encuentro ','Cannot find ')+id);if(!equipoFromResource(inc.resource))throw Error(t('no es una incidencia de las pantallas de este gemelo','it is not an incident of this twin’s screens'));const d=devices.find(x=>x.equipo===equipoFromResource(inc.resource));
   if(inc.stage==='cerrada'||inc.stage==='cancelada')return {inc,already:true,deviceId:d?.id};
   const chip=d&&nodeFor(d.id)?.querySelector(':scope>.matrix-incident-chip');press(chip);step(t('Pulsada la tarjeta de la pantalla → ficha de ','Screen card pressed → ticket ')+id);await wait(700);
   let f=paintFicha(inc,{phase:t('Ficha abierta en admira.app','Ticket opened in admira.app')});await wait(900);
   if(inc.stage==='abierta'){press(f.querySelector('[data-ficha="start"]'));await fetcher('https://api.yokup.com/incident',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start:true,id,by})}).catch(()=>null);inc=await freshInc(id)||inc;f=paintFicha(inc,{phase:t('Iniciada · en curso','Started · in progress')});step(t('Ficha: ▶ Iniciar → EN CURSO','Ticket: ▶ Start → IN PROGRESS'));await wait(700);}
   const area=f.querySelector('.ficha-note');if(area)await typeInto(area,note,1600);step(t('Nota de resolución escrita','Resolution note typed'));await wait(300);
   press(f.querySelector('[data-ficha="finish"]'));let data;
   // 409: la lleva un técnico en el portal del comercio → no se fuerza; la ficha y la CLI dicen cómo cerrarla.
   try{data=await closeIncident({id,resource:inc.resource,note,by});}catch(e){if(e.status===409&&e.data?.portal_assigned){const tech=(/\(([^)]+)\)/.exec(e.data.error||'')||[])[1]||inc.assignee||'';paintFicha(inc,{phase:t('⚠ La lleva un técnico en el portal','⚠ Held by a technician in the portal')+(tech?' ('+tech+')':'')});step(t('Ficha: ✓ Finalizar → rechazado (técnico del portal)','Ticket: ✓ Finish → refused (portal technician)'));await wait(hold);const err=Error(t('la lleva un técnico en el portal del comercio','it is held by a technician in the store portal')+(tech?' ('+tech+')':''));err.code='portal_assigned';err.technician=tech;err.url=incidentDetailUrl(id);throw err;}throw e;}if(d&&off.has(d.id))setPower(d.id,false);
   for(let i=0;i<6;i++){inc=await freshInc(id)||inc;if(inc.stage==='cerrada')break;await wait(700);}
   paintFicha(inc,{phase:t('✓ Finalizada en admira.app','✓ Finished in admira.app')});step(t('Ficha: ✓ Finalizar → FINALIZADA','Ticket: ✓ Finish → FINISHED'));paint();await wait(hold);
   return {inc,applied:data.applied!==false,deviceId:d?.id};
  }
 };
 const demoClose=o=>demo.__close(o);
 return {off,paint,demo,open(id=target){target=id;floating.open();},get visible(){return !panel.hidden;},select(id){target=id;refresh();},close(){panel.hidden=true;},remote(id,value){setPower(id,value);},dispose(){stopLanguage();floating.dispose();abort.abort();panel.remove();}};
}
