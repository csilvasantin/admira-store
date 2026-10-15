// Los 18 espacios Altadis: índice de formatos, planos de los 36 espacios (copia local),
// fuentes con respaldo, elección del contenido, enlaces, encuadre, placeholder y la página.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  validarIndice, validarPlanoEspacio, planoEspacioPublico, cargarConRespaldo, cargarIndice, cargarPlanoEspacio, elegirContenido, posterDe,
  destinoDesdeURL, resolverEspacio, vecino, queryEspacio, medidaFisica, pantallasDelFormato, formatoDe,
  STUDIO, ARQUITECTO, INDICE_COMPARTIDO, INDICE_LOCAL, PLANO_COMPARTIDO, PLANO_LOCAL, MANIFIESTO, TEMA_DE_TIPO,
  ESPERA_COMPARTIDO_MS, RECORRIDO_MS, RECORRIDO_MAX_MS, MANIFIESTO_XTANCO, fuentesManifiesto, cargarManifiesto, tituloCampana, conVersion, MONTAJES, PAREDES, textoMontaje, textoPared, textoZona, textoEntrega,
} from './espacios.mjs';
import { encuadre, esquinas, svgFormato, celdasFormato, posicionOrbita, camaraEncuadre, GIRO_CUBO, fovPara, distanciaEnZona, planosCamara, puntosVisibles } from './vista.mjs';
import { uvsFormato } from './recorte.mjs';
import { tamanoPlaceholder, barrido, reloj, rotulos } from './placeholder.mjs';
import { escenaDesdePlano, medidasCubo, tipoMueble, panelSize } from '../gran-de-gracia-51/plano3d.mjs';
import { CAMPOS_PRIVADOS } from '../plano-publico.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const read = p => readFileSync(repo + p, 'utf8');
const INDICE = JSON.parse(read('xpacios/altadis-18/planos/altadis-18.json'));
const plano = id => JSON.parse(read(`xpacios/altadis-18/planos/${id}.json`));
const clon = o => JSON.parse(JSON.stringify(o));

// Respuestas falsas de fetch: url → { status, tipo, cuerpo } (o una función que lanza).
function falso(mapa) {
  const pedidas = [];
  const fetchImpl = async (url, opts) => {
    pedidas.push({ url, opts });
    const r = mapa[url];
    if (!r) return { ok: false, status: 404, headers: { get: () => 'text/html' }, json: async () => { throw new Error('html'); } };
    if (typeof r === 'function') return r();
    return { ok: (r.status || 200) < 400, status: r.status || 200, headers: { get: () => r.tipo || 'application/json' }, json: async () => clon(r.cuerpo) };
  };
  return { fetchImpl, pedidas };
}

test('local index: the 18 Altadis formats, each with its Xtanco and Starbucks space', () => {
  const { errores, avisos } = validarIndice(INDICE);
  assert.deepEqual(errores, []);
  assert.deepEqual(avisos, []);
  assert.equal(INDICE.formatos.length, 18);
  assert.deepEqual(INDICE.formatos.map(f => f.formato), Array.from({ length: 18 }, (_, i) => `cliente-${String(i + 1).padStart(2, '0')}`));
  const vw = formatoDe(INDICE, 'cliente-15');
  assert.deepEqual([vw.nombre, vw.ancho, vw.alto, vw.pantallas, vw.grid.cols, vw.grid.rows], ['VIDEOWALL 4X1 H', 3840, 540, 4, 4, 1]);
  assert.deepEqual(vw.espacios, { xtanco: 'altadis-xtanco-15', cafe: 'altadis-cafe-15' });
});

test('the index validator catches what would break the gallery', () => {
  const malo = clon(INDICE);
  delete malo.tipos.cafe;
  malo.formatos[1].formato = 'cliente-01';
  malo.formatos[2].espacios.cafe = 'altadis-xtanco-03';
  malo.formatos[3].grid = { cols: 0, rows: 1 };
  const { errores } = validarIndice(malo);
  assert.ok(errores.some(e => /tipo «cafe»/.test(e)));
  assert.ok(errores.some(e => /repetido: «cliente-01»/.test(e)));
  assert.ok(errores.some(e => /espacio cafe/.test(e)));
  assert.ok(errores.some(e => /rejilla/.test(e)));
  assert.match(validarIndice({ ...clon(INDICE), schema: 'otro' }).errores[0], /admira\.espacios-formato\/1/);
  assert.match(validarIndice({ ...clon(INDICE), formatos: INDICE.formatos.slice(0, 3) }).avisos[0], /3 formatos/);
});

