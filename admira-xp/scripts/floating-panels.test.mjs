import {attachPanelResize,resizedPanel} from './panel-resize.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {setMaxListeners} from 'node:events';
import {boundedRectPosition,localWindowPosition,movableWindow} from './floating-window.mjs';
import {attachFloatingPanel,registerFloatingPanel,mountFloatingPanelMenu} from './floating-panels.mjs?v=20261003-panels-2';

function harness({left=600,top=100,width=300,height=180,lang='es',parentRect={left:100,top:48,width:900,height:650}}={}){
  class Controller extends AbortController{constructor(){super();setMaxListeners(0,this.signal);}}
  const view=new EventTarget(),stored=new Map(),writes=[];
  Object.assign(view,{innerWidth:1200,innerHeight:900,scrollX:0,scrollY:0,AbortController:Controller,getComputedStyle:element=>({position:element.style.position||'absolute',display:element.style.display,visibility:element.style.visibility,opacity:element.style.opacity}),localStorage:{getItem:key=>stored.get(key)??null,setItem:(key,value)=>{stored.set(key,String(value));writes.push(key);},removeItem:key=>stored.delete(key)}});
  const doc={defaultView:view,documentElement:{lang},createElement:tag=>new Element(tag)};
  class Element extends EventTarget{
    constructor(tag='div',rect={left:0,top:0,width:0,height:0}){
      super();this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.rect=rect;this.children=[];this.attrs={};this.dataset={};this.hidden=false;this.style={display:'',touchAction:'',cursor:'',setProperty(name,value){this[name]=String(value);}};this.captures=new Set();this.className='';
      this.classList={contains:name=>this.className.split(' ').includes(name),add:(...names)=>{this.className=[...new Set(this.className.split(' ').filter(Boolean).concat(names))].join(' ');},remove:(...names)=>{this.className=this.className.split(' ').filter(name=>!names.includes(name)).join(' ');}};
    }
    get tabIndex(){return this.attrs.tabindex===undefined?-1:Number(this.attrs.tabindex);}
    set tabIndex(value){this.setAttribute('tabindex',value);}
    setAttribute(name,value){this.attrs[name]=String(value);}
    getAttribute(name){return this.attrs[name]??null;}
    removeAttribute(name){delete this.attrs[name];}
    contains(node){return node===this||this.children.some(child=>child.contains(node));}
    append(...children){for(const child of children){child.parentNode=this;this.children.push(child);}}
    prepend(...children){for(const child of children)child.parentNode=this;this.children.unshift(...children);}
    replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];this.append(...children);}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null;}
    getBoundingClientRect(){
      const rect={...this.rect};if(parseFloat(this.style.width)>0)rect.width=parseFloat(this.style.width);if(parseFloat(this.style.height)>0)rect.height=parseFloat(this.style.height);
      if(this.classList.contains('xp-window-moved')){
        const parent=this.offsetParent?.getBoundingClientRect(),fixed=this.style.position==='fixed';
        rect.left=parseFloat(this.style['--xp-window-left'])+(fixed?0:parent?(parent.left+(this.offsetParent.clientLeft||0)-(this.offsetParent.scrollLeft||0)):-view.scrollX);
        rect.top=parseFloat(this.style['--xp-window-top'])+(fixed?0:parent?(parent.top+(this.offsetParent.clientTop||0)-(this.offsetParent.scrollTop||0)):-view.scrollY);
      }
      return {...rect,right:rect.left+rect.width,bottom:rect.top+rect.height};
    }
    getClientRects(){return this.hidden?[]:[this.getBoundingClientRect()];}
    closest(){return ['BUTTON','A','INPUT','TEXTAREA','SELECT','SUMMARY'].includes(this.tagName)?this:null;}
    setPointerCapture(id){this.captures.add(id);}
    hasPointerCapture(id){return this.captures.has(id);}
    releasePointerCapture(id){this.captures.delete(id);}
    click(){const event=new Event('click',{cancelable:true});this.dispatchEvent(event);this.onclick?.(event);}
  }
  doc.body=new Element('body');
  const bounds=new Element('main',parentRect),panel=new Element('aside',{left,top,width,height}),handle=new Element('header');panel.offsetParent=bounds;panel.append(handle);
  function send(element,type,properties={}){const event=new Event(type,{cancelable:true});for(const [name,value] of Object.entries(properties))Object.defineProperty(event,name,{value});element.dispatchEvent(event);return event;}
  const pointer=(type,x,y,id=1)=>send(handle,type,{button:0,pointerId:id,isPrimary:true,clientX:x,clientY:y});
  return {view,doc,panel,handle,bounds,stored,writes,send,pointer,Element};
}

