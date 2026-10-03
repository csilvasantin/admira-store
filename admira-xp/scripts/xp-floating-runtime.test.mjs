import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSIC_FLOATING_PANELS,floatingBoundsRect,mountClassicFloatingPanels} from './xp-floating-runtime.mjs?v=20261003-panels-2';

function harness(){
 const registry=new Map(),attaches=[],queue=[],view=new EventTarget();let observer;
 class Style{
  getPropertyValue(name){return this[name]||'';}getPropertyPriority(){return '';}
  setProperty(name,value){this[name]=String(value);}removeProperty(name){delete this[name];}
 }
 const doc={documentElement:{lang:'es'},defaultView:view,createElement:tag=>new Element(tag),getElementById:id=>doc.querySelector('#'+id),querySelector:selector=>doc.body.matches(selector)?doc.body:doc.body.querySelector(selector)};
 class Element extends EventTarget{
  constructor(tag='div'){super();this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.style=new Style();this.attrs={};this.hidden=false;this.id='';this.nodeType=1;this.rect={left:20,top:80,width:300,height:150};this.classes=new Set();this.classList={contains:name=>this.classes.has(name),add:(...names)=>names.forEach(name=>this.classes.add(name)),remove:(...names)=>names.forEach(name=>this.classes.delete(name)),toggle:(name,on)=>{on??=!this.classes.has(name);on?this.classes.add(name):this.classes.delete(name);return on;}};}
  get isConnected(){let node=this;while(node.parentNode)node=node.parentNode;return node===doc;}
  get nextSibling(){const siblings=this.parentNode?.children||[];return siblings[siblings.indexOf(this)+1]||null;}
  get tabIndex(){return Number(this.attrs.tabindex??-1);}set tabIndex(value){this.setAttribute('tabindex',value);}
  setAttribute(name,value){this.attrs[name]=String(value);}getAttribute(name){return this.attrs[name]??null;}removeAttribute(name){delete this.attrs[name];}
  append(...children){for(const child of children){child.remove();child.parentNode=this;this.children.push(child);}}
  prepend(...children){for(const child of children)child.remove();for(const child of children)child.parentNode=this;this.children.unshift(...children);}
  insertBefore(child,before){child.remove();child.parentNode=this;this.children.splice(this.children.indexOf(before),0,child);}
  remove(){if(this.parentNode?.children)this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null;}
  contains(node){return node===this||this.children.some(child=>child.contains(node));}
  matches(selector){return selector.split(',').some(token=>{token=token.trim();return token==='[hidden]'?this.hidden:token[0]==='#'?this.id===token.slice(1):token[0]==='.'?this.classes.has(token.slice(1)):this.tagName===token.toUpperCase();});}
  closest(selector){for(let node=this;node instanceof Element;node=node.parentNode)if(node.matches(selector))return node;return null;}
  querySelector(selector){for(const child of this.children){if(child.matches(selector))return child;const found=child.querySelector(selector);if(found)return found;}return null;}
  getClientRects(){for(let node=this;node instanceof Element;node=node.parentNode)if(node.hidden||node.style.display==='none')return [];return [this.getBoundingClientRect()];}
  getBoundingClientRect(){const r=this.rect;return {...r,right:r.left+r.width,bottom:r.top+r.height};}
  click(){this.dispatchEvent(new Event('click',{cancelable:true}));this.onclick?.();}
 }
 doc.body=new Element('body');doc.body.parentNode=doc;
 Object.assign(view,{AbortController,innerWidth:1200,innerHeight:900,getComputedStyle:node=>({display:node.style.display||'block',visibility:node.style.visibility||'visible'}),queueMicrotask:fn=>queue.push(fn),MutationObserver:class{constructor(callback){this.callback=callback;observer=this;}observe(){}disconnect(){this.disconnected=true;}}});
 const advanced=new Element('nav');advanced.classList.add('quad-right');doc.body.append(advanced);
 const sceneControls=new Element();sceneControls.id='advSceneControls';advanced.append(sceneControls);
 const attach=(panel,options)=>{
  const handle=new Element('header');handle.classList.add('xp-floating-handle');panel.prepend(handle);panel.classList.add('xp-floating-panel');
  let closeButton=options.closeButton;if(!closeButton){closeButton=new Element('button');handle.append(closeButton);closeButton.addEventListener('click',options.onClose);}
  const api={panel,handle,closeButton,restored:0,disposed:false,open(){options.onOpen();this.restore();},close:options.onClose,restore(){this.restored++;},dispose(){this.disposed=true;handle.remove();panel.classList.remove('xp-floating-panel');}};
  attaches.push({panel,options,api});return api;
 };
 const register=(id,entry)=>{registry.set(id,entry);return ()=>registry.delete(id);};
 const mountMenu=container=>({dispose(){container.replaceChildren?.();}});
 const add=(id,parent=doc.body)=>{const element=new Element();element.id=id;parent.append(element);return element;};
 const mount=specs=>mountClassicFloatingPanels({document:doc,view,specs,attach,register,mountMenu});
 const flush=()=>{while(queue.length)queue.shift()();};
 return {doc,view,Element,add,mount,registry,attaches,advanced,sceneControls,flush,get observer(){return observer;}};
}

