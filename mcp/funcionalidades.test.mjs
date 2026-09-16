import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';

// Documentation contract only: never import a game dispatcher, request a
// camera, contact an MCP server, publish content or invoke a hardware action.
const repo = new URL('../', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('mcp/funcionalidades.json', repo), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('mcp/manifest.json', repo), 'utf8'));
const byId = new Map(catalog.features.map(feature => [feature.id, feature]));
const allCommands = catalog.features.flatMap(feature => feature.commands.map(command => ({featureId: feature.id, ...command})));
const feature = id => {
  assert.ok(byId.has(id), `Falta la función estable ${id}`);
  return byId.get(id);
};
const command = (id, text) => {
  const value = feature(id).commands.find(item => item.text === text);
  assert.ok(value, `Falta ${text} en ${id}`);
  return value;
};
const prose = id => JSON.stringify(feature(id));
const nonempty = (value, label) => assert.ok(typeof value === 'string' && value.trim(), label);

// Explicit ID/number/topic assignments: these are not derived from array
// positions. New areas may be appended; changing an existing assignment is a
// catalog migration, not a harmless sorting or filtering change.
const stableAreas = [
  ['XP-F01', '01', 'Cartelería Digital'],
  ['XP-F02', '02', 'Hilo Musical'],
  ['XP-F03', '03', 'Megafonía'],
  ['XP-F04', '04', 'Cinta LED y AdmiraLive'],
  ['XP-F05', '05', 'Vídeo, TV e importación multimedia'],
  ['XP-F06', '06', 'Avatares y asistentes digitales'],
  ['XP-F07', '07', 'Cámara en directo y CCTV'],
  ['XP-F08', '08', 'Aforo, audiencia e impactos'],
  ['XP-F09', '09', 'Anonimización y representación de personas'],
  ['XP-F10', '10', 'Mobiliario y distribución del espacio'],
  ['XP-F11', '11', 'Iluminación física y ambiente visual'],
  ['XP-F12', '12', 'Turnos y colas'],
  ['XP-F13', '13', 'Stock, productos y reposición'],
  ['XP-F14', '14', 'Socios y fidelización'],
  ['XP-F15', '15', 'Equipo, roles y personal'],
  ['XP-F16', '16', 'Caja, ventas y KPI'],
  ['XP-F17', '17', 'Tiempo, velocidad y DVR'],
  ['XP-F18', '18', 'Reglas XPL y contenido condicional'],
  ['XP-F19', '19', 'Creación con IA y Pixeria'],
  ['XP-F20', '20', 'Consola, Telegram y Stream Deck'],
  ['XP-F21', '21', 'Catálogo de Xpacios y gemelos'],
  ['XP-F22', '22', 'Captura 3D, Blender y producción de assets'],
  ['XP-F23', '23', 'Mapas, navegación y zonas'],
  ['XP-F24', '24', 'Marketplace y subastas'],
  ['XP-F25', '25', 'Atmósfera, puertas y aromatización'],
  ['XP-F26', '26', 'Cámara 3D, selección y calidad visual'],
  ['XP-F27', '27', 'Pedidos y devoluciones simuladas'],
  ['XP-F28', '28', 'Guardado, ayuda y diagnóstico'],
  ['XP-F29', '29', 'Personajes, visitas y escenas'],
  ['XP-F30', '30', 'Promociones, patrocinio y segmentación'],
];

test('la numeración conserva las 30 asignaciones explícitas y comienza por cartelería y música', () => {
  assert.ok(catalog.features.length >= stableAreas.length);
  const numbers = new Set();
  for (const item of catalog.features) {
    assert.match(item.number, /^\d{2,}$/);
    assert.equal(item.id, `XP-F${item.number}`);
    assert.ok(!numbers.has(item.number), `Número duplicado ${item.number}`);
    numbers.add(item.number);
  }
  assert.equal(byId.size, catalog.features.length, 'No duplicar IDs');
  for (const [id, number, title] of stableAreas) {
    assert.equal(feature(id).number, number, id);
    assert.equal(feature(id).title, title, `No reasignar el tema de ${id}`);
  }
  assert.deepEqual(catalog.features.slice(0, 2).map(item => item.id), ['XP-F01', 'XP-F02']);
  assert.match(catalog.numbering.policy, /No renumerar ni reciclar IDs/i);
  assert.match(catalog.numbering.policy, /no dependen del orden/i);
});

