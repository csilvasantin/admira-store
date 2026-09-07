// XpaceScan API · worker xpacescan · scan.admira.store
// Cierra el círculo móvil → gemelo: el móvil sube el vídeo por trozos directamente a R2
// (multipart), el pipeline (Mac/DGX) lo baja, reconstruye y sube la nube/splat, y el visor
// (xpaceos.com/scan/visor.html?scene=<id>) lo carga por URL. Sin AirDrop, sin cables.
//
// Público (el móvil no puede guardar secretos):
//   POST /scenes                       {name,size,mime,parts} → {id,uploadId,partSize,key}
//   PUT  /scenes/:id/parts/:n          cuerpo binario (≥5 MB salvo el último) → {etag}
//   POST /scenes/:id/complete          {parts:[{partNumber,etag}]} → manifiesto (status uploaded)
//   GET  /scenes/:id                   manifiesto
//   GET  /scenes                       últimas escenas (resumen)
//   GET  /scenes/:id/files/:name       fichero (vídeo, points.ply, scene.splat…) con Range + CORS
// Con token (Authorization: Bearer SCAN_TOKEN — la otra mitad la tiene el pipeline):
//   POST /scenes/:id/status            {status, note, machine}
//   PUT  /scenes/:id/files/:name       cuerpo binario ≤ 95 MB (resultados del pipeline)
//   POST /scenes/:id/ready             {files:[…], note, machine} → status ready
//   DELETE /scenes/:id
const PART_SIZE = 8 * 1024 * 1024;           // 8 MB: R2 exige ≥5 MB por parte salvo la última
const MAX_PARTS = 64;                        // 64 × 8 MB = 512 MB por escena, de sobra para 180 s
const RESULT_MAX = 95 * 1024 * 1024;         // un PUT de Workers no admite más de ~100 MB
const STATUSES = new Set(['uploading', 'uploaded', 'processing', 'ready', 'error']);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Range,X-Scan-Machine',
  'Access-Control-Expose-Headers': 'ETag,Content-Length,Content-Range,Accept-Ranges',
  'Access-Control-Max-Age': '86400',
};
const json = (o, status = 200, extra = {}) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...extra } });
const err = (msg, status = 400, code = 'bad_request') => json({ ok: false, error: msg, code }, status);

