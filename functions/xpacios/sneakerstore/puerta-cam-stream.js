// Directo de Puerta Cam (IEU · Santa Rosa 19) sin abrir digitaltwin.ieu.ai (Carlos, 22-oct-2026).
// IEU emite enlaces firmados al directo de una cámara con un token de su hub con permiso «Ver cámaras»
// (POST /hub/streams, «solo Bearer camera_view»); cada enlace vale 12 h sin sesión en cualquier reproductor.
// El token vive solo aquí, como secreto IEU_CAMERA_TOKEN del proyecto de Pages: nunca llega al navegador.
// El enlace solo se entrega a quien ha entrado en admira.store con permiso (perímetro de AdmiraNeXT).
// Qué cámara pedir (el cuerpo de la petición, que no es secreto) va en PUERTA_CAM_REQUEST; la variable
// IEU_PUERTA_CAM_STREAM lo sustituye sin desplegar. Para averiguarlo, un administrador abre ?diagnostico=1, que
// enseña lo que pide IEU sin token ni enlaces. Guía: admira-xp/docs/puerta-cam-directo.md.
import {readSession,siteForHost} from '../../_perimetro.js';

export const IEU='https://digitaltwin.ieu.ai';
export const LOGIN_PATH='/auth/login?return_to='+encodeURIComponent('/xpacios/sneakerstore/');
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const reply=(body,status=200)=>Response.json(body,{status,headers:HEADERS});

// El enlace firmado del directo en la respuesta de IEU, sea cual sea su forma: una URL o ruta de
// /hub/streams/<ticket>/<fichero> en IEU. Cualquier otra cosa no se entrega.
export function streamUrlFrom(value,depth=0){
  if(depth>5||value==null)return null;
  if(typeof value==='string'){
    let url;try{url=new URL(value,IEU);}catch{return null;}
    return url.origin===IEU&&/^\/hub\/streams\/[^/]+\/.+/.test(url.pathname)?url.href:null;
  }
  for(const v of Array.isArray(value)?value:typeof value==='object'?Object.values(value):[]){const u=streamUrlFrom(v,depth+1);if(u)return u;}
  return null;
}
// Lo que puede enseñar el diagnóstico: los enlaces firmados se tachan y lo largo se corta.
export function redact(value,depth=0){
  if(depth>8)return '…';
  if(typeof value==='string')return /\/hub\/streams\/[^/\s]+\//.test(value)?'[enlace firmado]':value.length>400?value.slice(0,400)+'…':value;
  if(Array.isArray(value))return value.slice(0,40).map(v=>redact(v,depth+1));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).slice(0,60).map(([k,v])=>[k,redact(v,depth+1)]));
  return value;
}
// El token, aunque se guardara con otras mayúsculas o espacios alrededor del nombre (22-oct-2026: el diagnóstico decía
// not_configured con el secreto ya guardado).
export function cameraToken(env){
  if(env?.IEU_CAMERA_TOKEN)return env.IEU_CAMERA_TOKEN;
  const key=Object.keys(env||{}).find(k=>typeof env[k]==='string'&&env[k]&&k.trim().toUpperCase()==='IEU_CAMERA_TOKEN');
  return key?env[key]:'';
}
// Nombres (nunca valores) de las variables que parecen de este directo: el diagnóstico los enseña si falta el token,
// para ver si llegó con otro nombre o no llegó a producción.
export function relatedVariables(env){return Object.keys(env||{}).filter(k=>typeof env[k]==='string'&&/IEU|CAM/i.test(k)).sort();}

// Puerta Cam en IEU: pendiente de leer en el diagnóstico con el token puesto (no se inventa un ID).
export const PUERTA_CAM_REQUEST=null;
export function streamRequest(env,fallback=PUERTA_CAM_REQUEST){
  try{const body=JSON.parse(env.IEU_PUERTA_CAM_STREAM||'');if(body&&typeof body==='object'&&!Array.isArray(body))return body;}catch{}
  return fallback&&typeof fallback==='object'?fallback:null;
}