test('la auditoría distingue revisión de código y disponibilidad real', () => {
  assert.equal(catalog.schema_version, '1.0');
  assert.match(catalog.updated_at, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(catalog.audit.source_commit, /^[a-f0-9]{40}$/);
  assert.match(catalog.audit.basis, /estática|código/i);
  assert.match(catalog.audit.runtime_verification, /no se han validado.*extremo a extremo/i);
  assert.match(catalog.parity_contract.join(' '), /mismo estado operativo/i);
  assert.match(catalog.parity_contract.join(' '), /No duplicar simulación/i);
  assert.match(catalog.parity_contract.join(' '), /No ejecutar comandos/i);
});

test('todas las áreas tienen estados y criterios explícitos, sin anunciar Best operativo', () => {
  const statuses = ['native', 'partial', 'presentation_only', 'classic_only', 'outside_view'];
  assert.deepEqual(Object.keys(catalog.better_statuses).sort(), [...statuses].sort());
  for (const item of catalog.features) {
    nonempty(item.summary, `${item.id}: resumen`);
    assert.equal(item.good.status, 'code_present', `${item.id}: Good no significa backend probado`);
    assert.ok(statuses.includes(item.better.status), `${item.id}: estado Better desconocido`);
    assert.equal(item.best.status, 'planned', `${item.id}: Best todavía reservado`);
    for (const tier of ['good', 'better', 'best']) nonempty(item[tier].detail, `${item.id}: detalle ${tier}`);
    assert.ok(Array.isArray(item.restore) && item.restore.length, `${item.id}: criterios de recuperación`);
    for (const criterion of item.restore) nonempty(criterion, `${item.id}: criterio vacío`);
    nonempty(item.mcp.gap, `${item.id}: alcance MCP`);
  }
  assert.deepEqual(catalog.features.filter(item => item.better.status === 'native').map(item => item.id), ['XP-F26']);
  for (const id of ['XP-F02', 'XP-F03', 'XP-F18']) assert.equal(feature(id).better.status, 'classic_only');
  for (const id of ['XP-F04', 'XP-F10', 'XP-F12', 'XP-F25']) assert.equal(feature(id).better.status, 'presentation_only');
  for (const id of ['XP-F07', 'XP-F09', 'XP-F22']) assert.equal(feature(id).better.status, 'outside_view');
});

test('la navegación Best confirma sólo una preview y conserva el baseline funcional', () => {
  const navigation = catalog.view_navigation;
  assert.equal(navigation.menu, 'Avanzado (▤)');
  assert.equal(navigation.selector_inside_views, true);
  assert.deepEqual(Object.keys(navigation.labels).sort(), ['best', 'better', 'good']);
  assert.equal(navigation.best.availability, 'preview');
  assert.equal(navigation.best.static, true);
  assert.equal(navigation.best.operational, false);
  assert.deepEqual(navigation.best.success_result, {ok:true, preview:true, availability:'preview'});
  assert.match(navigation.best.scope, /no sigue el estado en vivo/);
  assert.match(navigation.better_camera.comparison, /mapped.*Good/);
  assert.match(navigation.better_camera.exploration, /independiente/);
  assert.equal(catalog.audit.source_commit, 'a7b8d62eacfcbb166d2ddc1e3a6758bec0fdc178');
  assert.match(catalog.audit.baseline_note, /revisión funcional original/);
  assert.match(command('XP-F26', '/modo best').note, /ok:true.*preview:true/);
  for (const item of catalog.features) {
    assert.equal(item.best.status, 'planned', item.id);
    assert.match(item.best.detail, /vista previa conceptual estática/, item.id);
  }
});

test('ayuda humana y texto MCP distinguen navegación disponible de funciones Best pendientes', async () => {
  const [help, cli, page, llms] = await Promise.all([
    'help/index.html', 'help/cli/index.html', 'help/funcionalidades/index.html', 'mcp/llms.txt',
  ].map(path => readFile(new URL(path, repo), 'utf8')));
  for (const document of [help, cli, page, llms]) {
    assert.match(document, /Avanzado/);
    assert.match(document, /estática/);
    assert.match(document, /preparación|planned/);
    assert.doesNotMatch(document, /Avanzado \(⌘\)|Advanced \(⌘\)|Experto \(▤\)|Expert \(▤\)/);
  }
  assert.match(help, /Comparar con Good/);
  assert.match(help, /Explorar 3D/);
  assert.match(help, /Avanzado \(▤\)/);
  assert.match(cli, /Experto \(⌘\).*consola/);
  assert.match(cli, /Expert \(⌘\).*console/);
  assert.match(page, /visual=best/);
  assert.match(llms, /ok:true, preview:true/);
  assert.match(llms, /no a una herramienta MCP/);
});

test('los iconos documentados separan el selector Avanzado de la consola Experto real', async () => {
  const [game, readme] = await Promise.all([
    'admira-xp/index.html', 'admira-xp/scripts/life-README.md',
  ].map(path => readFile(new URL(path, repo), 'utf8')));
  assert.match(game, /<button\b[^>]*data-quad-toggle="right"[^>]*>▤<\/button>/);
  assert.match(game, /<button\b[^>]*id="pfExpert"[^>]*>⌘<\/button>/);
  assert.match(readme, /Avanzado \(▤\)/);
  assert.doesNotMatch(readme, /Avanzado \(⌘\)|Advanced \(⌘\)/);
  assert.equal(catalog.view_navigation.menu, 'Avanzado (▤)');
});

test('los ejemplos documentan entrada, estado y advertencia sin confundirse con herramientas MCP', () => {
  for (const item of catalog.features) {
    assert.ok(Array.isArray(item.commands), item.id);
    const seen = new Set();
    for (const entry of item.commands) {
      assert.match(entry.text, /^\/[A-Za-z]/, `${item.id}: comando`);
      nonempty(entry.entrypoint, `${item.id}: entrada explícita`);
      assert.match(entry.entrypoint, /__xtExec|xtAPI\.command/);
      assert.ok(['source_verified', 'warning'].includes(entry.status), `${item.id}: estado de comando`);
      nonempty(entry.note, `${item.id}: límites del ejemplo`);
      const key = `${entry.entrypoint}\n${entry.text}`;
      assert.ok(!seen.has(key), `${item.id}: ejemplo duplicado ${entry.text}`);
      seen.add(key);
    }
  }
});

test('cada herramienta referenciada existe en el manifest y respeta su clasificación de escritura', () => {
  const names = new Set(manifest.tools.map(tool => tool.name));
  assert.equal(names.size, manifest.server.tool_count);
  // The current manifest declares writes in auth.escritura rather than
  // per-tool annotations. Fail closed if that declaration changes format.
  const declaration = manifest.auth.escritura.match(/\(([^)]+)\)/);
  assert.ok(declaration, 'El manifest debe declarar las herramientas de escritura');
  const writes = new Set(declaration[1].split(',').map(name => name.trim()));
  assert.deepEqual([...writes].sort(), ['publish_asset', 'register_device']);
  assert.match(manifest.auth.escritura, /Authorization: Bearer/);
  for (const item of catalog.features) {
    assert.ok(Array.isArray(item.mcp.tools), item.id);
    const seen = new Set();
    for (const tool of item.mcp.tools) {
      assert.equal(tool.server, 'xpaceos', 'No atribuir al manifest local un contrato de otro servidor');
      assert.ok(names.has(tool.name), `${item.id}: herramienta inexistente ${tool.name}`);
      assert.equal(tool.access, writes.has(tool.name) ? 'write' : 'read', `${item.id}: acceso de ${tool.name}`);
      nonempty(tool.scope, `${item.id}: alcance de ${tool.name}`);
      if (tool.access === 'write') assert.match(tool.scope, /autorización/i);
      assert.ok(!seen.has(tool.name), `${item.id}: referencia MCP duplicada`);
      seen.add(tool.name);
    }
  }
});

