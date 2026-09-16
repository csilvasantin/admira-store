import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../../',import.meta.url),lab=new URL('xpacios/lab/',root),assets=new URL('assets/',lab);
const source=fs.readFileSync(new URL('lab.mjs',lab),'utf8');
const manifestPath=source.match(/new URL\('\.\/assets\/([^']+\.json)'/)?.[1];
assert.ok(manifestPath,'the page must resolve a specific produced manifest');
const manifest=JSON.parse(fs.readFileSync(new URL(manifestPath,assets),'utf8'));
const bytes=fs.readFileSync(new URL(manifest.files.web,assets));
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());

test('every pilot download exists under its assets directory and agrees with the published byte count',()=>{
  for(const key of ['source','web','preview']){
    const value=manifest.files[key];assert.equal(typeof value,'string');
    const url=new URL(value,assets);assert.ok(url.href.startsWith(assets.href));assert.ok(fs.statSync(url).size>0);
  }
  assert.equal(manifest.counts.glb_bytes,bytes.length);
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
  const png=fs.readFileSync(new URL(manifest.files.preview,assets));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});

test('each published detail-profile manifest resolves its files and describes the same uncalibrated asset',()=>{
  for(const quality of ['good','better','best']){
    const profile=JSON.parse(fs.readFileSync(new URL(`counter-interpreted-${quality}.manifest.json`,assets),'utf8'));
    assert.equal(profile.quality,quality);assert.equal(profile.asset_id,manifest.asset_id);assert.equal(profile.reference.measured,false);
    assert.deepEqual(profile.coordinates.footprint_grid,manifest.coordinates.footprint_grid);
    for(const path of Object.values(profile.files).filter(Boolean))assert.ok(fs.existsSync(new URL(path,assets)),`${quality}: missing published file ${path}`);
    assert.equal(fs.statSync(new URL(profile.files.web,assets)).size,profile.counts.glb_bytes);
  }
});

test('pilot metadata cannot be mistaken for a measured local replica or an enabled Best renderer',()=>{
  assert.equal(manifest.status,'interpreted_pilot_not_validated_best');assert.equal(manifest.reference.measured,false);
  assert.deepEqual(manifest.reference.photos_used,[]);assert.deepEqual(manifest.reference.real_measurements_used,[]);
  assert.equal(manifest.units.authoring,'uncalibrated_grid_units');assert.equal(manifest.units.meters_per_grid_unit,null);
  assert.deepEqual(manifest.coordinates.footprint_grid,[manifest.config.width,manifest.config.depth]);
  const html=fs.readFileSync(new URL('index.html',lab),'utf8');
  assert.match(html,/sin fotografías ni medidas verificadas/);assert.match(html,/no sustituye todavía el mostrador del juego/);
  assert.match(html,/Best sigue pendiente de integración y validación/);
});

test('the exported GLB retains all semantic parts and one placeholder screen without studio cameras or remote dependencies',()=>{
  const asset=gltf.nodes.find(node=>node.extras?.assetId===manifest.asset_id);assert.ok(asset);
  assert.equal(asset.extras.referenceStatus,'interpreted_not_measured');assert.equal(asset.extras.units,manifest.units.authoring);
  assert.deepEqual(asset.translation||[0,0,0],manifest.coordinates.pivot_gltf);
  for(const part of manifest.semantic_parts)assert.ok(gltf.nodes.some(node=>node.name===part),part);
  const screens=gltf.nodes.filter(node=>node.extras?.mediaSurface);
  assert.deepEqual(screens.map(node=>node.name),manifest.media_surfaces);assert.equal(screens.length,1);
  assert.equal(screens[0].extras.mediaSurface,'existing_shared_player');assert.equal(screens[0].extras.placeholder,true);
  assert.equal(gltf.cameras?.length||0,0);assert.ok(gltf.nodes.every(node=>!node.name?.includes('studio_ground')));
  assert.ok(gltf.buffers.every(buffer=>!buffer.uri));assert.ok(gltf.images.every(image=>!image.uri&&Number.isInteger(image.bufferView)));
  assert.equal(gltf.meshes.length,manifest.counts.mesh_objects);
  const triangles=gltf.meshes.flatMap(mesh=>mesh.primitives).reduce((count,primitive)=>count+gltf.accessors[primitive.indices].count/3,0);
  assert.equal(triangles,manifest.counts.evaluated_triangles);
});

