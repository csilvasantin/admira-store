(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.02.09.2026.r4.12:45',
    build: '20260902-1245',
    cacheName: 'admiranext-v02-09-2026-r4-1245',
  });
})();