test('el catálogo es documentación HTTP, no añade herramientas ni recursos MCP ficticios', () => {
  assert.equal(catalog.links.catalog, manifest.static_catalog.url);
  assert.equal(catalog.links.docs, manifest.static_catalog.docs);
  assert.equal(catalog.schema_version, manifest.static_catalog.schema_version);
  assert.equal(manifest.static_catalog.delivery, 'static-http');
  for (const tool of manifest.tools) assert.doesNotMatch(tool.name, /^funcionalidades$/);
  for (const resource of manifest.resources) assert.notEqual(resource.uri, 'xpaceos://funcionalidades');
  assert.match(feature('XP-F28').mcp.gap, /no es una nueva herramienta/i);
});

test('las evidencias son archivos locales existentes y sus líneas están dentro del archivo', async () => {
  const sources = new Map();
  for (const item of catalog.features) {
    assert.ok(Array.isArray(item.evidence) && item.evidence.length, `${item.id}: evidencias`);
    for (const reference of item.evidence) {
      nonempty(reference.path, `${item.id}: ruta`);
      assert.ok(!reference.path.startsWith('/') && !reference.path.includes('\\'), `${item.id}: ruta relativa`);
      const url = new URL(reference.path, repo);
      assert.ok(url.href.startsWith(repo.href) && !url.search && !url.hash, `${item.id}: evidencia fuera del repositorio`);
      if (!sources.has(url.href)) {
        assert.ok((await stat(url)).isFile(), `${item.id}: fuente no es archivo`);
        sources.set(url.href, (await readFile(url, 'utf8')).split('\n').length);
      }
      assert.ok(Number.isSafeInteger(reference.line) && reference.line > 0, `${item.id}: línea inválida`);
      assert.ok(reference.line <= sources.get(url.href), `${item.id}: línea fuera de ${reference.path}`);
      nonempty(reference.symbol, `${item.id}: contexto de evidencia`);
    }
  }
});

