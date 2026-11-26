// AdmiraDesk · servidor de la lanzadera (Carlos, 26-nov-2026). Lo comparten las dos caras:
//  · el gemelo de control (/control/admiradesk/, con login de Google) por functions/control/admiradesk/api/
//  · el plugin del Stream Deck XL (AdmiraNeXT01) por /objeto/stream-deck/api/lanzadera/* con su clave Bearer
// Las dos piden la MISMA cara (GET cara) y mandan la MISMA pulsación (POST pulsar): una sola ruta de acción.
// El estado vive en la nube de la Supercomputer (Durable Object, /lanzadera/estado, con revisión).
// Por defecto TODO es en seco (dry): solo se envían órdenes reales con LANZADERA_EN_VIVO=1 en Pages.
// Guía: admira-xp/docs/lanzadera-admiradesk.md
import cfg from '../control/admiradesk/lanzadera.json' with {type: 'json'};
import * as L from '../control/admiradesk/lanzadera.mjs';

export const CONFIG = cfg;
export const STOCK = 'https://stock.admira.store/stock/index.json';
export const CMD = 'https://api.admira.store/locations/cmd';
export const RELOJ = 'https://brain.digitalavatar.ai/sync/clock';
const HEADERS = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow'};
export const reply = (body, status = 200) => Response.json(body, {status, headers: HEADERS});

export function enVivo(env, cuerpo) { return env?.LANZADERA_EN_VIVO === '1' && !(cuerpo && cuerpo.dry === true); }

// Almacén del estado en la nube (compare-and-set por revisión: dos pulsaciones a la vez no se pisan).
export function almacenNube(nube, cabeceras, fetcher = fetch) {
  return {
    async leer() {
      const r = await fetcher(nube + '/lanzadera/estado', {headers: cabeceras, signal: AbortSignal.timeout(8000)}).catch(() => null);
      if (!r || !r.ok) throw new Error(r ? 'nube_' + r.status : 'nube_inalcanzable');
      const j = await r.json();
      return {estado: j.estado || null, rev: Number(j.rev) || 0};
    },
    async escribir(estado, rev) {
      const r = await fetcher(nube + '/lanzadera/estado', {method: 'PUT', headers: {...cabeceras, 'Content-Type': 'application/json'},
        body: JSON.stringify({estado, rev}), signal: AbortSignal.timeout(8000)}).catch(() => null);
      if (r && r.status === 409) return null;
      if (!r || !r.ok) throw new Error(r ? 'nube_' + r.status : 'nube_inalcanzable');
      return Number((await r.json()).rev) || rev + 1;
    }
  };
}

// Almacén en memoria: pruebas y vista local (mismo contrato que la nube).
export function almacenMemoria() {
  let estado = null, rev = 0;
  return {
    async leer() { return {estado: estado && JSON.parse(JSON.stringify(estado)), rev}; },
    async escribir(nuevo, previa) { if (previa !== rev) return null; estado = JSON.parse(JSON.stringify(nuevo)); rev += 1; return rev; }
  };
}

let cachePiezas = {t: 0, piezas: []};
export async function piezas(fetcher = fetch, ahora = Date.now()) {
  if (ahora - cachePiezas.t < 60000) return cachePiezas.piezas;
  try {
    const r = await fetcher(STOCK + '?t=' + ahora, {signal: AbortSignal.timeout(6000)});
    if (r.ok) cachePiezas = {t: ahora, piezas: L.piezasDeStock(await r.json(), cfg.piezas.etiqueta)};
  } catch {}
  return cachePiezas.piezas;
}
export function fijarPiezas(lista, ahora = Date.now()) { cachePiezas = {t: ahora, piezas: lista}; }

