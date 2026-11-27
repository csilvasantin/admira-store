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
//
// Gemelo en AInimation Studio (Carlos, 26-nov-2026 · «lo que pasa en el virtual tiene reflejo en el real y
// viceversa»). El gemelo de AdmiraNeXT05 vive en www.ainimation.studio/digital-twins/admiranext05/ y la cookie
// de sesión de admira.store (SameSite=Lax) no viaja desde otro dominio. Tercer cliente, solo desde ORIGENES_GEMELO:
//  · MIRAR es público, como el gemelo del Stream Deck: GET estado y GET miniatura/<n>.jpg sin sesión. Es lo que
//    ya se ve por el cristal de la caja. El estado sale sin el correo de quien lo cambió ni las salidas de audio.
//  · MANDAR pide un pase: POST escena / POST luz con «Authorization: Bearer gm_…». El pase lo da GET enlace,
//    que se abre en una ventana de admira.store (ahí la cookie sí viaja), comprueba la sesión y se lo entrega
//    al gemelo por postMessage, dirigido solo a su origen. Dura PASE_TTL, va firmado con PERIMETRO_SIGNING_KEY
//    (prefijo propio) y solo vale para esta máquina. Una sesión de solo lectura no recibe pase.
// La cookie de sesión no cambia y ningún otro origen gana nada: sin pase, un POST de fuera sigue en 403.
import {readSession,siteForHost} from '../../../_perimetro.js';

export const NUBE='https://supercomputer-pc-cocina.csilvasantin.workers.dev';
export const LOGIN_PATH='/auth/login?return_to='+encodeURIComponent('/supercomputer/pc-cocina/');
export const ORIGENES_GEMELO=['https://www.ainimation.studio','https://ainimation.studio'];
export const PASE_TTL=3600;   // segundos; al caducar, el gemelo vuelve a pedirlo (un clic si la sesión sigue viva)
export const ENLACE_PATH='/supercomputer/pc-cocina/api/enlace';
const AUD_PASE='gemelo:pc-cocina';
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200,extra={})=>Response.json(body,{status,headers:{...HEADERS,...extra}});

// Qué puede pedir el gemelo (método + ruta) y adónde va en el Worker.
export function destinoGemelo(method,ruta){
  if(method==='GET'&&ruta==='estado')return '/estado';
  if(method==='GET'&&/^miniatura\/[1-9]\.jpg$/.test(ruta))return '/'+ruta;
  if(method==='POST'&&(ruta==='escena'||ruta==='luz'))return '/'+ruta;
  return null;
}

// ── Pase del gemelo de AInimation ──────────────────────────────────────────────
const codificador=new TextEncoder();
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function deBase64url(valor){
  const raw=String(valor).replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(raw+'='.repeat((4-raw.length%4)%4)),c=>c.charCodeAt(0));
}
async function firmar(clave,mensaje){
  const k=await crypto.subtle.importKey('raw',codificador.encode(clave),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return base64url(await crypto.subtle.sign('HMAC',k,codificador.encode(mensaje)));
}
// Comparación en tiempo constante (no revela cuántos caracteres coinciden).
function igual(a,b){
  a=String(a||'');b=String(b||'');
  if(!a||a.length!==b.length)return false;
  let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);
  return d===0;
}
export async function crearPase(env,email,ahora=Math.floor(Date.now()/1000)){
  if(!env.PERIMETRO_SIGNING_KEY||!email)throw Error('login_required');
  const exp=ahora+PASE_TTL;
  const carga=base64url(codificador.encode(JSON.stringify({v:1,aud:AUD_PASE,email,iat:ahora,exp})));
  return {pase:'gm_'+carga+'.'+await firmar(env.PERIMETRO_SIGNING_KEY,'gemelo-pase:'+carga),exp};
}
export async function leerPase(token,env,ahora=Math.floor(Date.now()/1000)){
  try{
    if(!env.PERIMETRO_SIGNING_KEY||typeof token!=='string'||!token.startsWith('gm_')||token.length>1024)return null;
    const corte=token.lastIndexOf('.');
    if(corte<4)return null;
    const carga=token.slice(3,corte);
    if(!igual(token.slice(corte+1),await firmar(env.PERIMETRO_SIGNING_KEY,'gemelo-pase:'+carga)))return null;
    const p=JSON.parse(new TextDecoder().decode(deBase64url(carga)));
    if(p.v!==1||p.aud!==AUD_PASE||typeof p.email!=='string'||!p.email||Number(p.exp)<=ahora||Number(p.iat)>ahora+60)return null;
    return {email:p.email,exp:Number(p.exp)};
  }catch{return null;}
}

// Lo que ve cualquiera desde el gemelo público: sin el correo de quien mandó el último cambio y sin los nombres
// de los dispositivos de audio del PC.
export function estadoPublico(d){
  if(!d||typeof d!=='object')return d;
  const out={...d};
  if(out.deseado&&typeof out.deseado==='object'){out.deseado={...out.deseado};delete out.deseado.por;}
  if(out.informe&&typeof out.informe==='object'&&out.informe.audio&&typeof out.informe.audio==='object'){
    out.informe={...out.informe,audio:{...out.informe.audio}};delete out.informe.audio.salidas;
  }
  return out;
}

async function reenviar(fetcher,url,init,extra={},transformar=null){
  const r=await fetcher(url,{...init,signal:AbortSignal.timeout(8000)}).catch(()=>null);
  if(!r)return reply({ok:false,error:'nube_inalcanzable'},502,extra);
  const headers={...extra,'Content-Type':r.headers.get('content-type')||'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(transformar&&r.ok){
    const d=await r.json().catch(()=>null);
    if(!d)return reply({ok:false,error:'nube_ilegible'},502,extra);
    return new Response(JSON.stringify(transformar(d)),{status:r.status,headers});
  }
  return new Response(r.body,{status:r.status,headers});
}

