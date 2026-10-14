// Espejo de solo lectura de lo que emite AHORA una pantalla real (misión DCL-6ae9d5b0e2d48ee2fd9c7b19).
// Lee /signage/now de api.admira.store (lo publica el canal de admira.tv de cada equipo; lo
// mismo que consume la ficha de admira.biz) y devuelve sólo el asset en emisión: ni IP, ni
// telemetría, ni salud. Requiere sesión: qué pantalla real emite qué es parte del mapa ITIL.
// api.admira.store no admite CORS desde www.admira.store, de ahí este paso por el mismo origen.
import {mediaAccess, mediaJson} from '../_media-access.js';

export const SIGNAGE_NOW = 'https://api.admira.store/signage/now';
const PANTALLA = /^[a-z0-9][a-z0-9-]{2,80}$/;
const campos = it => {
  if (!it || typeof it !== 'object' || !it.url) return null;
  let url = '';
  try { const u = new URL(String(it.url)); if (u.protocol === 'https:' && !u.username && !u.password) url = u.href; } catch (_) {}
  if (!url) return null;
  const n = v => (Number.isFinite(Number(v)) ? Number(v) : null);
  return {id:String(it.id ?? ''), url, type:String(it.type || 'image'), name:String(it.name || it.title || '').slice(0, 120), ts:n(it.ts), startedAt:n(it.startedAt), dur:n(it.dur)};
};

export function senalLimpia(screen, j) {
  const visto = j && Number(j.lastSeen);
  return {screen, item:campos(j && j.item), standby:Boolean(j && j.standby), lastSeen:Number.isFinite(visto) && visto > 0 ? visto : null};
}

export async function onRequestGet({request, env}, fetchImpl = fetch) {
  const access = await mediaAccess(request, env, fetchImpl);
  if (access.response) return access.response;
  const screen = new URL(request.url).searchParams.get('screen') || '';
  if (!PANTALLA.test(screen)) return mediaJson('pantalla_no_valida', 400);
  try {
    const r = await fetchImpl(`${SIGNAGE_NOW}?screen=${encodeURIComponent(screen)}`, {cache:'no-store', headers:{Accept:'application/json'}});
    if (!r.ok) return mediaJson('senal_no_disponible', 502);
    return Response.json(senalLimpia(screen, await r.json()), {headers:{'Cache-Control':'private, no-store'}});
  } catch (_) { return mediaJson('senal_no_disponible', 502); }
}
