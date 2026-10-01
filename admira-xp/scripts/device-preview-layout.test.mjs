import test from 'node:test';import assert from 'node:assert/strict';import {previewSlice} from './device-preview-layout.mjs';
test('preview spans selected surfaces in wall order, adapts to aspect ratios and keeps unrelated devices out',()=>{
 const a='starbucks-wall-04',b='starbucks-wall-03',tpv='starbucks-tpv-01';
 assert.equal(previewSlice('starbucks-wall-06',[a,b]),null);
 assert.deepEqual(previewSlice(a,[a]),{width:100,left:-0,fit:'contain',group:'preview-'+a});
 assert.equal(previewSlice(a,[a,b]).left,-100);assert.equal(previewSlice(b,[a,b]).left,-0);
 assert.equal(previewSlice(a,[b,a]).width,200);
 const ratio=id=>id===tpv?.5:1;
 assert.equal(previewSlice(a,[tpv,a],ratio).width,150);assert.equal(previewSlice(tpv,[tpv,a],ratio).width,300);assert.equal(previewSlice(tpv,[tpv,a],ratio).left,-200);
});
