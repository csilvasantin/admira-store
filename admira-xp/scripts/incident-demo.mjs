// /crear incidencia · /cerrar incidencia (/create incident · /close incident) — modo experto de admira.store
// (Carlos, 7-oct-2026). Demo guiada sobre el gemelo Starbucks en Matrix: elige al azar una pantalla vertical del
// lineal sin incidencia activa (nunca la 1 ni ninguna con ticket abierto), escribe un motivo realista y abre el
// ticket; /cerrar incidencia va a esa pantalla, abre su ficha de admira.app, la finaliza con una nota acorde al
// motivo y pide el informe PDF, que el servidor envía SOLO a csilvasantin@gmail.com.
import {captureIncidentPhoto,brandLogoJpeg,brandIdFor} from './incident-snapshot.mjs?v=cli-incidencia-3';
export const REPORT_URL='https://data.yokup.com/api/demo/incident-report',REPORT_TO='csilvasantin@gmail.com',STORE_KEY='xpaceos.starbucks.cli-incidents.v1';
export const CAUSES=Object.freeze([
 {es:'HDMI suelto: la pantalla muestra «Sin señal»',en:'Loose HDMI: the screen shows “No signal”',sev:'alta',fix_es:'Cable HDMI reconectado y asegurado con brida; vuelve a emitir.',fix_en:'HDMI cable reseated and secured with a tie; playback resumed.'},
 {es:'Reproductor colgado: imagen congelada desde hace 20 min',en:'Player frozen: image stuck for 20 min',sev:'alta',fix_es:'Reinicio remoto del reproductor; la playlist arranca de nuevo.',fix_en:'Remote player restart; the playlist runs again.'},
 {es:'Corte de luz en el lineal: tres enchufes sin corriente',en:'Power cut on the shelf: three sockets without power',sev:'urgente',fix_es:'Diferencial rearmado por mantenimiento; pantalla encendida y verificada.',fix_en:'Breaker reset by maintenance; screen powered on and checked.'},
 {es:'Pantalla golpeada por un carro de reposición: marco desplazado',en:'Screen hit by a restocking trolley: bezel shifted',sev:'alta',fix_es:'Soporte reajustado y panel revisado sin daños; emite con normalidad.',fix_en:'Mount realigned and panel checked, no damage; playing normally.'},
 {es:'Sin red wifi: el reproductor no descarga la playlist',en:'No wifi: the player cannot download the playlist',sev:'normal',fix_es:'Reproductor reconectado a la red de tienda; contenidos sincronizados.',fix_en:'Player reconnected to the store network; content synced.'},
 {es:'Sobrecalentamiento: la pantalla se apaga sola cada pocos minutos',en:'Overheating: the screen switches itself off every few minutes',sev:'alta',fix_es:'Rejilla de ventilación despejada y brillo ajustado; temperatura estable.',fix_en:'Vent cleared and brightness adjusted; temperature stable.'},
 {es:'Actualización de firmware atascada al 63 %',en:'Firmware update stuck at 63%',sev:'normal',fix_es:'Firmware reinstalado desde la consola; versión correcta y emitiendo.',fix_en:'Firmware reinstalled from the console; correct version and playing.'},
 {es:'Un reponedor desenchufó la regleta para cargar la fregadora',en:'A stocker unplugged the power strip to charge the scrubber',sev:'baja',fix_es:'Regleta enchufada de nuevo y señalizada «no desconectar»; vuelve a emitir.',fix_en:'Power strip plugged back in and labelled “do not unplug”; playback resumed.'},
 {es:'Contenido caducado: sigue anunciando la promoción de la semana pasada',en:'Expired content: still showing last week’s promotion',sev:'normal',fix_es:'Playlist de la semana reasignada y caché vaciada; contenido correcto.',fix_en:'This week’s playlist reassigned and cache cleared; correct content.'},
 {es:'Mando a distancia perdido: la pantalla quedó en modo HDMI 2',en:'Lost remote: the screen was left on HDMI 2',sev:'baja',fix_es:'Entrada fijada en HDMI 1 por RS-232 y bloqueo de teclado activado.',fix_en:'Input locked to HDMI 1 over RS-232 and keypad lock enabled.'},
 {es:'Rayas verticales en el panel tras una subida de tensión',en:'Vertical lines on the panel after a power surge',sev:'urgente',fix_es:'Panel sustituido por uno de repuesto; protección contra sobretensión instalada.',fix_en:'Panel swapped for a spare; surge protector installed.'},
 {es:'Reloj del reproductor desfasado: emite la parrilla de la noche',en:'Player clock out of sync: playing the night schedule',sev:'normal',fix_es:'Hora sincronizada por NTP; vuelve la parrilla de mañana.',fix_en:'Clock synced via NTP; the morning schedule is back.'},
 {es:'Derrame de café junto a la fuente de alimentación',en:'Coffee spilled next to the power supply',sev:'urgente',fix_es:'Fuente sustituida y zona secada; pantalla verificada.',fix_en:'Power supply replaced and area dried; screen verified.'},
 {es:'Brillo al mínimo tras una limpieza: no se ve con la luz del escaparate',en:'Brightness at minimum after cleaning: unreadable in window light',sev:'baja',fix_es:'Perfil de brillo restaurado (450 nits) y botones bloqueados.',fix_en:'Brightness profile restored (450 nits) and buttons locked.'},
 {es:'Disco del reproductor lleno: no entran contenidos nuevos',en:'Player storage full: new content cannot download',sev:'normal',fix_es:'Contenidos antiguos purgados en remoto; descarga completada.',fix_en:'Old content purged remotely; download completed.'}
]);
const ID_RE=/^[A-Z]{3}-[A-Z0-9]{4,10}$/;
// Fotos de la pantalla (abierta / cerrada) para el informe: aparte de la lista y sólo las 3 últimas (pesan).
export const PHOTO_KEY='xpaceos.starbucks.cli-incidents.photos.v1';
function loadPhotos(store){try{const m=JSON.parse(store?.getItem(PHOTO_KEY)||'{}');return m&&typeof m==='object'?m:{};}catch{return {};}}
function savePhoto(store,id,shot){if(!shot)return;try{const m=loadPhotos(store);m[id]=shot;const keys=Object.keys(m);for(const k of keys.slice(0,Math.max(0,keys.length-3)))delete m[k];store?.setItem(PHOTO_KEY,JSON.stringify(m));}catch{}}
function dropPhoto(store,id){try{const m=loadPhotos(store);if(m[id]){delete m[id];store?.setItem(PHOTO_KEY,JSON.stringify(m));}}catch{}}
export function pick(list,rnd=Math.random){return list[Math.floor(rnd()*list.length)%list.length];}
export function parseIncidentCommand(text){const m=/^\/(crear|create|cerrar|close)(?:@\w+)?\s+(incidencia|incident)(?:\s+([A-Za-z]{3}-[A-Za-z0-9]{4,10}))?\s*$/i.exec(String(text||'').trim());if(!m)return null;return {action:/^(crear|create)$/i.test(m[1])?'create':'close',id:m[3]?m[3].toUpperCase():''};}
function loadList(store){try{const l=JSON.parse(store?.getItem(STORE_KEY)||'[]');return Array.isArray(l)?l.filter(x=>x&&ID_RE.test(x.id)):[];}catch{return [];}}
function saveList(store,list){try{store?.setItem(STORE_KEY,JSON.stringify(list.slice(-20)));}catch{}}
const clock=()=>new Date().toTimeString().slice(0,8);
// Sin id y sin incidencias de la CLI: nunca «no hay incidencias» si se ve una en pantalla (Carlos 23:06). Se listan
// TODAS las activas de las pantallas del gemelo con el id para cerrarlas con /cerrar incidencia INC-XXXX.
const SEV_EN={urgente:'urgent',alta:'high',normal:'normal',baja:'low'};
export function screenLabel(o,en=false){const m=/^pantalla-(\d+)$/.exec(o?.equipo||'');return m?(en?'screen ':'pantalla ')+m[1]:(o?.equipo==='tpv'?'TPV':/IPAD/i.test(o?.equipo||'')?'iPad':(o?.name||o?.equipo||'—'));}
const hhmm=ms=>{try{return new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));}catch{return new Date(ms).toTimeString().slice(0,5);}};
const age=(ms,now)=>{const m=Math.max(0,Math.round((now-ms)/60000));return m<60?m+' min':m<2880?Math.floor(m/60)+' h '+(m%60)+' min':Math.floor(m/1440)+' d';};
export function describeOpen(open,{en=false,now=Date.now()}={}){const t=(es,e)=>en?e:es,list=Array.isArray(open)?open:[];
 if(!list.length)return t('No hay incidencias abiertas en las pantallas del gemelo. Crea una con /crear incidencia.','There are no open incidents on the twin’s screens. Create one with /create incident.');
 const sev=o=>en?(SEV_EN[o.priority]||o.priority||'—'):(o.priority||'—'),via=o=>({cli:t('abierta desde la CLI','opened from the CLI'),manual:t('abierta manualmente','opened manually'),auto:t('abierta automáticamente','opened automatically')}[o.via]||t('abierta','opened'));
 if(list.length===1){const o=list[0];return t('Hay 1 incidencia abierta en ','There is 1 open incident on ')+screenLabel(o,en)+': '+o.id+' ('+sev(o)+', '+via(o)+(o.created_at?t(' a las ',' at ')+hhmm(o.created_at):'')+(o.stage==='en_curso'?t(', en curso',', in progress'):'')+(o.assignee?t(', técnico ',', technician ')+o.assignee:'')+'). '+(o.via==='cli'?t('La abrió la CLI desde otro navegador','The CLI opened it from another browser'):t('No la abrió la CLI','The CLI did not open it'))+t('; para cerrarla escribe /cerrar incidencia ','; to close it type /close incident ')+o.id;}
 return t('Hay ','There are ')+list.length+t(' incidencias abiertas en las pantallas del gemelo:',' open incidents on the twin’s screens:')+'\n'+list.map(o=>'• '+screenLabel(o,en)+' · '+o.id+' · '+sev(o)+' · '+t('hace ','')+(o.created_at?age(o.created_at,now):'—')+(en?' ago':'')+' · '+via(o)).join('\n')+'\n'+t('Para cerrar una: /cerrar incidencia INC-XXXX (ninguna la abrió la CLI de este navegador).','To close one: /close incident INC-XXXX (none was opened by this browser’s CLI).');}
