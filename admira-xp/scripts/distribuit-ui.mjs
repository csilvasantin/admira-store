import {createDistribuitController} from './distribuit-controller.mjs?v=imported-space-1';
import {furniturePose,SCALE_LIMITS} from './distribuit.mjs?v=imported-space-1';
import {isWallFurniture} from './furniture-geometry.mjs?v=imported-space-1';
import {attachFloatingPanel} from './floating-panels.mjs?v=windows-menu-1';
import {diagnosePassage} from './passage-diagnostic.mjs?v=check-passage-1';
import {inventoryName} from '../../inventario/labels.mjs?v=check-passage-20261004-1';

// Only geometry/editor inputs determine a passage. Audience and media updates
// must not repeat a path search every frame.
const passageKey=(scene,request)=>JSON.stringify([request,scene.active,scene.roomId,scene.venue,scene.imported,scene.cols,scene.rows,scene.doorRow,scene.doorHalfWidth,scene.outsideDepth,scene.doorOpen,scene.passageEntrance,scene.layout,scene.footprints,scene.colliders,scene.hardness]);

export function mountDistribuit({dialog,viewer,bridge,onClose=()=>{}}){
  const en=document.documentElement.lang==='en',t=(es,english)=>en?english:es;
  const itemLabel=(item,fallback)=>inventoryName((en?(item?.label_en||item?.labelEn):null)||item?.label||fallback||item?.type||'',en?'en':'es');
  const host=document.createElement('aside');host.className='distribuit-panel';host.setAttribute('aria-label',t('Distribuir','Distribute'));
  host.innerHTML=`<header><strong>${t('Distribuir','Distribute')} · 16 bits</strong><button type="button" data-action="close" aria-label="${t('Cerrar editor','Close editor')}">×</button></header>
    <p>${t('Selecciona y arrastra un mueble. Flechas: ¼ de casilla. Mayús + arrastre: cámara.','Select and drag furniture. Arrow keys: ¼ tile. Shift + drag: camera.')}</p>
    <label>${t('Mueble','Furniture')}<select aria-label="${t('Seleccionar mueble','Select furniture')}"><option value="">${t('Seleccionar…','Select…')}</option></select></label>
    <div class="distribuit-objects"><button type="button" data-action="lock">${t('Bloquear','Lock')}</button><button type="button" data-action="remove">${t('Eliminar','Delete')}</button><button type="button" data-action="catalog">${t('Cargar desde PixerIA','Load from PixerIA')}</button></div>
    <section class="distribuit-catalog" hidden aria-label="${t('Catálogo PixerIA','PixerIA catalog')}"><label>${t('Objeto de PixerIA','PixerIA object')}<select data-catalog aria-label="${t('Objeto de PixerIA','PixerIA object')}"></select></label><img data-poster alt="" hidden><p data-asset-info></p><div><button type="button" data-action="add">${t('Añadir al espacio','Add to space')}</button><button type="button" data-action="hideCatalog">${t('Cerrar catálogo','Close catalog')}</button></div></section>
    <div class="distribuit-coordinates"><label>${t('Columna','Column')}<input data-axis="col" type="number" step="0.25" aria-label="${t('Columna','Column')}"></label><label>${t('Fila','Row')}<input data-axis="row" type="number" step="0.25" aria-label="${t('Fila','Row')}"></label><button type="button" data-action="move">${t('Mover','Move')}</button></div>
    <div class="distribuit-arrows" aria-label="${t('Desplazar en el suelo','Move on the floor')}"><button type="button" data-step="0,-0.25" aria-label="${t('Fila anterior','Previous row')}">↑</button><button type="button" data-step="-0.25,0" aria-label="${t('Columna anterior','Previous column')}">←</button><button type="button" data-step="0,0.25" aria-label="${t('Fila siguiente','Next row')}">↓</button><button type="button" data-step="0.25,0" aria-label="${t('Columna siguiente','Next column')}">→</button><button type="button" data-action="undo">${t('Deshacer','Undo')}</button></div>
    <div class="distribuit-transform"><span>${t('Girar','Rotate')}</span><button type="button" data-turn="-1" aria-label="${t('Girar 90 grados a la izquierda','Rotate 90 degrees left')}">↶ 90°</button><output data-rotation>0°</output><button type="button" data-turn="1" aria-label="${t('Girar 90 grados a la derecha','Rotate 90 degrees right')}">↷ 90°</button></div>
    <div class="distribuit-transform"><label for="distribuit-scale">${t('Escala','Scale')}</label><button type="button" data-scale="-10" aria-label="${t('Reducir escala','Decrease scale')}">−</button><input id="distribuit-scale" type="number" min="25" max="300" step="10" aria-label="${t('Escala en porcentaje','Scale percent')}"><span>%</span><button type="button" data-scale="10" aria-label="${t('Aumentar escala','Increase scale')}">+</button></div>
    <label class="distribuit-map"><input type="checkbox" checked> ${t('Ver mapa de dureza','Show hardness map')}</label>
    <section class="distribuit-passage" aria-label="${t('Comprobar paso','Check passage')}">
      <h3>${t('Comprobar paso','Check passage')}</h3>
      <div class="distribuit-passage-controls"><label>${t('Cuerpo','Body')}<select data-passage-actor aria-label="${t('Cuerpo para comprobar el paso','Body for passage check')}"><option value="human">${t('Persona','Person')}</option><option value="unitree">Unitree</option></select></label><button type="button" data-action="checkPassage">${t('Comprobar','Check')}</button></div>
      <p class="distribuit-passage-note">${t('Entrada → mueble seleccionado, o centro. Se prueba con la puerta abierta virtualmente; la escena no cambia.','Entrance → selected furniture, or centre. Tested with the door virtually open; the scene stays unchanged.')}</p>
      <p data-passage-result role="status" aria-live="polite" aria-atomic="true">${t('Selecciona un destino y comprueba el paso.','Select a destination and check passage.')}</p>
      <ul data-passage-blockers hidden aria-label="${t('Obstáculos del paso','Passage obstacles')}"></ul>
      <p data-passage-legend hidden>${t('Entrada: azul · destino: verde · obstáculos: naranja. Ver mapa de dureza muestra el radio y volumen de paso.','Entrance: blue · destination: green · obstacles: orange. Show hardness map displays the body radius and passage volume.')}</p>
    </section>
    <p class="distribuit-status" role="status" aria-live="polite"></p>`;
  const canvas=dialog.querySelector('canvas'),previousLabel=canvas.getAttribute('aria-label');
  canvas.setAttribute('aria-label',t('Editor de muebles: arrastra para mover; flechas para desplazar; Escape para cancelar.','Furniture editor: drag or arrow keys to move; Escape to cancel.'));
  const stage=dialog.matches?.('.life-stage')?dialog:dialog.querySelector('.life-stage');stage.append(host);dialog.classList.add('distribuit-open');
  // Life owns reopening: closing this editor also disposes its controller.
  const floating=attachFloatingPanel(host,{label:t('Distribuir','Distribute'),handle:host.querySelector('header'),closeButton:host.querySelector('[data-action="close"]'),bounds:stage,key:'xpaceos.window.distribuir.v1'});
  floating.restore();
  const scale=host.querySelector('#distribuit-scale'),rotation=host.querySelector('[data-rotation]');
  const select=host.querySelector('select'),col=host.querySelector('[data-axis="col"]'),row=host.querySelector('[data-axis="row"]'),map=host.querySelector('[type="checkbox"]');
  const lock=host.querySelector('[data-action="lock"]'),remove=host.querySelector('[data-action="remove"]'),catalogPanel=host.querySelector('.distribuit-catalog'),catalogSelect=host.querySelector('[data-catalog]'),poster=host.querySelector('[data-poster]'),add=host.querySelector('[data-action="add"]');
  const passageActor=host.querySelector('[data-passage-actor]'),passageButton=host.querySelector('[data-action="checkPassage"]'),passageResult=host.querySelector('[data-passage-result]'),passageBlockers=host.querySelector('[data-passage-blockers]'),passageLegend=host.querySelector('[data-passage-legend]');
  const editorRoomId=bridge.read().roomId;
  let catalogItems=[],lastState,passageRequest=null,passage=null,lastPassageKey=null,disposed=false;
  const passageReasons={clear:t('Paso libre.','Passage clear.'),obstructed:t('Paso bloqueado. Revisa los obstáculos destacados.','Passage blocked. Review the highlighted obstacles.'),entrance_unconfigured:t('Este Xpacio no tiene una entrada operativa definida.','This Xpacio has no defined operational entrance.'),invalid_scene:t('El espacio no está disponible para comprobar el paso.','This space is unavailable for passage checks.'),invalid_actor:t('Selecciona Persona o Unitree.','Select Person or Unitree.'),invalid_origin:t('La entrada no tiene espacio libre para este cuerpo.','The entrance has no free space for this body.'),invalid_target:t('No hay un punto de llegada libre para este cuerpo.','There is no clear arrival point for this body.'),target_missing:t('El destino ya no está en el espacio. Selecciona otro y comprueba el paso.','The destination is no longer in the space. Select another and check passage.'),target_unavailable:t('El destino no tiene un punto de llegada disponible.','The destination has no available arrival point.'),boundary_blocked:t('El límite del espacio bloquea el paso de este cuerpo.','The space boundary blocks passage for this body.')};
  const previewScene=(scene,state)=>state?.draft?{...scene,layout:scene.layout.map(i=>String(i.id)===String(state.draft.id)?{...i,...state.draft.position}:i)}:scene;
  function renderPassage(scene,state){
    passageActor.disabled=!!state?.busy;passageButton.disabled=!!state?.busy||!scene.active||scene.roomId!==editorRoomId;
    passageBlockers.replaceChildren();passageBlockers.hidden=true;passageLegend.hidden=!passage||passage.status==='unavailable';
    host.querySelector('.distribuit-passage').dataset.status=passage?.status||'ready';
    if(!passage){passageResult.textContent=t('Selecciona un destino y comprueba el paso.','Select a destination and check passage.');return;}
    const actor=passage.actor==='unitree'?'Unitree':t('Persona','Person'),radius=Number(passage.radius).toLocaleString(en?'en':'es',{maximumFractionDigits:2});
    const destination=scene.layout.find(i=>String(i.id)===String(passageRequest.targetId));
    const destinationName=passageRequest.targetId?itemLabel(destination,passageRequest.targetId):t('centro del espacio','space centre');
    const text=`${passageReasons[passage.reason]||passageReasons[passage.status==='clear'?'clear':'obstructed']} ${actor} · ${t('radio','radius')} ${radius} ${t('casillas','tiles')} · ${t('destino','destination')}: ${destinationName}.`;
    if(passageResult.textContent!==text)passageResult.textContent=text;
    for(const blocker of passage.blockers||[]){
      const row=document.createElement('li'),item=scene.layout.find(i=>String(i.id)===String(blocker.itemId)),known={'architecture:rear-wall':t('Pared trasera','Rear wall'),'architecture:left-wall':t('Pared izquierda','Left wall'),'architecture:door-leaf':t('Hoja de la puerta','Door leaf'),'boundary:doorway':t('Abertura de entrada','Entrance opening')};
      const originalLabel=blocker.label&&!/^(architecture|hardness|boundary):/.test(blocker.label)?blocker.label:null;
      const label=item?itemLabel(item,originalLabel):inventoryName(originalLabel,en?'en':'es')||known[blocker.id]||(String(blocker.id).startsWith('architecture:door-jamb:')?t('Marco de la puerta','Door jamb'):null)||({architecture:t('Elemento estructural','Structural element'),hardness:t('Celda fija del suelo','Fixed floor cell'),boundary:t('Límite del espacio','Space boundary')}[blocker.kind])||t('Obstáculo','Obstacle');
      if(blocker.itemId&&item&&!item.presentationExcluded){const button=document.createElement('button');button.type='button';button.textContent=t('Seleccionar','Select')+' · '+label;button.disabled=!!state?.busy;button.onclick=()=>{if(!disposed&&!controller.busy){controller.select(blocker.itemId);viewer.selectItem(blocker.itemId);canvas.focus();}};row.append(button);}
      else row.textContent=label;
      passageBlockers.append(row);
    }
    passageBlockers.hidden=!(passage.blockers||[]).length;
  }
  function updatePassage(scene,state){
    if(passageRequest){
      const key=passageKey(scene,passageRequest);
      if(key!==lastPassageKey){passage=diagnosePassage(scene.roomId===editorRoomId?scene:{...scene,active:false},passageRequest);lastPassageKey=key;}
    }
    renderPassage(scene,state);
  }
  const messages={locked:t('Objeto bloqueado. Desbloquéalo para mover, girar o escalar.','Object locked. Unlock it to move, rotate or scale.'),unlocked:t('Objeto desbloqueado.','Object unlocked.'),removed:t('Objeto eliminado. Deshacer lo recupera.','Object deleted. Undo restores it.'),added:t('Objeto de PixerIA añadido en un hueco libre.','PixerIA object added in a free space.'),structural:t('Este elemento estructural queda fijo.','This structural element remains fixed.'),changed:t('El objeto ha cambiado. No se ha sobrescrito el cambio.','The object changed. Nothing was overwritten.'),limit:t('El espacio admite hasta 300 objetos.','The space holds up to 300 objects.'),noSpace:t('No hay un hueco libre donde quepa este objeto.','No free space fits this object.'),asset:t('No se pudo cargar el objeto. Reintenta o elige otro.','Could not load the object. Retry or choose another.'),assetLoading:t('Cargando el objeto de PixerIA…','Loading the PixerIA object…'),catalogLoading:t('Leyendo el catálogo de PixerIA…','Reading the PixerIA catalog…'),catalogReady:t('Selecciona un objeto y pulsa Añadir al espacio.','Select an object and press Add to space.'),catalogEmpty:t('No hay objetos compatibles en el catálogo.','No compatible objects in the catalog.'),catalogError:t('No se pudo leer PixerIA. Pulsa Cargar para reintentar.','Could not read PixerIA. Press Load to retry.'),invalid:t('Introduce valores numéricos válidos.','Enter valid numeric values.'),scale:t('La escala debe estar entre 25% y 300%.','Scale must be between 25% and 300%.'),ready:t('Mover, girar y escalar respetan el suelo y los muebles.','Move, rotate and scale respect the floor and furniture.'),selected:t('Arrastra, gira o escala. Giro sobre el punto de origen.','Drag, rotate or scale. Rotation uses the furniture origin.'),fixed:t('Este elemento está fijado a la pared o bloqueado.','This element is wall mounted or locked.'),bounds:t('No cabe dentro del espacio.','It does not fit inside the space.'),occupied:t('Ese lugar está ocupado por otro mueble.','Another piece of furniture occupies that position.'),path:t('Hay un mueble en el recorrido. Rodéalo.','Furniture blocks the path. Go around it.'),preview:t('Posición válida · suelta para guardar.','Valid position · release to save.'),saving:t('Guardando…','Saving…'),saved:t('Distribución guardada.','Layout saved.'),undone:t('Cambio deshecho y guardado.','Change undone and saved.'),cancelled:t('Movimiento cancelado.','Move cancelled.'),saveError:t('No se pudo guardar. Se conserva la posición anterior.','Could not save. The previous position is retained.'),undoError:t('No se puede deshacer: ha cambiado el espacio o hay un obstáculo.','Cannot undo: the space changed or an obstacle intervenes.'),room:t('Ha cambiado el espacio. Cierra y vuelve a abrir Distribuir.','The space changed. Close and reopen Distribute.'),long:t('Suelta para guardar antes de seguir moviendo.','Release to save before continuing.')};
  let controller;
  const refresh=state=>{
    lastState=state;
    const scene=bridge.read(),item=scene.layout.find(i=>String(i.id)===state.selectedId),position=state.draft?.position||item,physicalScene=previewScene(scene,state);
    const options=scene.layout.filter(i=>!i.presentationExcluded).map(i=>({id:String(i.id),label:itemLabel(i)+' · '+i.id+(isWallFurniture(i)||i.locked?' 🔒':'')+(i.inventoryHidden?' · '+t('oculto','hidden'):'')}));
    const signature=JSON.stringify(options);
    if(select.dataset.items!==signature){select.replaceChildren(new Option(t('Seleccionar…','Select…'),''),...options.map(i=>new Option(i.label,i.id)));select.dataset.items=signature;}
    select.value=state.selectedId||'';
    lock.textContent=item?.locked&&!item.nativeFixed?t('Desbloquear','Unlock'):t('Bloquear','Lock');
    lock.disabled=!item||item.nativeFixed||state.busy;remove.disabled=!item||item.nativeFixed||state.busy;
    for(const button of host.querySelectorAll('[data-action="catalog"],[data-action="hideCatalog"]'))button.disabled=state.busy;
    catalogSelect.disabled=state.busy;add.disabled=state.busy||!catalogItems.length;
    lock.setAttribute('aria-pressed',String(!!item?.locked));
    const fixed=item&&(isWallFurniture(item)||item.locked);
    for(const input of [col,row]){input.disabled=!item||fixed||state.busy;if(document.activeElement!==input)input.value=position?.[input.dataset.axis]??'';}
    for(const button of host.querySelectorAll('[data-step],[data-turn],[data-scale],[data-action="move"]'))button.disabled=!item||fixed||state.busy;
    scale.disabled=!item||fixed||state.busy;if(document.activeElement!==scale||(!state.busy&&!state.draft))scale.value=position?Math.round((position.sx??1)*10000)/100:'';
    rotation.textContent=position?(((position.rot??0)%4+4)%4)*90+'°':'—';
    host.querySelector('[data-action="undo"]').disabled=state.busy||!state.canUndo;
    host.querySelector('[data-action="close"]').disabled=state.busy;
    select.disabled=state.busy;host.dataset.status=state.notice;
    host.querySelector('.distribuit-status').textContent=fixed&&['ready','selected','preview'].includes(state.notice)?messages.fixed:messages[state.notice]||state.notice;
    updatePassage(physicalScene,state);
    viewer.setEditorOverlay({scene:physicalScene,selectedId:state.selectedId,showMap:map.checked,candidate:state.draft?.candidate,valid:state.draft?.result.ok,passage});
    if(controller)viewer.update(controller.decorate(viewer.snapshot));
  };
  try{controller=createDistribuitController({bridge,onChange:refresh});}catch(error){floating.dispose();canvas.setAttribute('aria-label',previousLabel);host.remove();dialog.classList.remove('distribuit-open');throw error;}
  try{
  const pick=id=>{controller.select(id);viewer.selectItem(id);};
  const checkPassage=()=>{if(disposed||controller.busy)return;passageRequest={actor:passageActor.value==='unitree'?'unitree':'human',targetId:controller.selected?.id??null};lastPassageKey=null;refresh(lastState);};
  passageButton.onclick=checkPassage;
  passageActor.onchange=()=>{if(passageRequest&&!disposed&&!controller.busy){passageRequest={...passageRequest,actor:passageActor.value==='unitree'?'unitree':'human'};lastPassageKey=null;refresh(lastState);}};
  const step=(dc,dr)=>{const item=controller.selected;if(item)void controller.move({col:item.col+dc,row:item.row+dr});};
  select.onchange=()=>{pick(select.value||null);dialog.querySelector('canvas').focus();};
  host.querySelector('[data-action="close"]').onclick=onClose;
  lock.onclick=()=>{const item=controller.selected;if(item)void controller.setLocked(!item.locked);};
  remove.onclick=()=>void controller.remove();
  const catalogPreview=()=>{
    const item=catalogItems.find(i=>i.assetId===catalogSelect.value);
    poster.hidden=!item?.img;if(item?.img)poster.src=item.img;else poster.removeAttribute('src');
    host.querySelector('[data-asset-info]').textContent=item?`${item.format==='3D'?'3D':t('Imagen','Image')} · ${item.fp[0]} × ${item.fp[1]} ${t('casillas','tiles')}`:'';
  };
  catalogSelect.onchange=catalogPreview;
  host.querySelector('[data-action="catalog"]').onclick=async()=>{
    const items=await controller.catalog();if(items===null)return;
    catalogItems=items;catalogSelect.replaceChildren(...items.map(i=>new Option(i.label+' · '+i.format,i.assetId)));
    catalogPanel.hidden=false;catalogPreview();refresh(lastState);
  };
  host.querySelector('[data-action="hideCatalog"]').onclick=()=>{catalogPanel.hidden=true;};
  add.onclick=async()=>{if(await controller.add(catalogSelect.value)){catalogPanel.hidden=true;viewer.selectItem(controller.selected?.id);}};
  host.querySelector('[data-action="undo"]').onclick=()=>void controller.undo();
  host.querySelector('[data-action="move"]').onclick=()=>void controller.move({col:col.value===''?NaN:Number(col.value),row:row.value===''?NaN:Number(row.value)});
  for(const button of host.querySelectorAll('[data-step]'))button.onclick=()=>step(...button.dataset.step.split(',').map(Number));
  for(const button of host.querySelectorAll('[data-turn]'))button.onclick=()=>{const item=controller.selected;if(item)void controller.move({rot:((item.rot??0)+Number(button.dataset.turn)+4)%4});};
  const resize=percent=>{
    const item=controller.selected;if(!item)return;
    const pose=furniturePose(item),sx=percent/100;
    void controller.move({sx,sy:pose.sy*sx/pose.sx});
  };
  scale.onchange=()=>resize(scale.value===''?NaN:Number(scale.value));
  scale.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();resize(scale.value===''?NaN:Number(scale.value));}};
  for(const button of host.querySelectorAll('[data-scale]'))button.onclick=()=>{const item=controller.selected;if(item)resize(Math.max(SCALE_LIMITS.min*100,Math.min(SCALE_LIMITS.max*100,Math.round((item.sx??1)*100)+Number(button.dataset.scale))));};
  map.onchange=()=>refresh(lastState);
  viewer.setEditor({onPreview:position=>controller.preview(position),onCommit:()=>void controller.commit(),onCancel:()=>controller.cancel()});
  refresh({notice:'ready',busy:false,canUndo:false});
  function keydown(event){
    if(event.key==='Escape'){event.preventDefault();if(controller.busy)return true;if(controller.draft)controller.cancel();else onClose();return true;}
    if(/^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName))return false;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();void controller.undo();return true;}
    const moves={ArrowLeft:[-.25,0],ArrowRight:[.25,0],ArrowUp:[0,-.25],ArrowDown:[0,.25]};
    if(moves[event.key]){event.preventDefault();step(...moves[event.key]);return true;}return false;
  }
  return {select:data=>controller.select(data?.item?.id??null),decorateSnapshot:scene=>{
      if(!disposed&&passageRequest){const physicalScene=previewScene(bridge.read(),lastState);if(passageKey(physicalScene,passageRequest)!==lastPassageKey){updatePassage(physicalScene,lastState);viewer.setEditorOverlay({scene:physicalScene,selectedId:lastState?.selectedId,showMap:map.checked,candidate:lastState?.draft?.candidate,valid:lastState?.draft?.result.ok,passage});}}
      return controller.decorate(scene);
    },keydown,
    dispose(){if(disposed)return;disposed=true;passageRequest=null;passage=null;lastPassageKey=null;passageBlockers.replaceChildren();floating.dispose();canvas.setAttribute('aria-label',previousLabel);viewer.setEditor(null);viewer.setEditorOverlay(null);controller.dispose();host.remove();dialog.classList.remove('distribuit-open');}};
  }catch(error){disposed=true;passageRequest=null;passage=null;floating.dispose();viewer.setEditor(null);viewer.setEditorOverlay(null);controller.dispose();canvas.setAttribute('aria-label',previousLabel);host.remove();dialog.classList.remove('distribuit-open');throw error;}
}
