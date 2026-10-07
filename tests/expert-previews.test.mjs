// Experto → PREVIOS (3.ª columna): lo creado en Crear contenidos se previsualiza a la derecha
// del todo, sólo la última creación, con Lanzar y Ver en Stock debajo. Carlos, 6-oct-2026.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const stock=(kind,n,extra={})=>({id:`${kind}-${n}`,url:`https://api.admira.store/stock/asset/${kind}-${n}`,num:n,...extra});

// ── DOM mínimo: lo justo para expert-previews.js ──
class El{
 constructor(tag,doc){this.tagName=String(tag).toUpperCase();this.ownerDocument=doc;this.children=[];this.parentNode=null;this.dataset={};this.attrs={};this.events={};this.hidden=false;this._text='';this.classes=new Set();this.paused=true;
  this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c),toggle:(c,on)=>(on??!this.classes.has(c))?this.classes.add(c):this.classes.delete(c)};}
 set className(v){this.classes=new Set(String(v).split(/\s+/).filter(Boolean));}get className(){return [...this.classes].join(' ');}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
 get isConnected(){let n=this;while(n.parentNode)n=n.parentNode;return n===this.ownerDocument;}
 append(...nodes){for(const n of nodes){n.remove();n.parentNode=this;this.children.push(n);}}
 prepend(n){n.remove();n.parentNode=this;this.children.unshift(n);}
 insertBefore(n,ref){n.remove();n.parentNode=this;const i=ref?this.children.indexOf(ref):-1;if(i<0)this.children.push(n);else this.children.splice(i,0,n);return n;}
 after(n){const p=this.parentNode;n.remove();n.parentNode=p;p.children.splice(p.children.indexOf(this)+1,0,n);}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;}}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}dispatch(k,e={}){for(const fn of this.events[k]||[])fn(e);}click(){this.dispatch('click',{preventDefault(){},stopPropagation(){}});}
 pause(){this.paused=true;this.dispatch('pause');}play(){this.paused=false;this.dispatch('play');return Promise.resolve();}
 matchesSimple(s){if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return this.classes.has(s.slice(1));if(s.startsWith('[')){const key=s.slice(1,-1).split('=')[0].replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return key in this.dataset;}return this.tagName===s.toUpperCase();}
 matches(sel){return sel.split(',').some(part=>{const chain=part.trim().split(/\s+/);if(!this.matchesSimple(chain.at(-1)))return false;let n=this.parentNode;for(let i=chain.length-2;i>=0;i--){while(n&&!n.matchesSimple?.(chain[i]))n=n.parentNode;if(!n)return false;n=n.parentNode;}return true;});}
 querySelectorAll(sel){const out=[];const walk=n=>{for(const c of n.children){if(c.matches(sel))out.push(c);walk(c);}};walk(this);return out;}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
}
function dom(){
 const doc=new El('#document');doc.ownerDocument=doc;doc.documentElement=new El('html',doc);doc.documentElement.lang='es';doc.readyState='complete';
 doc.createElement=tag=>new El(tag,doc);doc.getElementById=id=>doc.querySelector('#'+id);
 const dock=new El('div',doc),view=new El('div',doc),label=new El('span',doc),hud=new El('div',doc);
 dock.id='telegramDock';view.className='expert-view-pane';label.id='expertPreviewLabel';hud.className='tier-hud';
 doc.append(dock);dock.append(view);view.append(label,hud);
 const listeners={};
 const root={document:doc,setTimeout,sessionStorage:{data:{},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=String(v);}},
  addEventListener:(k,fn)=>(listeners[k]??=[]).push(fn),dispatchEvent:e=>{for(const fn of listeners[e.type]||[])fn(e);return true;},
  CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail;}},URL};
 return {doc,root,view,label,hud};
}
const load=(root)=>vm.runInNewContext(read('admira-xp/scripts/expert-previews.js'),{window:root,URL,Date,Number,String,JSON,Map,Set,Array,Object});

test('only the latest completed creation is visible, with valid Stock identity and its brief title',()=>{
 const {preview,merge,MAX}=require('../admira-xp/scripts/expert-previews.js');
 assert.equal(preview('image',{id:'x',url:'https://evil.example/stock/asset/x'}),null);
 assert.equal(preview('image',{id:'x',url:'https://api.admira.store/stock/asset/y'}),null);
 assert.equal(preview('pdf',stock('pdf',1)),null);
 let list=[];for(let i=1;i<=8;i++)list=merge(list,preview(i%2?'image':'voice',stock('a',i,{title:'Pieza '+i})));
 assert.equal(MAX,1);assert.equal(list.length,1);assert.equal(list[0].title,'Pieza 8');
 list=merge(list,preview('voice',stock('a',8,{title:'Stock 8'})));
 assert.equal(list[0].id,'a-8');assert.equal(list[0].title,'Pieza 8');
});

