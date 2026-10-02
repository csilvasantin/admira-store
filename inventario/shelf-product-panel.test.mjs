import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {setMaxListeners} from 'node:events';
import {BINDINGS_KEY,PREVIEW_CHANNEL,loadBindings,saveBinding,removeBinding,sendPreview} from './product-bindings.mjs';

// Exercise the shipped panel and picker against the same small DOM/EventTarget
// style used elsewhere in this repository. No DOM package or network is used.
const panelSource=(await readFile(new URL('./shelf-product-panel.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const pickerSource=(await readFile(new URL('../admira-xp/scripts/pixeria-picker.mjs',import.meta.url),'utf8')).replace(/^export /gm,'');
const product=(id='product-0-0',ref='A02-01')=>({id,numeric_id:1,kind:'product',product_reference:ref,product_name:'CAFÉ',shelf_index:0,slot_index:0,label:{es:'Café · balda 1',en:'Coffee · shelf 1'}});

function harness({autoAck=false}={}){
 class Element extends EventTarget{
  constructor(tag){super();this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.dataset={};this.attrs={};this.hidden=false;this.value='';this._text='';}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
  append(...children){for(const child of children){child.parentNode=this;this.children.push(child);if(this.tagName==='SELECT'&&this.children.length===1&&child.tagName==='OPTION')this.value=child.value;}}
  replaceChildren(...children){this._text='';this.children=[];this.append(...children);}
  setAttribute(name,value){this.attrs[name]=String(value);}
  getAttribute(name){return this.attrs[name]??null;}
  get isConnected(){return this.root===true||!!this.parentNode?.isConnected;}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(child=>child!==this);this.parentNode=null;}
 }
 class Option extends Element{constructor(text,value){super('option');this.textContent=text;this.value=value;}}
 class Controller extends AbortController{constructor(){super();setMaxListeners(0,this.signal);}}
 const host=new Element('div');host.root=true;
 const document={documentElement:{lang:'es'},createElement:tag=>new Element(tag)},window=new EventTarget(),stored=new Map(),commands=[],selected=[];let closed=0;
 const storage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,String(value))};
 window.addEventListener(PREVIEW_CHANNEL,event=>{commands.push(event.detail);if(autoAck)window.dispatchEvent(new CustomEvent(PREVIEW_CHANNEL+':status',{detail:{requestId:event.detail.id,phase:event.detail.action==='stop'?'stopped':'ready'}}));});
 const context=vm.createContext({document,window,location:{origin:'https://www.xpaceos.com'},Option,URL,URLSearchParams,AbortController:Controller,AbortSignal,crypto,CustomEvent,BINDINGS_KEY,PREVIEW_CHANNEL,
  loadBindings:()=>loadBindings(storage),saveBinding:(ref,input)=>saveBinding(ref,input,storage),removeBinding:ref=>removeBinding(ref,storage),sendPreview:(action,part,input,options={})=>sendPreview(action,part,input,{target:window,storage,...options}),fetch(){throw Error('Unexpected network request');}});
 vm.runInContext(pickerSource+'\n'+panelSource+'\nglobalThis.mount=mountShelfProductPanel;',context);
 const first=product(),second=product('product-0-1','A02-02'),api=context.mount(host,{parts:[first,second]},{autoOpen:true,onSelect:part=>selected.push(part),onClose:()=>closed++});
 const descendants=element=>[element,...element.children.flatMap(descendants)],find=predicate=>descendants(host).find(predicate);
 const ui={toggle:host.children[0],panel:host.children[1],picker:find(el=>el.attrs['aria-label']==='Componente de la estantería'),name:find(el=>el.tagName==='H3'),url:find(el=>el.tagName==='INPUT'&&el.type==='url'),message:find(el=>el.className==='shelf-product-status'),button:text=>find(el=>el.tagName==='BUTTON'&&el.textContent===text)};
 ui.content=ui.url.parentNode.parentNode;
 return {host,window,storage,commands,selected,first,second,api,ui,closed:()=>closed,emitStatus:(requestId,phase,extra={})=>window.dispatchEvent(new CustomEvent(PREVIEW_CHANNEL+':status',{detail:{requestId,phase,...extra}}))};
}

