import test from 'node:test';
import assert from 'node:assert/strict';
import {createShelfScreenPreview,connectShelfPreviewChannel,SHELF_PREVIEW_CHANNEL,SHELF_PREVIEW_STATUS_CHANNEL} from './shelf-screen-preview.mjs';

class Media extends EventTarget {
 constructor(){super();this.videoWidth=0;this.videoHeight=0;this.naturalWidth=0;this.naturalHeight=0;this.readyState=0;this.pauseCount=0;this.loadCount=0;this.playCount=0;this.removed=false;}
 set src(value){this._src=value;}get src(){return this._src;}
 load(){this.loadCount++;}pause(){this.pauseCount++;}play(){this.playCount++;return this.playResult||Promise.resolve();}
 removeAttribute(name){if(name==='src')this._src=undefined;}remove(){this.removed=true;}
 ready(kind){if(kind==='video'){this.readyState=2;this.videoWidth=640;this.videoHeight=360;this.dispatchEvent(new Event('loadeddata'));}else{this.naturalWidth=640;this.naturalHeight=360;this.dispatchEvent(new Event('load'));}}
}
const request=(overrides={})=>({surfaceId:'ds1',kind:'image',url:'https://media.example/cafe.png',title:'Café',productId:'product-0-0',...overrides});
function harness(options={}){
 const own=[],drawn=[],baseline={kind:'video',name:'Programación base',video:new Media(),ready:true};let drawResult=true;
 const controller=createShelfScreenPreview({acquireSurface:id=>id==='ds1'?baseline:null,drawMedia:(context,media,w,h)=>{drawn.push({media,w,h});return drawResult;},createImage:()=>{const media=new Media();own.push(media);return media;},createVideo:()=>{const media=new Media();own.push(media);return media;},...options});
 return {controller,own,drawn,baseline,setDrawResult:value=>{drawResult=value;}};
}
const tick=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
function detailEvent(type,detail){const event=new Event(type);Object.defineProperty(event,'detail',{value:detail});return event;}
function channelHarness(controller){
 const target=new EventTarget(),writes=[],statuses=[];const storage={getItem(){throw Error('Saved commands must never be read');},setItem(key,value){writes.push({key,value:JSON.parse(value)});}};
 target.addEventListener(SHELF_PREVIEW_STATUS_CHANNEL,event=>statuses.push(event.detail));
 const disconnect=connectShelfPreviewChannel(controller,{target,storage,now:()=>100000,onError:()=>{}});
 const command=(overrides={})=>({schema_version:1,id:'request-1',createdAt:100000,context:'xtanco',action:'preview',...request(),...overrides});
 const send=message=>target.dispatchEvent(detailEvent(SHELF_PREVIEW_CHANNEL,message));
 const storageSend=message=>{const event=new Event('storage');event.key=SHELF_PREVIEW_CHANNEL;event.newValue=JSON.stringify(message);target.dispatchEvent(event);};
 return {target,storage,writes,statuses,disconnect,command,send,storageSend};
}

