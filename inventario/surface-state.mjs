// Versioned appearance only. Neither master GLBs nor ITIL lifecycle records are written.
export const SURFACE_SCHEMA=1;
export const surfaceKey=name=>/^#[0-9a-f]{6}/i.test(name||'')?name.slice(0,7).toLowerCase():String(name||'material').slice(0,160);
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validatePatches(input,allowed){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid surfaces');
 const result=Object.create(null),entries=Object.entries(input);if(entries.length>64)throw Error('Too many surfaces');
 for(const [key,p]of entries){
  if(!key||['__proto__','constructor','prototype'].includes(key)||key.length>160||allowed&&!allowed.includes(key))throw Error('Unknown surface');
  if(!p||typeof p!=='object'||!/^#[0-9a-f]{6}$/i.test(p.color))throw Error('Invalid colour');
  if(!finite(p.roughness,0,1)||!finite(p.metalness,0,1)||!finite(p.repeat, .25,16)||!finite(p.rotation,-180,180))throw Error('Invalid finish');
  if(p.image!=null&&(!/^[a-z0-9-]{1,80}$/i.test(p.image)))throw Error('Invalid image');
  result[key]={color:p.color.toLowerCase(),roughness:p.roughness,metalness:p.metalness,repeat:p.repeat,rotation:p.rotation,image:p.image||null};
 }
 return result;
}
export function documentKey(identity){
 if(!identity?.venue||!identity?.instance||!identity?.code||![identity.venue,identity.instance,identity.code].every(v=>typeof v==='string'&&/^[a-z0-9_-]{1,100}$/i.test(v)))throw Error('Invalid identity');
 return [identity.venue,identity.instance,identity.code].join('/');
}
export const clone=value=>JSON.parse(JSON.stringify(value));
export function nextDocument(previous,identity,patches,{baseRevision=0,action='apply',now=new Date().toISOString(),id=''}={}){
 const key=documentKey(identity);if(previous&&previous.key!==key)throw Error('Identity mismatch');
 if((previous?.revision||0)!==baseRevision)throw Error('CONFLICT');
 const revision=baseRevision+1,clean=validatePatches(patches);
 return {schema:SURFACE_SCHEMA,key,identity:clone(identity),revision,patches:clean,history:[...(previous?.history||[]),{id,revision,date:now,action,patches:clone(clean)}]};
}
export function parseBundle(input,identity,allowed){
 if(input?.schema!==SURFACE_SCHEMA||documentKey(input.identity)!==documentKey(identity))throw Error('This file belongs to another unit');
 const patches=validatePatches(input.patches,allowed),images=Object.create(null);
 for(const id of new Set(Object.values(patches).map(p=>p.image).filter(Boolean))){
  const value=input.images?.[id];if(typeof value!=='string'||value.length>3000000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))throw Error('Invalid image data');images[id]=value;
 }
 return {patches,images};
}
