/* Altadis · Pixeria comparison. Local, pre-rendered MP4s; no model/API generation. */
(function (root) {
  'use strict';
  function validFile(file) {
    return !!file && typeof file.url === 'string' && /^(https:\/\/|\/(?!\/))/.test(file.url) &&
      Number.isInteger(file.width) && file.width > 0 && Number.isInteger(file.height) && file.height > 0;
  }
  function formatFor(surface) {
    var file = surface && surface.files && surface.files.adapted;
    return validFile(file) && file.width === Number(surface.w) && file.height === Number(surface.h)
      ? { id: surface.screen || surface.name, src: file.url, width: file.width, height: file.height } : null;
  }
  function sourceFor(surface, mode) {
    var file = surface && surface.files && surface.files[mode === 'original' ? 'original' : 'adapted'];
    if (!file) return { status: 'pending', src: null };
    if (!validFile(file) || (mode !== 'original' && !formatFor(surface))) return { status: 'invalid-file', src: null };
    return { status: 'loading', src: file.url, width: file.width, height: file.height };
  }
  function fitRect(vw, vh, w, h) {
    var scale = Math.min(w / vw, h / vh);
    return { x: (w - vw * scale) / 2, y: (h - vh * scale) / 2, w: vw * scale, h: vh * scale };
  }
  var api = { formatFor: formatFor, sourceFor: sourceFor, fitRect: fitRect };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document || !root.location) return;
  var params = new URLSearchParams(root.location.search);
  if (!/^altadis-bcn-00[1-9]$/.test((params.get('loc') || '').trim().toLowerCase())) return;
  var mode = params.get('adaptado') === '0' ? 'original' : 'adapted';
  var bindings = [], mainVideo = null, statusTimer;
  function surfaces() {
    var cfg = root.STORE_CFG;
    return cfg && Array.isArray(cfg.surfaces) ? cfg.surfaces.filter(function (s) {
      return s && (s.surface === 'pantalla' || s.surface === 'escaparate');
    }) : [];
  }
  function mainSurface() { return surfaces().find(function (s) { return s.orient === 'horizontal'; }) || surfaces()[0]; }
  function shortSurface(i) { var main = mainSurface(); return surfaces().filter(function (s) { return s !== main; })[i]; }
  function status() {
    var el = document.getElementById('altadis-screen-status');
    if (!el) return;
    var errors = bindings.filter(function (b) { return b.video.error || b.video.dataset.status === 'invalid-file' || b.video.dataset.status === 'dimension-mismatch'; });
    var pending = bindings.filter(function (b) { return b.video.dataset.status === 'pending'; }).length;
    var playing = bindings.filter(function (b) { return b.video.readyState >= 2 && !b.video.paused && !b.video.error; }).length;
    el.textContent = errors.length ? 'Archivo inválido: revisa medida y URL de la pantalla.' :
      pending ? 'Contenido Altadis pendiente · ' + pending + '/' + surfaces().length + ' marcadores · ' + (mode === 'adapted' ? '1080×1920 + 1920×1080' : 'original pendiente') :
      playing + '/' + surfaces().length + ' pantallas reproduciendo';
    el.dataset.status = errors.length ? 'error' : pending ? 'pending' : playing === surfaces().length && playing > 0 ? 'ready' : 'loading';
  }
  function placeholder(ctx, w, h) {
    ctx.fillStyle = '#70757b'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.font = Math.max(7, Math.min(w / 11, h / 9)) + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('contenido Altadis', w / 2, h / 2);
  }
  function apply(binding, time) {
    var v = binding.video, file = sourceFor(binding.surface, mode);
    v.style.objectFit = 'contain';
    v.style.display = v.id === 'altadis-main-video' ? 'none' : file.src ? 'block' : 'none';
    v.dataset.screen = binding.surface.screen || binding.surface.name;
    v.dataset.mode = mode; v.dataset.status = file.status;
    v.dataset.format = Number(binding.surface.w) + 'x' + Number(binding.surface.h);
    v._altadisFile = file;
    v._altadisSeek = Number.isFinite(time) ? time : 0;
    if (!file.src) { v.pause(); v.removeAttribute('src'); v.load(); status(); return; }
    if (v.getAttribute('src') !== file.src) { v.src = file.src; v.load(); }
    v.play().catch(function () { v.dataset.status = 'play-required'; status(); });
  }
  function bindVideo(v, s) {
    if (!s) return;
    var binding = bindings.find(function (b) { return b.video === v; });
    if (binding) { if (binding.surface !== s) { binding.surface = s; apply(binding, mainVideo && mainVideo.currentTime || 0); } return; }
    binding = { video: v, surface: s }; bindings.push(binding);
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.crossOrigin = 'anonymous';
    v.addEventListener('loadedmetadata', function () {
      if (v.videoWidth !== v._altadisFile.width || v.videoHeight !== v._altadisFile.height) { v.dataset.status='dimension-mismatch'; v.style.display='none'; v.pause(); status(); return; }
      if (Number.isFinite(v.duration) && v.duration > 0) v.currentTime = v._altadisSeek % v.duration;
    });
    v.addEventListener('playing', function () { if (v.dataset.status === 'dimension-mismatch') { v.pause(); return; } v.dataset.status = 'playing'; status(); });
    v.addEventListener('error', function () { v.dataset.status = 'error'; v.style.display='none'; status(); });
    apply(binding, mainVideo && mainVideo.currentTime || 0);
  }
  function setMode(next) {
    mode = next === 'original' ? 'original' : 'adapted';
    var time = mainVideo && mainVideo.currentTime || 0;
    bindings.forEach(function (b) { apply(b, time); });
    var url = new URL(location.href); url.searchParams.set('adaptado', mode === 'adapted' ? '1' : '0');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    document.querySelectorAll('[data-altadis-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.altadisMode === mode));
    });
    status(); root.dispatchEvent(new CustomEvent('altadis-modechange', { detail: { mode: mode } }));
  }
  function init() {
    var ss = surfaces(); if (!ss.length || !document.body) return;
    // One registered horizontal monitor on the long wall, then the other surfaces.
    root.STORE_CFG.screens = ss.length;
    if (!mainVideo) {
      mainVideo = document.createElement('video'); mainVideo.id = 'altadis-main-video';
      mainVideo.hidden = true; document.body.appendChild(mainVideo);
    }
    bindVideo(mainVideo, mainSurface());
    if (!statusTimer) statusTimer = setInterval(status, 500);
  }
  function drawMostrador(ctx, w, h) {
    if (!mainVideo) init();
    if (!mainVideo) return false;
    if (mainVideo.dataset.status === 'pending' || mainVideo.dataset.status === 'invalid-file' || mainVideo.dataset.status === 'dimension-mismatch') { placeholder(ctx, w, h); return true; }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    if (mainVideo.readyState >= 2 && mainVideo.videoWidth && !mainVideo.error) {
      var r = fitRect(mainVideo.videoWidth, mainVideo.videoHeight, w, h);
      ctx.drawImage(mainVideo, r.x, r.y, r.w, r.h);
    } else {
      ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(mainVideo.error ? 'Vídeo no disponible' : 'Cargando campaña neutra…', w / 2, h / 2);
    }
    return true;
  }
  root.altadisDemo = Object.assign(api, { surfaces: surfaces, mainSurface: mainSurface, shortSurface: shortSurface,
    bindVideo: bindVideo, setMode: setMode, mode: function () { return mode; }, drawMostrador: drawMostrador, status: status });
  root.addEventListener('storecfg', init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
