import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseVisualCommand} from '../admira-xp/scripts/xtanco-visual-command.mjs';
import {POS_DEMO_STEPS} from '../admira-xp/scripts/pos-demo.mjs';
const catalog=JSON.parse(readFileSync(new URL('../admira-xp/demos/catalog.json',import.meta.url),'utf8'));
test('agent catalogue names actual guided commands and keeps proposed tour commands unavailable',()=>{
 assert.equal(catalog.schema_version,1);assert.equal(catalog.runtime.nominal_drop_ms,POS_DEMO_STEPS.drop);
 for(const command of catalog.runtime.guided_commands)assert.notEqual(parseVisualCommand(command)?.guided,'invalid',command);
 for(const command of catalog.proposed_general_tour.commands_not_implemented)assert.ok(!catalog.runtime.guided_commands.includes(command),command);
 assert.equal(catalog.runtime.remote_mcp_launch_tool,false);assert.match(catalog.scope,/documentation-only/);
});
test('scenario IDs are unique with bilingual labels, real controls, evidence and cleanup',()=>{
 assert.equal(new Set(catalog.scenarios.map(s=>s.id)).size,catalog.scenarios.length);
 for(const s of catalog.scenarios){assert.ok(s.title.es&&s.title.en&&s.steps.length&&s.acceptance.length&&s.cleanup.length,s.id);assert.equal(s.automation.general_tour_adapter,'pending');}
 assert.deepEqual(catalog.scenarios.filter(s=>s.automation.current_mode==='guided').map(s=>s.id),['tpv-muffin']);
 for(const s of catalog.scenarios.filter(s=>s.automation.current_mode==='playback-command'))for(const c of s.automation.current_commands)assert.ok(parseVisualCommand(c)?.demo,c);
});
test('continuity guides reference existing local sources rather than nonexistent modules',()=>{
 const doc=readFileSync(new URL('../admira-xp/docs/xtore-demos-continuity.md',import.meta.url),'utf8');
 for(const file of ['pos-demo.mjs','matrix-pos-experience.mjs','pos-checkout-display.mjs','retail-rules.mjs','retail-rule-composer.mjs','retail-media-display.mjs','matrix-panorama.mjs','xtanco-visual-command.mjs']){assert.ok(doc.includes(file));assert.ok(existsSync(new URL('../admira-xp/scripts/'+file,import.meta.url)));}
 for(const file of ['../admira-xp/help.html','../help/index.html','../help/cli/index.html','../mcp/index.html'])assert.ok(readFileSync(new URL(file,import.meta.url),'utf8').includes('id="demo-catalog"'),file);
});

test('local Store rehearsal contract exposes five management IDs, explicit native TPV and no remote launch',()=>{
 const local=catalog.runtime.local_management;
 assert.deepEqual(local.ids,['store/voz','store/musica','store/imagenes','store/video','store/tpv']);assert.equal(local.native_tpv_command,'/demo tpv');assert.equal(local.native_pause_resume,false);assert.equal(local.prepared_data_only,true);
 for(const command of ['/demo help','/demo 1','/demo 5','/demo caja','/demo auto','/demo pausa','/demo resume','/demo next','/demo stop'])assert.ok(catalog.runtime.guided_commands.includes(command),command);
 const manifest=JSON.parse(readFileSync(new URL('../mcp/manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.demo_catalog.remote_mcp_demo_launch,false);assert.deepEqual(manifest.demo_soluciones.commands,catalog.runtime.guided_commands);
 assert.match(manifest.demo_soluciones.es,/sin pausa/);assert.match(manifest.demo_soluciones.en,/without pause/);
 for(const file of ['../admira-xp/help.html','../help/index.html','../help/cli/index.html','../mcp/index.html'])assert.ok(readFileSync(new URL(file,import.meta.url),'utf8').includes('id="store-local-demos"'),file);
});
