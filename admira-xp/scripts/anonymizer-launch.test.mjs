import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const actionsSource=html.slice(html.indexOf('  function getQuickSceneActions(){'),html.indexOf('  // Acciones contextuales por tab'));
const openSource=html.slice(html.indexOf('  function openAnonymizer(){'),html.indexOf('  async function openPixerAi(){'));
const mirrorSource=html.slice(html.indexOf('  function mirror(){'),html.indexOf('  try{ var mo=new MutationObserver(mirror)'));
function actions(lang){
 const context=vm.createContext({lang,G:{},trimLabel:s=>s,window:{}});vm.runInContext(actionsSource,context);return context.getQuickSceneActions();
}
test('Anonymizer replaces the former Pixeria slot while the furniture import is retained last',()=>{
 for(const lang of ['es','en']){
  const list=actions(lang);
  assert.equal(list[4].customAction,'anonymizer');assert.equal(list[4].label,'ANONYMIZER');
  assert.equal(list[4].status,lang==='es'?'Píxeles ↔ humanos':'Pixels ↔ humans');
  assert.equal(list.at(-1).customAction,'pixerai');assert.equal(list.filter(v=>v.customAction==='pixerai').length,1);
  assert.ok(list.some(v=>v.customAction==='signage'));assert.ok(list.some(v=>v.customAction==='editor'));
 }
});
test('advanced mirror places Pixeria after the eye and forwards the exact existing actions',()=>{
 const output=[],clicks=[];
 const source=actions('es').map((action,index)=>({index,getAttribute:()=>action.customAction||'',click:()=>clicks.push(index),cloneNode(){return {index,addEventListener(_type,fn){this.click=fn;}};}}));
 const host={set innerHTML(_){output.length=0;},appendChild:item=>output.push(item)};
 const context=vm.createContext({src:{querySelectorAll:()=>source},host,makePercibe:()=>({eye:true})});vm.runInContext(mirrorSource,context);context.mirror();
 assert.equal(output.at(-2).eye,true);assert.equal(output.at(-1).index,source.length-1);
 output[4].click({preventDefault(){},stopPropagation(){}});assert.deepEqual(clicks,[4]);
 output.at(-1).click({preventDefault(){},stopPropagation(){}});assert.deepEqual(clicks,[4,source.length-1]);
});
test('Anonymizer opens the real gated route without uploading or sending a person automatically',()=>{
 const calls=[],context=vm.createContext({window:{open:(...args)=>calls.push(args)}});
 vm.runInContext(openSource,context);context.openAnonymizer();
 assert.deepEqual(calls,[['https://www.pixeria.com/anonimizador','_blank','noopener']]);
 assert.doesNotMatch(openSource,/fetch|twin\/spawn|image\/edit|iframe/);
 assert.equal(html.match(/else if\(kind==='anonymizer'\) openAnonymizer\(\);/g).length,2);
});
