(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.15.09.2026.r19.21:10',
    build: '20260915-2110',
    cacheName: 'xpaceos-customer-motion-20260915-r19',
  });
})();
