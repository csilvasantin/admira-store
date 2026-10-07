// Presentación Alsea (7-oct-2026, Carlos): los botones flotantes «🧾 Abrir gestor de colas» y «🛒 Kiosk/Quiosco»
// no salen por defecto en el gemelo Starbucks; aparecen cuando ya se ha interactuado con el iPad o con el tótem.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (f) => fs.readFileSync(new URL('../admira-xp/scripts/' + f, import.meta.url), 'utf8');

function mundo() {
  const ticks = [], docListeners = {}, byId = {};
  const el = (tag) => {
    const cls = new Set(), l = {};
    const n = {
      tagName: String(tag || 'div').toUpperCase(), style: {}, children: [], textContent: '', innerHTML: '', open: false,
      classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c), toggle: (c, v) => { (v === undefined ? !cls.has(c) : v) ? cls.add(c) : cls.delete(c); } },
      appendChild(c) { n.children.push(c); if (c && c.id) byId[c.id] = c; return c; },
      addEventListener: (t, f) => { (l[t] = l[t] || []).push(f); }, fire: (t, e) => (l[t] || []).forEach((f) => f(e || { stopPropagation() {}, preventDefault() {} })),
      setAttribute() {}, removeAttribute() {}, querySelector: () => el('x'), querySelectorAll: () => [], showModal() { n.open = true; }, close() { n.open = false; },
      closest: () => null, getBoundingClientRect: () => ({ width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 }),
    };
    return n;
  };
  const body = el('body'), head = el('head');
  const doc = {
    readyState: 'complete', body, head, documentElement: el('html'), activeElement: null,
    addEventListener: (t, f) => { (docListeners[t] = docListeners[t] || []).push(f); },
    createElement: el, getElementById: (id) => byId[id] || null, querySelector: () => null, querySelectorAll: () => [], elementsFromPoint: () => [],
  };
  const w = {
    document: doc, location: { search: '', href: 'https://www.admira.store/admira-xp/' }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    addEventListener() {}, dispatchEvent() {}, XpaceStarbucks: { active: () => true, screenQuads: {} },
    setInterval: (f) => { ticks.push(f); return ticks.length; }, setTimeout() {}, fetch: () => Promise.reject(new Error('sin red')),
  };
  w.window = w;
  const ctx = vm.createContext({ window: w, document: doc, URLSearchParams, URL, CustomEvent: function () {}, Intl, console, lang: 'en', DS_PIN: {}, showEv() {},
    setInterval: w.setInterval, setTimeout() {}, fetch: w.fetch, localStorage: w.localStorage, location: w.location });
  const tick = () => ticks.forEach((f) => { try { f(); } catch (_) {} });
  const pointerdown = (target) => (docListeners.pointerdown || []).forEach((f) => f({ target }));
  return { w, ctx, doc, byId, tick, pointerdown };
}

test('«Abrir gestor de colas» está oculto hasta que se abre el iPad una vez', () => {
  const m = mundo();
  vm.runInContext(read('ipad-cola.js'), m.ctx);
  m.tick();
  const chip = m.byId.ipadColaChip;
  assert.ok(chip, 'el botón existe en Starbucks');
  assert.equal(chip.classList.contains('on'), false, 'no se ve por defecto');
  assert.equal(m.w.XpaceIpadCola.touched(), false);
  m.w.XpaceIpadCola.open(); m.tick();
  assert.equal(chip.classList.contains('on'), false, 'con el gestor abierto en grande tampoco');
  m.w.XpaceIpadCola.close(); m.tick();
  assert.equal(m.w.XpaceIpadCola.touched(), true);
  assert.equal(chip.classList.contains('on'), true, 'tras interactuar queda como atajo');
});

test('«🛒 Kiosk» está oculto hasta que se toca el tótem', () => {
  const m = mundo();
  vm.runInContext(read('totem-kiosko.js'), m.ctx);
  m.tick();
  const btn = m.byId.kioskBtn;
  assert.ok(btn, 'el botón existe');
  assert.equal(btn.style.display, 'none', 'no se ve por defecto aunque Starbucks esté en escena');
  assert.equal(m.w.XpaceTotemKiosk.touched(), false);
  m.pointerdown({ closest: (sel) => (/matrix-wall-avatar|totemAvatar/.test(sel) ? {} : null) }); m.tick();
  assert.equal(m.w.XpaceTotemKiosk.touched(), true);
  assert.equal(btn.style.display, 'block', 'tras tocar el tótem aparece');
  assert.match(btn.textContent, /Kiosk/);
});

test('teclear /totem cuenta como interacción; el arranque automático no', () => {
  const m = mundo();
  vm.runInContext(read('totem-kiosko.js'), m.ctx);
  m.tick();
  assert.equal(m.w.XpaceTotemKiosk.touched(), false, 'el arranque no marca interacción');
  m.w.totemKioskCommand('pedidos'); m.tick();
  assert.equal(m.w.XpaceTotemKiosk.touched(), true);
});
