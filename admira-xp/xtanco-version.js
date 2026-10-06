(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.06.10.2026.r26.22:15',
    build: '20261006-2215',
    cacheName: 'xpaceos-player-blob-20261006-r26',
  });
})();
