import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CLASSIC_FLOATING_PANELS} from '../admira-xp/scripts/xp-floating-runtime.mjs?v=windows-menu-1';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const manifest=JSON.parse(await read('mcp/manifest.json')),catalog=JSON.parse(await read('mcp/funcionalidades.json'));
const contract=manifest.floating_panels,guide=await read('admira-xp/docs/floating-panels.md');

test('MCP manifest and functional catalogue agree on window controls, lifecycle and preserved state',()=>{
 assert.deepEqual(catalog.floating_panels,contract);
 assert.deepEqual(contract.views,['good','better','best','matrix']);
 assert.equal(contract.opt_in.automatic_scanning,false);
 assert.equal(contract.position_storage.preserve_legacy_key,'xtanco_panels_geom_v1');
 assert.equal(contract.position_storage.scope,'same browser and origin');
 assert.equal(contract.movement.step_px,20);assert.equal(contract.movement.shift_step_px,5);
 assert.deepEqual(contract.api.lifecycle,['open','close','restore','clamp','dispose']);
 assert.equal(contract.close.control,'button');assert.ok(contract.close.accessible_name.es&&contract.close.accessible_name.en);
 assert.equal(contract.close.generated_control,'button[type=button]');
 assert.deepEqual(contract.close.existing_non_button,{role:'button',tabindex:0,keyboard:['Enter','Space'],authored_handler:'preserved'});
 assert.ok(contract.reopen.menu.es&&contract.reopen.menu.en);assert.equal(contract.reopen.usual_tool_entry,true);
 assert.match(contract.product_preview_exception,/ds1/);assert.match(contract.product_preview_exception,/retained/);
 for(const name of ['new_remote_tools','new_cli_commands','physical_publication','matrix_write'])assert.equal(contract[name],false,name);
 assert.ok(contract.es&&contract.en);assert.match(contract.es,/historial CLI/);assert.match(contract.en,/CLI history/);
});

test('the published Classic allowlist and UI-only reopening contract match the runtime declarations',()=>{
 const declared=[...contract.audited_families.classic,...contract.audited_families.other_tools,...contract.audited_families.status_metadata];
 assert.deepEqual([...declared].sort(),CLASSIC_FLOATING_PANELS.map(item=>item.selector).sort());
 assert.equal(new Set(declared).size,declared.length);
 assert.match(contract.classic_adapter_contract.scan,/selector allowlist/);assert.match(contract.classic_adapter_contract.scan,/no interval/);
 assert.equal(contract.classic_adapter_contract.menu_host,'#advFloatingWindows');assert.equal(contract.classic_adapter_contract.menu_parent,'.quad-right');
 assert.deepEqual(contract.classic_adapter_contract.snapshot_fields,['hidden','inline display','aria-hidden','show/visible/on/tp-on classes']);
 assert.match(contract.classic_adapter_contract.reopening,/connected DOM/);assert.match(contract.classic_adapter_contract.xpl_fallback,/no rule activation or setOn call/);
 assert.match(contract.reopen.list,/registered, live tools/);assert.match(contract.reopen.selection_card,/select the scene object again/);
 assert.match(guide,/inventario\/shelf-product-panel\.mjs/);assert.match(guide,/role=button/);assert.match(guide,/setOn/);
});

test('web help, tutorial, CLI help and guide expose bilingual reopening and keyboard instructions',async()=>{
 for(const path of ['admira-xp/help.html','help/index.html','help/cli/index.html']){
  const html=await read(path),section=html.match(/<section id="floating-panels">([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section,path);assert.match(section,/lang="es"/);assert.match(section,/lang="en"/);
  assert.match(section,/Avanzado → Ventanas/);assert.match(section,/Advanced → Windows/);
  assert.match(section,/Tab/);assert.match(section,/20 px/);assert.match(section,/5 px/);assert.match(section,/ds1/);
  assert.ok(section.includes(contract.docs),path);
 }
 for(const api of ['attachFloatingPanel','registerFloatingPanel','mountFloatingPanelMenu'])assert.ok(guide.includes(api),api);
 assert.match(guide,/xtanco_panels_geom_v1/);assert.match(guide,/## ES/);assert.match(guide,/## EN/);
 assert.match(guide,/canvas/);assert.match(guide,/\/marca/);assert.match(guide,/\/brand/);
 for(const field of ['shared_controller','shared_movement','shared_styles','docs','tutorial','cli_help']){
  const url=new URL(contract[field]);assert.equal(url.protocol,'https:');assert.equal(url.hostname,'www.xpaceos.com');
 }
});

test('release documentation retains pending verification until the integration is explicitly closed',async()=>{
 assert.ok(['integration','implemented'].includes(contract.status));assert.ok(Array.isArray(contract.pending));
 if(contract.status==='integration'){
  assert.ok(contract.pending.length>0);assert.match(guide,/En integración/);assert.match(guide,/Under integration/);
 }else{
  assert.equal(contract.pending.length,0);assert.doesNotMatch(guide,/\*\*En integración\.\*\*|\*\*Under integration\.\*\*/);
 }
 for(const path of ['admira-xp/help.html','help/index.html','help/cli/index.html']){
  const html=await read(path),statuses=[...html.matchAll(/data-floating-panels-status="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(statuses,[contract.status,contract.status],path);
 }
});