test('the 36 local plans are valid admira.xpacio-plano/1 spaces of their format, and the 3D scene builds', () => {
  for (const f of INDICE.formatos) for (const tipo of ['xtanco', 'cafe']) {
    const p = plano(f.espacios[tipo]);
    const { errores, avisos } = validarPlanoEspacio(p, f);
    assert.deepEqual(errores, [], p.id);
    assert.deepEqual(avisos, [], p.id);
    assert.equal(p.id, f.espacios[tipo]);
    assert.deepEqual(p.espacio, { serie: 'altadis-18', tipo, n: f.n });
    const suyas = pantallasDelFormato(p);
    assert.equal(suyas.length, f.pantallas, `${p.id}: one physical screen per grid cell`);
    const e = escenaDesdePlano(p);
    for (const s of e.pantallas) {
      const w = e.paredes.find(x => x.id === s.pared);
      assert.ok(s.cubo || (s.x0 >= -0.01 && s.x1 <= w.len + 0.01), `${p.id}/${s.id} fits its wall`);
      assert.ok(s.z >= 0 && s.z1 <= e.sala.alto + 1e-6, `${p.id}/${s.id} fits under the ceiling`);
      if (s.formato) assert.deepEqual(s.lienzo, [f.ancho, f.alto], 'the screen knows the format canvas, not screenGeometry\'s');
    }
    for (const o of [p, ...p.pantallas, ...(p.dispositivos || []), ...(p.mobiliario || [])]) for (const campo of CAMPOS_PRIVADOS) assert.ok(!(campo in o), `${p.id} has no ${campo}`);
  }
});

test('LED formats: metres instead of inches, the gondola is 1:6 and the cube is one screen with four faces', () => {
  const gondola = pantallasDelFormato(plano('altadis-xtanco-10'))[0];
  assert.equal(gondola.tecnologia, 'led');
  assert.ok(gondola.dimensiones && gondola.pasoPixelMm > 0, 'LEDs come in metres with their pixel pitch');
  const g = panelSize(gondola);
  assert.ok(Math.abs(g.h / g.w - 6) < 1e-9, 'panelSize keeps the 64 × 384 proportion from metres');
  const cubo = pantallasDelFormato(plano('altadis-cafe-08'));
  assert.equal(cubo.length, 1);
  assert.equal(cubo[0].forma, 'cubo-4-caras');
  const pc = plano('altadis-cafe-08'), e = escenaDesdePlano(pc).pantallas[0];
  assert.ok(e.cubo && Math.abs(e.cubo.lado / e.cubo.alto - 400 / 600) < 1e-9, 'each face keeps the 400 × 600 proportion');
  assert.deepEqual([e.centro[0], e.centro[1]], pc.pantallas[0].cubo.centro, 'the prism stands where cubo.centro says, not on the unfolded wall position');
  assert.equal(e.z, pc.pantallas[0].cubo.peana, 'on top of its pedestal');
  const r = pc.pantallas[0].recorte, sala = pc.pantallas[0].cubo.caras.find(c => c.recorte.x === r.x);
  assert.deepEqual(e.n, sala.n, 'the cube faces the room with the face of its recorte');
  assert.equal(e.dimensiones.ancho, e.cubo.lado, 'dimensiones and recorte are that one face; the prism comes from cubo');
  assert.ok(pc.mobiliario.some(m => m.id === 'm-peana'), 'the pedestal is furniture of the plan');
  const uvs = uvsFormato([e], { lienzo: [1600, 600] }).get(e.id);
  assert.deepEqual(uvs.map(u => u[0]), pc.pantallas[0].cubo.caras.map(c => c.recorte.x / 1600), 'one UV set per face, from the plan recortes');
  const sinCaras = { ...e, recorte: { x: 0, y: 0, w: 1600, h: 600 }, cubo: { ...e.cubo, caras: null } };
  assert.deepEqual(uvsFormato([sinCaras], { lienzo: [1600, 600] }).get(e.id), uvs, 'without faces in the plan, the canvas split in 4 is the same');
  // dimensiones de una cara o de las cuatro desplegadas; o la diagonal de una cara en pulgadas.
  assert.deepEqual(medidasCubo({ lienzo: [1600, 600], dimensiones: { ancho: 0.8, alto: 1.2 } }), { lado: 0.8, alto: 1.2 });
  assert.deepEqual(medidasCubo({ lienzo: [1600, 600], dimensiones: { ancho: 3.2, alto: 1.2 } }), { lado: 0.8, alto: 1.2 });
  const p = medidasCubo({ lienzo: [1600, 600], pulgadas: 50 });
  assert.ok(Math.abs(Math.hypot(p.lado, p.alto) - 50 * 0.0254) < 1e-9);
});

test('a plan of another format, a recorte out of its canvas or a multi-screen format without recortes is rejected', () => {
  const f15 = formatoDe(INDICE, 'cliente-15');
  assert.match(validarPlanoEspacio(plano('altadis-xtanco-14'), f15).errores.join(), /formato «cliente-14», no de «cliente-15»/);
  const fuera = plano('altadis-xtanco-15');
  fuera.pantallas[3].recorte.x = 3000;
  assert.match(validarPlanoEspacio(fuera, f15).errores.join(), /se sale del lienzo/);
  const sin = plano('altadis-xtanco-15');
  delete sin.pantallas[0].recorte;
  assert.match(validarPlanoEspacio(sin, f15).errores.join(), /necesita su recorte/);
  const hueco = plano('altadis-xtanco-15');
  hueco.pantallas.pop();
  assert.ok(validarPlanoEspacio(hueco, f15).avisos.some(a => /75 %/.test(a)), 'a missing cell is a warning');
});