function pageHarness(){
  class Element {
    constructor(){this.children=[];this.listeners={};this.attrs={};}
    append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
    setAttribute(key,value){this.attrs[key]=value;}addEventListener(type,fn){this.listeners[type]=fn;}
  }
  const elements=new Map(),requests=[],document={createElement:()=>new Element(),getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}};
  const script=source.replaceAll('import.meta.url',JSON.stringify('https://www.xpaceos.com/xpacios/lab/lab.mjs')).replace(/showPilot\(\)\.catch\([\s\S]*$/,'');
  const context=vm.createContext({URL,Intl,document,location:{origin:'https://www.xpaceos.com'},console:{error(){}},async fetch(url){
    requests.push(String(url));const filename=new URL(url).pathname.split('/').at(-1),localFile=new URL(filename,assets);
    return {ok:fs.existsSync(localFile),json:async()=>JSON.parse(fs.readFileSync(localFile,'utf8'))};
  }});
  vm.runInContext(script,context);return {context,document,requests};
}

test('the lab reads real manifest fields in grid units and does not preload Blender or GLB downloads',async()=>{
  const h=pageHarness();await h.context.showPilot();
  for(let n=0;n<8;n++)await Promise.resolve();
  assert.equal(h.document.getElementById('scene-dimensions').textContent,'1 × 2 casillas');
  assert.equal(h.document.getElementById('scene-geometry').textContent,`${manifest.counts.mesh_objects} piezas`);
  assert.equal(h.document.getElementById('blender-version').textContent,manifest.blender_version);
  assert.ok(h.requests.includes(`https://www.xpaceos.com/xpacios/lab/assets/${manifestPath}`));
  assert.ok(h.requests.every(url=>new URL(url).pathname.endsWith('.manifest.json')),'only small JSON manifests may be prefetched');
  const links=node=>[...(node.href?[String(node.href)]:[]),...node.children.flatMap(links)];
  const downloadUrls=links(h.document.getElementById('downloads'));
  for(const path of Object.values(manifest.files))assert.ok(downloadUrls.includes(`https://www.xpaceos.com/xpacios/lab/assets/${path}`));
  for(const quality of ['good','better'])assert.ok(downloadUrls.includes(`https://www.xpaceos.com/xpacios/lab/assets/counter-interpreted-${quality}.glb`));
  assert.equal(String(h.document.getElementById('scene-render').src),`https://www.xpaceos.com/xpacios/lab/assets/${manifest.files.preview}`);
});

test('download resolution rejects remote URLs and files outside the published pilot directory',()=>{
  const h=pageHarness();
  for(const path of ['https://example.com/model.glb','../outside.glb','/admira-xp/other.glb','javascript:alert(1)'])assert.throws(()=>h.context.assetUrl(path),/pertenecer al piloto/);
  assert.equal(h.context.assetUrl(manifest.files.web).pathname,`/xpacios/lab/assets/${manifest.files.web}`);
});

test('documented Blender script paths resolve from repository root',()=>{
  const readme=fs.readFileSync(new URL('admira-xp/tools/xpacios-blender/README.md',root),'utf8');
  const commands=[...readme.matchAll(/--python ([^ ]+\.py)/g)];assert.equal(commands.length,2);
  for(const [,path]of commands){assert.ok(path.startsWith('admira-xp/tools/xpacios-blender/'));assert.ok(fs.existsSync(new URL(path,root)));}
});
