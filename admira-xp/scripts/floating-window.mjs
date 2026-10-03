const MARGIN=8;
const finite=value=>typeof value==='number'&&Number.isFinite(value);

export function boundedRectPosition(x,y,width,height,rect,margin=MARGIN){
  const left=rect.left+margin,top=rect.top+margin;
  return {x:Math.max(left,Math.min(x,Math.max(left,rect.left+rect.width-width-margin))),y:Math.max(top,Math.min(y,Math.max(top,rect.top+rect.height-height-margin)))};
}

export function boundedPosition(x,y,width,height,viewportWidth,viewportHeight){
  return boundedRectPosition(x,y,width,height,{left:0,top:0,width:viewportWidth,height:viewportHeight});
}

function viewport(view){return {left:0,top:0,width:view.innerWidth,height:view.innerHeight};}
const OBSTRUCTIONS='#xpace-side-left,#xpace-side-right,.quad-left,.quad-right,#telegramDock,#characterDock,#xsExpert';
function shellObstructions(panel){return [...(panel.ownerDocument?.querySelectorAll?.(OBSTRUCTIONS)||[])];}
export function visibleBounds(view,bounds,panel){
  const area=typeof bounds==='function'?bounds():bounds;
  const rect=area?.getBoundingClientRect?.(),screen=viewport(view);
  const valid=rect&&[rect.left,rect.top,rect.width,rect.height].every(finite)&&rect.width>0&&rect.height>0;
  let left=valid?Math.max(0,rect.left):screen.left,top=valid?Math.max(0,rect.top):screen.top;
  let right=valid?Math.min(screen.width,rect.left+rect.width):screen.width,bottom=valid?Math.min(screen.height,rect.top+rect.height):screen.height;
  if(right<=left||bottom<=top){left=0;top=0;right=screen.width;bottom=screen.height;}
  // Shell columns and bottom docks sit above the scene. A scene's own rect can
  // extend underneath them, so clamp to its uncovered rectangle as they move.
  for(const blocker of shellObstructions(panel)){
    if(blocker===panel||blocker.contains?.(panel)||blocker.hidden||blocker.getAttribute?.('aria-hidden')==='true'||blocker.getClientRects?.().length===0)continue;
    const style=view.getComputedStyle?.(blocker);
    if(style?.display==='none'||style?.visibility==='hidden'||style?.visibility==='collapse'||style?.opacity==='0')continue;
    const r=blocker.getBoundingClientRect?.();
    if(!r||![r.left,r.top,r.width,r.height].every(finite)||r.width<=0||r.height<=0)continue;
    const edgeRight=r.left+r.width,edgeBottom=r.top+r.height;
    if(r.left>=right||edgeRight<=left||r.top>=bottom||edgeBottom<=top)continue;
    if(blocker.id==='xpace-side-right'||blocker.classList?.contains('quad-right')){
      if(r.left>left)right=Math.min(right,r.left);
    }else if(blocker.id==='xpace-side-left'||blocker.classList?.contains('quad-left')){
      if(edgeRight<right)left=Math.max(left,edgeRight);
    }else if((blocker.id==='telegramDock'||blocker.id==='characterDock'||blocker.id==='xsExpert')&&r.top>top){bottom=Math.min(bottom,r.top);}
  }
  return {left,top,width:right-left,height:bottom-top};
}

// Pointer coordinates are viewport coordinates; CSS offsets belong to the
// actual containing block, which can differ from the requested drag bounds.
export function localWindowPosition(panel,x,y,view=panel.ownerDocument?.defaultView||globalThis.window){
  const position=view?.getComputedStyle?.(panel)?.position||panel.style.position;
  if(position==='fixed')return {x,y,position};
  const parent=panel.offsetParent;
  if(parent){const rect=parent.getBoundingClientRect();return {x:x-rect.left-(parent.clientLeft||0)+(parent.scrollLeft||0),y:y-rect.top-(parent.clientTop||0)+(parent.scrollTop||0),position:'absolute'};}
  return {x:x+(view?.scrollX||0),y:y+(view?.scrollY||0),position:'absolute'};
}