test('the public copy keeps the format fields and drops ITIL fields if the shared plan carried them', () => {
  const p = plano('altadis-cafe-06');
  assert.equal(p.publico, true, 'the Architect marks these plans public');
  p.pantallas[0].itil = 'ITIL-1'; p.pantallas[0].screenId = 'real-screen'; p.yokup = { portal: 'x' }; p.dispositivos = [{ id: 'd', estado: 'ok', itilPropuesto: 'P' }];
  const pub = planoEspacioPublico(p);
  for (const o of [pub, ...pub.pantallas, ...pub.dispositivos]) for (const campo of CAMPOS_PRIVADOS) assert.ok(!(campo in o), campo);
  assert.deepEqual(pub.pantallas[0].recorte, p.pantallas[0].recorte);
  assert.deepEqual(pub.formato, p.formato);
  assert.equal(pub.pantallas[0].grupo, 'formato-06');
});

test('sources: the shared plan in admira.biz first, the local copy if it fails, and why', async () => {
  const id = 'altadis-xtanco-15', f = formatoDe(INDICE, 'cliente-15'), bueno = plano(id);
  let { fetchImpl, pedidas } = falso({ [PLANO_COMPARTIDO(id)]: { cuerpo: bueno }, [PLANO_LOCAL(id)]: { cuerpo: bueno } });
  let r = await cargarPlanoEspacio(id, f, { fetchImpl });
  assert.equal(r.fuente, 'compartido');
  assert.equal(pedidas.length, 1);
  assert.equal(pedidas[0].opts.credentials, 'omit');
  assert.equal(pedidas[0].opts.cache, 'no-store');
  ({ fetchImpl } = falso({ [PLANO_LOCAL(id)]: { cuerpo: bueno } }));
  r = await cargarPlanoEspacio(id, f, { fetchImpl });
  assert.equal(r.fuente, 'local');
  assert.match(r.fallos[0].error, /HTTP 404/);
  ({ fetchImpl } = falso({ [PLANO_COMPARTIDO(id)]: { cuerpo: '<html>', tipo: 'text/html' }, [PLANO_LOCAL(id)]: { cuerpo: bueno } }));
  assert.match((await cargarPlanoEspacio(id, f, { fetchImpl })).fallos[0].error, /HTML/);
  ({ fetchImpl } = falso({ [PLANO_COMPARTIDO(id)]: { cuerpo: plano('altadis-xtanco-14') }, [PLANO_LOCAL(id)]: { cuerpo: bueno } }));
  r = await cargarPlanoEspacio(id, f, { fetchImpl });
  assert.equal(r.fuente, 'local');
  assert.match(r.fallos[0].error, /no válido/);
  ({ fetchImpl } = falso({ [PLANO_COMPARTIDO(id)]: () => { const e = new Error('abort'); e.name = 'AbortError'; throw e; } }));
  await assert.rejects(cargarPlanoEspacio(id, f, { fetchImpl, timeoutMs: 6000 }), e => e.fallos.length === 2 && /sin respuesta en 2\.5 s/.test(e.fallos[0].error), 'admira.biz gets 2.5 s, not the general 6 s');
  await assert.rejects(cargarPlanoEspacio('lab-gran-de-gracia-51', f, { fetchImpl }), /no válido/);
  ({ fetchImpl } = falso({ [INDICE_LOCAL]: { cuerpo: INDICE } }));
  const ri = await cargarIndice({ fetchImpl });
  assert.equal(ri.fuente, 'local');
  assert.equal(ri.fallos[0].url, INDICE_COMPARTIDO);
  assert.equal(INDICE_COMPARTIDO, 'https://www.admira.biz/data/xpacios/altadis-18.json');
  assert.equal(PLANO_LOCAL(id), '/xpacios/altadis-18/planos/altadis-xtanco-15.json', 'outside /data/xpacios: the public-plan function would strip the recortes');
  const generico = await cargarConRespaldo([{ fuente: 'a', url: 'x' }, { fuente: 'b', url: 'y' }], { fetchImpl: falso({ y: { cuerpo: { ok: 1 } } }).fetchImpl });
  assert.deepEqual([generico.fuente, generico.datos], ['b', { ok: 1 }]);
});

