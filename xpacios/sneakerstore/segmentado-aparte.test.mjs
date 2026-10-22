// Contenido segmentado se carga aparte de la tienda (Carlos, 22-oct-2026): el 22-oct un import perdido de
// segmentado-core.mjs dio 404 y, como store.mjs lo importaba de forma estática, la 360 se quedó en negro.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
const store=read('./store.mjs'),html=read('./index.html');

test('store.mjs no importa Contenido segmentado de forma estática: un fallo suyo no para la tienda 360',()=>{
  assert.doesNotMatch(store,/^\s*import\s[^;]*segmentado-ui\.mjs/m,'nada de import estático del segmentado');
  assert.match(store,/import\('\.\/segmentado-ui\.mjs\?v=puerta-cam-2'\)\.then\(/,'se carga con import() dinámico');
  assert.match(store,/\.catch\(error=>\{console\.warn\('Contenido segmentado no disponible',error\);\$\('show-segmented'\)\.disabled=true;/,'si falla, el botón queda desactivado y la tienda sigue');
});

test('el botón, la acción sneakers-segmented, /segmentado, ?segmentado= y pagehide usan el controlador sólo a través de la carga protegida',()=>{
  assert.doesNotMatch(store,/segmented\.(open|close|dispose)\(/,'nunca segmented.x() directo: puede no haber cargado');
  assert.match(store,/\$\('show-segmented'\)\.onclick=\(\)=>void openSegmented\(\)/);assert.match(store,/'sneakers-segmented':\(\)=>void openSegmented\(\)/);
  assert.match(store,/void openSegmented\(mode\)/);
  assert.match(store,/if\(params\.get\('segmentado'\)\)void openSegmented\(/);
  assert.match(store,/segmented\?\.dispose\(\)/);assert.match(store,/segmented\?\.close\(\)/);
  assert.match(store,/s\?s\.open\(mode\):status\(SEGMENTED_UNAVAILABLE\(\)\)/,'sin módulo, abrir avisa en el estado de la tienda');
});

test('index.html pide la versión nueva de store.mjs',()=>{
  assert.match(html,/<script type="module" src="\.\/store\.mjs\?v=puerta-cam-2">/);
});
