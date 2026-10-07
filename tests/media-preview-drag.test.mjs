import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../admira-xp/scripts/media-options.js',import.meta.url),'utf8');
class Node {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.style={};this.dataset={};this.attrs={};this.events={};this.classes=new Set();this.offsetWidth=170;this.offsetHeight=110;this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),contains:v=>this.classes.has(v),toggle:(v,on)=>on?this.classes.add(v):this.classes.delete(v)};}
 set className(v){this.classes=new Set(v.split(' '));}get className(){return [...this.classes].join(' ');}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??(k==='src'?this.src:null);}removeAttribute(k){delete this.attrs[k];}
 append(...nodes){for(const n of nodes){n.remove();this.children.push(n);n.parent=this;}}remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
 replaceChildren(...nodes){this.children.forEach(n=>n.parent=null);this.children=[];this.append(...nodes);}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}fire(k,event={}){for(const fn of this.events[k]||[])fn(event);}
 setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;this.fire('lostpointercapture');}focus(){}load(){}pause(){}
 cloneNode(){const n=new Node(this.tagName);n.src=this.src;n.id=this.id;n.attrs={...this.attrs};return n;}
 matches(s){if(s==='dialog[open]')return this.tagName==='DIALOG'&&this.open;if(s.startsWith('.'))return this.classes.has(s.slice(1));if(s.startsWith('[')){const key=s.slice(1,-1).split('=')[0].replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return key in this.dataset;}return s===this.tagName.toLowerCase();}
 closest(s){return this.matches(s)?this:this.parent?.closest(s)||null;}
 querySelectorAll(s){const parts=s.split(',');return this.children.flatMap(n=>[...(parts.some(p=>n.matches(p))?[n]:[]),...n.querySelectorAll(s)]);}querySelector(s){return this.querySelectorAll(s)[0]||null;}
 getContext(){return {drawImage:(...args)=>this.drawn=args};}
}
function setup(){
 const doc=new Node('document'),calls=[],body=new Node('body'),html=new Node('html'),videoHost=new Node(),imageHost=new Node(),musicHost=new Node(),musicPlaylist=new Node(),playlist=new Node(),listBody=new Node(),summary=new Node('summary'),original=new Node('video');
 html.lang='en';doc.body=body;doc.documentElement=html;doc.append(body);body.append(videoHost,imageHost,musicHost,playlist,musicPlaylist);musicHost.dataset.mediaReady="music";musicPlaylist.dataset.optionsPlaylist="music";const musicBody=new Node();musicBody.className="options-playlist-body";musicPlaylist.append(new Node("summary"),musicBody);videoHost.dataset.mediaReady='video';imageHost.dataset.mediaReady='image';videoHost.append(original);original.id='videoPreview';original.controls=true;original.readyState=4;original.videoWidth=1920;original.videoHeight=1080;playlist.dataset.optionsPlaylist='screens';listBody.className='options-playlist-body';playlist.append(summary,listBody);
 const baseQuery=doc.querySelector.bind(doc);doc.querySelector=s=>s==='[data-media-ready="video"]'?videoHost:s==='[data-media-ready="image"]'?imageHost:s==='[data-media-ready="music"]'?musicHost:baseQuery(s);
 doc.getElementById=id=>id==='videoPreview'?original:null;doc.createElement=tag=>new Node(tag);doc.elementFromPoint=()=>doc.hit||null;
 const track={id:'saved',kind:'video',title:'Existing video',url:'https://api.admira.store/stock/asset/saved'};
 const api={groups:()=>[{id:'wall',title:'Wall'}],state:()=>({tracks:[track],playing:true}),screenAt:(x)=>x>=500?'starbucks-ipad-01':null,screenHighlight:id=>calls.push(['highlight',id]),screenTitle:()=> 'Landscape iPad',previewScreen:async(id,t)=>calls.push(['preview',id,t.id]),insert:async(...a)=>{calls.push(['insert',...a]);return 'added';},play:async(...a)=>calls.push(['play',...a]),move:async()=>{}};
 const root={document:doc,innerWidth:1280,innerHeight:720,XpaceMatrixOptions:api,sessionStorage:{getItem:()=>null,setItem(){}},addEventListener:(k,fn)=>doc.addEventListener('window:'+k,fn),setInterval(){},setTimeout,MutationObserver:class{observe(){}}};
 vm.runInNewContext(code,{window:root,URL});
 const staged={id:'new-video',title:'New video',url:'https://api.admira.store/stock/asset/new-video'};
 root.XpaceMediaOptions.stage('video',staged);
 const event=(x,y,more={})=>({pointerId:1,button:0,clientX:x,clientY:y,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},...more});
 const grab=videoHost.querySelector('.media-preview-grab');
 return {doc,calls,root,videoHost,imageHost,musicHost,musicPlaylist,original,grab,playlist,event,down:(x=30,y=60)=>grab.fire('pointerdown',event(x,y)),move:(x,y)=>doc.fire('pointermove',event(x,y)),up:(x,y)=>doc.fire('pointerup',event(x,y)),ghost:()=>body.querySelector('.media-drag-ghost')};
}
test('video stays controllable while a real frame and title follow the pointer and drop only on the chosen device',async()=>{
 const h=setup();assert.equal(h.videoHost.querySelector('video'),h.original);assert.equal(h.original.controls,true);assert.equal(h.videoHost.querySelectorAll('button').length,3);
 h.down();h.move(100,120);const ghost=h.ghost();assert.ok(ghost);assert.equal(ghost.querySelector('canvas').drawn[0],h.original);assert.equal(ghost.querySelector('strong').textContent,'New video');assert.equal(ghost.style.left,'100px');assert.equal(ghost.style.top,'120px');
 h.move(640,370);assert.equal(ghost.style.left,'640px');assert.ok(ghost.classList.contains('can-drop'));h.up(640,370);await new Promise(setImmediate);assert.equal(h.ghost(),null);assert.deepEqual(h.calls.filter(c=>c[0]!=='highlight'),[['preview','starbucks-ipad-01','new-video']]);assert.match(h.videoHost.querySelector('[data-media-hint]').textContent,/Showing only on Landscape iPad/);
});
test('image follows as the same Stock image, and Escape, outside drop, lost capture and blur cancel without playback',()=>{
 for(const cancel of ['escape','outside','capture','blur']){const h=setup();h.root.XpaceMediaOptions.stage('image',{id:'coffee',title:'Coffee',url:'https://api.admira.store/stock/asset/coffee'});const grab=h.imageHost.querySelector('.media-preview-grab'),image=h.imageHost.querySelector('img');grab.fire('pointerdown',h.event(20,60));h.move(80,100);assert.equal(h.ghost().querySelector('img').src,image.src);
 if(cancel==='escape')h.doc.fire('keydown',h.event(0,0,{key:'Escape'}));else if(cancel==='outside')h.up(100,100);else if(cancel==='capture')grab.releasePointerCapture();else h.doc.fire('window:blur');assert.equal(h.ghost(),null);assert.equal(h.doc.documentElement.classList.contains('media-dragging'),false);assert.equal(h.calls.filter(c=>c[0]!=='highlight').length,0);}
});
test('clicks do not start a drag or steal playlist button capture; a deliberate playlist drop adds without autoplay',async()=>{
 const h=setup();h.down();h.move(31,61);assert.equal(h.ghost(),null);h.up(31,61);const row=h.playlist.querySelector('li');row.fire('pointerdown',h.event(30,60));assert.equal(row.capture,undefined);h.up(30,60);
 h.down();h.move(100,120);h.doc.hit=h.playlist.querySelector('ol');h.up(100,120);await new Promise(setImmediate);assert.equal(h.calls.filter(c=>c[0]==='insert').length,1);assert.equal(h.calls.some(c=>c[0]==='play'||c[0]==='preview'),false);assert.equal(h.ghost(),null);
});

