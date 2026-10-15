// El iPad del local con la gestión de colas (Carlos, 16-oct-2026: «la gestión de colas en el ipad, que sea un
// clon del Paseo de Gracia»). Usa el gestor del iPad de Paseo de Gràcia 103 (/admira-xp/scripts/ipad-cola.js,
// window.XpaceIpadCola): la misma sala de admira.tv/gestorColas, sus pedidos y, al tocarlo, el mismo gestor de
// colas (pantalla del iPad + control de barra). Aquí el iPad es vertical: se pinta la cola en vertical.
export const ANCHO = 720, ALTO = 1280;
const nombre = p => String((p && (p.nombre || p.name)) || '').replace(/[^\p{L} '\-]/gu, '').trim().slice(0, 14);
const numero = p => String((p && (p.numero || p.number)) ?? '');

export function crearColaIPad({ doc = document, cola = () => globalThis.XpaceIpadCola } = {}) {
  const lienzo = doc.createElement('canvas'); lienzo.width = ANCHO; lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d');
  function lista(titulo, pedidos, y, color) {
    ctx.fillStyle = color; ctx.font = '800 44px system-ui, sans-serif'; ctx.fillText(titulo, 48, y);
    ctx.font = '700 52px system-ui, sans-serif'; ctx.fillStyle = '#ffffff';
    (pedidos.length ? pedidos.slice(0, 5) : [null]).forEach((p, n) => {
      ctx.fillText(p ? `${numero(p)}  ${nombre(p)}`.trim() : '—', 64, y + 78 + n * 70);
    });
  }
  function pintar() {
    const c = cola(), d = (c && c.data && c.data()) || null;
    ctx.fillStyle = '#1E3932'; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = '#0f2620'; ctx.fillRect(0, 0, ANCHO, 120);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.font = '800 46px system-ui, sans-serif';
    ctx.fillText('☁️ ADMIRITO · COLA', 40, 62);
    ctx.textBaseline = 'alphabetic';
    const hay = d && ['recibido', 'preparando', 'listo'].some(k => Array.isArray(d[k]) && d[k].length);
    if (hay) {
      lista('¡Listo para recoger!', d.listo || [], 230, '#9dffd6');
      lista('En preparación', [...(d.preparando || []), ...(d.recibido || [])], 720, '#ffcf7a');
    } else {
      ctx.textAlign = 'center'; ctx.font = '160px system-ui, sans-serif'; ctx.fillText('☁️', ANCHO / 2, 520);
      ctx.fillStyle = '#ffffff'; ctx.font = '700 52px system-ui, sans-serif';
      ['Pide en el quiosco', 'y te llamo', 'por tu nombre'].forEach((l, n) => ctx.fillText(l, ANCHO / 2, 720 + n * 70));
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#d7f5e3'; ctx.font = '500 30px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(c ? 'Toca para abrir el gestor de colas' : 'Gestor de colas no disponible', ANCHO / 2, ALTO - 50);
    ctx.textAlign = 'left';
  }
  pintar();
  return { lienzo, pintar, abrir() { const c = cola(); if (c && c.open) { c.open(); return true; } return false; }, get pedidos() { const d = cola()?.data?.(); return d ? ['recibido', 'preparando', 'listo'].reduce((n, k) => n + ((d[k] || []).length), 0) : 0; } };
}
