// Clima real de PortAventura en la Casa Creel (Neo, 13-nov-2026). IF clima THEN la pantalla gigante y la maqueta
// lo reflejan: sol, nubes, lluvia o tormenta. Datos: Open-Meteo (sin clave), PortAventura (Salou), cada 10 min.
// Los iconos ☀️ 🌧️ ⛈️ fuerzan el clima para probar; 🛰️ vuelve al real. Emite "creel-clima" {tipo, temp, real, forzado}.
(() => {
  const URL_CLIMA = "https://api.open-meteo.com/v1/forecast?latitude=41.0868&longitude=1.1548&current=temperature_2m,weather_code,is_day&timezone=Europe%2FMadrid";
  const ICONO = {sol: "☀️", nubes: "☁️", lluvia: "🌧️", tormenta: "⛈️"}, NOMBRE = {sol: "Sol", nubes: "Nubes", lluvia: "Lluvia", tormenta: "Tormenta"};
  const HACE = {sol: "sale el sol en la pantalla y en la maqueta", nubes: "se nubla la pantalla", lluvia: "llueve en la pantalla y en la maqueta", tormenta: "tormenta con rayos en la pantalla y en la maqueta"};
  const clima = {tipo: "sol", temp: null, dia: true, real: null, forzado: null, ok: false};
  const tipoDe = c => c >= 95 ? "tormenta" : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || (c >= 71 && c <= 77) || c === 85 || c === 86 ? "lluvia" : c >= 2 ? "nubes" : "sol";
  const hora = () => new Intl.DateTimeFormat("es-ES", {hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid"}).format(new Date());
  const regla = document.getElementById("creel-clima-regla"), botones = [...document.querySelectorAll("[data-clima]")];
  const capa = document.getElementById("creel-lluvia"), g = capa && capa.getContext("2d"), viewer = capa && capa.closest(".viewer");

  function aplica() {
    clima.tipo = clima.forzado || clima.real || "sol";
    const t = clima.temp == null ? "—" : `${Math.round(clima.temp)} °C`;
    if (regla) regla.textContent = `${ICONO[clima.tipo]} ${NOMBRE[clima.tipo]} · ${t} ${clima.forzado ? "(forzado)" : clima.ok ? "(real, PortAventura)" : "(sin datos)"} → ${HACE[clima.tipo]}`;
    botones.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.clima === (clima.forzado || "real"))));
    if (viewer) viewer.dataset.clima = clima.tipo;
    dispatchEvent(new CustomEvent("creel-clima", {detail: {...clima}}));
  }
  async function lee() {
    try {
      const r = await fetch(URL_CLIMA, {cache: "no-store"}); if (!r.ok) throw 0;
      const c = (await r.json()).current;
      clima.temp = c.temperature_2m; clima.real = tipoDe(c.weather_code); clima.dia = c.is_day !== 0; clima.codigo = c.weather_code; clima.ok = true;
    } catch (e) { clima.ok = false; }
    aplica();
  }
  botones.forEach(b => b.addEventListener("click", () => { clima.forzado = b.dataset.clima === "real" ? null : b.dataset.clima; aplica(); }));
  const f = new URLSearchParams(location.search).get("clima"); if (ICONO[f]) clima.forzado = f;

  // Lluvia/tormenta también sobre la maqueta: capa transparente encima del 3D (no captura el ratón).
  const gotas = Array.from({length: 160}, () => ({x: Math.random(), y: Math.random(), v: .6 + Math.random() * .6, l: 10 + Math.random() * 14}));
  let ultimo = 0;
  function cae(t) {
    requestAnimationFrame(cae);
    if (!g || document.hidden) return;
    const w = capa.clientWidth, h = capa.clientHeight; if (!w) return;
    if (capa.width !== w || capa.height !== h) { capa.width = w; capa.height = h; }
    const dt = Math.min(.05, (t - ultimo) / 1000 || 0); ultimo = t;
    g.clearRect(0, 0, w, h);
    const tipo = clima.tipo;
    if (tipo === "lluvia" || tipo === "tormenta") {
      g.strokeStyle = "rgba(190,215,255,.55)"; g.lineWidth = 1.3; g.beginPath();
      for (const d of gotas) { d.y = (d.y + d.v * dt) % 1; const x = d.x * w, y = d.y * h; g.moveTo(x, y); g.lineTo(x - d.l * .25, y + d.l); }
      g.stroke();
      if (tipo === "tormenta" && (t / 1000) % 4.3 < .09) { g.fillStyle = "rgba(235,240,255,.35)"; g.fillRect(0, 0, w, h); }
    }
  }
  if (g && !matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(cae);

  window.creelClima = {clima, hora, ICONO, NOMBRE, tipoDe, lee, aplica};
  aplica(); lee(); setInterval(lee, 10 * 60 * 1000);
})();
