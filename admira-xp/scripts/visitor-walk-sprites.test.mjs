import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {WALK_SHEET,walkSheetURL,walkFrame,walkBackgroundPosition} from './visitor-walk-sprites.mjs';
import {VISITOR_PROFILES} from './visitor-profiles.mjs';

// WebP canvas size from the RIFF header (VP8X extended or VP8L lossless/VP8 lossy).
function webpSize(bytes){
  const tag=bytes.toString('ascii',12,16);
  if(tag==='VP8X')return [1+bytes.readUIntLE(24,3),1+bytes.readUIntLE(27,3)];
  if(tag==='VP8L'){const b=bytes.readUInt32LE(21);return [1+(b&0x3fff),1+((b>>14)&0x3fff)];}
  if(tag==='VP8 ')return [bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff];
  throw new Error('not webp '+tag);
}

test('los 24 perfiles tienen hoja de caminata 9×2 con el tamaño de fotograma declarado', () => {
  assert.equal(VISITOR_PROFILES.length,24);
  for(const profile of VISITOR_PROFILES){
    const url=walkSheetURL(profile.id);assert.ok(url,profile.id);
    const file=new URL('../'+url.split('?')[0],import.meta.url);assert.ok(existsSync(file),url);
    const bytes=readFileSync(file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.deepEqual(webpSize(bytes),[WALK_SHEET.frameW*WALK_SHEET.cols,WALK_SHEET.frameH*WALK_SHEET.rows],profile.id);
  }
  assert.equal(walkSheetURL('no-existe'),null);
});

test('la fase de paso elige uno de 8 fotogramas; parado usa el fotograma de reposo', () => {
  assert.equal(walkFrame(0,true),0);assert.equal(walkFrame(.124,true),0);assert.equal(walkFrame(.125,true),1);
  assert.equal(walkFrame(.999,true),7);assert.equal(walkFrame(1.5,true),4);assert.equal(walkFrame(-.25,true),6);
  assert.equal(walkFrame(.5,false),8);assert.equal(walkFrame(NaN,true),8);
  assert.equal(walkBackgroundPosition(0,0),'0.0000% 0.0000%');
  assert.equal(walkBackgroundPosition(8,1),'100.0000% 100.0000%');
  assert.equal(walkBackgroundPosition(4,0),'50.0000% 0.0000%');
});

test('solo Matrix activa las hojas de caminata; la capa conserva el recorte y el rig como reserva', () => {
  const matrix=readFileSync(new URL('./matrix-preview-ui.mjs',import.meta.url),'utf8');
  assert.match(matrix,/createBestPeopleLayer\(\{[^}]*walkSprites:true/);
  const layer=readFileSync(new URL('./best-live-people.mjs',import.meta.url),'utf8');
  assert.match(layer,/walkSprites=false/);
  assert.match(layer,/walkFailed\.add\(profile\.id\);cleanupAppearance\(actor\.id\);updateAppearance\(node,actor\)/);
});
