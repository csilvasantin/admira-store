import {GLTFLoader} from './vendor/GLTFLoader.mjs';
const cache=new Map();
export function counterURL(tier='best',extension='glb'){
 if(!['good','better','best'].includes(tier)||!['glb','blend'].includes(extension))throw Error('Perfil no válido');
 return new URL(`../../inventario/assets/mostrador/counter-interpreted-${tier}.${extension}`,import.meta.url).href;
}
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
