import test from 'node:test';
import assert from 'node:assert/strict';
import {mountWallAvatar,STARBUCKS_KIOSK_URL} from './matrix-wall-avatar.mjs';
function harness(){
 class Node{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.style={};this.classList={add(){},remove(){}};}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];if(k==='allow')delete this.allow;}append(...ns){this.children.push(...ns);}addEventListener(k,f){(this.events[k]??=[]).push(f);}emit(k,e={}){for(const f of this.events[k]||[])f(e);}show(){this.open=true;}showModal(){this.open=true;}close(){this.open=false;}focus(){}remove(){}}
 const events={},storage=new Map();let poll,released=0,posts=[];
 const win={location:{origin:'https://example.test'},document:{documentElement:{lang:'es'}},sessionStorage:{getItem:k=>storage.get(k)||null},localStorage:{getItem:()=>null},setInterval:f=>(poll=f,1),clearInterval(){},setTimeout(){},addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];},XpaceMatrixOptions:{suppressMusic:()=>()=>released++}};
 const doc={defaultView:win,createElement:t=>{const n=new Node(t);if(t==='iframe')n.contentWindow={postMessage:(...p)=>posts.push(p)};return n;},querySelectorAll:()=>[]};
 const surface=new Node('surface');surface.ownerDocument=doc;
 const api=mountWallAvatar(surface),wall=surface.children[0],[toolbar,frame,expand]=wall.children,[kiosk,talk,close]=toolbar.children;
 return {api,wall,frame,expand,kiosk,talk,close,storage,poll:()=>poll(),message:e=>events.message?.(e),released:()=>released,posts};
}
test('default kiosk does not load an avatar or request speech permissions, including during tier polling',()=>{
 const h=harness();assert.equal(h.frame.src,STARBUCKS_KIOSK_URL);assert.equal(h.wall.dataset.mode,'kiosk');assert.equal(h.frame.allow,undefined);
 h.storage.set('admira-avatar:nivel-elegido','better');h.poll();assert.equal(h.frame.src,STARBUCKS_KIOSK_URL);assert.equal(h.api.level,'better');assert.equal(h.posts.length,0);
});
test('screen opens kiosk; explicit Talk retains selected avatar; switching back stops that renderer',()=>{
 const h=harness();h.expand.emit('click');assert.equal(h.api.expanded,true);assert.equal(h.frame.inert,false);assert.equal(h.frame.src,STARBUCKS_KIOSK_URL);
 h.talk.emit('click');assert.match(h.frame.src,/metahuman.html/);assert.equal(h.frame.allow,'microphone; autoplay');
 h.storage.set('admira-avatar:nivel-elegido','good');h.poll();assert.match(h.frame.src,/better.html/);
 h.kiosk.emit('click');assert.equal(h.frame.src,STARBUCKS_KIOSK_URL);assert.equal(h.frame.allow,undefined);
 h.close.emit('click');assert.equal(h.api.expanded,false);assert.equal(h.frame.inert,true);assert.equal(h.released(),1);
});
test('Escape accepts only the expanded local kiosk iframe; close restores its home instead of conversation',()=>{
 const h=harness();h.expand.emit('click');const e={origin:'https://example.test',source:h.frame.contentWindow,data:{type:'starbucks-kiosk:close'}};
 h.message({...e,origin:'https://evil.test'});assert.equal(h.api.expanded,true);
 h.message({...e,source:{}});assert.equal(h.api.expanded,true);
 h.talk.emit('click');h.message(e);assert.equal(h.api.expanded,true);
 h.kiosk.emit('click');h.message(e);assert.equal(h.api.expanded,false);assert.equal(h.frame.src,STARBUCKS_KIOSK_URL);
});
