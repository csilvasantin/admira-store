// Perímetro de seguridad de los presites de XpaceOS y admira.store.
//
// Por qué (Carlos, 1-oct-2026, misión DCL-bdd079ab114d86b789f6ca65): los dos
// presites tienen que quedar tras un login de Google y solo puede entrar quien
// tenga permiso, gestionado desde AdmiraNeXT. Es server-side (Cloudflare Pages
// Functions): sin sesión, el HTML no sale del servidor. Un script en la página
// solo disimula, porque el contenido ya viajó al navegador.
//
// admira.store es un ESPEJO de xpaceos.com (sync-desde-xpaceos.sh copia todo
// menos CNAME y .github), así que este mismo fichero llega a las dos webs. Por
// eso la web se reconoce por el HOST y cada una pide su propia casilla en la
// lista de AdmiraNeXT (admira-whitelist /access?site=xpaceos|admira-store).
//
// Sin base de datos: la sesión es una cookie firmada (HMAC) de 24 h y el
// permiso se pregunta a la lista en cada visita, con 60 s de memoria por
// isolate. Quitar la casilla en AdmiraNeXT corta el acceso en un minuto.
//
// Base: el perímetro de pixeria.com (functions/_auth.js), que ya funciona.

const CLIENT_ID = '861856772040-e1ri6kpu6maagtb6crdfbb923hsaalgb.apps.googleusercontent.com';
// dominio propio: LaLiga bloquea workers.dev en horas de fútbol, FLT-1633
const WHITELIST_URL = 'https://whitelist.admira.store';
const ACCESS_URL = WHITELIST_URL + '/access';
const SESSION_COOKIE = '__Host-perimetro_session';
const NONCE_COOKIE = '__Host-perimetro_nonce';
const RETURN_COOKIE = '__Host-perimetro_return';
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const CHALLENGE_TTL_SECONDS = 10 * 60;
const ACCESS_TTL_MS = 60 * 1000;
const OWNER_FALLBACK = new Set(['csilva@admira.com', 'csilvasantin@gmail.com']);
// Entrada de servicio para los agentes de silicio (Carlos, 3-oct-2026: «tenéis
// que tener acceso a todo»). Un agente no tiene cuenta de Google: entra en
// /auth/agente con ADMIRA_AGENT_LOGIN_TOKEN (secret del proyecto, el mismo en
// las cuatro patas) y recibe la misma cookie de 24 h que un usuario con permiso.
// Ve todo; no gestiona permisos (no es superuser). Cambiar el secret corta la
// entrada Y las sesiones ya abiertas, porque la cookie lleva la huella del token.
const AGENT_EMAIL = 'agentes@silicio.admiranext.com';
const AGENT_TOKEN_MIN = 32;
const AGENT_LOG_URL = WHITELIST_URL + '/agent-log';
const encoder = new TextEncoder();

// Una entrada por web. `hosts` son los dominios públicos (el primero es el
// canónico); `pagesProject` permite probar en <proyecto>.pages.dev y en sus
// despliegues de vista previa antes de mover el DNS.
export const SITES = {
  xpaceos: {
    name:'XpaceOS', hosts:['www.xpaceos.com', 'xpaceos.com'], pagesProject:'xpaceos',
    accent:'#00e5ff', background:'#03080c'
  },
  'admira-store': {
    name:'admira.store', hosts:['www.admira.store', 'admira.store'], pagesProject:'admira-store',
    accent:'#ff6a3d', background:'#0c0604'
  }
};

// Rutas que usan OTROS sin login (Carlos, 1-oct-2026): el gemelo va incrustado
// en clearchannel.tv, admira.tv y los decks; los Xpacios y el MCP los abren
// players, decks y agentes. Cerrarlas rompería esos iframes y enlaces.
// /avatar-ask es solo el proxy del cerebro (FLT-101350): sin esto el POST, al no
// llevar extensión, se trataría como documento y el perímetro lo mandaría al login.
export const PUBLIC_PREFIXES = ['/admira-xp', '/xpacios', '/mcp', '/avatar-ask'];

