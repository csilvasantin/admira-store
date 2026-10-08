import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreBasket,addBasketProduct,removeBasketProduct} from '../admira-xp/scripts/pos-basket.mjs';
import {waterRemaining,occupiedWaterSlots,waterOfferSVG} from '../admira-xp/scripts/pos-water.mjs';
test('water takes a chosen bottle, keeps muffin/coffee, restores on line removal and reload',()=>{
 let basket=addBasketProduct(restoreBasket(null),'muffin');basket=addBasketProduct(basket,'coffee');assert.equal(waterRemaining(basket),13);
 const before=structuredClone(basket);basket=addBasketProduct(basket,'water',9);assert.deepEqual(before.lines,[{id:'muffin',quantity:1},{id:'coffee',quantity:1}]);assert.equal(waterRemaining(basket),12);assert.deepEqual(occupiedWaterSlots(basket),[9]);
 assert.deepEqual(restoreBasket(JSON.parse(JSON.stringify(basket))),basket);assert.throws(()=>addBasketProduct(basket,'water',9));
 basket=removeBasketProduct(basket,'coffee');assert.deepEqual(occupiedWaterSlots(basket),[9]);basket=removeBasketProduct(basket,'water');assert.equal(waterRemaining(basket),13);assert.deepEqual(basket.lines,[{id:'muffin',quantity:1}]);
});
test('13-bottle supply cannot underflow, overfill or restore duplicate/invalid slots',()=>{
 let basket=restoreBasket(null);for(let i=0;i<13;i++)basket=addBasketProduct(basket,'water',i);assert.equal(waterRemaining(basket),0);assert.throws(()=>addBasketProduct(basket,'water'));assert.throws(()=>addBasketProduct(restoreBasket(null),'water',13));
 const restored=restoreBasket({version:1,lines:[{id:'water',quantity:99}],waterSlots:[12,12,-1,'3',99]});assert.equal(waterRemaining(restored),0);assert.equal(new Set(occupiedWaterSlots(restored)).size,13);assert.equal(restored.waterSlots[0],12);assert.deepEqual(restoreBasket({version:1,lines:[{id:'water',quantity:1}],waterSlots:'invalid'}).waterSlots,[0]);
});
test('offer follows remaining quantity in both languages and stops discount at sold-out',()=>{
 assert.match(waterOfferSVG(12),/Solo nos quedan 12 botellas/);assert.match(waterOfferSVG(12),/10% de descuento/);assert.match(waterOfferSVG(11,'en'),/Only 11 bottles left/);assert.match(waterOfferSVG(0),/Agua agotada/);assert.doesNotMatch(waterOfferSVG(0),/10%/);assert.throws(()=>waterOfferSVG(13));assert.throws(()=>waterOfferSVG(-1));
});
test('wall creatives are natively portrait and iPad stays landscape in both languages',()=>{for(const lang of ['es','en']){const portrait=waterOfferSVG(12,lang,'portrait');assert.match(portrait,/width="720" height="1280"/);assert.match(portrait,lang==='es'?/12 botellas/:/Only 12 bottles left/);assert.match(waterOfferSVG(12,lang),/width="1280" height="720"/);assert.doesNotMatch(waterOfferSVG(0,lang,'portrait'),/10%/);}});