// Closing a tool leaves its media connection running unless its own callback
// explicitly chooses another lifecycle. The caller owns that callback.
export function movableWindow(panel,handle,{key,onClose,closeButton,bounds,storage,view=panel.ownerDocument?.defaultView||globalThis.window}={}){
  if(!panel||!handle||!view)throw new TypeError('A floating panel needs a panel, handle and window.');
  const abort=new (view.AbortController||globalThis.AbortController)(),signal=abort.signal;
  const oldHandle={touchAction:handle.style.touchAction,cursor:handle.style.cursor,tabIndex:handle.getAttribute('tabindex'),title:handle.getAttribute('title')};
  let drag=null,disposed=false;
  function positionStorage(){if(storage!==undefined)return storage;try{return view.localStorage;}catch{return null;}}
  handle.style.touchAction='none';handle.style.cursor='move';
  if(handle.tabIndex<0)handle.tabIndex=0;
  if(!oldHandle.title)handle.setAttribute('title',panel.ownerDocument?.documentElement?.lang==='en'?'Drag to move; arrow keys also move this window':'Arrastra para mover; también puedes usar las flechas');
  function move(x,y){
    if(disposed||!finite(x)||!finite(y))return false;
    const rect=panel.getBoundingClientRect(),area=visibleBounds(view,bounds,panel),p=boundedRectPosition(x,y,rect.width,rect.height,area);
    const local=localWindowPosition(panel,p.x,p.y,view);
    panel.classList.add('xp-window-moved');panel.style.position=local.position;
    panel.style.setProperty('--xp-window-left',local.x+'px');panel.style.setProperty('--xp-window-top',local.y+'px');
    panel.style.setProperty('--xp-window-max-width',Math.max(0,area.width-MARGIN*2)+'px');panel.style.setProperty('--xp-window-max-height',Math.max(0,area.height-MARGIN*2)+'px');
    return true;
  }
  function save(){if(key&&!disposed)try{const rect=panel.getBoundingClientRect();positionStorage()?.setItem(key,JSON.stringify({x:rect.left,y:rect.top}));}catch{}}
  function finish(event){
    if(!drag||event.pointerId!==undefined&&event.pointerId!==drag.id)return;
    const pointerId=drag.id;drag=null;
    if(event.type!=='lostpointercapture'&&handle.hasPointerCapture?.(pointerId))try{handle.releasePointerCapture(pointerId);}catch{}
    save();
  }
  handle.addEventListener('pointerdown',event=>{
    if(disposed||event.button!==0||event.isPrimary===false||event.target?.closest?.('button,a,input,textarea,select,summary,[contenteditable="true"],[role="button"]'))return;
    const rect=panel.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX-rect.left,y:event.clientY-rect.top};
    try{handle.setPointerCapture?.(event.pointerId);}catch{}
    event.preventDefault();event.stopPropagation();
  },{signal});
  handle.addEventListener('pointermove',event=>{if(drag&&event.pointerId===drag.id){move(event.clientX-drag.x,event.clientY-drag.y);event.stopPropagation();}},{signal});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(type,finish,{signal});
  handle.addEventListener('keydown',event=>{
    const offsets={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]},delta=offsets[event.key];
    if(!delta||event.target!==handle||event.altKey||event.ctrlKey||event.metaKey)return;
    const rect=panel.getBoundingClientRect(),scale=event.shiftKey?0.25:1;
    move(rect.left+delta[0]*scale,rect.top+delta[1]*scale);save();event.preventDefault();event.stopPropagation();
  },{signal});
  if(closeButton&&typeof onClose==='function')closeButton.addEventListener('click',onClose,{signal});
  function clamp(){
    if(disposed||!panel.getClientRects().length)return false;
    const rect=panel.getBoundingClientRect(),p=boundedRectPosition(rect.left,rect.top,rect.width,rect.height,visibleBounds(view,bounds,panel));
    if(panel.classList.contains('xp-window-moved')||p.x!==rect.left||p.y!==rect.top)return move(p.x,p.y);
    return false;
  }
  view.addEventListener('resize',clamp,{signal});
  let observer,mutations,clampFrame=0;
  if(view.ResizeObserver){observer=new view.ResizeObserver(clamp);observer.observe(panel);const area=typeof bounds==='function'?bounds():bounds;if(area&&area!==panel)observer.observe(area);}
  function scheduleClamp(){
    if(disposed||clampFrame)return;
    if(view.requestAnimationFrame)clampFrame=view.requestAnimationFrame(()=>{clampFrame=0;clamp();});else clamp();
  }
  const watched=new Set();
  function watchShell(){
    if(disposed)return;
    for(const blocker of shellObstructions(panel))if(!watched.has(blocker)){
      watched.add(blocker);observer?.observe(blocker);mutations?.observe(blocker,{attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});
      blocker.addEventListener('transitionend',scheduleClamp,{signal});blocker.addEventListener('transitioncancel',scheduleClamp,{signal});
    }
  }
  if(view.MutationObserver){
    mutations=new view.MutationObserver(()=>{watchShell();scheduleClamp();});
    const body=panel.ownerDocument?.body;if(body)mutations.observe(body,{attributes:true,attributeFilter:['class','style'],childList:true});
  }
  watchShell();
  return {
    move,clamp,
    restore(){
      if(disposed)return false;
      if(key)try{const stored=JSON.parse(positionStorage()?.getItem(key)||'null');if(stored&&!Array.isArray(stored)&&finite(stored.x)&&finite(stored.y)&&move(stored.x,stored.y))return true;}catch{}
      return clamp();
    },
    dispose(){
      if(disposed)return;disposed=true;abort.abort();observer?.disconnect();mutations?.disconnect();if(clampFrame)view.cancelAnimationFrame?.(clampFrame);clampFrame=0;
      if(drag&&handle.hasPointerCapture?.(drag.id))try{handle.releasePointerCapture(drag.id);}catch{}
      drag=null;handle.style.touchAction=oldHandle.touchAction;handle.style.cursor=oldHandle.cursor;
      for(const [name,value] of [['tabindex',oldHandle.tabIndex],['title',oldHandle.title]])if(value===null)handle.removeAttribute(name);else handle.setAttribute(name,value);
    }
  };
}
