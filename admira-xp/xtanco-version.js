(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.23.10.2026.r4.08:27',
    build: '20261023-0827',
    cacheName: 'xpaceos-player-blob-20261007-r4',
  });
})();
