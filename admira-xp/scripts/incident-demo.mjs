// /crear incidencia · /cerrar incidencia (/create incident · /close incident) — modo experto de admira.store
// (Carlos, 7-oct-2026). Demo guiada sobre el gemelo Starbucks en Matrix: elige al azar una pantalla vertical del
// lineal sin incidencia activa (nunca la 1 ni ninguna con ticket abierto), escribe un motivo realista y abre el
// ticket; /cerrar incidencia va a esa pantalla, abre su ficha de admira.app, la finaliza con una nota acorde al
// motivo y pide el informe PDF, que el servidor envía SOLO a csilvasantin@gmail.com.
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
export function pick(list,rnd=Math.random){return list[Math.floor(rnd()*list.length)%list.length];}
export function parseIncidentCommand(text){const m=/^\/(crear|create|cerrar|close)(?:@\w+)?\s+(incidencia|incident)(?:\s+([A-Za-z]{3}-[A-Za-z0-9]{4,10}))?\s*$/i.exec(String(text||'').trim());if(!m)return null;return {action:/^(crear|create)$/i.test(m[1])?'create':'close',id:m[3]?m[3].toUpperCase():''};}
function loadList(store){try{const l=JSON.parse(store?.getItem(STORE_KEY)||'[]');return Array.isArray(l)?l.filter(x=>x&&ID_RE.test(x.id)):[];}catch{return [];}}
function saveList(store,list){try{store?.setItem(STORE_KEY,JSON.stringify(list.slice(-20)));}catch{}}
const clock=()=>new Date().toTimeString().slice(0,8);
async function matrixDemo(router,timeout=25000){let api=globalThis.XpaceMatrixOptions;if(!api?.isActive?.()||!api.incidentDemo){await router?.choose?.('matrix');}const t0=Date.now();while(Date.now()-t0<timeout){api=globalThis.XpaceMatrixOptions;if(api?.isActive?.()&&api.incidentDemo)return api.incidentDemo;await new Promise(r=>setTimeout(r,250));}return null;}
export async function runIncidentDemo(text,{router,lang='es',store=globalThis.localStorage,fetcher=(...a)=>fetch(...a),rnd=Math.random,progress=()=>{}}={}){
 const cmd=parseIncidentCommand(text);if(!cmd)return null;const en=lang==='en',t=(es,e)=>en?e:es;
 const demo=await matrixDemo(router);if(!demo)return {ok:false,local:true,message:t('Abre Matrix · Starbucks para usar /crear incidencia (no se pudo cargar el gemelo).','Open Matrix · Starbucks to use /create incident (the twin did not load).')};
 const list=loadList(store);
 if(cmd.action==='create'){
  const candidates=demo.candidates();if(!candidates.length)return {ok:false,local:true,message:t('Todas las pantallas verticales del lineal tienen ya una incidencia activa. Cierra una con /cerrar incidencia.','Every vertical shelf screen already has an active incident. Close one with /close incident.')};
  const deviceId=pick(candidates,rnd),cause=pick(CAUSES,rnd),idx=CAUSES.indexOf(cause),steps=[{at:clock(),text:t('CLI: /crear incidencia','CLI: /create incident')}],step=s=>{steps.push({at:clock(),text:s});try{progress('🛠 '+s);}catch{}};
  step(t('Elegida al azar ','Randomly picked ')+demo.name(deviceId)+t(' (pantalla vertical del lineal sin incidencia)',' (vertical shelf screen without incident)'));
  await demo.focus(deviceId);step(t('Cámara en la pantalla','Camera on the screen'));
  try{const r=await demo.open({deviceId,problem:en?cause.en:cause.es,severity:cause.sev,step});list.push({id:r.id,deviceId,cause:idx,lang,openedAt:Date.now(),steps});saveList(store,list);
   return {ok:true,local:true,id:r.id,message:'🛠 '+r.id+' · '+demo.name(deviceId)+' · '+(en?cause.en:cause.es)+' · '+t('gravedad ','severity ')+cause.sev+'\n'+t('Ticket abierto en Yokup / admira.app. Ciérralo con /cerrar incidencia','Ticket opened in Yokup / admira.app. Close it with /close incident')};}
  catch(e){return {ok:false,local:true,message:t('No se pudo abrir la incidencia: ','Could not open the incident: ')+e.message};}
 }
 let entry=cmd.id?list.find(x=>x.id===cmd.id)||{id:cmd.id,cause:-1,steps:[]}:null;
 if(!entry){for(const x of [...list].reverse()){const st=demo.stage(x.id);if(st&&!['cerrada','cancelada'].includes(st)){entry=x;break;}}}
 if(!entry)return {ok:false,local:true,message:t('No hay incidencias abiertas por la CLI. Crea una con /crear incidencia.','No incidents opened from the CLI. Create one with /create incident.')};
 const cause=CAUSES[entry.cause],note=cause?(en?cause.fix_en:cause.fix_es):t('Revisión in situ: equipo verificado y emitiendo con normalidad.','On-site check: device verified and playing normally.');
 const steps=[...(entry.steps||[]),{at:clock(),text:t('CLI: /cerrar incidencia ','CLI: /close incident ')+entry.id}],step=s=>{steps.push({at:clock(),text:s});try{progress('🛠 '+s);}catch{}};
 try{if(entry.deviceId){await demo.focus(entry.deviceId);step(t('Cámara en la pantalla','Camera on the screen'));}
  const r=await demo.close({id:entry.id,note,step});if(r.deviceId&&!entry.deviceId)await demo.focus(r.deviceId);
  if(r.inc?.stage!=='cerrada')return {ok:false,local:true,message:t('La incidencia no quedó cerrada (¿la lleva un técnico del portal?).','The incident was not closed (held by a portal technician?).')};
  progress('📧 '+t('Enviando informe PDF a ','Sending PDF report to ')+REPORT_TO+'…');let report='';try{const res=await fetcher(REPORT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:entry.id,timeline:steps.slice(-12)})});const d=await res.json().catch(()=>({}));
   report=res.ok&&d.sent?'📧 '+t('Informe enviado a ','Report sent to ')+REPORT_TO+(d.message_id?' · '+d.message_id:''):d.already?'📧 '+t('El informe ya se había enviado a ','Report already sent to ')+REPORT_TO:'⚠ '+t('Informe no enviado: ','Report not sent: ')+(d.error||('HTTP '+res.status));}catch(e){report='⚠ '+t('Informe no enviado: ','Report not sent: ')+e.message;}
  saveList(store,list.filter(x=>x.id!==entry.id));
  return {ok:true,local:true,id:entry.id,message:'✓ '+entry.id+' '+t('cerrada · Finalizada en admira.app','closed · Finished in admira.app')+(r.already?t(' (ya lo estaba)',' (already closed)'):'')+' · «'+(r.inc.resolution||note)+'»\n'+report};}
 catch(e){return {ok:false,local:true,message:t('No se pudo cerrar: ','Could not close: ')+e.message};}
}
