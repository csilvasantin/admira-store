const HOUR=3600000,DAY=24*HOUR;
const KINDS=['person','car','motorcycle','bicycle','scooter'];
const dayFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'});
const hourFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',hourCycle:'h23'});
export const madridDay=at=>dayFormatter.format(new Date(at));
export const madridHour=at=>Number(hourFormatter.format(new Date(at)));
export class DoohHistoryState{
  constructor({now=()=>Date.now()}={}){this.now=now;this.value=null;}
  clear(){this.value=null;}
  read(){return this.value;}
  update(v){
    if(!v||v.schema!=='admira.dooh-history.v1'||v.site!=='admira-xperience-santa-rosa-19'||v.source!=='puerta-cam'||v.timezone!=='Europe/Madrid'||typeof v.loaded!=='boolean'||typeof v.busy!=='boolean'||![null,'login','access','unavailable','request','unconfirmed','invalid_history','TimeoutError','The operation was aborted due to timeout'].includes(v.error))return false;
    if(!['pending','lost','expired'].every(k=>Number.isSafeInteger(v[k])&&v[k]>=0)||!Array.isArray(v.rows)||v.rows.length>8000)return false;
    if(v.loaded){
      if(![v.from,v.to,v.updatedAt].every(n=>Number.isSafeInteger(n)&&n>=0)||v.from>=v.to||v.to-v.from>32*DAY||v.updatedAt>this.now()+60000||v.to>v.updatedAt+60000||['login','access'].includes(v.error))return false;
    }else if(v.rows.length||v.from!==null||v.to!==null||v.updatedAt!==null)return false;
    const seen=new Set(),rows=[];
    for(const r of v.rows){
      if(!r||!Number.isSafeInteger(r.hour)||r.hour%HOUR!==0||r.hour<Math.floor(v.from/HOUR)*HOUR||r.hour>=v.to||!KINDS.includes(r.kind)||!['detector','manual'].includes(r.source)||r.kind==='scooter'&&r.source!=='manual'||!Number.isSafeInteger(r.total)||r.total<0||r.total>10000000)return false;
      const key=[r.hour,r.kind,r.source].join('/');if(seen.has(key))return false;seen.add(key);
      rows.push({hour:r.hour,kind:r.kind,source:r.source,total:r.total});
    }
    this.value={schema:v.schema,site:v.site,source:v.source,timezone:v.timezone,loaded:v.loaded,busy:v.busy,error:v.error,updatedAt:v.updatedAt,from:v.from,to:v.to,pending:v.pending,lost:v.lost,expired:v.expired,rows};return true;
  }
}
export function selectDoohPeriod(value,{day,start=0,end=24}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>24||start>=end)return null;
  if(!value?.loaded)return null;
  const rows=value.rows.filter(r=>madridDay(r.hour)===day&&madridHour(r.hour)>=start&&madridHour(r.hour)<end);
  const hours=[...new Set(rows.map(r=>r.hour))].sort((a,b)=>a-b);
  const sum=list=>Object.fromEntries(KINDS.map(k=>[k,list.filter(r=>r.kind===k&&r.source==='detector').reduce((n,r)=>n+r.total,0)]));
  return {counts:sum(rows),manual:rows.filter(r=>r.source==='manual').reduce((n,r)=>n+r.total,0),hasRecords:rows.length>0,
    hours:hours.map(hour=>({hour,counts:sum(rows.filter(r=>r.hour===hour)),manual:rows.filter(r=>r.hour===hour&&r.source==='manual').reduce((n,r)=>n+r.total,0)}))};
}
const mounted=new WeakMap();
export function renderDoohHistory(root,{en=false,getSnapshot=()=>null,request=()=>{},now=()=>Date.now()}={}){
  if(!root)return;
  let state=mounted.get(root);
  if(!state){
    const select=(name,from,to,initial)=>`<select data-filter="${name}" style="color:inherit;background:#102934;padding:6px;border:1px solid #346071;border-radius:5px">${Array.from({length:to-from+1},(_,i)=>i+from).map(h=>`<option value="${h}" ${h===initial?'selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}</select>`;
    root.innerHTML=`<div style="border-top:1px solid #346071;padding-top:12px;margin-top:12px"><strong>${en?'STOREFRONT · SAVED PASSAGES':'ESCAPARATE · PASOS GUARDADOS'}</strong><p style="font-size:10px">${en?'Real camera · last 31 days · Europe/Madrid':'Cámara real · últimos 31 días · Europe/Madrid'}</p><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:end"><label>${en?'Day':'Día'}<br><input data-filter="day" type="date" style="color:inherit;background:#102934;padding:5px;border:1px solid #346071;border-radius:5px"></label><label>${en?'From':'Desde'}<br>${select('start',0,23,0)}</label><label>${en?'Until (exclusive)':'Hasta (sin incluir)'}<br>${select('end',1,24,24)}</label><button type="button" data-refresh style="padding:6px;background:#163e4b;color:#d9f4ff;border:1px solid #8ed2ff;border-radius:5px">${en?'Refresh':'Actualizar'}</button></div><p data-history-status role="status" style="font-size:10px;line-height:1.5"></p><p data-period-total style="color:#bce5fa;line-height:1.7"></p><div style="overflow:auto"><table style="width:100%;font-size:10px;text-align:right"><caption style="text-align:left;margin-bottom:6px">${en?'Recorded passages by hour':'Pasos registrados por hora'}</caption><thead><tr>${(en?['Hour','People','Cars','Motorcycles','Bicycles','Manual']:['Hora','Personas','Coches','Motos','Bicis','Manual']).map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead><tbody data-history-rows></tbody></table></div><p style="font-size:10px;opacity:.75;line-height:1.5">${en?'Only confirmed records from the exterior camera. Gaps are not zero traffic; the current hour may be incomplete. No extrapolation, virtual visitors or game clock. Passages are not unique people or verified views. Manual observations (including scooters) are separate.':'Solo registros confirmados de la cámara exterior. Los huecos no significan cero tráfico; la hora actual puede estar incompleta. Sin extrapolar, sin visitantes virtuales y sin reloj del juego. Son pasos, no personas únicas ni miradas verificadas. Observaciones manuales (incluidos patinetes) por separado.'}</p></div>`;
    state={day:root.querySelector('[data-filter="day"]'),start:root.querySelector('[data-filter="start"]'),end:root.querySelector('[data-filter="end"]'),lastRequest:now()};
    state.day.value=madridDay(now());mounted.set(root,state);
    for(const input of [state.day,state.start,state.end])input.addEventListener('change',()=>renderDoohHistory(root,{en,getSnapshot,request,now}));
    root.querySelector('[data-refresh]').addEventListener('click',()=>{state.lastRequest=now();request();});
    request();
  }
  const value=getSnapshot(),text=(es,english)=>en?english:es;
  if(now()-state.lastRequest>=30000){state.lastRequest=now();request();}
  root.querySelector('[data-refresh]').disabled=!!value?.busy;
  const status=root.querySelector('[data-history-status]');
  const errors={login:text('Inicia sesión en Admira.tv para consultar el histórico.','Sign in to Admira.tv to read history.'),access:text('Histórico privado: requiere acceso de administrador.','Private history: administrator access required.'),unavailable:text('Servidor de histórico no disponible.','History server unavailable.')};
  status.textContent=!value?text('Conecta el analizador de Puerta Cam para consultar el histórico.','Connect the Puerta Cam analyzer to read history.'):
    (value.busy?text('Sincronizando… ','Synchronizing… '):'')+(value.error?(errors[value.error]||text('No se pudo actualizar.','Could not refresh.')):value.loaded?text('Registros confirmados.','Confirmed records.'):text('Histórico pendiente de conexión.','Waiting for history.'))+
    (value.updatedAt?' '+text('Última lectura: ','Last read: ')+new Intl.DateTimeFormat(en?'en-GB':'es-ES',{timeZone:'Europe/Madrid',dateStyle:'short',timeStyle:'medium'}).format(value.updatedAt):'')+
    (value.pending?` · ${value.pending} `+text('sin confirmar','unconfirmed'):'')+(value.lost||value.expired?` · ${value.lost+value.expired} `+text('no guardados','not saved'):'');
  const period=selectDoohPeriod(value,{day:state.day.value,start:Number(state.start.value),end:Number(state.end.value)});
  const total=root.querySelector('[data-period-total]'),tbody=root.querySelector('[data-history-rows]');
  tbody.replaceChildren();
  total.textContent=Number(state.start.value)>=Number(state.end.value)?text('La hora final debe ser posterior a la inicial.','End hour must be later than start hour.'):
    !period?.hasRecords?text('— Sin registros confirmados para esta franja.','— No confirmed records for this period.'):
    `${text('Personas','People')}: ${period.counts.person} · ${text('Coches','Cars')}: ${period.counts.car} · ${text('Motos','Motorcycles')}: ${period.counts.motorcycle} · ${text('Bicis','Bicycles')}: ${period.counts.bicycle} · Manual: ${period.manual}`;
  for(const row of period?.hours||[]){
    const tr=root.ownerDocument.createElement('tr');
    const label=String(madridHour(row.hour)).padStart(2,'0')+':00 · '+new Date(row.hour).toISOString().slice(11,16)+' UTC';
    for(const v of [label,...KINDS.slice(0,4).map(k=>row.counts[k]),row.manual]){const td=root.ownerDocument.createElement('td');td.textContent=String(v);tr.append(td);}tbody.append(tr);
  }
}