test('bounds use the visible Xpacio rectangle and preserve an absolute containing block origin',()=>{
  assert.deepEqual(boundedRectPosition(-500,999,300,200,{left:100,top:48,width:800,height:650}),{x:108,y:490});
  const h=harness();h.bounds.clientLeft=2;h.bounds.clientTop=4;h.bounds.scrollLeft=5;h.bounds.scrollTop=7;
  assert.deepEqual(localWindowPosition(h.panel,250,200),{x:153,y:155,position:'absolute'});
  const api=movableWindow(h.panel,h.handle,{bounds:h.bounds,key:'position'});
  h.pointer('pointerdown',650,110);h.pointer('pointermove',300,210);h.pointer('pointerup',300,210);
  assert.equal(h.panel.getBoundingClientRect().left,250);assert.equal(h.panel.getBoundingClientRect().top,200);
  assert.equal(h.panel.style['--xp-window-left'],'153px');assert.deepEqual(JSON.parse(h.stored.get('position')),{x:250,y:200});
  h.pointer('pointerdown',300,210);h.pointer('pointermove',0,0);h.pointer('pointerup',0,0);
  assert.equal(h.panel.getBoundingClientRect().left,108);assert.equal(h.panel.getBoundingClientRect().top,56);api.dispose();
});

test('fixed windows remain viewport anchored; keyboard bounds and resize leave the header reachable',()=>{
  const h=harness({left:870,top:520});h.panel.style.position='fixed';
  const api=movableWindow(h.panel,h.handle,{bounds:h.bounds,key:'fixed'});
  const key=h.send(h.handle,'keydown',{key:'ArrowRight'});assert.equal(key.defaultPrevented,true);
  assert.equal(h.panel.getBoundingClientRect().left,692);assert.equal(h.panel.style.position,'fixed');
  h.send(h.handle,'keydown',{key:'ArrowLeft',shiftKey:true});assert.equal(h.panel.getBoundingClientRect().left,687);
  h.view.innerWidth=500;h.view.innerHeight=250;h.view.dispatchEvent(new Event('resize'));
  assert.equal(h.panel.getBoundingClientRect().left,192);assert.equal(h.panel.getBoundingClientRect().top,62);
  api.dispose();
});

test('pointer cancellation and lost capture end one drag; disposal removes drag, keyboard and resize listeners',()=>{
  const h=harness(),api=movableWindow(h.panel,h.handle,{bounds:h.bounds,key:'own-position'});
  h.pointer('pointerdown',650,110);h.pointer('pointermove',500,210);h.pointer('pointercancel',500,210);
  const cancelled={...h.panel.getBoundingClientRect()};h.pointer('pointermove',200,200);assert.deepEqual(h.panel.getBoundingClientRect(),cancelled);
  h.pointer('pointerdown',400,210,2);h.pointer('pointermove',450,220,3);assert.deepEqual(h.panel.getBoundingClientRect(),cancelled);
  h.pointer('lostpointercapture',400,210,2);assert.equal(h.writes.length,2);
  h.pointer('pointerdown',400,210,4);api.dispose();const before={...h.panel.getBoundingClientRect()},writeCount=h.writes.length;
  h.pointer('pointermove',300,100,4);h.send(h.handle,'keydown',{key:'ArrowDown'});h.view.innerWidth=200;h.view.dispatchEvent(new Event('resize'));
  assert.deepEqual(h.panel.getBoundingClientRect(),before);assert.equal(h.writes.length,writeCount);assert.equal(h.handle.hasPointerCapture(4),false);
  assert.equal(h.handle.getAttribute('tabindex'),null);assert.equal(h.handle.getAttribute('title'),null);assert.equal(api.restore(),false);
});

