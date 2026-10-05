import {interfaceTranslator} from './interface-language.mjs?v=options-language-1';
// One vocabulary and one selection state for Advanced, Expert and both views.
const groups=new Set();
let state={mode:'good',busy:false};
export function updateTierControls(next){
  state=next;
  if(globalThis.XpaceStarbucks?.active())for(const group of groups){const best=group.querySelector('[data-visual-mode=best]');if(best){best.title='03.- Best · 32 bits · Starbucks Paseo de Gracia 103';best.querySelector('small').textContent='32 bits · Starbucks';}}
  for(const group of groups){
    group.setAttribute('aria-busy',String(!!state.busy));
    for(const button of group.querySelectorAll('[data-visual-mode]'))button.setAttribute('aria-pressed',String(button.dataset.visualMode===state.mode));
  }
}
export function createTierControls({context='Calidad visual',choose}={}){
  const element=document.createElement('div');element.className='visual-tier-controls';
  element.setAttribute('role','group');element.setAttribute('aria-label',context);
  element.innerHTML='<button type="button" data-visual-mode="good" title="01.- Good · estilo 8-bit · gemelo clásico"><span>01.- Good</span><small>8 bits</small></button><button type="button" data-visual-mode="better" title="02.- Better · estilo 16-bit · mismo gemelo en 3D"><span>02.- Better</span><small>16 bits</small></button><button type="button" data-visual-mode="best" title="03.- Best · estilo 32-bit · Avenida Admira · mobiliario editable"><span>03.- Best</span><small>32 bits · Avenida Admira</small></button><button type="button" data-visual-mode="matrix" title="04.- Matrix · estilo 64-bit · Starbucks Alsea · panorama 360° y mapeo de players"><span>04.- Matrix</span><small>64 bits · Starbucks Alsea</small></button>';
  if(globalThis.XpaceStarbucks?.active()){const best=element.querySelector('[data-visual-mode=best]');best.title='03.- Best · 32 bits · Starbucks Paseo de Gracia 103';best.querySelector('small').textContent='32 bits · Starbucks';}
  for(const button of element.querySelectorAll('[data-visual-mode]'))button.onclick=event=>{event.stopPropagation();void choose?.(button.dataset.visualMode);};
  for(const type of ['click','keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend'])element.addEventListener(type,event=>event.stopPropagation());
  const stopLanguage=interfaceTranslator([["Calidad visual", "Visual quality"], ["01.- Good · estilo 8-bit · gemelo clásico", "01.- Good · 8-bit style · classic twin"], ["02.- Better · estilo 16-bit · mismo gemelo en 3D", "02.- Better · 16-bit style · same twin in 3D"], ["03.- Best · estilo 32-bit · Avenida Admira · mobiliario editable", "03.- Best · 32-bit style · Avenida Admira · editable furniture"], ["04.- Matrix · estilo 64-bit · Starbucks Alsea · panorama 360° y mapeo de players", "04.- Matrix · 64-bit style · Starbucks Alsea · 360° panorama and player mapping"]]).observe(element);
  groups.add(element);updateTierControls(state);
  return {element,dispose(){stopLanguage();groups.delete(element);element.remove();}};
}