export function siteForHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  for (const [id, site] of Object.entries(SITES)) {
    if (site.hosts.includes(host)) return {id, ...site};
    const pages = `${site.pagesProject}.pages.dev`;
    if (host === pages || host.endsWith('.' + pages)) return {id, ...site};
  }
  return null;
}

export function isPublicPath(pathname) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

// Documento = lo que sirve una página: raíz, carpeta, .html o ruta sin
// extensión. Los assets (.js, .css, .png, .glb, .json…) pasan sin perímetro:
// los necesitan las rutas públicas y no son páginas que se puedan leer.
export function isDocumentPath(pathname) {
  if (pathname.endsWith('/')) return true;
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (!last.includes('.')) return true;
  return last.endsWith('.html') || last.endsWith('.htm');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64url(value) {
  const raw = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = raw + '='.repeat((4 - raw.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function sameValue(left, right) {
  left = String(left || '');
  right = String(right || '');
  if (!left || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function cookieJar(request) {
  const jar = {};
  (request.headers.get('Cookie') || '').split(/;\s*/).forEach((part) => {
    const separator = part.indexOf('=');
    if (separator > 0) jar[part.slice(0, separator)] = part.slice(separator + 1);
  });
  return jar;
}

function cookiesNamed(request, name) {
  return (request.headers.get('Cookie') || '').split(/;\s*/).flatMap((part) => {
    const separator = part.indexOf('=');
    return separator > 0 && part.slice(0, separator) === name ? [part.slice(separator + 1)] : [];
  });
}

function normalEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function safeReturnTo(value) {
  let candidate = String(value || '/');
  try { candidate = decodeURIComponent(candidate); } catch (_) { return '/'; }
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.length > 1024 || /[\\\u0000-\u001f\u007f]/.test(candidate)) return '/';
  if (candidate.startsWith('/auth/')) return '/';
  return candidate;
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']
  );
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

// Permiso por web en la lista de AdmiraNeXT. Memoria corta por isolate para no
// preguntar en cada asset; los owners entran aunque la lista no responda, para
// que un corte no deje a Carlos fuera de su propia web.
const ACCESS_CACHE = new Map();
export async function emailAllowed(env, siteId, email, fetchImpl = fetch, now = Date.now()) {
  return (await accessInfo(env, siteId, email, fetchImpl, now)).allowed;
}

export async function accessInfo(env, siteId, email, fetchImpl = fetch, now = Date.now()) {
  const normalized = normalEmail(email);
  if (!normalized) return {allowed:false, superuser:false};
  const key = siteId + '|' + normalized;
  const cached = ACCESS_CACHE.get(key);
  if (cached && cached.until > now) return cached.info;
  try {
    if (!env.WHITELIST_SITE_TOKEN) throw new Error('sin token de la lista');
    const query = `?site=${encodeURIComponent(siteId)}&email=${encodeURIComponent(normalized)}`;
    const response = await fetchImpl(ACCESS_URL + query, {
      headers:{Accept:'application/json', 'X-Whitelist-Token':env.WHITELIST_SITE_TOKEN}
    });
    if (!response.ok) throw new Error('lista no disponible');
    const payload = await response.json();
    const info = {allowed:payload.ok === true && payload.allowed === true, superuser:payload.superuser === true};
    ACCESS_CACHE.set(key, {info, until:now + ACCESS_TTL_MS});
    return info;
  } catch (_) {
    const owner = OWNER_FALLBACK.has(normalized);
    return {allowed:owner, superuser:owner};
  }
}

export async function verifyGoogleCredential(credential, fetchImpl = fetch) {
  if (!credential || credential.length > 6000) return null;
  try {
    const parts = credential.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1])));
    if (header.alg !== 'RS256' || !header.kid || !payload.sub) return null;
    const certificates = await fetchImpl('https://www.googleapis.com/oauth2/v3/certs', {
      headers:{Accept:'application/json'},
      cf:{cacheTtl:21600, cacheEverything:true}
    });
    if (!certificates.ok) return null;
    const jwks = await certificates.json();
    const jwk = Array.isArray(jwks.keys) && jwks.keys.find((item) =>
      item.kid === header.kid && item.kty === 'RSA' && item.alg === 'RS256'
    );
    if (!jwk) return null;
    const key = await crypto.subtle.importKey(
      'jwk', jwk, {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify']
    );
    const validSignature = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, decodeBase64url(parts[2]), encoder.encode(parts[0] + '.' + parts[1])
    );
    const email = normalEmail(payload.email);
    const now = Math.floor(Date.now() / 1000);
    const issuerValid = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com';
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
    const googleAuthoritative = email.endsWith('@gmail.com') || (emailVerified && typeof payload.hd === 'string' && payload.hd.length > 0);
    if (!validSignature || payload.aud !== CLIENT_ID || !issuerValid || !emailVerified || !googleAuthoritative || Number(payload.exp) <= now) return null;
    return {email, sub:String(payload.sub), nonce:String(payload.nonce || '')};
  } catch (_) {
    return null;
  }
}

function agentToken(env) {
  const token = String(env.ADMIRA_AGENT_LOGIN_TOKEN || '');
  return token.length >= AGENT_TOKEN_MIN ? token : '';
}

// Huella del token vigente: va dentro de la cookie de agente. Sin secret → ''.
async function agentFingerprint(env) {
  const token = agentToken(env);
  return token && env.PERIMETRO_SIGNING_KEY ? (await hmac(env.PERIMETRO_SIGNING_KEY, `agente:${token}`)).slice(0, 22) : '';
}

async function createSessionToken(env, site, identity, extra = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(encoder.encode(JSON.stringify({
    v:1, aud:site.id, email:identity.email, sub:identity.sub, iat:now, exp:now + SESSION_TTL_SECONDS, ...extra
  })));
  return `${payload}.${await hmac(env.PERIMETRO_SIGNING_KEY, `perimetro:${payload}`)}`;
}

export async function readSession(request, env, site, fetchImpl = fetch) {
  try {
    if (!env.PERIMETRO_SIGNING_KEY) return null;
    const token = cookieJar(request)[SESSION_COOKIE];
    if (!token || token.length > 4096) return null;
    const separator = token.lastIndexOf('.');
    if (separator < 1) return null;
    const payloadPart = token.slice(0, separator);
    if (!sameValue(token.slice(separator + 1), await hmac(env.PERIMETRO_SIGNING_KEY, `perimetro:${payloadPart}`))) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(payloadPart)));
    const now = Math.floor(Date.now() / 1000);
    // aud = la web: una sesión de xpaceos no abre admira.store aunque compartan clave.
    if (payload.v !== 1 || payload.aud !== site.id || Number(payload.exp) <= now || Number(payload.iat) > now + 60) return null;
    const email = normalEmail(payload.email);
    if (!email) return null;
    // Sesión de agente: no pasa por la lista; vale mientras el token con el que
    // se abrió siga siendo el vigente. El correo de agente SIN huella no entra.
    if (payload.agent || email === AGENT_EMAIL) {
      return email === AGENT_EMAIL && sameValue(payload.agent, await agentFingerprint(env))
        ? {email, superuser:false, agent:true} : null;
    }
    const info = await accessInfo(env, site.id, email, fetchImpl);
    if (!info.allowed) return null;
    return {email, superuser:info.superuser};
  } catch (_) {
    return null;
  }
}

