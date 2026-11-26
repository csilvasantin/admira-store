// AdmiraDesk · PRUEBA DE PARIDAD de punta a punta, en seco y sin red (26-nov-2026).
// Levanta la vista local, arranca el plugin REAL del Stream Deck (admira-tv, com.admira.admiradesk.sdPlugin)
// contra una app de Stream Deck simulada (WebSocket) y abre el gemelo de control en Chrome. Hace la misma
// secuencia de pulsaciones dos veces: A) en el físico (keyDown al plugin) y B) en el gemelo (clic). Comprueba:
//  1. tras cada pulsación, las 32 teclas que pinta el plugin = las 32 del gemelo = la cara del servidor (SVG idéntico)
//  2. las órdenes de A = las de B, pulsación a pulsación (solo cambia el origen)
//  3. ninguna orden sale a la red (dry)
//   node scripts/lanzadera-paridad.mjs <ruta a plugin.js> [carpeta de capturas]
import http from 'node:http';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {writeFileSync} from 'node:fs';
import {crearServidor, CLAVE_PRUEBA} from './lanzadera-local.mjs';

const PLUGIN = process.argv[2];
const CAPTURAS = process.argv[3] || '';
if (!PLUGIN) { console.error('uso: node scripts/lanzadera-paridad.mjs <plugin.js> [capturas]'); process.exit(2); }
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const POS = []; for (let f = 0; f < 4; f++) for (let c = 0; c < 8; c++) POS.push(c + ',' + f);

// Secuencia: [tecla, avance del reloj ANTES de pulsar (ms), captura opcional]
export const SECUENCIA = [
  ['1,3', 3000, 'inicio'], ['2,3', 3000], ['7,3', 3000], ['3,3', 3000], ['0,3', 3000], ['1,3', 3000], ['3,1', 3000],
  ['4,1', 3000], ['1,0', 3000, 'contenidos'], ['7,2', 3000], ['0,0', 3000],
  ['5,1', 3000], ['2,0', 3000, 'equipos-armado'], ['2,0', 500], ['3,0', 3000], ['3,0', 5000], ['0,0', 3000],
  ['6,1', 3000], ['1,0', 3000], ['1,3', 3000], ['3,3', 3000], ['2,0', 3000, 'sala'], ['3,1', 3000], ['0,0', 3000],
  ['1,1', 3000, 'show'], ['2,0', 3000], ['0,0', 3000]
];

// ── App de Stream Deck simulada (servidor WebSocket mínimo) ───────────────────────────────────
function sdFalso() {
  const pintado = new Map(); let sock = null, buf = Buffer.alloc(0), registrado = null;
  const enviar = (obj) => { const d = Buffer.from(JSON.stringify(obj)); let h;
    if (d.length < 126) h = Buffer.from([0x81, d.length]); else if (d.length < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(d.length, 2); }
    else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(d.length), 2); }
    sock.write(Buffer.concat([h, d])); };
  const ctxDe = (p) => 'ctx-' + p.replace(',', '-');
  const server = http.createServer();
  const listo = new Promise((ok) => { registrado = ok; });
  server.on('upgrade', (req, s) => {
    const acc = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    s.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
    sock = s;
    s.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= 2) {
        let len = buf[1] & 0x7f, off = 2;
        if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
        else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
        if (buf.length < off + 4 + len) return;
        const mask = buf.subarray(off, off + 4), p = Buffer.from(buf.subarray(off + 4, off + 4 + len)); buf = buf.subarray(off + 4 + len);
        for (let i = 0; i < p.length; i++) p[i] ^= mask[i & 3];
        const m = JSON.parse(p.toString('utf8'));
        if (m.event === 'registerPlugin') {
          for (const pos of POS) { const [c, f] = pos.split(',').map(Number);
            enviar({event: 'willAppear', action: 'com.admira.admiradesk.tecla', context: ctxDe(pos), device: 'XL', payload: {coordinates: {column: c, row: f}, settings: {}}}); }
          registrado();
        } else if (m.event === 'setImage') {
          pintado.set(m.context, decodeURIComponent(m.payload.image.replace(/^data:image\/svg\+xml;charset=utf8,/, '')));
        }
      }
    });
  });
  return {server, listo, pintado, pulsar: (pos) => enviar({event: 'keyDown', action: 'com.admira.admiradesk.tecla', context: ctxDe(pos), payload: {coordinates: {}}}),
    cara: () => Object.fromEntries(POS.map((p) => [p, pintado.get(ctxDe(p)) || ''])), cerrar: () => { try { sock && sock.destroy(); } catch {} server.close(); }};
}

function conductor(url) {
  const py = spawn('python3', [path.join(AQUI, 'lanzadera-gemelo-driver.py'), url], {stdio: ['pipe', 'pipe', 'inherit']});
  const lineas = createInterface({input: py.stdout}); const cola = [];
  lineas.on('line', (l) => { const r = JSON.parse(l); const f = cola.shift(); if (f) f(r); });
  const pedir = (o) => new Promise((ok) => { cola.push(ok); py.stdin.write(JSON.stringify(o) + '\n'); });
  return {listo: new Promise((ok) => cola.push(ok)), pedir, cerrar: () => py.kill()};
}

