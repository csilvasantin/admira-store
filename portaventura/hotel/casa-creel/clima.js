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
  // Previsión plegable (Carlos, 14-nov-2026): la tira por horas va escondida; la línea «Sale hh:mm · se pone hh:mm»
  // la despliega u oculta al pulsarla. Se recuerda en este navegador.
  const solInfo = document.getElementById("creel-sol-info");
  // Bloques CLIMA y HORA · SOL compactos (Carlos, 14-nov-2026): su rótulo despliega u oculta el resto de la fila.
  for (const bloque of document.querySelectorAll(".creel-clima, .creel-solbar")) {
    const rotulo = bloque.querySelector(".creel-clima-t"); if (!rotulo) continue;
    const clave = "creel-plegado:" + (bloque.classList.contains("creel-solbar") ? "solbar" : "clima");
    const abierto = () => { try { return localStorage.getItem(clave) === "1"; } catch (e) { return false; } };
    const pon = open => { bloque.classList.toggle("plegado", !open); rotulo.setAttribute("aria-expanded", String(open)); try { localStorage.setItem(clave, open ? "1" : "0"); } catch (e) {} };
    rotulo.setAttribute("role", "button"); rotulo.tabIndex = 0; rotulo.title = "Mostrar u ocultar";
    rotulo.addEventListener("click", () => pon(bloque.classList.contains("plegado")));
    rotulo.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pon(bloque.classList.contains("plegado")); } });
    pon(abierto());
  }
  let previsionAbierta = (() => { try { return localStorage.getItem("creel-prevision-abierta") === "1"; } catch (e) { return false; } })();
  function pliegaPrevision(open) {
    previsionAbierta = !!open;
    try { localStorage.setItem("creel-prevision-abierta", previsionAbierta ? "1" : "0"); } catch (e) {}
    if (solInfo) solInfo.setAttribute("aria-expanded", String(previsionAbierta));
    pintaTira();
  }
  if (solInfo) {
    solInfo.setAttribute("role", "button"); solInfo.tabIndex = 0; solInfo.setAttribute("aria-controls", "creel-prevision"); solInfo.setAttribute("aria-expanded", String(previsionAbierta));
    solInfo.title = "Mostrar u ocultar la previsión por horas";
    solInfo.addEventListener("click", () => pliegaPrevision(!previsionAbierta));
    solInfo.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pliegaPrevision(!previsionAbierta); } });
  }
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
    if (!horas.length || !previsionAbierta) { tira.hidden = true; return; }
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