test('the pointer remains the centre anchor at viewport edges and an audio cover drags without blocking its controls',async()=>{
 const h=setup();h.down();h.move(1,1);assert.equal(h.ghost().style.left,'1px');assert.equal(h.ghost().style.top,'1px');h.doc.fire('window:blur');
 h.root.XpaceMediaOptions.stage('music',{id:'audio-file',sourceType:'audio',title:'Audio file',url:'https://api.admira.store/stock/asset/audio-file',thumbnail:'https://stock.admira.store/cover.jpg'});
 const audio=h.musicHost.querySelector('audio'),grab=h.musicHost.querySelector('.media-preview-grab');assert.equal(audio.controls,true);assert.equal(audio.events.pointerdown,undefined);grab.fire('pointerdown',h.event(24,50));h.move(220,280);assert.equal(h.ghost().style.left,'220px');assert.equal(h.ghost().style.top,'280px');assert.equal(h.ghost().querySelector('img').getAttribute('src'),'https://stock.admira.store/cover.jpg');
 h.doc.hit=h.musicPlaylist.querySelector('ol');h.up(220,280);await new Promise(setImmediate);assert.equal(h.calls.filter(c=>c[0]==='insert'&&c[1]==='music').length,1);assert.equal(h.calls.find(c=>c[0]==='insert')[2].sourceType,'audio');assert.equal(h.calls.some(c=>c[0]==='play'||c[0]==='preview'),false);
});
test('a restored third-pane card drags its own receipt rather than the latest Options asset',async()=>{const f=setup(),stock={id:'restored-image',url:'https://api.admira.store/stock/asset/restored-image',title:'Previo recuperado'},picture=f.doc.createElement('img');picture.src=stock.url;const frame=f.root.XpaceMediaOptions.preview('image',stock,picture);f.doc.body.append(frame);const grab=frame.querySelector('.media-preview-grab');grab.fire('pointerdown',f.event(30,60));f.move(640,220);assert.equal(f.ghost().querySelector('img').src,stock.url);f.up(640,220);await new Promise(r=>setTimeout(r,0));assert.ok(f.calls.some(c=>JSON.stringify(c).includes('restored-image')));});

