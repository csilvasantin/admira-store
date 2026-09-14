export function boundedPosition(x,y,width,height,viewportWidth,viewportHeight){
  return {x:Math.max(8,Math.min(x,Math.max(8,viewportWidth-width-8))),y:Math.max(8,Math.min(y,Math.max(8,viewportHeight-height-8)))};
}

// Closing a tool leaves its media connection running.
export function movableWindow(panel,handle,{key,onClose,closeButton}={}){
  let drag=null;
  handle.style.touchAction='none';handle.style.cursor='move';handle.tabIndex=0;
  handle.setAttribute('title','Arrastra para mover; también puedes usar las flechas');
  function move(x,y){
    const r=panel.getBoundingClientRect(),p=boundedPosition(x,y,r.width,r.height,innerWidth,innerHeight);
    panel.classList.add('xp-window-moved');
    panel.style.setProperty('--xp-window-left',p.x+'px');panel.style.setProperty('--xp-window-top',p.y+'px');
  }
  function save(){if(key)try{const r=panel.getBoundingClientRect();localStorage.setItem(key,JSON.stringify({x:r.left,y:r.top}));}catch{}}
  handle.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('button,a,input,textarea,select'))return;
    const r=panel.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};
    handle.setPointerCapture(e.pointerId);e.preventDefault();
  });
  handle.addEventListener('pointermove',e=>{if(drag)move(e.clientX-drag.x,e.clientY-drag.y);});
  const finish=e=>{if(!drag)return;drag=null;if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);save();};
  handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  handle.addEventListener('keydown',e=>{
    const offsets={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]},d=offsets[e.key];
    if(!d||e.target!==handle)return;const r=panel.getBoundingClientRect();move(r.left+d[0],r.top+d[1]);save();e.preventDefault();
  });
  closeButton?.addEventListener('click',onClose);
  window.addEventListener('resize',()=>{if(panel.classList.contains('xp-window-moved')&&panel.getClientRects().length){const r=panel.getBoundingClientRect();move(r.left,r.top);}});
  return {restore(){if(!key)return;try{const p=JSON.parse(localStorage.getItem(key));if(Number.isFinite(p?.x)&&Number.isFinite(p?.y))move(p.x,p.y);}catch{}}};
}