test('restore validates coordinates, tolerates blocked storage and does not overwrite unrelated history or geometry',()=>{
  const h=harness(),key='xp-panel-own';h.stored.set('xtanco_panels_geom_v1','{"panel":{"l":11,"t":22,"w":333,"h":444}}');h.stored.set('cli-history','keep');
  const api=movableWindow(h.panel,h.handle,{key,bounds:h.bounds});
  for(const invalid of ['broken','{"x":"12","y":30}','{"x":null,"y":30}','[12,30]']){h.stored.set(key,invalid);assert.equal(api.restore(),false);}
  h.stored.set(key,'{"x":-1000,"y":2000}');assert.equal(api.restore(),true);assert.equal(h.panel.getBoundingClientRect().left,108);assert.equal(h.panel.getBoundingClientRect().top,510);
  h.send(h.handle,'keydown',{key:'ArrowRight'});assert.equal(h.stored.get('cli-history'),'keep');assert.equal(h.stored.get('xtanco_panels_geom_v1'),'{"panel":{"l":11,"t":22,"w":333,"h":444}}');assert.deepEqual(h.writes,[key]);api.dispose();
  const blocked=movableWindow(h.panel,h.handle,{key,bounds:h.bounds,storage:{getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}}});assert.doesNotThrow(()=>blocked.restore());assert.doesNotThrow(()=>h.send(h.handle,'keydown',{key:'ArrowDown'}));blocked.dispose();
});

test('controls inside a header and modified shortcuts do not start a panel drag',()=>{
  const h=harness(),api=movableWindow(h.panel,h.handle,{bounds:h.bounds});
  const control=new h.Element('button'),input=new h.Element('input');h.handle.append(control,input);
  for(const target of [control,input]){
    const event=new Event('pointerdown',{cancelable:true});Object.defineProperties(event,{button:{value:0},pointerId:{value:1},clientX:{value:650},clientY:{value:110},target:{value:target}});h.handle.dispatchEvent(event);h.pointer('pointermove',300,200);
    assert.equal(h.panel.classList.contains('xp-window-moved'),false);
  }
  assert.equal(h.send(h.handle,'keydown',{key:'ArrowRight',ctrlKey:true}).defaultPrevented,false);api.dispose();
});

test('changing the Xpacio bounds clamps a moved tool and disposing releases the size observer',()=>{
  const h=harness();let observer;
  h.view.ResizeObserver=class{
    constructor(callback){this.callback=callback;this.observed=[];this.disconnected=false;observer=this;}
    observe(element){this.observed.push(element);}
    disconnect(){this.disconnected=true;}
  };
  const api=movableWindow(h.panel,h.handle,{bounds:()=>h.bounds});
  assert.deepEqual(observer.observed,[h.panel,h.bounds]);api.move(600,500);
  h.bounds.rect={left:100,top:48,width:400,height:350};observer.callback();
  assert.equal(h.panel.getBoundingClientRect().left,192);assert.equal(h.panel.getBoundingClientRect().top,210);
  assert.equal(h.panel.style['--xp-window-max-width'],'384px');assert.equal(h.panel.style['--xp-window-max-height'],'334px');
  api.dispose();assert.equal(observer.disconnected,true);const before={...h.panel.getBoundingClientRect()};h.bounds.rect.width=200;observer.callback();assert.deepEqual(h.panel.getBoundingClientRect(),before);
});

