import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseVisualCommand} from '../admira-xp/scripts/xtanco-visual-command.mjs';
import {POS_DEMO_STEPS} from '../admira-xp/scripts/pos-demo.mjs';
const catalog=JSON.parse(readFileSync(new URL('../admira-xp/demos/catalog.json',import.meta.url),'utf8'));
test('agent catalogue names actual guided commands and keeps proposed tour commands unavailable',()=>{
 assert.equal(catalog.schema_version,1);assert.equal(catalog.runtime.nominal_drop_ms,POS_DEMO_STEPS.drop);
 for(const command of catalog.runtime.guided_commands)assert.notEqual(parseVisualCommand(command)?.guided,'invalid',command);
 for(const command of catalog.proposed_general_tour.commands_not_implemented)assert.equal(parseVisualCommand(command)?.guided,'invalid',command);
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
