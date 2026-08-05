/* ============================================================================
 * anonimizado-control.js — CTRL+flechas dirige al NPC del Anonimizador.
 * ----------------------------------------------------------------------------
 * Igual que el encargado se mueve con las flechas, manteniendo CTRL las
 * flechas dirigen al ÚLTIMO anonimizado que llegó desde pixeria.com/anonimizador
 * (el NPC con sprite 8-bit propio y peana dorada). Captura el evento para no
 * chocar con los handlers del juego. (Carlos, 14-jul-2026)
 * ========================================================================== */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__ANON_CTRL) return; window.__ANON_CTRL = true;
  var STEP = 6;
  function pick() {
    var L = (window.G && window.G.custs) || [];
    for (var i = L.length - 1; i >= 0; i--) { var c = L[i]; if (c && c.customSpriteImg) return c; }
    return null;
  }
  window.addEventListener('keydown', function (e) {
    if (!e.ctrlKey) return;
    var k = e.key;
    if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowRight') return;
    var c = pick(); if (!c) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (k === 'ArrowLeft') c.x -= STEP;
    else if (k === 'ArrowRight') c.x += STEP;
    else if (k === 'ArrowUp') c.y -= STEP * 0.6;
    else c.y += STEP * 0.6;
    // si el NPC expone destino de IA, lo anclamos a su nueva posición para que
    // no "vuelva andando" al soltar la tecla
    try {
      if ('tx' in c) c.tx = c.x; if ('ty' in c) c.ty = c.y;
      if ('targetX' in c) c.targetX = c.x; if ('targetY' in c) c.targetY = c.y;
    } catch (_) {}
  }, true);
})();
