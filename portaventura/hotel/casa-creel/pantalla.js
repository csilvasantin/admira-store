// Pantalla de fondo de la Casa Creel (Neo, 12-nov-2026): detrás de la maqueta, se conectará a admira.tv.
// Punto de conexión: ?tv=<URL de admira.tv> (o window.CREEL_TV) → la pantalla carga ese player en un iframe.
// Sin señal: fondo propio de Stranger Things (cielo rojo del Mundo del Revés, esporas y luces del alfabeto).
(() => {
  const el = document.getElementById("creel-pantalla"); if (!el) return;
  // Pantalla física de pie al final de la base, centrada detrás del hotel y de cara al espectador (Neo, 12-nov-2026). La vista es ortográfica, así que basta una transformación afín.
  const W = 1200, ALTO = 15, LARGO = 40; // px del lienzo · alto y ancho en unidades de tablero (≈ 37 × 100 cm)
  addEventListener("creel-camara", ({detail:k}) => {
    const v = el.parentElement.getBoundingClientRect(); if (!v.width) return;
    const P = (x, y, z) => [(.5 + (x * k.cx - z * k.sx) * k.zoom / k.aspect * .5) * v.width,
                            (.5 - (-x * k.sx * k.sy + (y - k.center) * k.cy - z * k.cx * k.sy) * k.zoom * .5) * v.height];
    // Siempre centrada detrás del hotel según el espectador: frente a la cámara, al final de la base.
    const casa = (window.creelScene && creelScene.house) || {x:0, z:0};
    const dx = -k.sx, dz = -k.cx; // dirección que se aleja de la cámara, en el suelo
    const t = Math.min(dx ? ((dx > 0 ? k.bx : -k.bx) - casa.x) / dx : Infinity, dz ? ((dz > 0 ? k.bz : -k.bz) - casa.z) / dz : Infinity);
    const c = [casa.x + dx * t, casa.z + dz * t], L = LARGO / 2;
    let a = [c[0] - k.cx * L, c[1] + k.sx * L], b = [c[0] + k.cx * L, c[1] - k.sx * L];
    if (P(a[0], 0, a[1])[0] > P(b[0], 0, b[1])[0]) [a, b] = [b, a];
    const H = Math.round(W * ALTO / LARGO);
    const p0 = P(a[0], ALTO, a[1]), p1 = P(b[0], ALTO, b[1]), p2 = P(a[0], 0, a[1]);
    el.style.height = H + "px";
    el.style.transform = `matrix(${(p1[0]-p0[0])/W},${(p1[1]-p0[1])/W},${(p2[0]-p0[0])/H},${(p2[1]-p0[1])/H},${p0[0]},${p0[1]})`;
    el.hidden = false;
  });
  const pedida = new URLSearchParams(location.search).get("tv") || window.CREEL_TV || "";
  let tv = null;
  try { const u = new URL(pedida); if (u.protocol === "https:" && /(^|\.)admira\.tv$/.test(u.hostname)) tv = u.href; } catch (e) {}
  if (tv) {
    const f = document.createElement("iframe");
    f.src = tv; f.title = "admira.tv · pantalla de la Casa Creel"; f.allow = "autoplay; fullscreen"; f.tabIndex = -1;
    el.replaceChildren(f); el.dataset.fuente = "admira.tv";
    addEventListener("creel-presencia", ({detail:d}) => { el.dataset.nivel = d.nivel; try { f.contentWindow.postMessage({type:"creel-presencia", ...d}, new URL(tv).origin); } catch (e) {} });
    return;
  }
  // Lo que pasa en la pantalla según quién se acerca a la casa (personaje arrastrado hoy; la cámara mañana).
  const MSG = {cerca: q => `${q.toUpperCase()} SE ACERCA…`, puerta: q => q === "Vecna" ? "VECNA ESTÁ AQUÍ · CORRE" : q === "Once" ? "ONCE PROTEGE LA CASA" : `${q.toUpperCase()} EN LA PUERTA · EL MUNDO DEL REVÉS`};
  addEventListener("creel-presencia", ({detail:d}) => {
    el.dataset.nivel = d.nivel; el.dataset.quien = d.quien;
    const m = el.querySelector(".cp-msg"); if (m) m.textContent = d.nivel === "lejos" ? "" : MSG[d.nivel](d.quien);
  });
  el.dataset.fuente = "fondo";
  const esporas = el.querySelector(".cp-esporas");
  for (let i = 0; i < 38; i++) {
    const s = document.createElement("i");
    s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${(-Math.random() * 14).toFixed(1)}s;animation-duration:${(9 + Math.random() * 10).toFixed(1)}s;transform:scale(${(.4 + Math.random()).toFixed(2)})`;
    esporas.appendChild(s);
  }
  const luces = el.querySelector(".cp-luces"), colores = ["#ff4a3d", "#ffd23f", "#3fd2ff", "#5dff8a", "#ff6ad5"];
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l, i) => { const b = document.createElement("b"); b.textContent = l; b.style.setProperty("--c", colores[i % colores.length]); b.style.animationDelay = (i * .37 % 3).toFixed(2) + "s"; luces.appendChild(b); });
})();
