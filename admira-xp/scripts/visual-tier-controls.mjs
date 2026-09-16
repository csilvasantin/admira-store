// One vocabulary and one selection state for Advanced, Expert and both views.
const groups=new Set();
let state={mode:'good',busy:false};
export function updateTierControls(next){
  state=next;
  for(const group of groups){
    group.setAttribute('aria-busy',String(!!state.busy));
    for(const button of group.querySelectorAll('[data-visual-mode]'))button.setAttribute('aria-pressed',String(button.dataset.visualMode===state.mode));
  }
}
export function createTierControls({context='Calidad visual',choose}={}){
  const element=document.createElement('div');element.className='visual-tier-controls';
  element.setAttribute('role','group');element.setAttribute('aria-label',context);
  element.innerHTML='<button type="button" data-visual-mode="good" title="01.- Good · estilo 8-bit · gemelo clásico"><span>01.- Good</span><small>8 bits</small></button><button type="button" data-visual-mode="better" title="02.- Better · estilo 16-bit · mismo gemelo en 3D"><span>02.- Better</span><small>16 bits</small></button><button type="button" data-visual-mode="best" title="03.- Best · estilo 32-bit · concepto estático, no operativo"><span>03.- Best</span><small>32 bits · preview</small></button>';
  for(const button of element.querySelectorAll('[data-visual-mode]'))button.onclick=event=>{event.stopPropagation();void choose?.(button.dataset.visualMode);};
  for(const type of ['click','keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend'])element.addEventListener(type,event=>event.stopPropagation());
  groups.add(element);updateTierControls(state);
  return {element,dispose(){groups.delete(element);element.remove();}};
}
