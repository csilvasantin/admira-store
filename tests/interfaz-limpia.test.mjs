// Interfaz limpia por defecto en los gemelos (Carlos, 16-oct-2026): «por defecto en todos los gemelos digitales
// la interface está limpia como si pulsamos H y si queremos que aparezcan pulsamos en el menú superior opciones o
// avanzadas o modo experto o sino la H».
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const leer = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const codigo = leer('assets/interfaz-limpia.js');

function pagina(search = '') {
  const clases = new Set(), oyentes = {};
  const html = { classList: { toggle: (c, v) => (v ? clases.add(c) : clases.delete(c)), contains: c => clases.has(c) } };
  const G = {
    location: { search }, document: { documentElement: html, addEventListener: (t, f) => { (oyentes['doc:' + t] ||= []).push(f); } },
    addEventListener: (t, f) => { (oyentes['win:' + t] ||= []).push(f); }, dispatchEvent() {}, CustomEvent: class {}, Event: class {}, setTimeout: f => f(),
  };
  vm.runInNewContext(codigo, { window: G, setTimeout: f => f() });
  const tecla = (key, extra = {}) => oyentes['win:keydown'].forEach(f => f({ key, target: null, preventDefault() {}, ...extra }));
  const clic = boton => oyentes['doc:click'].forEach(f => f({ target: { closest: () => boton } }));
  return { limpia: () => clases.has('ui-limpia'), tecla, clic, api: G.XpaceInterfaz };
}

test('abre limpia; la H la abre y la cierra; ?ui=1 y el recorrido de demo abren con la interfaz', () => {
  const p = pagina();
  assert.equal(p.limpia(), true);
  p.tecla('h'); assert.equal(p.limpia(), false);
  p.tecla('H'); assert.equal(p.limpia(), true);
  p.tecla('h', { metaKey: true }); assert.equal(p.limpia(), true, 'con modificadores no');
  assert.equal(pagina('?ui=1').limpia(), false);
  assert.equal(pagina('?ax_demo=store').limpia(), false);
});

test('abrir ☰ ▤ ⌘ la abre; cerrarlos no', () => {
  const p = pagina();
  const boton = abierto => ({ classList: { contains: c => c === 'is-active' && abierto }, getAttribute: () => null });
  p.clic(boton(false)); assert.equal(p.limpia(), true, 'un clic que lo deja cerrado no destapa');
  p.clic(boton(true)); assert.equal(p.limpia(), false);
});

test('el gemelo la carga antes de pintar y oculta sus paneles y botones, no la escena', () => {
  const html = leer('admira-xp/index.html');
  assert.ok(html.indexOf('/assets/interfaz-limpia.js') < html.indexOf('</head>'), 'en el <head>');
  const estilo = html.slice(html.indexOf('<style id="uiLimpiaStyle">'), html.indexOf('</style>', html.indexOf('<style id="uiLimpiaStyle">')));
  for (const s of ['body > #kioskOrders', '#da-suite:not(.open)', '#admira-sello-chip', '.matrix-water-nav', '.matrix-tpv-listen', '.matrix-incident-chip', '.matrix-map-panel'])
    assert.ok(estilo.includes(s), s);
  for (const s of ['#c', '.matrix-panorama', '.matrix-mapped-player', '.matrix-player-media', '.life-canvas', '#videoMonitor'])
    assert.ok(!estilo.includes(s + ',') && !estilo.includes(s + ')'), `${s} es escena: no se oculta`);
});
