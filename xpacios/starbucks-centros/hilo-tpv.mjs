// El TPV del local con el hilo musical (Carlos, 16-oct-2026: «añadir el hilo musical en el tpv como en Paseo de
// Gracia… que sea un clon»). La misma playlist que el TPV de Paseo de Gràcia 103 (/admira-xp/api/music-playlist,
// la del player físico) y su misma imagen: la carátula de lo que suena con el título. Tocar el TPV: escuchar o
// silenciar. Arranca callado (el navegador no deja sonar sin un toque) y pasa solo a la siguiente canción.
export const ANCHO = 720, ALTO = 1280;
const API = '/admira-xp/api/music-playlist';
const limpio = t => String(t || '').replace(/#[\p{L}\p{N}_-]+/gu, '').replace(/\(Stock\s+\d+\)/gi, '').replace(/^(?:ES|EN)\s*·\s*/, '').replace(/\s+/g, ' ').trim();
export function lineas(titulo, max = 20) {
  const out = []; let l = '';
  for (const w of limpio(titulo).split(/\s+/)) { if ((l + ' ' + w).trim().length > max && l) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); }
  if (l) out.push(l); return out.slice(0, 3);
}

export function crearHiloTPV({ doc = document, fetchImpl = (...a) => fetch(...a), origenes = [API, 'https://www.admira.store' + API] } = {}) {
  const lienzo = doc.createElement('canvas'); lienzo.width = ANCHO; lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d');
  const audio = new Audio(); audio.preload = 'none'; audio.crossOrigin = 'anonymous'; audio.volume = 0.5;
  let pistas = [], i = 0, sonando = false, portada = null, portadaDe = '', error = '';
  async function cargar() {
    for (const url of origenes) {
      try {
        const r = await fetchImpl(url, { cache: 'no-store' }); if (!r.ok) continue;
        const d = await r.json();
        if (d && d.ok && Array.isArray(d.tracks) && d.tracks.length) { pistas = d.tracks.filter(t => t && t.url); error = ''; return; }
      } catch { /* el siguiente */ }
    }
    error = 'sin playlist';
  }
  const actual = () => pistas[i % Math.max(1, pistas.length)] || null;
  function prepararPortada() {
    const t = actual(), src = t && t.cover;
    if (!src || src === portadaDe) return;
    portadaDe = src; portada = null;
    const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => { if (portadaDe === src) portada = img; }; img.src = src;
  }
  function poner() { const t = actual(); if (!t) return; audio.src = t.url; prepararPortada(); }
  audio.addEventListener('ended', () => { i = (i + 1) % Math.max(1, pistas.length); poner(); if (sonando) audio.play().catch(() => { sonando = false; }); });
  audio.addEventListener('error', () => { if (pistas.length > 1) { i = (i + 1) % pistas.length; poner(); if (sonando) audio.play().catch(() => { sonando = false; }); } });

  function pintar() {
    const t = actual();
    ctx.fillStyle = '#1e3932'; ctx.fillRect(0, 0, ANCHO, ALTO);
    if (portada) {
      const s = Math.max(ANCHO / portada.width, ALTO / portada.height), w = portada.width * s, h = portada.height * s;
      ctx.drawImage(portada, (ANCHO - w) / 2, (ALTO - h) / 2, w, h);
    } else {
      ctx.fillStyle = '#00704a'; ctx.beginPath(); ctx.arc(ANCHO / 2, ALTO * 0.38, 170, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = '700 190px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', ANCHO / 2, ALTO * 0.38);
    }
    const g = ctx.createLinearGradient(0, ALTO * 0.45, 0, ALTO); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.9)');
    ctx.fillStyle = g; ctx.fillRect(0, ALTO * 0.45, ANCHO, ALTO * 0.55);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#9dffd6'; ctx.font = '700 34px ui-monospace, Menlo, monospace';
    ctx.fillText(sonando ? '♪ HILO MUSICAL · SONANDO' : '♪ HILO MUSICAL', 44, ALTO - 300);
    ctx.fillStyle = '#ffffff'; ctx.font = '700 56px system-ui, sans-serif';
    const ls = t ? lineas(t.title) : [error ? 'Hilo musical no disponible' : 'Cargando la playlist…'];
    ls.forEach((l, n) => ctx.fillText(l, 44, ALTO - 220 + n * 64));
    ctx.fillStyle = '#d7f5e3'; ctx.font = '500 30px system-ui, sans-serif';
    ctx.fillText(sonando ? 'Toca para silenciar' : 'Toca para escuchar', 44, ALTO - 40);
    if (sonando && audio.duration > 0) { ctx.fillStyle = '#00e293'; ctx.fillRect(0, ALTO - 10, ANCHO * (audio.currentTime / audio.duration), 10); }
  }

  const listo = cargar().then(() => { poner(); pintar(); });
  return {
    lienzo, listo, pintar,
    get sonando() { return sonando; }, get titulo() { const t = actual(); return t ? limpio(t.title) : ''; }, get pistas() { return pistas.length; },
    async alternar() {
      await listo;
      if (!actual()) return false;
      if (sonando) { audio.pause(); sonando = false; return false; }
      try { await audio.play(); sonando = true; } catch { sonando = false; }
      return sonando;
    },
    silenciar() { audio.pause(); sonando = false; },
  };
}
