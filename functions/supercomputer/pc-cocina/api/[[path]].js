// Copia independiente para PC-COCINA (Carlos, 4-nov-2026): Worker supercomputer-pc-cocina, secreto de Pages
// SUPERCOMPUTER_PC_COCINA_PROXY_KEY. Misma comprobación de sesión que /supercomputer/api. No toca METAHUMAN.
// API del gemelo de la Supercomputer (Carlos, 4-nov-2026 · proyecto dirigido por Woz).
// La Supercomputer es la «store» de los 7 ventiladores con pantalla LCD de METAHUMAN: el gemelo
// (/supercomputer/) manda el modo de las pantallas y la iluminación, y ve en vivo lo que pintan.
// Dos clientes, una sola puerta en el dominio (los ISP españoles bloquean *.workers.dev a ratos):
//  · el gemelo, con la sesión de admira.store: GET estado, GET miniatura/<n>.jpg, POST escena, POST luz;
//  · el puente de METAHUMAN, con su clave Bearer: POST maquina (la valida el Worker, no esta función).
// Todo se reenvía por dentro de Cloudflare al Worker «supercomputer» (Durable Object), que vive en
// admira-tv/tools/player-ventiladores/nube. Esta función firma con SUPERCOMPUTER_PROXY_KEY (secreto de
// Pages) y le dice quién es el usuario; esa clave nunca llega al navegador.
// Guía: admira-xp/docs/supercomputer.md.
import {readSession,siteForHost} from '../../../_perimetro.js';

export const NUBE='https://supercomputer-pc-cocina.csilvasantin.workers.dev';
export const LOGIN_PATH='/auth/login?return_to='+encodeURIComponent('/supercomputer/pc-cocina/');
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>Response.json(body,{status,headers:HEADERS});

// Qué puede pedir el gemelo (método + ruta) y adónde va en el Worker.
export function destinoGemelo(method,ruta){
  if(method==='GET'&&ruta==='estado')return '/estado';
  if(method==='GET'&&/^miniatura\/[1-9]\.jpg$/.test(ruta))return '/'+ruta;
  if(method==='POST'&&(ruta==='escena'||ruta==='luz'))return '/'+ruta;
  return null;
}

async function reenviar(fetcher,url,init){
  const r=await fetcher(url,{...init,signal:AbortSignal.timeout(8000)}).catch(()=>null);
  if(!r)return reply({ok:false,error:'nube_inalcanzable'},502);
  return new Response(r.body,{status:r.status,headers:{'Content-Type':r.headers.get('content-type')||'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

export async function onRequest({request,env,params},fetcher=fetch){
  const url=new URL(request.url),site=siteForHost(url.hostname);
  if(!site)return reply({ok:false,error:'host'},421);
  const ruta=[].concat(params?.path||[]).join('/');
  const nube=String(env.SUPERCOMPUTER_PC_COCINA_API||NUBE).replace(/\/$/,'');

  if(ruta==='maquina'){
    if(request.method!=='POST')return reply({ok:false,error:'method'},405);
    const auth=request.headers.get('Authorization')||'';
    if(!/^Bearer\s+sc_[a-f0-9]{64}$/i.test(auth))return reply({ok:false,error:'unauthorized'},401);
    const body=await request.text();
    if(body.length>400000)return reply({ok:false,error:'too_large'},413);
    return reenviar(fetcher,nube+'/maquina',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body});
  }

  if(!['GET','POST'].includes(request.method))return reply({ok:false,error:'method'},405);
  // Solo la propia web cambia la escena o la luz: otra página no puede usar la sesión de quien la visite.
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return reply({ok:false,error:'origin'},403);
  const session=await readSession(request,env,site,fetcher);
  if(!session)return reply({ok:false,error:'login_required',login:LOGIN_PATH},401);
  if(session.lectura&&request.method!=='GET')return reply({ok:false,error:'read_only'},403);
  const destino=destinoGemelo(request.method,ruta);
  if(!destino)return reply({ok:false,error:'not_found'},404);
  if(!env.SUPERCOMPUTER_PC_COCINA_PROXY_KEY)return reply({ok:false,error:'not_configured'},503);
  const body=request.method==='POST'?await request.text():undefined;
  if(body&&body.length>20000)return reply({ok:false,error:'too_large'},413);
  return reenviar(fetcher,nube+destino,{method:request.method,body,headers:{
    'X-Proxy-Key':env.SUPERCOMPUTER_PC_COCINA_PROXY_KEY,'X-Usuario':session.email||'agente','Content-Type':'application/json'}});
}
