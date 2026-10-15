#!/usr/bin/env node
// Copia local de los 36 planos de los 18 espacios Altadis y de su índice (misión
// DCL-d7966deb02734a6f34beb54e). El visor /xpacios/altadis-18/ pide primero los de admira.biz
// (equipo del Arquitecto, clearchannel-tv) y, si no responden, estas copias: son el respaldo del
// día de la presentación. Vuelve a correrlo cada vez que el Arquitecto publique planos nuevos.
//
//   node scripts/altadis-18-planos.mjs                 # baja índice + 36 planos de www.admira.biz
//   node scripts/altadis-18-planos.mjs --desde <dir>   # o los copia de un directorio (p. ej. el
//                                                      # worktree del Arquitecto, data/xpacios)
//
// Todo se valida con espacios.mjs antes de escribir; si un plano no vale, no se escribe nada.
// Se guarda la versión pública (planoEspacioPublico): sin campos del ITIL aunque vengan a null.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarIndice, validarPlanoEspacio, planoEspacioPublico, INDICE_COMPARTIDO, TIPOS } from '../xpacios/altadis-18/espacios.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const SALIDA = join(repo, 'xpacios/altadis-18/planos');
const args = process.argv.slice(2);
const i = args.indexOf('--desde');
const base = i >= 0 && args[i + 1] ? args[i + 1] : INDICE_COMPARTIDO.replace(/\/altadis-18\.json$/, '');

async function leer(nombre) {
  if (/^https:\/\//.test(base)) {
    const r = await fetch(`${base.replace(/\/$/, '')}/${nombre}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${nombre}: HTTP ${r.status}`);
    return r.json();
  }
  const p = join(base, nombre);
  if (!existsSync(p)) throw new Error(`No existe ${p}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

const indice = await leer('altadis-18.json');
const vi = validarIndice(indice);
if (vi.errores.length) { console.error(`✖ Índice no válido: ${vi.errores.join(' · ')}`); process.exit(1); }
const avisos = [...vi.avisos], planos = new Map();
for (const f of indice.formatos) for (const tipo of TIPOS) {
  const id = f.espacios[tipo], plan = await leer(`${id}.json`);
  const v = validarPlanoEspacio(plan, f);
  if (v.errores.length || plan.id !== id) { console.error(`✖ ${id}: ${[...v.errores, ...(plan.id !== id ? [`es el plano de «${plan.id}»`] : [])].join(' · ')}`); process.exit(1); }
  avisos.push(...v.avisos.map(a => `${id}: ${a}`));
  planos.set(id, planoEspacioPublico(plan));
}
mkdirSync(SALIDA, { recursive: true });
writeFileSync(join(SALIDA, 'altadis-18.json'), JSON.stringify(indice, null, 1) + '\n');
for (const [id, plan] of planos) writeFileSync(join(SALIDA, `${id}.json`), JSON.stringify(plan, null, 1) + '\n');
console.log(`✓ índice + ${planos.size} planos (${indice.version}) de ${base} en xpacios/altadis-18/planos/`);
for (const a of avisos) console.log(`  · aviso: ${a}`);
