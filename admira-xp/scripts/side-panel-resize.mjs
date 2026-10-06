// Manual rail widths take precedence over automatic canvas letterboxing.
import {attachOptionsRail,optionsWidth,OPTIONS_ICON_WIDTH} from './options-rail.mjs?v=20261006-alsea-repair-1';
const root=document.body;
const es=()=>document.documentElement.lang!=='en';
const saved={};
let options;
const limits=side=>({min:side==='left'?OPTIONS_ICON_WIDTH:152,max:Math.max(120,Math.min(560,innerWidth-32))});
const clamp=(side,width)=>{const {min,max}=limits(side);return side==='left'&&options?optionsWidth(width,options.readable(),max):Math.round(Math.max(min,Math.min(max,width)));};
for(const side of ['left','right']){
  try{const width=Number(localStorage.getItem('xpace_side_width_'+side));if(width>0)saved[side]=width;}catch{}
}
window.__xpSidePanelWidth=(side,automatic)=>{
  const width=side==='left'&&options?options.desired(saved[side]>0?saved[side]:null):clamp(side,saved[side]>0?saved[side]:Math.max(192,automatic));
  if(side==='left')options?.sync(width);
  return width;
};
const left=document.querySelector('.quad-left');
if(left)options=attachOptionsRail(left,{onChange:()=>{if(options)window.dispatchEvent(new Event('resize'));}});
for(const side of ['left','right']){
  const panel=document.querySelector('.quad-'+side);if(!panel)continue;
  const handle=document.createElement('div');handle.className='quad-resize quad-resize-'+side;handle.tabIndex=0;
  panel.id ||= 'xpace-side-'+side;
  handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-controls',panel.id);root.append(handle);
  function sync(){
    const rect=panel.getBoundingClientRect(),{min,max}=limits(side);
    handle.hidden=panel.classList.contains('is-collapsed');
    handle.style.top=rect.top+'px';handle.style.height=rect.height+'px';
    handle.style[side]=Math.max(0,rect.width-8)+'px';
    handle.setAttribute('aria-valuemin',min);handle.setAttribute('aria-valuemax',max);handle.setAttribute('aria-valuenow',Math.round(rect.width));
    const name=es()?(side==='left'?'Opciones':'Avanzadas'):(side==='left'?'Options':'Advanced');
    const label=(es()?'Redimensionar ':'Resize ')+name;
    handle.setAttribute('aria-label',label);handle.title=label+(es()?' · arrastra o usa las flechas · doble clic para restaurar':' · drag or use arrows · double-click to reset');
  }
  function set(width,persist=false){
    saved[side]=clamp(side,width);panel.style.width=(side==='left'?options.desired(saved[side]):saved[side])+'px';if(side==='left')options.sync(parseFloat(panel.style.width));sync();
    if(persist)try{localStorage.setItem('xpace_side_width_'+side,String(saved[side]));}catch{}
  }
  function reset(){delete saved[side];try{localStorage.removeItem('xpace_side_width_'+side);}catch{}window.dispatchEvent(new Event('resize'));sync();}
  let drag;
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    drag={x:event.clientX,width:panel.getBoundingClientRect().width};handle.setPointerCapture(event.pointerId);event.preventDefault();
  });
  handle.addEventListener('pointermove',event=>{if(drag)set(drag.width+(event.clientX-drag.x)*(side==='left'?1:-1));});
  const stop=()=>{if(!drag)return;drag=null;set(panel.getBoundingClientRect().width,true);};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(name,stop);
  handle.addEventListener('dblclick',reset);
  handle.addEventListener('keydown',event=>{
    if(event.key==='Home'){event.preventDefault();reset();return;}
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();const width=panel.getBoundingClientRect().width;
    set(side==='left'&&width<options.readable()&&event.key==='ArrowRight'?options.readable():width+(event.key==='ArrowRight'?20:-20)*(side==='left'?1:-1),true);
  });
  new ResizeObserver(sync).observe(panel);
  new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class']});
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('resize',sync);sync();
}
window.dispatchEvent(new Event('resize'));
