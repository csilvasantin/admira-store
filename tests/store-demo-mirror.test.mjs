import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
test('daily mirror rejects missing or overwritten Store runtime before sync and accepts an equivalent published source',()=>{
 const target=mkdtempSync(join(tmpdir(),'store-demo-mirror-'));const manifest=JSON.parse(readFileSync(join(root,'mcp/manifest.json')));
 try{
  const paths=new Set(['mcp/manifest.json','mcp/funcionalidades.json','admira-xp/index.html',...manifest.retained_ui_contract.files,...manifest.store_demo_contract.files,...manifest.store_demo_contract.help_files]);
  for(const path of paths){mkdirSync(join(target,path,'..'),{recursive:true});copyFileSync(join(root,path),join(target,path));}
  const run=()=>spawnSync(process.execPath,[join(root,'scripts/validate-mirror-contract.mjs'),target,root],{encoding:'utf8'});
  assert.equal(run().status,0);
  const incoming=structuredClone(manifest);delete incoming.store_demo_contract;writeFileSync(join(target,'mcp/manifest.json'),JSON.stringify(incoming));assert.notEqual(run().status,0);
  writeFileSync(join(target,'mcp/manifest.json'),JSON.stringify(manifest));writeFileSync(join(target,'admira-xp/scripts/store-demo-bridge.mjs'),'// obsolete source');assert.notEqual(run().status,0);
  copyFileSync(join(root,'admira-xp/scripts/store-demo-bridge.mjs'),join(target,'admira-xp/scripts/store-demo-bridge.mjs'));
  const html=readFileSync(join(target,'admira-xp/index.html'),'utf8');writeFileSync(join(target,'admira-xp/index.html'),html.replace('scripts/store-demo-avatar.mjs?v=local-autopilot-1','scripts/old-avatar.mjs'));assert.notEqual(run().status,0);
  const sync=readFileSync(join(root,'sync-desde-xpaceos.sh'),'utf8');assert.ok(sync.indexOf('validate-mirror-contract.mjs')<sync.indexOf('rsync -a --delete'));
 }finally{rmSync(target,{recursive:true,force:true});}
});
