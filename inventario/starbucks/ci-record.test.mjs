import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordFor,recordURL,recordFields} from './ci-record.mjs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url),'utf8'));
const manifest=read('./manifest.json'), references=read('./references.json');
test('eleven distinct CIs retain seven shared models and all history entries',()=>{
 const records=references.items.filter(r=>r.status==='registered').map(r=>recordFor(manifest,r));
 assert.equal(records.length,11); assert.equal(new Set(records.map(r=>r.code)).size,11); assert.equal(new Set(records.map(r=>r.asset)).size,7);
 for(const r of records){assert.equal(r.history[0].kind,'identity_confirmation');assert.equal(r.history.length,2);assert.equal(r.dimensions,null);assert.equal(r.location,'alsea-sbux-021');}
});
test('unregistered observations cannot become CIs or link to a private record',()=>{
 for(const r of references.items.filter(r=>r.status!=='registered')) assert.equal(recordFor(manifest,r),null);
 assert.throws(()=>recordURL('<script>','https://www.xpaceos.com'),/Invalid/);
});
test('duplicate codes and mismatched models are rejected instead of choosing an arbitrary unit',()=>{
 const reference=references.items[0];
 assert.throws(()=>recordFor({...manifest,units:[...manifest.units,manifest.units[0]]},reference),/Ambiguous/);
 assert.throws(()=>recordFor(manifest,{...reference,asset_number:1}),/mismatch/);
});
test('unverified dimensions and protected lifecycle data are never presented as physical facts',()=>{
 const r=recordFor(manifest,references.items[0]);
 assert.match(JSON.stringify(recordFields(r)),/Pendiente de medición/);assert.match(JSON.stringify(recordFields(r,true)),/authorised access/);
 const unverified={...manifest,units:manifest.units.map((u,i)=>i===0?{...u,measurements:{verified:false,label:'100 m'}}:u)};
 assert.equal(recordFor(unverified,references.items[0]).dimensions,null);
});
test('Yokup links keep exact identity and explicit appearance without leaking other query data',()=>{
 const url=new URL(recordURL('PDG103-MES-02','https://www.xpaceos.com/inventario/starbucks/?marca=starbucks&lang=en&token=secret&item=PDG103-MES-01'));
 assert.equal(url.searchParams.get('code'),'PDG103-MES-02');assert.equal(url.searchParams.get('marca'),'starbucks');assert.equal(url.searchParams.get('lang'),'en');assert.equal(url.searchParams.has('token'),false);
});