async function main() {
  const local = await crearServidor({puerto: 8820});
  const api = (r, i) => fetch(local.url + r, i).then((x) => x.json());
  const sd = sdFalso(); await new Promise((ok) => sd.server.listen(8821, '127.0.0.1', ok));
  const plugin = spawn(process.execPath, [PLUGIN, '-port', '8821', '-pluginUUID', 'prueba', '-registerEvent', 'registerPlugin', '-info', '{}'],
    {env: {...process.env, ADMIRADESK_API: local.url + '/objeto/stream-deck/api/lanzadera/', ADMIRADESK_CLAVE: CLAVE_PRUEBA, ADMIRADESK_CADA_MS: '250'}, stdio: 'inherit'});
  await sd.listo;
  const gemelo = conductor(local.url + '/control/admiradesk/'); await gemelo.listo;
  const informe = {pasos: [], fallos: []};
  const corridas = {};
  for (const via of ['fisico', 'gemelo']) {
    await api('/__prueba/reset'); await api('/__prueba/reloj?avanzar=60000');
    await espera(1500);
    const ordenes = [];
    for (const [i, [tecla, avance, captura]] of SECUENCIA.entries()) {
      await api('/__prueba/reloj?avanzar=' + avance);
      if (via === 'fisico') sd.pulsar(tecla); else await gemelo.pedir({click: tecla});
      // espera a que el servidor registre la pulsación
      let est; for (let k = 0; k < 40; k++) { est = await api('/control/admiradesk/api/estado'); if ((est.registro || []).length && est.rev >= 1 && est.registro[0].tecla === tecla && est.registro.length >= Math.min(i + 1, 20)) break; await espera(100); }
      const r0 = est.registro[0];
      ordenes.push({tecla, tipo: r0.tipo, origen: r0.origen, ordenes: r0.ordenes});
      // convergencia: plugin = gemelo = servidor
      let ok = false, t0 = Date.now(), servidor, xl, gem;
      while (Date.now() - t0 < 4000) {
        servidor = Object.fromEntries((await api('/control/admiradesk/api/cara')).teclas.map((t) => [t.pos, t.svg]));
        xl = sd.cara(); gem = (await gemelo.pedir({dump: true})).svgs;
        if (POS.every((p) => servidor[p] === xl[p] && servidor[p] === gem[p])) { ok = true; break; }
        await espera(150);
      }
      const ms = Date.now() - t0;
      const distintas = POS.filter((p) => !(servidor[p] === xl[p] && servidor[p] === gem[p]));
      informe.pasos.push({via, paso: i + 1, tecla, tipo: r0.tipo, origen: r0.origen, ordenes: r0.ordenes.length, iguales32: ok, msConvergencia: ms, distintas});
      if (!ok) informe.fallos.push(`${via} paso ${i + 1} (${tecla}): teclas distintas ${distintas.join(' ')}`);
      if (r0.origen !== via) informe.fallos.push(`${via} paso ${i + 1}: origen ${r0.origen}`);
      if (captura && CAPTURAS && via === 'fisico') {
        await gemelo.pedir({captura: path.join(CAPTURAS, `admiradesk-gemelo-${captura}.png`)});
        await gemelo.pedir({xl: POS.map((p) => xl[p]), captura: path.join(CAPTURAS, `admiradesk-xl-cara-${captura}.png`)});
      }
    }
    corridas[via] = ordenes;
  }
  // 2. mismas órdenes en el físico y en el gemelo
  const limpia = (o) => JSON.stringify(o.map(({tecla, tipo, ordenes}) => ({tecla, tipo, ordenes})));
  informe.ordenesIguales = limpia(corridas.fisico) === limpia(corridas.gemelo);
  if (!informe.ordenesIguales) informe.fallos.push('las órdenes del físico y del gemelo no coinciden');
  informe.totalOrdenes = corridas.fisico.reduce((n, o) => n + o.ordenes.length, 0);
  informe.ordenesPorPulsacion = corridas.fisico.map((o) => ({tecla: o.tecla, tipo: o.tipo, ordenes: o.ordenes}));
  // 3. nada salió a la red
  informe.fuera = (await api('/__prueba/fuera')).fuera;
  if (informe.fuera.length) informe.fallos.push('salieron peticiones a la red: ' + informe.fuera.join(' '));
  informe.ok = informe.fallos.length === 0;
  if (CAPTURAS) writeFileSync(path.join(CAPTURAS, 'admiradesk-paridad.json'), JSON.stringify(informe, null, 2));
  console.log(JSON.stringify({ok: informe.ok, pasos: informe.pasos.length, iguales: informe.pasos.filter((p) => p.iguales32).length,
    ordenesIguales: informe.ordenesIguales, totalOrdenes: informe.totalOrdenes, maxMs: Math.max(...informe.pasos.map((p) => p.msConvergencia)), fallos: informe.fallos}, null, 1));
  gemelo.cerrar(); plugin.kill(); sd.cerrar(); await local.cerrar();
  process.exit(informe.ok ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
