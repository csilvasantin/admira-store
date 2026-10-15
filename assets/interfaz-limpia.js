/* Interfaz limpia por defecto en los gemelos (Carlos, 16-oct-2026): «por defecto en todos los gemelos digitales la
 * interface está limpia como si pulsamos H y si queremos que aparezcan pulsamos en el menú superior opciones o
 * avanzadas o modo experto o sino la H».
 * Al cargar pone <html class="ui-limpia">; la H la quita y la vuelve a poner; abrir ☰ Opciones, ▤ Avanzado o
 * ⌘ Experto de la barra de arriba la quita. Qué se oculta lo dice cada página en su CSS (html.ui-limpia …): la
 * barra de arriba y la escena siempre se ven. ?ui=1 abre la página con la interfaz a la vista.
 * Avisa con «xpace:interfaz» ({detail:{oculta}}) en window. API: window.XpaceInterfaz.
 */
(function (G) {
  'use strict';
  var doc = G.document;
  if (!doc || G.XpaceInterfaz) return;
  var html = doc.documentElement;
  // ?ui=1 la abre de entrada; el recorrido de demo (?ax_demo=) enseña su interfaz.
  var oculta = !/(^|[?&])(ui=1(&|$)|ax_demo=)/.test(G.location.search);
  function poner(v) {
    var antes = oculta; oculta = !!v;
    html.classList.toggle('ui-limpia', oculta);
    if (antes === oculta) return;
    try { G.dispatchEvent(new CustomEvent('xpace:interfaz', { detail: { oculta: oculta } })); } catch (_) { /* nada */ }
    try { G.dispatchEvent(new Event('resize')); } catch (_) { /* nada */ }
  }
  G.addEventListener('keydown', function (e) {
    if (!e.key || e.key.toLowerCase() !== 'h' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    var t = e.target;
    if (t && (t.isContentEditable || (t.closest && t.closest('input,textarea,select,[role="textbox"]')))) return;
    if (escribiendoEnElJuego()) return;
    e.preventDefault(); poner(!oculta);
  }, true);
  // El gemelo escribe en su lienzo (nombre de un personaje, la pregunta inicial): ahí la H es una letra.
  function escribiendoEnElJuego() {
    try {
      /* global npcEdOpen, npcEdNameEdit, preloadPhase, state, S */
      if (typeof npcEdOpen !== 'undefined' && npcEdOpen && typeof npcEdNameEdit !== 'undefined' && npcEdNameEdit) return true;
      if (typeof preloadPhase !== 'undefined' && preloadPhase === 'prompt' && typeof state !== 'undefined' && typeof S !== 'undefined' && state === S.PRELOAD) return true;
    } catch (_) { /* variables aún sin iniciar: no se escribe */ }
    return false;
  }
  // Abrir un menú de la barra: el clic en ☰ ▤ ⌘ que lo deja ABIERTO (cerrarlo no destapa nada). La barra común
  // abre sola el panel de Experto al cargar su piel: eso tampoco cuenta, porque no es un clic.
  function abierto(b) { return b.classList.contains('is-active') || b.getAttribute('aria-expanded') === 'true' || b.getAttribute('aria-pressed') === 'true'; }
  doc.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#topBar [data-quad-toggle], #topBar #pfOptions, #topBar #pfExpert');
    if (b) setTimeout(function () { if (abierto(b)) poner(false); }, 0);
  }, true);
  G.XpaceInterfaz = { mostrar: function () { poner(false); }, ocultar: function () { poner(true); }, alternar: function () { poner(!oculta); }, get oculta() { return oculta; } };
  html.classList.toggle('ui-limpia', oculta);
})(window);