test('Signage uses the held graphic, preserves its identity through pointer release and routes cards/reorder without shared writes',async()=>{
 for(const destination of [{ids:['starbucks-wall-03']},{before:2}]){const h=setup(),row=h.doc.createElement('div'),picture=h.doc.createElement('img'),calls=[];picture.src='https://media.example/poster.jpg';h.doc.body.append(row);row.append(picture);h.root.XpaceSignagePointer={active:v=>calls.push(['active',v]),target:()=>destination,drop:(name,target)=>calls.push(['drop',name,target])};h.root.XpaceMediaOptions.attachSignage(row,'My Signage clip',{id:'signage-0',title:'My Signage clip',kind:'video',url:'https://media.example/clip.mp4'},picture);
 row.fire('pointerdown',h.event(30,60));h.move(200,220);assert.equal(h.ghost().querySelector('img').src,picture.src);assert.equal(h.ghost().querySelector('strong').textContent,'My Signage clip');h.up(200,220);await new Promise(setImmediate);assert.deepEqual(calls,[['active',true],['active',false],['drop','My Signage clip',destination]]);assert.equal(h.calls.filter(c=>c[0]==='insert'||c[0]==='play'||c[0]==='preview').length,0);assert.equal(h.ghost(),null);}
});
test('a Matrix loading surface never falls back to Good for a screen drop',()=>{const h=setup();h.doc.body.classList.add('xpace-matrix-active');h.root.XpaceOptionsPlayback=h.root.XpaceMatrixOptions;delete h.root.XpaceMatrixOptions;h.down();h.move(640,300);h.up(640,300);assert.equal(h.calls.filter(c=>c[0]==='preview').length,0);});

test('a held muffin goes only to an active POS, never a screen or playlist, and cancellation makes no basket write',async()=>{
 for(const scenario of ['register','outside','escape','blur','disabled','playlist']){
  const h=setup(),muffin=h.doc.createElement('button'),picture=h.doc.createElement('img'),added=[];picture.src='muffin.png';h.doc.body.append(muffin);muffin.dataset.posProduct='muffin';
  h.root.XpacePOSExperience={isActive:()=>scenario!=='disabled',targetAt:x=>x>=500,highlight(){},addProduct:id=>added.push(id)};
  h.root.XpaceMediaOptions.attachProduct(muffin,{id:'muffin',title:'Muffin'},picture);
  muffin.fire('pointerdown',h.event(30,60));h.move(640,270);assert.equal(h.ghost().querySelector('img').src,picture.src);
  if(scenario==='escape')h.doc.fire('keydown',h.event(0,0,{key:'Escape'}));
  else if(scenario==='blur')h.doc.fire('window:blur');
  else{if(scenario==='playlist')h.doc.hit=h.playlist.querySelector('ol');h.up(['outside','playlist'].includes(scenario)?100:640,270);}
  await new Promise(setImmediate);assert.deepEqual(added,scenario==='register'?['muffin']:[]);assert.equal(h.calls.some(c=>['preview','insert','play'].includes(c[0])),false);assert.equal(h.ghost(),null);
 }
});
test('product keyboard activation and disposal use the same receiver without a stale pointer',()=>{
 const h=setup(),muffin=h.doc.createElement('button'),picture=h.doc.createElement('img'),added=[];h.doc.body.append(muffin);
 h.root.XpacePOSExperience={isActive:()=>true,addProduct:id=>added.push(id),highlight(){},targetAt:()=>true};
 const dispose=h.root.XpaceMediaOptions.attachProduct(muffin,{id:'muffin',title:'Muffin'},picture);
 muffin.fire('keydown',h.event(0,0,{key:'Enter'}));muffin.fire('keydown',h.event(0,0,{key:' '}));assert.deepEqual(added,['muffin','muffin']);
 muffin.fire('pointerdown',h.event(30,60));h.move(100,120);dispose();h.up(640,270);assert.equal(h.ghost(),null);assert.deepEqual(added,['muffin','muffin']);
});
