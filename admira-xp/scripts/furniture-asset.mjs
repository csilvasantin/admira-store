import {GLTFLoader} from './vendor/GLTFLoader.mjs';
import {cloneCounter,counterURL} from './counter-asset.mjs';
import {assetForInstance} from '../../inventario/model.mjs?v=ipad-20261005-1';
const cache=new Map();let registryPromise;
export const inventoryIdFor=assetForInstance;
export function furnitureURL(number,tier='best',extension='glb'){
 if(!Number.isSafeInteger(number)||number<1||number>52||!['good','better','best'].includes(tier)||!['glb','blend'].includes(extension))throw Error('Pieza o perfil no válido');
 if(number===1)return counterURL(tier,extension);
 const url=new URL(`../../inventario/assets/catalog/${String(number).padStart(2,'0')}/${tier}.${extension}`,import.meta.url);
 if(number===2&&tier==='best')url.searchParams.set('v','shelves-parts-20261002-3');
 return url.href;
}
export async function cloneFurniture(number,tier='best'){
 const url=furnitureURL(number,tier);if(number===1)return cloneCounter(tier);
 const key=number+':'+tier;
 if(!cache.has(key))cache.set(key,(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Modelo 3D no disponible');return(await new GLTFLoader().parseAsync(await r.arrayBuffer(),url)).scene;})().catch(e=>{cache.delete(key);throw e;}));
 const root=(await cache.get(key)).clone(true);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return root;
}
export async function loadFurniture(item,tier='best'){
 if(item.source==='PixerIA')return import('./pixeria-furniture.mjs?v=distribuir-3').then(m=>m.loadPixeriaFurniture(item));
 registryPromise ||= fetch(new URL('../../inventario/registry.json',import.meta.url),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo no disponible');return r.json();}).catch(e=>{registryPromise=null;throw e;});
 const registry=await registryPromise,number=registry.numbers[assetForInstance(item)];
 if(!number)return null;
 const root=await cloneFurniture(number,tier);if(number===51){const {hydrateLibrary}=await import('../../inventario/cafebreria/library-runtime.mjs?v=windows-menu-1');hydrateLibrary(root);}return root;
}