test('each media kind replaces the previous preview, stops its local player, keeps the right actions and survives reload',async()=>{
 const {root,view,label,hud}=dom();const launched=[],spoken=[];
 root.XpaceMediaOptions={launch:async(kind,item)=>{launched.push([kind,item.id]);}};
 root.XpaceAnnouncements={playStock:(url,text,{onState})=>{spoken.push([url,text]);onState({phase:'speaking',completed:0});return true;},stopStock(){}};
 load(root);const section=view.querySelector('#expertCreatedPreviews');
 assert.equal(view.children.indexOf(section),view.children.indexOf(label)+1);assert.match(section.textContent,/Aquí aparecerá tu última/);
 let previous;
 for(const [kind,n,title]of [['image',1,'Café en Barcelona'],['video',2,'Barista con latte'],['voice',3,'Cerramos a las 21 h'],['music',4,'Hilo de mañana']]){
  root.XpaceExpertPreviews.add(kind,stock(kind,n,{title,language:'es'}));
  const cards=section.querySelectorAll('.expert-preview-card');assert.equal(cards.length,1);const c=cards[0];assert.equal(c.dataset.kind,kind);assert.equal(c.querySelector('.epc-title').textContent,title);
  assert.equal(root.XpaceExpertPreviews.list().length,1);assert.match(c.querySelector('[data-preview-stock]').href,/^https:\/\/www\.pixeria\.com\/stock\.html\?highlight=/);
  const player=c.querySelector('img,audio,video');assert.equal(player.tagName,kind==='image'?'IMG':kind==='video'?'VIDEO':'AUDIO');
  if(kind==='video'){assert.equal(player.muted,true);assert.equal(player.autoplay,undefined);await player.play();}
  if(previous?.tagName==='VIDEO')assert.equal(previous.paused,true,'replaced local video must stop');previous=player;
  if(kind==='image')assert.equal(c.querySelector('[data-preview-launch]').textContent,'▶ Lanzar a pantalla');
  if(kind==='video'){c.querySelector('[data-preview-launch]').click();await new Promise(setImmediate);assert.deepEqual(launched,[['video','video-2']]);}
  if(kind==='voice'){c.querySelector('[data-preview-launch]').click();assert.equal(spoken[0][0],'https://api.admira.store/stock/asset/voice-3');assert.equal(c.querySelector('[data-preview-launch]').textContent,'⏹ Detener');}
 }
 const again=dom();again.root.sessionStorage.data=root.sessionStorage.data;load(again.root);
 assert.deepEqual(again.view.querySelectorAll('.expert-preview-card').map(c=>c.dataset.kind),['music']);
});

test('recovering a legacy six-item history shows only the latest without deleting canonical receipts',()=>{
 const {root,view}=dom();const history=Array.from({length:6},(_,i)=>({kind:i%2?'voice':'image',...stock('saved',6-i),at:100-i}));
 root.XpaceCreatedMedia={list:()=>history.map(x=>({...x}))};load(root);
 assert.equal(view.querySelectorAll('.expert-preview-card').length,1);assert.equal(view.querySelector('.expert-preview-card').dataset.stockId,'saved-6');
 assert.equal(history.length,6);assert.equal(root.XpaceExpertPreviews.list()[0].id,'saved-6');
});

test('PREVIOS habla el idioma de la interfaz',()=>{
 const {root,doc,view}=dom();doc.documentElement.lang='en';load(root);
 root.XpaceExpertPreviews.add('voice',stock('voice',9,{title:'Closing soon'}));
 const card=view.querySelector('.expert-preview-card');
 assert.equal(card.querySelector('.epc-kind').textContent,'VOICEOVER');assert.equal(card.querySelector('[data-preview-launch]').textContent,'📢 Play');assert.equal(card.querySelector('[data-preview-stock]').textContent,'Open in Stock · Announcements');
});

