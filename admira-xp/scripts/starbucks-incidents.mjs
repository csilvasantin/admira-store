import {interfaceTranslator} from './interface-language.mjs?v=options-language-1';
import {attachFloatingPanel} from './floating-panels.mjs?v=options-language-1';
export const STARBUCKS_STORE='starbucks-alsea-paseo-de-gracia';
export function incidentPayload({equipo,problema='',gravedad='alta',demo=false,resolve=false,uuid=crypto.randomUUID()}){
 if(!/^(pantalla-[1-6]|tpv)$/.test(equipo))throw Error('Equipo inválido / Invalid device');if(!['urgente','alta','normal','baja'].includes(gravedad))throw Error('Gravedad inválida / Invalid severity');
 if(!demo&&!problema.trim())throw Error('Describe el problema / Describe the problem');
 const resource='demo:'+STARBUCKS_STORE+':'+equipo+(demo?'':':manual:'+uuid);
 return {subject:'Starbucks Paseo de Gracia 103 · '+(demo?'Pantalla '+equipo.replace('pantalla-','')+' sin señal (desenchufada)':equipo+' · '+problema.slice(0,120)),resource,kind:'screen',severity:gravedad,source:demo?'xpaceos-demo':'xpaceos-manual',project_id:'xpaceos',loc:'Starbucks Alsea · Paseo de Gracia 103',detail:problema,by:'XpaceOS Matrix',...(resolve?{resolve:true}:{})};
}
export async function sendIncident(args,fetcher=fetch){const payload=incidentPayload(args);const response=await fetcher('https://api.yokup.com/incident',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let data;try{data=await response.json();}catch{throw Error('Respuesta inválida de Yokup / Invalid Yokup response');}if(!response.ok||!data.ok)throw Error(data.error||'Yokup HTTP '+response.status);return {...data,resource:payload.resource};}
// Vuelta del ciclo Yokup → gemelo (DEC-munpe1fhy7kq): el estado del ticket se pinta sobre la pantalla.
export const YOKUP_STATUS_URL='https://api.yokup.com/incident/status',STATUS_POLL_MS=15000,CLOSED_VISIBLE_MS=10*60000;
export function equipoFromResource(resource){const m=/^demo:([^:]+):(pantalla-[1-6]|tpv)(?::|$)/.exec(String(resource||''));return m&&m[1]===STARBUCKS_STORE?m[2]:null;}
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
 if(inc.stage==='cerrada'){lines.push(sla.resolution_ok===false||sla.response_ok===false?t('Cerrada fuera de SLA','Closed outside SLA'):t('Cerrada en SLA ✓','Closed within SLA ✓'));lines.push(t('Pulsa para volver a emitir','Click to resume playback'));}
 else if(inc.stage==='recuperada')lines.push(t('Señal recuperada · falta verificar en Yokup','Signal back · pending verification in Yokup'));
 else{const responding=!sla.responded_at,due=responding?sla.response_due:sla.resolution_due,label=responding?t('Respuesta ≤ ','Response ≤ ')+sla.response_min+' min':t('Resolución ≤ ','Resolution ≤ ')+Math.round(sla.resolution_min/60)+' h',left=(due||0)-now;if(left<0)tone='alert';lines.push(label+' · '+(left>=0?t('quedan ','left ')+clock(left):t('fuera de SLA +','SLA breached +')+clock(-left)));}
 return {tone,lines};}