test('content: the adapted MP4 in the requested language, the other one if missing, else the placeholder', () => {
  const m = { schema: 'admira.espacios-contenido/1', piezas: {
    'cliente-15': { nombre: 'VIDEOWALL 4X1 H', ancho: 3840, alto: 540, metodo: 'cover', es: { url: 'https://stock.admira.store/espacios/altadis-18/v1/es/cliente-15.mp4', poster: 'https://stock.admira.store/espacios/altadis-18/v1/es/cliente-15.jpg' }, en: { url: 'https://stock.admira.store/espacios/altadis-18/v1/en/cliente-15.mp4' } },
    'cliente-10': { es: { url: 'https://stock.admira.store/espacios/altadis-18/v1/es/cliente-10.mp4' } },
    'cliente-09': { es: { url: 'javascript:alert(1)' } },
  } };
  const es = elegirContenido(m, 'cliente-15', 'es');
  assert.deepEqual([es.tipo, es.idioma, es.sustituto, es.poster], ['video', 'es', false, m.piezas['cliente-15'].es.poster]);
  const en = elegirContenido(m, formatoDe(INDICE, 'cliente-15'), 'en');
  assert.deepEqual([en.url, en.poster], [m.piezas['cliente-15'].en.url, null]);
  const sust = elegirContenido(m, 'cliente-10', 'en');
  assert.deepEqual([sust.tipo, sust.idioma, sust.pedido, sust.sustituto], ['video', 'es', 'en', true]);
  assert.deepEqual(elegirContenido(m, 'cliente-01', 'es'), { tipo: 'placeholder', motivo: 'sin-pieza', idioma: 'es' });
  assert.deepEqual(elegirContenido(null, 'cliente-01', 'en'), { tipo: 'placeholder', motivo: 'sin-manifiesto', idioma: 'en' });
  assert.equal(elegirContenido(m, 'cliente-09', 'es').tipo, 'placeholder', 'only https URLs play');
  assert.equal(posterDe(m, 'cliente-15', 'en'), null);
  assert.equal(MANIFIESTO, 'https://stock.admira.store/espacios/altadis-18/v1/manifest.json');
});

test('deep links, keyboard order and the two outgoing buttons', () => {
  assert.deepEqual(destinoDesdeURL('?espacio=altadis-xtanco-07'), { espacio: 'altadis-xtanco-07', tipo: 'xtanco', formato: 'cliente-07', lang: 'es', auto: false });
  assert.deepEqual(destinoDesdeURL('?formato=cliente-03&tipo=cafe&lang=en'), { espacio: 'altadis-cafe-03', tipo: 'cafe', formato: 'cliente-03', lang: 'en', auto: false });
  assert.deepEqual(destinoDesdeURL('?formato=cliente-03'), { espacio: 'altadis-xtanco-03', tipo: 'xtanco', formato: 'cliente-03', lang: 'es', auto: false });
  assert.deepEqual(destinoDesdeURL('?espacio=../../etc&tipo=cafe&auto=1'), { espacio: null, tipo: 'cafe', formato: null, lang: 'es', auto: true });
  assert.equal(resolverEspacio(INDICE, 'cliente-08', 'cafe').id, 'altadis-cafe-08');
  assert.equal(resolverEspacio(INDICE, 'cliente-99', 'cafe'), null);
  assert.equal(vecino(INDICE, 'cliente-18', 1), 'cliente-01');
  assert.equal(vecino(INDICE, 'cliente-01', -1), 'cliente-18');
  assert.equal(vecino(INDICE, 'cliente-07', 1), 'cliente-08');
  assert.equal(queryEspacio({ espacio: 'altadis-cafe-03', lang: 'en', auto: true }), '?espacio=altadis-cafe-03&lang=en&auto=1');
  assert.equal(STUDIO('cliente-15'), 'https://admira.studio/adaptaciones/?formato=cliente-15');
  assert.equal(ARQUITECTO('cliente-15', 'cafe'), 'https://www.admira.biz/arquitecto.html?formato=cliente-15&tipo=cafe');
  assert.deepEqual(TEMA_DE_TIPO, { xtanco: 'estanco', cafe: 'cafeteria' });
  assert.equal(medidaFisica({ dimensiones: { ancho: 3.84, alto: 0.48 } }), '3,84 × 0,48 m');
  assert.equal(medidaFisica({ pulgadas: 49 }, true), '49″');
});

test('auto framing: centred on the screens of the format, facing them, far enough to fit them', () => {
  const e = escenaDesdePlano(plano('altadis-xtanco-15'));
  const ps = e.pantallas.filter(p => p.recorte);
  const m = encuadre(ps, { fov: 40, aspect: 16 / 9, margen: 1 });
  const F = e.paredes.find(w => w.id === ps[0].pared);
  assert.ok(Math.abs(m.az - Math.atan2(F.n[1], F.n[0])) < 1e-9, 'faces the mural wall from the room');
  const xs = ps.flatMap(p => [p.centro[0] - p.w / 2, p.centro[0] + p.w / 2]);
  assert.ok(Math.abs(m.objetivo[0] - (Math.min(...xs) + Math.max(...xs)) / 2) < 1e-6, 'centred on the mural');
  assert.ok(m.ancho > 4.3 && m.ancho < 4.4, 'four 49″ panels side by side');
  assert.ok(m.dist >= (m.ancho / 2) / (Math.tan(20 * Math.PI / 180) * 16 / 9) - 1e-9);
  const pos = posicionOrbita({ ...m, el: 0 });
  assert.ok(pos[1] > 0 && pos[1] < e.sala.fondo, 'the camera stands in front of the wall, inside the room');
  const chica = encuadre(escenaDesdePlano(plano('altadis-xtanco-10')).pantallas, { minAncho: 2.6, minAlto: 1.7 });
  assert.ok(chica.dist > encuadre(escenaDesdePlano(plano('altadis-xtanco-10')).pantallas).dist, 'a tiny screen is framed with some of its room');
  const cubo = escenaDesdePlano(plano('altadis-xtanco-08')).pantallas[0];
  assert.equal(esquinas(cubo).length, 8, 'the cube is framed as a volume');
  assert.equal(encuadre([]), null);
});

