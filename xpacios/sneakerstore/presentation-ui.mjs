const UI_HIDDEN='store-hud-hidden';
const NON_UI=new Set(['SCRIPT','STYLE','LINK','META','TEMPLATE']);
function editable(node){
 let explicitContent=false;
 for(let current=node;current;current=current.parentElement){
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(current.tagName)||['textbox','searchbox','combobox'].includes(current.getAttribute?.('role')))return true;
  if(current.isContentEditable)return true;
  if(!explicitContent){const value=current.getAttribute?.('contenteditable');if(value!==null&&value!==undefined){explicitContent=true;if(value!=='false')return true;}}
 }
 return false;
}
export function presentationShortcut(event,{hidden=false}={}){
 if(String(event.key||'').toLowerCase()!=='h'||event.repeat||event.isComposing||event.keyCode===229||event.ctrlKey||event.altKey||event.metaKey||event.defaultPrevented)return false;
 return hidden||![event.target,...(event.composedPath?.()||[])].some(editable);
}
// Presentation visibility only: renderer dimensions, camera, media and panel data stay intact.
export function mountTwinPresentation({document:doc=globalThis.document,canvases=[],controlHost=null,lang='es'}={}){
 let hidden=false,disposed=false,previousFocus=null,controlFocus=null;
 const priorInert=new Map(),html=doc.documentElement,win=doc.defaultView;
 const capture={capture:true};
 const suppressedClose=new Map();let suspended=[];
 const observer=win?.MutationObserver?new win.MutationObserver(()=>{if(hidden){maskUI();suspendModals();}}):null;
 let button=null;
 const activeCanvas=()=>canvases.find(canvas=>!canvas.hidden&&canvas.isConnected!==false);
 function closeGate(event){
  const count=suppressedClose.get(event.target)||0;if(!count)return;
  if(count===1)suppressedClose.delete(event.target);else suppressedClose.set(event.target,count-1);
  event.stopImmediatePropagation();if(disposed&&!suppressedClose.size)doc.removeEventListener('close',closeGate,capture);
 }
 function silentClose(dialog){
  if(!dialog.open)return;
  suppressedClose.set(dialog,(suppressedClose.get(dialog)||0)+1);
  try{dialog.close();}catch(error){const count=suppressedClose.get(dialog)-1;if(count)suppressedClose.set(dialog,count);else suppressedClose.delete(dialog);throw error;}
 }
 function suspendModals(){
  for(const dialog of doc.querySelectorAll('dialog[open]')){
   if(!dialog.matches(':modal'))continue;
   if(!suspended.some(state=>state.dialog===dialog))suspended.push({dialog,returnValue:dialog.returnValue,scroll:[dialog,...dialog.querySelectorAll('*')].map(node=>({node,top:node.scrollTop,left:node.scrollLeft}))});
   silentClose(dialog);
  }
 }
 function reopenModals(){
  // Rebuild the modal stack in stable order, with the previously focused dialog on top.
  const focus=previousFocus;
  suspended.sort((a,b)=>Number(a.dialog.contains(focus))-Number(b.dialog.contains(focus)));
  for(const state of suspended){
   const {dialog,returnValue}=state;if(dialog.isConnected===false)continue;
   if(dialog.open&&!dialog.matches(':modal'))silentClose(dialog);
   if(!dialog.open)dialog.showModal();
   dialog.returnValue=returnValue;
  }
 }
 doc.addEventListener('close',closeGate,capture);
 function maskUI(parent=doc.body){
  for(const child of parent.children||[]){
   if(canvases.includes(child))continue;
   if(canvases.some(canvas=>child.contains(canvas))){maskUI(child);continue;}
   if(NON_UI.has(child.tagName))continue;
   if(!priorInert.has(child))priorInert.set(child,!!child.inert);
   child.inert=true;
  }
 }
 function setHidden(value,{focus=null}={}){
  if(disposed||hidden===!!value)return hidden;
  hidden=!!value;
  if(hidden){previousFocus=focus||doc.activeElement;html.classList.add(UI_HIDDEN);maskUI();suspendModals();observer?.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});activeCanvas()?.focus({preventScroll:true});}
  else{observer?.disconnect();reopenModals();html.classList.remove(UI_HIDDEN);for(const [node,inert]of priorInert)node.inert=inert;priorInert.clear();if(previousFocus?.isConnected!==false)previousFocus?.focus?.({preventScroll:true});for(const state of suspended)for(const {node,top,left}of state.scroll){node.scrollTop=top;node.scrollLeft=left;}suspended=[];previousFocus=null;}
  if(button)button.setAttribute('aria-pressed',String(hidden));
  return hidden;
 }
 const toggle=options=>setHidden(!hidden,options);
 function keydown(event){if(disposed||!presentationShortcut(event,{hidden}))return;event.preventDefault();event.stopImmediatePropagation();toggle();}
 doc.addEventListener('keydown',keydown,capture);
 if(controlHost){
  button=doc.createElement('button');button.type='button';button.id='hud-toggle';button.textContent='H';button.title=lang==='en'?'H · Hide interface · press H to restore':'H · Ocultar interfaz · pulsa H para recuperarla';button.setAttribute('aria-label',button.title);button.setAttribute('aria-keyshortcuts','H');button.setAttribute('aria-pressed','false');
  button.addEventListener('pointerdown',()=>{controlFocus=doc.activeElement;});button.addEventListener('click',()=>{toggle({focus:controlFocus});controlFocus=null;});controlHost.append(button);
 }
 return {setHidden,toggle,get hidden(){return hidden;},dispose(){if(disposed)return;setHidden(false);disposed=true;observer?.disconnect();doc.removeEventListener('keydown',keydown,capture);if(!suppressedClose.size)doc.removeEventListener('close',closeGate,capture);button?.remove();}};
}
