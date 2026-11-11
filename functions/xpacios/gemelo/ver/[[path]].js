// Visor del gemelo con vista previa al compartir. Ver ../_compartir.js.
import {ID_VALIDO, leeLayout, ficha, conEtiquetas} from '../_compartir.js';

export async function onRequestGet(context, fetchImpl = fetch) {
  const url = new URL(context.request.url);
  const res = await context.next();
  const id = url.searchParams.get('id') || '';
  if (!/^\/xpacios\/gemelo\/ver\/?$/.test(url.pathname) || !ID_VALIDO.test(id) || !res.ok ||
      !(res.headers.get('content-type') || '').includes('text/html')) return res;
  const c = await leeLayout('gemelo-' + id, fetchImpl);
  if (!c || !c.gemelo) return res;
  const html = conEtiquetas(await res.text(), ficha(id, c.gemelo));
  const out = new Response(html, res);
  out.headers.delete('content-length');
  out.headers.set('cache-control', 'public, max-age=60');
  return out;
}
