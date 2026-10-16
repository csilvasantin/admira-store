import test from 'node:test';
import assert from 'node:assert/strict';
import {urlKiosko,urlAprovisionamiento,pedidoDe} from './kiosko.mjs';
const clave='gk_'+'a'.repeat(24);
test('provisioning keeps the room and existing kiosk options and puts the credential only in the fragment',()=>{
 const base=new URL(urlKiosko({sala:'starbucks-diagonal-634'})),url=new URL(urlAprovisionamiento({sala:'starbucks-diagonal-634',clave}));
 assert.equal(url.origin,base.origin);assert.equal(url.pathname,base.pathname);for(const [key,value] of base.searchParams)assert.equal(url.searchParams.get(key),value);assert.match(url.searchParams.get('configurar'),/^[a-f0-9-]{36}$/);assert.equal(new URLSearchParams(url.hash.slice(1)).get('clave'),clave);assert.ok(!url.search.includes(clave));assert.notEqual(urlAprovisionamiento({sala:'starbucks-diagonal-634',clave}),url.href,'each save loads a fresh document');
});
test('provisioning refuses staff/global keys and invalid room identities',()=>{
 for(const key of ['gc_'+'a'.repeat(24),'global-key',clave+'extra','',null])assert.throws(()=>urlAprovisionamiento({sala:'starbucks-diagonal-634',clave:key}));
 for(const sala of ['',null,'../other','starbucks?other=1'])assert.throws(()=>urlAprovisionamiento({sala,clave}));
});
test('order notifications require the official origin and this kiosk window',()=>{
 const source={},event={origin:'https://www.ainimation.studio',source,data:{source:'ainimation-xperiencia',event:'order',order:{numero:'A002'}}};
 assert.deepEqual(pedidoDe(event,source),{numero:'A002'});assert.equal(pedidoDe({...event,origin:'https://example.com'},source),null);assert.equal(pedidoDe(event,{}),null);
});
