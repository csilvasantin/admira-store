import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {shellTokens,contrast,parseColor}=createRequire(import.meta.url)('../assets/marca-blanca.js');
const values=['#ffffff','#000000','#808080','#00754a','#eeffee','#e2aaff','rgba(255,255,255,.1)'];
test('panel text and controls remain AA on light, dark, transparent and conflicting brand surfaces',()=>{
 for(const mode of ['claro','oscuro'])for(const primary of ['#00754a','rgba(0,117,74,.55)'])for(const fondo of values)for(const superficie of values)for(const alt of values){
  const tokens=shellTokens({'--mb-fondo':fondo,'--mb-superficie':superficie,'--mb-superficie-alt':alt,'--mb-texto':'#9dffcf','--mb-texto-suave':'#86b3ac','--mb-primario':primary,'--mb-acento':'#ffd36b','--mb-ok':'#9dff7a','--mb-error':'#ff8a6d'},mode);
  for(const text of ['ink','mut','brand','accent','ok','warn','error'])for(const bg of ['surface','inset'])assert.ok(contrast(tokens['--mbx-panel-'+text],tokens['--mbx-panel-'+bg])>=4.5,`${text} on ${bg}: ${fondo} / ${superficie} / ${alt}`);
  assert.equal(parseColor(tokens['--mbx-panel-surface']).a,1);assert.ok(contrast(tokens['--mbx-panel-on-brand'],tokens['--mbx-panel-brand'])>=4.5);
 }
});