test('los aliases heredados problemáticos conservan advertencias y rutas alternativas', () => {
  for (const [id, text] of [
    ['XP-F11', '/hue'], ['XP-F15', '/staff train 1'], ['XP-F17', '/time night'],
    ['XP-F23', '/mapa'], ['XP-F23', '/equipo inicio ana 3 4'], ['XP-F23', '/red'],
    ['XP-F25', '/tienda close'],
  ]) assert.equal(command(id, text).status, 'warning', text);
  assert.equal(command('XP-F11', '/hue').entrypoint, 'xtAPI.command');
  assert.match(command('XP-F11', '/hue').note, /__xtExec no lo enruta/);
  assert.match(command('XP-F15', '/staff train 1').note, /retorna antes/);
  assert.match(command('XP-F17', '/time night').note, /numérico|parser/);
  assert.match(command('XP-F23', '/mapa').note, /heatmap/);
  assert.match(command('XP-F23', '/equipo inicio ana 3 4').note, /clausura|ámbito/);
  assert.match(command('XP-F23', '/red').note, /sin handler/);
  assert.match(command('XP-F25', '/tienda close').note, /sombreado/);
  assert.equal(command('XP-F23', '/map').status, 'source_verified');
  assert.equal(command('XP-F17', '/reloj 14:30').status, 'source_verified');
});

test('XPL y música no comparten falsamente /componer; /ad mantiene su entrada real', () => {
  const compose = command('XP-F02', '/compose <tipo> <temática>');
  assert.equal(compose.entrypoint, '__xtExec');
  assert.match(compose.note, /coste/);
  assert.match(compose.note, /\/componer.*XPL.*no música/);
  const composer = command('XP-F18', '/componer');
  assert.match(composer.entrypoint, /wrapper XPL/);
  assert.match(composer.note, /No es el alias musical/);
  assert.match(command('XP-F18', '/condicional on').note, /ejecutar comandos/);
  assert.equal(command('XP-F30', '/ad 1').entrypoint, '__xtExec');
});

