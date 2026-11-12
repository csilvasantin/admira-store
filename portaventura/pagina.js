// Pinta la página de un espacio: <main id="pa" data-espacio="store|restaurante|hotel|atraccion">.
(function () {
  'use strict';
  const el = document.getElementById('pa'); const x = PA.espacio(el.dataset.espacio); if (!x) return;
  const esc = PA.esc; document.documentElement.style.setProperty('--pa', x.color);
  let h = PA.nav(x.id) + '<div class="pa-chip">PortAventura · NetflixVentura</div>' +
    '<h1>' + x.e + ' ' + esc(x.n) + ' <em>' + esc(x.sub) + '</em>' + (x.foco ? '<span class="pa-foco">FOCO</span>' : '') + '</h1>' +
    '<p class="gm-sub">' + esc(x.d) + '</p><div class="pa-acc">' +
    '<a class="pa-pri" href="' + esc(x.dmz) + '" target="_blank" rel="noopener">Entrar en la DMZ ↗</a>';
  if (x.ecommerce) h += '<a href="' + esc(x.ecommerce) + '" target="_blank" rel="noopener">Ecommerce merch ↗</a>';
  if (x.gemelo && !x.tienda) h += '<button type="button" id="vista">✏️ Vista plano</button><button type="button" id="duplicar">➕ Duplicar en el creador</button>';
  if (x.interactivo) h += '<a href="' + x.interactivo + '" target="_blank" rel="noopener">Abrir el interactivo ↗</a>';
  h += '<a href="/portaventura/">Los 4 espacios</a></div>';
  if (x.tienda) {
    h += '<div class="pa-acc" id="vistas">' + x.vistas.map(([v, n], i) => '<button type="button" data-v="' + v + '"' + (i ? '' : ' class="pa-pri"') + '>' + n + '</button>').join('') + '</div>' +
      '<iframe class="pa-frame" id="tienda" title="Store Stranger Things" src="' + x.tienda + '?vista=2d" allow="fullscreen" allowfullscreen></iframe>' +
      '<h3>Pantallas</h3><ul class="pa-lista">' + x.pantallas.map(([n, d]) => '<li><b>📺 ' + esc(n) + '</b><span>' + esc(d) + '</span></li>').join('') + '</ul>' +
      '<p class="pa-nota">En la zona 2 la store sale en las pantallas 02a y 02b. <a href="/portaventura/atraccion/">Ver el previo</a>.</p>';
  } else if (x.gemelo) {
    h += '<div class="pa-grid"><div class="gm-escena gm-vista"><div id="plano"></div></div><div><div class="gm-cuenta" id="cuenta"></div><h3>Pantallas</h3><ul class="pa-lista">' +
      x.pantallas.map(([n, d]) => '<li><b>📺 ' + esc(n) + '</b><span>' + esc(d) + '</span></li>').join('') + '</ul>' +
      '<p class="pa-nota">En la zona 2 este espacio sale en las pantallas ' + PA.ZONA2.flatMap(p => p.pant).filter(s => s.ve === x.id).map(s => s.id).join(' y ') + '. <a href="/portaventura/atraccion/">Ver el previo</a>.</p></div></div>';
  } else if (x.interactivo) {
    h += '<iframe class="pa-frame" title="Interactivo de la cocina · PC-Cocina" src="' + x.interactivo + '" allow="fullscreen" loading="lazy"></iframe>' +
      '<p class="pa-nota">PC-Cocina es AdmiraNeXT05: en la zona 2 sus pantallas 05a y 05b enseñan el hotel. El interactivo pide sesión de admira.store.</p>';
  } else {
    h += '<div id="muro"></div><p class="pa-nota">Previo del muro de la zona 2 (8 pantallas, 5 PCs). Reparto: 01 y 03 atracción, 02 store, 04 restaurante, 05 hotel (PC-Cocina). ' +
      'El muro real se controla en <a href="https://www.admiranext.com/demo" target="_blank" rel="noopener">admiranext.com/demo</a>.</p>' +
      '<div class="pa-cards">' + PA.ESPACIOS.filter(e => e.id !== x.id).map(e => '<a class="pa-card" style="--c:' + e.color + '" href="/portaventura/' + e.id + '/"><div class="pa-e">' + e.e + '</div><h2>' + esc(e.n) + '</h2><p>' + esc(e.sub) + '</p></a>').join('') + '</div>';
  }
  el.innerHTML = h;
  const vs = document.getElementById('vistas');
  if (vs) vs.onclick = ev => { const v = ev.target.dataset && ev.target.dataset.v; if (!v) return; document.getElementById('tienda').src = x.tienda + '?vista=' + v; for (const k of vs.children) k.classList.toggle('pa-pri', k === ev.target); };
  if (x.gemelo && !x.tienda) {
    const b = Gemelo.normaliza(PA.borrador(x)); let iso = true;
    const pinta = () => { Gemelo.pinta(document.getElementById('plano'), b, {iso}); document.getElementById('vista').textContent = iso ? '✏️ Vista plano' : '🧊 Vista 3D'; };
    const n = Gemelo.cuenta(b); document.getElementById('cuenta').textContent = n.pantallas + ' pantallas · ' + n.muebles + ' muebles';
    document.getElementById('vista').onclick = () => { iso = !iso; pinta(); };
    document.getElementById('duplicar').onclick = () => { Gemelo.guarda(Object.assign({}, b, {id:null, nombre:b.nombre + ' (copia)'})); location.href = '/xpacios/gemelo/2/'; };
    pinta();
  }
  const m = document.getElementById('muro'); if (m) PA.zona2(m);
})();
