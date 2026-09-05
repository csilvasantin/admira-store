(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.04.09.2026.r1.22:44',
    build: '20260904-2244',
    cacheName: 'admiranext-v04-09-2026-r1-2244',
  });
})();