test('the adapter inventory contains stable unique Classic/tool selectors and leaves scene-owned UI out',()=>{
 assert.equal(new Set(CLASSIC_FLOATING_PANELS.map(item=>item.id)).size,CLASSIC_FLOATING_PANELS.length);
 assert.equal(new Set(CLASSIC_FLOATING_PANELS.map(item=>item.selector)).size,CLASSIC_FLOATING_PANELS.length);
 for(const item of CLASSIC_FLOATING_PANELS){assert.ok(item.label.es&&item.label.en);assert.doesNotMatch(item.selector,/life-selection|life-shelf-products|distribuit-panel|matrix-map-panel|matrix-playlist-editor|matrix-incident-editor|^#c$/);}
 for(const id of ['unitree','tiktok','conditional-interior','conditional-exterior','templates','turn-preview','day-results','perception'])assert.ok(CLASSIC_FLOATING_PANELS.some(item=>item.id===id),id);
 assert.equal(CLASSIC_FLOATING_PANELS.find(item=>item.id==='unitree').openMethod,'__openUnitreeDetail');
});

test('Classic window bounds intersect the canvas, viewport and visible bottom dock',()=>{
 assert.deepEqual(floatingBoundsRect({left:100,top:40,width:1000,height:800},{width:1200,height:900},[{left:0,top:750,width:1200,height:150}]),{left:100,top:40,width:1000,height:710});
 assert.deepEqual(floatingBoundsRect({left:-20,top:-10,width:1000,height:900},{width:800,height:700}),{left:0,top:0,width:800,height:700});
 assert.deepEqual(floatingBoundsRect(null,{width:800,height:700},[{left:1000,top:300,width:100,height:100}]),{left:0,top:0,width:800,height:700});
});

test('the authored X keeps its lifecycle and gains keyboard access; reopening restores UI without invoking data actions',()=>{
 const h=harness(),panel=h.add('panel'),oldHeader=new h.Element('header'),close=new h.Element('span');close.id='authored-close';oldHeader.append(close);panel.append(oldHeader);panel.style.position='fixed';panel.style.display='block';
 let nativeClose=0;close.onclick=()=>{nativeClose++;panel.style.display='none';};
 const runtime=h.mount([{id:'sample',selector:'#panel',label:{es:'Muestra',en:'Sample'},closeSelector:'#authored-close'}]);
 assert.equal(close.getAttribute('role'),'button');assert.equal(close.tabIndex,0);assert.equal(close.getAttribute('aria-label'),'Cerrar Muestra');
 assert.equal(close.parentNode,h.attaches[0].api.handle);assert.equal(h.doc.getElementById('advFloatingWindows').parentNode,h.advanced);assert.equal(h.sceneControls.parentNode,h.advanced);
 const key=new Event('keydown',{cancelable:true});Object.defineProperty(key,'key',{value:'Enter'});close.dispatchEvent(key);
 assert.equal(nativeClose,1);assert.equal(key.defaultPrevented,true);assert.equal(panel.style.display,'none');
 h.registry.get('classic:sample').open();assert.equal(panel.style.display,'block');assert.equal(nativeClose,1);assert.ok(h.attaches[0].api.restored>0);
 assert.equal(h.attaches[0].options.key,'xpaceos:floating-panel-position:v1:sample');
 runtime.dispose();assert.equal(close.parentNode,oldHeader);assert.equal(close.getAttribute('role'),null);assert.equal(close.getAttribute('tabindex'),null);assert.equal(panel.style.position,'fixed');assert.equal(h.registry.size,0);assert.equal(h.doc.getElementById('advFloatingWindows'),null);
});

test('UI-only close also hides a modal backdrop while preserving its live tool and reopens the saved presentation',()=>{
 const h=harness(),owner=h.add('backdrop'),panel=h.add('card',owner);owner.classList.add('on');owner.style.display='flex';
 let toolState='playing';
 const runtime=h.mount([{id:'card',selector:'#card',label:{es:'Tarjeta',en:'Card'},visibilitySelector:'#backdrop'}]);
 h.attaches[0].api.closeButton.click();assert.equal(owner.hidden,true);assert.equal(panel.hidden,true);assert.equal(toolState,'playing');
 h.registry.get('classic:card').open();assert.equal(owner.hidden,false);assert.equal(panel.hidden,false);assert.equal(owner.style.display,'flex');assert.equal(owner.classList.contains('on'),true);assert.equal(toolState,'playing');runtime.dispose();
});

test('parking in Expert suspends decoration and reopening; removing a tool cannot recreate a fake panel',()=>{
 const h=harness(),panel=h.add('panel'),runtime=h.mount([{id:'sample',selector:'#panel',label:{es:'Muestra',en:'Sample'}}]);
 const entry=h.registry.get('classic:sample'),expert=h.add('expertCategoryDetail');expert.append(panel);runtime.scan();
 assert.equal(runtime.size,0);assert.equal(panel.classList.contains('xp-floating-panel'),false);assert.equal(h.registry.size,0);entry.open();assert.equal(panel.hidden,false);
 h.doc.body.append(panel);runtime.scan();assert.equal(runtime.size,1);assert.equal(h.registry.size,1);assert.equal(h.attaches.length,2);
 const reopened=h.registry.get('classic:sample');panel.remove();runtime.scan();assert.equal(runtime.size,0);assert.equal(h.registry.size,0);reopened.open();assert.equal(h.doc.getElementById('panel'),null);runtime.dispose();
});

test('the observer coalesces relevant mutations and ignores content-only changes; dispose releases observers',()=>{
 const h=harness(),panel=h.add('panel'),runtime=h.mount([{id:'sample',selector:'#panel',label:{es:'Muestra',en:'Sample'}}]),observer=h.observer;
 const unrelated=new h.Element('span');observer.callback([{type:'childList',target:unrelated,addedNodes:[unrelated],removedNodes:[]}]);h.flush();assert.equal(h.attaches.length,1);
 observer.callback([{type:'attributes',target:panel}]);observer.callback([{type:'attributes',target:panel}]);h.flush();assert.equal(h.attaches.length,1);
 runtime.dispose();assert.equal(observer.disconnected,true);observer.callback([{type:'attributes',target:panel}]);h.flush();assert.equal(h.attaches.length,1);
});