function loginCsrfValid(request, formToken) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== 'null' && origin !== 'https://accounts.google.com' && origin !== new URL(request.url).origin) return false;
  const officialCookies = cookiesNamed(request, 'g_csrf_token').filter((value) => value.length >= 32);
  const field = String(formToken || '');
  return !(officialCookies.length && (field.length < 32 || !officialCookies.some((value) => sameValue(value, field))));
}

function secureHeaders() {
  return {
    'content-type':'text/html; charset=utf-8',
    'cache-control':'no-store',
    'x-robots-tag':'noindex, nofollow',
    'referrer-policy':'strict-origin-when-cross-origin',
    'content-security-policy':"default-src 'none'; script-src https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; style-src 'unsafe-inline' https://accounts.google.com/gsi/style; img-src data: https://*.googleusercontent.com; connect-src https://accounts.google.com/gsi/; form-action 'self' https://accounts.google.com; frame-ancestors 'none'; base-uri 'none'"
  };
}

function loginPage(site, origin, nonce, error) {
  const accent = site.accent;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(site.name)} · Acceso</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 30%,#14202a,${site.background} 70%);color:#e9f1f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.box{width:100%;max-width:430px;padding:36px 30px;border:1px solid ${accent}55;border-radius:16px;background:#070c10e6;box-shadow:0 25px 80px #000b;text-align:center}.mark{color:${accent};font:700 12px ui-monospace,monospace;letter-spacing:.24em;text-transform:uppercase}h1{margin:16px 0 8px;font-size:26px}p{margin:0 0 24px;color:#9fb1bb;line-height:1.55}.picker{display:flex;justify-content:center;min-height:44px;max-width:100%;overflow:hidden}.error{margin-top:18px;color:#ff8f7a;font:600 13px ui-monospace,monospace;line-height:1.5}.foot{margin-top:24px;color:#5d707b;font:11px ui-monospace,monospace}@media (max-width:430px){body{padding:16px}.box{padding:28px 18px}}</style></head><body><main class="box"><div class="mark">${escapeHtml(site.name)} · perímetro de seguridad</div><h1>Acceso con Google</h1><p>Esta web es privada. Entra con tu cuenta de Google; si tienes permiso en AdmiraNeXT, la sesión dura 24 horas en este navegador.</p><div id="g_id_onload" data-client_id="${CLIENT_ID}" data-login_uri="${escapeHtml(origin)}/auth/callback" data-nonce="${escapeHtml(nonce)}" data-ux_mode="redirect" data-auto_prompt="false"></div><div class="picker"><div class="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text="continue_with" data-size="large" data-ux_mode="redirect"></div></div>${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}<div class="foot">Permisos: AdmiraNeXT · admira.live/usuarios</div></main><script src="https://accounts.google.com/gsi/client" async defer></script></body></html>`;
}

