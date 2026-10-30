#!/usr/bin/env node
// Puerta de tests antes de publicar (Carlos, 30-oct-2026). Ejecuta todos los *.test.mjs del repo y para el
// despliegue y el espejo diario si aparece un fallo NUEVO. Los fallos ya conocidos viven, cada uno con su
// motivo, en tests/fallos-conocidos.json: no paran nada, pero tampoco se olvidan. Al arreglar uno hay que
// quitarlo de la lista; aquí solo se avisa, para que una buena noticia no frene una publicación.
//
// Uso (desde la raíz del repo): node scripts/ci-tests.mjs
// En GitHub Actions deja además anotaciones y el resumen del paso.
import {run} from 'node:test';
import {execFileSync, spawnSync} from 'node:child_process';
import {appendFileSync, readFileSync} from 'node:fs';
import {relative} from 'node:path';

const LISTA = 'tests/fallos-conocidos.json';
const TIMEOUT_MS = 120_000;
const enActions = Boolean(process.env.GITHUB_ACTIONS);

const barras = (ruta) => String(ruta || '').split('\\').join('/');
const rutaRelativa = (ruta) => barras(/^(file:|[a-zA-Z]:|\/)/.test(ruta || '') ? relative(process.cwd(), ruta.replace(/^file:\/\/\/?/, '')) : ruta);
const escaparMensaje = (texto) => String(texto).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escaparPropiedad = (texto) => escaparMensaje(texto).replace(/:/g, '%3A').replace(/,/g, '%2C');
const resumirError = (error) => String(error?.cause?.message || error?.message || error || '').replace(/\s+/g, ' ').trim().slice(0, 300);

function ficherosDeTest() {
  return execFileSync('git', ['ls-files', '*.test.mjs'], {encoding: 'utf8'}).split('\n').filter(Boolean);
}

async function ejecutarNode(ficheros) {
  const fallos = [];
  let pasan = 0;
  let omitidos = 0;
  const flujo = run({files: ficheros, timeout: TIMEOUT_MS, concurrency: true});
  flujo.on('test:pass', ({skip, details}) => {
    if (details?.type === 'suite') return;
    if (skip !== undefined) omitidos += 1; else pasan += 1;
  });
  flujo.on('test:fail', ({name, file, line, details}) => {
    // El padre de una suite o de un fichero repite lo que ya dijeron sus tests: no se cuenta dos veces.
    if (details?.error?.failureType === 'subtestsFailed') return;
    const fichero = rutaRelativa(file || name);
    const esFichero = barras(name) === fichero || barras(name).endsWith('/' + fichero);
    fallos.push({clave: `${fichero}::${esFichero ? '(fichero)' : name}`, fichero, linea: line || 1, error: resumirError(details?.error)});
  });
  // Consumir el flujo es lo que hace avanzar los tests; lo que imprimen no interesa aquí.
  for await (const _ of flujo) void _;
  return {fallos, pasan, omitidos};
}

// El único test en Python del repo vigila el castellano del espejo. Sin python3 (un Windows, por ejemplo) se omite.
function ejecutarPython() {
  const fichero = 'tests/sello-castellano.test.py';
  const r = spawnSync('python3', [fichero], {encoding: 'utf8'});
  if (r.error || (process.platform === 'win32' && r.status === 9009)) return {fallos: [], pasan: 0, omitidos: 1};
  if (r.status === 0) return {fallos: [], pasan: 1, omitidos: 0};
  return {fallos: [{clave: `${fichero}::(fichero)`, fichero, linea: 1, error: resumirError(r.stderr || r.stdout)}], pasan: 0, omitidos: 0};
}

const conocidos = JSON.parse(readFileSync(LISTA, 'utf8')).fallos;
const ficheros = ficherosDeTest();
const node = await ejecutarNode(ficheros);
const python = ejecutarPython();
const fallos = [...node.fallos, ...python.fallos].sort((a, b) => a.clave.localeCompare(b.clave));
const pasan = node.pasan + python.pasan;
const omitidos = node.omitidos + python.omitidos;

const nuevos = fallos.filter((f) => !(f.clave in conocidos));
const siguen = fallos.filter((f) => f.clave in conocidos);
const claves = new Set(fallos.map((f) => f.clave));
const arreglados = Object.keys(conocidos).filter((c) => !claves.has(c));

const titular = `${ficheros.length} ficheros · ${pasan} pasan · ${nuevos.length} fallos nuevos · ${siguen.length} conocidos · ${omitidos} omitidos`;
console.log(`\nTests: ${titular}`);
for (const f of nuevos) console.log(`  ✖ NUEVO  ${f.clave}\n           ${f.error}`);
for (const c of arreglados) console.log(`  ✓ ya pasa, quítalo de ${LISTA}: ${c}`);

if (enActions) {
  for (const f of nuevos.slice(0, 40)) {
    console.log(`::error file=${escaparPropiedad(f.fichero)},line=${f.linea},title=${escaparPropiedad('Test nuevo en rojo')}::${escaparMensaje(`${f.clave}\n${f.error}`)}`);
  }
  if (arreglados.length) console.log(`::warning title=${escaparPropiedad(`Quitar de ${LISTA}`)}::${escaparMensaje(arreglados.join('\n'))}`);
  const detalle = fallos.map((f) => `${f.clave}\n    ${f.error}`).join('\n').slice(0, 60_000);
  console.log(`::notice title=${escaparPropiedad('Resumen de tests')}::${escaparMensaje(`${titular}\n${detalle}`)}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lineas = [`### Tests\n\n${titular}\n`];
    if (nuevos.length) lineas.push('**Fallos nuevos**\n', ...nuevos.map((f) => `- \`${f.clave}\`: ${f.error}`), '');
    if (arreglados.length) lineas.push(`**Ya pasan: quitar de \`${LISTA}\`**\n`, ...arreglados.map((c) => `- \`${c}\``), '');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lineas.join('\n') + '\n');
  }
}

if (pasan === 0) {
  console.error('✖ No se ha ejecutado ningún test: algo va mal en la puerta, no en los tests.');
  process.exit(1);
}
process.exit(nuevos.length ? 1 : 0);