test('visible sidebars and bottom docks reduce the scene bounds so the whole tool and X remain uncovered',()=>{
  const h=harness(),left=new h.Element('nav',{left:0,top:0,width:180,height:900}),right=new h.Element('nav',{left:900,top:0,width:300,height:900}),dock=new h.Element('section',{left:0,top:650,width:1200,height:250});
  left.id='xpace-side-left';right.id='xpace-side-right';dock.id='telegramDock';h.doc.querySelectorAll=()=>[left,right,dock];
  const api=movableWindow(h.panel,h.handle,{bounds:h.bounds});api.move(1100,850);
  const rect=h.panel.getBoundingClientRect();assert.equal(rect.left,592);assert.equal(rect.top,462);assert.equal(rect.right,892);assert.equal(rect.bottom,642);
  assert.equal(h.panel.style['--xp-window-max-width'],'704px');assert.equal(h.panel.style['--xp-window-max-height'],'586px');api.dispose();
});

test('closed, hidden and transparent shell panels cannot shrink the available Xpacio; a tool ignores its own enclosing dock',()=>{
  const h=harness(),right=new h.Element('nav',{left:1200,top:0,width:280,height:900});right.classList.add('quad-right');h.doc.querySelectorAll=()=>[right];
  const api=movableWindow(h.panel,h.handle,{bounds:h.bounds});api.move(690,100);assert.equal(h.panel.getBoundingClientRect().left,690);
  right.rect.left=850;
  for(const [property,value]of [['display','none'],['visibility','hidden'],['visibility','collapse'],['opacity','0']]){right.style[property]=value;api.move(690,100);assert.equal(h.panel.getBoundingClientRect().left,690);delete right.style[property];}
  right.hidden=true;api.move(690,100);assert.equal(h.panel.getBoundingClientRect().left,690);right.hidden=false;
  right.contains=panel=>panel===h.panel;api.move(690,100);assert.equal(h.panel.getBoundingClientRect().left,690);right.contains=()=>false;
  api.move(690,100);assert.equal(h.panel.getBoundingClientRect().left,542);api.dispose();
});

test('opening a sidebar reclamps after its transform transition and disposal cancels observers and scheduled work',()=>{
  const h=harness(),right=new h.Element('nav',{left:1200,top:0,width:280,height:900});right.id='xpace-side-right';h.doc.body=new h.Element('body');h.doc.querySelectorAll=()=>[right];
  const frames=new Map();let sequence=0,mutations;
  h.view.requestAnimationFrame=callback=>{const id=++sequence;frames.set(id,callback);return id;};h.view.cancelAnimationFrame=id=>frames.delete(id);
  h.view.MutationObserver=class{constructor(callback){this.callback=callback;this.observed=[];this.disconnected=false;mutations=this;}observe(element,options){this.observed.push({element,options});}disconnect(){this.disconnected=true;}};
  const frame=()=>{const [id,callback]=frames.entries().next().value;frames.delete(id);callback();};
  const api=movableWindow(h.panel,h.handle,{bounds:h.bounds,key:'retained'});api.move(650,100);h.stored.set('retained','{"x":650,"y":100}');
  assert.deepEqual(mutations.observed.map(value=>value.element),[h.doc.body,right]);assert.equal(mutations.observed[0].options.subtree,undefined);
  mutations.callback();assert.equal(frames.size,1);frame();assert.equal(h.panel.getBoundingClientRect().left,650);
  right.rect.left=850;right.dispatchEvent(new Event('transitionend'));assert.equal(frames.size,1);frame();assert.equal(h.panel.getBoundingClientRect().left,542);assert.equal(h.stored.get('retained'),'{"x":650,"y":100}');
  mutations.callback();assert.equal(frames.size,1);api.dispose();assert.equal(frames.size,0);assert.equal(mutations.disconnected,true);
  const observedCount=mutations.observed.length;h.doc.querySelectorAll=()=>[right,new h.Element('nav')];mutations.callback();right.dispatchEvent(new Event('transitionend'));assert.equal(frames.size,0);assert.equal(mutations.observed.length,observedCount);
});

