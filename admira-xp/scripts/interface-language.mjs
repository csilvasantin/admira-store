// Translate declared interface copy in place, preserving DOM, handlers and data.
// Names, editable fields, media and scene objects are never rewritten.
export function interfaceTranslator(pairs = []) {
  const dictionary = new Map(pairs.map(pair => [pair[0], pair]));
  let doc=globalThis.document;
  const language = () => doc?.documentElement?.lang === 'en' ? 'en' : 'es';
  const t = (es, en) => {dictionary.set(es, [es, en]); return language() === 'en' ? en : es;};
  function observe(roots) {
    const hosts = Array.isArray(roots) ? roots : [roots];
    doc=hosts.find(Boolean)?.ownerDocument||doc;
    const sync = () => {
      const index = language() === 'en' ? 1 : 0;
      const translations = new Map();
      for (const pair of dictionary.values()) for (const value of pair) translations.set(value, pair[index]);
      const copy = value => {
        const trimmed = value.trim(), next = translations.get(trimmed);
        return next == null ? value : value.replace(trimmed, next);
      };
      function visit(node) {
        if (node.nodeType === 3) {const next = copy(node.nodeValue); if (next !== node.nodeValue) node.nodeValue = next; return;}
        if (node.nodeType !== 1 || node.matches('script,style,[contenteditable],.matrix-current-track,[data-i18n-live]')) return;
        for (const attr of ['aria-label', 'title', 'placeholder']) if (node.hasAttribute(attr)) {
          const value = node.getAttribute(attr), next = copy(value);
          if (value !== next) node.setAttribute(attr, next);
        }
        if (node.matches('input,textarea')) return;
        for (const child of node.childNodes) visit(child);
      }
      hosts.filter(Boolean).forEach(visit);
    };
    sync();
    // Live widgets (e.g. Matrix incident cards with a 1 s SLA countdown) mark themselves with
    // data-i18n-live: their own mutations must not re-walk the whole tree every second (typing lag).
    const live = node => !!(node && (node.nodeType === 1 ? node : node.parentElement)?.closest?.('[data-i18n-live]'));
    const observer = typeof MutationObserver === 'function' ? new MutationObserver(records => {if (records.every(r => r.type !== 'attributes' && live(r.target))) return; sync();}) : null;
    observer?.observe(doc.documentElement, {attributes:true, attributeFilter:['lang']});
    for (const root of hosts.filter(Boolean)) observer?.observe(root, {childList:true, subtree:true, characterData:true});
    return () => observer?.disconnect();
  }
  return {t, observe};
}
