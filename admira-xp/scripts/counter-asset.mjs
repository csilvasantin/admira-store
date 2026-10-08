import {GLTFLoader} from './vendor/GLTFLoader.mjs';
const cache=new Map();
// Mostrador (pieza 1): Good/Better/Best y, desde r22, Hiperreal (LOD web ≤5 MB; HD en mostrador/hiperreal/).
export const COUNTER_TIERS=Object.freeze(['good','better','best','hiperreal']);
export const COUNTER_HIPERREAL_VERSION='hiperreal-tanda7-20261008-1';
export function counterURL(tier='best',extension='glb'){
 if(!COUNTER_TIERS.includes(tier)||!['glb','blend'].includes(extension))throw Error('Perfil no válido');
 const url=new URL(`../../inventario/assets/mostrador/counter-interpreted-${tier}.${extension}`,import.meta.url);
 if(tier==='hiperreal')url.searchParams.set('v',COUNTER_HIPERREAL_VERSION);
 return url.href;
}
// Render antes/después y GLB HD del Hiperreal: catalog/<nn>/hiperreal/ en el catálogo, mostrador/hiperreal/ en la pieza 1.
export function hiperrealExtrasBase(number){return number===1?'/inventario/assets/mostrador/hiperreal/':`/inventario/assets/catalog/${String(number).padStart(2,'0')}/hiperreal/`;}
export async function cloneCounter(tier='best'){
 if(!cache.has(tier))cache.set(tier,(async()=>{
  const response=await fetch(counterURL(tier),{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('No se pudo cargar el mostrador 3D');
  return (await new GLTFLoader().parseAsync(await response.arrayBuffer(),counterURL(tier))).scene;
 })().catch(error=>{cache.delete(tier);throw error;}));
 const root=(await cache.get(tier)).clone(true);
 root.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
 return root;
}