export function mountIncidentPanel({root,surface=root,lang='es',devices,onPower,nodeFor=()=>null,fetcher=(...a)=>fetch(...a)}){
 const copy=interfaceTranslator(),t=copy.t,off=new Set(),tracked=new Map(),dismissed=new Map();let statusData=[],pollTimer=0,tickTimer=0;
 try{for(const [k,v] of Object.entries(JSON.parse(localStorage.getItem('xpaceos.starbucks.tickets.v1')||'{}')))if(/^[A-Z]{3}-[A-Z0-9]{4,10}$/.test(k))tracked.set(k,Number(v)||Date.now());}catch{}let target=devices[0].id,busy=false,manualId=crypto.randomUUID();
 try{for(const id of JSON.parse(localStorage.getItem('xpaceos.starbucks.off.v1')||'[]'))if(devices.some(d=>d.id===id))off.add(id);}catch{}
 try{for(const [id,at] of Object.entries(JSON.parse(localStorage.getItem('xpaceos.starbucks.dismissed.v1')||'{}')))dismissed.set(id,Number(at)||0);}catch{}
 const panel=document.createElement('section');panel.className='matrix-device-editor matrix-incident-editor';panel.hidden=true;panel.innerHTML=`<header><strong>${t('Incidencia · Starbucks','Incident · Starbucks')}</strong><button type="button" data-incident="close">×</button></header><label>${t('Equipo','Device')}<select class="incident-device"></select></label><button type="button" data-incident="power"></button><p>${t('Demo: desenchufar abre una incidencia; enchufar comunica su recuperación.','Demo: unplugging opens an incident; plugging back in reports recovery.')}</p><label>${t('¿Qué problema hay?','What is the problem?')}<textarea class="incident-problem" rows="3" maxlength="5000"></textarea></label><label>${t('Gravedad','Severity')}<select class="incident-severity"><option value="urgente">${t('Urgente','Urgent')}</option><option value="alta" selected>${t('Alta','High')}</option><option value="normal">Normal</option><option value="baja">${t('Baja','Low')}</option></select></label><button type="button" data-incident="send">${t('Abrir ticket','Open ticket')}</button><p class="incident-result" role="status"></p><small>${t('Se registra en la bandeja de campo de Yokup.','This creates an entry in the Yokup field inbox.')}</small>`;root.append(panel);
 const select=panel.querySelector('.incident-device'),problem=panel.querySelector('textarea'),severity=panel.querySelector('.incident-severity'),result=panel.querySelector('.incident-result'),power=panel.querySelector('[data-incident=power]'),abort=new AbortController(),opts={signal:abort.signal};for(const d of devices)select.add(new Option(d.name,d.id));
 const closeButton=panel.querySelector('[data-incident="close"]');closeButton.setAttribute('aria-label',t('Cerrar incidencia','Close incident'));
 const floating=attachFloatingPanel(panel,{label:t('Incidencia · Starbucks','Incident · Starbucks'),handle:panel.querySelector('header'),closeButton,bounds:surface,key:'xpaceos.window.matrix-incidents.v1',menu:'matrix-incidents',onOpen:()=>{if(abort.signal.aborted)return;panel.hidden=false;refresh();}});
 for(const event of ['pointerdown','pointerup','click','keydown','wheel'])panel.addEventListener(event,e=>e.stopPropagation(),opts);
 const refresh=()=>{select.value=target;power.textContent=off.has(target)?t('Enchufar','Plug in'):t('Desenchufar','Unplug');};
 function setPower(id,value){value?off.add(id):off.delete(id);localStorage.setItem('xpaceos.starbucks.off.v1',JSON.stringify([...off]));onPower(id,value);refresh();}
 select.addEventListener('change',()=>{target=select.value;refresh();},opts);
 panel.addEventListener('click',async e=>{const action=e.target.closest('[data-incident]')?.dataset.incident;if(action==='close'){panel.hidden=true;return;}if(busy||!['power','send'].includes(action))return;const d=devices.find(d=>d.id===target);busy=true;for(const b of panel.querySelectorAll('button'))b.disabled=true;result.textContent=t('Enviando…','Sending…');
  try{const demo=action==='power',resolve=demo&&off.has(d.id);const data=await sendIncident({equipo:d.equipo,problema:problem.value,gravedad:severity.value,demo,resolve,uuid:manualId});if(demo)setPower(d.id,!resolve);else{manualId=crypto.randomUUID();problem.value='';}track(data.id||data.resolved);poll();const a=document.createElement('a');a.href=incidentDetailUrl(data.id);a.target='_blank';a.rel='noopener';a.textContent=(data.id||data.resolved||t('Resuelta','Resolved'))+' · Yokup';result.replaceChildren(a);
  }catch(error){result.textContent=t('No enviado: ','Not sent: ')+error.message;}finally{busy=false;for(const b of panel.querySelectorAll('button'))b.disabled=false;refresh();}
 },opts);refresh();
 function track(id){if(!id)return;tracked.set(id,Date.now());while(tracked.size>20)tracked.delete(tracked.keys().next().value);try{localStorage.setItem('xpaceos.starbucks.tickets.v1',JSON.stringify(Object.fromEntries(tracked)));}catch{}}
 function resumeClosed(id,inc){
  if(inc.stage!=='cerrada')return;
  setPower(id,false);
  dismissed.set(inc.id,inc.resolved_at||0);
  while(dismissed.size>50)dismissed.delete(dismissed.keys().next().value);
  try{localStorage.setItem('xpaceos.starbucks.dismissed.v1',JSON.stringify(Object.fromEntries(dismissed)));}catch{}
  paint();
 }
 function paint(){const now=Date.now(),picked=pickIncidentPerDevice(statusData,now);for(const d of devices){
  const node=nodeFor(d.id);if(!node)continue;let chip=node.querySelector(':scope>.matrix-incident-chip');const inc=picked.get(d.equipo);
  if(!inc||(inc.stage==='cerrada'&&dismissed.get(inc.id)===(inc.resolved_at||0))){chip?.remove();continue;}
  if(!chip){
   chip=document.createElement('a');chip.className='matrix-incident-chip';chip.target='_blank';chip.rel='noopener';
   for(const ev of ['pointerdown','pointerup','click','keydown'])chip.addEventListener(ev,e=>e.stopPropagation(),opts);
   const activate=e=>{const current=pickIncidentPerDevice(statusData).get(d.equipo);if(current?.stage==='cerrada'){e.preventDefault();resumeClosed(d.id,current);}};
   chip.addEventListener('click',activate,opts);
   chip.addEventListener('keydown',e=>{if(chip.dataset.stage==='cerrada'&&['Enter',' '].includes(e.key))activate(e);},opts);
   node.append(chip);
  }
  const closed=inc.stage==='cerrada';
  if(closed){chip.removeAttribute('href');chip.setAttribute('role','button');chip.tabIndex=0;}
  else{chip.href=incidentDetailUrl(inc.id);chip.removeAttribute('role');chip.removeAttribute('tabindex');}
  const model=chipModel(inc,now,document.documentElement.lang);chip.dataset.tone=model.tone;chip.dataset.stage=inc.stage;
  chip.title=(inc.subject||inc.id)+(closed?' · '+t('Pulsa para volver a emitir','Click to resume playback'):' · '+t('Abrir la ficha en Yokup','Open the ticket in Yokup'));
  chip.replaceChildren(...model.lines.map((line,i)=>{const el=document.createElement(i?'span':'strong');el.textContent=line;return el;}));
 }}
 async function poll(){clearTimeout(pollTimer);if(abort.signal.aborted)return;try{const data=await fetchIncidentStatus([...tracked.keys()],fetcher);statusData=data.incidents||[];const now=Date.now();for(const inc of statusData)if(inc.stage==='cerrada'&&now-(inc.resolved_at||0)>CLOSED_VISIBLE_MS&&tracked.delete(inc.id))try{localStorage.setItem('xpaceos.starbucks.tickets.v1',JSON.stringify(Object.fromEntries(tracked)));}catch{}paint();}catch{}pollTimer=setTimeout(poll,document.hidden?STATUS_POLL_MS*4:STATUS_POLL_MS);}
 tickTimer=setInterval(()=>{if(statusData.length)paint();},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();},opts);abort.signal.addEventListener('abort',()=>{clearTimeout(pollTimer);clearInterval(tickTimer);for(const d of devices)nodeFor(d.id)?.querySelector(':scope>.matrix-incident-chip')?.remove();});poll();
 const stopLanguage=copy.observe(panel);
 return {off,paint,open(id=target){target=id;floating.open();},get visible(){return !panel.hidden;},select(id){target=id;refresh();},close(){panel.hidden=true;},remote(id,value){setPower(id,value);},dispose(){stopLanguage();floating.dispose();abort.abort();panel.remove();}};
}
