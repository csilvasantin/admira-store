// El quiosco de pedidos de la pared de Diagonal (Carlos, 16-oct-2026: «poner en esa pared otro kiosko interactivo
// como el de Paseo de Gracia para hacer los pedidos»). Es el mismo quiosco de ainimation.studio que el tótem del
// gemelo de Paseo de Gràcia (/admira-xp/scripts/totem-kiosko.js), con la sala del local: sus pedidos van a la cola
// de ese local en admira.tv/gestorColas y salen en su iPad. En la foto 360 se ve su pantalla de bienvenida y, al
// tocarla, el quiosco se abre en grande. Pago simulado: no se cobra nada.
import { hacerMovible } from './movible.mjs?v=sc-movible-2';

export const ANCHO = 720, ALTO = 1280;
export const ORIGEN = 'https://www.ainimation.studio';
const BASE = ORIGEN + '/xperiencias/kiosko-pedido/';

export function urlKiosko({ sala, marca = 'starbucks', lang = 'es' } = {}) {
  const u = new URL(BASE);
  u.searchParams.set('store', sala); u.searchParams.set('marca', marca); u.searchParams.set('lang', lang);
  u.searchParams.set('host', 'gemelo'); u.searchParams.set('formato', 'vertical'); u.searchParams.set('w', '1080'); u.searchParams.set('h', '1920');
  return u.href;
}

export function urlAprovisionamiento({ sala, clave, marca = 'starbucks', lang = 'es' } = {}) {
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(sala || '') || !/^gk_[a-f0-9]{24}$/.test(clave || '')) throw new Error('Usa la clave de quiosco de esta sala (gk_).');
  const u = new URL(urlKiosko({ sala, marca, lang }));
  // The kiosk consumes the fragment at startup, not on hashchange. A public
  // nonce forces a fresh document even when the existing iframe URL matches.
  u.searchParams.set('configurar', crypto.randomUUID());
  u.hash = new URLSearchParams({ clave }).toString();
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

  let modal = null, marco = null, movil = null;
  const url = (lang = doc.documentElement.lang === 'en' ? 'en' : 'es') => urlKiosko({ sala, marca, lang });
  function montar() {
    if (modal) return;
    modal = doc.createElement('dialog'); modal.className = 'sc-kiosko'; modal.setAttribute('aria-label', 'Quiosco de pedidos');
    modal.innerHTML = '<div class="sc-kiosko-marco"><iframe title="Quiosco de pedidos" allow="autoplay; fullscreen"></iframe>'
      + '<button class="sc-kiosko-x" type="button" aria-label="Cerrar">✕</button>'
      + '<a class="sc-kiosko-abrir" target="_blank" rel="noopener">↗ Abrir el quiosco</a>'
      + '<details class="sc-kiosko-config"><summary>Configurar quiosco / Configure kiosk</summary><form>'
      + '<p class="sc-kiosko-sala"></p><label>Clave de quiosco / Kiosk key <input type="password" autocomplete="off" spellcheck="false" required pattern="gk_[a-f0-9]{24}" aria-label="Clave de quiosco de esta sala"></label>'
      + '<button type="submit">Guardar en este quiosco / Save in this kiosk</button><p class="sc-kiosko-estado" role="status"></p></form></details></div>';
    marco = modal.querySelector('iframe');
    // Ventana como las demás (Carlos, 16-oct-2026: «mueve también el quiosco»): se arrastra por el asa de encima y cambia
    // de tamaño por la esquina, sin perder su forma vertical (9:16).
    const caja = modal.querySelector('.sc-kiosko-marco'), asa = doc.createElement('div');
    asa.className = 'sc-ventana-asa'; asa.textContent = '⠿ Quiosco de pedidos'; caja.prepend(asa);
    movil = hacerMovible(caja, asa, { clave: 'sc-kiosko-v1', proporcion: 9 / 16, arriba: 34 });
    const config = modal.querySelector('.sc-kiosko-config'), input = config.querySelector('input'), estado = config.querySelector('.sc-kiosko-estado');
    config.querySelector('.sc-kiosko-sala').textContent = `Sala / Room: ${sala}`;
    config.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      try {
        // Configure the actual embedded context: a separate top-level tab can
        // have different storage. The kiosk consumes/removes its URL fragment.
        const destino = urlAprovisionamiento({ sala, marca, lang: doc.documentElement.lang === 'en' ? 'en' : 'es', clave: input.value.trim() });
        input.value = '';
        // Keep the credential out of the parent iframe's src attribute/history.
        marco.contentWindow.location.replace(destino);
        estado.textContent = 'Configuración enviada; comprueba el pedido / Configuration sent; verify an order.';
      } catch { estado.textContent = 'No se pudo configurar. Comprueba la clave de esta sala / Unable to configure; check this room key.'; }
    });
    modal.querySelector('.sc-kiosko-x').addEventListener('click', cerrar);
    modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
    modal.addEventListener('cancel', e => { e.preventDefault(); cerrar(); });
    doc.body.append(modal);
    globalThis.addEventListener('message', e => { const o = pedidoDe(e, marco.contentWindow); if (o && alPedido) alPedido(o); });
  }
  function abrir() {
    montar();
    const u = url(); modal.querySelector('.sc-kiosko-abrir').href = u; movil.restaurar();
    if (marco.src !== u) marco.src = u;
    try { if (!modal.open) modal.showModal(); } catch { modal.setAttribute('open', ''); }
    return true;
  }
  function cerrar() {
    if (!modal) return;
    try { if (modal.open) modal.close(); } catch { modal.removeAttribute('open'); }
    marco.src = 'about:blank';
    modal.querySelector('.sc-kiosko-config input').value = '';
    modal.querySelector('.sc-kiosko-config').open = false;
  }
  return { lienzo, pintar, sala, url, abrir, cerrar, get abierto() { return !!(modal && modal.open); } };
}
