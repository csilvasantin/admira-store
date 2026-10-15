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
  var oculta = !/(^|[?&])ui=1(&|$)/.test(G.location.search);
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
    e.preventDefault(); poner(!oculta);
  }, true);
  // Abrir un menú de la barra: sólo el clic de la persona en ☰ ▤ ⌘ (la barra común abre sola el panel de
  // Experto al cargar su piel, y eso no debe destapar la interfaz).
  doc.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#topBar [data-quad-toggle], #topBar #pfOptions, #topBar #pfExpert');
    if (b) poner(false);
  }, true);
  G.XpaceInterfaz = { mostrar: function () { poner(false); }, ocultar: function () { poner(true); }, alternar: function () { poner(!oculta); }, get oculta() { return oculta; } };
  html.classList.toggle('ui-limpia', oculta);
})(window);