test('card schematics and the animated placeholder keep the format proportions', () => {
  const vw = formatoDe(INDICE, 'cliente-15'), cubo = formatoDe(INDICE, 'cliente-08');
  assert.equal(celdasFormato(vw).length, 4);
  assert.deepEqual(celdasFormato(cubo).map(c => c.w), [400, 400, 400, 400], 'the cube card shows its four faces');
  const svg = svgFormato(vw);
  assert.equal((svg.match(/<rect /g) || []).length, 5, 'background plus four screens');
  assert.match(svgFormato({ ...vw, nombre: '<b>"x"' }), /&lt;b&gt;&quot;x&quot;/);
  assert.deepEqual(tamanoPlaceholder(3840, 540), { ancho: 1024, alto: 144, escala: 1024 / 3840 });
  assert.deepEqual(tamanoPlaceholder(64, 384), { ancho: 64, alto: 384, escala: 1 }, 'small LED formats at native size');
  assert.equal(barrido(0), 0);
  assert.equal(barrido(3), 0.5);
  assert.equal(barrido(6), 0);
  assert.equal(reloj(83.25), '01:23.3');
  assert.match(rotulos(vw, 'en').pie, /adapted content coming soon/);
  assert.equal(rotulos(vw).pixeles, '3840 × 540 px');
});

