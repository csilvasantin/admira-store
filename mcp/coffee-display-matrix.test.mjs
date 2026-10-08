import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('coffee display 47 manifests preserve identities and distinguish portable Matrix from verified native Unreal', async () => {
  const contracts = await Promise.all(['mcp/manifest.json', 'mcp/funcionalidades.json'].map(async path => JSON.parse(await read(path)).starbucks_coffee_display));
  assert.deepEqual(contracts[0], contracts[1]);
  const contract = contracts[0];
  assert.equal(contract.inventory_number, 47);
  assert.equal(contract.inventory_id, 'native:starbucksShelves');
  assert.equal(contract.instance_id, 'sb-mugs');
  assert.equal(contract.itil_code, 'PDG103-EST-01');
  assert.equal(contract.visual_instance_count, 115);
  assert.equal(contract.visual_references, 26);
  assert.deepEqual(contract.profiles, ['good', 'better', 'best', 'matrix']);
  assert.equal(contract.matrix.scope, 'inventory_asset_47_only');
  assert.equal(contract.matrix.browser_runtime, 'WebGL / Three.js');
  assert.equal(contract.matrix.native_engine, 'Unreal Engine 5.8');
  assert.equal(contract.matrix.native_lighting, 'Lumen');
  assert.equal(contract.matrix.native_delivery_status, 'verified');
  assert.equal(contract.matrix.web_delivery_status, 'verified');
  assert.equal(contract.matrix.native_project, 'Matrix47.uproject');
  assert.equal(contract.matrix.native_map, '/Game/Matrix47/Matrix47');
  assert.equal(contract.matrix.native_camera, 'Studio47 · Matrix hero camera');
  assert.equal(contract.matrix.native_sequence, '/Game/Matrix47/Matrix47Studio');
  assert.equal(contract.matrix.native_lighting_mode, 'software ray tracing');
  assert.equal(contract.matrix.native_import_status, 'verified');
  assert.equal(contract.matrix.native_product_root_actor_count, 115);
  assert.equal(contract.matrix.native_static_mesh_actor_count, 2061);
  assert.equal(contract.matrix.native_glass_material_slots, 40);
  assert.deepEqual(contract.matrix.native_render_resolution, [1920, 1600]);
  assert.equal(contract.matrix.native_render_spatial_samples, 8);
  assert.equal(contract.matrix.native_scene_status, 'built_saved_reopened_verified');
  const release = 'https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/';
  assert.equal(contract.matrix.native_download, release + 'matrix47-unreal.zip');
  assert.equal(contract.matrix.portable_download, release + 'coffee-display-matrix-itil.zip');
  assert.deepEqual(contract.matrix.package_delivery, {provider: 'github_release', repository: 'csilvasantin/xpaceos', tag: 'matrix47-20261008'});
  assert.equal(contract.matrix.native_render, 'https://www.xpaceos.com/inventario/assets/catalog/47/collection-matrix/preview/unreal-studio.png');
  assert.equal(contract.new_remote_tools, false);
  assert.equal(contract.product_ci_registration, false);
  assert.match(contract.matrix_viewer, /asset=47&quality=matrix#mostrador$/);
  assert.match(contract.all_viewer, /asset=47&quality=all#mostrador$/);
});

test('Spanish and English help, tutorial and CLI document four qualities for 47 and native delivery status', async () => {
  const docs = await Promise.all(['admira-xp/docs/starbucks-coffee-display.md', 'admira-xp/help.html', 'help/index.html', 'help/cli/index.html', 'mcp/llms.txt'].map(read));
  for (const text of docs) {
    for (const term of ['WebGL/Three.js', 'Unreal Engine 5.8', 'Lumen', '115', '26', 'PDG103-EST-01', 'quality=matrix', 'quality=all', '1920 × 1600', '8 spatial samples']) {
      assert.ok(text.includes(term), term);
    }
    assert.match(text, /render.*verificado|render.*verified/);
    assert.match(text, /Yokup remains the lifecycle master/);
    assert.ok(text.includes('https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip'));
    assert.ok(text.includes('https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/coffee-display-matrix-itil.zip'));
  }
});

test('native README names the map, sequence and camera, preserves stock provenance and reports verified final rendering', async () => {
  const readme = await read('admira-xp/docs/starbucks-coffee-display-unreal.md');
  for (const term of ['Matrix47.uproject', '/Game/Matrix47/Matrix47', '/Game/Matrix47/Matrix47Studio', 'Studio47 · Matrix hero camera', 'Unreal Engine **5.8**', 'Lumen', 'software ray tracing', 'stock_verified: false', '47-P001', '47-P115', '115', '26', '2061 StaticMeshActors', '40 glass-material slots', '1920 × 1600', '8 spatial samples', 'EV 8', 'Content', 'Config', 'Scripts', 'SourceAssets']) {
    assert.ok(readme.includes(term), term);
  }
  assert.match(readme, /Yokup remains the lifecycle master/);
  assert.match(readme, /not commercial SKUs/);
  assert.doesNotMatch(readme, /1892|1775|pending final verification/);
  assert.ok(readme.includes('https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip'));
  assert.ok(readme.includes('https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/coffee-display-matrix-itil.zip'));
});