test('generated controls call the tool lifecycle for close and reopen without replacing content',()=>{
  const h=harness({lang:'en'});let closes=0,opens=0;const oldContent=[...h.panel.children];
  const api=attachFloatingPanel(h.panel,{label:'Shelf products',bounds:h.bounds,onClose(){closes++;h.panel.hidden=true;},onOpen(){opens++;h.panel.hidden=false;}});
  assert.deepEqual(h.panel.children.slice(1),oldContent);assert.equal(api.closeButton.getAttribute('aria-label'),'Close Shelf products');
  api.closeButton.click();assert.equal(closes,1);assert.equal(h.panel.hidden,true);api.open();assert.equal(opens,1);assert.equal(h.panel.hidden,false);
  api.dispose();assert.deepEqual(h.panel.children,oldContent);api.open();api.close();assert.equal(opens,1);assert.equal(closes,1);
});

test('generated header gestures and its X cannot leak into legacy scene click or drag handlers',()=>{
  const h=harness();let closes=0;const api=attachFloatingPanel(h.panel,{label:'Chip',onClose(){closes++;}});
  assert.equal(h.send(api.handle,'click').cancelBubble,true);assert.equal(h.send(api.handle,'mousedown',{button:0}).cancelBubble,true);
  const close=h.send(api.closeButton,'click');assert.equal(close.cancelBubble,true);assert.equal(closes,1);
  api.dispose();assert.equal(h.send(api.handle,'click').cancelBubble,false);
});

test('an authored X moved into a generated header reaches delegated panel close handlers but never the scene',()=>{
  const h=harness(),scene=new h.Element('main'),close=new h.Element('button'),icon=new h.Element('span');
  scene.append(h.panel);h.handle.append(close);close.append(icon);
  let nativeCloses=0,panelListeners=0,sceneClicks=0;
  h.panel.addEventListener('click',event=>{if(event.target===close||close.contains(event.target)){nativeCloses++;h.panel.hidden=true;}});
  scene.addEventListener('click',()=>{sceneClicks++;});
  const api=attachFloatingPanel(h.panel,{label:'Calendar',closeButton:close,bounds:h.bounds});
  close.remove();api.handle.append(close);
  // A listener added after the shared isolation listener must still run on the
  // same owner; stopPropagation must not become stopImmediatePropagation.
  h.panel.addEventListener('click',()=>{panelListeners++;});
  function bubble(target){
    const event=new Event('click',{bubbles:true,cancelable:true});Object.defineProperty(event,'target',{value:target});
    for(let node=target;node;node=node.parentNode){node.dispatchEvent(event);node.onclick?.(event);if(event.cancelBubble)break;}
    return event;
  }
  close.click=()=>bubble(close);
  bubble(icon);assert.equal(nativeCloses,1);assert.equal(panelListeners,1);assert.equal(sceneClicks,0);assert.equal(h.panel.hidden,true);
  api.open();assert.equal(h.panel.hidden,false);api.close();assert.equal(nativeCloses,2);assert.equal(panelListeners,2);assert.equal(sceneClicks,0);
  assert.equal(h.send(api.handle,'click').cancelBubble,true);assert.equal(h.send(api.handle,'mousedown').cancelBubble,true);
  // The adapter returns a borrowed X to its authored parent before disposing
  // the generated header; preserve that same ownership order in the fixture.
  close.remove();h.handle.append(close);api.dispose();h.panel.hidden=false;bubble(icon);
  assert.equal(nativeCloses,3);assert.equal(panelListeners,3);assert.equal(sceneClicks,1,'dispose releases only shared isolation listeners');
});

