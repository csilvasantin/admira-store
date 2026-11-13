// Foto del personaje al pasar el ratón (Neo, 13-nov-2026), en el menú y en la maqueta.
// Las fotos van en /portaventura/hotel/casa-creel/fotos/<slug>.jpg (ver fotos/LEEME.md): solo imágenes con licencia
// (material de prensa oficial o Wikimedia Commons con su atribución). Si falta la foto, se ve la ficha ilustrada.
(() => {
  if (typeof creelScene === "undefined") return;
  const BASE = "/portaventura/hotel/casa-creel/fotos/";
  const ACTOR = {Will: "Noah Schnapp", Mike: "Finn Wolfhard", Lucas: "Caleb McLaughlin", Dustin: "Gaten Matarazzo", Nancy: "Natalia Dyer", Jonathan: "Charlie Heaton", Steve: "Joe Keery", Robin: "Maya Hawke", Holly: "Nell Fisher", Max: "Sadie Sink", Vecna: "Jamie Campbell Bower", Once: "Millie Bobby Brown"};
  const slug = n => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dialogo = document.getElementById("creel-dialog") || document.body;
  const tarjeta = document.createElement("figure"); tarjeta.className = "creel-foto"; tarjeta.hidden = true; tarjeta.setAttribute("aria-hidden", "true");
  tarjeta.innerHTML = `<div class="cf-img"><img alt=""><div class="cf-ilustra"></div></div><figcaption><b></b><span></span><small></small></figcaption>`;
  dialogo.append(tarjeta);
  const img = tarjeta.querySelector("img"), ilustra = tarjeta.querySelector(".cf-ilustra"), [nom, actor, zona] = tarjeta.querySelectorAll("b,span,small");
  let actual = null;
  function muestra(a, x, y) {
    if (actual !== a.id) {
      actual = a.id;
      nom.textContent = `${a.id + 1} · ${a.name}`; actor.textContent = ACTOR[a.name] ? `Interpretado por ${ACTOR[a.name]}` : ""; zona.textContent = `${a.zone} · ${a.cell}`;
      const ficha = document.querySelectorAll("#creel-cast .creel-ficha svg")[a.id];
      ilustra.innerHTML = ficha ? ficha.outerHTML : ""; tarjeta.classList.remove("con-foto");
      img.onload = () => { if (actual === a.id) tarjeta.classList.add("con-foto"); };
      img.onerror = () => tarjeta.classList.remove("con-foto");
      img.src = BASE + slug(a.name) + ".jpg";
    }
    tarjeta.hidden = false;
    const w = 200, h = tarjeta.offsetHeight || 290, X = x + 18 + w > innerWidth ? x - w - 18 : x + 18, Y = Math.max(8, Math.min(innerHeight - h - 8, y - h / 2));
    tarjeta.style.left = X + "px"; tarjeta.style.top = Y + "px";
  }
  const oculta = () => { tarjeta.hidden = true; };
  function engancha(el, a) {
    el.removeAttribute("title");
    el.addEventListener("pointerenter", e => muestra(a, e.clientX, e.clientY));
    el.addEventListener("pointermove", e => { if (!tarjeta.hidden) muestra(a, e.clientX, e.clientY); });
    el.addEventListener("pointerleave", oculta);
    el.addEventListener("pointerdown", oculta);
    el.addEventListener("focus", () => { const r = el.getBoundingClientRect(); muestra(a, r.right, r.top + r.height / 2); });
    el.addEventListener("blur", oculta);
  }
  const cast = creelScene.cast;
  document.querySelectorAll("#creel-pins .creel-pin:not(.creel-casa)").forEach((el, i) => cast[i] && engancha(el, cast[i]));
  document.querySelectorAll("#creel-cast .creel-ficha").forEach((el, i) => cast[i] && engancha(el, cast[i]));
  window.creelFotos = {slug, ACTOR, BASE};
})();
