// Pantalla de fondo de la Casa Creel (Neo, 12-nov-2026): una pantalla física de pie en el borde trasero de la base,
// parte de la escena 3D (gira y se mueve con la parrilla; la cámara no la recoloca). creel.js la pinta en WebGL
// con la textura de este lienzo. Punto de conexión: ?tv=<URL https de admira.tv> (o window.CREEL_TV) → el player
// de admira.tv va en un iframe colocado sobre esa misma cara (la textura no puede leer un iframe de otro dominio).
(() => {
  const ANCHO = 44, ALTO = 15;           // unidades de tablero (× 2,5 cm): 110 × 37 cm
  const W = 1320, H = Math.round(W * ALTO / ANCHO);
  const lienzo = document.createElement("canvas"); lienzo.width = W; lienzo.height = H;
  const g = lienzo.getContext("2d");
  const estado = {nivel: "lejos", quien: ""};
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
    if (rayo) { g.fillStyle = "rgba(255,240,240,.35)"; g.fillRect(0, 0, W, H); }
    g.fillStyle = "rgba(243,230,255,.75)";
    for (const e of esporas) { const y = ((e.y - s * e.v) % 1 + 1) % 1; g.beginPath(); g.arc(e.x * W + Math.sin(s + e.y * 9) * 12, y * H, e.r, 0, 7); g.fill(); }
    g.save(); g.translate(W / 2, H * .36); if (nivel === "puerta" && !once) g.scale(1, -1);
    g.font = "900 128px Georgia, 'Times New Roman', serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = once ? "#3fd2ff" : "#ff2a1f"; g.shadowBlur = 30; g.lineWidth = 4; g.strokeStyle = once ? "#9be3ff" : "#ff3326";
    g.strokeText("STRANGER THINGS", 0, 0); g.restore();
    g.font = "700 28px ui-monospace, monospace"; g.textAlign = "center"; g.fillStyle = "#ffb3a8"; g.shadowBlur = 0;
    g.fillText("H A W K I N S   ·   C A S A   C R E E L", W / 2, H * .58);
    if (nivel !== "lejos") { g.font = "800 46px ui-monospace, monospace"; g.fillStyle = "#fff"; g.shadowColor = "#ff2a1f"; g.shadowBlur = 16; g.fillText(MSG[nivel](quien), W / 2, H * .72); g.shadowBlur = 0; }
    const paso = nivel === "puerta" ? .25 : nivel === "cerca" ? .6 : 3;
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l, i) => {
      const x = W * .05 + i * (W * .9 / 25), y = H * .88, on = ((s + i * .37) % paso) / paso < .7;
      g.globalAlpha = on ? 1 : .18; g.fillStyle = colores[i % 5]; g.shadowColor = colores[i % 5]; g.shadowBlur = on ? 18 : 0;
      g.beginPath(); g.arc(x, y, 17, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = "#1a0a0a"; g.font = "700 18px Georgia, serif"; g.fillText(l, x, y + 6); g.globalAlpha = 1;
    });
    g.font = "18px ui-monospace, monospace"; g.textAlign = "right"; g.fillStyle = "rgba(255,255,255,.45)"; g.fillText("admira.tv · sin señal", W - 16, H - 12);
    return lienzo;
  }

  // Conexión a admira.tv: iframe sobre la cara de la pantalla (misma posición 3D que la textura).
  let tv = null;
  try { const u = new URL(new URLSearchParams(location.search).get("tv") || window.CREEL_TV || ""); if (u.protocol === "https:" && /(^|\.)admira\.tv$/.test(u.hostname)) tv = u.href; } catch (e) {}
  const el = document.getElementById("creel-pantalla");
  if (el) { el.replaceChildren(); el.hidden = true; }
  if (tv && el) {
    const f = document.createElement("iframe"); f.src = tv; f.title = "admira.tv · pantalla de la Casa Creel"; f.allow = "autoplay; fullscreen"; f.tabIndex = -1;
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
  addEventListener("creel-presencia", ({detail: d}) => {
    estado.nivel = d.nivel; estado.quien = d.quien;
    const f = el && el.querySelector("iframe"); if (f) try { f.contentWindow.postMessage({type: "creel-presencia", ...d}, new URL(tv).origin); } catch (e) {}
  });
  window.creelPantalla = {ANCHO, ALTO, lienzo, pinta, estado, tv: !!tv};
})();
