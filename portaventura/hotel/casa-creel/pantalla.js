// Pantalla de fondo de la Casa Creel (Neo, 12-nov-2026): detrás de la maqueta, se conectará a admira.tv.
// Punto de conexión: ?tv=<URL de admira.tv> (o window.CREEL_TV) → la pantalla carga ese player en un iframe.
// Sin señal: fondo propio de Stranger Things (cielo rojo del Mundo del Revés, esporas y luces del alfabeto).
(() => {
  const el = document.getElementById("creel-pantalla"); if (!el) return;
  const pedida = new URLSearchParams(location.search).get("tv") || window.CREEL_TV || "";
  let tv = null;
  try { const u = new URL(pedida); if (u.protocol === "https:" && /(^|\.)admira\.tv$/.test(u.hostname)) tv = u.href; } catch (e) {}
  if (tv) {
    const f = document.createElement("iframe");
    f.src = tv; f.title = "admira.tv · pantalla de la Casa Creel"; f.allow = "autoplay; fullscreen"; f.tabIndex = -1;
    el.replaceChildren(f); el.dataset.fuente = "admira.tv"; return;
  }
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
