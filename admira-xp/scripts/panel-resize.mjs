const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function resizedPanel(start,dx,dy,{axis='both',direction=1,minWidth=156,minHeight=128,maxWidth=560,maxHeight=600}={}){
  const clamp=(n,min,max)=>Math.round(Math.max(Math.min(min,max),Math.min(max,n)));
  return {width:axis==='height'?start.width:clamp(start.width+dx*direction,minWidth,maxWidth),height:axis==='width'?start.height:clamp(start.height+dy*direction,minHeight,maxHeight)};
}

// The same accessible splitter controls docked rails and floating tools.
// Position and size have separate storage keys, preserving existing history.
export function attachPanelResize(panel,{axis='both',direction=1,label='Window',key,storage,container=panel.ownerDocument.body,limits=()=>({}),onChange=()=>{},normaliseWidth=w=>w,widthStep=(w,delta)=>w+delta,view=panel.ownerDocument.defaultView}={}){
  const doc=panel.ownerDocument,abort=new view.AbortController(),signal=abort.signal;
  const handle=doc.createElement('div');handle.className='xp-panel-resize xp-panel-resize-'+axis;handle.tabIndex=0;handle.setAttribute('role','separator');
  handle.setAttribute('aria-orientation',axis==='height'?'horizontal':'vertical');
  panel.id ||= 'xp-resizable-'+Math.random().toString(36).slice(2);
  handle.setAttribute('aria-controls',panel.id);container.append(handle);
  const wasSized=panel.classList.contains('xp-panel-sized');
  const original={width:panel.style.width,height:panel.style.height};let drag=null,manual=null,disposed=false;
  const store=()=>{if(storage!==undefined)return storage;try{return view.localStorage;}catch{return null;}};
  const visible=()=>!panel.classList.contains('xs-expert-docked')&&!panel.hidden&&!panel.classList.contains('is-collapsed')&&panel.getAttribute('aria-hidden')!=='true'&&panel.getClientRects().length>0&&view.getComputedStyle(panel).display!=='none';
  const measure=()=>{const r=panel.getBoundingClientRect();return {width:r.width,height:r.height};};
  const rules=()=>({axis,direction,...limits()});
  function sync(){
    if(disposed)return;handle.hidden=!visible();if(handle.hidden)return;
    const r=panel.getBoundingClientRect(),height=axis==='height',both=axis==='both',en=doc.documentElement.lang==='en';
    handle.style.left=(both?r.right-20:height?r.left+8:direction===1?r.right-8:r.left)+'px';
    handle.style.top=(both?r.bottom-20:height?r.top:r.top+8)+'px';
    handle.style.width=(both?20:height?Math.max(0,r.width-16):8)+'px';
    handle.style.height=(both?20:height?10:Math.max(0,r.height-16))+'px';
    handle.setAttribute('aria-label',(en?'Resize ':'Redimensionar ')+(typeof label==='function'?label():label));
    handle.title=en?'Drag to resize · arrows · Home or double-click to reset':'Arrastra para redimensionar · flechas · Inicio o doble clic para restaurar';
    const bounds=rules();handle.setAttribute('aria-valuenow',Math.round(height?r.height:r.width));handle.setAttribute('aria-valuemin',height?(bounds.minHeight??128):(bounds.minWidth??156));handle.setAttribute('aria-valuemax',height?(bounds.maxHeight??600):(bounds.maxWidth??560));
  }
  function apply(size,persist=false){
    if(disposed||panel.classList.contains('xs-expert-docked')||!finite(size.width)||!finite(size.height))return;
    manual=resizedPanel({...size,width:axis==='height'?size.width:normaliseWidth(size.width)},0,0,rules());panel.classList.add('xp-panel-sized');
    if(axis!=='height')panel.style.width=manual.width+'px';
    if(axis!=='width')panel.style.height=manual.height+'px';
    onChange(manual);sync();if(persist&&key)try{store()?.setItem(key,JSON.stringify(manual));}catch{}
  }
  function reset(){manual=null;if(!wasSized)panel.classList.remove('xp-panel-sized');panel.style.width=original.width;panel.style.height=original.height;if(key)try{store()?.removeItem(key);}catch{}onChange(null);sync();}
  handle.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:measure()};handle.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation();},{signal});
  handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;apply(resizedPanel(drag.start,e.clientX-drag.x,e.clientY-drag.y,rules()));e.preventDefault();e.stopPropagation();},{signal});
  function finish(e){if(!drag||e.pointerId!==undefined&&e.pointerId!==drag.id)return;const id=drag.id;drag=null;if(handle.hasPointerCapture?.(id))try{handle.releasePointerCapture(id);}catch{}apply(measure(),true);}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(event,finish,{signal});
  handle.addEventListener('dblclick',reset,{signal});
  handle.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='Home'){e.preventDefault();e.stopPropagation();reset();return;}
    const step=e.shiftKey?5:20,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
    if(!delta||axis==='height'&&delta[0]||axis==='width'&&delta[1])return;
    e.preventDefault();e.stopPropagation();const start=measure();if(delta[0])delta[0]=(widthStep(start.width,delta[0]*direction)-start.width)*direction;apply(resizedPanel(start,...delta,rules()),true);
  },{signal});
  function fit(){if(manual)apply(manual);else sync();}
  view.addEventListener('resize',fit,{signal});
  panel.addEventListener('transitionend',sync,{signal});panel.addEventListener('transitioncancel',sync,{signal});
  const observer=view.ResizeObserver?new view.ResizeObserver(sync):null;observer?.observe(panel);
  const mutations=view.MutationObserver?new view.MutationObserver(sync):null;mutations?.observe(panel,{attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});mutations?.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
  try{const size=JSON.parse(key?store()?.getItem(key)||'null':'null');if(finite(size?.width)&&finite(size?.height))apply(size);}catch{}
  sync();
  return {handle,sync,fit,reset,dispose(){if(disposed)return;disposed=true;abort.abort();observer?.disconnect();mutations?.disconnect();handle.remove();if(!wasSized)panel.classList.remove('xp-panel-sized');panel.style.width=original.width;panel.style.height=original.height;}};
}
