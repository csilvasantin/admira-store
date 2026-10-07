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