test('media-options: stage(created) avisa a PREVIOS y launch() lanza cualquier pieza de Stock al canal correcto',async()=>{
 const events=[],calls=[];const doc={documentElement:{lang:'es'},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},getElementById:()=>null,createElement:()=>({})};
 const root={document:doc,sessionStorage:{getItem:()=>null,setItem(){}},addEventListener(){},setInterval(){},setTimeout,MutationObserver:class{observe(){}},dispatchEvent:e=>events.push(e),CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},
  XpaceMatrixOptions:{groups:c=>[{id:c==='music'?'speaker':'wall',title:'x'}],state:()=>({tracks:[],playing:false}),insert:async(...a)=>{calls.push(['insert',...a]);return 'new';},play:async(...a)=>calls.push(['play',...a])}};
 vm.runInNewContext(read('admira-xp/scripts/media-options.js'),{window:root,URL});
 root.XpaceMediaOptions.stage('image',stock('image',1,{title:'Importada'}));
 assert.equal(events.length,0,'importar de la biblioteca no es «crear»');
 root.XpaceMediaOptions.stage('image',stock('image',2,{title:'Creada'}),{created:true});
 assert.equal(events.length,1);assert.equal(events[0].type,'xpace:media-created');assert.equal(events[0].detail.kind,'image');assert.equal(events[0].detail.track.title,'Creada');
 await root.XpaceMediaOptions.launch('music',stock('music',3,{title:'Canción'}));
 await root.XpaceMediaOptions.launch('video',stock('video',4,{title:'Spot'}));
 assert.deepEqual(calls.map(c=>[c[0],c[1],c[0]==='insert'?c[2].id:c[2]]),[['insert','music','music-3'],['play','music','new'],['insert','screens','video-4'],['play','screens','new']]);
 await assert.rejects(root.XpaceMediaOptions.launch('video',{id:'x',url:'https://evil.example/x'}));
});

test('una locución de Stock se emite UNA vez sólo al pulsar Emitir, sin volver a generarla',async()=>{
 const played=[];class FakeAudio{constructor(url){this.url=url;played.push(this);this.currentTime=0;}play(){setTimeout(()=>{this.onplaying?.();setTimeout(()=>this.onended?.(),1);},1);return Promise.resolve();}pause(){}load(){}removeAttribute(){}}
 const doc={documentElement:{lang:'es'},getElementById:()=>null,querySelector:()=>null};
 const root={document:doc,Audio:FakeAudio,localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},URL,XpaceMedia:{generate:async()=>{throw Error('no debe generar');}}};
 vm.runInNewContext(read('admira-xp/scripts/announcements.js'),{window:root,setTimeout,clearTimeout,Promise,AbortController});
 const states=[];await new Promise(resolve=>{root.XpaceAnnouncements.playStock('https://api.admira.store/stock/asset/voice-1','Cerramos a las 21 h',{onState(s){states.push(s.phase);if(s.phase==='done')resolve();}});});
 assert.equal(new Set(played.map(a=>a.url)).size,1);assert.equal(played[0].url,'https://api.admira.store/stock/asset/voice-1');
 assert.equal(states.filter(s=>s==='speaking').length,1);assert.equal(states.at(-1),'done');
});

