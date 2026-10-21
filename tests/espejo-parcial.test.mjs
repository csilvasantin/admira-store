// Espejo parcial de xpaceos en admira.store (Carlos, 21-oct-2026): sólo la portada y lo que la portada necesita,
// nunca se borra nada, y lo propio del espejo (sello, castellano, marca admira.store) lo pone sello-y-verja.py después.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const origen=process.env.XPACEOS_CLON||join(root,'..','xpaceos');
const sync=readFileSync(join(root,'sync-desde-xpaceos.sh'),'utf8');
const sinComentarios=sync.replace(/^\s*#.*$/gm,'');

test('el script copia sólo la portada y sus assets, sin --delete y sin tocar admira-xp ni xpacios', () => {
  assert.match(sync, /ESPEJO_FICHEROS=\(index\.html lead-form\.css lead-form\.js data\/clientes-mapeo\.json favicon\.ico\)/);
  assert.match(sync, /ESPEJO_CARPETAS=\(assets\)/);
  assert.ok(!sinComentarios.includes('--delete'), 'nunca borra');
  assert.ok(!/admira-xp|xpacios/.test(sinComentarios), 'no toca el trabajo propio del espejo');
  assert.ok(sinComentarios.indexOf('rsync -a') < sinComentarios.indexOf('sello-y-verja.py'), 'la marca y el sello se ponen después de copiar');
  assert.match(sync, /firma\['version'\] = sello/, 'adopta el sello del origen conservando quién publica');
});

test('en seco (SYNC_DRY=1) enseña el plan y no cambia nada', {skip: !existsSync(join(origen,'.git')) && 'sin clon de xpaceos al lado'}, () => {
  const antes=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout;
  const r=spawnSync('bash',['./sync-desde-xpaceos.sh',origen],{cwd:root,env:{...process.env,SYNC_DRY:'1',SYNC_SHA:'HEAD'},encoding:'utf8'});
  assert.equal(r.status,0,r.stderr+r.stdout);
  assert.match(r.stdout,/Plan del espejo parcial/);assert.match(r.stdout,/fichero  index\.html/);assert.match(r.stdout,/carpeta  assets\//);assert.match(r.stdout,/no se copia nada/);
  assert.doesNotMatch(r.stdout,/admira-xp|xpacios/);
  const despues=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout;
  assert.equal(despues,antes,'el modo en seco no toca el repo');
});
