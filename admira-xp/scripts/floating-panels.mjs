import {movableWindow,visibleBounds} from './floating-window.mjs?v=20261003-panels-2';
import {attachPanelResize} from './panel-resize.mjs?v=20261003-panels-2';

const windows=new Map(),menus=new Set();
function refreshMenus(){for(const refresh of menus)refresh();}
export function registerFloatingPanel(id,{label,open}){
  if(!id||typeof open!=='function')throw new TypeError('A floating panel entry needs an id and its own open callback.');
  const entry={label:String(label||id),open};windows.set(id,entry);refreshMenus();
  return ()=>{if(windows.get(id)===entry){windows.delete(id);refreshMenus();}};
}

// The menu invokes each feature's opener. It never guesses how a hidden tool
// should be enabled or recreates a disposed scene/editor.
export function mountFloatingPanelMenu(container,{label}={}){
  const doc=container.ownerDocument,en=doc.documentElement?.lang==='en';
  const section=doc.createElement('section');section.className='xp-floating-menu';
  const title=doc.createElement('h3');title.textContent=label||(en?'Windows':'Ventanas');
  const list=doc.createElement('div');list.className='xp-floating-menu-items';section.append(title,list);container.append(section);
  const Controller=doc.defaultView?.AbortController||globalThis.AbortController;let buttonsAbort;
  function refresh(){
    buttonsAbort?.abort();buttonsAbort=new Controller();
    list.replaceChildren();section.hidden=windows.size===0;
    for(const [id,entry] of windows){const button=doc.createElement('button');button.type='button';button.dataset.windowId=id;button.textContent=entry.label;button.addEventListener('click',()=>{if(windows.get(id)===entry)entry.open();},{signal:buttonsAbort.signal});list.append(button);}
  }
  menus.add(refresh);refresh();
  return {dispose(){buttonsAbort?.abort();menus.delete(refresh);section.remove();}};
}

/** Add a movable header and accessible close control to an existing tool.
 * Existing close buttons keep their authored click lifecycle; close() delegates
 * to that button unless onClose is supplied. Provide onOpen for tools whose
 * activation requires more than showing a DOM node.
 */
export function attachFloatingPanel(panel,{label,handle,closeButton,onClose,onOpen,bounds,key,storage,menu=false}={}){
  const doc=panel.ownerDocument,view=doc.defaultView||globalThis.window,en=doc.documentElement?.lang==='en';
  const abort=new (view.AbortController||globalThis.AbortController)(),generatedHeader=!handle;
  label=String(label||panel.getAttribute('aria-label')||(en?'Window':'Ventana'));
  const oldDisplay=panel.style.display;let disposed=false,closedByHelper=false;
  if(!handle){
    handle=doc.createElement('header');handle.className='xp-floating-header';
    const grip=doc.createElement('span');grip.className='xp-floating-grip';grip.textContent='⠿';grip.setAttribute('aria-hidden','true');
    const name=doc.createElement('span');name.className='xp-floating-title';name.textContent=label;handle.append(grip,name);panel.prepend(handle);
  }
  const wasHandleClass=handle.classList.contains('xp-floating-handle'),wasPanelClass=panel.classList.contains('xp-floating-panel');
  handle.classList.add('xp-floating-handle');panel.classList.add('xp-floating-panel');
  const generatedClose=!closeButton;
  if(!closeButton){closeButton=doc.createElement('button');closeButton.type='button';closeButton.className='xp-floating-close';closeButton.textContent='×';closeButton.setAttribute('aria-label',(en?'Close ':'Cerrar ')+label);handle.append(closeButton);}
  const motion=movableWindow(panel,handle,{bounds,key,storage});
  const size=attachPanelResize(panel,{label,key:key?key+':size':undefined,storage,view,limits:()=>{const area=visibleBounds(view,bounds,panel);return {minWidth:156,minHeight:128,maxWidth:Math.max(32,area.width-16),maxHeight:Math.max(32,area.height-16)};},onChange:()=>motion.clamp()});
  // Authored X controls can rely on click delegation at their panel. Let that
  // click reach the owner, then stop it there before document/game handlers.
  // Other generated-header clicks and mouse drag hooks stay local to the grip.
  const authoredCloseClick=event=>!generatedClose&&(event.target===closeButton||closeButton.contains?.(event.target));
  if(generatedHeader){
    handle.addEventListener('mousedown',event=>event.stopPropagation(),{signal:abort.signal});
    handle.addEventListener('click',event=>{if(!authoredCloseClick(event))event.stopPropagation();},{signal:abort.signal});
    if(!generatedClose)panel.addEventListener('click',event=>{if(authoredCloseClick(event))event.stopPropagation();},{signal:abort.signal});
  }
  function close(){
    if(disposed)return;
    if(typeof onClose==='function')onClose();
    else if(!generatedClose)closeButton.click();
    else {panel.hidden=true;closedByHelper=true;}
  }
  if(generatedClose)closeButton.addEventListener('click',event=>{event.stopPropagation();close();},{signal:abort.signal});
  function open(){
    if(disposed)return;
    if(typeof onOpen==='function')onOpen();
    else {panel.hidden=false;if(closedByHelper)panel.style.display=oldDisplay;closedByHelper=false;}
    motion.restore();size.fit();
  }
  const unregister=menu?registerFloatingPanel(typeof menu==='string'?menu:key||panel.id||label,{label,open}):null;
  return {
    panel,handle,closeButton,open,close,restore:motion.restore,clamp:motion.clamp,
    dispose(){
      if(disposed)return;disposed=true;abort.abort();size.dispose();motion.dispose();unregister?.();
      if(generatedHeader)handle.remove();else {if(generatedClose)closeButton.remove();if(!wasHandleClass)handle.classList.remove('xp-floating-handle');}
      if(!wasPanelClass)panel.classList.remove('xp-floating-panel');
    }
  };
}
