import test from 'node:test';
import assert from 'node:assert/strict';
import {presentationShortcut,mountTwinPresentation} from './presentation-ui.mjs';

class Node extends EventTarget{
 constructor(doc,tag='div'){super();this.ownerDocument=doc;this.tagName=tag.toUpperCase();this.children=[];this.attributes=new Map();this.inert=false;this.hidden=false;this.isConnected=true;this.scrollTop=0;this.scrollLeft=0;this.classList={values:new Set(),add:value=>this.classList.values.add(value),remove:value=>this.classList.values.delete(value),contains:value=>this.classList.values.has(value)};}
 append(node){node.parentElement=this;this.children.push(node);}
 contains(node){return this===node||this.children.some(child=>child.contains(node));}
 setAttribute(name,value){this.attributes.set(name,String(value));}
 getAttribute(name){return this.attributes.get(name)??null;}
 querySelectorAll(selector){const all=[];const visit=node=>{for(const child of node.children){all.push(child);visit(child);}};visit(this);return selector==='*'?all:all.filter(node=>node.tagName==='DIALOG'&&node.open);}
 matches(selector){return selector===':modal'&&this.tagName==='DIALOG'&&this.open&&this.modal;}
 close(){if(!this.open)return;this.closes=(this.closes||0)+1;this.open=false;this.modal=false;this.ownerDocument.pendingClose.push(this);}
 showModal(){this.opens=(this.opens||0)+1;this.open=true;this.modal=true;this.scrollTop=0;this.returnValue='';this.ownerDocument.opened.push(this);}
 focus(options){this.focusOptions=options;if(!this.inert&&!this.ancestorInert())this.ownerDocument.activeElement=this;}
 ancestorInert(){for(let p=this.parentElement;p;p=p.parentElement)if(p.inert)return true;return false;}
 remove(){this.isConnected=false;if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(child=>child!==this);}
}
class Key extends Event{
 constructor(source,options={}){super('keydown',{cancelable:true});this.source=source;Object.assign(this,{key:'h',repeat:false,isComposing:false,ctrlKey:false,altKey:false,metaKey:false,keyCode:72},options);}
 get target(){return this.source;}
 composedPath(){const path=[];for(let n=this.source;n;n=n.parentElement)path.push(n);return path;}
}
class Close extends Event{
 constructor(source){super('close');this.source=source;}
 get target(){return this.source;}
}
function fixture(){
 const doc=new EventTarget(),observers=[];doc.createElement=tag=>new Node(doc,tag);doc.documentElement=new Node(doc,'html');doc.body=new Node(doc,'body');doc.documentElement.append(doc.body);doc.activeElement=doc.body;
 doc.querySelectorAll=selector=>doc.body.querySelectorAll(selector);doc.pendingClose=[];doc.opened=[];doc.flushClose=()=>{while(doc.pendingClose.length)doc.dispatchEvent(new Close(doc.pendingClose.shift()));};
 doc.defaultView={MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){this.connected=true;}disconnect(){this.connected=false;}}};
 const add=(parent,tag='div')=>{const node=new Node(doc,tag);parent.append(node);return node;};
 const bar=add(doc.body),shell=add(doc.body),collapsed=add(shell);collapsed.inert=true;
 const stage=add(doc.body,'main'),model=add(stage,'canvas'),photo=add(stage,'canvas');model.hidden=true;model.width=photo.width=1280;model.height=photo.height=720;
 const caption=add(stage,'section'),controlHost=add(caption),modal=add(doc.body,'dialog');modal.open=true;modal.modal=true;modal.returnValue='original';
 const input=add(modal,'input');input.value='campaña pendiente';
 const api=mountTwinPresentation({document:doc,canvases:[model,photo],controlHost,lang:'es'});
 return {doc,api,bar,shell,collapsed,stage,model,photo,caption,modal,input,controlHost,observers,add,button:controlHost.children[0]};
}
test('H/h and Shift+H work while typing, IME, repeat and modified shortcuts stay untouched',()=>{
 const f=fixture();assert.ok(presentationShortcut(new Key(f.photo)));assert.ok(presentationShortcut(new Key(f.photo,{key:'H',shiftKey:true})));
 for(const options of [{key:'x'},{repeat:true},{isComposing:true},{keyCode:229},{ctrlKey:true},{altKey:true},{metaKey:true}])assert.equal(presentationShortcut(new Key(f.photo,options)),false);
 for(const tag of ['input','textarea','select'])assert.equal(presentationShortcut(new Key(f.add(f.doc.body,tag))),false);
 const editable=f.add(f.doc.body);editable.setAttribute('contenteditable','true');assert.equal(presentationShortcut(new Key(f.add(editable,'span'))),false);
 const textbox=f.add(f.doc.body);textbox.setAttribute('role','textbox');assert.equal(presentationShortcut(new Key(textbox)),false);
 assert.ok(presentationShortcut(new Key(f.input),{hidden:true}));f.api.dispose();
});
test('hiding temporarily suspends native modals and restores nodes, scroll, values, focus and renderer dimensions',()=>{
 const f=fixture();let cleanup=0;f.doc.addEventListener('close',()=>cleanup++);f.doc.activeElement=f.input;f.modal.scrollTop=83;f.input.scrollLeft=14;f.api.setHidden(true);
 assert.equal(f.api.hidden,true);assert.ok(f.doc.documentElement.classList.contains('store-hud-hidden'));
 for(const node of [f.bar,f.shell,f.caption,f.modal])assert.equal(node.inert,true);
 assert.equal(f.stage.inert,false);assert.equal(f.photo.inert,false);assert.equal(f.photo.hidden,false);assert.equal(f.model.hidden,true);
 assert.equal(f.modal.open,false);assert.equal(f.modal.closes,1);assert.equal(f.doc.activeElement,f.photo);f.doc.flushClose();assert.equal(cleanup,0);
 f.api.setHidden(false);
 for(const node of [f.bar,f.shell,f.caption,f.modal])assert.equal(node.inert,false);
 assert.equal(f.collapsed.inert,true);assert.equal(f.modal.open,true);assert.equal(f.modal.modal,true);assert.equal(f.modal.opens,1);assert.equal(f.modal.returnValue,'original');assert.equal(f.modal.scrollTop,83);assert.equal(f.input.scrollLeft,14);assert.equal(f.input.value,'campaña pendiente');assert.equal(f.doc.activeElement,f.input);assert.deepEqual(f.input.focusOptions,{preventScroll:true});
 assert.deepEqual([f.photo.width,f.photo.height,f.model.width,f.model.height],[1280,720,1280,720]);f.api.dispose();
});
test('button activation can hide from an input and H restores it even if a modal retains focus',()=>{
 const f=fixture();f.doc.activeElement=f.input;f.button.dispatchEvent(new Event('pointerdown'));f.button.focus();f.button.dispatchEvent(new Event('click'));
 assert.equal(f.api.hidden,true);const ignored=new Key(f.input,{repeat:true});f.doc.dispatchEvent(ignored);assert.equal(f.api.hidden,true);assert.equal(ignored.defaultPrevented,false);
 const restore=new Key(f.input);f.doc.dispatchEvent(restore);assert.equal(restore.defaultPrevented,true);assert.equal(f.api.hidden,false);assert.equal(f.doc.activeElement,f.input);f.api.dispose();
});
test('UI mounted while hidden stays inert and dispose restores prior states and removes the shortcut',()=>{
 const f=fixture();f.api.setHidden(true);const newPanel=f.add(f.stage,'aside'),alreadyInert=f.add(f.doc.body);alreadyInert.inert=true;f.observers[0].callback();assert.equal(newPanel.inert,true);
 f.api.dispose();assert.equal(newPanel.inert,false);assert.equal(alreadyInert.inert,true);assert.equal(f.modal.open,true);assert.equal(f.api.hidden,false);assert.equal(f.button.isConnected,false);assert.equal(f.observers[0].connected,false);
 const event=new Key(f.photo);f.doc.dispatchEvent(event);assert.equal(event.defaultPrevented,false);assert.equal(f.api.hidden,false);
 f.doc.flushClose();
});
test('only suspension close events are suppressed and the prior focus dialog is reopened last',()=>{
 const f=fixture(),other=f.add(f.doc.body,'dialog'),nonmodal=f.add(f.doc.body,'dialog');other.open=other.modal=true;other.returnValue='other';nonmodal.open=true;nonmodal.modal=false;
 let cleanup=0;f.doc.addEventListener('close',()=>cleanup++);f.doc.activeElement=f.input;f.api.setHidden(true);assert.equal(nonmodal.open,true);assert.equal(nonmodal.closes,undefined);
 f.api.setHidden(false);assert.deepEqual(f.doc.opened,[other,f.modal]);assert.equal(other.returnValue,'other');assert.equal(f.doc.activeElement,f.input);
 f.modal.close();f.doc.flushClose();assert.equal(cleanup,1);assert.equal(f.modal.open,false);f.api.dispose();
});
test('a modal opened while the interface is hidden is suspended too without losing its state',()=>{
 const f=fixture();f.api.setHidden(true);const late=f.add(f.doc.body,'dialog');late.open=late.modal=true;late.returnValue='late';late.scrollTop=27;f.observers[0].callback();assert.equal(late.open,false);assert.equal(late.closes,1);
 f.api.setHidden(false);assert.equal(late.open,true);assert.equal(late.modal,true);assert.equal(late.returnValue,'late');assert.equal(late.scrollTop,27);f.doc.flushClose();f.api.dispose();
});