test('select(null) clears the product record, highlight and preview while keeping component selection available',()=>{
 const h=harness();h.api.select(h.first,{automatic:false});assert.equal(h.ui.content.hidden,false);assert.match(h.ui.name.textContent,/Café/);
 h.api.select(null);assert.equal(h.api.enabled(),true);assert.equal(h.ui.picker.value,'');assert.equal(h.ui.name.textContent,'');assert.equal(h.ui.content.hidden,true);assert.equal(h.selected.at(-1),null);assert.equal(h.commands.at(-1).action,'stop');
 assert.match(h.ui.message.textContent,/Solicitud de detención/);assert.doesNotMatch(h.ui.message.textContent,/programación restaurada/);h.api.dispose();
});

test('close and reopen preserve no stale product card and the dropdown blank option clears selection',()=>{
 const h=harness();h.api.select(h.first,{automatic:false});h.ui.toggle.dispatchEvent(new Event('click'));
 assert.equal(h.api.enabled(),false);assert.equal(h.ui.panel.hidden,true);assert.equal(h.closed(),1);assert.equal(h.ui.name.textContent,'');assert.equal(h.ui.content.hidden,true);
 h.api.open();assert.equal(h.ui.panel.hidden,false);assert.equal(h.ui.picker.value,'');assert.equal(h.ui.content.hidden,true);h.api.select(h.second,{automatic:false});h.ui.picker.value='';h.ui.picker.dispatchEvent(new Event('change'));assert.equal(h.selected.at(-1),null);assert.equal(h.ui.content.hidden,true);h.api.dispose();
});

test('synchronous ready and stopped acknowledgements are retained and showing requires the matching request',()=>{
 const h=harness({autoAck:true});saveBinding('A02-01',{kind:'image',url:'https://media.example/cafe.png',title:'Café'},h.storage);
 h.api.select(h.first);const previewId=h.commands.at(-1).id;assert.match(h.ui.message.textContent,/Contenido preparado/);assert.doesNotMatch(h.ui.message.textContent,/está mostrando/);
 h.emitStatus('unrelated','showing');assert.match(h.ui.message.textContent,/Contenido preparado/);h.emitStatus(previewId,'showing');assert.match(h.ui.message.textContent,/está mostrando/);
 h.ui.button('Detener contenido').dispatchEvent(new Event('click'));assert.equal(h.commands.at(-1).action,'stop');assert.match(h.ui.message.textContent,/programación restaurada/);h.emitStatus(previewId,'error',{error:'Late load failure'});assert.doesNotMatch(h.ui.message.textContent,/Late/);h.api.dispose();
});

test('disposal removes UI/status listeners and late acknowledgements cannot update the removed panel',()=>{
 const h=harness();h.api.select(h.first,{automatic:false});h.api.dispose();const lastId=h.commands.at(-1).id,text=h.ui.message.textContent,count=h.commands.length;
 assert.equal(h.host.children.length,0);assert.equal(h.selected.at(-1),null);h.emitStatus(lastId,'showing');h.ui.toggle.dispatchEvent(new Event('click'));assert.equal(h.ui.message.textContent,text);assert.equal(h.commands.length,count);
});

test('fresh state from another selection reports the shared screen without attributing it to the local product form',()=>{
 const h=harness();h.api.select(h.first,{automatic:false});h.ui.url.value='https://media.example/local-form.png';
 const foreign={schema_version:1,context:'xtanco',createdAt:Date.now(),title:'Vídeo del catálogo'};
 h.emitStatus('other-panel-preview','showing',foreign);
 assert.match(h.ui.message.textContent,/ds1 muestra contenido desde otra selección: Vídeo del catálogo/);assert.doesNotMatch(h.ui.message.textContent,/está mostrando este contenido/);
 assert.equal(h.ui.name.textContent,'Café · balda 1');assert.equal(h.ui.picker.value,h.first.id);assert.equal(h.ui.url.value,'https://media.example/local-form.png');
 const showing=h.ui.message.textContent;
 for(const invalid of [{schema_version:2},{context:'matrix'},{createdAt:Date.now()-31000},{createdAt:Date.now()+60000},{createdAt:'now'},{requestId:''},{schema_version:undefined}]){
  h.emitStatus('other-panel-invalid','stopped',{...foreign,...invalid});assert.equal(h.ui.message.textContent,showing);
 }
 h.emitStatus('other-panel-ready','ready',foreign);assert.equal(h.ui.message.textContent,showing);
 h.emitStatus('other-panel-stop','stopped',{...foreign,createdAt:Date.now()});assert.match(h.ui.message.textContent,/detenido desde otra selección; programación restaurada/);
 h.ui.toggle.dispatchEvent(new Event('click'));const closed=h.ui.message.textContent;h.emitStatus('other-while-closed','showing',{...foreign,createdAt:Date.now()});assert.equal(h.ui.message.textContent,closed);h.api.dispose();
});
