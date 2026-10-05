(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.05.10.2026.r9.19:22',
    build: '20261005-1922',
    cacheName: 'xpaceos-player-blob-20261005-r9',
  });
})();