test('preview reuses the draw adapter and preserves the live DS baseline while loading, showing and stopping',async()=>{
 const h=harness(),before={...h.baseline};const promise=h.controller.preview(request());assert.equal(h.controller.draw({},320,180,'ds1'),false);
 h.baseline.name='Nueva programación recibida por el feed';h.own[0].ready('image');assert.equal((await promise).ready,true);assert.equal(h.controller.status().phase,'ready');
 assert.equal(h.controller.draw({},320,180,'ds2'),false);assert.equal(h.controller.draw({},320,180,'ds1'),true);assert.equal(h.drawn[0].media.img,h.own[0]);assert.equal(h.drawn[0].w,320);
 assert.notEqual(h.drawn[0].media,h.baseline);h.controller.stop();assert.equal(h.controller.draw({},320,180,'ds1'),false);assert.equal(h.baseline.name,'Nueva programación recibida por el feed');
 assert.equal(h.baseline.video,before.video);assert.equal(h.baseline.video.pauseCount,0);assert.equal(h.baseline.video.loadCount,0);assert.equal(h.baseline.ready,true);assert.equal(h.own[0].src,undefined);h.controller.dispose();
});
test('invalid surface, URL or product data cannot replace a working preview',async()=>{
 const h=harness(),promise=h.controller.preview(request());h.own[0].ready('image');await promise;
 for(const input of [request({surfaceId:'starbucks-wall-01'}),request({surfaceId:'ds2'}),request({url:'javascript:alert(1)'}),request({url:'https://user:pass@media.example/a.mp4'}),request({url:'http://media.example/a.png'}),request({kind:'audio'}),request({productId:''})])await assert.rejects(h.controller.preview(input));
 assert.equal(h.own.length,1);assert.equal(h.controller.draw({},320,180,'ds1'),true);h.controller.dispose();
});
test('superseding and stopping pending work settles old promises and ignores late readiness',async()=>{
 const h=harness(),first=h.controller.preview(request()),old=h.own[0],next=h.controller.preview(request({productId:'product-0-1',url:'https://media.example/te.png'}));
 assert.deepEqual(await first,{ready:false,cancelled:true});old.ready('image');assert.equal(h.controller.status().phase,'loading');
 h.own[1].ready('image');await next;assert.equal(h.controller.draw({},320,180,'ds1'),true);assert.equal(h.drawn[0].media.img,h.own[1]);
 const pending=h.controller.preview(request({kind:'video',url:'https://media.example/cafe.mp4'}));h.controller.stop();assert.deepEqual(await pending,{ready:false,cancelled:true});h.own[2].ready('video');await tick();assert.equal(h.own[2].playCount,0);assert.equal(h.controller.status().phase,'stopped');h.controller.dispose();
});
test('video preview owns one muted element and a stopped asynchronous play cannot revive it',async()=>{
 const h=harness();let finishPlay;const promise=h.controller.preview(request({kind:'video',url:'https://media.example/cafe.mp4'})),video=h.own[0];video.playResult=new Promise(resolve=>{finishPlay=resolve;});
 assert.equal(video.muted,true);assert.equal(video.defaultMuted,true);assert.equal(video.volume,0);assert.equal(video.loop,true);assert.equal(video.crossOrigin,'anonymous');
 video.ready('video');await tick();assert.equal(video.playCount,1);h.controller.stop();assert.deepEqual(await promise,{ready:false,cancelled:true});finishPlay();await tick();assert.equal(h.controller.status().phase,'stopped');assert.equal(h.controller.draw({},320,180,'ds1'),false);assert.equal(video.pauseCount,1);assert.equal(video.src,undefined);assert.equal(h.baseline.video.pauseCount,0);h.controller.dispose();
});
test('load failure, playback rejection and timeout return to the baseline with explicit error status',async()=>{
 const image=harness(),failed=image.controller.preview(request());image.own[0].dispatchEvent(new Event('error'));await assert.rejects(failed,/cargar/);assert.equal(image.controller.status().phase,'error');assert.equal(image.controller.draw({},320,180,'ds1'),false);image.controller.dispose();
 const video=harness(),blocked=video.controller.preview(request({kind:'video',url:'https://media.example/cafe.mp4'}));video.own[0].playResult=Promise.reject(Error('Autoplay blocked'));video.own[0].ready('video');await assert.rejects(blocked,/Autoplay/);assert.equal(video.controller.status().phase,'error');assert.equal(video.baseline.video.pauseCount,0);video.controller.dispose();
 const timed=harness({timeoutMs:5});await assert.rejects(timed.controller.preview(request()),/demasiado/);assert.equal(timed.controller.draw({},320,180,'ds1'),false);assert.equal(timed.own[0].src,undefined);timed.controller.dispose();
});
test('showing is reported once only after successful drawing; dispose releases pending media and listeners',async()=>{
 const h=harness(),seen=[];const unsubscribe=h.controller.subscribe(status=>seen.push(status.phase));const ready=h.controller.preview(request());h.own[0].ready('image');await ready;
 h.setDrawResult(false);assert.equal(h.controller.draw({},320,180,'ds1'),false);assert.equal(h.controller.status().phase,'ready');h.setDrawResult(true);
 h.controller.draw({},320,180,'ds1');h.controller.draw({},320,180,'ds1');assert.equal(seen.filter(phase=>phase==='showing').length,1);unsubscribe();
 const pending=h.controller.preview(request());h.controller.dispose();assert.deepEqual(await pending,{ready:false,cancelled:true});assert.equal(h.own[1].removed,true);await assert.rejects(h.controller.preview(request()),/cerrada/);h.controller.dispose();
});
test('the local bridge rejects stale, future and Matrix commands, deduplicates both transports and confirms ready/showing',async()=>{
 const h=harness(),channel=channelHarness(h.controller);
 for(const command of [channel.command({createdAt:69999}),channel.command({createdAt:100001}),channel.command({context:'matrix'}),channel.command({schema_version:2}),channel.command({action:'publish'})])channel.send(command);
 assert.equal(h.own.length,0);channel.send(channel.command());channel.storageSend(channel.command());assert.equal(h.own.length,1);h.own[0].ready('image');await tick();
 assert.equal(channel.statuses.at(-1).phase,'ready');assert.equal(channel.statuses.at(-1).requestId,'request-1');assert.equal(channel.statuses.at(-1).context,'xtanco');assert.equal(channel.statuses.at(-1).schema_version,1);
 h.controller.draw({},320,180,'ds1');h.controller.draw({},320,180,'ds1');assert.equal(channel.statuses.filter(status=>status.phase==='showing').length,1);assert.ok(channel.writes.every(write=>write.key===SHELF_PREVIEW_STATUS_CHANNEL));
 channel.send(channel.command({id:'stop-1',action:'stop'}));assert.equal(channel.statuses.at(-1).phase,'stopped');assert.equal(channel.statuses.at(-1).requestId,'stop-1');channel.disconnect();h.controller.dispose();
});
test('bridge failure acknowledgement and disconnect never mutate the DS program or apply saved commands',async()=>{
 const h=harness(),channel=channelHarness(h.controller);channel.storageSend(channel.command({surfaceId:'ds2'}));await tick();assert.equal(h.own.length,0);assert.equal(channel.statuses.at(-1).phase,'error');assert.equal(channel.statuses.at(-1).requestId,'request-1');
 channel.disconnect();channel.send(channel.command({id:'after-close'}));channel.storageSend(channel.command({id:'after-close-2'}));assert.equal(h.own.length,0);assert.equal(h.baseline.video.pauseCount,0);h.controller.dispose();
});
