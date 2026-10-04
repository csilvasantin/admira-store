import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {actorCollisionRadius} from './physical-colliders.mjs';
import {diagnosePassage} from './passage-diagnostic.mjs';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const surfaces=['../help.html','../../help/index.html','../../help/cli/index.html','../../mcp/index.html'];
const guide=await read('../docs/check-passage.md');
const manifest=JSON.parse(await read('../../mcp/manifest.json'));
const catalog=JSON.parse(await read('../../mcp/funcionalidades.json'));

test('every required web help has one bilingual passage topic with virtual-door and diagnostic scope',async()=>{
  for(const path of surfaces){
    const html=await read(path),sections=[...html.matchAll(/<section id="check-passage">([\s\S]*?)<\/section>/g)];
    assert.equal(sections.length,1,path);
    const content=sections[0][1];
    for(const phrase of ['lang="es"','lang="en"','Cuerpo','Persona','Body','Person','Comprobar','Check','0,72','0,52','0.72','0.52','abierta virtualmente','virtually open','no guarda ni activa People','save or enable People','check-passage.md','xpaceos://help'])assert.ok(content.includes(phrase),`${path}: ${phrase}`);
  }
});

test('tutorial and guide explain destination-preserving blocker selection, map visibility and undo recomputation',async()=>{
  const tutorial=(await read('../../help/index.html')).match(/<section id="check-passage">([\s\S]*?)<\/section>/)[1];
  for(const text of [guide,tutorial]){
    for(const phrase of ['Ver mapa de dureza','Show hardness map','Paso libre','Paso bloqueado','Passage clear','Passage blocked','Deshacer','Undo','última pose válida','last valid pose'])assert.ok(text.includes(phrase),phrase);
    assert.match(text,/conservando el destino|destino comprobado se conserva/);
    assert.match(text,/retaining the destination|checked destination is retained/);
  }
  assert.match(guide,/zona de acceso del mueble/);assert.match(guide,/selected furniture.*access area|access area of the selected furniture/);
  assert.match(guide,/no comprueba su barrido/);assert.match(guide,/does not.*check its opening sweep/);
});

test('manifest and catalog publish identical diagnostic contracts tied to actual physical body radii',()=>{
  assert.deepEqual(manifest.check_passage,catalog.check_passage);
  const contract=manifest.check_passage;
  assert.equal(contract.status,'implemented');assert.equal(contract.editor_tier,'better');
  assert.deepEqual(contract.entry_qualities,['good','better','best']);
  assert.equal(contract.actors.human.radius_floor_tiles,actorCollisionRadius({kind:'staff'}));
  assert.equal(contract.actors.unitree.radius_floor_tiles,actorCollisionRadius({kind:'unitreeBot',robot:true}));
  assert.deepEqual(contract.results,['clear','blocked','unavailable']);
  assert.match(contract.clear_contract,/complete entry-to-destination/);
  assert.match(contract.blockers,/sufficient set.*no globally minimal/);
  assert.match(contract.blocker_selection,/destination retained/);
  assert.ok(contract.recompute.includes('valid-preview'));assert.ok(contract.recompute.includes('undo'));
});

test('entrance unavailability and pending ITIL/IoT are explicit without inventing a Cafebrería portal',async()=>{
  const contract=manifest.check_passage;
  assert.match(contract.cafebreria,/unavailable.*entrance_unconfigured.*no invented portal/);
  const imported=diagnosePassage({active:true,roomId:'cafebreria',imported:true,cols:14,rows:8,layout:[]},{actor:'human'});
  assert.equal(imported.status,'unavailable');assert.equal(imported.reason,'entrance_unconfigured');assert.equal(imported.route,null);
  assert.ok(contract.pending.includes('B: Show ITIL in scene'));assert.ok(contract.pending.includes('C: IoT pilot'));
  for(const text of [guide,await read('../../mcp/llms.txt'),await read('../../README.md')]){
    for(const phrase of ['Cafebrería','portal','ITIL','IoT','Pendientes B y C','Pending B and C'])assert.ok(text.includes(phrase),phrase);
    assert.match(text,/no (?:inventa|presenta).*entrada|no presenta un falso paso libre|never shows a false clear passage/);
    assert.match(text,/no (?:guarda|activa)|does not.*(?:save|enable People)/);
  }
});

test('diagnostic help retains 35 existing MCP tools, resources and legacy editor IDs rather than adding remote controls',()=>{
  const contract=manifest.check_passage;
  assert.equal(manifest.server.version,'2.12.29');assert.equal(manifest.server.tool_count,35);assert.equal(manifest.tools.length,35);
  assert.equal(new Set(manifest.tools.map(t=>t.name)).size,35);
  assert.equal(manifest.tools.some(t=>/passage|actor|collision|people|unitree/.test(t.name)),false);
  assert.equal(contract.new_remote_tools,false);assert.equal(contract.mutates_scene,false);assert.equal(contract.saves_layout,false);assert.equal(contract.activates_people,false);
  assert.equal(contract.resource,'xpaceos://help');assert.ok(manifest.resources.some(r=>r.uri===contract.resource));
  assert.deepEqual(manifest.distribuit,catalog.distribuit);assert.equal(manifest.distribuit.id,'distribuit');
  for(const alias of ['/cli distribuir','/cli distribute','/cli distribuit'])assert.ok(manifest.distribuit.commands.includes(alias),alias);
  const feature=catalog.features.find(f=>f.id==='XP-F10');assert.ok(feature);assert.equal(feature.check_passage.editor_tier,'better');
});

test('stable guide, tutorial and both MCP topic aliases are discoverable across documentation surfaces',async()=>{
  const contract=manifest.check_passage;
  assert.equal(contract.guide,'https://www.xpaceos.com/admira-xp/docs/check-passage.md');
  assert.equal(contract.tutorial,'https://www.xpaceos.com/help/#check-passage');
  assert.deepEqual(contract.help_aliases,['comprobar-paso']);
  assert.equal(manifest.documentation_contracts.check_passage,contract.guide);
  for(const path of ['../../mcp/llms.txt','../docs/distribuir.md','../../README.md']){
    const text=await read(path);assert.match(text,/check-passage/);assert.match(text,/Comprobar paso/);assert.match(text,/Check passage/);
  }
  assert.ok(guide.includes('help({"topic":"check-passage"})'));assert.ok(guide.includes('help({"topic":"comprobar-paso"})'));
});
