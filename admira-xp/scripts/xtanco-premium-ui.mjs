import {openMatrixView,closeMatrixView,subscribeMatrixView} from './matrix-preview-ui.mjs?v=walk-1';
import {openLifeView,closeLifeView,subscribeLifeView} from './life-ui.mjs?v=tier-hud-1';
import {openBestView,closeBestView,subscribeBestView} from './best-preview-ui.mjs?v=tier-hud-1';
import {createVisualTiers,requestedTier} from './xtanco-visual-tiers.mjs?v=matrix-furniture-1';
import {createTierControls,updateTierControls} from './visual-tier-controls.mjs?v=tier-hud-1';

const actions=document.querySelector('#telegramDock .tg-actions');
const advanced=document.querySelector('.quad-right');
const status=document.createElement('div');status.id='xtanco-best-status';
status.setAttribute('role','status');status.hidden=true;document.body.append(status);
let storage;try{storage=window.localStorage;}catch{}
document.body.dataset.xtancoVisual='good'; // retired paint/operation hooks must stay inert
function syncVisualSurface(){
  const canvas=document.getElementById('c');if(!canvas)return;
  const rect=canvas.getBoundingClientRect(),root=document.documentElement.style;
  root.setProperty('--xtanco-surface-x',`${rect.left}px`);root.setProperty('--xtanco-surface-y',`${rect.top}px`);
  root.setProperty('--xtanco-surface-w',`${rect.width}px`);root.setProperty('--xtanco-surface-h',`${rect.height}px`);
}
syncVisualSurface();window.addEventListener('resize',syncVisualSurface);
try{const canvas=document.getElementById('c');if(canvas&&window.ResizeObserver)new window.ResizeObserver(syncVisualSurface).observe(canvas);}catch{}
try{
  if(window.MutationObserver){
    const observer=new window.MutationObserver(syncVisualSurface),canvas=document.getElementById('c'),top=document.getElementById('topBar');
    if(canvas)observer.observe(canvas,{attributes:true,attributeFilter:['style','class']});
    if(top)observer.observe(top,{attributes:true,attributeFilter:['style','class']});
  }
}catch{}
window.__xtancoSyncVisualSurface=syncVisualSurface;
let mudanzaActive=false;
function setMudanza(next){
  mudanzaActive=!!next;
  if(mudanzaActive)document.body.classList.add('xtanco-mudanza');else document.body.classList.remove('xtanco-mudanza');
  document.body.dataset.xtancoMudanza=mudanzaActive?'empty':'furnished';
  return mudanzaActive;
}
setMudanza(false);
window.__xtancoMudanza={toggle:()=>setMudanza(!mudanzaActive),set:setMudanza,get active(){return mudanzaActive;}};
function ensureExpertDock(){
  try{if(document.body.classList.contains('xp-left-hidden'))document.getElementById('pfExpert')?.click();}catch{}
}

const tiers=createVisualTiers({openBetter:openLifeView,closeBetter:closeLifeView,subscribeBetter:subscribeLifeView,
  openBest:openBestView,closeBest:closeBestView,subscribeBest:subscribeBestView,
  openMatrix:openMatrixView,closeMatrix:closeMatrixView,subscribeMatrix:subscribeMatrixView,storage,
  onChange(state){
    syncVisualSurface();document.body.dataset.xtancoTier=state.mode;updateTierControls(state);
    status.textContent=state.error||(state.busy?'Fusionando vista…':'');status.hidden=!status.textContent;
  }
});
const chooseDirect=tiers.choose.bind(tiers);let transitionActive=false;
function fusionGhost(){
  const active=document.querySelector('dialog.visual-tier-surface[open]'),source=active||document.getElementById('c');
  if(!source)return null;
  let ghost;
  if(active){
    ghost=active.cloneNode(true);ghost.classList.add('visual-tier-fusion-ghost');ghost.setAttribute('aria-hidden','true');
    for(const node of ghost.querySelectorAll('[id]'))node.removeAttribute('id');
    document.body.append(ghost);
    const originals=active.querySelectorAll('canvas'),copies=ghost.querySelectorAll('canvas');
    for(let index=0;index<originals.length;index++)try{copies[index].width=originals[index].width;copies[index].height=originals[index].height;copies[index].getContext('2d')?.drawImage(originals[index],0,0);}catch{}
  }else{
    ghost=document.createElement('canvas');ghost.className='visual-tier-fusion-ghost is-visible';ghost.setAttribute('aria-hidden','true');
    ghost.width=source.width;ghost.height=source.height;document.body.append(ghost);
    try{ghost.getContext('2d')?.drawImage(source,0,0);}catch{}
  }
  ghost.getBoundingClientRect();return ghost;
}
function fuseWithoutNative(mode){
  const ghost=fusionGhost(),outcome=chooseDirect(mode);
  if(ghost)Promise.resolve(outcome).finally(()=>{
    window.requestAnimationFrame?.(()=>ghost.classList.remove('is-visible'));window.setTimeout?.(()=>ghost.remove(),900);
  });
  return outcome;
}
tiers.choose=mode=>{
  ensureExpertDock();
  syncVisualSurface();
  if(typeof document.startViewTransition!=='function'||transitionActive)return fuseWithoutNative(mode);
  let outcome;transitionActive=true;
  try{
    const transition=document.startViewTransition(()=>{outcome=chooseDirect(mode);return outcome;});
    return transition.finished.catch(()=>{}).then(()=>outcome).finally(()=>{transitionActive=false;});
  }catch{transitionActive=false;return chooseDirect(mode);}
};
const expertControls=createTierControls({context:'Calidad visual · modo experto',choose:mode=>tiers.choose(mode)});
expertControls.element.id='xtanco-visual-quality';actions?.prepend(expertControls.element);
const advancedControls=createTierControls({context:'Calidad visual · modo avanzado',choose:mode=>tiers.choose(mode)});
advancedControls.element.id='xtanco-advanced-quality';advanced?.prepend(advancedControls.element);
window.__xtancoPremiumView={
  begin:()=>false,paint:()=>{},operationContext:()=>null,
  open:(mode='better')=>tiers.choose(mode),close:()=>tiers.choose('good'),get mode(){return 'good';}
};
window.__xtancoVisualTiers=tiers;
ensureExpertDock();
void tiers.choose(requestedTier(location.search,storage));
