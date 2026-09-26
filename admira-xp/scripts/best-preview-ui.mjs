import {mountInventoryBest} from './inventory-best.mjs?v=px-1';
import {mountTierHud} from './tier-hud.mjs?v=tier-hud-1';
const listeners=new Set();
let inventoryDispose;
let dialog,lastFocus,requestId,removeAbort,hud,busy=false,viewError='';
const announce=(reason='')=>{for(const fn of listeners)fn({open:!!dialog,busy,error:viewError,reason,requestId});};
export function subscribeBestView(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function closeBestView(reason=''){
  if(!dialog)return;
  inventoryDispose?.();inventoryDispose=null;removeAbort?.();removeAbort=null;hud?.dispose();hud=null;
  dialog.close();dialog.remove();dialog=null;busy=false;viewError='';lastFocus?.focus?.();announce(typeof reason==='string'?reason:'');
}
export function openBestView(options={}){
  if(dialog||options.signal?.aborted)return;
  requestId=options.requestId;lastFocus=document.activeElement;busy=true;viewError='';
  dialog=document.createElement('dialog');dialog.className='best-dialog visual-tier-surface';dialog.setAttribute('aria-label','Best · Xtanco 3D en vivo');
  dialog.innerHTML='<figure class="best-stage"><p class="visual-surface-badge">03.- BEST · 32 BITS · 3D EN VIVO</p></figure>';
  hud=mountTierHud(dialog,{mode:'best',stage:dialog.querySelector('.best-stage')});
  window.__xtancoSyncVisualSurface?.();document.body.append(dialog);dialog.show();dialog.getBoundingClientRect();dialog.classList.add('is-visible');window.__xtancoReleaseInputs?.();
  for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress'])dialog.addEventListener(type,event=>{
    event.stopPropagation();if(type==='keydown'&&event.key==='Escape'){event.preventDefault();closeBestView();}
  });
  const current=dialog;
  const abort=()=>{if(dialog===current)closeBestView('switch');};
  options.signal?.addEventListener('abort',abort,{once:true});removeAbort=()=>options.signal?.removeEventListener('abort',abort);
  announce();
  // Best always reads the same live layout and actors, including inventory edits.
  // A static concept image is not substituted for a failed 3D renderer.
  const dispose=mountInventoryBest(current.querySelector('.best-stage'),error=>{
    if(dialog!==current)return;
    busy=false;viewError=typeof error==='string'?error:'';announce();
  });
  if(dialog===current)inventoryDispose=dispose;else dispose();
}
window.addEventListener('pagehide',()=>closeBestView('pagehide'));
