import {attachFloatingPanel,registerFloatingPanel,mountFloatingPanelMenu} from './floating-panels.mjs?v=floating-panels-1';

const spec=(id,selector,es,en,closeSelector='',openMethod='',visibilitySelector='')=>({id,selector,label:{es,en},closeSelector,openMethod,visibilitySelector});
export const CLASSIC_FLOATING_PANELS=Object.freeze([
 spec('player-camera','#xtore-window-panel','Player y cámara','Player and camera','#xtore-close'),
 spec('dvr','#dvrPanel','DVR','DVR','#dvrClose','openDVRPanel'),
 spec('metahuman','#metahumanPanel','MetaHuman','MetaHuman','#mhClose','openMetahumanPanel'),
 spec('unitree','#robotGrokPanel','Unitree','Unitree','','__openUnitreeDetail'),
 spec('mupi-camera','#mupiCamPanel','Cámara MUPI','MUPI camera','#mcClose','mupiCamOpenGallery'),
 spec('calendar','#xcalPanel','Calendario','Calendar','[data-xc="close"]','XCAL.open'),
 spec('auction','#admiraSubastaPanel','Subasta','Auction','button[title="Cerrar"]'),
 spec('impacts','#impactsHud','Impactos','Impacts','#impClose'),
 spec('customer','#custCardWin','Ficha de cliente','Customer record','.cc-close'),
 spec('pixeria','#pixerFeedOverlay','Pixeria','Pixeria','.pix-close','setPixerFeedVisible'),
 spec('tiktok','#tiktokPanel','Rodaje TikTok','TikTok production','#ttClose','__openTikTokPanel'),
 spec('target-publicity','#targetPubHud','Target Publicity','Target Publicity','#tpClose'),
 spec('compose','#composeOverlay','Componer','Compose','#composeOverlayClose'),
 spec('screen-info','#screenInfoPop','Información de pantalla','Screen information','.si-close'),
 spec('view-status','#xtanco-best-status','Estado de la vista','View status'),
 spec('conditional-interior','#xpl-signage','Condicional · interior','Conditional · interior'),
 spec('conditional-exterior','#xpl-ext-signage','Condicional · exterior','Conditional · exterior'),
 spec('conditional-status','#xpl-chip','Condicional','Conditional'),
 spec('conditional-composer','#xpl-composer','Reglas condicionales','Conditional rules','#xc-close','XPLComposer.open'),
 spec('circuit','#circuito-nav','Recorrido del circuito','Circuit tour'),
 spec('templates','#xpaceTemplateModal .xpace-tpl-dialog','Plantillas de Xpacio','Xpacio templates','#xpaceTplCloseBtn','openXpaceTemplateModal','#xpaceTemplateModal'),
 spec('save-template','#saveTplModal .save-tpl-dialog','Guardar plantilla','Save template','#saveTplCloseBtn','openSaveTemplateModal','#saveTplModal'),
 spec('presentation','#tpCard','Presentación del gemelo','Twin presentation','#tpX','TwinPresent.open','#tpModal'),
 spec('turn-preview','#turnFullCard','Turno y creación','Queue and creation','#turnFullX','openTurnFull','#turnFullOv'),
 spec('day-results','#dayEndOverlay > div','Resultados del día','Day results','','','#dayEndOverlay'),
 spec('perception','#percibeOverlay .pcb-window','La pantalla te ve','The screen sees you','#pcbClose','__PERCIBE.open','#percibeOverlay'),
]);

const PARKED='#expertCategoryDetail,#advSceneControls,#telegramDock,#characterDock,.quad-menu';
const SHOWN_CLASSES=['show','visible','on','tp-on'];
const GEOMETRY=['position','left','top','right','bottom','transform','translate','--xp-window-left','--xp-window-top','--xp-window-max-width','--xp-window-max-height'];

export function floatingBoundsRect(canvas,viewport,obstructions=[]){
 const width=Math.max(0,Number(viewport.width)||0),height=Math.max(0,Number(viewport.height)||0);
 const usable=canvas&&canvas.width>0&&canvas.height>0;
 const left=usable?Math.max(0,canvas.left):0,top=usable?Math.max(0,canvas.top):0;
 const right=usable?Math.min(width,canvas.left+canvas.width):width;
 let bottom=usable?Math.min(height,canvas.top+canvas.height):height;
 for(const rect of obstructions)if(rect&&rect.height>0&&rect.width>0&&rect.top>top&&rect.left<right&&rect.left+rect.width>left)bottom=Math.min(bottom,rect.top);
 return {left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};
}

function visibilityState(node){return {hidden:node.hidden,display:node.style.display,ariaHidden:node.getAttribute('aria-hidden'),shown:SHOWN_CLASSES.filter(name=>node.classList.contains(name))};}
function restoreVisibility(node,state){
 if(!state)return;node.hidden=state.hidden;node.style.display=state.display;
 for(const name of SHOWN_CLASSES)node.classList.toggle(name,state.shown.includes(name));
 if(state.ariaHidden===null)node.removeAttribute('aria-hidden');else node.setAttribute('aria-hidden',state.ariaHidden);
}
function globalMethod(view,path){
 if(!path)return null;const parts=path.split('.'),name=parts.pop();let owner=view;
 for(const part of parts){owner=owner?.[part];if(!owner)return null;}
 return typeof owner?.[name]==='function'?()=>owner[name](...(path==='setPixerFeedVisible'?[true]:[])):null;
}

