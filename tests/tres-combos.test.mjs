// Barra del gemelo con tres combos (Carlos, 15-oct-2026): «Xpacio» (aplica su marca), «Local» y «Calidad»,
// en vez del combo largo «Proyecto y local». La cuenta de AdmiraNext vive en ☰ Opciones.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync(new URL('../admira-xp/index.html', import.meta.url), 'utf8');
const barra = html.slice(html.indexOf('<div id="topBar">'), html.indexOf('id="projectContextChip"'));
const opciones = html.slice(html.indexOf('<nav class="quad-menu quad-left'), html.indexOf('</nav>', html.indexOf('<nav class="quad-menu quad-left')));
const css = readFileSync(new URL('../assets/xpace-header.css', import.meta.url), 'utf8');

test('la barra tiene tres combos en orden: Xpacio, Local y Calidad', () => {
  const xp = barra.indexOf('id="topbarXpace"'), lo = barra.indexOf('id="topbarVenue"'), ca = barra.indexOf('id="topbarQuality"');
  assert.ok(xp > 0 && lo > xp && ca > lo, 'orden Xpacio → Local → Calidad');
  assert.match(barra, /<label class="topbar-combo" id="topbarXpace"><span class="picker-label" data-es="Xpacio" data-en="Xpace">Xpacio<\/span><select id="projectSelector"/);
  assert.match(barra, /<label class="topbar-combo" id="topbarVenue"><span class="picker-label" data-es="Local" data-en="Venue">Local<\/span><select id="projectVenueSelector"/);
  assert.doesNotMatch(barra, /Proyecto y local|projectConnect/, 'el combo largo ya no está en la barra');
});

test('la cuenta de AdmiraNext (estado, conectar, gestionar) está en ☰ Opciones', () => {
  for (const id of ['projectSelectorLabel', 'projectSelectionStatus', 'projectConnect', 'projectRefresh', 'projectDisconnect', 'projectDemos', 'projectBackofficeLink', 'projectVenueName'])
    assert.ok(opciones.includes(`id="${id}"`), id);
  assert.equal((html.match(/id="projectSelectionStatus"/g) || []).length, 1);
});

test('los combos tienen la caja de Calidad y su marca de despliegue', () => {
  assert.match(css, /#topBar \.topbar-combo\{[^}]*border:1px solid #315766;border-radius:5px;background:#09151f/);
  assert.match(css, /#topBar \.topbar-combo::after\{content:"▾"/);
  assert.match(html, /xpace-header\.css\?v=tres-combos-2/);
  assert.match(html, /project-selector\.mjs\?v=primer-local-1/);
});