// GET enlace?o=<origen del gemelo>: ventana de admira.store que entrega el pase al gemelo que la abrió.
const PAGINA_HEADERS=nonce=>({
  'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',
  'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`
});
function paginaEnlace(origen,mensaje){
  const nonce=base64url(crypto.getRandomValues(new Uint8Array(16)));
  // El JSON va dentro de un <script>: «<» escapado para que ningún dato pueda cerrarlo.
  const datos=JSON.stringify({origen,mensaje}).replace(/</g,'\\u003c');
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Enlazar el gemelo · admira.store</title>
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#05070d;color:#e8f0ff;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box}</style>
</head><body><p id="m">Enlazando el gemelo…</p>
<script nonce="${nonce}">
const d=${datos},m=document.getElementById('m');
if(window.opener&&!window.opener.closed){
  window.opener.postMessage(d.mensaje,d.origen);
  m.textContent=d.mensaje.error?'Tu acceso es de solo lectura: el gemelo se queda en modo mirar. Puedes cerrar esta ventana.':'Gemelo enlazado. Puedes cerrar esta ventana.';
  if(!d.mensaje.error)setTimeout(()=>window.close(),400);
}else m.textContent='Sesión iniciada. Vuelve al gemelo y pulsa «Conectar» otra vez.';
</script></body></html>`;
  return new Response(html,{status:200,headers:PAGINA_HEADERS(nonce)});
}
async function enlace(request,env,site,url,fetcher){
  if(request.method!=='GET')return reply({ok:false,error:'method'},405);
  const origen=url.searchParams.get('o')||'';
  if(!ORIGENES_GEMELO.includes(origen))return reply({ok:false,error:'origin'},403);
  const session=await readSession(request,env,site,fetcher);
  if(!session){
    const vuelta=ENLACE_PATH+'?o='+encodeURIComponent(origen);
    return new Response(null,{status:302,headers:{Location:'/auth/login?return_to='+encodeURIComponent(vuelta),'Cache-Control':'no-store'}});
  }
  const base={type:'admira:supercomputer:pase',maquina:'pc-cocina'};
  if(session.lectura)return paginaEnlace(origen,{...base,error:'read_only'});
  const {pase,exp}=await crearPase(env,session.email||'agente');
  return paginaEnlace(origen,{...base,pase,exp,email:session.email||''});
}

export async function onRequest({request,env,params},fetcher=fetch){
  const url=new URL(request.url),site=siteForHost(url.hostname);
  if(!site)return reply({ok:false,error:'host'},421);
  const ruta=[].concat(params?.path||[]).join('/');
  const nube=String(env.SUPERCOMPUTER_PC_COCINA_API||NUBE).replace(/\/$/,'');
  const origin=request.headers.get('Origin')||'';
  const gemelo=ORIGENES_GEMELO.includes(origin);
  const cors=gemelo?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};

  // Preflight del gemelo de AInimation: solo para lo que el gemelo puede pedir.
  if(request.method==='OPTIONS'){
    const pedido=request.headers.get('Access-Control-Request-Method')||'GET';
    if(!gemelo||!destinoGemelo(pedido,ruta))return reply({ok:false,error:'origin'},403);
    return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600','Cache-Control':'no-store'}});
  }

  if(ruta==='maquina'){
    if(request.method!=='POST')return reply({ok:false,error:'method'},405);
    const auth=request.headers.get('Authorization')||'';
    if(!/^Bearer\s+sc_[a-f0-9]{64}$/i.test(auth))return reply({ok:false,error:'unauthorized'},401);
    const body=await request.text();
    if(body.length>400000)return reply({ok:false,error:'too_large'},413);
    return reenviar(fetcher,nube+'/maquina',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body});
  }

  if(ruta==='enlace')return enlace(request,env,site,url,fetcher);

  if(!['GET','POST'].includes(request.method))return reply({ok:false,error:'method'},405);

  // Gemelo de AInimation (otro dominio): mirar es público; mandar pide el pase de GET enlace.
  if(gemelo){
    const destino=destinoGemelo(request.method,ruta);
    if(!destino)return reply({ok:false,error:'not_found'},404,cors);
    if(!env.SUPERCOMPUTER_PC_COCINA_PROXY_KEY)return reply({ok:false,error:'not_configured'},503,cors);
    if(request.method==='GET'){
      return reenviar(fetcher,nube+destino,{method:'GET',headers:{'X-Proxy-Key':env.SUPERCOMPUTER_PC_COCINA_PROXY_KEY,'X-Usuario':'gemelo-publico'}},
        cors,ruta==='estado'?estadoPublico:null);
    }
    const auth=request.headers.get('Authorization')||'';
    const pase=await leerPase(auth.replace(/^Bearer\s+/i,''),env);
    if(!pase)return reply({ok:false,error:'enlace_required',enlace:url.origin+ENLACE_PATH+'?o='+encodeURIComponent(origin)},401,cors);
    const body=await request.text();
    if(body.length>20000)return reply({ok:false,error:'too_large'},413,cors);
    return reenviar(fetcher,nube+destino,{method:'POST',body,headers:{
      'X-Proxy-Key':env.SUPERCOMPUTER_PC_COCINA_PROXY_KEY,'X-Usuario':pase.email,'Content-Type':'application/json'}},cors);
  }

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