test('Crear contenidos incluye Crear locución y los creadores marcan sus piezas como creadas',()=>{
 const html=read('admira-xp/index.html');
 const forms=html.slice(html.indexOf('<div id="expertMediaGeneration"'),html.indexOf('</details></div></div></div>',html.indexOf('<div id="expertMediaGeneration"')));
 for(const id of ['data-pixeria-music-create','id="voiceoverText"','id="voiceoverVoice"','data-xp-do="voiceGen"','id="voiceoverStatus"','id="imagePrompt"','id="videoPrompt"'])assert.ok(forms.includes(id),id+' en el formulario central');
 assert.match(html,/<div class="expert-view-pane"><span class="expert-section-label" id="expertPreviewLabel">PREVIOS<\/span>/);
 for(const src of ['scripts/voiceover-prompt.js?v=','scripts/expert-previews.js?v=','scripts/expert-previews.css?v='])assert.ok(html.includes(src),src);
 assert.match(html,/XpaceMediaOptions\.stage\('image',\{\.\.\.j\.stock,title:d\},\{created:true\}\)/);
 assert.match(read('admira-xp/scripts/video-prompt.js'),/stage\('video',\{\.\.\.stock,title:text\},\{created:true\}\)/);
 assert.match(read('admira-xp/scripts/voiceover-prompt.js'),/XpaceMedia\.generate\('audio'/);
 assert.doesNotMatch(read('admira-xp/scripts/voiceover-prompt.js'),/fetch\([^)]*megafonia\/push/,'la previsualización no usa la cola que emite al momento');
 assert.match(read('admira-xp/scripts/expert-previews.css'),/@container \(max-width:240px\)/,'columna estrecha (móvil) apila la tarjeta');
});

test('ayuda y documentación describen PREVIOS en español e inglés',()=>{
 const doc=read('admira-xp/docs/expert-previews.md');
 assert.match(doc,/PREVIOS/);assert.match(doc,/PREVIEWS/);assert.match(doc,/Crear locución/);assert.match(doc,/Create voiceover/);
 assert.match(read('admira-xp/help.html'),/id="expert-previews"/);
 assert.match(read('mcp/funcionalidades.json'),/expert-previews/);
});

test('el sello flotante sube por encima del menú inferior del Experto y vuelve abajo con el Experto cerrado',()=>{
 const {liftFor}=require('../admira-xp/scripts/sello-chip-dock.js');
 const dock=(top,bottom=900)=>({top,bottom,height:bottom-top});
 assert.equal(liftFor(900,[]),0,'Experto cerrado (por defecto): el chip se queda en su sitio');
 assert.equal(liftFor(900,[dock(700)]),208,'menú bajo de 200 px: el chip queda 8 px por encima, sin tapar Crear contenidos');
 assert.equal(liftFor(900,[dock(340),dock(332,340)]),568,'menú alto: manda el borde superior del dock anclado abajo');
 assert.equal(liftFor(900,[dock(900,1100)]),0,'un dock fuera de la pantalla no levanta el chip');
 assert.equal(liftFor(900,[dock(100,500)]),0,'un panel que no llega al borde inferior no es el menú inferior');
 const html=read('admira-xp/index.html'),src=read('admira-xp/scripts/sello-chip-dock.js');
 assert.match(html,/<script defer src="scripts\/sello-chip-dock\.js\?v=[^"]+"><\/script>/);
 assert.match(src,/#admira-sello-chip\{top:auto!important;bottom:var\(--xp-sello-lift\)!important\}/);
 assert.match(src,/#telegramDock/);
});

test('preview Reset follows Stock, restores playback once and keeps the latest receipt and media',async()=>{
 const {root,view}=dom();let finish,calls=0;
 root.XpaceResetPlayback=()=>{calls++;return new Promise(resolve=>finish=resolve);};
 load(root);root.XpaceExpertPreviews.add('image',stock('image',21,{title:'Nueva campaña'}));
 const c=view.querySelector('.expert-preview-card'),actions=c.querySelector('.epc-actions'),button=c.querySelector('[data-preview-reset]'),img=c.querySelector('img');
 assert.equal(actions.children.at(-1),button);assert.equal(actions.children.at(-2),c.querySelector('[data-preview-stock]'));assert.equal(button.textContent,'Reset');
 button.click();button.click();assert.equal(calls,1);assert.equal(button.disabled,true);assert.match(c.querySelector('.epc-status').textContent,/Restaurando/);
 finish();await new Promise(setImmediate);assert.equal(button.disabled,false);assert.match(c.querySelector('.epc-status').textContent,/programación inicial restaurada/i);
 assert.equal(c.querySelector('img'),img);assert.equal(root.XpaceExpertPreviews.list()[0].id,'image-21');assert.equal(view.querySelectorAll('.expert-preview-card').length,1);
 root.XpaceResetPlayback=async()=>{throw Error('Offline');};button.click();await new Promise(setImmediate);assert.equal(button.disabled,false);assert.match(c.querySelector('.epc-status').textContent,/No se pudo restaurar: Offline/);
});

test('preview Reset uses the native local command and surfaces restoration errors without a Telegram send',async()=>{
 const html=read('admira-xp/index.html'),start=html.indexOf('  window.XpaceResetPlayback=async()=>'),end=html.indexOf('\n\n  async function sendComposerText',start);
 const calls=[],ctx={window:{},lang:'en',dsMatrixOwnsScreens:()=>true,dsMatrixAdapter:()=>({}),executeTelegramText:async command=>{calls.push(command);return 'Reset complete';},Error};
 vm.runInNewContext(html.slice(start,end),ctx);assert.equal(await ctx.window.XpaceResetPlayback(),'Reset complete');assert.deepEqual(calls,['/reset']);
 ctx.executeTelegramText=async()=> 'Error ejecutando comando: Offline';await assert.rejects(ctx.window.XpaceResetPlayback(),/Offline/);
 ctx.dsMatrixAdapter=()=>null;await assert.rejects(ctx.window.XpaceResetPlayback(),/Matrix is loading/);
});
