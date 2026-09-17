import test from 'node:test';import assert from 'node:assert/strict';import {findPlacement,footprint} from './placement.mjs';
test('placement checks entire footprints, rotation, scaled dimensions and occupied actors',()=>{
 assert.deepEqual(footprint({col:0,row:0,fp:[1,2],rot:1,sx:2,sy:1}),{col:0,row:0,w:2,d:2});
 const item={type:'custom',fp:[2,2]},layout=[{type:'custom',fp:[2,2],col:0,row:0}];
 assert.equal(findPlacement(item,layout,{cols:3,rows:3}),null);
 assert.equal(findPlacement(item,[],{cols:2,rows:2,blocked:['1,1']}),null);
 assert.deepEqual(findPlacement(item,[],{cols:4,rows:4},[],{col:1,row:1}),{col:1,row:1});
});
test('wall equipment occupies free wall width and floor models avoid full rooms',()=>{
 assert.equal(findPlacement({type:'led'},[],{cols:5,rows:8}),null);
 const p=findPlacement({type:'tft'},[{type:'tft',col:0,row:0}],{cols:4,rows:4});assert.deepEqual(p,{col:2,row:0});
 assert.equal(findPlacement({type:'plant'},[],null||{}),null);
});
