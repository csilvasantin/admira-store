import {GLTFLoader} from './vendor/GLTFLoader.mjs';
import {cloneCounter,counterURL} from './counter-asset.mjs';
import {assetForInstance} from '../../inventario/model.mjs?v=ipad-20261005-1';
import {supportsQuality,twinQualityChain,hiperrealBatch,HIPERREAL_REVISION} from '../../inventario/quality-model.mjs?v=hiperreal-tanda5-20261008-1';
const cache=new Map();let registryPromise;
export const inventoryIdFor=assetForInstance;
export function furnitureURL(number,tier='best',extension='glb'){
 if(!Number.isSafeInteger(number)||number<1||number>52||!supportsQuality(number,tier)||!['glb','blend'].includes(extension))throw Error('Pieza o perfil no válido');
 if(number===1)return counterURL(tier,extension);
 const url=new URL(`../../inventario/assets/catalog/${String(number).padStart(2,'0')}/${tier}.${extension}`,import.meta.url);
 if(number===2&&tier==='best')url.searchParams.set('v','shelves-parts-20261002-3');
 if(number===47&&tier==='best')url.searchParams.set('v','coffee47-photo-20261008-1');
 if(number===47&&tier==='matrix')url.searchParams.set('v','coffee47-matrix-20261008-1');
 if(number===47&&tier==='hiperreal')url.searchParams.set('v','coffee47-hiperreal-20261008-1');
 else if(tier==='hiperreal')url.searchParams.set('v','hiperreal-tanda'+hiperrealBatch(number)+'-20261008-'+(HIPERREAL_REVISION[number]||1));
 return url.href;
}
export async function cloneFurniture(number,tier='best'){
 const url=furnitureURL(number,tier);if(number===1)return cloneCounter(tier);
 const key=number+':'+tier;
 if(!cache.has(key))cache.set(key,(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Modelo 3D no disponible');return(await new GLTFLoader().parseAsync(await r.arrayBuffer(),url)).scene;})().catch(e=>{cache.delete(key);throw e;}));
 const root=(await cache.get(key)).clone(true);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return root;
}
// Twin Best: Hiperreal -> Matrix -> Best. A missing or failed download falls through to the next finish.
export async function cloneTwinFurniture(number,tier='best',clone=cloneFurniture){
 const chain=twinQualityChain(number,tier);let failure;
 for(const quality of chain){try{const root=await clone(number,quality);root.userData.assetQuality=quality;return root;}catch(error){failure=error;}}
 throw failure||Error('Modelo 3D no disponible');
}
export async function loadFurniture(item,tier='best'){
 if(item.source==='PixerIA')return import('./pixeria-furniture.mjs?v=distribuir-3').then(m=>m.loadPixeriaFurniture(item));
 registryPromise ||= fetch(new URL('../../inventario/registry.json',import.meta.url),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catálogo no disponible');return r.json();}).catch(e=>{registryPromise=null;throw e;});
 const registry=await registryPromise,number=registry.numbers[assetForInstance(item)];
 if(!number)return null;
 const root=await cloneTwinFurniture(number,tier);if(number===51){const {hydrateLibrary}=await import('../../inventario/cafebreria/library-runtime.mjs?v=windows-menu-1');hydrateLibrary(root);}return root;
}
