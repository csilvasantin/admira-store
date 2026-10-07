import {mountMatrixPanorama} from './matrix-panorama.mjs?v=avatar-panel-1';
import {mountTierHud} from './tier-hud.mjs?v=20261006-alsea-repair-1';
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
 dialog=document.createElement('dialog');const current=dialog;current.className='matrix-panorama-dialog best-dialog visual-tier-surface';current.setAttribute('aria-label','Matrix · Starbucks Alsea · 360°');
 current.innerHTML='<div class="matrix-capture-stage"></div>';const root=current.firstElementChild;
 const abort=()=>{if(dialog===current)closeMatrixView('switch');};options.signal?.addEventListener('abort',abort,{once:true});controller.signal.addEventListener('abort',()=>options.signal?.removeEventListener('abort',abort),{once:true});
 for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress'])current.addEventListener(type,e=>{e.stopPropagation();if(type==='keydown'&&e.key==='Escape'){e.preventDefault();closeMatrixView();}});
 current.addEventListener('cancel',e=>{e.preventDefault();closeMatrixView();});
 document.body.classList.add('xpace-matrix-active');window.__xtancoSyncVisualSurface?.();document.body.append(current);current.show();current.getBoundingClientRect();current.classList.add('is-visible');window.__xtancoReleaseInputs?.();announce();
 const stop=await mountMatrixPanorama(root,{signal:controller.signal,lang:document.documentElement.lang,onReady(error=''){
  if(dialog!==current)return;busy=false;viewError=error;if(error)window.__xpaceMatrixBoot?.fail();else window.__xpaceMatrixBoot?.ready();hud?.setStatus(error?'Error':(document.documentElement?.lang==='en'?'360° capture · virtual players':'Captura 360° · players virtuales'));announce();
 }});
 if(dialog!==current){stop?.();return;}dispose=stop;hud=mountTierHud(current,{mode:'matrix',stage:root});hud.setStatus(viewError?'Error':(document.documentElement?.lang==='en'?'360° capture · virtual players':'Captura 360° · players virtuales'));
}
window.addEventListener('pagehide',()=>closeMatrixView('pagehide'));
