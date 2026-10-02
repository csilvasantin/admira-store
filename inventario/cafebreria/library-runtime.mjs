import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {mountCapsulas} from './capsulas.mjs?v=cafebreria-1';
export const LIBRARY_ID='native:cafebreriaLibrary';
export const LIBRARY_NUMBER=51;
export const LIBRARY_SIZE=Object.freeze({ancho:1.6,fondo:.28,alto:1.1,unidad:'m'});
export const libraryEntry=(object,id=LIBRARY_ID)=>({id,nombre:'Librería interactiva de Cafebrería',object,medidas:LIBRARY_SIZE,runtime:{builder:'estanteria-libros'}});

// Editable GLB structure is preserved. Only dynamic book/record contents and the
// virtual television display are hydrated; importing never sends signage commands.
export function ensureLibraryStyles(){for(const file of ['contents.css','theme.css','../../admira-xp/scripts/floating-panels.css']){const href=new URL(file,import.meta.url).href;if(!document.querySelector('link[data-library-css="'+file+'"]')){const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.libraryCss=file;document.head.append(link);}}}
export function hydrateLibrary(root){
 ensureLibraryStyles();
 let shelf=root.getObjectByName('estanteria-libros');if(!shelf)return root;
 let books=shelf.getObjectByName('libros-capsulas');if(!books){books=new T.Group();books.name='libros-capsulas';shelf.add(books);}
 books.clear();shelf.getObjectByName('vinilos-preview')?.removeFromParent();
 const tv=shelf.getObjectByName('tele-sabias-que'),display=tv?.getObjectByName('tv-display');
 if(tv&&display){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=288;const c=canvas.getContext('2d');c.fillStyle='#111';c.fillRect(0,0,512,288);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;display.material=new T.MeshBasicMaterial({map:texture,toneMapped:false});tv.userData.sabiasQue={canvas,texture};}
 shelf.userData.shelf={W:1.6,D:.28,H:1.1,t:.025,gap:(1.1-.025)/3,rows:3,books,tv};root.userData.cafebreriaLibrary=true;return root;
}
export function createLibraryRuntime({canvas,scene,viewer,isEditing=()=>false}){
 const active=new Map();let disposed=false;
 function reconcile(world){
  if(disposed)return;const found=new Set();for(const owner of world.children){if(owner.userData.cafebreriaLibrary)found.add(owner);if(owner.userData.item?.type==='cafebreriaLibrary')for(const asset of owner.children)if(asset.userData.cafebreriaLibrary)found.add(asset);}
  for(const [root,entry]of active)if(!found.has(root)){entry.abort.abort();active.delete(root);}
  for(const root of found)if(!active.has(root)){
   const shelf=root.getObjectByName('estanteria-libros');if(!shelf?.userData.shelf)continue;
   let owner=root;while(owner.parent&&!owner.userData.item)owner=owner.parent;
   const abort=new AbortController(),entries=[libraryEntry(shelf,owner.userData.item?.id||LIBRARY_ID)];
   const controller=mountCapsulas({scene,entries,signal:abort.signal});controller.setViewer(viewer);
   const on=(element,type,fn)=>element.addEventListener(type,e=>{if(!isEditing())fn(e);},{signal:abort.signal});
   controller.attachUI({stage:canvas.parentElement,canvas,on});active.set(root,{abort,controller,owner});
  }
 }
 function select(node){if(disposed||!node)return false;for(const {controller,owner}of active.values())if(node===owner){controller.enterDetail();return true;}return false;}
 function dispose(){if(disposed)return;disposed=true;for(const entry of active.values())entry.abort.abort();active.clear();}
 return {reconcile,select,dispose};
}
