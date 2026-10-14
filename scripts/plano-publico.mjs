#!/usr/bin/env node
// Copia pública de un plano de Xpacio para el repositorio (que es público en GitHub):
//   node scripts/plano-publico.mjs <plano-completo.json> data/xpacios/<id>.json
// El plano completo (ITIL, screenIds, dirección) vive en admira.biz y se lee con sesión.
import {readFileSync, writeFileSync} from 'node:fs';
import {planoPublico} from '../xpacios/plano-publico.mjs';
const [entrada, salida] = process.argv.slice(2);
if (!entrada || !salida) { console.error('Uso: node scripts/plano-publico.mjs <plano-completo.json> <salida.json>'); process.exit(2); }
writeFileSync(salida, JSON.stringify(planoPublico(JSON.parse(readFileSync(entrada, 'utf8'))), null, 1) + '\n');
console.log(`✓ ${salida}`);
