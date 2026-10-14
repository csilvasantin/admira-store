// Espejo de admira.tv en el gemelo (misión DCL-6ae9d5b0e2d48ee2fd9c7b19). Lógica pura.
//
// 1) Cada pantalla pinta lo que su pantalla real emite AHORA según /signage/now (lo publica el
//    canal de admira.tv del equipo; lo lee la ficha de admira.biz con el mismo umbral de 200 s).
//    Sin dato reciente, en standby o con error: la captura r2 de starbucks-six, y se dice.
// 2) «Reproducir en admira.tv» NUNCA abre el canal de una pantalla real. canal?screen=<real>
//    emite como ella (proof-of-play en /emit, /signage/now, mando y cola de órdenes), y el previo
//    ?rundown= tampoco es seguro: reporta caché y atiende órdenes como la pantalla guardada en el
//    navegador y, sin borrador, vuelve a la emisión normal. Sólo un player virtual
//    (virtual-<id>, dado de alta en admira.tv/virtual-players) abre el canal; si no, la portada.

export const FRESCURA_MS = 200000;                 // como renderSurfMirror de admira.biz
export const REFRESCO_MS = 20000;                  // ≥ 15 s y sólo con la pestaña visible
export const FECHA_CAPTURA = '13-oct';             // prueba de hardware r2 de starbucks-six
export const ADMIRA_TV = 'https://admira.tv/';
const VIRTUAL = /^virtual-[a-z0-9][a-z0-9-]{2,60}$/;
const TIPOS = { image: 'imagen', imagen: 'imagen', video: 'video', animation: 'video' };

// Qué pinta una pantalla con la respuesta de /xpacios/senal (o un fallo de red: respuesta null).
export function estadoSenal(respuesta, { ahora = Date.now(), captura = null } = {}) {
  const sinSenal = motivo => ({ fuente: captura ? 'captura' : 'nada', url: captura, tipo: 'imagen', motivo,
    rotulo: captura ? `${motivo} · captura del ${FECHA_CAPTURA}` : motivo });
  if (!respuesta || typeof respuesta !== 'object') return sinSenal('sin conexión con admira.tv');
  if (respuesta.standby) return sinSenal('pantalla en standby');
  const it = respuesta.item;
  if (!it || !it.url) return sinSenal('sin señal');
  const ts = Number(it.ts);
  if (Number.isFinite(ts) && ahora - ts > FRESCURA_MS) return sinSenal('sin señal reciente');
  const tipo = TIPOS[String(it.type || 'image').toLowerCase()];
  if (!tipo) return sinSenal(`emite ${it.type} (sin vista previa)`);
  let url = '';
  try { const u = new URL(String(it.url)); if (u.protocol === 'https:') url = u.href; } catch (_) {}
  if (!url) return sinSenal('asset no reproducible');
  return { fuente: 'vivo', url, tipo, id: String(it.id || ''), nombre: String(it.name || ''), startedAt: Number(it.startedAt) || null,
    motivo: '', rotulo: `en vivo${it.name ? ` · ${String(it.name).slice(0, 60)}` : ''}` };
}

// Enlace seguro a admira.tv para una pantalla del plano.
export function urlAdmiraTv(pantalla = {}) {
  const virtual = String(pantalla && pantalla.playerVirtual || '');
  if (!VIRTUAL.test(virtual)) return { url: ADMIRA_TV, canal: false };
  const u = new URL('/canal.html', ADMIRA_TV);
  for (const [k, v] of Object.entries({ screen: virtual, playerType: 'virtual', clean: 1, muted: 1, cam: 0, shot: 0, rtb: 0 })) u.searchParams.set(k, String(v));
  return { url: u.href, canal: true };
}