function loginResponse(site, origin, returnTo, error = '', status = 401) {
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const response = new Response(loginPage(site, origin, nonce, error), {status, headers:secureHeaders()});
  // SameSite=None: Google vuelve con un POST desde accounts.google.com y una
  // cookie Lax no viajaría en esa petición entre sitios.
  response.headers.append('Set-Cookie', `${NONCE_COOKIE}=${nonce}; Path=/; Max-Age=${CHALLENGE_TTL_SECONDS}; HttpOnly; Secure; SameSite=None`);
  response.headers.append('Set-Cookie', `${RETURN_COOKIE}=${encodeURIComponent(safeReturnTo(returnTo))}; Path=/; Max-Age=${CHALLENGE_TTL_SECONDS}; HttpOnly; Secure; SameSite=None`);
  return response;
}

function redirect(location, extraCookies = []) {
  const response = new Response(null, {status:302, headers:{location, 'cache-control':'no-store', 'referrer-policy':'no-referrer'}});
  extraCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
  return response;
}

// Cada uso de la entrada de agentes queda escrito: en el log del worker y, sin
// frenar la respuesta, en el registro de AdmiraNeXT (la misma lista de
// permisos). Nunca se escribe el token.
function logAgentUse(env, entry, fetchImpl, waitUntil) {
  console.log(JSON.stringify({evento:'perimetro_agente', ...entry}));
  if (!env.WHITELIST_SITE_TOKEN) return;
  const sent = Promise.resolve().then(() => fetchImpl(AGENT_LOG_URL, {
    method:'POST', headers:{'X-Whitelist-Token':env.WHITELIST_SITE_TOKEN, 'Content-Type':'application/json'},
    body:JSON.stringify(entry)
  })).catch(() => null);
  if (waitUntil) waitUntil(sent);
}

