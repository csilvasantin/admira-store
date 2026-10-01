import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
test('Distribuit help, tutorial, CLI and MCP describe the delivered local editor in both languages',async()=>{
  for(const path of ['../help.html','../../help/index.html','../../help/cli/index.html','../../mcp/index.html','../../mcp/llms.txt','../docs/distribuir.md']){
    const text=await read(path);assert.ok(text.includes('/cli distribuir'),path);assert.match(text,/recorrido|path/,path);assert.match(text,/Deshacer|Undo/,path);assert.match(text,/90°/,path);assert.match(text,/25–300%/,path);assert.match(text,/local|browser/,path);assert.match(text,/Bloquear/);assert.match(text,/Lock\/Unlock/);assert.match(text,/Cargar desde PixerIA/);assert.match(text,/Load from PixerIA/);
  }
  const manifest=JSON.parse(await read('../../mcp/manifest.json')),catalog=JSON.parse(await read('../../mcp/funcionalidades.json'));
  assert.deepEqual(manifest.distribuit,catalog.distribuit);assert.equal(manifest.distribuit.mcp_control,false);assert.equal(manifest.distribuit.snap_tiles,.25);
  assert.equal(manifest.distribuit.name_es,'Distribuir');assert.equal(manifest.distribuit.name_en,'Distribute');assert.equal(manifest.distribuit.rotation.swept_validation,true);assert.deepEqual(manifest.distribuit.scale,{min:.25,max:3,proportional:true});assert.ok(!manifest.distribuit.pending.some(p=>/rotation|scale/.test(p)));
  assert.equal(manifest.distribuit.objects.delete_instance,true);assert.equal(manifest.distribuit.pixeria.asset_bytes_remote,true);assert.equal(manifest.distribuit.pixeria.scope,'local-browser-layout');
  const area=catalog.features.find(f=>f.id==='XP-F10');assert.equal(area.better.status,'partial');assert.ok(area.commands.some(c=>c.text==='/cli distribuir'&&c.status==='browser_verified'));
});
