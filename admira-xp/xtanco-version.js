(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.05.10.2026.r20.23:39',
    build: '20261005-2339',
    cacheName: 'xpaceos-player-blob-20261005-r20',
  });
})();
