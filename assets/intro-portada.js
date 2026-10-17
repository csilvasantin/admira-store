/* XpaceOS · intro de la portada / homepage intro (NeoMacStudio, 17-oct-2026).
   Vídeo «Todo en orden» (15 s, sin sonido) a pantalla completa al entrar en la portada.
   - Sale una vez por sesión (sessionStorage 'xpaceos_intro_a'), se salta con «Saltar intro» o Esc
     y se cierra sola al terminar o si el vídeo no arranca.
   - En el idioma de la portada: español o inglés («All in order», 17-oct-2026), con los mismos tiempos.
   - No sale con «reducir movimiento».
   - Solo con el look por defecto: si la pestaña tiene una marca blanca activa (?marca=, ?project=, local
     Starbucks o la marca recordada en sessionStorage 'mb:marca', como assets/marca-blanca.js), no sale.
     ?marca=admira (u off, default…) es el modo por defecto. Igual en xpaceos.com y en admira.store.
   - ?intro=0 la quita; ?intro=1 la fuerza (para enseñarla).
   - 1080p en pantallas grandes, 720p en el resto.
   - Música: alterna «Tic-tac y campanas» y «Pulso» en cada intro (localStorage 'xpaceos_intro_musica').
     Intenta sonar; si el navegador no deja (lo normal sin un clic), queda el botón «Activar sonido».
     ?musica=campanas|pulso la fija y ?musica=0 la quita. El audio va aparte y se ajusta al vídeo.
   Contrato / contract: admira-xp/docs/intro-portada.md */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document) api.start(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const SEEN_KEY = 'xpaceos_intro_a';
  const SOURCES = {
    es: {1080: '/assets/video/intro-xpaceos-a-1080.mp4', 720: '/assets/video/intro-xpaceos-a-720.mp4'},
    en: {1080: '/assets/video/intro-xpaceos-a-en-1080.mp4', 720: '/assets/video/intro-xpaceos-a-en-720.mp4'}
  };
  const MUSIC_KEY = 'xpaceos_intro_musica';
  // .mp4 y no .m4a: admira.store está en Cloudflare, que no guarda .m4a en caché ni lo sirve por rangos (206);
  // sin rangos, la música no se puede poner en el segundo del vídeo. Mismo audio AAC.
  const MUSIC = {campanas: '/assets/video/intro-xpaceos-a-musica-campanas.mp4', pulso: '/assets/video/intro-xpaceos-a-musica-pulso.mp4'};
  const BRAND_KEY = 'mb:marca';
  const BRAND_OFF = ['off', 'admira', 'ninguna', 'ninguno', 'none', 'default', 'apagar', 'quitar', 'reset'];
  const has = lang => Object.prototype.hasOwnProperty.call(SOURCES, lang);
  const LABELS = {
    es: {skip: 'Saltar intro', soundOn: 'Activar sonido', soundOff: 'Silenciar', aria: 'Intro de XpaceOS: antes de abrir fallan las pantallas, la música, el aroma y el wifi, y XpaceOS los deja en orden.'},
    en: {skip: 'Skip intro', soundOn: 'Turn sound on', soundOff: 'Mute', aria: 'XpaceOS intro: before opening, screens, music, scent and wifi fail, and XpaceOS puts them back in order.'}
  };

  // Marca blanca activa, con las mismas prioridades que assets/marca-blanca.js: ?marca= > proyecto > recordada.
  function activeBrand(search, stored) {
    const q = new URLSearchParams(search || '');
    const off = v => BRAND_OFF.includes(v);
    const m = q.get('marca');
    if (m != null) { const v = m.trim().toLowerCase(); return !v || off(v) ? '' : v; }
    if (q.get('project')) return q.get('project').trim().toLowerCase();
    if (/^alsea-sbux-/.test(q.get('loc') || '')) return 'starbucks';
    const s = String(stored || '').trim().toLowerCase();
    return s && !off(s) ? s : '';
  }
  // Decide si se enseña: ?intro=1 manda sobre todo; ?intro=0, ya vista, menos movimiento, un idioma sin vídeo
  // o una marca blanca activa (la intro es el look por defecto) la quitan.
  function shouldShow(o) {
    const intro = new URLSearchParams(o.search || '').get('intro');
    if (intro === '1') return true;
    if (intro === '0') return false;
    return has(o.lang) && !o.reducedMotion && !o.seen && !o.brand;
  }
  // El vídeo del idioma (español si no hay otro); píxeles reales de ancho: desde 1600 va la de 1080p.
  function pickSource(width, dpr, lang) {
    const set = has(lang) ? SOURCES[lang] : SOURCES.es;
    return (Number(width) || 0) * (Number(dpr) || 1) >= 1600 ? set[1080] : set[720];
  }

  // Alterna las dos bandas sonoras: la que no sonó la última vez. ?musica=campanas|pulso la fija; ?musica=0 la quita.
  function pickMusic(search, last) {
    const forced = new URLSearchParams(search || '').get('musica');
    if (forced === '0') return '';
    if (forced && Object.prototype.hasOwnProperty.call(MUSIC, forced)) return forced;
    return last === 'campanas' ? 'pulso' : 'campanas';
  }

  const CSS = `
.xp-intro{position:fixed;inset:0;z-index:100000;background:#02080d;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .6s ease}
.xp-intro.is-closing{opacity:0}
.xp-intro video{width:100%;height:100%;object-fit:contain;background:#02080d}
.xp-intro-actions{position:absolute;right:max(20px,env(safe-area-inset-right,0px));bottom:max(24px,env(safe-area-inset-bottom,0px));display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}
.xp-intro-skip,.xp-intro-sound{padding:10px 16px;border:1px solid rgba(120,243,255,.45);border-radius:8px;background:rgba(2,8,13,.6);color:#dff8ff;font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.xp-intro-skip:hover,.xp-intro-sound:hover{border-color:#78f3ff}
.xp-intro-skip:focus-visible,.xp-intro-sound:focus-visible{outline:2px solid #ffd866;outline-offset:3px}
.xp-intro-sound[aria-pressed="false"]{border-color:#ffd866;color:#ffd866}
.xp-intro-bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:#78f3ff}`;

  function storage(win, kind) { try { return win[kind]; } catch (_) { return null; } }

  function start(win) {
    const doc = win.document;
    const session = storage(win, 'sessionStorage');
    let seen = false;
    try { seen = !!(session && session.getItem(SEEN_KEY)); } catch (_) {}
    const lang = win.XpaceLang ? win.XpaceLang.resolve({url: win.location.href, storage: storage(win, 'localStorage'), fallback: 'es'}) : 'es';
    const reducedMotion = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let stored = '';
    try { stored = (session && session.getItem(BRAND_KEY)) || ''; } catch (_) {}
    const brand = activeBrand(win.location.search, stored);
    if (!shouldShow({search: win.location.search, lang, reducedMotion, seen, brand})) return;
    const t = LABELS[lang] || LABELS.es;

    const style = doc.createElement('style');
    style.textContent = CSS;
    const box = doc.createElement('div');
    box.className = 'xp-intro';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', t.aria);
    const video = doc.createElement('video');
    video.muted = true; video.defaultMuted = true; video.playsInline = true; video.autoplay = true;
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.preload = 'auto';
    video.src = pickSource(win.innerWidth, win.devicePixelRatio, lang);
    const skip = doc.createElement('button');
    skip.type = 'button'; skip.className = 'xp-intro-skip'; skip.textContent = t.skip + ' ✕';
    const bar = doc.createElement('div');
    bar.className = 'xp-intro-bar';
    const actions = doc.createElement('div');
    actions.className = 'xp-intro-actions';

    // Música aparte del vídeo: alterna en cada intro y se ajusta al tiempo del vídeo.
    const local = storage(win, 'localStorage');
    let last = '';
    try { last = (local && local.getItem(MUSIC_KEY)) || ''; } catch (_) {}
    const track = pickMusic(win.location.search, last);
    let audio = null, soundOn = false, triedAuto = false;
    const sound = doc.createElement('button');
    sound.type = 'button'; sound.className = 'xp-intro-sound';
    const paintSound = () => { sound.textContent = soundOn ? '🔇 ' + t.soundOff : '🔊 ' + t.soundOn; sound.setAttribute('aria-pressed', String(soundOn)); };
    if (track) {
      try { local && local.setItem(MUSIC_KEY, track); } catch (_) {}
      audio = new win.Audio(MUSIC[track]);
      audio.preload = 'auto';
      const syncPlay = () => { try { audio.currentTime = video.currentTime; } catch (_) {} return audio.play(); };
      const tryOn = () => { soundOn = true; paintSound(); const p = syncPlay(); if (p && p.catch) p.catch(() => { soundOn = false; paintSound(); }); };
      // Primero intenta con sonido; si el navegador no deja, se queda en silencio con el botón a la vista.
      video.addEventListener('playing', () => { if (!triedAuto) { triedAuto = true; tryOn(); } else if (soundOn) syncPlay(); });
      video.addEventListener('pause', () => audio.pause());
      video.addEventListener('timeupdate', () => { if (soundOn && !audio.paused && Math.abs(audio.currentTime - video.currentTime) > 0.25) audio.currentTime = video.currentTime; });
      sound.addEventListener('click', () => { if (soundOn) { soundOn = false; audio.pause(); paintSound(); } else tryOn(); });
      paintSound();
      actions.append(sound);
    }
    actions.append(skip);
    box.append(video, actions, bar);

    const html = doc.documentElement, overflow = html.style.overflow;
    let closed = false, watchdog = 0;
    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(watchdog);
      if (audio) { try { audio.pause(); } catch (_) {} }
      try { session && session.setItem(SEEN_KEY, '1'); } catch (_) {}
      win.removeEventListener('keydown', onKey);
      html.style.overflow = overflow;
      box.classList.add('is-closing');
      win.setTimeout(() => { try { video.pause(); } catch (_) {} box.remove(); style.remove(); }, 650);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    skip.addEventListener('click', close);
    win.addEventListener('keydown', onKey);
    video.addEventListener('ended', close);
    video.addEventListener('error', close);
    video.addEventListener('timeupdate', () => { if (video.duration) bar.style.width = (100 * video.currentTime / video.duration) + '%'; });
    // Si en 4 s no ha empezado (red lenta, autoplay bloqueado), no tapa la portada.
    watchdog = win.setTimeout(() => { if (!(video.currentTime > 0)) close(); }, 4000);

    (doc.head || html).appendChild(style);
    const mount = () => {
      doc.body.appendChild(box);
      html.style.overflow = 'hidden';
      const p = video.play();
      if (p && p.catch) p.catch(close);
      try { skip.focus({preventScroll: true}); } catch (_) {}
    };
    if (doc.body) mount(); else doc.addEventListener('DOMContentLoaded', mount, {once: true});
  }

  return {SEEN_KEY, SOURCES, MUSIC_KEY, MUSIC, activeBrand, shouldShow, pickSource, pickMusic, start};
});
