import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../admira-xp/scripts/premium-three.mjs';
import {surfaceKey,documentKey,nextDocument,validatePatches,parseBundle} from './surface-state.mjs';
import {appearanceIdentity} from './starbucks/surface-identities.mjs';
import {createSurfaceBinding} from '../admira-xp/scripts/surface-materials.mjs';
import {createLifeScene} from '../admira-xp/scripts/life-scene.mjs';
import {readFile} from 'node:fs/promises';
const identity=appearanceIdentity('alsea-sbux-021','sb-table-a');
const patch={color:'#006241',roughness:.6,metalness:0,repeat:2,rotation:45,image:null};
const patches={'#ad855b':patch};
const mesh=(m=new T.MeshStandardMaterial({name:'#ad855b.014',color:'#ad855b'}))=>new T.Mesh(new T.BoxGeometry(),m);
test('material keys agree between GLB suffixes and room surfaces',()=>assert.equal(surfaceKey('#ad855b.014'),'#ad855b'));
test('instance identity includes venue and code; shared model cannot merge tables',()=>{
 assert.notEqual(documentKey(identity),documentKey(appearanceIdentity(identity.venue,'sb-table-b')));
 assert.equal(appearanceIdentity('other','sb-table-a'),null);
 assert.throws(()=>documentKey({...identity,instance:'../elsewhere'}));
});
test('all public CIs agree with appearance identity map',async()=>{
 const manifest=JSON.parse(await readFile(new URL('./starbucks/manifest.json',import.meta.url)));
 for(const unit of manifest.units)assert.equal(appearanceIdentity(manifest.location_id,unit.instance_id).code,unit.itil_code);
});
test('saving/restoring appends history and never mutates old snapshots',()=>{
 const a=nextDocument(null,identity,patches),snapshot=JSON.stringify(a);
 const b=nextDocument(a,identity,{'#ad855b':{...patch,color:'#397eb1'}},{baseRevision:1});
 const c=nextDocument(b,identity,a.patches,{baseRevision:2,action:'restore'});
 assert.equal(JSON.stringify(a),snapshot);assert.equal(c.history.length,3);assert.equal(c.patches['#ad855b'].color,'#006241');assert.equal(c.history[1].patches['#ad855b'].color,'#397eb1');
});
test('concurrent or wrong-unit saves are rejected before history can be overwritten',()=>{
 const a=nextDocument(null,identity,patches);assert.throws(()=>nextDocument(a,identity,patches),/CONFLICT/);
 assert.throws(()=>nextDocument(a,{...identity,instance:'sb-table-b'},patches,{baseRevision:1}),/mismatch/);
});
test('imports reject other units, unknown surfaces, executable URIs and invalid settings',()=>{
 const bundle={schema:1,identity,patches,images:{}};
 assert.equal(parseBundle(bundle,identity,['#ad855b']).patches['#ad855b'].color,patch.color);
 assert.throws(()=>parseBundle(bundle,{...identity,instance:'sb-table-b'},['#ad855b']));assert.throws(()=>parseBundle(bundle,identity,['#181c1c']));
 assert.throws(()=>validatePatches({'#ad855b':{...patch,repeat:Infinity}}));
 assert.throws(()=>validatePatches(JSON.parse('{"__proto__":{}}')));
 assert.throws(()=>parseBundle({...bundle,patches:{'#ad855b':{...patch,image:'art'}},images:{art:'https://tracker.invalid/a.png'}},identity,['#ad855b']));
});
test('two clones sharing a cached material can edit independently and reset exactly',async()=>{
 const material=new T.MeshStandardMaterial({name:'#ad855b.014',color:'#ad855b',roughness:.78}),embedded=new T.Texture();material.map=embedded;
 const a=mesh(material),b=mesh(material),ba=createSurfaceBinding(a),bb=createSurfaceBinding(b);
 await ba.apply(patches);assert.equal(a.material.color.getHexString(),'006241');assert.equal(b.material.color.getHexString(),'ad855b');assert.equal(material.map,embedded);
 const version=a.material.version;await ba.apply({});assert.ok(a.material.version>version);assert.equal(a.material.map,embedded);assert.equal(a.material.roughness,.78);
 let embeddedDisposed=0;embedded.addEventListener('dispose',()=>embeddedDisposed++);ba.dispose();bb.dispose();assert.equal(embeddedDisposed,0);
});
test('latest preview wins asynchronous image loading; obsolete texture is disposed',async()=>{
 let resolve;const texture=new T.Texture(),loaded=new Promise(r=>resolve=r);let disposals=0;texture.addEventListener('dispose',()=>disposals++);
 const root=mesh(),binding=createSurfaceBinding(root,{resolveImage:async()=> 'data',loadTexture:()=>loaded});
 const slow=binding.apply({'#ad855b':{...patch,image:'art'}});await binding.apply({'#ad855b':{...patch,color:'#397eb1'}});resolve(texture);
 assert.equal(await slow,false);assert.equal(root.material.color.getHexString(),'397eb1');assert.equal(disposals,1);binding.dispose();
});
test('failed image batch preserves previous appearance and releases successful textures',async()=>{
 const root=new T.Group();root.add(mesh(),mesh(new T.MeshStandardMaterial({name:'#181c1c',color:'#181c1c'})));
 let disposals=0;const texture=new T.Texture();texture.addEventListener('dispose',()=>disposals++);
 const binding=createSurfaceBinding(root,{resolveImage:async id=>id,loadTexture:async data=>{if(data==='bad')throw Error('bad image');return texture;}});
 await binding.apply(patches);
 await assert.rejects(binding.apply({'#ad855b':{...patch,image:'good'},'#181c1c':{...patch,image:'bad'}}));
 assert.equal(root.children[0].material.color.getHexString(),'006241');assert.equal(disposals,1);binding.dispose();
});
test('image tiling, rotation and colour space are applied without mutating UV geometry',async()=>{
 const texture=new T.Texture(),root=mesh(),uv=root.geometry.attributes.uv.array.slice();const binding=createSurfaceBinding(root,{resolveImage:async()=> 'data',loadTexture:async()=>texture});
 await binding.apply({'#ad855b':{...patch,image:'art'}});assert.equal(root.material.map,texture);assert.equal(texture.colorSpace,T.SRGBColorSpace);assert.equal(texture.rotation,Math.PI/4);assert.equal(texture.repeat.x,2);assert.deepEqual(root.geometry.attributes.uv.array,uv);binding.dispose();
});
test('Starbucks table and chair groups have separate materials before batching',async()=>{
 const raw={venue:identity.venue,layout:globalThis.XpaceStarbucks.layout(),actors:[]};const scene=createLifeScene(raw,{canvasFactory:()=>null,assetQuality:'best'});
 const a=scene.world.getObjectByName('appearance:sb-table-a'),b=scene.world.getObjectByName('appearance:sb-table-b'),chair=scene.world.getObjectByName('appearance:sb-chair-1');assert.ok(a&&b&&chair);
 const wood=root=>{let found;root.traverse(o=>{if(o.isMesh&&surfaceKey(o.material.name)==='#ad855b')found=o.material;});return found;};
 assert.notEqual(wood(a),wood(b));assert.notEqual(wood(a),wood(chair));wood(a).color.set('#006241');assert.equal(wood(b).color.getHexString(),'ad855b');assert.equal(wood(chair).color.getHexString(),'ad855b');scene.dispose();
});

test('finish adjustments reuse the current uploaded texture without another decode',async()=>{
 let count=0;const root=mesh(),texture=new T.Texture();const binding=createSurfaceBinding(root,{resolveImage:async()=> 'data',loadTexture:async()=>{count++;return texture;}});
 await binding.apply({'#ad855b':{...patch,image:'art'}});await binding.apply({'#ad855b':{...patch,image:'art',repeat:3,roughness:.2}});assert.equal(count,1);assert.equal(texture.repeat.x,3);assert.equal(root.material.roughness,.2);binding.dispose();
});