function agentPage(site, returnTo, error) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(site.name)} · Entrada de agentes</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:${site.background};color:#e9f1f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.box{width:100%;max-width:430px;padding:32px 26px;border:1px solid ${site.accent}55;border-radius:16px;background:#070c10e6}.mark{color:${site.accent};font:700 12px ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase}h1{margin:14px 0 8px;font-size:22px}p{margin:0 0 18px;color:#9fb1bb;line-height:1.5;font-size:14px}a{color:${site.accent}}label{display:block;margin:0 0 6px;font:600 12px ui-monospace,monospace;color:#9fb1bb}input{width:100%;padding:10px;border-radius:8px;border:1px solid #ffffff2a;background:#0008;color:#fff;font-size:14px;margin-bottom:14px}button{width:100%;padding:11px;border-radius:8px;border:1px solid ${site.accent};background:transparent;color:${site.accent};font:700 13px ui-monospace,monospace;cursor:pointer}.error{margin-top:14px;color:#ff8f7a;font:600 13px ui-monospace,monospace}</style></head><body><main class="box"><div class="mark">${escapeHtml(site.name)} · perímetro de seguridad</div><h1>Entrada de agentes</h1><p>Para los agentes de silicio de AdmiraNeXT. El token está en la bóveda (ADMIRA_AGENT_LOGIN_TOKEN) y cada entrada queda registrada. Las personas entran con Google en <a href="/auth/login">/auth/login</a>.</p><form method="post" action="/auth/agente" autocomplete="off"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"><label for="agente">Agente y máquina</label><input id="agente" name="agente" maxlength="80" placeholder="NeoMBP14" required><label for="token">Token</label><input id="token" name="token" type="password" required><button>Entrar</button></form>${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}</main></body></html>`;
}