test('el catálogo de espacios no se confunde con muebles ni el bocadillo con megafonía', () => {
  assert.ok(!feature('XP-F21').commands.some(entry => entry.text === '/catalogo'));
  assert.equal(command('XP-F10', '/catalogo').status, 'source_verified');
  assert.match(command('XP-F21', '/xpacio').note, /no abre el catálogo/);
  assert.ok(!feature('XP-F03').commands.some(entry => /^\/say\b/.test(entry.text)));
});

test('simulación de caja, pedidos, stock, personajes y promociones no promete operaciones reales', () => {
  assert.match(feature('XP-F13').good.detail, /no prueban inventario físico/i);
  assert.match(feature('XP-F16').good.detail, /no son movimientos de dinero real/i);
  for (const text of ['/pedido', '/devolucion']) {
    assert.match(command('XP-F27', text).note, /simulada/i);
    assert.match(command('XP-F27', text).note, /no crea un pedido logístico ni devuelve dinero real/i);
  }
  assert.match(feature('XP-F29').good.detail, /no acredita un robot físico/i);
  assert.match(command('XP-F29', '/robot on').note, /simulación/);
  assert.match(feature('XP-F30').good.detail, /no compra una campaña real/i);
  assert.match(feature('XP-F30').good.detail, /medios externos/i);
  assert.match(command('XP-F08', '/audienciaIN 8').note, /no debe presentarse como medición real/i);
});

test('las acciones físicas, remotas y de pago se mantienen separadas de la representación', () => {
  assert.match(feature('XP-F01').good.detail, /players conectados/i);
  assert.match(command('XP-F03', '/comunicar --elevenlabs texto').note, /coste/i);
  assert.match(command('XP-F03', '/comunicar off').note, /no garantiza cancelar.*remoto/i);
  assert.match(command('XP-F15', '/nuevoMiembro Laura azafata').note, /remoto.*autorización/i);
  assert.match(command('XP-F15', '/report Marta').note, /servicio remoto/i);
  assert.match(feature('XP-F25').good.detail, /\/door.*no un actuador físico/i);
  assert.match(feature('XP-F25').good.detail, /\/aroma.*\/ac.*simulados/i);
  assert.match(command('XP-F25', '/store close').note, /apagar hardware/i);
  assert.match(feature('XP-F24').good.detail, /abrirlo no ejecuta una compra/i);
  assert.match(feature('XP-F19').good.detail, /créditos.*autorización/i);
});

test('captura, socios y anonimización conservan procedencia y límites de privacidad', () => {
  assert.match(feature('XP-F07').good.detail, /enviar derivados de audiencia.*remoto/i);
  assert.match(feature('XP-F07').good.detail, /no asumir procesamiento exclusivamente local/i);
  assert.match(command('XP-F09', '/mupicam pixel').note, /no garantiza anonimización/i);
  assert.match(feature('XP-F14').good.detail, /socios simulados/i);
  assert.match(feature('XP-F14').good.detail, /servicio externo/i);
  assert.match(feature('XP-F14').good.detail, /no.*publicar datos personales/i);
});

test('guardar layout, cambiar vista y consultar identidad no se presentan como acciones equivalentes', () => {
  assert.match(feature('XP-F10').good.detail, /factory elimina.*copias/i);
  assert.match(command('XP-F10', '/layout save').note, /backend\/repositorio/i);
  for (const entry of allCommands.filter(entry => /^\/modo\b/.test(entry.text))) {
    assert.equal(entry.entrypoint, '__xtExec', 'No añadir /modo a la API síncrona');
  }
  assert.match(command('XP-F26', '/modo best').note, /no abre un Best terminado/i);
  assert.match(command('XP-F26', '/render 16bit').note, /no el nivel público Better/i);
  assert.match(prose('XP-F20'), /No reenviar órdenes visuales a Telegram/i);
  assert.match(feature('XP-F20').good.detail, /\/whoami.*no autentica/i);
  assert.match(feature('XP-F22').good.detail, /no es.*Blender.*ni un escáner fotogramétrico/i);
});
