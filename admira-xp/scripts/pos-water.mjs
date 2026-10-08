import {WATER_BOTTLE_ART} from './water-bottle-art.mjs';
export const WATER_INITIAL=13;
export const WATER_ITIL='PDG103-BOT-01';
export const WATER_MODEL=new URL('../../inventario/assets/catalog/50/good.glb',import.meta.url).href;
export const WATER_VIEW={yaw:-57,pitch:-30,fov:65};
// Basket top in the original 8192 × 4096 Matrix capture (sphere X = -3°).
export const WATER_CORNERS=[{yaw:-49.06811,pitch:-18.57274},{yaw:-68.63336,pitch:-19.45411},{yaw:-67.749,pitch:-33.71462},{yaw:-48.35783,pitch:-32.84074}];
export function waterQuantity(basket){return Math.min(WATER_INITIAL,Math.max(0,basket?.lines?.find(l=>l.id==='water')?.quantity||0));}
export function waterRemaining(basket){return WATER_INITIAL-waterQuantity(basket);}
export function occupiedWaterSlots(basket){const count=waterQuantity(basket),used=[...new Set((Array.isArray(basket?.waterSlots)?basket.waterSlots:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<WATER_INITIAL))].slice(0,count);for(let i=0;used.length<count;i++)if(!used.includes(i))used.push(i);return used;}
export function waterOfferSVG(remaining,language='es'){
 if(!Number.isInteger(remaining)||remaining<0||remaining>=WATER_INITIAL)throw Error('Invalid water offer quantity');
 const en=language==='en',headline=remaining===0?(en?'Water sold out':'Agua agotada'):(en?'Only '+remaining+' bottles left':'Solo nos quedan '+remaining+' botellas');
 const subtitle=en?'So enjoy 10% off your water':'Por eso, un 10% de descuento en tu agua';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><defs><radialGradient id="g"><stop stop-color="#087b65"/><stop offset="1" stop-color="#003b32"/></radialGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="1120" cy="90" r="260" fill="#b7e9dc" opacity=".08"/><text x="80" y="100" fill="#c3efdd" font-family="Arial,sans-serif" font-size="30" letter-spacing="6">STARBUCKS · SOLÁN DE CABRAS</text><text x="80" y="225" fill="white" font-family="Arial,sans-serif" font-size="58" font-weight="700">${headline}</text><text x="76" y="440" fill="#d9ffc3" font-family="Arial,sans-serif" font-size="200" font-weight="800">${remaining===0?'0':'−10%'}</text><text x="80" y="530" fill="white" font-family="Arial,sans-serif" font-size="40">${remaining===0?(en?'Ask us about another drink':'Pregúntanos por otra bebida'):subtitle}</text><image href="${WATER_BOTTLE_ART}" x="1000" y="270" width="200" height="340"/><text x="80" y="650" fill="#c3efdd" font-family="Arial,sans-serif" font-size="24">${en?'Digital twin promotion · While supplies last':'Promoción del gemelo digital · Hasta agotar existencias'}</text></svg>`;
}
export function waterOfferURL(remaining,language){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(waterOfferSVG(remaining,language));}