const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const rand = n => { const a = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; const b = crypto.getRandomValues(new Uint8Array(n)); for (const x of b) s += a[x % a.length]; return s; };
const safeName = s => String(s || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
const ymd = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const extOf = mime => (String(mime || '').includes('mp4') || String(mime || '').includes('quicktime')) ? 'mp4' : 'webm';
const MIME = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ply: 'application/octet-stream', splat: 'application/octet-stream', ksplat: 'application/octet-stream', json: 'application/json', txt: 'text/plain; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', mp4v: 'video/mp4' };
const mimeFor = name => MIME[(name.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';

async function readManifest(env, id) {
  const o = await env.SCAN.get(`scenes/${id}/manifest.json`);
  if (!o) return null;
  try { return await o.json(); } catch { return null; }
}
async function writeManifest(env, m) {
  m.updated = new Date().toISOString();
  await env.SCAN.put(`scenes/${m.id}/manifest.json`, JSON.stringify(m), { httpMetadata: { contentType: 'application/json' } });
  return m;
}
function publicView(env, m) {
  const base = env.PUBLIC_BASE || '';
  const files = (m.files || []).map(f => ({ ...f, url: `${base}/scenes/${m.id}/files/${f.name}` }));
  const out = { ...m, files, video: m.video ? { ...m.video, url: `${base}/scenes/${m.id}/files/${m.video.name}` } : null, visor: `${env.VISOR_BASE || 'https://www.xpaceos.com/scan/visor.html'}?scene=${m.id}` };
  delete out.uploadId;   // el id del multipart no se publica: con él cualquiera podría meter partes
  return out;
}
function authed(req, env) {
  const h = req.headers.get('Authorization') || '';
  return env.SCAN_TOKEN && h === `Bearer ${env.SCAN_TOKEN}`;
}
async function notify(env, text) {
  if (!env.BOT_SAY_URL) return;
  try {
    await fetch(env.BOT_SAY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 xpacescan', ...(env.BOT_SAY_TOKEN ? { Authorization: `Bearer ${env.BOT_SAY_TOKEN}` } : {}) },
      body: JSON.stringify({ persona: 'XpaceScan', machine: 'worker', text }) });
  } catch {}
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    const seg = p.split('/').filter(Boolean);

    if (p === '/' || p === '/help') return json({ ok: true, service: 'xpacescan', doc: 'https://www.xpaceos.com/scan/', routes: ['POST /scenes', 'PUT /scenes/:id/parts/:n', 'POST /scenes/:id/complete', 'GET /scenes/:id', 'GET /scenes', 'GET /scenes/:id/files/:name', 'POST /scenes/:id/status (token)', 'PUT /scenes/:id/files/:name (token)', 'POST /scenes/:id/ready (token)', 'DELETE /scenes/:id (token)'] });
    if (seg[0] !== 'scenes') return err('not found', 404, 'not_found');

    // ── GET /scenes ── últimas escenas
    if (seg.length === 1 && req.method === 'GET') {
      const list = await env.SCAN.list({ prefix: 'scenes/', delimiter: '/', limit: 1000 });
      const ids = (list.delimitedPrefixes || []).map(x => x.split('/')[1]).filter(Boolean);
      const items = [];
      for (const id of ids.slice(-200)) {
        const m = await readManifest(env, id);
        if (m) items.push({ id: m.id, name: m.name, status: m.status, size: m.video?.size || 0, created: m.created, updated: m.updated, files: (m.files || []).length, note: m.note || '', machine: m.machine || '', visor: `${env.VISOR_BASE || 'https://www.xpaceos.com/scan/visor.html'}?scene=${m.id}` });
      }
      items.sort((a, b) => (b.created || '').localeCompare(a.created || ''));
      return json({ ok: true, count: items.length, scenes: items.slice(0, 50) });
    }

    // ── POST /scenes ── abre una escena y su multipart
    if (seg.length === 1 && req.method === 'POST') {
      let b = {}; try { b = await req.json(); } catch {}
      const size = Number(b.size || 0), parts = Number(b.parts || 0);
      if (!size || size <= 0) return err('size requerido');
      if (size > Number(env.MAX_SCENE_BYTES || 524288000)) return err('vídeo demasiado grande', 413, 'too_large');
      if (!parts || parts > MAX_PARTS) return err(`parts fuera de rango (1-${MAX_PARTS})`);
      const ext = extOf(b.mime);
      const id = `${slug(b.name) || 'xpacio'}-${ymd()}-${rand(4)}`;
      const key = `scenes/${id}/video.${ext}`;
      const mp = await env.SCAN.createMultipartUpload(key, { httpMetadata: { contentType: b.mime || MIME[ext] } });
      const m = { id, name: b.name || id, status: 'uploading', created: new Date().toISOString(), video: { name: `video.${ext}`, key, size, mime: b.mime || MIME[ext] }, uploadId: mp.uploadId, parts, files: [], note: '', device: b.device || '', duration: Number(b.duration || 0) || 0 };
      await writeManifest(env, m);
      return json({ ok: true, id, uploadId: mp.uploadId, partSize: PART_SIZE, key, manifest: publicView(env, m) }, 201);
    }

    const id = safeName(seg[1] || '');
    if (!id) return err('id requerido');

    // ── GET /scenes/:id/files/:name ── servir fichero con Range
    if (seg[2] === 'files' && seg[3] && req.method === 'GET') {
      const name = safeName(seg[3]);
      const range = req.headers.get('Range');
      const obj = await env.SCAN.get(`scenes/${id}/${name}`, range ? { range: req.headers } : undefined);
      if (!obj) return err('fichero no encontrado', 404, 'not_found');
      const h = new Headers(CORS);
      obj.writeHttpMetadata(h);
      if (!h.get('Content-Type') || h.get('Content-Type') === 'application/octet-stream') h.set('Content-Type', mimeFor(name));
      h.set('ETag', obj.httpEtag); h.set('Accept-Ranges', 'bytes'); h.set('Cache-Control', 'public, max-age=3600');
      if (range && obj.range) {   // R2 rellena obj.range también en un GET completo: 206 SOLO si el cliente pidió Range (three.js rechaza 206 sin pedirlo)
        const start = obj.range.offset ?? 0, end = obj.range.end ?? (start + (obj.range.length || obj.size) - 1);
        h.set('Content-Range', `bytes ${start}-${end}/${obj.size}`); h.set('Content-Length', String(end - start + 1));
        return new Response(obj.body, { status: 206, headers: h });
      }
      h.set('Content-Length', String(obj.size));
      return new Response(obj.body, { status: 200, headers: h });
    }

    const m = await readManifest(env, id);
    if (!m) return err('escena no encontrada', 404, 'not_found');

    // ── GET /scenes/:id ──
    if (seg.length === 2 && req.method === 'GET') return json({ ok: true, scene: publicView(env, m) });

    // ── PUT /scenes/:id/parts/:n ──
    if (seg[2] === 'parts' && seg[3] && req.method === 'PUT') {
      if (m.status !== 'uploading' || !m.uploadId) return err('la escena ya no admite partes', 409, 'not_uploading');
      const n = parseInt(seg[3], 10);
      if (!(n >= 1 && n <= (m.parts || MAX_PARTS))) return err('número de parte fuera de rango');
      const mp = env.SCAN.resumeMultipartUpload(m.video.key, m.uploadId);
      const part = await mp.uploadPart(n, req.body);
      return json({ ok: true, partNumber: part.partNumber, etag: part.etag });
    }

    // ── POST /scenes/:id/complete ──
    if (seg[2] === 'complete' && req.method === 'POST') {
      if (m.status !== 'uploading' || !m.uploadId) return err('la escena ya está cerrada', 409, 'not_uploading');
      let b = {}; try { b = await req.json(); } catch {}
      const parts = Array.isArray(b.parts) ? b.parts.map(x => ({ partNumber: Number(x.partNumber), etag: String(x.etag) })).filter(x => x.partNumber >= 1 && x.etag) : [];
      if (!parts.length) return err('parts requerido');
      const mp = env.SCAN.resumeMultipartUpload(m.video.key, m.uploadId);
      let obj;
      try { obj = await mp.complete(parts); } catch (e) { return err('no se pudo completar el multipart: ' + (e.message || e), 500, 'complete_failed'); }
      m.status = 'uploaded'; m.uploadId = null; m.video.size = obj.size; m.uploadedAt = new Date().toISOString();
      await writeManifest(env, m);
      await notify(env, `📱→☁️ XpaceScan: nueva escena «${m.name}» (${(obj.size / 1048576).toFixed(1)} MB${m.duration ? ', ' + m.duration + ' s' : ''}) subida desde el móvil. Procesar: scan-pull.sh ${m.id} · visor: ${env.VISOR_BASE}?scene=${m.id}`);
      return json({ ok: true, scene: publicView(env, m) });
    }

    // ── a partir de aquí, token del pipeline ──
    if (!authed(req, env)) return err('token requerido', 401, 'unauthorized');

    if (seg[2] === 'status' && req.method === 'POST') {
      let b = {}; try { b = await req.json(); } catch {}
      if (b.status && !STATUSES.has(b.status)) return err('status inválido');
      if (b.status) m.status = b.status;
      if (typeof b.note === 'string') m.note = b.note.slice(0, 400);
      if (typeof b.progress === 'number') m.progress = Math.max(0, Math.min(100, b.progress));
      m.machine = b.machine || req.headers.get('X-Scan-Machine') || m.machine || '';
      await writeManifest(env, m);
      return json({ ok: true, scene: publicView(env, m) });
    }
    if (seg[2] === 'files' && seg[3] && req.method === 'PUT') {
      const name = safeName(seg[3]);
      const len = Number(req.headers.get('Content-Length') || 0);
      if (len > RESULT_MAX) return err('resultado > 95 MB: súbelo por partes o comprímelo', 413, 'too_large');
      const obj = await env.SCAN.put(`scenes/${id}/${name}`, req.body, { httpMetadata: { contentType: req.headers.get('Content-Type') || mimeFor(name) } });
      m.files = (m.files || []).filter(f => f.name !== name).concat([{ name, size: obj.size, uploaded: new Date().toISOString() }]);
      await writeManifest(env, m);
      return json({ ok: true, file: { name, size: obj.size }, scene: publicView(env, m) });
    }
    if (seg[2] === 'ready' && req.method === 'POST') {
      let b = {}; try { b = await req.json(); } catch {}
      m.status = 'ready'; m.readyAt = new Date().toISOString(); m.progress = 100;
      if (typeof b.note === 'string') m.note = b.note.slice(0, 400);
      m.machine = b.machine || req.headers.get('X-Scan-Machine') || m.machine || '';
      if (b.primary) m.primary = safeName(b.primary);
      if (Array.isArray(b.nodes)) m.nodes = b.nodes.slice(0, 64);
      await writeManifest(env, m);
      await notify(env, `✅ XpaceScan: gemelo «${m.name}» LISTO (${(m.files || []).map(f => f.name).join(', ')}) desde ${m.machine || 'pipeline'} → ${env.VISOR_BASE}?scene=${m.id}`);
      return json({ ok: true, scene: publicView(env, m) });
    }
    if (seg.length === 2 && req.method === 'DELETE') {
      const list = await env.SCAN.list({ prefix: `scenes/${id}/` });
      await Promise.all(list.objects.map(o => env.SCAN.delete(o.key)));
      return json({ ok: true, deleted: list.objects.length });
    }
    return err('not found', 404, 'not_found');
  },
};
