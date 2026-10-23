/* XpaceOS · intro de la portada / homepage intro (NeoMacStudio, 17-oct-2026).
   Vídeo «Todo en orden» (15 s, sin sonido) a pantalla completa al entrar en la portada.
   - Sale una vez por sesión y por idioma (sessionStorage 'xpaceos_intro_a' = idiomas vistos, «es,en»),
     se salta con «Saltar intro» o Esc y se cierra sola al terminar o si el vídeo no arranca.
   - Con póster y vídeo bajo demanda (Carlos, 23-oct-2026): primero sale un fotograma de la intro (≈27 KB) con el botón
     «Ver la intro · 15 s»; el vídeo (5–8 MB) solo se descarga si el visitante lo pide. Como hay un clic, la música puede
     sonar desde el primer segundo. ?intro=1 la arranca directamente con el vídeo, como antes, para enseñarla.
   - En el idioma de la portada: español o inglés («All in order», 17-oct-2026), con los mismos tiempos.
     Al cambiar de idioma (botón ESP/ENG o /idioma; evento 'admira:languagechange'), sale en el idioma
     nuevo si aún no se ha visto en él; si la intro está en marcha, el vídeo cambia sin perder el segundo.
   - No sale con «reducir movimiento».
   - Solo con el look por defecto: si la pestaña tiene una marca blanca activa (?marca=, ?project=, local
     Starbucks o la marca recordada en sessionStorage 'mb:marca', como assets/marca-blanca.js), no sale.
     ?marca=admira (u off, default…) es el modo por defecto. Igual en xpaceos.com y en admira.store.
   - ?intro=0 la quita; ?intro=1 la fuerza (para enseñarla).
   - 1080p en pantallas grandes, 720p en el resto.
   - Música: una por idioma (Carlos, 17-oct-2026): castellano con «Tic-tac y campanas» e inglés con «Pulso»;
     si el idioma cambia con la intro en marcha, cambia también la música en el mismo segundo.
     Intenta sonar; si el navegador no deja, queda el botón «Activar sonido».
     ?musica=campanas|pulso la fija y ?musica=0 la quita. El audio va aparte y se ajusta al vídeo.
   Contrato / contract: admira-xp/docs/intro-portada.md */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document) api.start(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const SEEN_KEY = 'xpaceos_intro_a';
  // Una vez por VISITANTE (Carlos, 21-oct-2026): además de la sesión, se recuerda en localStorage 30 días
  // qué idiomas vio ({t, langs}); ?intro=1 la fuerza igual. Quien llega por primera vez la ve.
  const SEEN_LOCAL = 'xpaceos_intro_vista';
  const SEEN_DAYS = 30;
  const SOURCES = {
    es: {1080: '/assets/video/intro-xpaceos-a-1080.mp4', 720: '/assets/video/intro-xpaceos-a-720.mp4'},
    en: {1080: '/assets/video/intro-xpaceos-a-en-1080.mp4', 720: '/assets/video/intro-xpaceos-a-en-720.mp4'}
  };
  // Póster por idioma: el fotograma del segundo 10 («Pantallas, música, aroma y wifi.»), 1280 × 720, ≈27 KB.
  const POSTERS = {es: '/assets/video/intro-xpaceos-a-poster.jpg', en: '/assets/video/intro-xpaceos-a-en-poster.jpg'};
  // .mp4 y no .m4a: admira.store está en Cloudflare, que no guarda .m4a en caché ni lo sirve por rangos (206);
  // sin rangos, la música no se puede poner en el segundo del vídeo. Mismo audio AAC.
  const MUSIC = {campanas: '/assets/video/intro-xpaceos-a-musica-campanas.mp4', pulso: '/assets/video/intro-xpaceos-a-musica-pulso.mp4'};
  const BRAND_KEY = 'mb:marca';
  const BRAND_OFF = ['off', 'admira', 'ninguna', 'ninguno', 'none', 'default', 'apagar', 'quitar', 'reset'];
  const has = lang => Object.prototype.hasOwnProperty.call(SOURCES, lang);
  const LABELS = {
    es: {skip: 'Saltar intro', play: 'Ver la intro · 15 s', soundOn: 'Activar sonido', soundOff: 'Silenciar', aria: 'Intro de XpaceOS: antes de abrir fallan las pantallas, la música, el aroma y el wifi, y XpaceOS los deja en orden.'},
    en: {skip: 'Skip intro', play: 'Watch the intro · 15 s', soundOn: 'Turn sound on', soundOff: 'Mute', aria: 'XpaceOS intro: before opening, screens, music, scent and wifi fail, and XpaceOS puts them back in order.'}
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
  // Idiomas en los que ya se vio en esta sesión. El «1» antiguo (antes del 17-oct 20:45) no dice el idioma: cuenta como ninguno.
  function parseSeen(value) { return String(value || '').split(',').map(v => v.trim()).filter(v => has(v)); }

  // Decide si se enseña: ?intro=1 manda sobre todo; ?intro=0, ya vista, menos movimiento, un idioma sin vídeo
  // o una marca blanca activa (la intro es el look por defecto) la quitan.
  function shouldShow(o) {
    const intro = new URLSearchParams(o.search || '').get('intro');
    if (intro === '1') return true;
    if (intro === '0') return false;
    return has(o.lang) && !o.reducedMotion && !o.seen && !o.brand;
  }
  // Cómo arranca (23-oct-2026): «poster» = fotograma y botón, el vídeo solo si lo piden (lo normal);
  // «auto» = el vídeo directamente, como hasta el 22-oct, solo con ?intro=1 (para enseñarla).
  function modo(search) { return new URLSearchParams(search || '').get('intro') === '1' ? 'auto' : 'poster'; }
  // El vídeo del idioma (español si no hay otro); píxeles reales de ancho: desde 1600 va la de 1080p.
  function pickSource(width, dpr, lang) {
    const set = has(lang) ? SOURCES[lang] : SOURCES.es;
    return (Number(width) || 0) * (Number(dpr) || 1) >= 1600 ? set[1080] : set[720];
  }
  function pickPoster(lang) { return POSTERS[has(lang) ? lang : 'es']; }

  // Una música por idioma: castellano «Tic-tac y campanas», inglés «Pulso». ?musica=campanas|pulso la fija; ?musica=0 la quita.
  const MUSIC_BY_LANG = {es: 'campanas', en: 'pulso'};
  function pickMusic(search, lang) {
    const forced = new URLSearchParams(search || '').get('musica');
    if (forced === '0') return '';
    if (forced && Object.prototype.hasOwnProperty.call(MUSIC, forced)) return forced;
    return MUSIC_BY_LANG[lang] || MUSIC_BY_LANG.es;
  }

  const CSS = `
.xp-intro{position:fixed;inset:0;z-index:100000;background:#02080d;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .6s ease}
.xp-intro.is-closing{opacity:0}
.xp-intro video{width:100%;height:100%;object-fit:contain;background:#02080d}
.xp-intro-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#02080d}
.xp-intro-play{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:12px 24px 12px 12px;border:1px solid rgba(120,243,255,.6);border-radius:999px;background:rgba(2,8,13,.74);color:#dff8ff;font:600 14px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;white-space:nowrap}
.xp-intro-play:hover{border-color:#78f3ff;background:rgba(2,8,13,.92)}
.xp-intro-play:focus-visible{outline:2px solid #ffd866;outline-offset:3px}
.xp-intro-play-ic{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#78f3ff;color:#02080d;font-size:16px;padding-left:3px}
.xp-intro-actions{position:absolute;right:max(20px,env(safe-area-inset-right,0px));bottom:max(24px,env(safe-area-inset-bottom,0px));display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}
.xp-intro-skip,.xp-intro-sound{padding:10px 16px;border:1px solid rgba(120,243,255,.45);border-radius:8px;background:rgba(2,8,13,.6);color:#dff8ff;font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.xp-intro-skip:hover,.xp-intro-sound:hover{border-color:#78f3ff}
.xp-intro-skip:focus-visible,.xp-intro-sound:focus-visible{outline:2px solid #ffd866;outline-offset:3px}
.xp-intro-sound[aria-pressed="false"]{border-color:#ffd866;color:#ffd866}
.xp-intro-bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:#78f3ff}`;

  function storage(win, kind) { try { return win[kind]; } catch (_) { return null; } }
  // Idiomas vistos según localStorage: vale si hace menos de SEEN_DAYS días.
  function recordada(raw, now) {
    try {
      const o = JSON.parse(raw || 'null');
      if (!o || !Array.isArray(o.langs) || !Number.isFinite(o.t)) return [];
      return (Number(now) - o.t) < SEEN_DAYS * 86400000 ? o.langs.filter(has) : [];
    } catch (_) { return []; }
  }
  // Primero se pinta la portada; la intro (y su póster) arranca justo después del primer pintado.
  function afterFirstPaint(win, fn) {
    if (win && typeof win.requestAnimationFrame === 'function') win.requestAnimationFrame(() => win.requestAnimationFrame(fn));
    else fn();
  }

  function start(win) {
    const session = storage(win, 'sessionStorage');
    const local = storage(win, 'localStorage');
    const read = key => { try { return (session && session.getItem(key)) || ''; } catch (_) { return ''; } };
    const readLocal = () => { try { return (local && local.getItem(SEEN_LOCAL)) || ''; } catch (_) { return ''; } };
    const reducedMotion = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const seenNow = () => { const all = parseSeen(read(SEEN_KEY)); for (const l of recordada(readLocal(), Date.now())) if (!all.includes(l)) all.push(l); return all; };
    const markSeen = langs => {
      const all = seenNow(); for (const l of langs) if (has(l) && !all.includes(l)) all.push(l);
      try { session && session.setItem(SEEN_KEY, all.join(',')); } catch (_) {}
      try { local && local.setItem(SEEN_LOCAL, JSON.stringify({t: Date.now(), langs: all})); } catch (_) {}
    };
    let current = null;
    const tryOpen = lang => {
      if (current) return;
      if (!shouldShow({search: win.location.search, lang, reducedMotion, seen: seenNow().includes(lang), brand: activeBrand(win.location.search, read(BRAND_KEY))})) return;
      current = open(win, lang, shown => { markSeen(shown); current = null; });
    };
    afterFirstPaint(win, () => {
      tryOpen(win.XpaceLang ? win.XpaceLang.resolve({url: win.location.href, storage: storage(win, 'localStorage'), fallback: 'es'}) : 'es');
      // Si la portada pintó el marco con el póster pero aquí se decide que no sale, se quita.
      if (!current) { const pre = win.document.getElementById('xp-intro-pre'); if (pre) pre.remove(); }
    });
    // Al pasar a otro idioma: con la intro en marcha cambia el vídeo; si no, sale en ese idioma si aún no se ha visto en él.
    win.addEventListener('admira:languagechange', ev => {
      const next = String((ev && ev.detail && ev.detail.lang) || '').toLowerCase();
      if (!has(next)) return;
      if (current) current.setLang(next); else tryOpen(next);
    });
  }

  function open(win, lang, onClosed) {
    const doc = win.document;
    const shown = [lang];
    let t = LABELS[lang] || LABELS.es;
    const arranque = modo(win.location.search);

    const style = doc.createElement('style');
    style.textContent = CSS;
    // Si la portada ya pintó el marco con el póster (guion al principio de <body>, window.__xpIntro), se adopta:
    // el póster no se vuelve a pedir y no hay salto. Si no, se crea aquí.
    const pre = doc.getElementById('xp-intro-pre');
    const box = pre || doc.createElement('div');
    if (pre) { pre.removeAttribute('id'); pre.removeAttribute('style'); }
    box.className = 'xp-intro';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', t.aria);
    // Póster: un fotograma, no el vídeo. El vídeo se crea en startVideo() (al pulsar, o al momento con ?intro=1):
    // hasta entonces no se descarga ni un byte de él.
    const poster = (pre && pre.querySelector('.xp-intro-poster')) || doc.createElement('img');
    poster.className = 'xp-intro-poster'; poster.alt = ''; poster.width = 1280; poster.height = 720; poster.decoding = 'async';
    poster.setAttribute('fetchpriority', 'high'); poster.removeAttribute('style');
    if (poster.getAttribute('src') !== pickPoster(lang)) poster.src = pickPoster(lang);
    const play = doc.createElement('button');
    play.type = 'button'; play.className = 'xp-intro-play';
    const paintPlay = () => { play.textContent = ''; const ic = doc.createElement('span'); ic.className = 'xp-intro-play-ic'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = '▶'; const tx = doc.createElement('span'); tx.textContent = t.play; play.append(ic, tx); };
    paintPlay();
    let video = null;
    const skip = doc.createElement('button');
    skip.type = 'button'; skip.className = 'xp-intro-skip'; skip.textContent = t.skip + ' ✕';
    const bar = doc.createElement('div');
    bar.className = 'xp-intro-bar';
    const actions = doc.createElement('div');
    actions.className = 'xp-intro-actions';

    // Música aparte del vídeo: la del idioma, ajustada al tiempo del vídeo. Se crea con el vídeo.
    let track = pickMusic(win.location.search, lang);
    let audio = null, soundOn = false, triedAuto = false;
    const sound = doc.createElement('button');
    sound.type = 'button'; sound.className = 'xp-intro-sound';
    const paintSound = () => { sound.textContent = soundOn ? '🔇 ' + t.soundOff : '🔊 ' + t.soundOn; sound.setAttribute('aria-pressed', String(soundOn)); };
    const syncPlay = () => { try { audio.currentTime = video.currentTime; } catch (_) {} return audio.play(); };
    const tryOn = () => { soundOn = true; paintSound(); const p = syncPlay(); if (p && p.catch) p.catch(() => { soundOn = false; paintSound(); }); };
    sound.addEventListener('click', () => { if (!audio) return; if (soundOn) { soundOn = false; audio.pause(); paintSound(); } else tryOn(); });
    actions.append(skip);
    box.append(poster, play, actions, bar);

    const html = doc.documentElement, overflow = html.style.overflow;
    let closed = false, watchdog = 0;
    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(watchdog);
      if (audio) { try { audio.pause(); } catch (_) {} }
      onClosed(shown);
      win.removeEventListener('keydown', onKey);
      html.style.overflow = overflow;
      box.classList.add('is-closing');
      win.setTimeout(() => { if (video) { try { video.pause(); } catch (_) {} } box.remove(); style.remove(); }, 650);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    skip.addEventListener('click', close);
    win.addEventListener('keydown', onKey);

    // Crea el vídeo y lo arranca. `espera`: si en esos ms no ha empezado (red lenta, reproducción bloqueada), no tapa la portada.
    function startVideo(espera) {
      if (video || closed) return;
      play.remove();
      video = doc.createElement('video');
      video.muted = true; video.defaultMuted = true; video.playsInline = true; video.autoplay = true;
      video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.preload = 'auto';
      video.src = pickSource(win.innerWidth, win.devicePixelRatio, lang);
      video.addEventListener('ended', close);
      video.addEventListener('error', close);
      video.addEventListener('timeupdate', () => { if (video.duration) bar.style.width = (100 * video.currentTime / video.duration) + '%'; });
      // El póster se queda encima hasta que el vídeo pinta su primer fotograma: sin negro entre medias.
      video.addEventListener('playing', () => poster.remove(), {once: true});
      if (track) {
        audio = new win.Audio(MUSIC[track]);
        audio.preload = 'auto';
        // Intenta sonar al arrancar (tras el clic en «Ver la intro» el navegador lo permite); si no deja, queda el botón.
        video.addEventListener('playing', () => { if (!triedAuto) { triedAuto = true; tryOn(); } else if (soundOn) syncPlay(); });
        video.addEventListener('pause', () => audio.pause());
        video.addEventListener('timeupdate', () => { if (soundOn && !audio.paused && Math.abs(audio.currentTime - video.currentTime) > 0.25) audio.currentTime = video.currentTime; });
        paintSound();
        actions.prepend(sound);
      }
      box.insertBefore(video, poster);
      watchdog = win.setTimeout(() => { if (!(video.currentTime > 0)) close(); }, espera);
      const p = video.play();
      if (p && p.catch) p.catch(close);
      try { skip.focus({preventScroll: true}); } catch (_) {}
    }
    // Bajo demanda: el visitante pide el vídeo. Con un clic por medio hay más margen (8 s) para que llegue.
    play.addEventListener('click', () => startVideo(8000));

    (doc.head || html).appendChild(style);
    const mount = () => {
      if (!box.parentNode) doc.body.appendChild(box);
      html.style.overflow = 'hidden';
      if (arranque === 'auto') startVideo(4000);
      else { try { play.focus({preventScroll: true}); } catch (_) {} }
    };
    if (doc.body) mount(); else doc.addEventListener('DOMContentLoaded', mount, {once: true});

    // Cambio de idioma con la intro en marcha: el vídeo del otro idioma, en el mismo segundo; la música sigue.
    // Con solo el póster a la vista, cambian el póster y los textos.
    function setLang(next) {
      if (closed || next === lang || !has(next)) return;
      lang = next; t = LABELS[next] || LABELS.es;
      if (!shown.includes(next)) shown.push(next);
      poster.src = pickPoster(next);
      if (video) {
        const at = video.currentTime;
        video.addEventListener('loadedmetadata', () => { try { video.currentTime = at; } catch (_) {} const p = video.play(); if (p && p.catch) p.catch(() => {}); }, {once: true});
        video.src = pickSource(win.innerWidth, win.devicePixelRatio, next);
      }
      // Y la música del otro idioma, en el mismo punto, si suena.
      const nextTrack = pickMusic(win.location.search, next);
      if (nextTrack && nextTrack !== track) {
        track = nextTrack;
        if (audio) {
          audio.pause();
          audio.src = MUSIC[nextTrack];
          if (soundOn) audio.addEventListener('canplay', () => { if (!closed && soundOn) syncPlay(); }, {once: true});
        }
      }
      skip.textContent = t.skip + ' ✕'; box.setAttribute('aria-label', t.aria); paintPlay(); paintSound();
    }
    return {setLang, get lang() { return lang; }};
  }

  return {SEEN_KEY, SOURCES, POSTERS, MUSIC, MUSIC_BY_LANG, activeBrand, parseSeen, shouldShow, modo, pickSource, pickPoster, pickMusic, start, recordada, afterFirstPaint, SEEN_LOCAL, SEEN_DAYS};
});
