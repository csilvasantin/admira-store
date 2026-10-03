import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {inventoryContext,inventoryURL,twinURL,scopedAssets,scopedInstances} from './context.mjs';
import {numberedCatalog,assetForInstance} from './model.mjs';
const json=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url)));
const data=json('./catalog.json'),registry=json('./registry.json'),stock=json('./pixeria-cache.json'),manifest=json('./starbucks/manifest.json');
const assets=numberedCatalog(data.native,stock.items,registry);
test('Estancos shows assigned furniture and IoT, with stable numbers and no other projects',()=>{
 const context=inventoryContext('https://www.admira.store/inventario/?space=xtanco&project=estancos');
 const owned=scopedAssets(assets,data.layouts.xtanco,context);assert.ok(owned.some(a=>a.category==='IoT'));assert.ok(owned.some(a=>a.category==='Mobiliario'));assert.ok(owned.every(a=>a.number<44));assert.equal(owned.find(a=>a.type==='aroma').number,16);
 assert.equal(scopedAssets(assets,[],context).length,0);assert.equal(scopedAssets(assets,[],inventoryContext('/inventario/')).length,51);
});
test('unknown or mismatched projects never fall back to Estancos or the global catalogue',()=>{
 for(const query of ['space=missing','project=unknown','space=starbucks_pg103&project=estancos','space=xtanco&project=starbucks'])assert.deepEqual(scopedAssets(assets,data.layouts.xtanco,inventoryContext('/inventario/?'+query)),[]);
});
test('Starbucks legacy instance types resolve its registered models and match the manifest',()=>{
 for(const unit of manifest.units){const asset=assets.find(a=>a.number===unit.asset_number),instance={id:unit.instance_id,type:'counter'};assert.equal(assetForInstance(instance),asset.id);assert.equal(scopedInstances(asset,[instance]).length,1);}
 const owned=scopedAssets(assets,manifest.units.map(u=>({id:u.instance_id,type:'counter'})));assert.deepEqual(owned.map(a=>a.number),[44,45,46,47,48,49,50]);
});
test('deliberate imports belong to the target layout only and keep their source identity',()=>{
 const asset=assets.find(a=>a.number===43),item={id:'imported',type:'custom',sourceAssetId:asset.id.slice(8),img:asset.img};
 assert.deepEqual(scopedAssets(assets,[item]).map(a=>a.number),[43]);assert.deepEqual(scopedAssets(assets,[]),[]);
});
test('ITIL retains origin, venue, language and brand; return links retain the same Xpacio',()=>{
 const url=inventoryURL('https://www.admira.store/admira-xp/?loc=alsea-sbux-021&lang=en&marca=demo&circuit=coffee',{space:'starbucks_pg103',project:'starbucks'});assert.equal(url.origin,'https://www.admira.store');assert.equal(url.searchParams.get('lang'),'en');assert.equal(url.searchParams.get('loc'),'alsea-sbux-021');
 const back=twinURL(url,inventoryContext(url));assert.equal(back.searchParams.get('loc'),'alsea-sbux-021');assert.equal(back.searchParams.get('project'),'starbucks');assert.equal(back.searchParams.get('marca'),'demo');
 const cafe=twinURL('/inventario/?space=cafebreria&project=cafebreria&lang=en',inventoryContext('/inventario/?space=cafebreria&project=cafebreria&lang=en'));assert.equal(cafe.pathname,'/xpacios/cafebreria/');assert.equal(cafe.searchParams.get('lang'),'en');
});
test('native ITIL opens the bottom inventory and displays unit count without navigation',()=>{
 const html=fs.readFileSync(new URL('../admira-xp/index.html',import.meta.url),'utf8'),fn=html.slice(html.indexOf('  function makeItil(){'),html.indexOf('  function mirror(){',html.indexOf('  function makeItil(){')));
 let click,category,button;const ctx={lang:'es',document:{createElement:()=>button={dataset:{},addEventListener:(name,fn)=>{click=fn;}}},window:{XpaceInventoryUI:{count:19,open:key=>category=key}}};
 vm.runInNewContext(fn+'makeItil();',ctx);click();assert.equal(category,'itil');assert.match(button.innerHTML,/19 piezas/);
});
