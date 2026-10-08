import {openLifeView,closeLifeView,subscribeLifeView} from './life-ui.mjs?v=hiperreal-tanda4-20261008-1';
import {createBestPeopleLayer} from './best-live-people.mjs?v=actor-collision-20261004-1';
import {mountMatrixFurniture} from './matrix-furniture.mjs?v=pixeria-screens-3';
import {projectMatrixFloor} from './matrix-floor.mjs?v=matrix-furniture-1';
import {mountTierHud} from './tier-hud.mjs?v=20261006-alsea-repair-1';
import {mountMatrixExterior} from './matrix-exterior.mjs?v=exterior-1';
import {attachFloatingPanel} from './floating-panels.mjs?v=windows-menu-1';

// Best keeps the Avenida Admira room as its backdrop. Furniture and visitors
// are separate, depth-sorted layers driven by the shared Xtanco inventory.
const listeners=new Set();
let starbucksDelegate=false;
subscribeLifeView(state=>{if(starbucksDelegate)for(const listener of listeners)listener(state);});
let dialog,people,furniture,exterior,lastFocus,requestId,removeAbort,hud,errorWindow,busy=false,viewError='';
const announce=(reason='')=>{for(const fn of listeners)fn({open:!!dialog,busy,error:viewError,reason,requestId});};
export function subscribeBestView(fn){listeners.add(fn);return ()=>listeners.delete(fn);}

export function closeBestView(reason=''){
  if(starbucksDelegate){closeLifeView(reason);starbucksDelegate=false;return;}
  if(!dialog)return;
  delete window.XpaceSceneScreens;
  const current=dialog;dialog=null;
  removeAbort?.();removeAbort=null;errorWindow?.dispose();errorWindow=null;people?.dispose();people=null;furniture?.dispose();furniture=null;exterior?.dispose();exterior=null;hud?.dispose();hud=null;
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
    <p class="visual-surface-badge" style="display:none">03.- BEST · 32 BITS · MOBILIARIO EDITABLE</p>
    <figcaption style="display:none">Inventario compartido · /inventario</figcaption>
    <p class="matrix-furniture-selection" role="status" style="display:none" hidden></p>
    <section class="best-image-error" role="alert" hidden><p class="best-image-error-message">No se ha podido cargar Best. Puedes cambiar de vista desde el menú avanzado o el CLI.</p></section>
  </figure>`;
  const current=dialog,image=current.querySelector('.matrix-reference-clean');
  window.XpaceSceneScreens={screenAt(x,y){const node=document.elementFromPoint(x,y)?.closest('[data-media-screen]');return node&&current.contains(node)?node.dataset.mediaScreen:null;},screenHighlight(id){for(const node of current.querySelectorAll('[data-media-screen]'))node.classList.toggle('media-drop-over',node.dataset.mediaScreen===id);},previewScreen:(id,track)=>window.XpaceScreenMedia.preview(id,track),restoreScreen:id=>window.XpaceScreenMedia.restore(id)};
  const errorPanel=current.querySelector('.best-image-error');
  errorWindow=attachFloatingPanel(errorPanel,{label:document.documentElement?.lang==='en'?'Best loading error':'Error al cargar Best',bounds:current.querySelector('.best-stage'),key:'xpaceos.window.best-error.v1',menu:'best-error',onOpen:()=>{if(dialog===current&&viewError)errorPanel.hidden=false;}});
  hud=mountTierHud(current,{mode:'best',stage:current.querySelector('.best-stage')});
  let started=false,furnitureReady=false,failed=false;
  const showError=message=>{
    if(dialog!==current)return;
    failed=true;busy=false;viewError=message;current.querySelector('.best-image-error-message').textContent=message;
    errorWindow.open();announce();
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
    try{people=createBestPeopleLayer({container,projectFloor:projectMatrixFloor,walkSprites:true,getOccluders:()=>furniture?.occluders||[]});container.querySelector('.best-people-status')?.style?.setProperty('display','none');}
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
