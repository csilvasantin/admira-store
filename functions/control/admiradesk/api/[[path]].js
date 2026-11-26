// AdmiraDesk · API del gemelo de CONTROL (Carlos, 26-nov-2026). Solo con sesión de Google del perímetro:
// /control/ no es una ruta pública y además esta función comprueba la sesión ella misma (las peticiones que no son
// documento pasan el perímetro sin login). POST solo desde la propia web; una cuenta de solo lectura no pulsa.
// La nube recibe X-Proxy-Key (secreto de Pages) y nunca llega al navegador. Guía: admira-xp/docs/lanzadera-admiradesk.md
import {readSession, siteForHost} from '../../../_perimetro.js';
import {NUBE} from '../../../supercomputer/api/[[path]].js';
import {almacenNube, atender, leerCuerpo, reply} from '../../../_lanzadera.js';

export const LOGIN_PATH = '/auth/login?return_to=' + encodeURIComponent('/control/admiradesk/');

export async function onRequest({request, env, params}, fetcher = fetch, opciones = {}) {
  const url = new URL(request.url), site = siteForHost(url.hostname);
  if (!site) return reply({ok: false, error: 'host'}, 421);
  const ruta = [].concat(params?.path || []).join('/');
  if (!['GET', 'POST'].includes(request.method)) return reply({ok: false, error: 'method'}, 405);
  if (request.method === 'POST' && request.headers.get('Origin') !== url.origin) return reply({ok: false, error: 'origin'}, 403);
  const session = await (opciones.readSession || readSession)(request, env, site, fetcher);
  if (!session) return reply({ok: false, error: 'login_required', login: LOGIN_PATH}, 401);
  if (session.lectura && request.method !== 'GET') return reply({ok: false, error: 'read_only'}, 403);
  let almacen = opciones.almacen;
  if (!almacen) {
    if (!env.SUPERCOMPUTER_PROXY_KEY) return reply({ok: false, error: 'not_configured'}, 503);
    const nube = String(env.SUPERCOMPUTER_API || NUBE).replace(/\/$/, '');
    almacen = almacenNube(nube, {'X-Proxy-Key': env.SUPERCOMPUTER_PROXY_KEY, 'X-Usuario': session.email || 'agente'}, fetcher);
  }
  let cuerpo;
  if (request.method === 'POST') {
    const leido = await leerCuerpo(request);
    if (leido.error) return reply({ok: false, error: leido.error}, 400);
    cuerpo = {...leido.cuerpo, origen: 'gemelo'};   // el gemelo siempre firma como gemelo
  }
  try { return await atender({ruta, method: request.method, cuerpo, almacen, env, fetcher, ahora: opciones.ahora}); }
  catch (e) { return reply({ok: false, error: String(e.message || e).slice(0, 80)}, 502); }
}
