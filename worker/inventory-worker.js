/**
 * admira-inventory — Cloudflare Worker (CMDB ITIL de admira.store)
 *
 * Capa editable opcional del inventario. La fuente de verdad sigue siendo
 * assets/data/cmdb.json en el repo; este worker permite editar en caliente
 * desde inventario.html (GET/PUT) usando KV.
 *
 * Rutas:
 *   GET  /cmdb        → CMDB actual (KV si existe; si no, 204 para que el
 *                       cliente caiga al JSON del repo).
 *   PUT  /cmdb        → guarda el CMDB (requiere Authorization: Bearer <TOKEN>).
 *   GET  /health      → { ok:true }
 *
 * Bindings (wrangler.toml):
 *   [[kv_namespaces]]  binding = "CMDB_KV"
 *   [vars] o secret:   CMDB_TOKEN   (token para PUT)
 *
 * Deploy:
 *   wrangler kv namespace create CMDB_KV
 *   wrangler secret put CMDB_TOKEN
 *   wrangler deploy
 * Luego poner la URL del worker en INVENTORY_API dentro de inventario.html.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type,authorization',
};
const KEY = 'cmdb:current';

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS, ...extra },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/health') return json({ ok: true, service: 'admira-inventory' });

    if (url.pathname === '/cmdb') {
      if (request.method === 'GET') {
        const raw = env.CMDB_KV ? await env.CMDB_KV.get(KEY) : null;
        if (!raw) return new Response(null, { status: 204, headers: CORS }); // → cliente usa el repo
        return new Response(raw, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS } });
      }

      if (request.method === 'PUT') {
        const auth = request.headers.get('authorization') || '';
        const token = auth.replace(/^Bearer\s+/i, '');
        if (!env.CMDB_TOKEN || token !== env.CMDB_TOKEN) return json({ error: 'unauthorized' }, 401);
        let body;
        try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
        if (!body || !Array.isArray(body.items)) return json({ error: 'bad_schema' }, 422);
        body.meta = body.meta || {};
        body.meta.updated = new Date().toISOString().slice(0, 10);
        if (!env.CMDB_KV) return json({ error: 'no_kv_binding' }, 500);
        await env.CMDB_KV.put(KEY, JSON.stringify(body));
        return json({ ok: true, items: body.items.length, updated: body.meta.updated });
      }
      return json({ error: 'method_not_allowed' }, 405);
    }

    return json({ error: 'not_found' }, 404);
  },
};
