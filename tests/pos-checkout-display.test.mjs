import test from 'node:test';
import assert from 'node:assert/strict';
import {createPOSCheckoutDisplay} from '../admira-xp/scripts/pos-checkout-display.mjs';
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.listeners={};this.attrs={};}
 append(...nodes){for(const n of nodes){n.remove();n.parentNode=this;this.children.push(n);}}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(n=>n!==this);this.parentNode=null;}}
 replaceChildren(...nodes){for(const n of [...this.children])n.remove();this.append(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){this.listeners[k]=fn;}
}
test('mapped purchase preserves media, restores basket on new host, and releases display when empty/off',()=>{
 const doc={documentElement:{lang:'es'},createElement:tag=>new Node(tag)};
 let target=new Node('display'),edits=0,coffees=0;const video=new Node('video');target.append(video);
 const display=createPOSCheckoutDisplay({document:doc,host:()=>target,onEdit:()=>edits++,onCoffee:()=>coffees++});
 display.update({version:1,lines:[{id:'muffin',quantity:7}]});const panel=target.children[1];assert.equal(target.children[0],video);assert.equal(panel.children[0].textContent,'Tu compra');assert.equal(panel.children[2].children[0].children[0].textContent,'7 ×');assert.equal(panel.children[3].hidden,false);
 display.update({version:1,lines:[{id:'muffin',quantity:7}]},{offerDismissed:true});assert.equal(panel.children[3].hidden,true);
 const event={stopPropagation(){}};panel.children[3].listeners.click(event);panel.children[4].listeners.click(event);assert.equal(coffees,1);assert.equal(edits,1);
 doc.documentElement.lang='en';display.update({version:1,lines:[{id:'coffee',quantity:1}]});assert.equal(panel.children[0].textContent,'Your purchase');assert.equal(panel.children[2].children[0].children[1].textContent,'Coffee');assert.equal(panel.children[3].hidden,true);
 target=new Node('replacement');display.sync();assert.equal(panel.parentNode,target);target=null;display.sync();assert.equal(panel.parentNode,null);
 target=new Node('display');display.sync();assert.equal(panel.parentNode,target);display.sync(true);assert.equal(panel.parentNode,null);display.update({version:1,lines:[{id:'muffin',quantity:1}]});assert.equal(panel.parentNode,null);display.sync(false);assert.equal(panel.parentNode,target);display.update({version:1,lines:[]});assert.equal(target.children.length,0);display.dispose();
});