// Envío real de las órdenes. En seco no sale nada: devuelve lo que se habría mandado.
export async function ejecutar(ordenes, env, fetcher = fetch, dry = true) {
  if (dry) return {ok: ordenes.length, total: ordenes.length, dry: true, detalle: ordenes.map((o) => ({...o, simulado: true}))};
  let at = null;
  if (ordenes.some((o) => o.sincro)) {
    const r = await fetcher(RELOJ, {signal: AbortSignal.timeout(5000)}).then((x) => x.json()).catch(() => null);
    if (r && r.ok && r.protocol === 'admira-clock-v1' && Number.isInteger(r.serverSentAt)) at = r.serverSentAt + (cfg.adelantoSincroMs || 2500);
  }
  const uno = async (o) => {
    try {
      if (o.via === 'cmd') {
        const cmd = o.sincro ? (at ? o.cmd + '-' + at : o.cmd.replace(/^playat-/, 'loop')) : o.cmd;
        const r = await fetcher(env.LANZADERA_CMD || CMD, {method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({id: o.id, screen: o.id, cmd}), signal: AbortSignal.timeout(5000)});
        return {...o, cmd, ok: r.ok};
      }
      if (o.via === 'panel') {
        if (!env.PANEL_URL || !env.PANEL_TOKEN) return {...o, ok: false, error: 'panel_no_configurado'};
        const h = {'Content-Type': 'application/json', 'X-Panel-Token': env.PANEL_TOKEN};
        if (env.PANEL_ACCESS_ID && env.PANEL_ACCESS_SECRET) { h['CF-Access-Client-Id'] = env.PANEL_ACCESS_ID; h['CF-Access-Client-Secret'] = env.PANEL_ACCESS_SECRET; }
        const r = await fetcher(String(env.PANEL_URL).replace(/\/$/, '') + o.ruta, {method: 'POST', headers: h, body: JSON.stringify(o.cuerpo), signal: AbortSignal.timeout(8000)});
        return {...o, ok: r.ok};
      }
      return {...o, ok: false, error: 'via'};
    } catch (e) { return {...o, ok: false, error: String(e.message || e).slice(0, 80)}; }
  };
  const detalle = await Promise.all(ordenes.map(uno));
  return {ok: detalle.filter((d) => d.ok).length, total: ordenes.length, dry: false, detalle};
}

export function vistaCara(estado, rev, ctx, dry) {
  const teclas = L.cara(cfg, estado, ctx);
  const e = estado || L.estadoInicial(cfg);
  return {ok: true, rev, ahora: ctx.ahora, dry, pagina: e.pagina, paginaTitulo: (cfg.paginas[e.pagina] || {}).titulo || '',
    huella: L.huella(teclas), teclas, ultima: e.ultima || null, armado: e.armado || null};
}

// Atiende cara / estado / pulsar con el almacén dado. `ahora` se puede fijar en pruebas.
export async function atender({ruta, method, cuerpo, almacen, env = {}, fetcher = fetch, ahora = Date.now()}) {
  const dry = !enVivo(env, cuerpo);
  const ctx = {ahora, piezas: await piezas(fetcher, ahora)};
  if (ruta === 'cara' && method === 'GET') {
    const {estado, rev} = await almacen.leer();
    return reply(vistaCara(estado, rev, ctx, dry));
  }
  if (ruta === 'estado' && method === 'GET') {
    const {estado, rev} = await almacen.leer();
    const e = estado || L.estadoInicial(cfg);
    return reply({ok: true, rev, dry, pagina: e.pagina, sel: e.sel, carrusel: e.carrusel, ultima: e.ultima, registro: e.registro || []});
  }
  if (ruta === 'pulsar' && method === 'POST') {
    if (!cuerpo || typeof cuerpo.tecla !== 'string') return reply({ok: false, error: 'tecla'}, 400);
    for (let intento = 0; intento < 4; intento++) {
      const {estado, rev} = await almacen.leer();
      const r = L.pulsar(cfg, estado, {tecla: cuerpo.tecla, origen: cuerpo.origen}, ctx);
      if (!r.respuesta.ok) return reply({ok: false, error: r.respuesta.error}, 400);
      let nueva = await almacen.escribir(r.estado, rev);
      if (nueva === null) continue;   // otra pulsación ganó: se repite sobre el estado nuevo
      let final = r.estado;
      if (r.ordenes.length) {
        const envio = await ejecutar(r.ordenes, env, fetcher, dry);
        final = L.resolver(r.estado, envio.ok, envio.total, envio.dry);
        const otra = await almacen.escribir(final, nueva);
        if (otra !== null) nueva = otra;
        return reply({...vistaCara(final, nueva, ctx, dry), respuesta: r.respuesta, ordenes: envio.detalle});
      }
      return reply({...vistaCara(final, nueva, ctx, dry), respuesta: r.respuesta, ordenes: []});
    }
    return reply({ok: false, error: 'conflicto'}, 409);
  }
  return reply({ok: false, error: 'not_found'}, 404);
}

export async function leerCuerpo(request) {
  const texto = await request.text();
  if (texto.length > 4000) return {error: 'too_large'};
  try { return {cuerpo: JSON.parse(texto || '{}')}; } catch { return {error: 'json'}; }
}
