// API del puente EN VIVO del Stream Deck XL (Carlos, 5-nov-2026 · Woz «continua con el bridge en vivo»).
// METAHUMAN lee el perfil activo de Elgato (ProfilesV3 · Pages.Current), compone la cara 8×4 y la
// sube aquí con la misma clave Bearer sc_… del puente de ventiladores. El gemelo público
// (/objeto/stream-deck/) lee la cara y el estado SIN sesión: es lo que hay sobre la mesa. Esta función
// firma con SUPERCOMPUTER_PROXY_KEY (secreto de Pages) y esa clave nunca llega al navegador.
// Todo vive en el Worker «supercomputer» (admira-tv/tools/player-ventiladores/nube), rutas /streamdeck*.
// Guía: admira-xp/docs/objeto-stream-deck.md.
import {siteForHost} from '../../../_perimetro.js';
import {NUBE} from '../../../supercomputer/api/[[path]].js';

const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>Response.json(body,{status,headers:HEADERS});
export const MAX_FACE=1600000;

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
