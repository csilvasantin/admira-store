/* Shared presentation state. No physical device or simulation mutations. */
(function(root){
'use strict';
const prefix='xpaceos:inventari:v1:',listeners=new Set();
const valid=s=>typeof s==='string'&&s.length>0&&s.length<180&&!['__proto__','constructor','prototype'].includes(s);
function read(space){try{const d=JSON.parse(root.localStorage.getItem(prefix+space)||'{}');return d&&typeof d==='object'&&!Array.isArray(d)?d:{};}catch{return {};}}
function visible(space,id){return !valid(id)||read(space)[id]?.visible!==false;}
function save(space,id,value){if(!valid(space)||!valid(id)||typeof value!=='boolean')throw Error('Elemento no válido');const d=read(space);d[id]={visible:value,updatedAt:Date.now()};root.localStorage.setItem(prefix+space,JSON.stringify(d));emit(space);}
function restore(space){if(!valid(space))throw Error('Xpacio no válido');root.localStorage.removeItem(prefix+space);emit(space);}
function emit(space){for(const fn of listeners)fn(space);root.dispatchEvent?.(new Event('xpaceos-inventory-change'));}
root.addEventListener?.('storage',e=>{if(e.key?.startsWith(prefix))emit(e.key.slice(prefix.length));});
root.XpaceInventory={visible,setVisible:save,restore,read,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
 filter(space,layout){const d=read(space);return layout.filter(i=>d[i.id]?.visible!==false);},
 publish(space,layout){try{const value=JSON.stringify(layout);const key='xpaceos:inventory-layout:'+space;if(root.localStorage.getItem(key)!==value)root.localStorage.setItem(key,value);}catch{}},
 layout(space){try{const d=JSON.parse(root.localStorage.getItem('xpaceos:inventory-layout:'+space));return Array.isArray(d)?d:null;}catch{return null;}}};
})(typeof window==='undefined'?globalThis:window);
