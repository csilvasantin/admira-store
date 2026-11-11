// Gemelo compartible (Neo, 11-nov-2026): cada gemelo publicado tiene enlace con vista previa
// (título, descripción e imagen para WhatsApp, LinkedIn, Slack…) y se puede incrustar en un iframe.
// Los robots de vista previa no ejecutan JavaScript: por eso el servidor escribe las etiquetas.
export const API = 'https://api.admira.store';
export const ID_VALIDO = /^gm-[a-z0-9-]{1,40}$/;
export const ORIGEN = 'https://www.admira.store';
export const IMAGEN_GENERICA = 'https://www.xpaceos.com/assets/xpaceos-logo-card.jpg';
const SECTORES = {tienda:'Tienda', restaurante:'Restaurante', hotel:'Hotel', estanco:'Estanco', oficina:'Oficina', otro:'Otro'};

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export async function leeLayout(screen, fetchImpl = fetch) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), 2500) : null;
  try {
    const r = await fetchImpl(`${API}/layout/current?screen=${encodeURIComponent(screen)}`, {cache:'no-store', signal:ctl && ctl.signal});
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.current || null;
  } catch (_) { return null; } finally { if (t) clearTimeout(t); }
}

// Datos de la ficha del gemelo para las etiquetas de vista previa.
export function ficha(id, g) {
  const items = Array.isArray(g && g.items) ? g.items : [];
  const pant = items.filter((i) => ['pantalla', 'videowall', 'totem'].includes(i && i.t)).length;
  const nombre = String(g && g.nombre || 'Gemelo digital').slice(0, 80);
  const lugar = [g && g.ciudad, SECTORES[g && g.sector]].filter(Boolean).join(' · ');
  const conFoto = Boolean(g && g.fondo && g.fondo.tipo && g.fondo.tipo !== 'rejilla');
  return {
    titulo: `${nombre} · Gemelo digital · admira.store`,
    descripcion: `${lugar ? lugar + ' · ' : ''}${pant} pantallas y ${items.length - pant} muebles en su sitio. Crea el tuyo en 3 pasos.`,
    url: `${ORIGEN}/xpacios/gemelo/ver/?id=${encodeURIComponent(id)}`,
    imagen: conFoto ? `${ORIGEN}/xpacios/gemelo/og?id=${encodeURIComponent(id)}` : IMAGEN_GENERICA,
  };
}

export function etiquetas(f) {
  return [
    `<meta name="description" content="${esc(f.descripcion)}">`,
    `<link rel="canonical" href="${esc(f.url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="admira.store">`,
    `<meta property="og:title" content="${esc(f.titulo)}">`,
    `<meta property="og:description" content="${esc(f.descripcion)}">`,
    `<meta property="og:url" content="${esc(f.url)}">`,
    `<meta property="og:image" content="${esc(f.imagen)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(f.titulo)}">`,
    `<meta name="twitter:description" content="${esc(f.descripcion)}">`,
    `<meta name="twitter:image" content="${esc(f.imagen)}">`,
  ].join('\n');
}

// Sustituye <title> y la descripción genérica por los del gemelo.
export function conEtiquetas(html, f) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(f.titulo)}</title>`)
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace(/<\/head>/i, `${etiquetas(f)}\n</head>`);
}

// data:image/jpeg;base64,… → bytes. Solo JPEG, PNG o WebP.
export function imagenDeDataUrl(s) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''));
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return {tipo:m[1], bytes};
}
