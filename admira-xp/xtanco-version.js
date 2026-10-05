(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.05.10.2026.r19.23:18',
    build: '20261005-2318',
    cacheName: 'xpaceos-player-blob-20261005-r19',
  });
})();