// MCP del hub de IEU por HTTP (JSON o text/event-stream), solo para el diagnóstico.
async function mcp(fetcher,auth){
  let session='',id=0;
  async function rpc(method,params){
    const headers={...auth,'Content-Type':'application/json',Accept:'application/json, text/event-stream',...(session?{'Mcp-Session-Id':session}:{})};
    const r=await fetcher(IEU+'/hub/mcp',{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(8000)});
    session=r.headers.get('mcp-session-id')||session;
    const text=await r.text();if(!r.ok)throw Error('MCP '+r.status+' '+text.slice(0,200));
    const json=text.trim().startsWith('{')?text:text.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).pop()||'{}';
    const msg=JSON.parse(json);if(msg.error)throw Error('MCP '+(msg.error.message||'error'));return msg.result;
  }
  await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'admira-store-puerta-cam',version:'1'}});
  await fetcher(IEU+'/hub/mcp',{method:'POST',headers:{...auth,'Content-Type':'application/json',Accept:'application/json, text/event-stream',...(session?{'Mcp-Session-Id':session}:{})},body:JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'}),signal:AbortSignal.timeout(8000)}).catch(()=>null);
  const tools=(await rpc('tools/list',{}))?.tools||[];
  // Las herramientas de listado sin parámetros obligatorios dicen qué oficinas y cámaras hay (y sus IDs).
  const listings={};
  for(const tool of tools.filter(t=>/list|sites|oficina|device|dispositivo|camera|camara|cámara/i.test(t.name)&&!(t.inputSchema?.required||[]).length).slice(0,4)){
    try{listings[tool.name]=await rpc('tools/call',{name:tool.name,arguments:{}});}catch(e){listings[tool.name]={error:String(e.message||e)};}
  }
  return {tools:tools.map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema})),listings};
}
async function diagnose(fetcher,auth){
  const out={};
  // FastAPI responde 422 con los campos que faltan: así se ve el cuerpo que pide /hub/streams.
  const s=await fetcher(IEU+'/hub/streams',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)}).catch(e=>({status:null,error:String(e.message||e)}));
  out.streams={status:s.status??null,body:s.json?await s.json().catch(()=>null):s.error};
  try{out.mcp=await mcp(fetcher,auth);}catch(e){out.mcp={error:String(e.message||e)};}
  return redact(out);
}

export async function onRequest({request,env},fetcher=fetch){
  const url=new URL(request.url),site=siteForHost(url.hostname);
  if(!site)return reply({ok:false,error:'host'},421);
  if(!['GET','POST'].includes(request.method))return reply({ok:false,error:'method'},405);
  // Solo la propia web pide el enlace: otra página no puede usar la sesión de quien la visite.
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return reply({ok:false,error:'origin'},403);
  const session=await readSession(request,env,site,fetcher);
  if(!session||session.lectura)return reply({ok:false,error:'login_required',login:LOGIN_PATH},401);
  const token=cameraToken(env);
  if(!token){
    const diagnostic=request.method==='GET'&&url.searchParams.get('diagnostico')==='1'&&session.superuser;
    return reply({ok:false,error:'not_configured',...(diagnostic?{variables:relatedVariables(env)}:{})},503);
  }
  const auth={Authorization:'Bearer '+token,Accept:'application/json'};
  if(request.method==='GET'){
    if(url.searchParams.get('diagnostico')!=='1')return reply({ok:false,error:'not_found'},404);
    if(!session.superuser)return reply({ok:false,error:'forbidden'},403);
    return reply({ok:true,configured:!!streamRequest(env),diagnostico:await diagnose(fetcher,auth)});
  }
  const body=streamRequest(env);
  if(!body)return reply({ok:false,error:'camera_not_configured'},503);
  const r=await fetcher(IEU+'/hub/streams',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)}).catch(()=>null);
  if(!r)return reply({ok:false,error:'ieu_unreachable'},502);
  const data=await r.json().catch(()=>null);
  if(!r.ok)return reply({ok:false,error:'ieu_'+r.status},502);
  const stream=streamUrlFrom(data);
  return stream?reply({ok:true,url:stream}):reply({ok:false,error:'ieu_no_stream'},502);
}
