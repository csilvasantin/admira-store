// Clima real de PortAventura en el Hotel Creel (Neo, 13-nov-2026). IF clima THEN la pantalla gigante (solo ella)
// lo refleja: sol, nubes, lluvia o tormenta. Datos: Open-Meteo (sin clave), PortAventura (Salou), cada 10 min.
// Los iconos ☀️ 🌧️ ⛈️ fuerzan el clima para probar; 🛰️ vuelve al real. Emite "creel-clima" {tipo, temp, real, forzado}.
(() => {
  const URL_CLIMA = "https://api.open-meteo.com/v1/forecast?latitude=41.0868&longitude=1.1548&current=temperature_2m,weather_code,is_day&timezone=Europe%2FMadrid";
  const ICONO = {sol: "☀️", nubes: "☁️", lluvia: "🌧️", tormenta: "⛈️"}, NOMBRE = {sol: "Sol", nubes: "Nubes", lluvia: "Lluvia", tormenta: "Tormenta"};
  const HACE = {sol: "sale el sol en la pantalla LED", nubes: "se nubla la pantalla LED", lluvia: "llueve en la pantalla LED", tormenta: "tormenta con rayos en la pantalla LED"};
  const clima = {tipo: "sol", temp: null, dia: true, real: null, forzado: null, ok: false};
  const tipoDe = c => c >= 95 ? "tormenta" : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || (c >= 71 && c <= 77) || c === 85 || c === 86 ? "lluvia" : c >= 2 ? "nubes" : "sol";
  const hora = () => new Intl.DateTimeFormat("es-ES", {hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid"}).format(new Date());
  const regla = document.getElementById("creel-clima-regla"), botones = [...document.querySelectorAll("[data-clima]")];

  function aplica() {
    clima.tipo = clima.forzado || clima.real || "sol";
    const t = clima.temp == null ? "—" : `${Math.round(clima.temp)} °C`;
    if (regla) regla.textContent = `${ICONO[clima.tipo]} ${NOMBRE[clima.tipo]} · ${t} ${clima.forzado ? "(forzado)" : clima.ok ? "(real, PortAventura)" : "(sin datos)"} → ${HACE[clima.tipo]}`;
    botones.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.clima === (clima.forzado || "real"))));
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

  // El clima solo afecta a la pantalla LED (Neo, 13-nov-2026): nada de lluvia ni rayos sobre la maqueta.
  window.creelClima = {clima, hora, ICONO, NOMBRE, tipoDe, lee, aplica};
  aplica(); lee(); setInterval(lee, 10 * 60 * 1000);
})();
