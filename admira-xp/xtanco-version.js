(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.13.10.2026.r2.22:09',
    build: '20261013-2209',
    cacheName: 'xpaceos-player-blob-20261007-r4',
  });
})();
