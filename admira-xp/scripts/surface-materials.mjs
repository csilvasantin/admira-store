import * as T from './premium-three.mjs';
import {surfaceKey,validatePatches} from '../../inventario/surface-state.mjs';
import {readAppearance,readImage,watchAppearance} from '../../inventario/surface-store.mjs';
// Clones materials, not the shared geometry or embedded maps. Disposal owns only clones.
export function createSurfaceBinding(root,{resolveImage=readImage,loadTexture=data=>new T.TextureLoader().loadAsync(data)}={}){
 const originals=new Map(),entries=new Map(),meshKeys=new WeakMap();let epoch=0,disposed=false;const textures=new Set();let activeImages=new Map();
 root.traverse(mesh=>{if(!mesh.isMesh||mesh.userData.textureEditable===false||mesh.userData.liveMedia||mesh.userData.mediaSurface)return;
  const source=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const keys=[];const replacements=source.map(m=>{
   if(!originals.has(m))originals.set(m,m.clone());const copy=originals.get(m),key=surfaceKey(m.name||m.userData.surfaceKey);
   keys.push(key);if(!entries.has(key))entries.set(key,[]);if(!entries.get(key).some(e=>e.material===copy))entries.get(key).push({material:copy,original:m});return copy;
  });meshKeys.set(mesh,keys);mesh.material=Array.isArray(mesh.material)?replacements:replacements[0];
 });
 const surfaces=[...entries].map(([key,[entry]])=>({key,color:'#'+entry.original.color.getHexString(),roughness:entry.original.roughness??.7,metalness:entry.original.metalness??0,repeat:1,rotation:0,image:null}));
 async function apply(input,images={}){
  const patches=validatePatches(input,surfaces.map(s=>s.key)),ticket=++epoch,loaded=new Map(),fresh=new Set();
  try{const results=await Promise.allSettled(Object.entries(patches).map(async([key,p])=>{if(!p.image)return;
   if(activeImages.get(key)?.id===p.image){loaded.set(key,activeImages.get(key).map);return;}
   const data=images[p.image]||await resolveImage(p.image);if(!data)throw Error('Missing image');
   const map=await loadTexture(data);loaded.set(key,map);fresh.add(map);map.colorSpace=T.SRGBColorSpace;map.flipY=false;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;
  }));const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;}catch(error){for(const map of fresh)map.dispose();throw error;}
  if(disposed||ticket!==epoch){for(const map of fresh)map.dispose();return false;}
  const retained=new Set(loaded.values());for(const map of textures)if(!retained.has(map))map.dispose();textures.clear();activeImages=new Map();
  for(const [key,map]of loaded){const patch=patches[key];map.repeat.set(patch.repeat,patch.repeat);map.center.set(.5,.5);map.rotation=patch.rotation*Math.PI/180;activeImages.set(key,{id:patch.image,map});}
  for(const [key,items]of entries)for(const {material,original}of items){const wireframe=material.wireframe;material.copy(original);material.wireframe=wireframe;
   const patch=patches[key];if(patch){material.color.set(patch.color);material.map=loaded.get(key)||null;material.roughness=patch.roughness;material.metalness=patch.metalness;}material.needsUpdate=true;
  }
  for(const map of loaded.values())textures.add(map);return true;
 }
 return {surfaces,keyFor:(mesh,index=0)=>meshKeys.get(mesh)?.[index],apply,dispose(){if(disposed)return;disposed=true;epoch++;for(const map of textures)map.dispose();for(const copy of originals.values())copy.dispose();textures.clear();}};
}
export function connectAppearance(binding,identity,onChange=()=>{},onError=()=>{}){
 let stopped=false,request=0;
 const refresh=async()=>{const ticket=++request;try{const doc=await readAppearance(identity);if(stopped||ticket!==request)return;if(await binding.apply(doc?.patches||{}))onChange(doc);}catch(error){if(!stopped)onError(error);}};
 const unwatch=typeof window==='undefined'?()=>{}:watchAppearance(identity,refresh);
 if(typeof indexedDB!=='undefined')refresh();
 return()=>{stopped=true;request++;unwatch();binding.dispose();};
}
