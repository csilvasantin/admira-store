import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

const asset=name=>new URL(`./assets/${name}`,import.meta.url);
const manifests=['good','better','best'].map(tier=>JSON.parse(readFileSync(asset(`counter-interpreted-${tier}.manifest.json`))));

test('three detail profiles share one interpreted configuration and preserve every published file',()=>{
  let previousTriangles=0;
  for(const manifest of manifests){
    assert.deepEqual(manifest.config,manifests[0].config);
    assert.deepEqual(manifest.semantic_parts,manifests[0].semantic_parts);
    assert.deepEqual(manifest.coordinates.pivot_gltf,[0,0,0]);
    assert.equal(manifest.reference.measured,false);
    assert.equal(manifest.units.meters_per_grid_unit,null);
    assert.equal(manifest.status,'interpreted_pilot_not_validated_best');
    assert.ok(manifest.counts.evaluated_triangles>previousTriangles);
    previousTriangles=manifest.counts.evaluated_triangles;
    for(const path of Object.values(manifest.files)){
      if(path===null)continue;
      assert.match(path,/^counter-interpreted-(good|better|best)\.(blend|glb|png)$/);
      assert.ok(statSync(asset(path)).size>0,path);
    }
  }
});

test('published GLBs embed their textures, retain semantic parts and exclude studio cameras/lights',()=>{
  for(const manifest of manifests){
    const binary=readFileSync(asset(manifest.files.web));
    assert.equal(binary.toString('ascii',0,4),'glTF');
    assert.equal(binary.readUInt32LE(4),2);
    assert.equal(binary.readUInt32LE(8),binary.length);
    assert.equal(binary.length,manifest.counts.glb_bytes);
    assert.equal(binary.readUInt32LE(16),0x4e4f534a);
    const gltf=JSON.parse(binary.toString('utf8',20,20+binary.readUInt32LE(12)));
    assert.ok(gltf.images.length>=5);
    assert.ok(gltf.images.every(image=>Number.isInteger(image.bufferView)&&!image.uri));
    for(const part of manifest.semantic_parts)assert.ok(gltf.nodes.some(node=>node.name===part),part);
    assert.equal(gltf.cameras?.length||0,0);
    assert.equal(gltf.extensions?.KHR_lights_punctual?.lights?.length||0,0);
    const screens=gltf.nodes.filter(node=>node.extras?.mediaSurface==='existing_shared_player');
    assert.equal(screens.length,1);
    assert.equal(screens[0].name,'screen_tpv_main');
    assert.ok(!gltf.nodes.some(node=>node.name?.includes('studio_ground')));
  }
});
