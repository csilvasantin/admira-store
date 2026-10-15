// Ventanas del visor de centros (Carlos, 15-oct-2026): «el modo Matrix de Diagonal tiene popups que no se pueden
// ni mover ni resizear ni cerrar». Cada panel (ficha, pantallas, reproductor) lleva una barra para arrastrarlo,
// se redimensiona por su esquina y se cierra con ×. Los cerrados vuelven desde el dock de abajo a la izquierda.
// Doble clic en la barra: el panel vuelve a su sitio. Posición, tamaño y cerrado se recuerdan en este navegador.
const CLAVE = 'sc-ventanas-v1';
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch { return {}; } };
const guardar = estado => { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento */ } };

export function montarVentanas(contenedor, paneles) {
  const estado = leer();
  let z = 20;
  const dock = document.createElement('div');
  dock.className = 'vent-dock'; dock.setAttribute('role', 'toolbar'); dock.setAttribute('aria-label', 'Paneles cerrados');
  contenedor.append(dock);

  function pintarDock() {
    dock.replaceChildren(...paneles.filter(p => p.el.classList.contains('vent-cerrada')).map(p => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'vent-abrir';
      b.textContent = '▣ ' + p.titulo; b.title = 'Abrir ' + p.titulo;
      b.addEventListener('click', () => abrir(p, true)); return b;
    }));
    dock.hidden = !dock.children.length;
  }
  const recordar = (p, cambios) => { estado[p.id] = { ...(estado[p.id] || {}), ...cambios }; guardar(estado); };
  function cerrar(p) { p.el.classList.add('vent-cerrada'); recordar(p, { cerrada: true }); pintarDock(); }
  function abrir(p, enfocar) { p.el.classList.remove('vent-cerrada'); recordar(p, { cerrada: false }); pintarDock(); delante(p); if (enfocar) p.barra.querySelector('.vent-cerrar').focus(); }
  function delante(p) { p.el.style.zIndex = String(++z); }
  function colocar(p, x, y) {
    const c = contenedor.getBoundingClientRect(), r = p.el.getBoundingClientRect();
    const nx = Math.max(0, Math.min(c.width - Math.min(r.width, 120), x)), ny = Math.max(0, Math.min(c.height - 34, y));
    Object.assign(p.el.style, { left: nx + 'px', top: ny + 'px', right: 'auto', bottom: 'auto', transform: 'none' });
    return [nx, ny];
  }
  function fijarTamano(p) { const r = p.el.getBoundingClientRect(); p.el.style.width = r.width + 'px'; }
  function restablecer(p) {
    for (const k of ['left', 'top', 'right', 'bottom', 'width', 'height', 'transform', 'maxHeight']) p.el.style[k] = '';
    estado[p.id] = { cerrada: false }; guardar(estado);
  }

  for (const p of paneles) {
    p.el.classList.add('vent');
    const barra = document.createElement('div'); barra.className = 'vent-barra';
    barra.innerHTML = '<span class="vent-asa" aria-hidden="true">⠿</span><span class="vent-titulo"></span><button type="button" class="vent-cerrar" aria-label="Cerrar">×</button>';
    barra.querySelector('.vent-titulo').textContent = p.titulo;
    barra.querySelector('.vent-cerrar').setAttribute('aria-label', 'Cerrar ' + p.titulo);
    barra.title = 'Arrastra para mover · doble clic: a su sitio';
    p.el.prepend(barra); p.barra = barra;
    barra.querySelector('.vent-cerrar').addEventListener('click', e => { e.stopPropagation(); cerrar(p); });
    barra.addEventListener('dblclick', e => { if (!e.target.closest('button')) restablecer(p); });
    let arrastre = null;
    barra.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const c = contenedor.getBoundingClientRect(), r = p.el.getBoundingClientRect();
      fijarTamano(p);
      arrastre = { dx: e.clientX - r.left, dy: e.clientY - r.top, cx: c.left, cy: c.top };
      barra.setPointerCapture(e.pointerId); delante(p); e.preventDefault();
    });
    barra.addEventListener('pointermove', e => { if (arrastre) colocar(p, e.clientX - arrastre.cx - arrastre.dx, e.clientY - arrastre.cy - arrastre.dy); });
    const soltar = () => {
      if (!arrastre) return; arrastre = null;
      recordar(p, { x: parseFloat(p.el.style.left), y: parseFloat(p.el.style.top), w: parseFloat(p.el.style.width) || null });
    };
    barra.addEventListener('pointerup', soltar); barra.addEventListener('pointercancel', soltar);
    p.el.addEventListener('pointerdown', () => delante(p));
    // Redimensionar por la esquina de abajo a la derecha (propia: también con el dedo).
    const esquina = document.createElement('span');
    esquina.className = 'vent-esquina'; esquina.title = 'Arrastra para cambiar el tamaño';
    p.el.append(esquina);
    let tam = null;
    esquina.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const r = p.el.getBoundingClientRect();
      tam = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
      esquina.setPointerCapture(e.pointerId); delante(p); e.preventDefault(); e.stopPropagation();
    });
    esquina.addEventListener('pointermove', e => {
      if (!tam) return;
      const c = contenedor.getBoundingClientRect(), r = p.el.getBoundingClientRect();
      const w = Math.max(220, Math.min(c.right - r.left, tam.w + e.clientX - tam.x)), h = Math.max(70, Math.min(c.bottom - r.top, tam.h + e.clientY - tam.y));
      Object.assign(p.el.style, { width: w + 'px', height: h + 'px', maxHeight: 'none' });
    });
    const finTam = () => { if (!tam) return; tam = null; const r = p.el.getBoundingClientRect(); recordar(p, { w: r.width, h: r.height }); };
    esquina.addEventListener('pointerup', finTam); esquina.addEventListener('pointercancel', finTam);
    const s = estado[p.id] || {};
    if (Number.isFinite(s.x) && Number.isFinite(s.y)) { if (s.w) p.el.style.width = s.w + 'px'; colocar(p, s.x, s.y); }
    if (s.h) { p.el.style.height = s.h + 'px'; p.el.style.maxHeight = 'none'; }
    if (s.cerrada) p.el.classList.add('vent-cerrada');
  }
  pintarDock();
  return { cerrar: id => { const p = paneles.find(x => x.id === id); if (p) cerrar(p); }, abrir: id => { const p = paneles.find(x => x.id === id); if (p) abrir(p); } };
}
