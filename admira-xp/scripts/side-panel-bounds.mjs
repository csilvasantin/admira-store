// Rails share the actual scene edges, including wrapped HUDs and bottom docks.
const panels=[...document.querySelectorAll('.quad-left,.quad-right')];
const blockers=['topBar','telegramDock','characterDock','telegramSignagePanel'].map(id=>document.getElementById(id)).filter(Boolean);
let frame;
function visibleRect(el){
  if(!el)return null;
  const css=getComputedStyle(el),rect=el.getBoundingClientRect();
  return css.display!=='none'&&css.visibility!=='hidden'&&rect.width>0&&rect.height>0?rect:null;
}
function sync(){
  frame=null;
  const height=document.documentElement.clientHeight;
  const header=visibleRect(document.getElementById('topBar'));
  const top=Math.max(0,Math.min(height,header?.bottom||0));
  let bottom=height;
  for(const el of blockers){
    if(el.id==='topBar')continue;
    const rect=visibleRect(el);
    if(rect&&rect.bottom>top&&rect.top<height)bottom=Math.min(bottom,Math.max(top,rect.top));
  }
  for(const panel of panels){
    panel.style.top=top+'px';
    panel.style.bottom=(height-bottom)+'px';
    panel.style.height='auto';
    panel.style.maxHeight='none';
  }
}
function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
const sizes=new ResizeObserver(schedule),changes=new MutationObserver(schedule);
for(const el of blockers){sizes.observe(el);changes.observe(el,{attributes:true,attributeFilter:['style','class','hidden']});}
window.addEventListener('resize',schedule);
window.visualViewport?.addEventListener('resize',schedule);
window.XpaceSidePanelBounds=sync;
sync();
