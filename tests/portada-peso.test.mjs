// Peso de la portada (Carlos, 21-oct-2026): lo pesado va después del primer pintado.
// 23-oct-2026: lo que el visitante aún no mira no se pide (carga perezosa compartida), Analytics se aplaza y la intro
// arranca con un póster (assets/intro-portada.js, probado en tests/intro-portada.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('el catálogo de gemelos y el índice del Stock se piden al acercarse a sus bloques o 8 s después de «load»', () => {
  assert.match(html, /function cargaPerezosa\(ids, fn, espera = 8000\)/);
  assert.match(html, /rootMargin: '400px'/);
  assert.match(html, /window\.addEventListener\('load', red, \{ once: true \}\)/, 'la red de seguridad cuenta desde «load», no desde el script');
  assert.match(html, /document\.visibilityState === 'hidden'/, 'con la pestaña en segundo plano espera a que se vea');
  assert.match(html, /\ncargaPerezosa\(\['prueba', 'gemelos'\], loadGemelos\);/);
  assert.match(html, /\ncargaPerezosa\(\['plataforma', 'pixstock', 'despacho'\], \(\) => \{ loadPixStock\(\)\.then\(loadOnAir\); loadDespacho\(\); \}\);/);
  assert.ok(html.indexOf('function cargaPerezosa') < html.indexOf("cargaPerezosa(['prueba'"), 'definida antes de usarse');
  assert.doesNotMatch(html, /requestAnimationFrame\(\(\) => setTimeout\(loadGemelos, 0\)\)/, 'ya no se pide nada más pintar');
  assert.doesNotMatch(html, /setTimeout\(start, 6000\)/, 'ya no hay plazo de 6 s desde el script');
  assert.doesNotMatch(html, /\nloadGemelos\(\);\n/, 'ya no se pide en cuanto se ejecuta el script');
});

test('Google Analytics se carga con el primer gesto o 4 s después de «load», y ya no hay preconnect a su dominio', () => {
  assert.match(html, /function cargar\(\)\{if\(hecho\)return;hecho=true;/);
  assert.match(html, /\['pointerdown','keydown','touchstart','scroll'\]\.forEach\(function\(ev\)\{w\.addEventListener\(ev,cargar,\{once:true,passive:true\}\);\}\);/);
  assert.match(html, /w\.addEventListener\('load',function\(\)\{setTimeout\(cargar,4000\);\}\);/);
  assert.match(html, /gtag\('consent', 'default', \{ analytics_storage: 'granted', ad_storage: 'denied' \}\);/, 'el consentimiento se declara igual, antes de cargar');
  assert.match(html, /<link rel="dns-prefetch" href="https:\/\/www\.googletagmanager\.com">/);
  assert.doesNotMatch(html, /<link rel="preconnect" href="https:\/\/www\.googletagmanager\.com">/);
  assert.equal((html.match(/googletagmanager\.com\/gtm\.js/g) || []).length, 1, 'un solo punto de carga del contenedor');
});

test('la intro lleva su sello nuevo (póster y vídeo bajo demanda)', () => {
  assert.match(html, /intro-portada\.js\?v=20261023-intro-poster-1/);
  assert.doesNotMatch(html, /intro-portada\.js\?v=20261021-intro-una-vez-1/);
});

test('el póster de la intro se pide desde la cabecera solo si la intro va a salir, en el idioma de la portada', () => {
  const i = html.indexOf("l.rel='preload';l.as='image'");
  assert.ok(i > 0, 'hay un preload del póster');
  assert.ok(html.indexOf('/assets/xpace-lang.js') < i, 'después de resolver el idioma');
  assert.ok(i < html.indexOf('googletagmanager.com/gtm.js'), 'y antes de todo lo demás');
  assert.match(html, /l\.href='\/assets\/video\/intro-xpaceos-a'\+\(lang==='en'\?'-en':''\)\+'-poster\.jpg'/);
  assert.match(html, /window\.__xpIntro=\{lang:lang,poster:l\.href\};/, 'y deja dicho que la intro sale');
  const pre = html.indexOf("b.id='xp-intro-pre'");
  assert.ok(pre > 0 && pre < html.indexOf('<a class="skip-link"'), 'el marco con el póster se pinta nada más abrir <body>');
  assert.match(html, /var p=window\.__xpIntro;if\(!p\)return;/, 'solo si la intro sale');
  assert.match(html, /i\.src=p\.poster;/);
  for (const cond of ["if(i==='0')return;", "prefers-reduced-motion: reduce", "sessionStorage.getItem('mb:marca')", "sessionStorage.getItem('xpaceos_intro_a')", "localStorage.getItem('xpaceos_intro_vista')", "30\*86400000"]) {
    assert.ok(html.includes(cond.replace('\\*', '*')), 'condición: ' + cond);
  }
});

test('las hojas del sistema de diseño se piden al destino final, sin pasar por la redirección de github.io', () => {
  assert.match(html, /<link rel="stylesheet" href="https:\/\/www\.carlossilva\.info\/admira-design\/tokens\.css">/);
  assert.match(html, /<link rel="stylesheet" href="https:\/\/www\.carlossilva\.info\/admira-design\/nav\.css">/);
  assert.match(html, /<link rel="preconnect" href="https:\/\/www\.carlossilva\.info" crossorigin>/);
  assert.doesNotMatch(html, /csilvasantin\.github\.io\/admira-design/);
});
