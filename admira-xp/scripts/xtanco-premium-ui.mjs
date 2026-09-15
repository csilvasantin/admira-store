import {createQualityController} from './xtanco-quality-controller.mjs';

const actions=document.querySelector('#telegramDock .tg-actions');
const controls=document.createElement('div');controls.id='xtanco-visual-quality';
controls.setAttribute('role','group');controls.setAttribute('aria-label','Acabado visual del Xtanco');
controls.innerHTML='<button type="button" data-visual-mode="good" aria-pressed="true" title="Good · clásico">Good</button><button type="button" data-visual-mode="better" aria-pressed="false" title="Better · wireframe">Better</button><button type="button" data-visual-mode="best" aria-pressed="false" title="Best · premium">Best</button><span class="quality-status" role="status" hidden></span>';
actions?.prepend(controls);
const status=controls.querySelector('.quality-status');
const worldCanvas=document.createElement('canvas'),operationsCanvas=document.createElement('canvas');
let lastError='';
const controller=createQualityController({worldCanvas,operationsCanvas,getState:()=>window.__xtancoVisualState?.(),
  onChange({mode,busy}){
    document.body.dataset.xtancoVisual=mode;controls.setAttribute('aria-busy',String(busy));
    for(const button of controls.querySelectorAll('[data-visual-mode]'))button.setAttribute('aria-pressed',String(button.dataset.visualMode===mode));
    status.textContent=busy?'Preparando…':lastError;status.hidden=!status.textContent;
  },
  onError(error){lastError='3D no disponible · puedes reintentar';console.warn('[Xtanco visual]',error.message);}
});
async function choose(mode){lastError='';await controller.choose(mode);try{localStorage.setItem('xtanco_visual_quality',controller.mode);}catch{}}
for(const button of controls.querySelectorAll('[data-visual-mode]'))button.onclick=()=>void choose(button.dataset.visualMode);
// Keyboard input still belongs to Good; only focused mode buttons consume it.
for(const type of ['keydown','keyup','keypress'])controls.addEventListener(type,event=>event.stopPropagation());
worldCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();controller.contextLost();});
window.addEventListener('pagehide',()=>controller.suspend());
window.addEventListener('pageshow',()=>void controller.resume());
window.__xtancoPremiumView={begin:controller.begin,paint:controller.paint,operationContext:controller.operationContext,
  open:(mode='best')=>choose(mode),close:()=>choose('good'),get mode(){return controller.mode;}};
let requested=new URLSearchParams(location.search).get('visual');
try{requested??=localStorage.getItem('xtanco_visual_quality');}catch{}
if(requested==='better'||requested==='best')void choose(requested);
