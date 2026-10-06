import test from 'node:test';
import assert from 'node:assert/strict';
import {mountWallAvatar,STARBUCKS_KIOSK_URL,AVATAR_WALL_LANGUAGE_KEY} from './matrix-wall-avatar.mjs';
function harness(){
 class Node{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.style={};this.classList={add(){},remove(){}};}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];if(k==='allow')delete this.allow;}append(...ns){this.children.push(...ns);}addEventListener(k,f){(this.events[k]??=[]).push(f);}emit(k,e={}){for(const f of this.events[k]||[])f(e);}show(){this.open=true;}showModal(){this.open=true;}close(){this.open=false;}focus(){}remove(){}}
 const events={},storage=new Map();let poll,released=0,posts=[];
 const win={location:{origin:'https://example.test'},document:{documentElement:{lang:'es'}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},localStorage:{getItem:()=>null},setInterval:f=>(poll=f,1),clearInterval(){},setTimeout(){},addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];},XpaceMatrixOptions:{suppressMusic:()=>()=>released++}};
 const doc={defaultView:win,createElement:t=>{const n=new Node(t);if(t==='iframe')n.contentWindow={postMessage:(...p)=>posts.push(p)};return n;},querySelectorAll:()=>[]};
 const surface=new Node('surface');surface.ownerDocument=doc;
 const api=mountWallAvatar(surface),wall=surface.children[0],[toolbar,frame,expand]=wall.children,[close,model]=toolbar.children;
 return {api,wall,frame,expand,close,model,win,storage,poll:()=>poll(),message:e=>events.message?.(e),released:()=>released,posts};
}
test('wall shows Good Admirito without granting speech permissions',()=>{
 const h=harness();assert.match(h.frame.src,/nube.html/);assert.notEqual(h.frame.src,STARBUCKS_KIOSK_URL);assert.equal(h.wall.dataset.mode,'avatar');assert.equal(h.frame.allow,undefined);assert.equal(h.frame.inert,true);
});
test('click opens avatar directly; close unloads conversation and restores wall and music',()=>{
 const h=harness();h.expand.emit('click');assert.equal(h.api.expanded,true);assert.equal(h.frame.inert,false);assert.match(h.frame.src,/nube.html/);assert.equal(h.frame.allow,'microphone; autoplay');
 h.close.emit('click');assert.equal(h.api.expanded,false);assert.equal(h.frame.inert,true);assert.equal(h.frame.allow,undefined);assert.match(h.frame.src,/nube.html/);assert.equal(h.released(),1);
 h.api.enlarge('kiosk');assert.match(h.frame.src,/nube.html/,'legacy caller cannot reopen website');
});
test('Escape closes avatar; retired kiosk messages cannot change its lifecycle',()=>{
 const h=harness();h.expand.emit('click');h.message({origin:'https://example.test',source:h.frame.contentWindow,data:{type:'starbucks-kiosk:close'}});assert.equal(h.api.expanded,true);
 let prevented=false;h.wall.emit('cancel',{preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(h.api.expanded,false);assert.match(h.frame.src,/nube.html/);assert.equal(h.released(),1);
});

test('opening inherits site language despite legacy preference; manual choice lasts only this conversation',()=>{
 const h=harness();h.storage.set(AVATAR_WALL_LANGUAGE_KEY,'en');h.api.enlarge();assert.equal(new URL(h.frame.src).searchParams.get('lang'),'es');const src=h.frame.src;
 const event={source:h.frame.contentWindow,origin:'https://digitalavatar.ai',data:{type:'da-language-selected',lang:'en'}};
 h.message({...event,origin:'https://evil.test'});h.message({...event,source:{}});h.poll();assert.equal(h.frame.src,src);
 h.message(event);h.poll();assert.equal(h.frame.src,src,'same conversation must not reload');
 h.close.emit('click');h.api.enlarge();assert.equal(new URL(h.frame.src).searchParams.get('lang'),'es');
 h.win.document.documentElement.lang='en';h.poll();assert.ok(h.posts.some(([p])=>p.type==='da-context'&&p.lang==='en'));assert.equal(h.frame.src,src,'site language travels without remount');
 h.close.emit('click');h.api.enlarge();assert.equal(new URL(h.frame.src).searchParams.get('lang'),'en');
});
test('default Good and model selector retain explicit Better and Best independently of page quality',()=>{
 const h=harness();assert.equal(h.api.level,'good');h.api.enlarge();assert.match(h.frame.src,/nube.html/);
 h.model.value='better';h.model.emit('change');assert.equal(h.api.level,'better');assert.match(h.frame.src,/best.html/);assert.equal(h.storage.get('admira-avatar:nivel-elegido'),'better');
 h.model.value='best';h.model.emit('change');assert.equal(h.api.level,'best');assert.match(h.frame.src,/metahuman.html/);
 h.model.value='good';h.model.emit('change');assert.match(h.frame.src,/nube.html/);
});
