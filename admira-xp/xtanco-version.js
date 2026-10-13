(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.13.10.2026.r3.22:41',
    build: '20261013-2241',
    cacheName: 'xpaceos-player-blob-20261007-r4',
  });
})();
