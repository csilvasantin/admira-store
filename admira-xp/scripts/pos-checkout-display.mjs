import {POS_PRODUCTS,restoreBasket,coffeeSuggestion} from './pos-basket.mjs?v=water-1';
// A local basket layer on the mapped display; scheduled media is never replaced.
export function createPOSCheckoutDisplay({document:doc,host,onEdit,onCoffee}={}){
 const make=(tag,cls)=>{const node=doc.createElement(tag);node.className=cls;return node;};
 const panel=make('section','matrix-pos-checkout');panel.dataset.posCheckout='starbucks-tpv-01';
 const heading=make('h2',''),caption=make('p',''),lines=make('ul',''),offer=make('button','matrix-pos-checkout-coffee'),edit=make('button','matrix-pos-checkout-edit');
 offer.type=edit.type='button';panel.append(heading,caption,lines,offer,edit);
 let basket=restoreBasket(null),disposed=false,suppressed=false;
 edit.addEventListener('click',e=>{e.stopPropagation();onEdit?.();});
 offer.addEventListener('click',e=>{e.stopPropagation();onCoffee?.();});
 for(const type of ['pointerdown','wheel','keydown'])panel.addEventListener(type,e=>e.stopPropagation());
 function sync(disabled){
  if(disposed)return;
  if(typeof disabled==='boolean')suppressed=disabled;
  const target=!suppressed&&basket.lines.length?host?.():null;
  if(!target){panel.remove();return;}
  if(panel.parentNode!==target)target.append(panel);
 }
 function update(value,{offerDismissed=false}={}){
  basket=restoreBasket(value);const en=doc.documentElement.lang==='en';
  heading.textContent=en?'Your purchase':'Tu compra';caption.textContent=en?'Digital twin · POS':'Gemelo digital · TPV';
  panel.setAttribute('aria-label',en?'POS purchase':'Compra en TPV');
  lines.replaceChildren();
  for(const line of basket.lines){const row=make('li',''),quantity=make('b',''),name=make('span','');quantity.textContent=line.quantity+' ×';name.textContent=en?(POS_PRODUCTS[line.id].titleEn||POS_PRODUCTS[line.id].title):POS_PRODUCTS[line.id].title;row.append(quantity,name);lines.append(row);}
  offer.hidden=offerDismissed||!coffeeSuggestion(basket);offer.textContent=en?'+ Add coffee':'+ Añadir café';edit.textContent=en?'Edit basket':'Editar cesta';sync();
 }
 return {update,sync,dispose(){disposed=true;panel.remove();}};
}
