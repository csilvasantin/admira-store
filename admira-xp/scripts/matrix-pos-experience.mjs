import {quadTransform} from './matrix-mapping.mjs?v=wall-1';
import {POS_ID,POS_LOC,POS_BASKET_KEY,POS_PRODUCTS,restoreBasket,addBasketProduct,removeBasketProduct,coffeeSuggestion} from './pos-basket.mjs?v=pos-muffin-1';

// One photographed muffin and the physical register (not the advertising display).
// TL/TR/BR/BL calibrated in the Starbucks Alsea capture supplied by Carlos.
export const POS_MUFFIN_CORNERS=[{yaw:14.203268,pitch:-4.439902},{yaw:10.630299,pitch:-4.319961},{yaw:10.211080,pitch:-7.343078},{yaw:13.829000,pitch:-7.551927}];
export const POS_REGISTER_CORNERS=[{yaw:58.617279,pitch:-.306445},{yaw:52.521471,pitch:-.318136},{yaw:48.759444,pitch:-11.744243},{yaw:60.325118,pitch:-11.000446}];
export const POS_EXPERIENCE_VIEW={yaw:36.2,pitch:-18,fov:65};
export function pointInPOSQuad(x,y,points){
 if(points.length!==4)return false;
 const cross=points.map((p,i)=>{const q=points[(i+1)%4];return (q.x-p.x)*(y-p.y)-(q.y-p.y)*(x-p.x);});
 return cross.every(v=>v>=-1e-6)||cross.every(v=>v<=1e-6);
}

