// El iPad del local con la gestión de colas (Carlos, 16-oct-2026: «la gestión de colas en el ipad, que sea un
// clon del Paseo de Gracia»). Usa el gestor del iPad de Paseo de Gràcia 103 (/admira-xp/scripts/ipad-cola.js,
// window.XpaceIpadCola): la misma sala de admira.tv/gestorColas, sus pedidos y, al tocarlo, el mismo gestor de
// colas (pantalla del iPad + control de barra). En Diagonal el iPad es vertical y en Paseo de Gràcia, horizontal.
// Cada local tiene su sala (Carlos, 16-oct-2026: «pide una cola propia para Diagonal»): `sala` la fija en el gestor.
export const ANCHO = 720, ALTO = 1280;
const nombre = p => String((p && (p.nombre || p.name)) || '').replace(/[^\p{L} '\-]/gu, '').trim().slice(0, 14);
const numero = p => String((p && (p.numero || p.number)) ?? '');

export function crearColaIPad({ doc = document, cola: gestor = () => globalThis.XpaceIpadCola, horizontal = false, sala = null } = {}) {
  const cola = () => { const c = gestor(); if (c && c.sala) c.sala(sala); return c; };
  const W = horizontal ? 1024 : ANCHO, H = horizontal ? 768 : ALTO;
  const lienzo = doc.createElement('canvas'); lienzo.width = W; lienzo.height = H;
  const ctx = lienzo.getContext('2d');
  function lista(titulo, pedidos, x, y, color) {
    ctx.fillStyle = color; ctx.font = '800 44px system-ui, sans-serif'; ctx.fillText(titulo, x, y);
    ctx.font = '700 52px system-ui, sans-serif'; ctx.fillStyle = '#ffffff';
    (pedidos.length ? pedidos.slice(0, 5) : [null]).forEach((p, n) => {
      ctx.fillText(p ? `${numero(p)}  ${nombre(p)}`.trim() : '—', x + 16, y + 78 + n * 70);
    });
  }
  function pintar() {
    const c = cola(), d = (c && c.data && c.data()) || null;
    ctx.fillStyle = '#1E3932'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0f2620'; ctx.fillRect(0, 0, W, 120);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.font = '800 46px system-ui, sans-serif';
    ctx.fillText('☁️ ADMIRITO · COLA', 40, 62);
    ctx.textBaseline = 'alphabetic';
    const hay = d && ['recibido', 'preparando', 'listo'].some(k => Array.isArray(d[k]) && d[k].length);
    if (hay) {
      // Vertical: una lista encima de la otra; horizontal: en dos columnas, como el iPad de Paseo de Gràcia.
      lista('¡Listo para recoger!', d.listo || [], 48, 230, '#9dffd6');
      lista('En preparación', [...(d.preparando || []), ...(d.recibido || [])], horizontal ? 540 : 48, horizontal ? 230 : 720, '#ffcf7a');
    } else {
      ctx.textAlign = 'center'; ctx.font = '160px system-ui, sans-serif'; ctx.fillText('☁️', W / 2, horizontal ? 330 : 520);
      ctx.fillStyle = '#ffffff'; ctx.font = '700 52px system-ui, sans-serif';
      (horizontal ? ['Pide en el quiosco y te llamo', 'por tu nombre'] : ['Pide en el quiosco', 'y te llamo', 'por tu nombre']).forEach((l, n) => ctx.fillText(l, W / 2, (horizontal ? 480 : 720) + n * 70));
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#d7f5e3'; ctx.font = '500 30px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(c ? 'Toca para abrir el gestor de colas' : 'Gestor de colas no disponible', W / 2, H - 50);
    ctx.textAlign = 'left';
  }
  pintar();
  return { lienzo, pintar, sala, abrir() { const c = cola(); if (c && c.open) { c.open(); return true; } return false; }, get pedidos() { const d = cola()?.data?.(); return d ? ['recibido', 'preparando', 'listo'].reduce((n, k) => n + ((d[k] || []).length), 0) : 0; } };
}