/** Classic/XPL/modal adapter. Scene owners integrate Life, Best and Matrix
 * themselves; this observer never decorates their canvas or parked controls.
 */
export function mountClassicFloatingPanels({document:doc=globalThis.document,view=doc?.defaultView||globalThis.window,
 specs=CLASSIC_FLOATING_PANELS,attach=attachFloatingPanel,register=registerFloatingPanel,mountMenu=mountFloatingPanelMenu}={}){
 if(!doc?.body||!view)return {dispose(){},scan(){},size:0};
 const Controller=view.AbortController||globalThis.AbortController,abort=new Controller(),records=new Map();
 const bounds=doc.createElement('div');bounds.id='xpFloatingBounds';bounds.setAttribute('aria-hidden','true');
 bounds.style.cssText='position:fixed;visibility:hidden;pointer-events:none;overflow:hidden;border:0;margin:0;padding:0';doc.body.append(bounds);
 let disposed=false,scheduled=false,menu,menuHost,observer,sizeObserver;
 const en=()=>doc.documentElement?.lang==='en';
 const connected=node=>node?.isConnected!==false&&!!node?.parentNode;
 const parked=node=>!!node.closest(PARKED);
 function visible(node){
  if(!connected(node)||node.hidden||node.closest('[hidden]'))return false;
  const style=view.getComputedStyle(node);return style.display!=='none'&&style.visibility!=='hidden'&&node.getClientRects().length>0;
 }
 function syncBounds(){
  const canvas=doc.getElementById('c'),rect=canvas?.getBoundingClientRect();
  const docks=['telegramDock','characterDock'].map(id=>doc.getElementById(id)).filter(node=>node&&visible(node)).map(node=>node.getBoundingClientRect());
  const area=floatingBoundsRect(rect,{width:view.innerWidth,height:view.innerHeight},docks);
  for(const [name,value]of Object.entries({left:area.left+'px',top:area.top+'px',width:area.width+'px',height:area.height+'px'}))if(bounds.style[name]!==value)bounds.style[name]=value;
 }
 function ensureMenu(){
  const advanced=doc.querySelector('.quad-right');if(!advanced)return;
  if(menuHost&&connected(menuHost)&&menuHost.parentNode===advanced)return;
  menu?.dispose();menuHost?.remove();menuHost=doc.createElement('div');menuHost.id='advFloatingWindows';advanced.append(menuHost);
  menu=mountMenu(menuHost,{label:en()?'Windows':'Ventanas'});
 }
 function remember(record){
  if(visible(record.visibilityNode)&&visible(record.panel))record.snapshot={panel:visibilityState(record.panel),owner:record.visibilityNode===record.panel?null:visibilityState(record.visibilityNode)};
 }
 function open(record){
  if(disposed||!connected(record.panel)||parked(record.panel))return;
  const opener=globalMethod(view,record.spec.openMethod);
  if(record.snapshot){restoreVisibility(record.panel,record.snapshot.panel);restoreVisibility(record.visibilityNode,record.snapshot.owner);}
  else if(!opener)return;
  record.panel.hidden=false;record.visibilityNode.hidden=false;
  if(opener)opener();
  record.api.restore();record.wasVisible=visible(record.panel)&&visible(record.visibilityNode);remember(record);
 }
 function registerRecord(record){
  if(record.unregister||!record.snapshot&&!globalMethod(view,record.spec.openMethod))return;
  record.unregister=register('classic:'+record.spec.id,{label:record.label,open:()=>record.api.open()});
 }
 function close(record){
  remember(record);
  if(record.spec.id==='unitree'&&typeof view.__closeUnitreeDetail==='function'){view.__closeUnitreeDetail();return;}
  if(record.closeButton){record.closeButton.click();return;}
  // UI-only close: media, conditional rules, circuit timers and day state stay
  // owned by their original tool. Hide the backdrop as well as its inner card.
  record.visibilityNode.hidden=true;record.panel.hidden=true;
 }
 function teardown(record){
  record.unregister?.();record.abort.abort();
  if(record.closeButton&&record.closeParent){
   if(record.closeNext?.parentNode===record.closeParent)record.closeParent.insertBefore(record.closeButton,record.closeNext);else record.closeParent.append(record.closeButton);
  }
  record.api.dispose();
  if(record.closeButton&&!record.wasCloseClass)record.closeButton.classList.remove('xp-floating-close');
  for(const [name,{value,priority}]of Object.entries(record.geometry))if(value)record.panel.style.setProperty(name,value,priority);else record.panel.style.removeProperty(name);
  if(!record.wasMoved)record.panel.classList.remove('xp-window-moved');
  for(const [name,value]of Object.entries(record.closeAttributes||{}))if(value===null)record.closeButton.removeAttribute(name);else record.closeButton.setAttribute(name,value);
  records.delete(record.panel);
 }
 function add(panel,item){
  const label=item.label[en()?'en':'es'],visibilityNode=item.visibilitySelector?doc.querySelector(item.visibilitySelector)||panel:panel;
  const closeButton=item.closeSelector?(panel.querySelector(item.closeSelector)||doc.querySelector(item.closeSelector)):null;
  const ownAbort=new Controller(),record={panel,spec:item,label,visibilityNode,closeButton,abort:ownAbort,wasVisible:false,geometry:{},wasMoved:panel.classList.contains('xp-window-moved')};
  for(const name of GEOMETRY)record.geometry[name]={value:panel.style.getPropertyValue(name),priority:panel.style.getPropertyPriority(name)};
  if(closeButton){
   record.wasCloseClass=closeButton.classList.contains('xp-floating-close');closeButton.classList.add('xp-floating-close');
   record.closeParent=closeButton.parentNode;record.closeNext=closeButton.nextSibling;record.closeAttributes={};
   for(const name of ['aria-label','role','tabindex','type'])record.closeAttributes[name]=closeButton.getAttribute(name);
   closeButton.setAttribute('aria-label',(en()?'Close ':'Cerrar ')+label);
   if(closeButton.tagName==='BUTTON')closeButton.type='button';
   else{
    closeButton.setAttribute('role','button');closeButton.tabIndex=0;
    closeButton.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();closeButton.click();}},{signal:ownAbort.signal});
   }
   closeButton.addEventListener('click',()=>remember(record),{capture:true,signal:ownAbort.signal});
  }
  record.api=attach(panel,{label,bounds:()=>bounds,key:'xpaceos:floating-panel-position:v1:'+item.id,
   closeButton:closeButton||undefined,onClose:()=>close(record),onOpen:()=>open(record)});
  // XPL previews contain absolute media layers. Keep their new handle above
  // those layers so it remains reachable while the content keeps playing.
  record.api.handle.style.position='relative';record.api.handle.style.zIndex='4';record.api.handle.style.background='inherit';
  // Move the authored X into the new handle without replacing its listeners.
  // Disposing restores its original parent, which also permits dock parking.
  if(closeButton)record.api.handle.append(closeButton);
  records.set(panel,record);remember(record);record.wasVisible=visible(panel)&&visible(visibilityNode);registerRecord(record);
  if(record.wasVisible)record.api.restore();
 }
 function scan(){
  if(disposed)return;syncBounds();ensureMenu();
  for(const record of [...records.values()])if(!connected(record.panel)||parked(record.panel)||!record.panel.contains(record.api.handle))teardown(record);
  for(const item of specs){
   const panel=doc.querySelector(item.selector);if(!panel||parked(panel)||records.has(panel)||panel.classList.contains('xp-floating-panel'))continue;
   add(panel,item);
  }
  for(const record of records.values()){
   const nowVisible=visible(record.panel)&&visible(record.visibilityNode);
   if(nowVisible&&!record.wasVisible)record.api.restore();
   if(nowVisible)remember(record);record.wasVisible=nowVisible;registerRecord(record);
  }
 }
 function schedule(){if(disposed||scheduled)return;scheduled=true;(view.queueMicrotask||globalThis.queueMicrotask)(()=>{scheduled=false;scan();});}
 const selectors=specs.map(item=>item.selector).join(','),visibilitySelectors=specs.map(item=>item.visibilitySelector).filter(Boolean).join(',');
 function relevant(mutation){
  if(mutation.type==='attributes'){
   if(['c','telegramDock','characterDock'].includes(mutation.target.id)||mutation.target===doc.body)return true;
   if(visibilitySelectors&&mutation.target.matches?.(visibilitySelectors))return true;
   return records.has(mutation.target);
  }
  if(records.has(mutation.target)||[...records.values()].some(record=>record.visibilityNode===mutation.target))return true;
  return [...mutation.addedNodes,...mutation.removedNodes].some(node=>node.nodeType===1&&(records.has(node)||[...records.keys()].some(panel=>node.contains?.(panel))||node.matches?.(selectors)||node.querySelector?.(selectors)||node.id==='advFloatingWindows'||node.matches?.('.quad-right')));
 }
 scan();
 if(view.MutationObserver){observer=new view.MutationObserver(mutations=>{if(mutations.some(relevant))schedule();});observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','hidden','aria-hidden']});}
 if(view.ResizeObserver){sizeObserver=new view.ResizeObserver(schedule);for(const id of ['c','telegramDock','characterDock']){const element=doc.getElementById(id);if(element)sizeObserver.observe(element);}}
 view.addEventListener('resize',schedule,{signal:abort.signal});
 view.addEventListener('pagehide',()=>dispose(),{once:true,signal:abort.signal});
 function dispose(){
  if(disposed)return;disposed=true;abort.abort();observer?.disconnect();sizeObserver?.disconnect();for(const record of [...records.values()])teardown(record);menu?.dispose();menuHost?.remove();bounds.remove();
 }
 return {scan,dispose,get size(){return records.size;}};
}

if(typeof document!=='undefined'&&document.body)mountClassicFloatingPanels();
else if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>mountClassicFloatingPanels(),{once:true});