test('existing close controls keep their original handler, while the fallback panel hides and reopens',()=>{
  const h=harness(),button=new h.Element('button');h.handle.append(button);let existing=0;button.onclick=()=>{existing++;h.panel.hidden=true;};
  const api=attachFloatingPanel(h.panel,{label:'Detail',handle:h.handle,closeButton:button,bounds:h.bounds});
  api.close();assert.equal(existing,1);assert.equal(h.panel.hidden,true);api.open();assert.equal(h.panel.hidden,false);assert.equal(h.handle.children.length,1);api.dispose();
  const fallback=attachFloatingPanel(h.panel,{label:'Status',bounds:h.bounds});fallback.closeButton.click();assert.equal(h.panel.hidden,true);fallback.open();assert.equal(h.panel.hidden,false);fallback.dispose();
});

test('the optional Windows menu uses registered feature openers and removes disposed tools',()=>{
  const h=harness(),container=new h.Element(),menu=mountFloatingPanelMenu(container);let opens=0;
  assert.equal(container.children[0].hidden,true);
  const unregister=registerFloatingPanel('floating-test-only',{label:'Matrix',open(){opens++;}});
  const section=container.children[0],list=section.children[1];assert.equal(section.hidden,false);assert.equal(list.children[0].textContent,'Matrix');list.children[0].click();assert.equal(opens,1);
  const stale=list.children[0];unregister();assert.equal(section.hidden,true);stale.click();assert.equal(opens,1);menu.dispose();assert.equal(container.children.length,0);
});

test('quadratic edges shrink downward/rightward and respect narrow viewport limits',()=>{
 assert.deepEqual(resizedPanel({width:280,height:302},0,120,{axis:'height',direction:-1}),{width:280,height:182});
 assert.deepEqual(resizedPanel({width:280,height:302},80,0,{axis:'width',direction:-1}),{width:200,height:302});
 assert.deepEqual(resizedPanel({width:280,height:302},-1000,1000,{maxWidth:120,maxHeight:110}),{width:120,height:110});
});
test('resizing persists independently, clamps to bounds, resets and disposes without consuming CLI shortcuts',()=>{
 const h=harness(),resize=attachPanelResize(h.panel,{label:'Test',key:'window:size',limits:()=>({maxWidth:400,maxHeight:300})});
 h.stored.set('cli-history','keep');h.stored.set('window:position','keep');
 h.send(resize.handle,'pointerdown',{button:0,pointerId:1,clientX:900,clientY:280});
 h.send(resize.handle,'pointermove',{pointerId:2,clientX:9999,clientY:9999});
 assert.equal(h.panel.getBoundingClientRect().width,300);
 h.send(resize.handle,'pointermove',{pointerId:1,clientX:9999,clientY:9999});
 h.send(resize.handle,'pointerup',{pointerId:1});
 assert.deepEqual(JSON.parse(h.stored.get('window:size')),{width:400,height:300});
 h.send(resize.handle,'keydown',{key:'ArrowLeft',shiftKey:true});
 assert.equal(h.panel.getBoundingClientRect().width,395);
 assert.equal(h.send(resize.handle,'keydown',{key:'ArrowRight',ctrlKey:true}).defaultPrevented,false);assert.equal(h.panel.getBoundingClientRect().width,395);
 assert.equal(h.stored.get('cli-history'),'keep');assert.equal(h.stored.get('window:position'),'keep');
 h.send(resize.handle,'keydown',{key:'Home'});
 assert.equal(h.stored.has('window:size'),false);assert.equal(h.panel.getBoundingClientRect().width,300);
 h.panel.hidden=true;resize.sync();assert.equal(resize.handle.hidden,true);
 resize.dispose();h.send(resize.handle,'keydown',{key:'ArrowRight'});
 assert.equal(h.panel.getBoundingClientRect().width,300);assert.equal(resize.handle.parentNode,null);
});
