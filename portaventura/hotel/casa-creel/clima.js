// Clima real de PortAventura en el Hotel Creel (Neo, 13-nov-2026). IF clima THEN la pantalla gigante (solo ella)
// lo refleja: sol, nubes, lluvia o tormenta. Datos: Open-Meteo (sin clave), PortAventura (Salou), cada 10 min.
// Los iconos ☀️ 🌧️ ⛈️ fuerzan el clima para probar; 🛰️ vuelve al real. Emite "creel-clima" {tipo, temp, real, forzado}.
(() => {
  const URL_CLIMA = "https://api.open-meteo.com/v1/forecast?latitude=41.0868&longitude=1.1548&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&forecast_days=1&timezone=Europe%2FMadrid";
  const ICONO = {sol: "☀️", nubes: "☁️", lluvia: "🌧️", tormenta: "⛈️"}, NOMBRE = {sol: "Sol", nubes: "Nubes", lluvia: "Lluvia", tormenta: "Tormenta"};
  const HACE = {sol: "sale el sol en la pantalla LED", nubes: "se nubla la pantalla LED", lluvia: "llueve en la pantalla LED", tormenta: "tormenta con rayos en la pantalla LED"};
  // activo (Carlos, 13-nov-2026): por defecto no hay clima elegido; al pulsar 🛰️/☀️/🌧️/⛈️ aparecen los datos del Sol
  // (salida, puesta y trayectoria) y el cielo en la pantalla. Sin elegir, la pantalla solo da temperatura y hora.
  const clima = {tipo: "sol", temp: null, dia: true, real: null, forzado: null, ok: false, activo: false};
  const tipoDe = c => c >= 95 ? "tormenta" : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || (c >= 71 && c <= 77) || c === 85 || c === 86 ? "lluvia" : c >= 2 ? "nubes" : "sol";
  const hora = () => new Intl.DateTimeFormat("es-ES", {hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid"}).format(new Date());
  const regla = document.getElementById("creel-clima-regla"), botones = [...document.querySelectorAll("[data-clima]")], tira = document.getElementById("creel-prevision");
  // Previsión por horas (Neo, 13-nov-2026): el slider de 24 h de sol.js elige la hora; fuera de «ahora» manda la previsión.
  let actual = null, horas = [], hSel = null;
  function eligeHora(d) {
    hSel = d && !d.vivo ? Math.floor(d.min / 60) : null;
    const x = hSel != null && horas[hSel] ? horas[hSel] : actual;
    if (x) { clima.temp = x.temp; clima.real = tipoDe(x.codigo); clima.dia = x.dia; clima.codigo = x.codigo; }
    clima.prevision = hSel != null && !!horas[hSel];
    pintaTira(); aplica();
  }
  function pintaTira() {
    if (!tira) return;
    if (!horas.length) { tira.hidden = true; return; }
    tira.hidden = false;
    const ya = hSel != null ? hSel : (window.creelSol ? Math.floor(window.creelSol.estado.min / 60) : -1);
    tira.replaceChildren(...horas.map((x, h) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "creel-prev-h" + (h === ya ? " sel" : "");
      const t = tipoDe(x.codigo); b.title = `${String(h).padStart(2, "0")}:00 · ${NOMBRE[t]} · ${Math.round(x.temp)} °C`;
      b.innerHTML = `<small>${String(h).padStart(2, "0")}</small><span>${t === "sol" && !x.dia ? "🌙" : ICONO[t]}</span><b>${Math.round(x.temp)}°</b>`;
      b.addEventListener("click", () => window.creelSol && window.creelSol.fija(h * 60 + 30, false));
      return b;
    }));
  }
  addEventListener("creel-hora", ({detail}) => eligeHora(detail));

  function aplica() {
    clima.tipo = clima.forzado || clima.real || "sol";
    const t = clima.temp == null ? "—" : `${Math.round(clima.temp)} °C`;
    const cuando = clima.prevision ? `previsión ${String(hSel).padStart(2, "0")}:00` : "real, PortAventura";
    if (regla) regla.textContent = `${ICONO[clima.tipo]} ${NOMBRE[clima.tipo]} · ${t} ${clima.forzado ? "(forzado)" : clima.ok ? `(${cuando})` : "(sin datos)"} → ${HACE[clima.tipo]}`;
    botones.forEach(b => b.setAttribute("aria-pressed", String(clima.activo && b.dataset.clima === (clima.forzado || "real"))));
    document.documentElement.classList.toggle("creel-clima-activo", clima.activo);
    dispatchEvent(new CustomEvent("creel-clima", {detail: {...clima}}));
  }
  async function lee() {
    try {
      const r = await fetch(URL_CLIMA, {cache: "no-store"}); if (!r.ok) throw 0;
      const j = await r.json(), c = j.current, hh = j.hourly || {};
      actual = {temp: c.temperature_2m, codigo: c.weather_code, dia: c.is_day !== 0};
      horas = (hh.time || []).slice(0, 24).map((_, i) => ({temp: hh.temperature_2m[i], codigo: hh.weather_code[i], dia: hh.is_day ? hh.is_day[i] !== 0 : true}));
      clima.ok = true;
    } catch (e) { clima.ok = false; }
    eligeHora(window.creelSol ? window.creelSol.estado : null);
  }
  botones.forEach(b => b.addEventListener("click", () => { clima.forzado = b.dataset.clima === "real" ? null : b.dataset.clima; clima.activo = true; aplica(); }));
  const f = new URLSearchParams(location.search).get("clima"); if (ICONO[f] || f === "real") { clima.forzado = ICONO[f] ? f : null; clima.activo = true; }

  // El clima solo afecta a la pantalla LED (Neo, 13-nov-2026): nada de lluvia ni rayos sobre la maqueta.
  window.creelClima = {clima, hora, ICONO, NOMBRE, tipoDe, lee, aplica, get horas() { return horas; }};
  aplica(); lee(); setInterval(lee, 10 * 60 * 1000);
})();
