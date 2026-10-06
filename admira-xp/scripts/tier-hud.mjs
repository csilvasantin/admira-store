import {interfaceTranslator} from './interface-language.mjs?v=options-language-1';
// View metadata belongs to the third Expert pane; the scene stays clear.
export const TIER_HUD={
  better:{index:'02',name:'BETTER',bits:16,caption:'Gemelo 3D · cámara alineada con Good',captionEn:'3D twin · camera aligned with Good'},
  best:{index:'03',name:'BEST',bits:32,caption:'Avenida Admira · mobiliario editable',captionEn:'Avenida Admira · editable furniture'},
  matrix:{index:'04',name:'MATRIX',bits:64,caption:'Starbucks Alsea · captura 360° y players',captionEn:'Starbucks Alsea · 360° capture and players'}
};
export function tierPlate(mode){
  const tier=TIER_HUD[mode];
  return tier?`${tier.index} · ${tier.name} · ${tier.bits} BITS`:'';
}
export function mountTierHud(dialog,{mode,stage}={}){
  const base=TIER_HUD[mode];
  const tier=globalThis.XpaceStarbucks?.active()&&mode!=='matrix'?{...base,caption:'Starbucks · Paseo de Gracia 103 · reconstrucción desde Matrix',captionEn:'Starbucks · Paseo de Gracia 103 · reconstruction from Matrix'}:base;
  if(!dialog||!tier)return {setStatus(){},dispose(){}};
  const scene=stage||dialog.querySelector('.best-stage,.life-stage')||dialog;
  const host=document.querySelector?.('#telegramDock .expert-view-pane');
  dialog.dataset.tierHud=mode;
  const en=document.documentElement?.lang==='en';
  const copy=interfaceTranslator([[tier.caption,tier.captionEn],['Estado de la vista','View status'],['EN VIVO','LIVE'],['Detalles de la escena','Scene details']]);
  const hud=document.createElement('div');
  hud.className='tier-hud';hud.dataset.mode=mode;
  hud.setAttribute('aria-label',en?'View status':'Estado de la vista');
  hud.innerHTML=`<div class="tier-hud-heading"><b>${tierPlate(mode)}</b></div>
    <p class="tier-hud-caption">${en?tier.captionEn:tier.caption}</p>
    <p class="tier-hud-status">${en?'LIVE':'EN VIVO'}</p>
    <details class="tier-hud-details" hidden><summary>${en?'Scene details':'Detalles de la escena'}</summary><div class="tier-hud-extra"></div></details>`;
  // Keep scene metadata in Expert even when Expert is hidden; never fall back
  // to covering the scene. The tier selector stays first in the third pane.
  const selector=host?.querySelector('.visual-tier-controls');
  if(selector?.insertAdjacentElement)selector.insertAdjacentElement('afterend',hud);
  else host?.append(hud);
  hud.hidden=true; // PREVIOS is reserved for media, not scene diagnostics or clocks.
  const syncDetails=()=>{
    const lines=[...scene.querySelectorAll?.('.matrix-furniture-status,.matrix-furniture-selection,.best-people-status,.best-stage figcaption')||[]]
      .filter(node=>!node.hidden).map(node=>node.textContent.trim()).filter(Boolean);
    hud.querySelector('.tier-hud-extra').textContent=lines.join(' · ');
    hud.querySelector('.tier-hud-details').hidden=!lines.length;
  };
  const stopLanguage=copy.observe(hud);
  syncDetails();
  const observer=typeof MutationObserver==='function'?new MutationObserver(syncDetails):null;
  observer?.observe(scene,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  // Keep contextual selection/editor panels above the dock's hidden strip.
  const safeBottom=()=>{
    try{
      const rect=scene.getBoundingClientRect?.();if(!rect)return;
      const dock=document.getElementById?.('telegramDock')?.getBoundingClientRect?.();
      const visible=Math.min(window.innerHeight||rect.bottom,dock&&dock.height?dock.top:Infinity);
      dialog.style?.setProperty?.('--hud-safe-bottom',Math.max(0,Math.round(rect.bottom-visible))+'px');
    }catch{/* presentation only */}
  };
  const tick=safeBottom;
  tick();const timer=setInterval(tick,1000);
  return {
    setStatus(text){hud.querySelector('.tier-hud-status').textContent=String(text||(document.documentElement?.lang==='en'?'LIVE':'EN VIVO')).toUpperCase();},
    dispose(){stopLanguage();clearInterval(timer);observer?.disconnect();hud.remove();delete dialog.dataset.tierHud;dialog.style?.removeProperty?.('--hud-safe-bottom');}
  };
}
