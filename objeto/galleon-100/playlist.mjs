const asset = (id, version) => ({
  id, type: 'video', url: 'https://api.admira.store/stock/asset/' + id + '?v=' + version,
});

const initial = [
  { title: 'Así sonaba 1985', landscape: asset('1794501557972-tiftm4', '51154428'), portrait: asset('1794427190641-t7e6p3', '76206571') },
  { title: 'Me at the zoo', landscape: asset('1793187066761-mb4iwr', '1035533'), portrait: asset('1793179407438-26c560', '4235618') },
];
const STORAGE_KEY = 'admira-galleon-playlist-v1';

function stockItem(item) {
  if (!item || !['image', 'video', 'animation'].includes(item.type) || typeof item.id !== 'string') return null;
  try {
    const url = new URL(item.url);
    const stock = (url.origin === 'https://api.admira.store' && url.pathname.startsWith('/stock/asset/'))
      || (url.origin === 'https://stock.admira.store' && url.pathname.startsWith('/stock/'));
    if (stock) return { id: item.id, type: item.type, url: url.href };
  } catch {}
  return null;
}

export function attachGalleonPlaylist(feed, importer, status, {
  storageKey = STORAGE_KEY,
  loadingMessage = 'Cargando pantalla horizontal y mosaico vertical…',
} = {}) {
  const origin = new URL(feed.src).origin;
  const picker = document.querySelector('#playlist');
  let entries = initial.slice(), current = 0, sequence = 0, imageTimer;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) entries = entries.concat(saved.slice(0, 30).filter(row =>
      row && typeof row.title === 'string' && stockItem(row.landscape) && stockItem(row.portrait)));
  } catch {}

  function select(index) {
    current = (index + entries.length) % entries.length;
    sequence++;
    picker.value = String(current);
    status.textContent = loadingMessage;
    sync();
    clearTimeout(imageTimer);
    if (entries[current].landscape.type === 'image') imageTimer = setTimeout(() => select(current + 1), 12000);
  }

  function sync() {
    feed.contentWindow?.postMessage({ type: 'admira:galleon:subscribe' }, origin);
    feed.contentWindow?.postMessage({ type: 'admira:galleon:select', sequence, ...entries[current] }, origin);
  }

  function render() {
    picker.replaceChildren(...entries.map((entry, index) => new Option(entry.title, String(index))));
    picker.value = String(current);
  }

  picker.onchange = () => select(Number(picker.value));
  document.querySelector('#previous').onclick = () => select(current - 1);
  document.querySelector('#next').onclick = () => select(current + 1);

  window.addEventListener('message', event => {
    if (event.origin !== origin) return;
    if (event.source === feed.contentWindow && event.data?.type === 'admira:galleon:ended' && event.data.sequence === sequence) {
      select(current + 1);
    }
    if (event.source !== importer.contentWindow) return;
    if (event.data?.type === 'admira:tagged-size') {
      const height = event.data.height;
      if (Number.isInteger(height) && height > 0 && height <= 1200) importer.style.height = height + 2 + 'px';
    }
    if (event.data?.type !== 'admira:galleon:import' || !Array.isArray(event.data.items)) return;
    const incoming = event.data.items.slice(0, 30).flatMap(raw => {
      const item = stockItem(raw);
      if (!item) return [];
      const pair = initial.find(row => [row.landscape.id, row.portrait.id].includes(item.id));
      return [pair || { title: String(raw.title || '#' + raw.num).slice(0, 240), landscape: item, portrait: item }];
    });
    if (!incoming.length) return;
    const first = incoming[0].landscape.id;
    const known = new Set(entries.map(row => row.landscape.id));
    entries = entries.concat(incoming.filter(row => {
      if (known.has(row.landscape.id) || known.size >= initial.length + 30) return false;
      known.add(row.landscape.id);
      return true;
    }));
    try { localStorage.setItem(storageKey, JSON.stringify(entries.slice(initial.length))); } catch {}
    const index = entries.findIndex(row => row.landscape.id === first);
    render();
    if (index >= 0) select(index);
  });

  render();
  return sync;
}
