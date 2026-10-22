import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,copyFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=dirname(fileURLToPath(import.meta.url));
function block(file,start,end){const source=readFileSync(join(root,file),'utf8'),a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,file);return source.slice(a,b);}
const cloudflare=block('.github/workflows/cloudflare-pages.yml','          release="','          novedades=');
const staticArtifact=block('.github/workflows/pages.yml','          release="','          mkdir -p _site');
const guards=cloudflare+'\n'+staticArtifact;
assert.doesNotMatch(guards,/wrangler|vault-get|git push/);
const run=cwd=>spawnSync('bash',['-c','set -euo pipefail\n'+guards],{cwd,encoding:'utf8',env:{PATH:process.env.PATH}});

test('both real CI metadata guards accept the canonical static signature; perimeter is present',()=>{
  assert.ok(existsSync(join(root,'functions/_perimetro.js')));
  const result=run(root);assert.equal(result.status,0,result.stdout+result.stderr);
});

test('CI rejects stale static version and mismatched signature before producing a deploy artifact',()=>{
  for(const stale of ['version','signature']){
    const fixture=mkdtempSync(join(tmpdir(),'admira-store-release-'));
    try{for(const name of ['index.html','release-signature.json'])copyFileSync(join(root,name),join(fixture,name));
      const sig=JSON.parse(readFileSync(join(fixture,'release-signature.json'),'utf8'));sig[stale]=stale==='version'?'v.old':'wrong signer';writeFileSync(join(fixture,'release-signature.json'),JSON.stringify(sig));
      assert.notEqual(run(fixture).status,0,stale);assert.equal(existsSync(join(fixture,'_site')),false);
    }finally{rmSync(fixture,{recursive:true,force:true});}
  }
});

test('404 real y llms.txt de texto: sin ellos Pages sirve la portada privada a cualquier ruta inexistente (DEC-mvjb0o1k2pn8)', () => {
  const notFound = readFileSync(join(root, '404.html'), 'utf8');
  assert.match(notFound, /href="\/auth\/login"/);
  assert.doesNotMatch(notFound, /admiranext-version|gemelo|catálogo|clientes/i);
  assert.ok(notFound.length < 4000, '404.html debe ser mínimo, sin contenido privado');
  const llms = readFileSync(join(root, 'llms.txt'), 'utf8');
  assert.match(llms, /https:\/\/mcp\.admira\.store\/llms\.txt/);
  assert.match(llms, /\/mcp\//);
  assert.doesNotMatch(llms, /<html|<!doctype/i);
});

test('indexación propia de admira.store: robots/sitemap no son los de XpaceOS, la portada privada va noindex y el sync no los espeja (FLT-102618)', () => {
  const robots = readFileSync(join(root, 'robots.txt'), 'utf8');
  assert.doesNotMatch(robots, /XpaceOS|xpaceos\.com/);
  assert.match(robots, /^Disallow: \/$/m);
  for (const pub of ['/admira-xp/', '/xpacios/', '/mcp/', '/llms.txt']) assert.match(robots, new RegExp('^Allow: ' + pub.replace(/[./]/g, '\\$&') + '$', 'm'), pub);
  assert.match(robots, /^Sitemap: https:\/\/www\.admira\.store\/sitemap\.xml$/m);
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /xpaceos\.com/);
  assert.match(sitemap, /<loc>https:\/\/www\.admira\.store\/admira-xp\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/www\.admira\.store\/mcp\/<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/www\.admira\.store\/<\/loc>/, 'la portada es privada: fuera del sitemap');
  const index = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(index, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(index, /<link rel="canonical" href="https:\/\/www\.admira\.store\/">/);
  const sync = readFileSync(join(root, 'sync-desde-xpaceos.sh'), 'utf8');
  assert.match(sync, /PROPIOS_DEL_ESPEJO=\(robots\.txt sitemap\.xml llms\.txt 404\.html\)/);
  assert.doesNotMatch(sync.match(/ESPEJO_FICHEROS=\(([^)]*)\)/)[1], /robots\.txt|sitemap\.xml|llms\.txt|404\.html/);
  const verja = readFileSync(join(root, 'sello-y-verja.py'), 'utf8');
  assert.match(verja, /noindex,nofollow/);
});
