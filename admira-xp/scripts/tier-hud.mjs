// Shared HUD for the upper visual tiers (Better 16 · Best 32 · Matrix 64 bits).
// Good (8 bits) keeps its own chrome untouched: this only decorates dialogs that
// call mountTierHud, and every rule in tier-hud.css is scoped to [data-tier-hud].
// The HUD never owns simulation, camera or inventory; it re-presents the status
// and selection that each surface already publishes, in one place and one style.
export const TIER_HUD={
  better:{index:'02',name:'BETTER',bits:16,caption:'Gemelo 3D · cámara alineada con Good'},
  best:{index:'03',name:'BEST',bits:32,caption:'Tienda y personas en 3D en vivo'},
  matrix:{index:'04',name:'MATRIX',bits:64,caption:'Avenida Admira · mobiliario editable'}
};
export function tierPlate(mode){
  const tier=TIER_HUD[mode];
  return tier?`${tier.index} · ${tier.name} · ${tier.bits} BITS`:'';
}
export function mountTierHud(dialog,{mode,stage}={}){
  const tier=TIER_HUD[mode];
  if(!dialog||!tier)return {setStatus(){},dispose(){}};
  const host=stage||dialog.querySelector('.best-stage,.life-stage')||dialog;
  dialog.dataset.tierHud=mode;
  const hud=document.createElement('div');
  hud.className='tier-hud';hud.setAttribute('aria-hidden','true');
  hud.innerHTML=`<i class="tier-hud-corner tl"></i><i class="tier-hud-corner tr"></i><i class="tier-hud-corner bl"></i><i class="tier-hud-corner br"></i>
    <div class="tier-hud-plate"><b>${tier.index}</b><span class="tier-hud-name">${tier.name}</span><span class="tier-hud-bits">${tier.bits}<small>BITS</small></span></div>
    <p class="tier-hud-caption">${tier.caption}</p>
    <p class="tier-hud-live"><i></i><span class="tier-hud-status">EN VIVO</span><time class="tier-hud-clock"></time></p>
    <div class="tier-hud-scan"></div>`;
  host.append(hud);
  const clock=hud.querySelector('.tier-hud-clock');
  // Good's canvas can run under the bottom dock and past the viewport; lift the
  // HUD's bottom row by exactly the hidden strip so tools are never covered.
  const safeBottom=()=>{
    try{
      const rect=host.getBoundingClientRect?.();if(!rect)return;
      const dock=document.getElementById?.('telegramDock')?.getBoundingClientRect?.();
      const visible=Math.min(window.innerHeight||rect.bottom,dock&&dock.height?dock.top:Infinity);
      dialog.style?.setProperty?.('--hud-safe-bottom',Math.max(0,Math.round(rect.bottom-visible))+'px');
    }catch{/* presentation only */}
  };
  const tick=()=>{const now=new Date();clock.textContent=[now.getHours(),now.getMinutes(),now.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':');safeBottom();};
  tick();const timer=setInterval(tick,1000);
  return {
    setStatus(text){hud.querySelector('.tier-hud-status').textContent=String(text||'EN VIVO').toUpperCase();},
    dispose(){clearInterval(timer);hud.remove();delete dialog.dataset.tierHud;dialog.style?.removeProperty?.('--hud-safe-bottom');}
  };
}