test('the page: public like the lab, current shell, one module, linked from /xpacios/ and the engine knows the estanco', () => {
  const html = read('xpacios/altadis-18/index.html');
  const portada = read('index.html');
  const shell = (portada.match(/\/assets\/xpace-shell\.js\?v=([^"'&\s]+)/) || [])[1];
  assert.ok(html.includes(`/assets/xpace-shell.js?v=${shell}`), 'current shell release');
  assert.match(html, /<script type="module" src="\.\/visor\.mjs\?v=/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.admira\.store\/xpacios\/altadis-18\/">/);
  assert.doesNotMatch(html, /gate\.js|auth-gate|\/auth\/login/, 'no access gate: /xpacios is public');
  assert.match(html, /<meta name="admiranext-version" content="v\.\d\d\.\d\d\.\d{4}\.r\d+\.\d\d:\d\d">/);
  assert.match(read('xpacios/index.html'), /href="\/xpacios\/altadis-18\/"/);
  const visor = read('xpacios/altadis-18/visor.mjs');
  assert.match(visor, /soltarEspacio\(\);[\s\S]*crearEscena3D/, 'the previous twin is released before the next one is built');
  assert.match(visor, /crossOrigin: 'anonymous', muted: true/);
  assert.match(visor, /playsInline: true, loop: true/);
  assert.equal((visor.match(/document\.createElement\('video'\)/g) || []).length, 1, 'one <video> per format');
  const motor = read('xpacios/gran-de-gracia-51/escena3d.mjs');
  assert.match(motor, /estanco: \{/);
  assert.match(motor, /new T\.VideoTexture\(video\)/, 'the shared canvas can be a video');
  assert.deepEqual(['Lineal de tabaco', 'Góndola', 'Mostrador'].map(n => tipoMueble({ id: 'x', nombre: n })), ['expositor', 'gondola', 'barra']);
});

test('a shared source that does not answer is remembered for the session: no more waiting on admira.biz', async () => {
  const id = 'altadis-cafe-03', f = formatoDe(INDICE, 'cliente-03'), bueno = plano(id);
  const { fetchImpl, pedidas } = falso({ [PLANO_LOCAL(id)]: { cuerpo: bueno }, [PLANO_LOCAL('altadis-cafe-04')]: { cuerpo: plano('altadis-cafe-04') } });
  const memoria = new Set();
  const a = await cargarPlanoEspacio(id, f, { fetchImpl, memoria });
  assert.equal(a.fuente, 'local');
  assert.deepEqual([...memoria], ['compartido'], 'the 404 of admira.biz is remembered');
  const b = await cargarPlanoEspacio('altadis-cafe-04', formatoDe(INDICE, 'cliente-04'), { fetchImpl, memoria });
  assert.equal(b.fuente, 'local');
  assert.equal(b.fallos[0].recordado, true);
  assert.deepEqual(pedidas.map(p => p.url), [PLANO_COMPARTIDO(id), PLANO_LOCAL(id), PLANO_LOCAL('altadis-cafe-04')], 'the second space goes straight to the local copy');
  // Un plano que llega pero no valida es cosa de ese plano: no apunta a admira.biz como caído.
  const m2 = new Set();
  await cargarPlanoEspacio(id, f, { fetchImpl: falso({ [PLANO_COMPARTIDO(id)]: { cuerpo: plano('altadis-cafe-04') }, [PLANO_LOCAL(id)]: { cuerpo: bueno } }).fetchImpl, memoria: m2 });
  assert.equal(m2.size, 0);
  // Plazo corto para admira.biz, el normal para la copia local.
  const espera = [];
  const lento = async (url, opts) => { espera.push(url); return new Promise((_, no) => opts.signal.addEventListener('abort', () => { const e = new Error('abort'); e.name = 'AbortError'; no(e); })); };
  const t0 = Date.now();
  await assert.rejects(cargarConRespaldo([{ fuente: 'compartido', url: 'https://x', timeoutMs: 50 }], { fetchImpl: lento, memoria: m2 }), e => /0\.05 s/.test(e.fallos[0].error));
  assert.ok(Date.now() - t0 < 1000);
  assert.equal(ESPERA_COMPARTIDO_MS, 2500);
  assert.ok(m2.has('compartido'), 'a hang is remembered too');
  assert.deepEqual([RECORRIDO_MS, RECORRIDO_MAX_MS], [12000, 20000]);
});

test('client texts: every mounting and wall of the 36 plans reads in Spanish and English, delivery is clean', () => {
  const montajes = new Set(), paredes = new Set();
  for (const f of INDICE.formatos) for (const tipo of ['xtanco', 'cafe']) for (const s of pantallasDelFormato(plano(f.espacios[tipo]))) { montajes.add(s.montaje); paredes.add(s.pared); }
  for (const m of montajes) assert.ok(MONTAJES[m], `mounting «${m}» has its texts`);
  for (const w of paredes) assert.ok(PAREDES[w], `wall «${w}» has its texts`);
  assert.equal(textoMontaje('pared-fondo', true), 'on the back wall');
  assert.equal(textoPared('F'), 'pared del fondo');
  assert.equal(textoPared('F', true), 'back wall');
  assert.equal(textoZona('cubo', true), 'cube');
  assert.equal(textoEntrega(formatoDe(INDICE, 'cliente-05')), 'MP4 · H.264 · 25 fps');
});

test('what the client sees: no internal notes by default, no fallback error, no internal ids in the ficha', () => {
  const visor = read('xpacios/altadis-18/visor.mjs');
  assert.match(visor, /const NOTAS = params\.get\('notas'\) === '1'/);
  assert.match(visor, /if \(NOTAS && txt\(fu\.sincro\)\)/, 'sync notes only with ?notas=1');
  assert.match(visor, /if \(NOTAS\) for \(const a of Array\.isArray\(fu\.avisos\)/, 'Architect warnings only with ?notas=1');
  assert.doesNotMatch(visor, /no sirvió|did not serve/, 'using the local copy is not an error on screen');
  assert.doesNotMatch(visor, /\[t\('Formato', 'Format'\), `\$\{pf\.id\}/, 'the format row does not show cliente-NN');
  assert.match(visor, /t\('Planos del Arquitecto', 'Architect plans'\)/);
  const css = read('xpacios/altadis-18/altadis.css');
  assert.match(css, /#estado\{[^}]*pointer-events:none/, 'the status line never blocks the controls');
  assert.doesNotMatch(css, /var\(--ambar\)\}\s*\.fuente/, 'no amber source line');
});

test('auto framing in the 36 spaces: facing the screens (< 25° from their normal), centred and filling the frame; the cube in diagonal', () => {
  const FOV = 40, ASPECT = 16 / 9, rad = Math.PI / 180;
  const tv = Math.tan(FOV / 2 * rad), th = tv * ASPECT;
  for (const f of INDICE.formatos) for (const tipo of ['xtanco', 'cafe']) {
    const p = plano(f.espacios[tipo]), e = escenaDesdePlano(p), suyas = e.pantallas.filter(x => x.recorte);
    const c = camaraEncuadre(suyas, { fov: FOV, aspect: ASPECT, sala: e.sala });
    const pos = posicionOrbita(c), o = c.objetivo;
    const d = [pos[0] - o[0], pos[1] - o[1], pos[2] - o[2]], dl = Math.hypot(...d);
    const n = suyas[0].n, ang = Math.acos((d[0] * n[0] + d[1] * n[1]) / dl) / rad;
    if (suyas.some(x => x.cubo)) assert.ok(ang > 15 && ang < 45, `${p.id}: the cube is seen in diagonal from its room face (${ang.toFixed(1)}°)`);
    else assert.ok(ang < 25, `${p.id}: camera ${ang.toFixed(1)}° from the screen normal`);
    // El centro de las pantallas, en el tercio central del cuadro (cámara mirando a `objetivo`).
    const cx = suyas.reduce((s, x) => s + x.centro[0], 0) / suyas.length, cy = suyas.reduce((s, x) => s + x.centro[1], 0) / suyas.length, cz = suyas.reduce((s, x) => s + x.centro[2], 0) / suyas.length;
    const fwd = d.map(v => -v / dl), up0 = [0, 0, 1];
    const right = [fwd[1] * up0[2] - fwd[2] * up0[1], fwd[2] * up0[0] - fwd[0] * up0[2], fwd[0] * up0[1] - fwd[1] * up0[0]], rl = Math.hypot(...right);
    const r = right.map(v => v / rl), up = [r[1] * fwd[2] - r[2] * fwd[1], r[2] * fwd[0] - r[0] * fwd[2], r[0] * fwd[1] - r[1] * fwd[0]];
    const v = [cx - pos[0], cy - pos[1], cz - pos[2]], z = v[0] * fwd[0] + v[1] * fwd[1] + v[2] * fwd[2];
    const sx = (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / z / th, sy = (v[0] * up[0] + v[1] * up[1] + v[2] * up[2]) / z / tv;
    assert.ok(Math.abs(sx) < 1 / 3 && Math.abs(sy) < 1 / 3, `${p.id}: screens centred (${sx.toFixed(2)}, ${sy.toFixed(2)})`);
    // Y llenan buena parte del cuadro (el lado que manda, al menos un 40 %).
    const lleno = Math.max(c.alto / (2 * dl * tv), c.ancho / (2 * dl * th));
    assert.ok(lleno > 0.4, `${p.id}: screens fill ${Math.round(lleno * 100)} % of the frame`);
  }
  assert.equal(GIRO_CUBO, 0.5);
});

test('gallery cards are never empty: the format schematic is always under the poster', () => {
  const visor = read('xpacios/altadis-18/visor.mjs');
  assert.match(visor, /<span class="poster">\$\{svgFormato\(f\)\}\$\{poster \?/, 'schematic first, poster on top');
  assert.doesNotMatch(visor, /loading="lazy"/, 'posters load eagerly (18 small JPEGs)');
  assert.match(visor, /if \(e\.target\.tagName === 'IMG'\) e\.target\.remove\(\)/, 'a broken poster leaves the schematic');
  assert.match(read('xpacios/altadis-18/altadis.css'), /\.poster img\.ok\{opacity:1\}/, 'a poster shows only once loaded');
});

test('phone (390 × 844): the camera stays close enough and the depth buffer separates screen and bezel (no black murals)', () => {
  // Zona libre típica a 390 × 844: lienzo 390 × 798 (sin la barra del shell), ficha arriba y controles abajo.
  const lienzo = 390 / 798, zona = { aspect: 358 / 400, escala: 400 / 798 };
  const fov = fovPara(lienzo);
  assert.ok(fov > 40 && fov <= 65, `portrait widens the vertical field (${fov.toFixed(1)}°)`);
  assert.equal(fovPara(16 / 9), 40);
  for (const f of INDICE.formatos) for (const tipo of ['xtanco', 'cafe']) {
    const e = escenaDesdePlano(plano(f.espacios[tipo])), suyas = e.pantallas.filter(x => x.recorte);
    const nominal = camaraEncuadre(suyas, { fov: 40, aspect: 16 / 9, sala: e.sala }).dist;
    const movil = camaraEncuadre(suyas, { fov, aspect: zona.aspect, sala: e.sala });
    const d = distanciaEnZona(movil.dist, zona.escala, nominal), { near, far } = planosCamara(d, e.sala);
    assert.ok(d <= 2 * nominal + 1e-9 && d < 15, `${f.espacios[tipo]}: camera at ${d.toFixed(1)} m (desktop ${nominal.toFixed(1)} m)`);
    assert.ok(near >= 0.05 && far / near <= 1000, `${f.espacios[tipo]}: far/near ${Math.round(far / near)}`);
    assert.ok(far > d + Math.hypot(e.sala.ancho, e.sala.fondo), 'the whole room fits before far');
    // Resolución del búfer de 24 bits a esa distancia, contra los 0,3 mm entre pantalla y bisel.
    assert.ok(d * d / (near * 2 ** 24) < 0.0003, `${f.espacios[tipo]}: depth step ${(d * d / (near * 2 ** 24) * 1000).toFixed(3)} mm`);
  }
  // Con el near fijo de antes (3 cm) y 20 m, el paso es de ~0,8 mm: z-fighting.
  assert.ok(20 * 20 / (0.03 * 2 ** 24) > 0.0003);
});

test('occlusion probes: centre, corners and bottom edge of every screen; the placeholder never says «coming soon» when the video failed', () => {
  const e = escenaDesdePlano(plano('altadis-cafe-15'));
  const p0 = e.pantallas.find(x => x.recorte), pts = puntosVisibles(p0);
  assert.equal(pts.length, 6, 'centre + 4 corners + bottom edge');
  assert.ok(pts.some(q => Math.abs(q[2] - (p0.z + 0.02)) < 1e-9), 'the bottom edge is probed (coffee machines hid it)');
  assert.ok(pts.slice(1, 5).every(q => q[2] > p0.z && q[2] < p0.z1), 'corners slightly inside the screen');
  const visor = read('xpacios/altadis-18/visor.mjs');
  assert.match(visor, /puntos = suyas\.flatMap\(puntosVisibles\)/);
  assert.match(visor, /tapas = \[\.\.\.s3d\.muebles\]\.filter\(\(\[id\]\) => !apoyos\.has\(id\)\)/, 'the furniture a screen stands on is not hidden as a whole');
  assert.match(visor, /const EL_MAX = 0\.42;/, 'the camera rises at most to 24° (still facing the screens) to clear it');
  assert.match(visor, /solapa: zonas\.some\(z => z\.intersectsBox\(caja\)\)/, 'a piece inside the screen volume (a coffee machine against the wall) is hidden piece by piece');
  assert.match(visor, /once: true/, 'one tap listener, not one per aborted play()');
  const vw = formatoDe(INDICE, 'cliente-15');
  assert.doesNotMatch(rotulos(vw, 'es', 'error').pie, /preparación/);
  assert.doesNotMatch(rotulos(vw, 'en', 'error').pie, /coming soon/);
  assert.match(rotulos(vw, 'en', 'error').pie, /video unavailable/);
  assert.match(rotulos(vw, 'es').pie, /en preparación/);
});

test('content per space type: Xtanco shows the Altadis manifest, falls back to the usual one; Starbucks keeps Starbucks', async () => {
  assert.equal(MANIFIESTO_XTANCO, 'https://stock.admira.store/espacios/altadis-18/v1/manifest-xtanco.json');
  assert.deepEqual(fuentesManifiesto('xtanco').map(f => f.url), [MANIFIESTO_XTANCO, MANIFIESTO]);
  assert.deepEqual(fuentesManifiesto('cafe').map(f => f.url), [MANIFIESTO]);
  const pieza = id => ({ [id]: { es: { url: `https://stock.admira.store/espacios/altadis-18/v1/es/${id}.mp4`, poster: `https://stock.admira.store/x/${id}.jpg` } } });
  const altadis = { schema: 'admira.espacios-contenido/1', version: 'v.15.10.2026.r1.12:00', idiomas: ['es'], campania: { titulo: { es: 'Altadis · contenido de ejemplo' } }, piezas: pieza('cliente-15') };
  const starbucks = { schema: 'admira.espacios-contenido/1', idiomas: ['es', 'en'], campania: { titulo: { es: 'Starbucks · Cada café tiene una historia', en: 'Starbucks · Every coffee has a story' } }, piezas: pieza('cliente-15') };
  let r = await cargarManifiesto('xtanco', { fetchImpl: falso({ [MANIFIESTO_XTANCO]: { cuerpo: altadis }, [MANIFIESTO]: { cuerpo: starbucks } }).fetchImpl });
  assert.equal(r.fuente, 'altadis');
  assert.equal(tituloCampana(r.datos, 'en'), 'Altadis · contenido de ejemplo', 'Spanish title when there is no English one');
  // Aún no publicado (404 HTML) o roto: el de siempre, sin error.
  r = await cargarManifiesto('xtanco', { fetchImpl: falso({ [MANIFIESTO]: { cuerpo: starbucks } }).fetchImpl });
  assert.deepEqual([r.fuente, r.fallos.length], ['stock', 1]);
  r = await cargarManifiesto('xtanco', { fetchImpl: falso({ [MANIFIESTO_XTANCO]: { cuerpo: { schema: 'otro' } }, [MANIFIESTO]: { cuerpo: starbucks } }).fetchImpl });
  assert.equal(r.fuente, 'stock');
  r = await cargarManifiesto('cafe', { fetchImpl: falso({ [MANIFIESTO_XTANCO]: { cuerpo: altadis }, [MANIFIESTO]: { cuerpo: starbucks } }).fetchImpl });
  assert.equal(tituloCampana(r.datos, 'en'), 'Starbucks · Every coffee has a story');
  // Altadis sólo trae `es`: en inglés se usa `es` y no cuenta como sustituto (no es un fallo).
  const en = elegirContenido(altadis, 'cliente-15', 'en');
  assert.deepEqual([en.tipo, en.idioma, en.sustituto], ['video', 'es', false]);
  assert.equal(elegirContenido({ ...starbucks, piezas: { 'cliente-15': { es: starbucks.piezas['cliente-15'].es } } }, 'cliente-15', 'en').sustituto, true, 'declared EN but missing: that one is a substitute');
  assert.equal(conVersion('https://stock.admira.store/x/a.jpg', altadis), 'https://stock.admira.store/x/a.jpg?v=v.15.10.2026.r1.12%3A00', 'poster URLs change with the manifest');
  assert.equal(conVersion(null, altadis), null);
});
