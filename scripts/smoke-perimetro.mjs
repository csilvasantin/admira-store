#!/usr/bin/env node
// Comprobación de lo publicado (Carlos, 30-oct-2026). Se ejecuta tras cada despliegue contra la web real:
// lo privado sigue privado, lo público sigue público, lo interno no se publica y toda respuesta lleva HSTS.
// No crea nada: la única escritura que intenta es una solicitud de acceso sin consentimiento, que se rechaza.
//
// Uso: node scripts/smoke-perimetro.mjs <base> [commit]
//   base    https://www.admira.store o una vista previa https://<id>.admira-store.pages.dev
//   commit  si se indica, espera a que /version.json diga ese commit antes de comprobar nada.

const [base, commit] = process.argv.slice(2);
if (!base) {
  console.error('Uso: node scripts/smoke-perimetro.mjs <base> [commit]');
  process.exit(2);
}

const PAGINA = {'Sec-Fetch-Dest': 'document', Accept: 'text/html'};
const INCRUSTADA = {'Sec-Fetch-Dest': 'iframe', Accept: 'text/html'};
const ESPERA_VERSION_MS = 180_000;

const CASOS = [
  // Privado: sin sesión, al login.
  {ruta: '/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/inventario/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/leads.html', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/xpacios/crear/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/xpacios/crear/phone.html', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/xpacios/grok/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/xpacios/xtanco-barcelona/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/xpacios/xtanco-valencia/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  // Codificar la ruta o doblar barras no abre nada: Pages la limpia después del perímetro.
  {ruta: '/xpacios//crear/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/xpacios/%63rear/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/xpacios/%67rok/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/mcp/..%2Fleads.html', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  // El gemelo: la persona entra con sesión; incrustado sigue siendo público.
  {ruta: '/admira-xp/', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/admira-xp//', cabeceras: PAGINA, estado: 302, destino: /\/auth\/login/},
  {ruta: '/admira-xp/', cabeceras: INCRUSTADA, estado: 200},
  // Público: el servidor lo entrega y ninguna verja en la página manda al login.
  {ruta: '/mcp/', cabeceras: PAGINA, estado: 200, sinTexto: 'auth-gate'},
  {ruta: '/xpacios/', cabeceras: PAGINA, estado: 200, sinTexto: 'auth-gate'},
  {ruta: '/xpacios/sneakerstore/', cabeceras: PAGINA, estado: 200, sinTexto: 'auth-gate'},
  {ruta: '/llms.txt', estado: 200},
  {ruta: '/robots.txt', estado: 200},
  {ruta: '/sitemap.xml', estado: 200},
  {ruta: '/mcp/manifest.json', estado: 200},
  {ruta: '/admira-xp/docs/matrix-mcp.md', estado: 200},
  // Los medios siguen admitiendo rangos: el vídeo depende de ello. En pages.dev no los hay ni sin perímetro.
  ...(new URL(base).hostname.endsWith('.pages.dev') ? [] : [
    // La caché del dominio puede guardar una copia anterior a HSTS: aquí solo importa el rango.
    {ruta: '/admira-xp/assets/videos/precarga_amiga500.mp4', cabeceras: {Range: 'bytes=0-1023'}, estado: 206, sinHsts: true},
  ]),
  // Interno: no forma parte de lo publicado y el perímetro lo niega (.github/quitar-internos.sh, isInternalPath).
  ...['/AGENTS.md', '/HANDOFF.md', '/README.md', '/deploy.sh', '/sync-desde-xpaceos.sh', '/sello-y-verja.py',
    '/install-live-presence.py', '/.gitattributes', '/.gitignore', '/scripts/google-redirects.sh', '/release-preflight.test.mjs',
    '/scan/worker/.wrangler/cache/wrangler-account.json', '/admira-xp/docs/handoffs/2026-10-09-sneakerstore-demo.md',
    '/xpacios/CHANGELOG.md'].map((ruta) => ({ruta, estado: 404})),
  // El login tiene salida para quien no tiene cuenta autorizada.
  {ruta: '/auth/login', cabeceras: PAGINA, estado: 401, conTexto: '/auth/solicitar-acceso'},
  {
    ruta: '/auth/solicitar-acceso',
    cabeceras: {'Content-Type': 'application/x-www-form-urlencoded', Origin: new URL(base).origin},
    metodo: 'POST',
    cuerpo: 'name=Comprobacion&email=comprobacion%40example.com',
    estado: 400,
  },
];

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function esperarVersion() {
  const limite = Date.now() + ESPERA_VERSION_MS;
  let visto = '';
  while (Date.now() < limite) {
    try {
      const r = await fetch(new URL('/version.json', base), {cache: 'no-store'});
      const v = r.ok ? await r.json() : null;
      visto = v?.git || '';
      if (visto === commit) return;
    } catch (_) {}
    await dormir(5_000);
  }
  throw new Error(`/version.json no llega a ${commit} (último visto: ${visto || 'nada'})`);
}

async function comprobar(caso) {
  const problemas = [];
  const r = await fetch(new URL(caso.ruta, base), {
    method: caso.metodo || 'GET',
    headers: caso.cabeceras || {},
    body: caso.cuerpo,
    redirect: 'manual',
  });
  if (r.status !== caso.estado) problemas.push(`estado ${r.status}, esperado ${caso.estado}`);
  if (!caso.sinHsts && !/max-age=\d+/.test(r.headers.get('strict-transport-security') || '')) problemas.push('sin HSTS');
  if (caso.destino && !caso.destino.test(r.headers.get('location') || '')) problemas.push(`destino ${r.headers.get('location') || 'ninguno'}`);
  if (caso.conTexto || caso.sinTexto) {
    const texto = await r.text();
    if (caso.conTexto && !texto.includes(caso.conTexto)) problemas.push(`falta «${caso.conTexto}»`);
    if (caso.sinTexto && texto.includes(caso.sinTexto)) problemas.push(`no debería llevar «${caso.sinTexto}»`);
  } else {
    await r.body?.cancel();
  }
  return problemas;
}

if (commit) await esperarVersion();

let fallos = 0;
for (const caso of CASOS) {
  const etiqueta = `${caso.metodo || 'GET'} ${caso.ruta}${caso.cabeceras?.['Sec-Fetch-Dest'] ? ` (${caso.cabeceras['Sec-Fetch-Dest']})` : ''}`;
  let problemas;
  try {
    problemas = await comprobar(caso);
  } catch (error) {
    problemas = [String(error?.message || error)];
  }
  if (problemas.length) {
    fallos += 1;
    console.log(`✖ ${etiqueta}: ${problemas.join('; ')}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error title=Comprobación tras publicar::${etiqueta}: ${problemas.join('; ')}`);
  } else {
    console.log(`✓ ${etiqueta}`);
  }
}

console.log(`\n${CASOS.length - fallos}/${CASOS.length} comprobaciones correctas en ${base}`);
process.exit(fallos ? 1 : 0);
