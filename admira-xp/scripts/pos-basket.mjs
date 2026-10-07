// Local basket of the digital twin. No prices, checkout, stock or payment writes.
export const POS_ID='starbucks-tpv-01';
export const POS_LOC='alsea-sbux-021';
export const POS_BASKET_KEY='xpaceos.pos-basket.v1:'+POS_LOC+':'+POS_ID;
export const POS_PRODUCTS=Object.freeze({
 muffin:Object.freeze({id:'muffin',title:'Muffin',image:new URL('../assets/pos/muffin-reference.png',import.meta.url).href}),
 coffee:Object.freeze({id:'coffee',title:'Café',titleEn:'Coffee'})
});
export function restoreBasket(value){
 if(!value||value.version!==1||!Array.isArray(value.lines))return {version:1,lines:[]};
 const counts=new Map();
 for(const line of value.lines){if(!Object.hasOwn(POS_PRODUCTS,line?.id)||!Number.isInteger(line.quantity)||line.quantity<=0)continue;counts.set(line.id,Math.min(99,(counts.get(line.id)||0)+line.quantity));}
 return {version:1,lines:[...counts].map(([id,quantity])=>({id,quantity}))};
}
export function addBasketProduct(basket,id){
 if(!Object.hasOwn(POS_PRODUCTS,id))throw Error('Unknown POS product');
 const next=restoreBasket(basket),line=next.lines.find(x=>x.id===id);
 if(line){if(line.quantity>=99)throw Error('POS quantity limit');line.quantity++;}else next.lines.push({id,quantity:1});
 return next;
}
export function removeBasketProduct(basket,id){return {version:1,lines:restoreBasket(basket).lines.filter(x=>x.id!==id)};}
export function coffeeSuggestion(basket){const lines=restoreBasket(basket).lines;return lines.some(x=>x.id==='muffin')&&!lines.some(x=>x.id==='coffee');}