// Mientras corre la demo se pliega el menú ☰ Opciones (columna izquierda) y al acabar se deja como estaba.
export function collapseLeftMenu(doc=globalThis.document){try{const panel=doc?.querySelector?.('.quad-left:not(.is-collapsed)'),btn=doc?.getElementById?.('pfOptions');if(!panel||!btn)return ()=>{};btn.click();return ()=>{try{if(panel.classList.contains('is-collapsed'))btn.click();}catch{}};}catch{return ()=>{};}}
async function matrixDemo(router,timeout=25000){let api=globalThis.XpaceMatrixOptions;if(!api?.isActive?.()||!api.incidentDemo){await router?.choose?.('matrix');}const t0=Date.now();while(Date.now()-t0<timeout){api=globalThis.XpaceMatrixOptions;if(api?.isActive?.()&&api.incidentDemo)return api.incidentDemo;await new Promise(r=>setTimeout(r,250));}return null;}
export async function runIncidentDemo(text,{router,lang='es',store=globalThis.localStorage,fetcher=(...a)=>fetch(...a),rnd=Math.random,progress=()=>{}}={}){
 const cmd=parseIncidentCommand(text);if(!cmd)return null;const en=lang==='en',t=(es,e)=>en?e:es;
 const demo=await matrixDemo(router);if(!demo)return {ok:false,local:true,message:t('Abre Matrix · Starbucks para usar /crear incidencia (no se pudo cargar el gemelo).','Open Matrix · Starbucks to use /create incident (the twin did not load).')};
 const restoreMenu=collapseLeftMenu();try{return await body();}finally{restoreMenu();}
 async function body(){
 const list=loadList(store);
 if(cmd.action==='create'){
  const candidates=demo.candidates();if(!candidates.length)return {ok:false,local:true,message:t('Todas las pantallas verticales del lineal tienen ya una incidencia activa. Cierra una con /cerrar incidencia.','Every vertical shelf screen already has an active incident. Close one with /close incident.')};
  const deviceId=pick(candidates,rnd),cause=pick(CAUSES,rnd),idx=CAUSES.indexOf(cause),steps=[{at:clock(),text:t('CLI: /crear incidencia','CLI: /create incident')}],step=s=>{steps.push({at:clock(),text:s});try{progress('🛠 '+s);}catch{}};
  step(t('Elegida al azar ','Randomly picked ')+demo.name(deviceId)+t(' (pantalla vertical del lineal sin incidencia)',' (vertical shelf screen without incident)'));
  await demo.focus(deviceId);step(t('Cámara en la pantalla','Camera on the screen'));
  try{const r=await demo.open({deviceId,problem:en?cause.en:cause.es,severity:cause.sev,step});list.push({id:r.id,deviceId,cause:idx,lang,openedAt:Date.now(),steps});saveList(store,list);
   const shot=await captureIncidentPhoto(demo,deviceId,{stage:'abierta',text:r.id+' · '+demo.name(deviceId)+' · '+t('ABIERTA','OPEN')+' · '+clock(),lines:[r.id,t('ABIERTA','OPEN'),en?cause.en:cause.es]});
   if(shot){savePhoto(store,r.id,shot);step(t('Foto de la pantalla con la tarjeta para el informe','Photo of the screen with its card for the report'));}
   return {ok:true,local:true,id:r.id,message:'🛠 '+r.id+' · '+demo.name(deviceId)+' · '+(en?cause.en:cause.es)+' · '+t('gravedad ','severity ')+(en?({urgente:'urgent',alta:'high',normal:'normal',baja:'low'}[cause.sev]||cause.sev):cause.sev)+'\n'+t('Ticket abierto en Yokup / admira.app. Ciérralo con /cerrar incidencia','Ticket opened in Yokup / admira.app. Close it with /close incident')};}
  catch(e){return {ok:false,local:true,message:t('No se pudo abrir la incidencia: ','Could not open the incident: ')+e.message};}
 }
 let entry=cmd.id?list.find(x=>x.id===cmd.id)||{id:cmd.id,cause:-1,steps:[]}:null;
 if(!entry){for(const x of [...list].reverse()){const st=demo.stage(x.id);if(st&&!['cerrada','cancelada'].includes(st)){entry=x;break;}}}
 const listOpen=async()=>{try{return (await demo.listOpen?.())||[];}catch{return [];}};
 if(!entry)return {ok:false,local:true,message:describeOpen(await listOpen(),{en})};
 // Con id explícito vale cualquier incidencia activa de este gemelo (también las abiertas a mano): se busca su pantalla.
 if(cmd.id&&!entry.deviceId){const info=(await listOpen()).find(x=>x.id===cmd.id);if(info?.deviceId)entry={...entry,deviceId:info.deviceId};}
 const cause=CAUSES[entry.cause],note=cause?(en?cause.fix_en:cause.fix_es):t('Revisión in situ: equipo verificado y emitiendo con normalidad.','On-site check: device verified and playing normally.');
 const steps=[...(entry.steps||[]),{at:clock(),text:t('CLI: /cerrar incidencia ','CLI: /close incident ')+entry.id}],step=s=>{steps.push({at:clock(),text:s});try{progress('🛠 '+s);}catch{}};
 try{if(entry.deviceId){await demo.focus(entry.deviceId);step(t('Cámara en la pantalla','Camera on the screen'));
   if(!loadPhotos(store)[entry.id]){const s=await captureIncidentPhoto(demo,entry.deviceId,{stage:'abierta',wait:2500,text:entry.id+' · '+demo.name(entry.deviceId)+' · '+t('ACTIVA','ACTIVE')+' · '+clock(),lines:[entry.id,t('ABIERTA','OPEN')]});if(s){savePhoto(store,entry.id,s);step(t('Foto de la pantalla con la incidencia activa','Photo of the screen with the active incident'));}}}
  const r=await demo.close({id:entry.id,note,step});if(r.deviceId&&!entry.deviceId)await demo.focus(r.deviceId);
  if(r.inc?.stage!=='cerrada')return {ok:false,local:true,message:t('La incidencia no quedó cerrada (¿la lleva un técnico del portal?).','The incident was not closed (held by a portal technician?).')};
  const devId=entry.deviceId||r.deviceId,closedShot=await captureIncidentPhoto(demo,devId,{stage:'cerrada',wait:6000,text:entry.id+' · '+demo.name(devId)+' · '+t('CERRADA','CLOSED')+' · '+clock(),lines:[entry.id,t('CERRADA','CLOSED'),'«'+(r.inc.resolution||note)+'»']});
  if(closedShot)step(t('Foto de la pantalla cerrada para el informe','Photo of the closed screen for the report'));
  const openShot=loadPhotos(store)[entry.id]||null,marca=brandIdFor(globalThis.document?.documentElement?.getAttribute?.('data-mb-marca'),r.inc.resource),logo=await brandLogoJpeg(marca,{fetcher});
  progress('📧 '+t('Enviando informe PDF a ','Sending PDF report to ')+REPORT_TO+'…');let report='';try{const res=await fetcher(REPORT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:entry.id,timeline:steps.slice(-12),marca,logo,photos:{open:openShot?.src||null,open_at:openShot?.at||0,closed:closedShot?.src||null,closed_at:closedShot?.at||0}})});const d=await res.json().catch(()=>({}));
   const tg=d.telegram?.sent?'\n📨 '+t('PDF también en tu Telegram','PDF also sent to your Telegram')+(d.telegram.message_id?' · #'+d.telegram.message_id:''):d.telegram&&d.telegram.reason?'\n⚠ Telegram: '+d.telegram.reason:'';
   report=res.ok&&(d.sent||d.telegram?.sent)?(d.sent?'📧 '+t('Informe enviado a ','Report sent to ')+REPORT_TO+(d.message_id?' · '+d.message_id:''):'⚠ '+t('Correo no enviado: ','Email not sent: ')+(d.mail_error||''))+tg+(d.pages?' · '+d.pages+' '+t('págs.','pages')+(d.ai&&d.ai!=='plantilla'?' · IA':'')+(d.photos?' · '+d.photos+' '+t('fotos','photos'):'')+(d.brand&&d.brand!=='admira'?' · '+t('marca ','brand ')+d.brand:''):''):d.already?'📧 '+t('El informe ya se había enviado a ','Report already sent to ')+REPORT_TO:'⚠ '+t('Informe no enviado: ','Report not sent: ')+(d.error||('HTTP '+res.status));}catch(e){report='⚠ '+t('Informe no enviado: ','Report not sent: ')+e.message;}
  saveList(store,list.filter(x=>x.id!==entry.id));dropPhoto(store,entry.id);
  return {ok:true,local:true,id:entry.id,message:'✓ '+entry.id+' '+t('cerrada · Finalizada en admira.app','closed · Finished in admira.app')+(r.already?t(' (ya lo estaba)',' (already closed)'):'')+' · «'+(r.inc.resolution||note)+'»\n'+report};}
 catch(e){if(e.code==='portal_assigned')return {ok:false,local:true,id:entry.id,message:'⚠ '+entry.id+t(' no se ha cerrado: ',' was not closed: ')+e.message+t('. Se cierra desde su ficha, con evidencia: ','. Close it from its ticket, with evidence: ')+e.url};return {ok:false,local:true,message:t('No se pudo cerrar: ','Could not close: ')+e.message};}
 }
}
