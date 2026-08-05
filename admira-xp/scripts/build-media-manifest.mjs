#!/usr/bin/env node
// Genera los manifests de medios del gemelo/XpaceOS escaneando carpetas:
//   - music/*.mp3              → music/manifest.json            (hilo musical)
//   - assets/videos/signage_*.mp4 → assets/videos/manifest.json (signage)
// "Soltar y listo": copia el fichero a su carpeta (mp3 a music/, vídeo
// signage_<algo>.mp4 a assets/videos/) y haz push; la GitHub Action regenera el
// manifest y la página lo lee. Nombre bonito opcional en el titles.json de cada
// carpeta ({ "archivo": "Nombre - Artista" }); si no, se deriva del fichero.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = join(dirname(fileURLToPath(import.meta.url)), '..'); // admira-xp/

// Conjuntos de medios: dir relativo a admira-xp + qué ficheros cuentan.
const SETS = [
  { dir: 'music', match: (f) => /\.mp3$/i.test(f) },
  { dir: 'assets/videos', match: (f) => /^signage_.*\.mp4$/i.test(f) }, // excluye precarga_*
  { dir: 'assets/images-signage', match: (f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f) },
];

function prettify(file) {
  return file
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

for (const set of SETS) {
  const dirAbs = join(BASE, set.dir);
  let titles = {};
  try { titles = JSON.parse(readFileSync(join(dirAbs, 'titles.json'), 'utf8')); } catch {}
  const files = readdirSync(dirAbs).filter(set.match);
  // Orden: curados (orden de titles.json) que existan, luego el resto alfabético.
  const curated = Object.keys(titles).filter((f) => files.includes(f));
  const extras = files.filter((f) => !curated.includes(f)).sort();
  const manifest = [...curated, ...extras].map((file) => ({
    file: `${set.dir}/${file}`,
    name: titles[file] || prettify(file),
  }));
  writeFileSync(join(dirAbs, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${set.dir}/manifest.json: ${manifest.length} pista(s)`);
  for (const m of manifest) console.log(`  · ${m.name}  (${m.file})`);
}
