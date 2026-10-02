import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BINDINGS_KEY,PREVIEW_CHANNEL,validContent} from '../inventario/product-bindings.mjs';
import {SHELF_PREVIEW_STATUS_CHANNEL,SHELF_PREVIEW_TTL} from '../admira-xp/scripts/shelf-screen-preview.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const manifest=JSON.parse(await read('mcp/manifest.json')),catalog=JSON.parse(await read('mcp/funcionalidades.json'));
const contract=manifest.shelf_product_content,guide=await read('admira-xp/docs/shelf-product-content.md');

test('both MCP documents share the Best product pilot identity, model revision and local preview protocol',async()=>{
 assert.deepEqual(catalog.shelf_product_content,contract);
 const parts=JSON.parse(await read('inventario/assets/catalog/02/best.parts.json')),products=parts.parts.filter(part=>part.kind==='product');
 assert.equal(contract.catalog_number,parts.number);assert.equal(contract.inventory_id,parts.inventory_id);assert.equal(contract.quality,parts.quality);assert.equal(contract.revision,parts.revision);
 assert.equal(contract.visual_products,products.length);assert.equal(contract.illustrative_references,new Set(products.map(part=>part.product_reference)).size);
 assert.equal(contract.mesh_attribute,parts.attribute);assert.equal(contract.association_storage,BINDINGS_KEY);assert.equal(contract.preview_channel,PREVIEW_CHANNEL);assert.equal(contract.preview_status_channel,SHELF_PREVIEW_STATUS_CHANNEL);
 assert.equal(contract.surface_id,'ds1');assert.equal(contract.context,'xtanco');assert.deepEqual(contract.preview_states,['ready','showing','error','stopped']);
 assert.equal(contract.cross_panel_status.maximum_age_ms,SHELF_PREVIEW_TTL);assert.equal(contract.cross_panel_status.schema_version,1);assert.equal(contract.cross_panel_status.context,'xtanco');assert.deepEqual(contract.cross_panel_status.phases,['showing','stopped']);
 assert.equal(contract.matrix_write,false);assert.equal(contract.physical_publication,false);assert.equal(contract.new_remote_tools,false);assert.equal(contract.new_cli_commands,false);assert.equal(contract.stock_count,false);
 assert.ok(contract.es&&contract.en);
});

test('documented links explicitly open the Best route and the saved association example uses valid numeric timestamps',()=>{
 const viewer=new URL(contract.viewer),twin=new URL(contract.twin);
 assert.equal(viewer.searchParams.get('asset'),'2');assert.equal(viewer.searchParams.get('quality'),'best');assert.equal(viewer.searchParams.get('select'),'products');
 assert.equal(twin.searchParams.get('autostart'),'xtanco');assert.equal(twin.searchParams.get('visual'),'best');assert.equal(twin.searchParams.get('select'),'products');
 const example=JSON.parse(guide.match(/```json\s+([\s\S]*?)```/)[1]);assert.equal(example.schema_version,1);assert.equal(example.context,'xtanco');
 for(const [reference,content]of Object.entries(example.bindings)){
  assert.match(reference,/^A02-0[1-6]$/);assert.equal(content.surfaceId,'ds1');assert.equal(typeof content.updatedAt,'number');assert.ok(Number.isFinite(content.updatedAt));assert.doesNotThrow(()=>validContent(content));
 }
});

test('bilingual help agrees on the pilot and release status keeps public verification pending until explicitly closed',async()=>{
 for(const path of ['admira-xp/help.html','help/index.html','help/cli/index.html']){
  const html=await read(path),section=html.match(/<section id="shelf-product-content">([\s\S]*?)<\/section>/)?.[1];assert.ok(section,path);assert.match(section,/lang="es"/);assert.match(section,/lang="en"/);assert.match(section,/visual=best/);assert.match(section,/ds1/);
 }
 assert.ok(['integration','implemented'].includes(contract.status));assert.ok(Array.isArray(contract.pending));
 if(contract.status==='integration'){assert.ok(contract.pending.length>0);assert.match(guide,/Piloto en integración/);}
 else {assert.equal(contract.pending.length,0);assert.doesNotMatch(guide,/Piloto en integración|Pilot under integration/);}
});
