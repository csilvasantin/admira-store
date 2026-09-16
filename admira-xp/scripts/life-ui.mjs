import {createLifeSnapshot} from './life-snapshot.mjs';
import {createTierControls} from './visual-tier-controls.mjs?v=tiers-linked-4';

// The expert Good/Better/Best selector owns launch, routing and preference.
const listeners=new Set();
const announce=(busy=false,error='',reason='')=>{for(const listener of listeners)listener({open:!!dialog,busy,error,reason,requestId});};
function subscribeLifeView(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
const snapshot=createLifeSnapshot();
let dialog,viewer,frame=0,pending=0,generation=0,resizeObserver,lastFocus,controls,requestId,removeAbort;
const names={counter:'Mostrador',shelves:'Estantería',wineRack:'Bodega',lottery:'Lotería',vending:'Vending',magazines:'Prensa',manager:'Puesto de gestión',plant:'Vegetación',floorLamp:'Iluminación',rug:'Alfombra',djBooth:'DJ booth',tablet:'Tablet',turnKiosk:'Gestor de turnos',aroma:'Aromatización',metahuman:'Asistente digital',tft:'Pantalla digital',led:'Superficie LED',custom:'Mobiliario'};
const roles={staff:'Equipo',customer:'Cliente del gemelo',passerby:'Transeúnte simulado',saca:'Logística',thief:'Personaje del juego',guardiaCivil:'Personaje del juego',opinador:'Visitante',unitreeBot:'Robot'};
function close(reason=''){
  generation++;cancelAnimationFrame(frame);clearTimeout(pending);resizeObserver?.disconnect();resizeObserver=null;
  removeAbort?.();removeAbort=null;controls?.dispose();controls=null;
  viewer?.dispose();viewer=null;dialog?.close();dialog?.remove();dialog=null;
  document.body.classList.remove('xtanco-life-open');lastFocus?.focus?.();announce(false,'',typeof reason==='string'?reason:'');
}
function select(data){
  if(!dialog)return;const panel=dialog.querySelector('.life-selection');panel.hidden=!data;if(!data)return;
  const value=data.item||data.actor;
  panel.querySelector('h2').textContent=value.label||value.name||(data.item?names[value.type]||'Elemento del espacio':roles[value.kind]||'Personaje');
  panel.querySelector('.life-selection-kind').textContent=data.item?'EN ESTE ESPACIO':roles[value.kind]||'PERSONAJE';
  panel.querySelector('p').textContent=data.item?'Elemento del layout actual. Para editarlo, vuelve a los controles del gemelo.':'Posición y movimiento sincronizados con la simulación del gemelo.';
}
async function open(options={}){
  if(dialog||options.signal?.aborted)return;const ticket=++generation;lastFocus=document.activeElement;requestId=options.requestId;
  dialog=document.createElement('dialog');dialog.className='life-dialog';dialog.setAttribute('aria-labelledby','life-title');
  dialog.innerHTML=`<header class="life-header">
    <div class="life-brand"><span class="life-mark" aria-hidden="true">X</span><div><span class="life-eyebrow">XPACEOS · BETTER · DIGITAL TWIN</span><h1 id="life-title">Un espacio. Mil posibilidades.</h1></div></div>
    <div class="life-header-actions"><a class="life-functions" href="/help/funcionalidades/" target="_blank" rel="noopener">Funciones <span aria-hidden="true">↗</span></a><button type="button" class="life-close" aria-label="Volver al gemelo">Volver al gemelo <span aria-hidden="true">↗</span></button></div>
  </header><div class="life-navigation"><div class="life-tier-slot"></div><span class="life-mapping-state">Comparar con Good · cámara alineada</span></div>
  <div class="life-stage"><canvas class="life-canvas" tabindex="0" aria-label="Gemelo 3D interactivo. Arrastra para girar, usa las flechas para rotar y más o menos para acercar."></canvas>
    <div class="life-location"><span class="life-eyebrow">BARCELONA · GRAN DE GRÀCIA</span><h2>El Xtanco<span>en otra dimensión.</span></h2><p><i aria-hidden="true"></i><span class="life-state">Conectando con el gemelo…</span></p></div>
    <div class="life-loading" role="status"><span class="life-spinner"></span><h2>Abriendo tu espacio</h2><p>Preparando la escena 3D del gemelo…</p><button type="button" class="life-retry" hidden>Reintentar</button></div>
    <aside class="life-selection" hidden><span class="life-eyebrow life-selection-kind"></span><h2></h2><p></p><button type="button" class="life-selection-close" aria-label="Cerrar detalle">×</button></aside>
    <div class="life-toolbar"><div class="life-lights" role="group" aria-label="Iluminación de la escena"><button type="button" data-light="day" aria-pressed="true">☀ <span>Día</span></button><button type="button" data-light="sunset" aria-pressed="false">◒ <span>Atardecer</span></button><button type="button" data-light="night" aria-pressed="false">☾ <span>Noche</span></button></div>
    <div class="life-camera" role="group" aria-label="Cámara"><button type="button" data-preset="mapped" aria-pressed="true">Comparar con Good</button><button type="button" data-preset="home" aria-pressed="false">Explorar 3D</button><button type="button" data-preset="floor" aria-pressed="false">Planta</button><button type="button" data-preset="detail" aria-pressed="false">Detalle</button><span class="life-divider"></span><button type="button" data-zoom="out" aria-label="Alejar">−</button><button type="button" data-zoom="in" aria-label="Acercar">+</button></div></div>
    <div class="life-compass" aria-hidden="true"><span>N</span><b>↟</b></div>
  </div><footer class="life-footer"><span><b>Arrastra</b> para girar · <b>Scroll / pellizca</b> para acercar · <b>Toca</b> para explorar</span><span class="life-footnote">Mismo gemelo · nueva perspectiva</span></footer>`;
  controls=createTierControls({context:'Cambiar calidad desde Better',choose:mode=>window.__xtancoVisualTiers?.choose(mode)});
  dialog.querySelector('.life-tier-slot').append(controls.element);
  document.body.append(dialog);dialog.showModal();window.__xtancoReleaseInputs?.();document.body.classList.add('xtanco-life-open');
  const abort=()=>{if(ticket===generation)close('switch');};
  options.signal?.addEventListener('abort',abort,{once:true});removeAbort=()=>options.signal?.removeEventListener('abort',abort);
  announce(true);
  dialog.querySelector('.life-close').onclick=close;dialog.querySelector('.life-selection-close').onclick=()=>viewer?.clearSelection();
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  // Some legacy controls hit-test document clicks by coordinates, not target.
  // Keep modal interactions local without suppressing canvas/button handlers.
  for(const event of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu'])dialog.addEventListener(event,e=>e.stopPropagation());
  for(const event of ['keydown','keyup','keypress'])dialog.addEventListener(event,e=>{
    e.stopPropagation();if(event!=='keydown')return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.target!==dialog.querySelector('canvas'))return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();viewer?.rotate(e.key==='ArrowLeft'?1:-1);}
    if(e.key==='+'||e.key==='='||e.key==='-'){e.preventDefault();viewer?.zoomBy(e.key==='-'?.88:1.14);}
    if(e.key==='Home'){e.preventDefault();viewer?.preset('mapped');}
  });
  for(const button of dialog.querySelectorAll('[data-light]'))button.onclick=()=>{
    viewer?.setLighting(button.dataset.light);dialog.dataset.light=button.dataset.light;
    for(const other of dialog.querySelectorAll('[data-light]'))other.setAttribute('aria-pressed',String(other===button));
  };
  for(const button of dialog.querySelectorAll('[data-preset]'))button.onclick=()=>{
    viewer?.preset(button.dataset.preset);dialog.dataset.camera=button.dataset.preset;for(const other of dialog.querySelectorAll('[data-preset]'))other.setAttribute('aria-pressed',String(other===button));
  };
  for(const button of dialog.querySelectorAll('[data-zoom]'))button.onclick=()=>viewer?.zoomBy(button.dataset.zoom==='in'?1.2:1/1.2);
  const loading=dialog.querySelector('.life-loading');let canvas=dialog.querySelector('canvas');
  function observeContext(surface){
    surface.addEventListener('webglcontextlost',e=>{
      e.preventDefault();if(ticket!==generation||surface!==canvas||!viewer)return;
      cancelAnimationFrame(frame);fail('La conexión gráfica se ha interrumpido. Reintenta o vuelve al gemelo clásico.');
    });
  }
  function fail(message){
    cancelAnimationFrame(frame);clearTimeout(pending);resizeObserver?.disconnect();resizeObserver=null;
    select(null);
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
      const {createLifeRenderer}=await import('./life-renderer.mjs?v=tiers-linked-4');if(ticket!==generation)return;
      viewer=createLifeRenderer({canvas,snapshot:input,getPlayer:()=>window.__xtoreWindowPlayer,onSelect:select,onCameraChange:state=>{
        if(ticket!==generation||!dialog)return;
        const mapped=state.mode==='mapped';dialog.dataset.camera=mapped?'mapped':'free';
        dialog.querySelector('.life-mapping-state').textContent=mapped?'Comparar con Good · cámara alineada':'Exploración libre · pulsa Comparar con Good para alinear';
        for(const button of dialog.querySelectorAll('[data-preset]'))button.setAttribute('aria-pressed',String(mapped&&button.dataset.preset==='mapped'));
      }});
      if(dialog.dataset.light)viewer.setLighting(dialog.dataset.light);
      resizeObserver=new ResizeObserver(()=>{if(viewer&&dialog){const rect=dialog.querySelector('.life-stage').getBoundingClientRect();viewer.resize(rect.width,rect.height);}});resizeObserver.observe(dialog.querySelector('.life-stage'));
      loading.hidden=true;announce();canvas.focus();let lastSnapshot=0,lastStatus=0,current=input;
      function tick(now){
        if(ticket!==generation||!viewer)return;
        try{
          if(!document.hidden){
            if(now-lastSnapshot>=100){const next=snapshot(window.__xtancoVisualState?.());if(!next){close();return;}viewer.update(next);current=next;lastSnapshot=now;}
            if(now-lastStatus>=1000){const count=current.inside??0;dialog.querySelector('.life-state').textContent=`Gemelo conectado · ${count} ${count===1?'cliente':'clientes'} en la simulación`;lastStatus=now;}
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
window.addEventListener('pagehide',()=>close('pagehide'));
export {open as openLifeView,close as closeLifeView,subscribeLifeView};
