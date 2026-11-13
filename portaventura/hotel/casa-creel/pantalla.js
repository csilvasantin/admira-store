// Pantalla de fondo del Hotel Creel (Neo, 12-nov-2026): una pantalla física de pie en el borde trasero de la base,
// parte de la escena 3D (gira y se mueve con la parrilla; la cámara no la recoloca). creel.js la pinta en WebGL
// con la textura de este lienzo. Punto de conexión: ?tv=<URL https de admira.tv> (o window.CREEL_TV) → el player
// de admira.tv va en un iframe colocado sobre esa misma cara (la textura no puede leer un iframe de otro dominio).
(() => {
  const ANCHO = 48, ALTO = 18;           // unidades de tablero (× 2,5 cm): 120 × 45 cm, todo el ancho de la base (Neo 13-nov: +20 % de alto)
  const W = 1440, H = Math.round(W * ALTO / ANCHO);
  const lienzo = document.createElement("canvas"); lienzo.width = W; lienzo.height = H;
  const g = lienzo.getContext("2d");
  // cara: quien está en la zona de la puerta manda; si no hay nadie, la figura elegida (clic en su ficha o en su pin).
  const estado = {nivel: "lejos", quien: "", cara: null, caraZona: null, caraSel: null};
  // Contenido de admira.tv en la pared (Carlos, 13-nov-2026): la playlist de la pantalla LED (hotel-creel, la del mando)
  // se reproduce en bucle detrás del título con tinte Hawkins; vídeo mudo, imágenes su tiempo; se relee cada minuto.
  // ?playlist=<pantalla> (Carlos, 14-nov-2026): la pared puede emitir la playlist de otra pantalla de admira.tv
  // (p. ej. corsair-galleon-100, el teclado del Mac Studio). Por defecto, la de la LED del hotel (hotel-creel).
  const PLAYLIST_SCREEN = (() => { const v = new URLSearchParams(location.search).get("playlist") || ""; return /^[a-z0-9][a-z0-9-]{1,79}$/.test(v) ? v : "hotel-creel"; })();
  const PLAYLIST_API = "https://admira.tv/api/playlist?screen=" + PLAYLIST_SCREEN;
  let lista = [], listaNombre = "", listaRev = null, idx = -1, media = null, mediaOk = false, mediaTimer = null;
  // Botón «📺 Pantallas» (Carlos, 13-nov-2026): emitir o parar el contenido de admira.tv en la pared. Se recuerda aquí.
  let contenidoOn = (() => { try { return localStorage.getItem("creel-contenido") !== "0"; } catch (e) { return true; } })();
  function contenido(on) {
    contenidoOn = !!on;
    try { localStorage.setItem("creel-contenido", contenidoOn ? "1" : "0"); } catch (e) {}
    if (!contenidoOn) { lista = []; listaRev = null; siguiente(); } else cargaLista();
    return contenidoOn;
  }
  function siguiente() {
    clearTimeout(mediaTimer); mediaTimer = null;
    if (media && media.tagName === "VIDEO") { try { media.pause(); media.removeAttribute("src"); media.load(); } catch (e) {} }
    media = null; mediaOk = false;
    if (!lista.length) return;
    idx = (idx + 1) % lista.length;
    const it = lista[idx], esVideo = it.assetType !== "image", el = document.createElement(esVideo ? "video" : "img");
    el.crossOrigin = "anonymous";
    if (esVideo) {
      el.muted = true; el.playsInline = true; el.preload = "auto"; el.loop = false;
      el.onended = siguiente; el.onerror = siguiente;
      el.oncanplay = () => { mediaOk = true; el.play().catch(() => {}); };
      mediaTimer = setTimeout(siguiente, (Math.max(2, Number(it.seconds) || 10) + 8) * 1000);
    } else {
      el.onload = () => { mediaOk = true; mediaTimer = setTimeout(siguiente, Math.max(2, Number(it.seconds) || 10) * 1000); };
      el.onerror = siguiente;
    }
    el.src = it.asset; media = el;
  }
  async function cargaLista() {
    if (!contenidoOn) return;
    try {
      const d = await (await fetch(PLAYLIST_API, {cache: "no-store"})).json(), dr = d && d.draft;
      if (!d || !d.ok || !dr || !Array.isArray(dr.items) || dr.rev === listaRev) return;
      listaRev = dr.rev; listaNombre = String(dr.name || "");
      const todas = dr.items.filter(i => i && /^https:\/\//.test(i.asset || "") && ["video", "image", "animation"].includes(i.assetType));
      // La pared es apaisada: si la playlist trae parejas H·V (como la del Galleon), se emiten solo las horizontales.
      const horizontales = todas.filter(i => !(i.tags || []).some(t => t === "vertical" || t === "portrait"));
      lista = horizontales.length ? horizontales : todas;
      idx = -1; siguiente();
    } catch (e) { /* sin red o sin CORS: se queda el fondo rojo */ }
  }
  cargaLista(); setInterval(cargaLista, 60000);
  function fondoContenido() {
    if (!media || !mediaOk || (media.tagName === "VIDEO" && media.readyState < 2)) return false;
    const mw = media.videoWidth || media.naturalWidth, mh = media.videoHeight || media.naturalHeight;
    if (!mw || !mh) return false;
    const k = Math.max(W / mw, H / mh), dw = mw * k, dh = mh * k;
    try { g.drawImage(media, (W - dw) / 2, (H - dh) / 2, dw, dh); } catch (e) { return false; }
    g.fillStyle = "rgba(140,11,20,.42)"; g.fillRect(0, 0, W, H); // tinte Hawkins
    return true;
  }
  // Cara del personaje que entra en la zona de la puerta (Carlos, 13-nov-2026): fotos/<slug>.jpg → lego-<slug>.webp.
  const caras = new Map();
  function cara(slug) {
    if (!slug) return null;
    if (caras.has(slug)) return caras.get(slug);
    const rutas = [`/portaventura/hotel/casa-creel/fotos/${slug}.jpg`, `/portaventura/hotel/casa-creel/fotos/lego-${slug}.webp`];
    const img = new Image(); img.decoding = "async";
    img.onerror = () => { rutas.shift(); if (rutas.length) img.src = rutas[0]; else caras.set(slug, null); };
    img.src = rutas[0]; caras.set(slug, img); return img;
  }
  function retrato(img, nombre, s) {
    // A la derecha, donde antes iba la hora (Carlos, 13-nov-2026); el nombre encima.
    const h = H * .42, w = h * .82, x = W - 26 - w, y = H * .40, r = 18;
    const marco = () => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    g.save(); g.shadowColor = "#ff2a1f"; g.shadowBlur = 34 + Math.sin(s * 3) * 10; g.fillStyle = "#1a0509"; marco(); g.fill(); g.restore();
    g.save(); marco(); g.clip();
    if (img && img.complete && img.naturalWidth) {
      const k = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
      g.drawImage(img, x + (w - iw) / 2, y, iw, ih);
    } else { g.fillStyle = "#3a0a12"; g.fillRect(x, y, w, h); g.fillStyle = "#ffb3a8"; g.font = "800 40px ui-monospace, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(nombre.toUpperCase(), x + w / 2, y + h / 2); }
    g.restore();
    g.lineWidth = 5; g.strokeStyle = "#ff3326"; marco(); g.stroke();
    // Nombre y zona a la IZQUIERDA del retrato (Carlos, 13-nov-2026): sobre el fondo, sin pisar el título ni las luces.
    g.textAlign = "right"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.shadowColor = "#ff2a1f"; g.shadowBlur = 14;
    g.font = "900 44px ui-monospace, monospace"; g.fillText(nombre.toUpperCase(), x - 26, y + h * .42);
    g.font = "700 24px ui-monospace, monospace"; g.fillStyle = "#ffd9c7"; g.fillText(estado.cara.texto || "EN LA PUERTA", x - 26, y + h * .42 + 44); g.shadowBlur = 0;
  }
  const esporas = Array.from({length: 46}, () => ({x: Math.random(), y: Math.random(), v: .02 + Math.random() * .05, r: 2 + Math.random() * 4}));
  const colores = ["#ff4a3d", "#ffd23f", "#3fd2ff", "#5dff8a", "#ff6ad5"];
  const MSG = {cerca: q => `${q.toUpperCase()} SE ACERCA…`, puerta: q => q === "Vecna" ? "VECNA ESTÁ AQUÍ · CORRE" : q === "Once" ? "ONCE PROTEGE LA CASA" : `${q.toUpperCase()} EN LA PUERTA · EL MUNDO DEL REVÉS`};

  function pinta(t = performance.now()) {
    const s = t / 1000, {nivel, quien} = estado;
    const once = quien === "Once" && nivel === "puerta", vecna = quien === "Vecna" && nivel !== "lejos";
    const rayo = !once && (nivel === "puerta" ? (s % 1.4) < .08 : (s % 7) < .12);
    const fondo = g.createRadialGradient(W / 2, H * 1.15, 10, W / 2, H * 1.15, W * .75);
    const c = once ? ["#7ad8ff", "#1d4f8a", "#06122e"] : vecna ? ["#cf2549", "#6b1041", "#150b27"] : nivel === "puerta" ? ["#ff6a5c", "#c3101f", "#3a0410"] : ["#ff3b2f", "#8c0b14", "#2a0308"];
    fondo.addColorStop(0, c[0]); fondo.addColorStop(.35, c[1]); fondo.addColorStop(1, c[2]);
    g.fillStyle = fondo; g.fillRect(0, 0, W, H);
    const conContenido = fondoContenido();
    if (rayo) { g.fillStyle = "rgba(255,240,240,.35)"; g.fillRect(0, 0, W, H); }
    cielo(s);
    g.fillStyle = "rgba(243,230,255,.75)";
    for (const e of esporas) { const y = ((e.y - s * e.v) % 1 + 1) % 1; g.beginPath(); g.arc(e.x * W + Math.sin(s + e.y * 9) * 12, y * H, e.r, 0, 7); g.fill(); }
    // Título y subtítulo más arriba (Carlos, 13-nov-2026): dejan sitio al retrato y a la HUD.
    g.save(); g.translate(W / 2, H * .165); if (nivel === "puerta" && !once) g.scale(1, -1);
    g.font = "900 128px Georgia, 'Times New Roman', serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = once ? "#3fd2ff" : "#ff2a1f"; g.shadowBlur = 30; g.lineWidth = 4; g.strokeStyle = once ? "#9be3ff" : "#ff3326";
    g.strokeText("STRANGER THINGS", 0, 0); g.restore();
    g.font = "700 28px ui-monospace, monospace"; g.textAlign = "center"; g.fillStyle = "#ffb3a8"; g.shadowBlur = 0;
    g.fillText("H A W K I N S   ·   H O T E L   C R E E L", W / 2, H * .365); // un 10 % más abajo (Carlos, 13-nov-2026)
    if (estado.cara) retrato(cara(estado.cara.slug), estado.cara.quien, s);
    if (nivel !== "lejos") { g.font = "800 46px ui-monospace, monospace"; g.fillStyle = "#fff"; g.shadowColor = "#ff2a1f"; g.shadowBlur = 16; g.fillText(MSG[nivel](quien), W / 2, H * .72); g.shadowBlur = 0; }
    // Luces A–Z en la franja superior (Carlos, 13-nov-2026). Con un personaje elegido se encienden fijas las letras de su
    // nombre (como las luces de Joyce) y las demás quedan apagadas; sin nadie, el parpadeo de siempre al ritmo de la presencia.
    const paso = nivel === "puerta" ? .25 : nivel === "cerca" ? .6 : 3;
    const nombre = estado.cara ? estado.cara.quien.toUpperCase().normalize("NFD").replace(/[^A-Z]/g, "") : "";
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l, i) => {
      const x = W * .05 + i * (W * .9 / 25), y = H * .026, on = nombre ? nombre.includes(l) : ((s + i * .37) % paso) / paso < .7;
      g.globalAlpha = on ? 1 : nombre ? .12 : .18; g.fillStyle = colores[i % 5]; g.shadowColor = colores[i % 5]; g.shadowBlur = on ? (nombre ? 26 : 18) : 0;
      g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = "#1a0a0a"; g.font = "700 13px Georgia, serif"; g.textAlign = "center"; g.fillText(l, x, y + 4.5); g.globalAlpha = 1;
    });
    g.font = "18px ui-monospace, monospace"; g.textAlign = "right"; g.fillStyle = "rgba(255,255,255,.45)"; g.fillText(conContenido && lista[idx] ? "admira.tv · " + String(lista[idx].title || listaNombre).slice(0, 60) : "admira.tv · sin señal", W - 16, H - 12);
    hud();
    return lienzo;
  }

  // Clima real (clima.js, 13-nov-2026): IF sol/nubes/lluvia/tormenta THEN la pantalla lo pinta, con temperatura y hora.
  const gotas = Array.from({length: 220}, () => ({x: Math.random(), y: Math.random(), v: .5 + Math.random() * .7, l: 18 + Math.random() * 26}));
  function cielo(s) {
    const C = window.creelClima && window.creelClima.clima; if (!C || !C.activo) return;
    const tipo = C.tipo;
    if (tipo === "sol") {
      // El Sol va fuera, en 3D sobre la pantalla (sol.js, Neo 13-nov-2026); aquí solo su luz cálida.
      const luz = g.createRadialGradient(W / 2, -H * .2, 10, W / 2, -H * .2, W * .7); luz.addColorStop(0, "rgba(255,214,92,.6)"); luz.addColorStop(.4, "rgba(255,150,40,.22)"); luz.addColorStop(1, "rgba(255,120,0,0)");
      g.fillStyle = luz; g.fillRect(0, 0, W, H);
    } else {
      g.fillStyle = tipo === "nubes" ? "rgba(70,70,85,.45)" : tipo === "lluvia" ? "rgba(20,35,70,.55)" : "rgba(10,10,30,.68)"; g.fillRect(0, 0, W, H);
      g.fillStyle = tipo === "nubes" ? "rgba(200,200,215,.55)" : "rgba(90,95,120,.75)";
      for (let i = 0; i < 6; i++) { const x = ((i * .19 + s * .01) % 1.2 - .1) * W, y = H * (.12 + (i % 2) * .08); for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + k * 46, y + (k % 2) * 12, 44, 0, 7); g.fill(); } }
      if (tipo !== "nubes") {
        g.strokeStyle = "rgba(190,215,255,.6)"; g.lineWidth = 2.2; g.beginPath();
        for (const d of gotas) { const y = ((d.y + s * d.v) % 1) * H, x = d.x * W; g.moveTo(x, y); g.lineTo(x - d.l * .3, y + d.l); }
        g.stroke();
      }
      if (tipo === "tormenta" && (s % 3.1) < .14) {
        g.fillStyle = "rgba(230,235,255,.45)"; g.fillRect(0, 0, W, H);
        let x = W * (.3 + ((Math.floor(s / 3.1) * .37) % .5)), y = 0; g.strokeStyle = "#f4f6ff"; g.lineWidth = 6; g.shadowColor = "#9fb4ff"; g.shadowBlur = 24; g.beginPath(); g.moveTo(x, y);
        while (y < H * .8) { x += (Math.sin(y * 7.3 + s) * 38); y += 34; g.lineTo(x, y); } g.stroke(); g.shadowBlur = 0;
      }
    }
  }
  function hud() {
    const K = window.creelClima; if (!K) return;
    const C = K.clima, t = C.temp == null ? "— °C" : `${Math.round(C.temp)} °C`;
    // Temperatura y, a su derecha, la hora; más pequeño (Carlos, 13-nov-2026). El icono y el nombre del clima, solo si está elegido.
    const hora = window.creelSol ? window.creelSol.etiqueta() : K.hora();
    g.save(); g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 10; g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "top";
    g.font = "800 40px ui-monospace, monospace";
    const linea = `${C.activo ? K.ICONO[C.tipo] + " " : ""}${t}`; g.fillText(linea, 26, H * .44);
    g.fillStyle = "#ffd9c7"; g.fillText(hora, 26 + g.measureText(linea).width + 30, H * .44);
    g.font = "600 16px ui-monospace, monospace"; g.fillStyle = "rgba(255,255,255,.75)";
    g.fillText(`PORTAVENTURA${C.activo ? " · " + K.NOMBRE[C.tipo].toUpperCase() : ""}${C.activo && C.forzado ? " · FORZADO" : C.prevision ? " · PREVISIÓN" : C.ok ? " · EN DIRECTO" : ""}`, 28, H * .44 + 50);
    g.restore();
  }

  // Conexión a admira.tv: iframe sobre la cara de la pantalla (misma posición 3D que la textura).
  let tv = null;
  // Botón «Conectar admira.tv» (Neo 13-nov-2026): la URL se guarda en este navegador (localStorage creel-tv).
  const valida = v => { try { const u = new URL(v); return u.protocol === "https:" && /(^|\.)admira\.tv$/.test(u.hostname) ? u.href : null; } catch (e) { return null; } };
  // La pantalla es la PARED de la escena (Carlos, 13-nov-2026): pinta ella misma el contenido de admira.tv en su textura
  // 3D, así el hotel y los personajes quedan delante y nada la atraviesa. El iframe (Conectar admira.tv) queda como
  // opción manual: al estar por encima del lienzo, tapa lo que tenga delante.
  const guardada = () => { try { const v = localStorage.getItem("creel-tv") || ""; return v === "off" ? "" : v; } catch (e) { return ""; } };
  tv = valida(new URLSearchParams(location.search).get("tv") || window.CREEL_TV || guardada());
  const forma = document.getElementById("creel-tv"), campo = document.getElementById("creel-tv-url"), aviso = document.getElementById("creel-tv-estado"), off = document.getElementById("creel-tv-off");
  if (campo && tv) campo.value = tv;
  if (aviso) aviso.textContent = tv ? "Conectada a admira.tv · " + tv.replace("https://", "") : "Playlist hotel-creel de admira.tv en la pared";
  if (off) off.hidden = !tv;
  if (forma) forma.addEventListener("submit", e => {
    e.preventDefault(); const u = valida(campo.value.trim());
    if (!u) { aviso.textContent = "Pon una URL https de admira.tv"; return; }
    try { localStorage.setItem("creel-tv", u); } catch (er) {}
    const q = new URLSearchParams(location.search); q.delete("tv"); location.search = q.toString();
  });
  if (off) off.addEventListener("click", () => { try { localStorage.removeItem("creel-tv"); } catch (er) {} const q = new URLSearchParams(location.search); q.delete("tv"); location.search = q.toString(); });
  const el = document.getElementById("creel-pantalla");
  if (el) { el.replaceChildren(); el.hidden = true; }
  if (tv && el) {
    const f = document.createElement("iframe"); f.src = tv; f.title = "admira.tv · pantalla del Hotel Creel"; f.allow = "autoplay; fullscreen"; f.tabIndex = -1;
    el.append(f); el.dataset.fuente = "admira.tv";
    addEventListener("creel-camara", ({detail: k}) => {
      const v = el.parentElement.getBoundingClientRect(); if (!v.width) return;
      const P = (x, y, z) => [(.5 + (x * k.cx - z * k.sx) * k.zoom / k.aspect * .5) * v.width, (.5 - (-x * k.sx * k.sy + (y + k.suelo - k.center) * k.cy - z * k.cx * k.sy) * k.zoom * .5) * v.height];
      const p0 = P(-ANCHO / 2, ALTO, -k.bz), p1 = P(ANCHO / 2, ALTO, -k.bz), p2 = P(-ANCHO / 2, 0, -k.bz);
      el.style.height = H + "px"; el.style.width = W + "px";
      el.style.transform = `matrix(${(p1[0]-p0[0])/W},${(p1[1]-p0[1])/W},${(p2[0]-p0[0])/H},${(p2[1]-p0[1])/H},${p0[0]},${p0[1]})`;
      el.hidden = false;
    });
  }
  const eligeCara = () => { estado.cara = estado.caraZona || estado.caraSel; if (estado.cara) cara(estado.cara.slug); };
  const fotoDe = slug => slug ? location.origin + "/portaventura/hotel/casa-creel/fotos/lego-" + slug + ".webp" : "";
  addEventListener("creel-personaje", ({detail: d}) => {
    estado.caraSel = d.id >= 0 ? {slug: d.slug, quien: d.quien, texto: String(d.zona || "").toUpperCase()} : null; eligeCara();
    const f = el && el.querySelector("iframe"); if (f) try { f.contentWindow.postMessage({type: "creel-personaje", id: d.id, quien: d.quien, slug: d.slug, zona: d.zona, foto: fotoDe(d.slug)}, new URL(tv).origin); } catch (e) {}
  });
  addEventListener("creel-zona", ({detail: d}) => {
    estado.caraZona = d.id >= 0 ? {slug: d.slug, quien: d.quien, texto: "EN LA PUERTA"} : null; eligeCara();
    const f = el && el.querySelector("iframe"); if (f) try { f.contentWindow.postMessage({type: "creel-zona", id: d.id, quien: d.quien, slug: d.slug, dentro: d.dentro, foto: fotoDe(d.slug)}, new URL(tv).origin); } catch (e) {}
  });
  addEventListener("creel-presencia", ({detail: d}) => {
    estado.nivel = d.nivel; estado.quien = d.quien;
    const f = el && el.querySelector("iframe"); if (f) try { f.contentWindow.postMessage({type: "creel-presencia", ...d}, new URL(tv).origin); } catch (e) {}
  });
  window.creelPantalla = {ANCHO, ALTO, lienzo, pinta, estado, tv: !!tv, contenido, get contenidoOn() { return contenidoOn; }};
})();
