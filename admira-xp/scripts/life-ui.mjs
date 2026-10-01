import {createLifeSnapshot} from './life-snapshot.mjs?v=distribuir-3';
import {mountTierHud} from './tier-hud.mjs?v=starbucks-room-1';

// The expert Good/Better/Best selector owns launch, routing and preference.
const listeners=new Set();
const announce=(busy=false,error='',reason='')=>{for(const listener of listeners)listener({open:!!dialog,busy,error,reason,requestId});};
function subscribeLifeView(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
const snapshot=createLifeSnapshot();
let dialog,viewer,frame=0,pending=0,generation=0,resizeObserver,lastFocus,requestId,removeAbort,hud,furnitureEditor;
const names={counter:'Mostrador',shelves:'Estantería',wineRack:'Bodega',lottery:'Lotería',vending:'Vending',magazines:'Prensa',manager:'Puesto de gestión',plant:'Vegetación',floorLamp:'Iluminación',rug:'Alfombra',djBooth:'DJ booth',tablet:'Tablet',turnKiosk:'Gestor de turnos',aroma:'Aromatización',metahuman:'Asistente digital',tft:'Pantalla digital',led:'Superficie LED',custom:'Mobiliario'};
const roles={staff:'Equipo',customer:'Cliente del gemelo',passerby:'Transeúnte simulado',saca:'Logística',thief:'Personaje del juego',guardiaCivil:'Personaje del juego',opinador:'Visitante',unitreeBot:'Robot'};
function sceneSlot(){return typeof document.getElementById==='function'?document.getElementById('advSceneControls'):null;}
function clearSceneToolbar(){sceneSlot()?.replaceChildren();}
function parkSceneToolbar(toolbar){const slot=sceneSlot();if(slot&&toolbar)slot.replaceChildren(toolbar);}
function pressGroup(buttons,button){for(const other of buttons){const on=other===button;other.setAttribute('aria-pressed',String(on));if(on)other.classList.add('is-active');else other.classList.remove('is-active');}}
function close(reason=''){
  generation++;cancelAnimationFrame(frame);clearTimeout(pending);resizeObserver?.disconnect();resizeObserver=null;
  removeAbort?.();removeAbort=null;
  closeLifeEditor();viewer?.dispose();viewer=null;hud?.dispose();hud=null;clearSceneToolbar();dialog?.close();dialog?.remove();dialog=null;
  document.body.classList.remove('xtanco-life-open');lastFocus?.focus?.();announce(false,'',typeof reason==='string'?reason:'');
}
function select(data){
  if(!dialog)return;if(furnitureEditor){dialog.querySelector('.life-selection').hidden=true;furnitureEditor.select(data);return;}const panel=dialog.querySelector('.life-selection');panel.hidden=!data;if(!data)return;
  const value=data.item||data.actor;
  panel.querySelector('h2').textContent=value.label||value.name||(data.item?names[value.type]||'Elemento del espacio':roles[value.kind]||'Personaje');
  panel.querySelector('.life-selection-kind').textContent=data.item?'EN ESTE ESPACIO':roles[value.kind]||'PERSONAJE';
  panel.querySelector('p').textContent=data.item?'Elemento del layout actual. Para editarlo, vuelve a los controles del gemelo.':'Posición y movimiento sincronizados con la simulación del gemelo.';
}
async function open(options={}){
  if(dialog||options.signal?.aborted)return;const ticket=++generation;lastFocus=document.activeElement;requestId=options.requestId;
  dialog=document.createElement('dialog');dialog.className='life-dialog visual-tier-surface';dialog.setAttribute('aria-label','Better · gemelo 3D del Xtanco');
  dialog.innerHTML=`<div class="life-stage"><canvas class="life-canvas" tabindex="0" aria-label="Gemelo 3D interactivo. Arrastra para girar, usa las flechas para rotar y más o menos para acercar."></canvas>
    <p class="visual-surface-badge">02.- BETTER · 16 BITS <span class="life-mapping-state">· cámara alineada</span></p>
    <div class="life-location"><span class="life-eyebrow">BARCELONA · GRAN DE GRÀCIA</span><h2>El Xtanco<span>en otra dimensión.</span></h2><p><i aria-hidden="true"></i><span class="life-state">Conectando con el gemelo…</span></p></div>
    <div class="life-loading" role="status"><span class="life-spinner"></span><h2>Abriendo tu espacio</h2><p>Preparando la escena 3D del gemelo…</p><button type="button" class="life-retry" hidden>Reintentar</button></div>
    <aside class="life-selection" hidden><span class="life-eyebrow life-selection-kind"></span><h2></h2><p></p><button type="button" class="life-selection-close" aria-label="Cerrar detalle">×</button></aside>
    <div class="life-toolbar"><div class="life-lights" role="group" aria-label="Iluminación de la escena"><button type="button" class="tg-quick-btn" data-light="day" aria-pressed="true"><strong>☀ Día</strong><span>iluminación</span></button><button type="button" class="tg-quick-btn" data-light="sunset" aria-pressed="false"><strong>◒ Atardecer</strong><span>luz cálida</span></button><button type="button" class="tg-quick-btn" data-light="night" aria-pressed="false"><strong>☾ Noche</strong><span>luz nocturna</span></button></div>
    <div class="life-camera" role="group" aria-label="Cámara"><button type="button" class="tg-quick-btn" data-preset="mapped" aria-pressed="true"><strong>Comparar con Good</strong><span>cámara alineada</span></button><button type="button" class="tg-quick-btn" data-preset="home" aria-pressed="false"><strong>Explorar 3D</strong><span>cámara libre</span></button><button type="button" class="tg-quick-btn" data-preset="floor" aria-pressed="false"><strong>Planta</strong><span>vista cenital</span></button><button type="button" class="tg-quick-btn" data-preset="detail" aria-pressed="false"><strong>Detalle</strong><span>primer plano</span></button><button type="button" class="tg-quick-btn" data-zoom="out" aria-label="Alejar"><strong>−</strong><span>alejar</span></button><button type="button" class="tg-quick-btn" data-zoom="in" aria-label="Acercar"><strong>+</strong><span>acercar</span></button></div></div>
    <div class="life-compass" aria-hidden="true"><span>N</span><b>↟</b></div>
  </div>`;
  const venue=globalThis.XpaceStarbucks?.active(),best=options.tier==='best';
  if(venue){dialog.setAttribute('aria-label',(best?'Best':'Better')+' · Starbucks Paseo de Gracia 103');
    dialog.dataset.venue='alsea-sbux-021';dialog.dataset.quality=best?'best':'better';
    dialog.querySelector('.life-eyebrow').textContent='BARCELONA · PASSEIG DE GRÀCIA 103';
    dialog.querySelector('.life-location h2').textContent='Starbucks · Alsea';
    dialog.querySelector('.visual-surface-badge').firstChild.textContent=best?'03.- BEST · 32 BITS ':'02.- BETTER · 16 BITS ';
  }
  const cafe=!venue&&window.__xtancoVisualState?.()?.vertical==='cafeteria';
  if(cafe){dialog.setAttribute('aria-label','Better · Cafebrería');dialog.querySelector('.life-location h2').textContent='Cafebrería · café y libros';}
  hud=mountTierHud(dialog,{mode:best?'best':'better',stage:dialog.querySelector('.life-stage')});
  window.__xtancoSyncVisualSurface?.();
  const abort=()=>{if(ticket===generation)close('switch');};
  options.signal?.addEventListener('abort',abort,{once:true});removeAbort=()=>options.signal?.removeEventListener('abort',abort);
  announce(true);dialog.querySelector('.life-selection-close').onclick=()=>viewer?.clearSelection();
  // Some legacy controls hit-test document clicks by coordinates, not target.
  // Keep modal interactions local without suppressing canvas/button handlers.
  for(const event of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu'])dialog.addEventListener(event,e=>e.stopPropagation());
  for(const event of ['keydown','keyup','keypress'])dialog.addEventListener(event,e=>{
    e.stopPropagation();if(event!=='keydown')return;
    if(furnitureEditor?.keydown(e))return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.target!==dialog.querySelector('canvas'))return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();viewer?.rotate(e.key==='ArrowLeft'?1:-1);}
    if(e.key==='+'||e.key==='='||e.key==='-'){e.preventDefault();viewer?.zoomBy(e.key==='-'?.88:1.14);}
    if(e.key==='Home'){e.preventDefault();viewer?.preset('mapped');}
  });
  const lightButtons=[...dialog.querySelectorAll('[data-light]')];
  const presetButtons=[...dialog.querySelectorAll('[data-preset]')];
  const zoomButtons=[...dialog.querySelectorAll('[data-zoom]')];
  for(const button of lightButtons)button.onclick=event=>{
    event?.stopPropagation?.();viewer?.setLighting(button.dataset.light);dialog.dataset.light=button.dataset.light;pressGroup(lightButtons,button);
  };
  for(const button of presetButtons)button.onclick=event=>{
    event?.stopPropagation?.();viewer?.preset(button.dataset.preset);dialog.dataset.camera=button.dataset.preset;pressGroup(presetButtons,button);
  };
  for(const button of zoomButtons)button.onclick=event=>{event?.stopPropagation?.();viewer?.zoomBy(button.dataset.zoom==='in'?1.2:1/1.2);};
  pressGroup(lightButtons,lightButtons.find(button=>button.dataset.light==='day')||lightButtons[0]);
  pressGroup(presetButtons,presetButtons.find(button=>button.dataset.preset==='mapped')||presetButtons[0]);
  parkSceneToolbar(dialog.querySelector('.life-toolbar'));
  document.body.append(dialog);dialog.show();dialog.getBoundingClientRect();dialog.classList.add('is-visible');
  window.__xtancoReleaseInputs?.();document.body.classList.add('xtanco-life-open');
  const loading=dialog.querySelector('.life-loading');let canvas=dialog.querySelector('canvas');
  function observeContext(surface){
    surface.addEventListener('webglcontextlost',e=>{
      e.preventDefault();if(ticket!==generation||surface!==canvas||!viewer)return;
      cancelAnimationFrame(frame);fail('La conexión gráfica se ha interrumpido. Reintenta o vuelve al gemelo clásico.');
    });
  }
  function fail(message){
    cancelAnimationFrame(frame);clearTimeout(pending);resizeObserver?.disconnect();resizeObserver=null;
    closeLifeEditor();select(null);
    viewer?.dispose();viewer=null;loading.hidden=false;loading.classList.add('life-error');loading.querySelector('h2').textContent='El 3D no está disponible';loading.querySelector('p').textContent=message;
    const retry=loading.querySelector('button');retry.hidden=false;retry.onclick=()=>{
      if(ticket!==generation||options.signal?.aborted)return;
      // dispose() explicitly loses the old GPU context. A new surface avoids
      // reusing that lost context and isolates its queued contextlost events.
      const fresh=document.createElement('canvas');fresh.className='life-canvas';
      fresh.setAttribute('tabindex','0');fresh.setAttribute('aria-label','Gemelo 3D interactivo. Arrastra para girar, usa las flechas para rotar y más o menos para acercar.');
      canvas.replaceWith(fresh);canvas=fresh;observeContext(canvas);
      started=performance.now();retry.hidden=true;loading.classList.remove('life-error');
      loading.querySelector('h2').textContent='Abriendo tu espacio';loading.querySelector('p').textContent='Preparando la escena 3D del gemelo…';announce(true);void connect();
    };announce(false,message);
  }
  observeContext(canvas);
  let started=performance.now();
  async function connect(){
    if(ticket!==generation)return;const input=snapshot(window.__xtancoVisualState?.());
    if(!input){
      if(performance.now()-started>30000){fail('Abre El Xtanco y elige Avanzado → Better. Tus controles habituales siguen disponibles.');return;}
      pending=setTimeout(connect,180);return;
    }
    try{
      const {createLifeRenderer}=await import('./life-renderer.mjs?v=distribuir-3');if(ticket!==generation)return;
      viewer=createLifeRenderer({canvas,assetQuality:best?'best':'better',snapshot:input,getPlayer:()=>window.__xtoreWindowPlayer,onSelect:select,onCameraChange:state=>{
        if(ticket!==generation||!dialog)return;
        const mapped=state.mode==='mapped';dialog.dataset.camera=mapped?'mapped':'free';
        dialog.querySelector('.life-mapping-state').textContent=mapped?'· cámara alineada':'· exploración libre';
        for(const button of presetButtons){const on=mapped&&button.dataset.preset==='mapped';button.setAttribute('aria-pressed',String(on));if(on)button.classList.add('is-active');else button.classList.remove('is-active');}
      }});
      if(dialog.dataset.light)viewer.setLighting(dialog.dataset.light);
      resizeObserver=new ResizeObserver(()=>{if(viewer&&dialog){const rect=dialog.querySelector('.life-stage').getBoundingClientRect();viewer.resize(rect.width,rect.height);}});resizeObserver.observe(dialog.querySelector('.life-stage'));
      loading.hidden=true;announce();canvas.focus();let lastSnapshot=0,lastStatus=0,current=input;
      function tick(now){
        if(ticket!==generation||!viewer)return;
        try{
          if(!document.hidden){
            if(now-lastSnapshot>=100){const next=snapshot(window.__xtancoVisualState?.());if(!next){close();return;}viewer.update(furnitureEditor?furnitureEditor.decorateSnapshot(next):next);current=next;lastSnapshot=now;}
            if(now-lastStatus>=1000){const count=current.inside??0;const en=document.documentElement?.lang==='en';const status=furnitureEditor?(en?'Distribute · simulation paused':'Distribuir · simulación pausada'):current.moving
              ? (en?'Moving mode · floor and walls only':'Mudanza activa · solo suelo y paredes')
              : en?`Twin connected · ${count} ${count===1?'customer':'customers'} in the simulation`:`Gemelo conectado · ${count} ${count===1?'cliente':'clientes'} en la simulación`;dialog.querySelector('.life-state').textContent=status;hud?.setStatus(status);lastStatus=now;}
            viewer.render(now);
          }
          frame=requestAnimationFrame(tick);
        }catch(error){console.warn('[Xtanco 3D]',error);fail('No se ha podido dibujar la escena. Puedes reintentar sin reiniciar el gemelo.');}
      }
      frame=requestAnimationFrame(tick);
    }catch(error){if(ticket===generation){console.warn('[Xtanco 3D]',error);fail('Este dispositivo no ha podido iniciar WebGL. El gemelo clásico continúa disponible.');}}
  }
  void connect();
}
async function openLifeEditor(){
  if(!dialog||!viewer||!window.__xtancoFurnitureEditor)return false;
  if(furnitureEditor)return true;
  const ticket=generation;
  const {mountDistribuit}=await import('./distribuit-ui.mjs?v=distribuir-3');
  if(ticket!==generation||!viewer)return false;
  if(furnitureEditor)return true;
  try{furnitureEditor=mountDistribuit({dialog,viewer,bridge:window.__xtancoFurnitureEditor,onClose:closeLifeEditor});dialog.querySelector('.life-selection').hidden=true;return true;}catch(error){console.warn('[Distribuit]',error);return false;}
}
function closeLifeEditor(){furnitureEditor?.dispose();furnitureEditor=null;}
window.addEventListener('pagehide',()=>close('pagehide'));
export {open as openLifeView,close as closeLifeView,openLifeEditor,closeLifeEditor,subscribeLifeView};
