// AdmiraDesk · vista LOCAL de la lanzadera (no se publica: /scripts es interno). Sirve el gemelo de control y las
// dos APIs (gemelo con sesión simulada y máquina con clave de prueba) sobre un almacén en memoria, SIEMPRE en seco,
// con el Stock de prueba y sin red: cualquier fetch que no sea el Stock de prueba falla. Reloj controlable para tests.
//   node scripts/lanzadera-local.mjs [puerto]
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {onRequest as apiGemelo} from '../functions/control/admiradesk/api/[[path]].js';
import {lanzaderaMaquina} from '../functions/objeto/stream-deck/api/[[path]].js';
import {almacenMemoria, STOCK} from '../functions/_lanzadera.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CLAVE_PRUEBA = 'sc_' + '0'.repeat(64);
const TIPOS = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json'};

export async function crearServidor({puerto = 8791, reloj0 = Date.UTC(2026, 10, 26, 11, 0, 0)} = {}) {
  const stock = JSON.parse(await readFile(path.join(RAIZ, 'tests/fixtures/lanzadera-stock.json'), 'utf8'));
  let almacen = almacenMemoria(), ahora = reloj0;
  const fuera = [];
  const fetcher = async (url) => {
    if (String(url).startsWith(STOCK)) return Response.json(stock);
    fuera.push(String(url)); throw new Error('sin red en la vista local');
  };
  const site = 'https://www.admira.store';
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://local');
    const cuerpo = await new Promise((ok) => { let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => ok(b)); });
    const enviar = async (r) => { res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); };
    try {
      if (u.pathname === '/__prueba/reloj') { ahora += Number(u.searchParams.get('avanzar') || 0); return enviar(Response.json({ahora})); }
      if (u.pathname === '/__prueba/reset') { almacen = almacenMemoria(); return enviar(Response.json({ok: true})); }
      if (u.pathname === '/__prueba/fuera') return enviar(Response.json({fuera}));
      if (u.pathname.startsWith('/control/admiradesk/api/')) {
        const ruta = u.pathname.slice('/control/admiradesk/api/'.length).split('/').filter(Boolean);
        const h = new Headers(req.headers); if (req.method === 'POST') h.set('Origin', site);   // la vista local hace de mismo origen
        const request = new Request(site + u.pathname, {method: req.method, headers: h, body: req.method === 'POST' ? cuerpo : undefined});
        return enviar(await apiGemelo({request, env: {}, params: {path: ruta}}, fetcher, {readSession: async () => ({email: 'local@prueba'}), almacen, ahora}));
      }
      if (u.pathname.startsWith('/objeto/stream-deck/api/lanzadera/')) {
        if (req.headers.authorization !== 'Bearer ' + CLAVE_PRUEBA) return enviar(Response.json({ok: false, error: 'unauthorized'}, {status: 401}));   // lo que haría la nube
        const request = new Request(site + u.pathname, {method: req.method, headers: new Headers(req.headers), body: req.method === 'POST' ? cuerpo : undefined});
        return enviar(await lanzaderaMaquina(request, {}, u.pathname.split('/lanzadera/')[1], fetcher, {almacen, ahora}));
      }
      if (u.pathname === '/objeto/stream-deck/api/estado') return enviar(Response.json({ok: true, enLinea: true, pageName: 'AdmiraDesk (simulado)'}));
      let f = u.pathname === '/control/admiradesk/' ? '/control/admiradesk/index.html' : u.pathname;
      if (!f.startsWith('/control/admiradesk/') || f.includes('..')) return enviar(new Response('no', {status: 404}));
      const datos = await readFile(path.join(RAIZ, f));
      return enviar(new Response(datos, {headers: {'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store'}}));
    } catch (e) { return enviar(Response.json({ok: false, error: e.message}, {status: 500})); }
  });
  await new Promise((ok) => server.listen(puerto, '127.0.0.1', ok));
  return {server, url: `http://127.0.0.1:${puerto}`, cerrar: () => new Promise((ok) => server.close(ok))};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await crearServidor({puerto: Number(process.argv[2]) || 8791});
  console.log('AdmiraDesk local (DRY, sin red):', s.url + '/control/admiradesk/');
}
