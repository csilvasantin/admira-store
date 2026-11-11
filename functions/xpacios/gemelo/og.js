// Imagen de vista previa del gemelo (/xpacios/gemelo/og?id=gm-…): la foto o plano publicado.
// Sin foto, la tarjeta genérica. Ver ./_compartir.js.
import {ID_VALIDO, IMAGEN_GENERICA, leeLayout, imagenDeDataUrl} from './_compartir.js';

export async function onRequestGet({request}, fetchImpl = fetch) {
  const id = new URL(request.url).searchParams.get('id') || '';
  const img = ID_VALIDO.test(id) ? imagenDeDataUrl((await leeLayout('gemelo-' + id + '-foto', fetchImpl) || {}).img) : null;
  if (!img) return Response.redirect(IMAGEN_GENERICA, 302);
  return new Response(img.bytes, {headers:{'content-type':img.tipo, 'cache-control':'public, max-age=3600', 'x-content-type-options':'nosniff'}});
}
