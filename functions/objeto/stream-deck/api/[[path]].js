// API del puente EN VIVO del Stream Deck XL (Carlos, 5-nov-2026 · Woz «continua con el bridge en vivo»).
// AdmiraNeXT01 (antes METAHUMAN) lee el perfil activo de Elgato (ProfilesV3 · Pages.Current), compone la cara 8×4 y la
// sube aquí con la misma clave Bearer sc_… del puente de ventiladores. El gemelo público
// (/objeto/stream-deck/) lee la cara y el estado SIN sesión: es lo que hay sobre la mesa. Esta función
// firma con SUPERCOMPUTER_PROXY_KEY (secreto de Pages) y esa clave nunca llega al navegador.
// Todo vive en el Worker «supercomputer» (admira-tv/tools/player-ventiladores/nube), rutas /streamdeck*.
// Señal de REPOSO (10-nov-2026): el POST puede llevar `reposo` {estado:'reposo'|'activo', desde, ts, fuente,
// playlist, pieza}; esta función solo la valida por encima (objeto o null) y la nube la guarda y la devuelve
// en GET estado. Sin `reposo` todo sigue como antes. Especificación: docs § «Señal de reposo».
// Nota: el Durable Object de la nube se sigue llamando «metahuman» (idFromName): es un id interno; cambiarlo
// perdería el estado guardado, así que se mantiene como alias.
// Guía: admira-xp/docs/objeto-stream-deck.md.
import {siteForHost} from '../../../_perimetro.js';
import {NUBE} from '../../../supercomputer/api/[[path]].js';

const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>Response.json(body,{status,headers:HEADERS});
export const MAX_FACE=1600000;

export const ESTADOS_REPOSO=['reposo','activo'];
// Comprueba solo la forma de la señal de reposo; el resto del cuerpo pasa intacto a la nube.
export function validarReposo(texto){
  let b;try{b=JSON.parse(texto);}catch{return null;} // JSON roto: lo rechaza la nube, como antes
  if(!b||typeof b!=='object'||!('reposo' in b)||b.reposo===null)return null;
  const r=b.reposo;
  if(typeof r!=='object'||Array.isArray(r))return 'reposo';
  if(!ESTADOS_REPOSO.includes(r.estado))return 'reposo_estado';
  if(r.pieza!=null&&(typeof r.pieza!=='object'||Array.isArray(r.pieza)))return 'reposo_pieza';
  return null;
}

export function destinoStreamDeck(method,ruta){
  if(method==='POST'&&(ruta==='face'||ruta==='maquina'))return '/streamdeck';
  if(method==='GET'&&ruta==='face.png')return '/streamdeck/face.png';
  if(method==='GET'&&ruta==='estado')return '/streamdeck/estado';
  return null;
}

export async function onRequest({request,env,params},fetcher=fetch){
  const url=new URL(request.url);
  if(!siteForHost(url.hostname))return reply({ok:false,error:'host'},421);
  const ruta=[].concat(params?.path||[]).join('/');
  const destino=destinoStreamDeck(request.method,ruta);
  if(!destino)return reply({ok:false,error:'not_found'},404);
  const nube=String(env.SUPERCOMPUTER_API||NUBE).replace(/\/$/,'');
  let init;
  if(request.method==='POST'){
    const auth=request.headers.get('Authorization')||'';
    if(!/^Bearer\s+sc_[a-f0-9]{64}$/i.test(auth))return reply({ok:false,error:'unauthorized'},401);
    const body=await request.text();
    if(body.length>MAX_FACE)return reply({ok:false,error:'too_large'},413);
    const fallo=validarReposo(body);
    if(fallo)return reply({ok:false,error:fallo},400);
    init={method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body};
  }else{
    if(!env.SUPERCOMPUTER_PROXY_KEY)return reply({ok:false,error:'not_configured'},503);
    const h={'X-Proxy-Key':env.SUPERCOMPUTER_PROXY_KEY,'X-Usuario':'objeto-publico'};
    const inm=request.headers.get('If-None-Match');if(inm)h['If-None-Match']=inm;
    init={method:'GET',headers:h};
  }
  const r=await fetcher(nube+destino,{...init,signal:AbortSignal.timeout(8000)}).catch(()=>null);
  if(!r)return reply({ok:false,error:'nube_inalcanzable'},502);
  const out={'Content-Type':r.headers.get('content-type')||'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  for(const k of ['etag','x-visto','x-en-linea'])if(r.headers.get(k))out[k]=r.headers.get(k);
  return new Response(r.status===304?null:r.body,{status:r.status,headers:out});
}
