// El quiosco de pedidos de la pared de Diagonal (Carlos, 16-oct-2026: «poner en esa pared otro kiosko interactivo
// como el de Paseo de Gracia para hacer los pedidos»). Es el mismo quiosco de ainimation.studio que el tótem del
// gemelo de Paseo de Gràcia (/admira-xp/scripts/totem-kiosko.js), con la sala del local: sus pedidos van a la cola
// de ese local en admira.tv/gestorColas y salen en su iPad. En la foto 360 se ve su pantalla de bienvenida y, al
// tocarla, el quiosco se abre en grande. Pago simulado: no se cobra nada.
export const ANCHO = 720, ALTO = 1280;
export const ORIGEN = 'https://www.ainimation.studio';
const BASE = ORIGEN + '/xperiencias/kiosko-pedido/';

export function urlKiosko({ sala, marca = 'starbucks', lang = 'es' } = {}) {
  const u = new URL(BASE);
  u.searchParams.set('store', sala); u.searchParams.set('marca', marca); u.searchParams.set('lang', lang);
  u.searchParams.set('host', 'gemelo'); u.searchParams.set('formato', 'vertical'); u.searchParams.set('w', '1080'); u.searchParams.set('h', '1920');
  return u.href;
}

// El aviso de pedido del quiosco al anfitrión (contrato del README del quiosco): solo de su origen y de su iframe.
export function pedidoDe(e, ventana) {
  const d = e && e.data;
  if (!e || !/^https:\/\/(www\.)?ainimation\.studio$/.test(e.origin) || (ventana && e.source !== ventana)) return null;
  if (!d || d.source !== 'ainimation-xperiencia' || d.event !== 'order' || !d.order) return null;
  return d.order;
}

function redondo(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function crearKiosko({ doc = document, sala, marca = 'starbucks', alPedido = null } = {}) {
  const lienzo = doc.createElement('canvas'); lienzo.width = ANCHO; lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d');
  // La bienvenida del quiosco, como la de Paseo de Gràcia: marca, vaso, «Pide aquí, sin colas» y el botón.
  function pintar() {
    const W = ANCHO, H = ALTO, c = W / 2;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1E3932'; redondo(ctx, 18, 18, W - 36, H - 36, 26); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff'; ctx.font = '800 46px system-ui, sans-serif'; ctx.fillText('S T A R B U C K S', c, 250);
    ctx.fillStyle = '#ffffff'; redondo(ctx, c - 190, 300, 380, 380, 60); ctx.fill();
    ctx.strokeStyle = '#2e7d5b'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c - 32, 410); ctx.lineTo(c - 18, 330); ctx.stroke();
    ctx.fillStyle = '#d6b89c'; ctx.strokeStyle = '#cfcfcf'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(c - 92, 470); ctx.lineTo(c + 92, 470); ctx.lineTo(c + 76, 640); ctx.lineTo(c - 76, 640); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(c, 420, 104, 26, 0, 0, Math.PI * 2); ctx.fillStyle = '#f4f4f4'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 76px system-ui, sans-serif'; ctx.fillText('Pide aquí,', c, 820); ctx.fillText('sin colas', c, 905);
    ctx.fillStyle = '#d7f5e3'; ctx.font = '500 38px system-ui, sans-serif'; ctx.fillText('Toca la pantalla para empezar', c, 975);
    ctx.fillStyle = '#00704A'; redondo(ctx, c - 230, 1030, 460, 110, 55); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 50px system-ui, sans-serif'; ctx.fillText('Toca para empezar', c, 1102);
    ctx.fillStyle = '#ffe58a'; ctx.fillRect(18, H - 88, W - 36, 52);
    ctx.fillStyle = '#4a3b00'; ctx.font = '700 24px system-ui, sans-serif'; ctx.fillText('DATOS DE EJEMPLO · demo simulada, no se cobra nada', c, H - 54);
    ctx.textAlign = 'left';
  }
  pintar();

  let modal = null, marco = null;
  const url = (lang = doc.documentElement.lang === 'en' ? 'en' : 'es') => urlKiosko({ sala, marca, lang });
  function montar() {
    if (modal) return;
    modal = doc.createElement('dialog'); modal.className = 'sc-kiosko'; modal.setAttribute('aria-label', 'Quiosco de pedidos');
    modal.innerHTML = '<div class="sc-kiosko-marco"><iframe title="Quiosco de pedidos" allow="autoplay; fullscreen"></iframe>'
      + '<button class="sc-kiosko-x" type="button" aria-label="Cerrar">✕</button>'
      + '<a class="sc-kiosko-abrir" target="_blank" rel="noopener">↗ Abrir el quiosco</a></div>';
    marco = modal.querySelector('iframe');
    modal.querySelector('.sc-kiosko-x').addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
    modal.addEventListener('cancel', e => { e.preventDefault(); cerrar(); });
    doc.body.append(modal);
    globalThis.addEventListener('message', e => { const o = pedidoDe(e, marco.contentWindow); if (o && alPedido) alPedido(o); });
  }
  function abrir() {
    montar();
    const u = url(); modal.querySelector('.sc-kiosko-abrir').href = u;
    if (marco.src !== u) marco.src = u;
    try { if (!modal.open) modal.showModal(); } catch { modal.setAttribute('open', ''); }
    return true;
  }
  function cerrar() {
    if (!modal) return;
    try { if (modal.open) modal.close(); } catch { modal.removeAttribute('open'); }
    marco.src = 'about:blank';
  }
  return { lienzo, pintar, sala, url, abrir, cerrar, get abierto() { return !!(modal && modal.open); } };
}
