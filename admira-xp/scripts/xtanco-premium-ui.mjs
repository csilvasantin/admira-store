import {openLifeView,closeLifeView,subscribeLifeView} from './life-ui.mjs?v=tiers-linked-4';
import {openBestView,closeBestView,subscribeBestView} from './best-preview-ui.mjs?v=tiers-linked-4';
import {createVisualTiers,requestedTier} from './xtanco-visual-tiers.mjs?v=tiers-linked-4';
import {createTierControls,updateTierControls} from './visual-tier-controls.mjs?v=tiers-linked-4';

const actions=document.querySelector('#telegramDock .tg-actions');
const advanced=document.querySelector('.quad-right');
const status=document.createElement('div');status.id='xtanco-best-status';
status.setAttribute('role','status');status.hidden=true;document.body.append(status);
let storage;try{storage=window.localStorage;}catch{}
document.body.dataset.xtancoVisual='good'; // retired paint/operation hooks must stay inert
const tiers=createVisualTiers({openBetter:openLifeView,closeBetter:closeLifeView,subscribeBetter:subscribeLifeView,
  openBest:openBestView,closeBest:closeBestView,subscribeBest:subscribeBestView,storage,
  onChange(state){
    document.body.dataset.xtancoTier=state.mode;updateTierControls(state);
    status.textContent=state.busy?'Abriendo vista…':state.notice;status.hidden=!status.textContent;
  }
});
const expertControls=createTierControls({context:'Calidad visual · modo experto',choose:mode=>tiers.choose(mode)});
expertControls.element.id='xtanco-visual-quality';actions?.prepend(expertControls.element);
const advancedControls=createTierControls({context:'Calidad visual · modo avanzado',choose:mode=>tiers.choose(mode)});
advancedControls.element.id='xtanco-advanced-quality';advanced?.prepend(advancedControls.element);
window.__xtancoPremiumView={
  begin:()=>false,paint:()=>{},operationContext:()=>null,
  open:(mode='better')=>tiers.choose(mode),close:()=>tiers.choose('good'),get mode(){return 'good';}
};
window.__xtancoVisualTiers=tiers;
void tiers.choose(requestedTier(location.search,storage));
