// Sección PortAventura de admira.store (Neo, 12-nov-2026): los 4 espacios de NetflixVentura, cada uno en su página.
// Foco en Store y Restaurante (gemelo propio + pantallas). Hotel = interactivo de la cocina (PC-Cocina, AdmiraNeXT05).
// Atracción = previo en la zona 2 de AdmiraNeXT: muro de 8 pantallas en los 5 PCs AdmiraNeXT01-05.
// Nada de código ni contenido privado de PortAventura: lo de verdad vive en la DMZ de portaventuranext.com y aquí solo se enlaza.
(function (root) {
  'use strict';
  const DMZ = 'https://www.portaventuranext.com';
  const ESPACIOS = [
    {id:'store', n:'Store', sub:'Stranger Things · merchandising', e:'🛍️', foco:true, color:'#e50914', dmz:DMZ + '/dmz/netflix/strangerthings/merchandising',
      d:'Tienda de merchandising: escaparate con videowall, muros de producto, probadores y caja con pantalla. El gemelo enseña dónde va cada pantalla y qué emite.',
      gemelo:{nombre:'Store · Stranger Things', sector:'tienda', w:4, h:3, items:[
        ['escaparate',.5,.03,0,'Escaparate'], ['videowall',.5,.09,0,'Videowall Hawkins'], ['entrada',.5,.985,0,''],
        ['estanteria',.04,.28,90,'Camisetas'], ['estanteria',.04,.6,90,'Sudaderas'], ['estanteria',.96,.28,90,'Coleccionables'],
        ['mesa',.38,.42,0,'Novedades'], ['mesa',.62,.42,0,'Personaliza'], ['totem',.28,.82,0,'Tótem personaliza'],
        ['probador',.92,.62,0,'Probador'], ['probador',.92,.8,0,'Probador'], ['mostrador',.62,.85,0,'Caja'], ['pantalla',.62,.75,0,'Pantalla caja'],
        ['pantalla',.96,.45,90,'Pantalla lateral'], ['sensor',.5,.93,0,'Contador de personas']]},
      pantallas:[['Videowall Hawkins','Tráiler y ambiente de la serie en bucle'], ['Tótem personaliza','Merch personalizado: el visitante crea su camiseta'], ['Pantalla caja','Promos y combos de la tienda'], ['Pantalla lateral','Colección del momento y stock']]},
    {id:'restaurante', n:'Restaurante', sub:"Benny's Burgers", e:'🍔', foco:true, color:'#ffb000', dmz:DMZ + '/dmz/netflixventura/restaurante',
      d:'Diner de los 80: menu boards sobre la barra, tótems de pedido, sala con pantalla y la «Serie 1984» de botellas y latas.',
      gemelo:{nombre:"Restaurante · Benny's Burgers", sector:'restaurante', w:4, h:3, items:[
        ['mostrador',.5,.1,0,'Barra'], ['pantalla',.32,.03,0,'Menu board 1'], ['pantalla',.5,.03,0,'Menu board 2'], ['pantalla',.68,.03,0,'Menu board 3'],
        ['totem',.15,.8,0,'Tótem de pedido'], ['totem',.85,.8,0,'Tótem de pedido'],
        ['mesa',.25,.4,0,''], ['mesa',.45,.4,0,''], ['mesa',.65,.4,0,''], ['mesa',.25,.62,0,''], ['mesa',.45,.62,0,''], ['mesa',.65,.62,0,''],
        ['sofa',.92,.45,90,'Banco corrido'], ['pantalla',.97,.7,90,'Pantalla Serie 1984'], ['entrada',.5,.985,0,''], ['sensor',.5,.92,0,'Cámara aforo']]},
      pantallas:[['Menu boards 1-3','Carta, precios y combos del día'], ['Tótems de pedido','Pedido sin cola'], ['Pantalla Serie 1984','Botellas y latas de personajes propios'], ['Cámara aforo','Ocupación de sala en vivo']]},
    {id:'hotel', n:'Hotel', sub:'Casa Creel', e:'🏨', color:'#8a5cff', dmz:DMZ + '/dmz/netflixventura/hotel', interactivo:'/supercomputer/pc-cocina/',
      d:'El hotel se enseña con el interactivo de la cocina: el gemelo del PC-Cocina (AdmiraNeXT05), con sus ventiladores con pantalla y su luz en vivo.'},
    {id:'atraccion', n:'Atracción', sub:'NetflixVentura · previo en la zona 2', e:'🎢', color:'#00c2a8', dmz:DMZ + '/dmz/netflixventura',
      d:'Previo en la zona 2 de AdmiraNeXT: el muro de 8 pantallas repartido en los 5 PCs AdmiraNeXT01 a 05. Cada espacio tiene su tramo del muro.'},
  ];
  // Zona 2: muro Planeta 7 (fuente: admira-next-web demo/mural-layout.mjs). Qué espacio ve cada pantalla en el previo.
  const ZONA2 = [
    {pc:'01', pant:[{id:'01', w:3840, h:1080, ve:'atraccion'}], fans:7},
    {pc:'02', pant:[{id:'02a', w:2560, h:1440, ve:'store'}, {id:'02b', w:2560, h:1440, ve:'store'}]},
    {pc:'03', pant:[{id:'03', w:3840, h:1080, ve:'atraccion'}]},
    {pc:'04', pant:[{id:'04a', w:2560, h:1440, ve:'restaurante'}, {id:'04b', w:2560, h:1440, ve:'restaurante'}]},
    {pc:'05', alias:'PC-Cocina', pant:[{id:'05a', w:2560, h:1440, ve:'hotel'}, {id:'05b', w:2560, h:1440, ve:'hotel'}], fans:7},
  ];
  const espacio = id => ESPACIOS.find(x => x.id === id) || null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Borrador del creador de gemelos a partir del espacio (para «Duplicar en el creador»).
  function borrador(x) {
    const g = x.gemelo;
    return {nombre:g.nombre, ciudad:'PortAventura', sector:g.sector, plantilla:'', fondo:{tipo:'rejilla', img:null, w:g.w, h:g.h},
      items:g.items.map(([t, px, py, r, n], i) => ({id:'pa' + i, t, x:px, y:py, r, n}))};
  }
  // Barra 1·2·3·4: una página por espacio (sin anclas).
  function nav(actual) {
    return '<ol class="gm-pasos pa-nav">' + ESPACIOS.map((x, i) => x.id === actual
      ? '<li class="gm-actual"><span aria-current="page"><b>' + (i + 1) + '</b>' + x.n + '</span></li>'
      : '<li><a href="/portaventura/' + x.id + '/"><b>' + (i + 1) + '</b>' + x.n + (x.foco ? ' ★' : '') + '</a></li>').join('') + '</ol>';
  }
  function zona2(el, compacto) {
    const tot = ZONA2.reduce((a, p) => a + p.pant.reduce((b, s) => b + s.w * 1080 / s.h, 0), 0);
    el.className = 'pa-muro' + (compacto ? ' pa-compacto' : '');
    el.innerHTML = ZONA2.map(p => '<div class="pa-pc"><div class="pa-pants">' + p.pant.map(s => {
      const x = espacio(s.ve), w = s.w * 1080 / s.h / tot * 100;
      return '<div class="pa-pant" style="flex:' + w.toFixed(2) + ';--c:' + x.color + '" title="' + esc(s.id + ' · ' + x.n) + '"><span>' + x.e + ' ' + esc(x.n) + '</span><small>' + s.id + '</small></div>';
    }).join('') + '</div><div class="pa-pcn">AdmiraNeXT' + p.pc + (p.alias ? ' · ' + p.alias : '') + (p.fans ? ' · ' + p.fans + ' ventiladores' : '') + '</div></div>').join('');
  }
  const PA = {DMZ, ESPACIOS, ZONA2, espacio, borrador, nav, zona2, esc};
  if (typeof module === 'object' && module.exports) module.exports = PA; else root.PA = PA;
})(typeof self !== 'undefined' ? self : this);
