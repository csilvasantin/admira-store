import {mountMatrixPanorama} from './matrix-panorama.mjs?v=ainimation-scene-1';
import {mountTierHud} from './tier-hud.mjs?v=sneakers-matrix-1';
import {matrixVenue,MATRIX_VENUES} from './xtanco-visual-tiers.mjs?v=sneakers-matrix-1';
// Venues with their own Matrix module; the rest (generic entry) is the Starbucks capture.
const VENUE_MOUNTS={'sneakers-store-santa-rosa-19':()=>import('./matrix-sneakers.mjs?v=sneakers-matrix-1').then(m=>m.mountSneakersMatrix)};
const listeners=new Set();
let dialog,dispose,controller,hud,requestId,lastFocus,busy=false,viewError='';
const announce=(reason='')=>{for(const fn of listeners)fn({open:!!dialog,busy,error:viewError,reason,requestId});};
export function subscribeMatrixView(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function closeMatrixView(reason=''){
 if(!dialog)return;const current=dialog;dialog=null;controller?.abort();controller=null;dispose?.();dispose=null;hud?.dispose();hud=null;current.close();current.remove();document.body.classList.remove('xpace-matrix-active');busy=false;viewError='';lastFocus?.focus?.();announce(typeof reason==='string'?reason:'');
}
export async function openMatrixView(options={}){
 if(dialog||options.signal?.aborted)return;
 requestId=options.requestId;lastFocus=document.activeElement;busy=true;viewError='';controller=new AbortController();
 dialog=document.createElement('dialog');const current=dialog;current.className='matrix-panorama-dialog best-dialog visual-tier-surface';const venue=MATRIX_VENUES[matrixVenue(location.search)],venueMount=venue&&VENUE_MOUNTS[venue.loc];current.setAttribute('aria-label',`Matrix · ${venueMount?venue.es:'Starbucks Alsea'} · 360°`);if(venueMount)current.dataset.matrixVenue=venue.loc;
 current.innerHTML='<div class="matrix-capture-stage"></div>';const root=current.firstElementChild;
 const abort=()=>{if(dialog===current)closeMatrixView('switch');};options.signal?.addEventListener('abort',abort,{once:true});controller.signal.addEventListener('abort',()=>options.signal?.removeEventListener('abort',abort),{once:true});
 for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress'])current.addEventListener(type,e=>{e.stopPropagation();if(type==='keydown'&&e.key==='Escape'){e.preventDefault();closeMatrixView();}});
 current.addEventListener('cancel',e=>{e.preventDefault();closeMatrixView();});
 document.body.classList.add('xpace-matrix-active');window.__xtancoSyncVisualSurface?.();document.body.append(current);current.show();current.getBoundingClientRect();current.classList.add('is-visible');window.__xtancoReleaseInputs?.();announce();
 let mount=mountMatrixPanorama;if(venueMount){try{mount=await venueMount();}catch(error){if(dialog!==current)return;busy=false;viewError=String(error?.message||error);window.__xpaceMatrixBoot?.fail();announce();return;}if(dialog!==current)return;}
 const stop=await mount(root,{signal:controller.signal,lang:document.documentElement.lang,onReady(error=''){
  if(dialog!==current)return;busy=false;viewError=error;if(error)window.__xpaceMatrixBoot?.fail();else window.__xpaceMatrixBoot?.ready();hud?.setStatus(error?'Error':(document.documentElement?.lang==='en'?'360° capture · virtual players':'Captura 360° · players virtuales'));announce();
 }});
 if(dialog!==current){stop?.();return;}dispose=stop;hud=mountTierHud(current,{mode:'matrix',stage:root,...(venueMount?{caption:`${venue.es} · captura 360° y players`,captionEn:`${venue.en} · 360° capture and players`}:{})});hud.setStatus(viewError?'Error':(document.documentElement?.lang==='en'?'360° capture · virtual players':'Captura 360° · players virtuales'));
}
window.addEventListener('pagehide',()=>closeMatrixView('pagehide'));
