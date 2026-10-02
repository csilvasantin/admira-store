import {openLifeView,closeLifeView,subscribeLifeView} from './life-ui.mjs?v=shelf-products-1';
import {createBestPeopleLayer} from './best-live-people.mjs?v=anon-demo-v1';
import {mountMatrixFurniture} from './matrix-furniture.mjs?v=anon-demo-v1';
import {projectMatrixFloor} from './matrix-floor.mjs?v=matrix-furniture-1';
import {mountTierHud} from './tier-hud.mjs?v=starbucks-room-1';
import {mountMatrixExterior} from './matrix-exterior.mjs?v=exterior-1';

// Best keeps the Avenida Admira room as its backdrop. Furniture and visitors
// are separate, depth-sorted layers driven by the shared Xtanco inventory.
const listeners=new Set();
let starbucksDelegate=false;
subscribeLifeView(state=>{if(starbucksDelegate)for(const listener of listeners)listener(state);});
let dialog,people,furniture,exterior,lastFocus,requestId,removeAbort,hud,busy=false,viewError='';
const announce=(reason='')=>{for(const fn of listeners)fn({open:!!dialog,busy,error:viewError,reason,requestId});};
export function subscribeBestView(fn){listeners.add(fn);return ()=>listeners.delete(fn);}

export function closeBestView(reason=''){
  if(starbucksDelegate){closeLifeView(reason);starbucksDelegate=false;return;}
  if(!dialog)return;
  const current=dialog;dialog=null;
  removeAbort?.();removeAbort=null;people?.dispose();people=null;furniture?.dispose();furniture=null;exterior?.dispose();exterior=null;hud?.dispose();hud=null;
  const image=current.querySelector('.matrix-reference-clean');image.onload=null;image.onerror=null;
  current.close();current.remove();busy=false;viewError='';lastFocus?.focus?.();
  announce(typeof reason==='string'?reason:'');
}

export function openBestView(options={}){
  if(globalThis.XpaceStarbucks?.active()||(new URLSearchParams(location.search).get('select')==='products'&&window.__xtancoVisualState?.()?.vertical==='xtanco')){starbucksDelegate=true;return openLifeView({...options,tier:'best'});}
  if(dialog||options.signal?.aborted)return;
  requestId=options.requestId;lastFocus=document.activeElement;busy=true;viewError='';
  dialog=document.createElement('dialog');
  dialog.className='matrix-dialog best-dialog visual-tier-surface';
  dialog.setAttribute('aria-label','Best · Avenida Admira · mobiliario editable y visitantes en vivo');
  dialog.innerHTML=`<figure class="best-stage">
    <div class="best-live-scene">
      <img class="best-reference matrix-reference-clean" src="assets/best-xtanco-avenida-admira-mudanza-20260915.png" alt="La sala de Xtanco en Avenida Admira, con suelo y paredes. Los muebles se muestran en capas independientes.">
    </div>
    <p class="visual-surface-badge">03.- BEST · 32 BITS · MOBILIARIO EDITABLE</p>
    <figcaption>Inventario compartido · /inventario</figcaption>
    <p class="matrix-furniture-selection" role="status" hidden></p>
    <p class="best-image-error" role="alert" hidden>No se ha podido cargar Best. Puedes cambiar de vista desde el menú avanzado o el CLI.</p>
  </figure>`;
  const current=dialog,image=current.querySelector('.matrix-reference-clean');
  hud=mountTierHud(current,{mode:'best',stage:current.querySelector('.best-stage')});
  let started=false,furnitureReady=false,failed=false;
  const showError=message=>{
    if(dialog!==current)return;
    failed=true;busy=false;viewError=message;current.querySelector('.best-image-error').textContent=message;
    current.querySelector('.best-image-error').hidden=false;announce();
  };
  const finish=()=>{
    if(dialog!==current||failed||!furnitureReady||!people||!busy)return;
    busy=false;viewError='';current.querySelector('.best-image-error').hidden=true;announce();
  };
  image.onload=()=>{
    if(dialog!==current||started)return;
    started=true;
    const container=current.querySelector('.best-live-scene');
    // Street, grass, city and rain outside the room: presentation only, never blocks Best.
    try{exterior=mountMatrixExterior(container);}catch{exterior=null;}
    try{
      furniture=mountMatrixFurniture(container,{
        onReady(error=''){
          if(dialog!==current)return;
          if(error){showError(`No se pudo cargar el mobiliario de Best. ${String(error)}`);return;}
          furnitureReady=true;finish();
        },
        onSelect(piece){
          if(dialog!==current)return;
          const selection=current.querySelector('.matrix-furniture-selection');
          selection.hidden=!piece;
          selection.textContent=piece?`${piece.number} · ${piece.label} · /inventario eliminar ${piece.number}`:'';
        }
      });
    }catch{showError('No se pudo cargar el mobiliario de Best. Puedes cambiar de vista desde el menú avanzado o el CLI.');return;}
    try{people=createBestPeopleLayer({container,projectFloor:projectMatrixFloor,walkSprites:true,getOccluders:()=>furniture?.occluders||[]});}
    catch{showError('No se pudieron cargar los visitantes de Best. Puedes cambiar de vista desde el menú avanzado o el CLI.');return;}
    finish();
  };
  image.onerror=()=>showError('No se ha podido cargar la escena de Avenida Admira. Puedes cambiar de vista desde el menú avanzado o el CLI.');
  for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress']){
    current.addEventListener(type,event=>{
      event.stopPropagation();
      if(type==='keydown'&&event.key==='Escape'){event.preventDefault();closeBestView();}
    });
  }
  current.addEventListener('cancel',event=>{event.preventDefault();closeBestView();});
  const abort=()=>{if(dialog===current)closeBestView('switch');};
  options.signal?.addEventListener('abort',abort,{once:true});
  removeAbort=()=>options.signal?.removeEventListener('abort',abort);
  try{
    window.__xtancoSyncVisualSurface?.();document.body.append(current);current.show();
    current.getBoundingClientRect();current.classList.add('is-visible');window.__xtancoReleaseInputs?.();
  }catch(error){closeBestView('error');throw error;}
  announce();
  // Cached successes and cached failures may complete before their handlers run.
  if(image.complete){if(image.naturalWidth>0)image.onload();else image.onerror();}
}

window.addEventListener('pagehide',()=>closeBestView('pagehide'));
