(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.05.09.2026.r1.07:40',
    build: '20260905-0740',
    cacheName: 'admiranext-v04-09-2026-r1-2244',
  });
})();
