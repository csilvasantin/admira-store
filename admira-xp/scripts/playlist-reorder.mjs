// Reorder the draft only. Capture on the stable list, not the moving row.
export function mountPlaylistReorder({list,scrollRoot,signal,onMove=()=>{},hitTest=()=>null,onHover=()=>{},onDrop=()=>{}}){
 let drag=null,frame=0;
 const options={signal};
 function finish(cancel=false,target=null){
  if(!drag)return;const old=drag;drag=null;cancelAnimationFrame(frame);
  if(cancel||target)for(const row of old.order)list.append(row);
  old.ghost?.remove();onHover(null);
  old.row.classList.remove('is-reordering');
  if(list.hasPointerCapture(old.id))list.releasePointerCapture(old.id);
  if(target)onDrop(old.row,target);
  else if(!cancel&&old.order.some((row,i)=>row!==list.children[i]))onMove();
 }
 function tick(){
  if(!drag)return;
  if(drag.moved){
   if(!drag.ghost){drag.ghost=document.createElement('div');drag.ghost.className='device-drag-ghost';const preview=drag.row.querySelector('.device-preview');if(preview&&!preview.hidden){const video=preview.cloneNode();video.muted=true;drag.ghost.append(video);}list.closest('dialog')?.append(drag.ghost);}
   Object.assign(drag.ghost.style,{left:drag.x+'px',top:drag.y+'px',transform:'translate(-50%,-50%)'});
   onHover(hitTest(drag.x,drag.y));
   const bounds=scrollRoot.getBoundingClientRect();
   if(drag.x>=bounds.left&&drag.x<=bounds.right){
    if(drag.y<bounds.top+42)scrollRoot.scrollTop-=10;
    if(drag.y>bounds.bottom-42)scrollRoot.scrollTop+=10;
    const next=[...list.children].find(row=>row!==drag.row&&drag.y<row.getBoundingClientRect().top+row.getBoundingClientRect().height/2);
    if(next!==drag.row.nextElementSibling)list.insertBefore(drag.row,next||null);
   }
  }
  frame=requestAnimationFrame(tick);
 }
 list.addEventListener('pointerdown',e=>{
  const handle=e.target.closest('.device-preview-handle');if(!handle||e.button!==0||drag)return;
  e.preventDefault();e.stopPropagation();handle.focus({preventScroll:true});
  drag={id:e.pointerId,row:handle.closest('li'),order:[...list.children],x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
  list.setPointerCapture(e.pointerId);frame=requestAnimationFrame(tick);
 },options);
 list.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopPropagation();drag.x=e.clientX;drag.y=e.clientY;if(Math.hypot(drag.x-drag.startX,drag.y-drag.startY)>5){drag.moved=true;drag.row.classList.add('is-reordering');}},options);
 list.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopPropagation();const r=scrollRoot.getBoundingClientRect(),target=drag.moved?hitTest(e.clientX,e.clientY):null;finish(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom,target);},options);
 for(const event of ['pointercancel','lostpointercapture'])list.addEventListener(event,()=>finish(true),options);
 list.ownerDocument.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();e.stopPropagation();finish(true);}},{...options,capture:true});
 list.addEventListener('keydown',e=>{
  const handle=e.target.closest('.device-preview-handle');if(!handle||!['ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();const row=handle.closest('li'),other=e.key==='ArrowUp'?row.previousElementSibling:row.nextElementSibling;
  if(other){if(e.key==='ArrowUp')list.insertBefore(row,other);else list.insertBefore(other,row);handle.focus({preventScroll:true});row.scrollIntoView({block:'nearest'});onMove();}
 },options);
 signal.addEventListener('abort',()=>finish(true),{once:true});
 return {cancel:()=>finish(true)};
}
