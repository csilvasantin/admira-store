import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('Cafebrería dropdown route agrees with the bilingual public contract and selector release',async()=>{
 const manifest=JSON.parse(await read('mcp/manifest.json')),catalogue=JSON.parse(await read('mcp/funcionalidades.json'));
 assert.deepEqual(manifest.project_selection,catalogue.project_selection);
 const route=manifest.project_selection.cafebreria_demo;
 assert.equal(route.destination,'https://www.admira.store/xpacios/cafebreria/');
 assert.equal(route.venue_id,'demo-cafebreria');assert.equal(route.mode,'public demo only');
 for(const path of ['admira-xp/help.html','help/index.html','help/cli/index.html','admira-xp/docs/project-selection.md']){
  const text=await read(path);assert.ok(text.includes(route.es),path+' ES');assert.ok(text.includes(route.en),path+' EN');
 }
 assert.ok((await read('admira-xp/index.html')).includes('scripts/project-selector.mjs?v=cafebreria-route-1'));
 assert.ok((await read('admira-xp/scripts/project-selector.mjs')).includes('central-project-client.mjs?v=cafebreria-route-1'));
});
