// Planos de Xpacio (/data/xpacios/<id>.json) según la sesión (misión DCL-6ae9d5b0e2d48ee2fd9c7b19).
// Con sesión del perímetro: el plano completo (inventario ITIL, screenIds, dirección).
// Sin sesión: su versión pública (plano-publico.mjs), sin ITIL ni mapa de pantallas reales.
// El perímetro deja pasar las peticiones que no son documento; por eso la decisión vive aquí.
import {readSession, siteForHost} from '../../_perimetro.js';
import {planoPublico} from '../../../xpacios/plano-publico.mjs';

const ID = /^[a-z0-9][a-z0-9-]{0,79}\.json$/;
const cabeceras = {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'private, no-store', 'Vary':'Cookie', 'X-Robots-Tag':'noindex'};

export async function conSesion(request, env, fetchImpl = fetch) {
  const site = siteForHost(new URL(request.url).hostname);
  return Boolean(site && await readSession(request, env, site, fetchImpl));
}

export async function onRequestGet(context, fetchImpl = fetch) {
  const {request, env, params} = context;
  if (!ID.test(String(params && params.id || ''))) return Response.json({error:'plano_no_valido'}, {status:404, headers:cabeceras});
  const estatico = await context.next();
  if (!estatico.ok) return new Response(estatico.body, {status:estatico.status, headers:cabeceras});
  let plan;
  try { plan = await estatico.json(); } catch (_) { return Response.json({error:'plano_ilegible'}, {status:502, headers:cabeceras}); }
  let sesion = false;
  try { sesion = await conSesion(request, env, fetchImpl); } catch (_) { sesion = false; }
  return new Response(JSON.stringify(sesion ? plan : planoPublico(plan)), {status:200, headers:{...cabeceras, 'X-Xpacio-Acceso':sesion ? 'sesion' : 'publico'}});
}
