import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreBasket,addBasketProduct,removeBasketProduct,coffeeSuggestion} from '../admira-xp/scripts/pos-basket.mjs';
import {pointInPOSQuad,POS_MUFFIN_CORNERS,POS_REGISTER_CORNERS} from '../admira-xp/scripts/matrix-pos-experience.mjs';
test('muffin drop increments a separate immutable basket and coffee remains an explicit suggestion',()=>{
 const empty=restoreBasket(null),one=addBasketProduct(empty,'muffin');assert.deepEqual(empty.lines,[]);assert.deepEqual(one.lines,[{id:'muffin',quantity:1}]);assert.equal(coffeeSuggestion(one),true);
 const two=addBasketProduct(one,'muffin');assert.equal(two.lines[0].quantity,2);assert.equal(one.lines[0].quantity,1);
 const coffee=addBasketProduct(two,'coffee');assert.equal(coffeeSuggestion(coffee),false);assert.equal(coffeeSuggestion(removeBasketProduct(coffee,'coffee')),true);assert.equal(coffeeSuggestion(removeBasketProduct(one,'muffin')),false);
});
test('restored quantities validate known demo products and never accept prices or arbitrary payloads',()=>{
 const restored=restoreBasket({version:1,lines:[{id:'muffin',quantity:2,price:3},{id:'muffin',quantity:3},{id:'coffee',quantity:1.5},{id:'evil',quantity:1},{id:'coffee',quantity:-2},null]});assert.deepEqual(restored,{version:1,lines:[{id:'muffin',quantity:5}]});for(const id of ['evil','toString','__proto__'])assert.throws(()=>addBasketProduct(restored,id));assert.deepEqual(restoreBasket({version:2,lines:restored.lines}).lines,[]);
 const max=restoreBasket({version:1,lines:[{id:'muffin',quantity:120}]});assert.equal(max.lines[0].quantity,99);assert.throws(()=>addBasketProduct(max,'muffin'));
});
test('POS hit testing uses the projected polygon, including skew and reversed winding',()=>{
 const quad=[{x:10,y:10},{x:30,y:12},{x:25,y:30},{x:5,y:25}];assert.equal(pointInPOSQuad(16,20,quad),true);assert.equal(pointInPOSQuad(6,11,quad),false);assert.equal(pointInPOSQuad(16,20,[...quad].reverse()),true);assert.equal(pointInPOSQuad(10,10,quad),true);assert.equal(pointInPOSQuad(0,0,[]),false);
 for(const corners of [POS_MUFFIN_CORNERS,POS_REGISTER_CORNERS]){assert.equal(corners.length,4);assert.ok(corners.every(p=>Number.isFinite(p.yaw)&&Number.isFinite(p.pitch)));}
});