export function mountPOSExperience(surface,{blocked=()=>false}={}){
 const doc=surface.ownerDocument,win=doc.defaultView,t=(es,en)=>doc.documentElement.lang==='en'?en:es;
 let disposed=false,editing=false,registerPoints=null,basket=restoreBasket(null),offerDismissed=false;
 try{basket=restoreBasket(JSON.parse(win.sessionStorage.getItem(POS_BASKET_KEY)));}catch{}
 const element=(tag,cls)=>{const e=doc.createElement(tag);e.className=cls;return e;};
 const muffin=element('button','matrix-pos-muffin');muffin.type='button';muffin.dataset.posProduct='muffin';muffin.hidden=true;
 const picture=element('img','');picture.src=POS_PRODUCTS.muffin.image;picture.alt='';picture.draggable=false;
 const register=element('button','matrix-pos-register');register.type='button';register.hidden=true;register.dataset.posRegister=POS_ID;
 const panel=element('section','matrix-pos-basket');panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','posBasketTitle');
 const header=element('header',''),title=element('h2','');title.id='posBasketTitle';
 const close=element('button','matrix-pos-close');close.type='button';
 const scope=element('p','matrix-pos-scope'),lines=element('ul','matrix-pos-lines'),offer=element('div','matrix-pos-offer'),question=element('p',''),add=element('button',''),skip=element('button',''),empty=element('p',''),status=element('p','matrix-pos-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 add.type=skip.type='button';header.append(title,close);offer.append(question,add,skip);panel.append(header,scope,lines,empty,offer,status);surface.append(muffin,register,panel);
 function render(){
  muffin.title=t('Muffin · mantén pulsado y arrastra a la caja','Muffin · hold and drag to the register');muffin.setAttribute('aria-label',t('Coger muffin y llevarlo a la caja','Pick up muffin and take it to the register'));
  register.setAttribute('aria-label',t('Caja TPV · suelta aquí el muffin','POS register · drop the muffin here'));register.title=t('Caja · cesta del gemelo','Register · twin basket');
  title.textContent=t('TPV · Cesta','POS · Basket');close.textContent='×';close.setAttribute('aria-label',t('Cerrar cesta','Close basket'));scope.textContent=t('Cesta del gemelo digital','Digital twin basket');
  empty.textContent=t('Coge un muffin y llévalo a la caja.','Pick up a muffin and take it to the register.');empty.hidden=!!basket.lines.length;
  lines.replaceChildren();
  for(const line of basket.lines){const row=element('li',''),name=element('span',''),remove=element('button','');name.textContent=line.quantity+' × '+(doc.documentElement.lang==='en'?POS_PRODUCTS[line.id].titleEn||POS_PRODUCTS[line.id].title:POS_PRODUCTS[line.id].title);remove.type='button';remove.textContent=t('Quitar','Remove');remove.setAttribute('aria-label',t('Quitar ','Remove ')+(doc.documentElement.lang==='en'?POS_PRODUCTS[line.id].titleEn||POS_PRODUCTS[line.id].title:POS_PRODUCTS[line.id].title));remove.addEventListener('click',()=>{basket=removeBasketProduct(basket,line.id);save();render();notify('remove',line.id);});row.append(name,remove);lines.append(row);}
  offer.hidden=offerDismissed||!coffeeSuggestion(basket);question.textContent=t('¿Lo acompañamos con un café?','Would you like a coffee with it?');add.textContent=t('Añadir café','Add coffee');skip.textContent=t('Sólo el muffin','Just the muffin');
 }
 function save(){try{win.sessionStorage.setItem(POS_BASKET_KEY,JSON.stringify(basket));}catch{}}
 function notify(action,id){win.dispatchEvent(new win.CustomEvent('xpace:pos-basket',{detail:{version:1,loc:POS_LOC,posId:POS_ID,quality:'matrix',action,productId:id,basket:restoreBasket(basket)}}));}
 function open(){if(disposed||editing)return;render();panel.hidden=false;}
 function addProduct(id){if(disposed||editing||blocked())return false;try{basket=addBasketProduct(basket,id);}catch{status.textContent=t('No se pudo añadir el producto.','Could not add the product.');return false;}if(id==='muffin')offerDismissed=false;save();render();open();status.textContent=t('Añadido: ','Added: ')+(doc.documentElement.lang==='en'?POS_PRODUCTS[id].titleEn||POS_PRODUCTS[id].title:POS_PRODUCTS[id].title);notify('add',id);return true;}
 const api={isActive:()=>!disposed&&!editing&&!blocked(),addProduct,targetAt(x,y){if(!this.isActive()||!registerPoints||register.hidden)return false;const r=surface.getBoundingClientRect();return pointInPOSQuad(x-r.left,y-r.top,registerPoints)&&doc.elementFromPoint(x,y)?.closest('[data-pos-register]')===register;},highlight(on){register.classList.toggle('is-pos-drop-target',!!on);},open,get basket(){return restoreBasket(basket);}};
 win.XpacePOSExperience=api;
 const detach=win.XpaceMediaOptions?.attachProduct(muffin,{...POS_PRODUCTS.muffin,title:'Muffin',thumbnail:POS_PRODUCTS.muffin.image},picture);
 close.addEventListener('click',()=>{panel.hidden=true;register.focus({preventScroll:true});});register.addEventListener('click',open);add.addEventListener('click',()=>addProduct('coffee'));skip.addEventListener('click',()=>{offerDismissed=true;render();});
 for(const node of [muffin,register,panel])for(const type of ['pointerdown','wheel','keydown'])node.addEventListener(type,e=>{if(type==='keydown'&&e.key==='Escape'&&node===panel){panel.hidden=true;register.focus({preventScroll:true});e.preventDefault();}e.stopPropagation();});
 const language=new win.MutationObserver(render);language.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});render();
 return {open,draw(project,disabled){editing=!!disabled;const configure=(node,corners,w,h)=>{const pts=corners.map(project),matrix=pts.every(Boolean)&&quadTransform(pts,w,h);node.hidden=editing||!matrix;if(matrix)node.style.transform='matrix3d('+matrix.join(',')+')';return matrix?pts:null;};configure(muffin,POS_MUFFIN_CORNERS,80,70);registerPoints=configure(register,POS_REGISTER_CORNERS,200,180);register.disabled=blocked();if(editing)panel.hidden=true;},dispose(){disposed=true;detach?.();language.disconnect();if(win.XpacePOSExperience===api)delete win.XpacePOSExperience;for(const node of [muffin,register,panel])node.remove();}};
}
