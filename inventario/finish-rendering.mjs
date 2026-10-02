import * as T from '../admira-xp/scripts/premium-three.mjs';

// Whole device-pixel blocks, centered with a small remainder instead of blurring.
export function pixelLayout(width,height,limit=112){
 const scale=Math.max(1,Math.ceil(Math.max(width,height)/limit));
 const w=Math.max(1,Math.floor(width/scale)),h=Math.max(1,Math.floor(height/scale));
 return {width:w,height:h,scale,x:Math.floor((width-w*scale)/2),y:Math.floor((height-h*scale)/2)};
}
export function pixelFinish(root){
 const gradient=new T.DataTexture(new Uint8Array([96,96,96,255,176,176,176,255,255,255,255,255]),3,1,T.RGBAFormat);
 gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.generateMipmaps=false;gradient.needsUpdate=true;
 const materials=new Map(),textures=new Map();
 root.traverse(mesh=>{if(!mesh.isMesh)return;
  const convert=source=>{
   if(materials.has(source))return materials.get(source);
   let map=null;if(source.map){if(!textures.has(source.map)){const copy=source.map.clone();copy.minFilter=copy.magFilter=T.NearestFilter;copy.generateMipmaps=false;copy.needsUpdate=true;textures.set(source.map,copy);}map=textures.get(source.map);}
   const material=new T.MeshToonMaterial({color:source.color,map,gradientMap:gradient,side:source.side,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest,toneMapped:false});material.name=source.name;materials.set(source,material);return material;
  };
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material);mesh.castShadow=mesh.receiveShadow=false;
 });
 return ()=>{materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());gradient.dispose();};
}
export function preciseTextureSampling(root,maxAnisotropy){
 const maps=new Map(),materials=new Map();
 root.traverse(mesh=>{if(!mesh.isMesh)return;const copy=source=>{if(!materials.has(source)){const material=source.clone();for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(source[key]){if(!maps.has(source[key])){const map=source[key].clone();map.anisotropy=Math.min(16,maxAnisotropy);map.needsUpdate=true;maps.set(source[key],map);}material[key]=maps.get(source[key]);}materials.set(source,material);}return materials.get(source);};mesh.material=Array.isArray(mesh.material)?mesh.material.map(copy):copy(mesh.material);});
 return ()=>{materials.forEach(material=>material.dispose());maps.forEach(map=>map.dispose());};
}
export function drawPixels(context,source,width,height){
 context.imageSmoothingEnabled=false;context.clearRect(0,0,width,height);
 const fit=Math.min(width/source.width,height/source.height),scale=fit<1?fit:Math.floor(fit);
 const w=Math.max(1,Math.floor(source.width*scale)),h=Math.max(1,Math.floor(source.height*scale));context.drawImage(source,Math.floor((width-w)/2),Math.floor((height-h)/2),w,h);
}
export function pixelPreview(stage,src,alt,onLoad,onError){
 const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',alt);canvas.className='pixel-preview';const context=canvas.getContext('2d'),image=new Image();let loaded=false;
 const draw=()=>{if(!loaded)return;const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));drawPixels(context,image,canvas.width,canvas.height);};
 const observer=new ResizeObserver(draw);observer.observe(stage);image.onload=()=>{loaded=true;draw();onLoad?.();};image.onerror=()=>{observer.disconnect();canvas.remove();onError?.();};image.src=src;stage.append(canvas);
 return ()=>{observer.disconnect();image.onload=image.onerror=null;};
}
