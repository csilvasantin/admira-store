import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {numberedCatalog} from './model.mjs';
import {parseInventoryCommand,executeInventoryCommand} from './command.mjs';
const json=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url)));
const data=json('./catalog.json'),stock=json('./pixeria-cache.json'),registry=json('./registry.json');
const assets=numberedCatalog(data.native,stock.items,registry);
const storeSource=fs.readFileSync(new URL('./store.js',import.meta.url),'utf8');
function harness(){
 const values=new Map();let fail=false,layout=structuredClone(data.layouts.xtanco);
 const localStorage={getItem:k=>values.get(k)||null,setItem(k,v){if(fail)throw Error('quota');values.set(k,v);},removeItem:k=>values.delete(k)};
 const root={localStorage,addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(storeSource,{window:root,Event:class{}});
 const options={store:root.XpaceInventory,space:'xtanco',getLayout:()=>layout,applyLayout:next=>{layout=next;},load:async()=>({assets})};
 return {options,values,localStorage,exec:raw=>executeInventoryCommand(raw,options),get layout(){return layout;},fail(){fail=true;}};
}
test('43 permanent numbers survive source reorder and category/search filtering',()=>{
 assert.equal(assets.length,43);assert.deepEqual(assets.map(a=>a.number),Array.from({length:43},(_,i)=>i+1));
 assert.equal(assets[0].id,'native:counter');assert.equal(assets[0].name,'Mostrador');
 const reordered=numberedCatalog([...data.native].reverse(),[...stock.items].reverse(),registry);
 assert.deepEqual(reordered,assets);assert.equal(assets.filter(a=>a.type==='shelves')[0].number,2);
});
test('inventory grammar reserves invalid destructive commands locally without interpreting unrelated text',()=>{
 for(const s of ['/inventario','INVENTARIO'])assert.equal(parseInventoryCommand(s).action,'list');
 for(const s of ['eliminar el 1','/eliminar 1','/inventario eliminar el 1'])assert.deepEqual(parseInventoryCommand(s),{action:'remove',number:1});
 for(const s of ['eliminar 0','eliminar -1','eliminar 1.2','eliminar 1 todos','/inventario eliminar 99999999999999999'])assert.equal(parseInventoryCommand(s).action,'help');
 for(const s of ['/inventariox','hola','/mobiliario'])assert.equal(parseInventoryCommand(s),null);
});
test('CLI lists all 43 models with counts, including unplaced Pixeria furniture',async()=>{
 const h=harness(),answer=await h.exec('/inventario');assert.equal(answer.ok,true);
 assert.equal(answer.message.split('\n').filter(line=>/^\d+\./.test(line)).length,43);
 assert.match(answer.message,/1\. Mostrador · 1 en el espacio/);assert.match(answer.message,/43\./);
});
test('remove 1 affects only the current counter, survives reload/factory reset and leaves catalog numbering intact',async()=>{
 const h=harness(),before=structuredClone(h.layout);assert.equal((await h.exec('eliminar el 1')).ok,true);
 assert.equal(h.layout.some(i=>i.type==='counter'),false);assert.equal(h.layout.length,before.length-1);
 assert.equal(h.options.store.retained('xtanco',before).length,before.length-1);
 assert.equal(h.options.store.retained('supermercado',before).length,before.length);
 const root={localStorage:h.localStorage,addEventListener(){}};vm.runInNewContext(storeSource,{window:root,Event:class{}});
 assert.equal(root.XpaceInventory.retained('xtanco',before).some(i=>i.id==='counter'),false);
 assert.equal((await h.exec('eliminar el 1')).ok,false);assert.match((await h.exec('/inventario')).message,/1\. Mostrador · 0/);
});
test('undo restores original positions and preserves unrelated changes; collisions refuse overwrite',async()=>{
 const h=harness(),original=structuredClone(h.layout.find(i=>i.id==='counter'));
 await h.exec('eliminar el 1');h.layout.push({id:'new',type:'plant',col:99,row:99});
 assert.equal((await h.exec('/inventario deshacer')).ok,true);
 assert.deepEqual(h.layout.find(i=>i.id==='counter'),original);assert.ok(h.layout.some(i=>i.id==='new'));
 assert.equal((await h.exec('/inventario deshacer')).ok,false);
 await h.exec('eliminar el 1');h.layout.push({...original,col:8});
 assert.equal((await h.exec('/inventario deshacer')).ok,false);assert.equal(h.layout.find(i=>i.id==='counter').col,8);
});
test('missing/out-of-range models never mutate and storage/apply failures roll back the removal intent',async()=>{
 const h=harness(),before=JSON.stringify(h.layout);
 for(const cmd of ['eliminar 999','eliminar 43'])assert.equal((await h.exec(cmd)).ok,false);
 assert.equal(JSON.stringify(h.layout),before);
 h.options.applyLayout=()=>{throw Error('failed');};assert.equal((await h.exec('eliminar el 1')).ok,false);
 assert.equal(Object.keys(h.options.store.removals('xtanco').removed).length,0);assert.equal(JSON.stringify(h.layout),before);
 h.fail();assert.equal((await h.exec('eliminar el 1')).ok,false);assert.equal(JSON.stringify(h.layout),before);
});
test('all instances of a numbered model are removed together and can be restored',async()=>{
 const h=harness(),count=h.layout.filter(i=>i.type==='plant').length;assert.ok(count>1);
 assert.equal((await h.exec('eliminar el 9')).ok,true);assert.equal(h.layout.filter(i=>i.type==='plant').length,0);
 await h.exec('/inventario deshacer');assert.equal(h.layout.filter(i=>i.type==='plant').length,count);
});
const html=fs.readFileSync(new URL('../admira-xp/index.html',import.meta.url),'utf8');
const section=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
test('real composer and __xtExec intercept inventory before network, bot, memory or session logging, including loader errors',async()=>{
 for(const failure of [false,true]){
  const h=harness(),responses=[];
  const forbidden=()=>{throw Error('Outbound operation must never be reached');};
  const context=vm.createContext({window:{XpaceInventory:h.options.store},inventorySpace:()=> 'xtanco',shopLayout:h.layout,composer:{value:''},
   loadInventoryCommand:async()=>{if(failure)throw Error('offline');return {executeInventoryCommand:(raw,opts)=>executeInventoryCommand(raw,{...opts,load:h.options.load})};},
   ISO:{cols:20,rows:20},buildDynamicOccupancy:()=>new Set(),getLayoutSlotKeys:()=>({current:'current',backup:'backup',schema:'schema'}),getLayoutStoragePrefix:()=> 'xtanco',LAYOUT_SCHEMA_VERSION:'1',walkGrid:[],localStorage:h.localStorage,buildWalkGrid(){},
   hideHelpPanel(){},showLastResponse:(...v)=>responses.push(v),renderQuickActionButtons(){},
   rememberMemory:forbidden,appendTelegramLog:forbidden,telegramSend:forbidden,fetch:forbidden
  });
  const helper=section('  async function executeLocalVisualCommand(rawText){','  async function executeTelegramText(rawText){').replace("import('../inventario/command.mjs?v=inventory-cli-3')",'loadInventoryCommand()');
  vm.runInContext(helper+section('  async function executeTelegramText(rawText){','  // === Stream Deck (Corsair Galleon 100 SD) bridge')+section('  async function sendComposerText(text){','  function bindDockButton(button,handler){')+'window.__xtExec=executeTelegramText;',context);
  await context.sendComposerText('/inventario');assert.equal(responses[0][2],'local-inventory');
  const answer=await context.window.__xtExec('eliminar el 1');assert.match(answer,failure?/No se pudo cargar/:/Retirado: 1\. Mostrador/);
  const addition=await context.window.__xtExec('/inventario añadir silla de madera');assert.match(addition,failure?/No se pudo cargar/:/Añadido: 43\. Silla de madera/);
 }
});

test('add and remove accept numbers, full names, accents and unambiguous fragments',async()=>{
 const h=harness();h.options.getRoom=()=>({cols:20,rows:20});
 assert.deepEqual(parseInventoryCommand('/inventario añadir 43'),{action:'add',number:43});
 assert.deepEqual(parseInventoryCommand('/inventario eliminar silla de madera'),{action:'remove',name:'silla de madera'});
 const answer=await h.exec('/inventario añadir SILLA DE MADERA');assert.equal(answer.ok,true);assert.match(answer.message,/43\. Silla de madera/);
 const item=h.layout.find(i=>i.label==='Silla de madera');assert.equal(item.img,assets[42].img);assert.deepEqual(item.fp,assets[42].fp);
 assert.equal(h.options.store.retained('xtanco',[]).some(i=>i.id===item.id),true);
 assert.equal((await h.exec('/inventario añadir 43')).ok,true);assert.equal(h.layout.filter(i=>i.label==='Silla de madera').length,2);
 assert.equal((await h.exec('/inventario eliminar silla')).ok,true);assert.equal(h.layout.filter(i=>i.label==='Silla de madera').length,0);
 assert.equal((await h.exec('/inventario añadir lampara')).ok,true);
});
test('ambiguous furniture names and full rooms never mutate state',async()=>{
 const h=harness(),before=JSON.stringify(h.layout);h.options.getRoom=()=>({cols:1,rows:1,blocked:['0,0']});
 const ambiguous=await h.exec('/inventario añadir sofa');assert.equal(ambiguous.ok,false);assert.match(ambiguous.message,/varias piezas/);
 assert.equal((await h.exec('/inventario añadir 43')).ok,false);assert.equal(JSON.stringify(h.layout),before);assert.equal(h.values.size,0);
});
test('restore uses original identity, relocates if occupied, shows hidden pieces and undo reverses addition',async()=>{
 const h=harness();h.options.getRoom=()=>({cols:20,rows:20});
 const old=structuredClone(h.layout.find(i=>i.type==='counter'));h.options.store.setVisible('xtanco',old.id,false);
 await h.exec('/inventario eliminar mostrador');h.layout.push({id:'occupier',type:'plant',col:old.col,row:old.row});
 assert.equal((await h.exec('/inventario añadir 1')).ok,true);
 const next=h.layout.find(i=>i.id===old.id);assert.notDeepEqual([next.col,next.row],[old.col,old.row]);assert.equal(h.options.store.visible('xtanco',old.id),true);
 assert.equal((await h.exec('/inventario deshacer')).ok,true);assert.equal(h.layout.some(i=>i.id===old.id),false);assert.equal(h.options.store.visible('xtanco',old.id),false);
});
test('failed addition rolls back added ledger and visibility; per-space changes remain isolated',async()=>{
 const h=harness();h.options.getRoom=()=>({cols:20,rows:20});h.options.applyLayout=()=>{throw Error('layout write failed');};
 assert.equal((await h.exec('/inventario añadir 43')).ok,false);assert.equal(Object.keys(h.options.store.removals('xtanco').added||{}).length,0);assert.equal(Object.keys(h.options.store.read('xtanco')).length,0);assert.equal(h.options.store.retained('supermercado',[]).length,0);
});
test('cross-tab ledger merges additions, restorations and unrelated local moves',()=>{
 const h=harness(),added={id:'new',type:'plant',col:2,row:2};
 const first=h.options.store.applyDelta([{id:'old',type:'plant',col:9,row:9}],{removed:{}},{removed:{},added:{new:added}});
 assert.equal(first.length,2);assert.equal(first[0].col,9);
 first[1].col=7;const same=h.options.store.applyDelta(first,{removed:{},added:{new:{...added,col:2}}},{removed:{},added:{new:{...added,col:2}}});assert.equal(same[1].col,7);
 const restored=h.options.store.applyDelta([],{removed:{new:{...added,col:2}}},{removed:{},added:{new:{...added,col:5}}});assert.equal(restored[0].col,5);
});
