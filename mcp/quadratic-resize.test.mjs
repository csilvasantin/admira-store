import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('shell and floating sizing contract agrees with both public catalogues and bilingual instructions',async()=>{
 const manifest=JSON.parse(await read('mcp/manifest.json')),catalogue=JSON.parse(await read('mcp/funcionalidades.json'));
 assert.deepEqual(manifest.quadratic_resize,catalogue.quadratic_resize);
 assert.deepEqual(manifest.quadratic_resize.dock_axes,{left:'width',right:'width',expert:'height'});
 for(const path of ['admira-xp/help.html','help/index.html','help/cli/index.html']){
  const html=await read(path),section=html.match(/<section id="quadratic-resize">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section,path);for(const text of ['lang="es"','lang="en"','hacia abajo','downward','20 px','5 px','doble clic','double-click'])assert.ok(section.includes(text),text);
 }
 assert.equal(manifest.quadratic_resize.new_remote_tools,false);assert.equal(manifest.quadratic_resize.physical_publication,false);
});
test('all shell consumers use one release while existing CLI and brand contracts remain callable',async()=>{
 const {glob}=await import('node:fs/promises');
 const root=new URL('../',import.meta.url).pathname;
 for await(const path of glob('**/*.html',{cwd:root,exclude:['.git/**']})){
  const html=await read(path);
  for(const match of html.matchAll(/xpace-shell\.(?:js|css)\?v=([^"']+)/g))assert.equal(match[1],'20261003-panels-2',path);
 }
 const shell=createRequire(import.meta.url)('../assets/xpace-shell.js');
 assert.equal(shell.parseCommand('/marca starbucks').verb,'marca');
 assert.equal(shell.isAvatarCommand('/cli ayudante on'),true);
 assert.ok(shell.HISTORY_KEY);assert.ok(shell.TWIN_VERBS.includes('inventario'));
});