// /auth/agente: GET pinta el formulario; POST comprueba el token (cabecera
// Authorization: Bearer o campo del formulario — nunca en la URL, que acaba en
// historiales y logs) y abre la sesión de agente.
async function agente(request, env, site, fetchImpl, waitUntil) {
  const url = new URL(request.url);
  const headers = {...secureHeaders(), 'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
  // Sin secret configurado la entrada no existe.
  if (!agentToken(env) || !env.PERIMETRO_SIGNING_KEY) return new Response('Not found', {status:404, headers:{'cache-control':'no-store'}});
  if (request.method === 'GET') {
    // Las cookies __Host- son del host exacto: la entrada vive en el canónico.
    if (site.hosts.includes(url.hostname) && url.hostname !== site.hosts[0]) {
      return redirect(`https://${site.hosts[0]}/auth/agente`);
    }
    return new Response(agentPage(site, safeReturnTo(url.searchParams.get('return_to') || '/'), ''), {status:200, headers});
  }
  if (request.method !== 'POST') return new Response('Method not allowed', {status:405, headers:{'cache-control':'no-store', allow:'GET, POST'}});
  const origin = request.headers.get('Origin');
  if (origin && origin !== 'null' && origin !== url.origin) return new Response('Origen no válido', {status:403, headers:{'cache-control':'no-store'}});
  const bearer = (request.headers.get('Authorization') || '').match(/^Bearer\s+(\S+)$/i);
  let form = new FormData();
  if (!bearer) { try { form = await request.formData(); } catch (_) {} }
  const given = bearer ? bearer[1] : String(form.get('token') || '');
  const who = String(request.headers.get('X-Agente') || form.get('agente') || '').replace(/[^\p{L}\p{N} ._·@-]/gu, '').slice(0, 80) || 'sin nombre';
  const returnTo = safeReturnTo(request.headers.get('X-Return-To') || form.get('return_to') || '/');
  // Se comparan las firmas, no los tokens: mismo largo siempre y tiempo constante.
  const key = env.PERIMETRO_SIGNING_KEY;
  const ok = given.length > 0 && given.length <= 512 &&
    sameValue(await hmac(key, `agente-login:${given}`), await hmac(key, `agente-login:${agentToken(env)}`));
  logAgentUse(env, {
    site:site.id, host:url.hostname, agente:who, ok, at:new Date().toISOString(),
    ip:request.headers.get('CF-Connecting-IP') || '', ua:(request.headers.get('User-Agent') || '').slice(0, 160)
  }, fetchImpl, waitUntil);
  if (!ok) {
    return bearer
      ? Response.json({ok:false, error:'token no válido'}, {status:401, headers:{'cache-control':'no-store'}})
      : new Response(agentPage(site, returnTo, 'Token no válido.'), {status:401, headers});
  }
  const token = await createSessionToken(env, site, {email:AGENT_EMAIL, sub:`agente:${who}`}, {agent:await agentFingerprint(env)});
  return new Response(null, {status:303, headers:{
    location:returnTo, 'cache-control':'no-store', 'referrer-policy':'no-referrer',
    'set-cookie':`${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
  }});
}

// Rutas /auth/* del perímetro. Devuelve null si la petición no es suya.
export async function handleAuth(request, env, site, fetchImpl = fetch, waitUntil = null) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/auth/')) return null;

  if (url.pathname === '/auth/agente') return agente(request, env, site, fetchImpl, waitUntil);

  if (url.pathname === '/auth/login' && request.method === 'GET') {
    // Las cookies __Host- son del host exacto: el login vive en el canónico.
    if (site.hosts.includes(url.hostname) && url.hostname !== site.hosts[0]) {
      return redirect(`https://${site.hosts[0]}${url.pathname}${url.search}`);
    }
    const returnTo = safeReturnTo(url.searchParams.get('return_to') || '/');
    if (await readSession(request, env, site, fetchImpl)) return redirect(returnTo);
    return loginResponse(site, url.origin, returnTo);
  }

  if (url.pathname === '/auth/callback' && request.method === 'POST') {
    const jar = cookieJar(request);
    const clear = [
      `${NONCE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`,
      `${RETURN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`
    ];
    let form;
    try { form = await request.formData(); } catch (_) { form = new FormData(); }
    const identity = await verifyGoogleCredential(String(form.get('credential') || ''), fetchImpl);
    if (!identity || !loginCsrfValid(request, form.get('g_csrf_token')) || !sameValue(identity.nonce, jar[NONCE_COOKIE])) {
      const failed = loginResponse(site, url.origin, '/', 'No se pudo verificar el acceso. Vuelve a intentarlo.', 401);
      return failed;
    }
    if (!(await emailAllowed(env, site.id, identity.email, fetchImpl))) {
      return loginResponse(site, url.origin, '/', `${identity.email} no tiene permiso para ${site.name}. Pídelo a un superusuario de AdmiraNeXT.`, 403);
    }
    const returnTo = safeReturnTo(jar[RETURN_COOKIE] || '/');
    const token = await createSessionToken(env, site, identity);
    return redirect(returnTo, [
      `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
      ...clear,
      'g_csrf_token=; Path=/; Max-Age=0; Secure; SameSite=Lax'
    ]);
  }

  if (url.pathname === '/auth/permisos') return permisos(request, env, site, fetchImpl);

  if (url.pathname === '/auth/session' && request.method === 'GET') {
    const session = await readSession(request, env, site, fetchImpl);
    return Response.json(session ? {ok:true, email:session.email, site:site.id, agent:Boolean(session.agent)} : {ok:false}, {
      status:session ? 200 : 401, headers:{'cache-control':'no-store'}
    });
  }

  if (url.pathname === '/auth/logout' && (request.method === 'GET' || request.method === 'POST')) {
    return new Response(null, {status:303, headers:{
      location:'/auth/login', 'cache-control':'no-store',
      'set-cookie':`${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
    }});
  }

  return new Response('Not found', {status:404, headers:{'cache-control':'no-store'}});
}

// ── /auth/permisos: casillas de ESTA web, para superusers de AdmiraNeXT ──
// Vive dentro del perímetro (Carlos, 1-oct-2026: «conectamos con AdmiraNeXT y
// la gestión de permisos»). Lista los usuarios de AdmiraNeXT y quién tiene la
// casilla de esta web; escribe en la lista vía /site-grant nombrando al
// superuser cuya sesión acabamos de verificar. Sin JavaScript: formularios.
function permisosPage(site, me, data, notice) {
  const granted = new Set((data.sites && data.sites[site.id]) || []);
  const owners = new Set(data.owners || []);
  const emails = Array.from(new Set([...(data.users || []), ...granted, ...owners])).sort();
  const row = (email) => {
    const owner = owners.has(email);
    const on = owner || granted.has(email);
    const action = owner ? '<span class="tag">owner · siempre</span>'
      : `<form method="post"><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="allow" value="${on ? '0' : '1'}"><button class="${on ? 'off' : 'on'}">${on ? 'Quitar acceso' : 'Dar acceso'}</button></form>`;
    return `<tr class="${on ? 'yes' : ''}"><td>${on ? '✅' : '·'}</td><td>${escapeHtml(email)}</td><td>${action}</td></tr>`;
  };
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(site.name)} · Permisos</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:28px 16px;background:${site.background};color:#e9f1f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:760px;margin:0 auto}.mark{color:${site.accent};font:700 12px ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase}h1{margin:10px 0 6px;font-size:26px}p{color:#9fb1bb;line-height:1.55;margin:0 0 18px}table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:9px 8px;border-bottom:1px solid #ffffff14;font-size:14px;overflow-wrap:anywhere}td:first-child{width:32px;text-align:center}td:last-child{text-align:right;white-space:nowrap}tr.yes td:nth-child(2){color:#fff;font-weight:600}button{font:600 12px ui-monospace,monospace;padding:7px 11px;border-radius:7px;cursor:pointer;border:1px solid ${site.accent};background:transparent;color:${site.accent}}button.off{border-color:#ff8f7a;color:#ff8f7a}.tag{font:11px ui-monospace,monospace;color:#7d909b}.add{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.add input[type=email]{flex:1;min-width:200px;padding:9px 10px;border-radius:7px;border:1px solid #ffffff2a;background:#0008;color:#fff;font-size:14px}.notice{padding:10px 12px;border-radius:8px;background:#ffffff0d;margin-bottom:14px;font:13px ui-monospace,monospace}.foot{margin-top:24px;font:11px ui-monospace,monospace;color:#5d707b}a{color:${site.accent}}</style></head><body><main><div class="mark">${escapeHtml(site.name)} · perímetro de seguridad</div><h1>Quién entra en ${escapeHtml(site.name)}</h1><p>Usuarios de AdmiraNeXT y su casilla para esta web. La casilla no da acceso a admira.live ni a otras webs; quitarla corta la entrada en un minuto.</p>${notice ? `<div class="notice">${escapeHtml(notice)}</div>` : ''}<form method="post" class="add"><input type="email" name="email" placeholder="email@empresa.com" required><input type="hidden" name="allow" value="1"><button class="on">Dar acceso</button></form><table>${emails.map(row).join('')}</table><div class="foot">Sesión: ${escapeHtml(me)} · <a href="/auth/logout">salir</a> · usuarios de AdmiraNeXT en <a href="https://www.admira.live/usuarios">admira.live/usuarios</a></div></main></body></html>`;
}

async function permisos(request, env, site, fetchImpl) {
  const url = new URL(request.url);
  const session = await readSession(request, env, site, fetchImpl);
  if (!session) return redirect(`/auth/login?return_to=${encodeURIComponent('/')}`);
  const headers = {...secureHeaders(), 'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
  if (!session.superuser) {
    return new Response(`<!doctype html><meta charset="utf-8"><title>Permisos</title><body style="background:#000;color:#ccc;font-family:system-ui;padding:40px">Solo los superusuarios de AdmiraNeXT gestionan los permisos de ${escapeHtml(site.name)}.</body>`, {status:403, headers});
  }
  const token = {'X-Whitelist-Token':env.WHITELIST_SITE_TOKEN || ''};
  let notice = '';
  if (request.method === 'POST') {
    // CSRF: solo formularios de esta misma página (cookie Lax + Origin propio).
    const origin = request.headers.get('Origin');
    if (origin !== url.origin) return new Response('Origen no válido', {status:403, headers:{'cache-control':'no-store'}});
    const form = await request.formData();
    const email = normalEmail(form.get('email'));
    const allow = String(form.get('allow')) !== '0';
    if (!email) {
      notice = 'Email no válido.';
    } else {
      const r = await fetchImpl(WHITELIST_URL + '/site-grant', {
        method:'POST', headers:{...token, 'Content-Type':'application/json'},
        body:JSON.stringify({email, site:site.id, allow, actor:session.email})
      }).catch(() => null);
      ACCESS_CACHE.delete(site.id + '|' + email);
      notice = r && r.ok ? `${allow ? 'Acceso dado a' : 'Acceso quitado a'} ${email}.` : 'No se pudo guardar el cambio en AdmiraNeXT.';
    }
  }
  const r = await fetchImpl(`${WHITELIST_URL}/sites?actor=${encodeURIComponent(session.email)}`, {headers:token}).catch(() => null);
  const data = r && r.ok ? await r.json() : null;
  if (!data) return new Response('No se pudo leer la lista de AdmiraNeXT.', {status:502, headers:{'cache-control':'no-store'}});
  return new Response(permisosPage(site, session.email, data, notice), {status:200, headers});
}

// Punto de entrada del middleware de Pages.
export async function perimetro(context, fetchImpl = fetch) {
  const {request, env} = context;
  const url = new URL(request.url);
  const site = siteForHost(url.hostname);
  // Un host que no es de ninguna web conocida no se sirve: así no hay alias
  // olvidado por el que colarse sin perímetro.
  if (!site) return new Response('Host no reconocido', {status:421, headers:{'cache-control':'no-store'}});

  const waitUntil = typeof context.waitUntil === 'function' ? context.waitUntil.bind(context) : null;
  const authResponse = await handleAuth(request, env, site, fetchImpl, waitUntil);
  if (authResponse) return authResponse;

  // Manda la RUTA, no lo que diga el cliente: con Accept:*/* un bot se llevaba
  // la página entera en Pixeria hasta el 1-sep-2026 (FLT-1484).
  const wantsDocument = isDocumentPath(url.pathname) ||
    request.headers.get('Sec-Fetch-Dest') === 'document' ||
    (request.headers.get('Accept') || '').includes('text/html');
  if (!wantsDocument || isPublicPath(url.pathname)) return context.next();
  if (await readSession(request, env, site, fetchImpl)) {
    const response = await context.next();
    const guarded = new Response(response.body, response);
    guarded.headers.set('cache-control', 'private, no-store');
    guarded.headers.set('x-robots-tag', 'noindex, nofollow');
    return guarded;
  }

  const returnTo = safeReturnTo(url.pathname + url.search);
  const loginHost = site.hosts.includes(url.hostname) ? site.hosts[0] : url.hostname;
  return redirect(`https://${loginHost}/auth/login?return_to=${encodeURIComponent(returnTo)}`, []);
}
