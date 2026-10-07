import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mountWallAvatar,wallKioskUrl,WALL_KIOSK_SIZE} from '../admira-xp/scripts/matrix-wall-avatar.mjs';
// Tótem ON/OFF en Matrix · Starbucks (7-oct-2026): ON = quiosco de pedido en el player de la pared, con toques.
function harness(on=false){
 class Node{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.style={};this.classList={add(){},remove(){}};}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];if(k==='allow')delete this.allow;}append(...ns){this.children.push(...ns);}addEventListener(k,f){(this.events[k]??=[]).push(f);}emit(k,e={}){for(const f of this.events[k]||[])f(e);}show(){this.open=true;}showModal(){this.open=true;}close(){this.open=false;}focus(){}remove(){}}
 const events={},storage=new Map();let poll,released=0,posts=[];
 const win={location:{origin:'https://example.test'},document:{documentElement:{lang:'es'}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},localStorage:{getItem:()=>null},XpaceTotem:{on:()=>on},setInterval:f=>(poll=f,1),clearInterval(){},setTimeout(){},addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];},XpaceMatrixOptions:{suppressMusic:()=>()=>released++}};
 const doc={defaultView:win,createElement:t=>{const n=new Node(t);if(t==='iframe')n.contentWindow={postMessage:(...p)=>posts.push(p)};return n;},querySelectorAll:()=>[]};
 const surface=new Node('surface');surface.ownerDocument=doc;
 const api=mountWallAvatar(surface),wall=surface.children[0],[toolbar,frame,expand]=wall.children,[close,model]=toolbar.children;
 return {api,wall,frame,expand,close,model,win,storage,poll:()=>poll(),message:e=>events.message?.(e),released:()=>released,posts};
}

test('Tótem OFF (por defecto): el player enseña el avatar digital y no recibe toques',()=>{
 const x=harness(false);assert.equal(x.wall.dataset.mode,'avatar');assert.match(x.frame.src,/nube\.html/);assert.equal(x.frame.inert,true);
});
test('Tótem ON recordado: quiosco Starbucks Paseo de Gracia con formato del player y toques',()=>{
 const x=harness(true);assert.equal(x.wall.dataset.mode,'kiosk');const u=new URL(x.frame.src);
 assert.equal(u.origin+u.pathname,'https://www.ainimation.studio/xperiencias/kiosko-pedido/');
 assert.equal(u.searchParams.get('store'),'starbucks-paseo-de-gracia');assert.equal(u.searchParams.get('formato'),'vertical');
 assert.equal(u.searchParams.get('w'),String(WALL_KIOSK_SIZE.w));assert.equal(u.searchParams.get('h'),String(WALL_KIOSK_SIZE.h));
 assert.equal(x.frame.inert,true);assert.equal(x.frame.allow,undefined);assert.match(x.expand.textContent,/Tocar el tótem/);
});
test('el interruptor cambia en vivo; 👆 abre a tamaño real y cerrar no vuelve al avatar',()=>{
 const x=harness(false);x.api.setMode('kiosk');assert.equal(x.api.mode,'kiosk');const k=x.frame.src;
 x.expand.emit('click');assert.equal(x.api.expanded,true);assert.equal(x.frame.src,k);assert.equal(x.frame.inert,false);
 x.close.emit('click');assert.equal(x.api.expanded,false);assert.equal(x.frame.src,k);assert.equal(x.frame.inert,true);
 x.api.setMode('avatar');assert.match(x.frame.src,/nube\.html/);assert.equal(x.frame.inert,true);
});
test('/totem on|off persiste y el interruptor de Experto usa /totem',()=>{
 const tk=fs.readFileSync(new URL('../admira-xp/scripts/totem-kiosko.js',import.meta.url),'utf8');
 assert.match(tk,/MODE_KEY='xpace:totem-interactivo'/);assert.match(tk,/a==='on'/);assert.match(tk,/xpace:totem-mode/);assert.doesNotMatch(tk,/pointerEvents=kioskOn/);
 const ex=fs.readFileSync(new URL('../admira-xp/scripts/expert-category-detail.js',import.meta.url),'utf8');
 assert.match(ex,/toggle\(actions,'Tótem','Totem','totem','\/totem'\)/);
 assert.equal(new URL(wallKioskUrl({lang:'en'})).searchParams.get('lang'),'en');
});
