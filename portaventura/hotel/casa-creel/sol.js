// Sol real de PortAventura sobre el Hotel Creel (Neo, 13-nov-2026). El Sol sale de la pantalla y recorre en 3D una
// media semiesfera por encima de ella: salida por la izquierda (este), mediodía detrás de la pantalla (sur), puesta por
// la derecha (oeste). Slider de 24 h: al moverlo el Sol sigue su posición real de hoy (posición solar NOAA) y se dibuja
// su órbita del día. Emite "creel-hora" {min, vivo}; clima.js usa esa hora para la previsión por horas.
(() => {
  const LAT = 41.0868, LON = 1.1548, RAD = Math.PI / 180, R = 30; // R: radio de la semiesfera en unidades de tablero
  // Arco alto (Neo, 13-nov-2026): la semiesfera arranca por encima del borde superior de la pantalla LED y su altura
  // se exagera, así el Sol nunca pasa por delante de la pantalla.
  const BASE = 21, ALZA = .75; // 21: por encima de la pantalla, que ahora sube un 10 % (Carlos, 13-nov-2026)
  const capa = document.getElementById("creel-sol"), g = capa && capa.getContext("2d");
  const slider = document.getElementById("creel-hora"), salida = document.getElementById("creel-hora-out"), ahora = document.getElementById("creel-ahora"), info = document.getElementById("creel-sol-info");
  const estado = {min: 0, vivo: true};
  let cam = null, activo = false; // los datos del Sol solo se enseñan con un clima elegido (clima.js)
  const barra = document.querySelector(".creel-solbar");

  // Minutos del día en Madrid ⇄ instante real de hoy.
  const madrid = new Intl.DateTimeFormat("en-GB", {timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"});
  const partes = d => Object.fromEntries(madrid.formatToParts(d).map(p => [p.type, +p.value]));
  function minutoAhora() { const p = partes(new Date()); return p.hour * 60 + p.minute; }
  function instante(min) {
    const p = partes(new Date()), base = Date.UTC(p.year, p.month - 1, p.day, 0, min);
    const off = (() => { const q = partes(new Date(base)); return Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute) - base; })();
    return new Date(base - off);
  }
  const hhmm = m => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;

  // Posición solar (algoritmo NOAA simplificado): elevación y acimut (desde el norte, sentido horario) en grados.
  function solar(fecha) {
    const jd = fecha / 864e5 + 2440587.5, n = jd - 2451545;
    const L = (280.46 + .9856474 * n) % 360, gm = (357.528 + .9856003 * n) % 360 * RAD;
    const lam = (L + 1.915 * Math.sin(gm) + .02 * Math.sin(2 * gm)) * RAD, eps = (23.439 - 4e-7 * n) * RAD;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    const gmst = (280.46061837 + 360.98564736629 * n) % 360, ha = ((gmst + LON) * RAD - ra);
    const lat = LAT * RAD, el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha));
    const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(ha));
    return {el: el / RAD, az: ((az / RAD) + 360) % 360};
  }
  // Día de hoy: posición cada 5 min, salida y puesta (cruce de −0,833°).
  let dia = [], sale = null, pone = null;
  function calculaDia() {
    dia = []; sale = pone = null;
    for (let m = 0; m <= 1440; m += 5) dia.push({m, ...solar(instante(m))});
    for (let i = 1; i < dia.length; i++) {
      const a = dia[i - 1], b = dia[i], h = -.833;
      if (a.el < h && b.el >= h) sale = a.m + 5 * (h - a.el) / (b.el - a.el);
      if (a.el >= h && b.el < h) pone = a.m + 5 * (h - a.el) / (b.el - a.el);
    }
    if (info) info.textContent = sale != null ? `Sale ${hhmm(sale)} · se pone ${hhmm(pone)} (hoy en PortAventura)` : "";
  }
  // Dirección en la escena: norte = +z (hacia el espectador), sur = −z (detrás de la pantalla), este = −x (izquierda).
  const punto = ({el, az}) => { const e = el * RAD, a = az * RAD; return [-Math.sin(a) * Math.cos(e) * R, BASE + Math.max(0, Math.sin(e)) * R * ALZA, Math.cos(a) * Math.cos(e) * R]; };
  function proyecta([x, y, z], w, h) {
    const k = cam; return [(.5 + (x * k.cx - z * k.sx) * k.zoom / k.aspect * .5) * w, (.5 - (-x * k.sx * k.sy + (y + k.suelo - k.center) * k.cy - z * k.cx * k.sy) * k.zoom * .5) * h];
  }

  function pinta() {
    if (!g || !cam) return;
    const w = capa.clientWidth, h = capa.clientHeight; if (!w) return;
    if (capa.width !== w || capa.height !== h) { capa.width = w; capa.height = h; }
    g.clearRect(0, 0, w, h);
    if (!activo) return;
    // Órbita del día: de día, línea dorada; de noche (bajo el horizonte), no se dibuja.
    g.lineWidth = 2; g.setLineDash([6, 6]); g.strokeStyle = "rgba(255,210,110,.55)"; g.beginPath();
    let dentro = false;
    for (const p of dia) { if (p.el < -.833) { dentro = false; continue; } const [sx, sy] = proyecta(punto(p), w, h); if (dentro) g.lineTo(sx, sy); else g.moveTo(sx, sy); dentro = true; }
    g.stroke(); g.setLineDash([]);
    // Marcas de salida y puesta.
    g.font = "700 12px ui-monospace, monospace"; g.textAlign = "center"; g.fillStyle = "rgba(255,225,160,.9)";
    for (const [m, txt] of [[sale, "↑ "], [pone, "↓ "]]) if (m != null) { const [sx, sy] = proyecta(punto(solar(instante(m))), w, h); g.beginPath(); g.arc(sx, sy, 3, 0, 7); g.fill(); g.fillText(txt + hhmm(m), sx, sy - 10); }
    // El Sol en la hora del slider. De noche (Carlos, 13-nov-2026) algo tiene que verse al elegir clima: la Luna,
    // en el punto opuesto al Sol sobre el mismo arco, con su etiqueta.
    const s = solar(instante(estado.min)), r = Math.max(10, 22 * cam.zoom * 1.4);
    if (s.el > -.833) {
      const [sx, sy] = proyecta(punto(s), w, h);
      const luz = g.createRadialGradient(sx, sy, 2, sx, sy, r * 4); luz.addColorStop(0, "rgba(255,230,140,.9)"); luz.addColorStop(.3, "rgba(255,180,60,.35)"); luz.addColorStop(1, "rgba(255,150,0,0)");
      g.fillStyle = luz; g.beginPath(); g.arc(sx, sy, r * 4, 0, 7); g.fill();
      g.fillStyle = "#ffd65c"; g.shadowColor = "#ffb020"; g.shadowBlur = 24; g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill(); g.shadowBlur = 0;
    } else {
      const [mx, my] = proyecta(punto({el: -s.el, az: (s.az + 180) % 360}), w, h), rl = r * .8;
      const halo = g.createRadialGradient(mx, my, 2, mx, my, rl * 4); halo.addColorStop(0, "rgba(220,232,255,.55)"); halo.addColorStop(.35, "rgba(170,195,240,.2)"); halo.addColorStop(1, "rgba(120,150,220,0)");
      g.fillStyle = halo; g.beginPath(); g.arc(mx, my, rl * 4, 0, 7); g.fill();
      g.fillStyle = "#e9eef9"; g.shadowColor = "#b9c9ff"; g.shadowBlur = 20; g.beginPath(); g.arc(mx, my, rl, 0, 7); g.fill();
      g.fillStyle = "rgba(90,105,150,.35)"; g.shadowBlur = 0; // sombra para la fase (menguante, decorativa)
      g.beginPath(); g.arc(mx - rl * .35, my - rl * .1, rl * .82, 0, 7); g.fill();
      g.font = "700 12px ui-monospace, monospace"; g.textAlign = "center"; g.fillStyle = "rgba(225,232,255,.9)"; g.fillText("🌙 " + hhmm(estado.min) + " · noche", mx, my - rl - 10);
    }
  }

  function fija(min, vivo) {
    estado.min = Math.max(0, Math.min(1439, Math.round(min))); estado.vivo = vivo;
    if (slider) slider.value = estado.min;
    const s = solar(instante(estado.min));
    if (salida) salida.textContent = `${hhmm(estado.min)}${vivo ? " · ahora" : ""}${s.el > -.833 ? ` · ☀️ ${Math.round(s.el)}°` : " · 🌙"}`;
    if (ahora) ahora.disabled = vivo;
    dispatchEvent(new CustomEvent("creel-hora", {detail: {...estado}}));
    pinta();
  }
  if (slider) slider.addEventListener("input", () => fija(+slider.value, false));
  if (ahora) ahora.addEventListener("click", () => fija(minutoAhora(), true));
  addEventListener("creel-camara", ({detail}) => { cam = detail; pinta(); });
  addEventListener("creel-clima", ({detail}) => { activo = !!detail.activo; if (barra) barra.hidden = !activo; pinta(); });
  if (barra) barra.hidden = true;
  addEventListener("resize", pinta);
  setInterval(() => { if (estado.vivo) fija(minutoAhora(), true); }, 30000);

  window.creelSol = {solar, instante, estado, fija, etiqueta: () => hhmm(estado.min), get salida() { return sale; }, get puesta() { return pone; }};
  calculaDia(); fija(minutoAhora(), true);
})();
