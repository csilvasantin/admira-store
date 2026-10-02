import test from 'node:test';
import assert from 'node:assert/strict';
import {mountShelfProductsRuntime} from './shelf-products-runtime.mjs';
import {SHELF_PREVIEW_CHANNEL,SHELF_PREVIEW_STATUS_CHANNEL} from './shelf-screen-preview.mjs';
class ImageMedia extends EventTarget {
 constructor(){super();this.naturalWidth=0;this.naturalHeight=0;this.removed=false;}
 removeAttribute(name){if(name==='src')delete this.src;}remove(){this.removed=true;}
 ready(){this.naturalWidth=320;this.naturalHeight=180;this.dispatchEvent(new Event('load'));}
}
const input={surfaceId:'ds1',kind:'image',url:'https://media.example/tea.png',productId:'product-0-0'};
function harness(){
 const target=new EventTarget(),media=[],draws=[],baseline={kind:'video',video:{muted:false}};let enabled=true;
 const options={target,storage:null,enabled:()=>enabled,acquireSurface:id=>id==='ds1'?baseline:null,createImage:()=>{const image=new ImageMedia();media.push(image);return image;},drawMedia:(_ctx,value)=>{draws.push(value);return true;}};
 return {target,media,draws,baseline,options,enable:value=>{enabled=value;},mount:()=>mountShelfProductsRuntime(options)};
}
test('runtime exposes a single controller, releases replaced previews and does not replay saved requests',async()=>{
 const h=harness(),statuses=[];h.target.addEventListener(SHELF_PREVIEW_STATUS_CHANNEL,event=>statuses.push(event.detail));const one=h.mount(),ready=one.controller.preview({...input,requestId:'request-1'});h.media[0].ready();await ready;
 assert.equal(h.target.__shelfScreenPreview,one.controller);assert.equal(one.controller.draw({},320,180,'ds1'),true);assert.notEqual(h.draws[0],h.baseline);
 const two=h.mount();assert.equal(h.media[0].removed,true);assert.equal(one.controller.draw({},320,180,'ds1'),false);assert.equal(h.media.length,1);assert.equal(h.target.__shelfScreenPreview,two.controller);assert.equal(statuses.at(-1).phase,'stopped');assert.equal(statuses.at(-1).requestId,'request-1');
 h.target.dispatchEvent(new Event('pagehide'));assert.equal(h.target.__shelfScreenPreview,undefined);assert.equal(h.target.__shelfProductsRuntime,undefined);two.dispose();
});
test('venue changes block Xtanco commands and stop pending/ready media without touching the base player',async()=>{
 const h=harness(),runtime=h.mount(),pending=runtime.controller.preview(input);h.enable(false);h.target.dispatchEvent(new Event('xpaceos:project-change'));
 assert.deepEqual(await pending,{ready:false,cancelled:true});assert.equal(h.media[0].removed,true);await assert.rejects(runtime.controller.preview(input),/no está disponible/);assert.equal(h.media.length,1);
 h.enable(true);const ready=runtime.controller.preview(input);h.media[1].ready();await ready;h.enable(false);
 assert.equal(runtime.controller.draw({},320,180,'ds1'),false);assert.equal(h.media[1].removed,true);assert.equal(runtime.controller.status().phase,'stopped');assert.equal(h.baseline.video.muted,false);assert.equal(h.draws.length,0);runtime.dispose();
});
test('disposed runtime ignores local channel commands',()=>{
 const h=harness(),runtime=h.mount();runtime.dispose();const event=new Event(SHELF_PREVIEW_CHANNEL);Object.defineProperty(event,'detail',{value:{schema_version:1,id:'after-close',createdAt:Date.now(),context:'xtanco',action:'preview',...input}});h.target.dispatchEvent(event);assert.equal(h.media.length,0);
});
