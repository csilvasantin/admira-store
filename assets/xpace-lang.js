/* XpaceOS · idioma compartido / shared interface language.
   Una sola fuente de verdad para las páginas con contenido bilingüe propio
   (portada, Lenovo, ayudas, backoffice): la misma clave que escribe /idioma en
   ⌘ Experto (assets/xpace-shell.js) y el mismo evento que emite el shell.
   - Clave / key: localStorage 'xtanco_lang' ('es' | 'en').
   - Evento / event: window 'admira:languagechange', detail {lang, source}.
   - Orden / order: ?lang= de la URL → preferencia guardada → migración única de
     claves antiguas (xpaceosLang, xpace_lang, loyalty_admin_lang) → idioma por
     defecto de la página. Cargar sin defer, antes del primer render.
   Contrato / contract: admira-xp/docs/options-language.md */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.XpaceLang = api;
})(typeof window !== 'undefined' ? window : null, function (root) {
  'use strict';
  const LANG_KEY = 'xtanco_lang';
  const LANG_EVENT = 'admira:languagechange';
  const LEGACY_LANG_KEYS = ['xpaceosLang', 'xpace_lang', 'loyalty_admin_lang'];

  function normalize(value) {
    const v = String(value == null ? '' : value).trim().toLowerCase();
    if (v === 'es' || v === 'esp' || v.indexOf('es-') === 0) return 'es';
    if (v === 'en' || v === 'eng' || v.indexOf('en-') === 0) return 'en';
    return '';
  }
  function params(url) { try { return new URL(url).searchParams; } catch (_) { return null; } }
  function storageOf(win) { try { return win && win.localStorage; } catch (_) { return null; } }

  // Migración única: la preferencia antigua pasa a 'xtanco_lang' (si aún no hay
  // una) y la clave antigua se retira para que no vuelva a competir.
  function migrate(storage) {
    if (!storage) return '';
    let current = '';
    try { current = normalize(storage.getItem(LANG_KEY)); } catch (_) { return ''; }
    for (const key of LEGACY_LANG_KEYS) {
      let legacy = null;
      try { legacy = storage.getItem(key); } catch (_) {}
      if (legacy == null) continue;
      const value = normalize(legacy);
      if (!current && value) {
        try { storage.setItem(LANG_KEY, value); current = value; } catch (_) { return value; }
      }
      try { storage.removeItem(key); } catch (_) {}
    }
    return current;
  }

  function resolve(options) {
    const o = options || {};
    const q = params(o.url);
    const requested = q ? normalize(q.get('lang')) : '';
    const stored = migrate(o.storage);
    return requested || stored || normalize(o.fallback) || 'es';
  }

  // Elección explícita (botón de idioma de la página): se guarda y, si la URL
  // trae ?lang=, se actualiza para que recargar conserve el idioma elegido.
  function remember(lang, options) {
    const next = normalize(lang);
    if (!next) return '';
    const o = options || {};
    try { if (o.storage) o.storage.setItem(LANG_KEY, next); } catch (_) {}
    const q = params(o.url);
    if (q && q.has('lang') && normalize(q.get('lang')) !== next && o.history) {
      try {
        const url = new URL(o.url);
        url.searchParams.set('lang', next); url.searchParams.delete('langlock');
        o.history.replaceState(o.history.state, '', url.href);
      } catch (_) {}
    }
    return next;
  }

  function announce(lang, source, target) {
    const win = target || root;
    try { win.dispatchEvent(new CustomEvent(LANG_EVENT, {detail: {lang, source: source || 'page'}})); } catch (_) {}
  }

  // Enlaza el render de una página: aplica el idioma inicial (sin guardarlo:
  // quien no ha elegido conserva el idioma por defecto de cada página), sigue los
  // cambios de /idioma en ⌘ Experto y devuelve set() para el botón de la página.
  function bind(apply, options) {
    const o = options || {};
    const win = o.window || root;
    const source = o.source || 'page';
    const env = () => ({url: win.location.href, storage: storageOf(win), history: win.history});
    let current = '';
    const render = next => { current = next; apply(next); };
    win.addEventListener(LANG_EVENT, ev => {
      const detail = (ev && ev.detail) || {};
      const next = normalize(detail.lang);
      if (!next || detail.source === source || next === current) return;
      render(next);
    });
    render(resolve(Object.assign(env(), {fallback: o.fallback})));
    return {
      get: () => current,
      set(lang) {
        const next = remember(lang, env());
        if (!next) return current;
        if (next !== current) render(next);
        announce(next, source, win);
        return next;
      }
    };
  }

  return {LANG_KEY, LANG_EVENT, LEGACY_LANG_KEYS, normalize, migrate, resolve, remember, announce, bind};
});
