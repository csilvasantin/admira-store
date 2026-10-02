import {documentKey,nextDocument} from './surface-state.mjs';
let database;
const listeners=new Map();
const channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('xpace-surfaces-v1'):null;
function announce(key){for(const fn of listeners.get(key)||[])fn();}
if(channel)channel.onmessage=event=>{if(typeof event.data==='string')announce(event.data);};
function db(){
 if(typeof indexedDB==='undefined')return Promise.reject(Error('Local storage unavailable'));
 return database||=(new Promise((resolve,reject)=>{const req=indexedDB.open('xpace-surfaces-v1',1);req.onupgradeneeded=()=>{req.result.createObjectStore('units',{keyPath:'key'});req.result.createObjectStore('images');};req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();database=null;};resolve(req.result);};req.onerror=()=>{database=null;reject(req.error);};req.onblocked=()=>reject(Error('Close other editor tabs and retry'));}));
}
export async function readAppearance(identity){const database=await db();return new Promise((resolve,reject)=>{const r=database.transaction('units').objectStore('units').get(documentKey(identity));r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
export async function readImage(id){const database=await db();return new Promise((resolve,reject)=>{const r=database.transaction('images').objectStore('images').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function saveAppearance(identity,patches,baseRevision,action='apply',images={}){
 const database=await db(),key=documentKey(identity);
 const result=await new Promise((resolve,reject)=>{
  const tx=database.transaction(['units','images'],'readwrite'),units=tx.objectStore('units'),imageStore=tx.objectStore('images');let next,failure;
  tx.oncomplete=()=>resolve(next);tx.onerror=()=>reject(failure||tx.error);tx.onabort=()=>reject(failure||tx.error||Error('Save interrupted'));
  const req=units.get(key);req.onsuccess=()=>{try{next=nextDocument(req.result,identity,patches,{baseRevision,action,id:crypto.randomUUID()});
   for(const [id,value]of Object.entries(images)){
    const existing=imageStore.get(id);existing.onsuccess=()=>{if(existing.result&&existing.result!==value){failure=Error('Immutable image mismatch');tx.abort();return;}if(!existing.result)imageStore.put(value,id);};
   }
   // Validate references in the same transaction. Never publish a broken image.
   for(const id of new Set(Object.values(next.patches).map(p=>p.image).filter(Boolean))){const img=imageStore.get(id);img.onsuccess=()=>{if(!img.result&&!images[id]){failure=Error('Missing image');tx.abort();}};}
   units.put(next);
  }catch(error){failure=error;tx.abort();}};
 });
 announce(key);channel?.postMessage(key);return result;
}
export function watchAppearance(identity,callback){const key=documentKey(identity);if(!listeners.has(key))listeners.set(key,new Set());listeners.get(key).add(callback);return()=>{listeners.get(key)?.delete(callback);if(!listeners.get(key)?.size)listeners.delete(key);};}
