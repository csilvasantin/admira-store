(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.04.10.2026.r8.18:39',
    build: '20261004-1839',
    cacheName: 'xpaceos-player-blob-20261004-r8',
  });
})();
