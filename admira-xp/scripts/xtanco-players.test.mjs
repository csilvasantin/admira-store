import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {XTANCO_PLAYERS_KEY,XTANCO_STORE_TAG,XTANCO_HOUSE,XTANCO_SHARED_SCREENS,playerTag,playerName,houseTrack,stockChannel,readXtancoPlayers,createXtancoPlayers} from './xtanco-players.mjs';
import {BEST_SCREENS_KEY,describeScreen,readBestScreens} from './best-onair.mjs';
import {executeVisualCommand} from './xtanco-visual-command.mjs';

const stable=id=>'https://api.admira.store/stock/asset/'+id;
const stock=(id,extra={})=>({id,type:'video',url:'https://stock.admira.store/stock/'+id+'/asset.mp4?v=1',title:'Pieza '+id,num:Number(id.replace(/\D/g,''))||1,...extra});
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('every screen keeps the tag Good gives it, and new screens get one from their piece of furniture',()=>{
  assert.equal(XTANCO_STORE_TAG,'XT-GRACIA');assert.deepEqual([...XTANCO_SHARED_SCREENS].sort(),['ds1','ds2','escaparate','metahuman']);
  for(const [id,tag] of [['ds1','XT-GRACIA-P1'],['ds2','XT-GRACIA-P2'],['escaparate','XT-GRACIA-ESC'],['metahuman','XT-GRACIA-MH']])assert.equal(playerTag(id,{type:'counter'}),tag,'a shared screen never changes tag');
  // The same tags as the page: one source of truth for addressing.
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of XTANCO_SHARED_SCREENS)assert.match(html,new RegExp(`id:'${id}',\\s*label:'[^']+',\\s*tag:'${playerTag(id)}'`));
  for(const [type,suffix] of [['counter','TPV'],['led','LED'],['manager','OFICINA'],['tablet','TABLET'],['turnKiosk','TURNOS'],['lottery','LOTERIA'],['tft','ESC'],['metahuman','MH']])assert.equal(playerTag('inventory:x',{type}),'XT-GRACIA-'+suffix);
  assert.equal(playerTag('inventory:p1',{type:'custom',label:'Máquina arcade ñ 2!'}),'XT-GRACIA-MAQUINA-ARCADE-N-2');
  assert.equal(playerTag('inventory:abc'),'XT-GRACIA-ABC');assert.equal(playerTag('inventory:'),'XT-GRACIA-PANTALLA');
  assert.equal(playerName('metahuman',null,'es'),'Tótem Metahuman');assert.equal(playerName('ds2',null,'en'),'Wall screen 2');assert.equal(playerName('inventory:x',{type:'manager'}),'Pantalla del escritorio');
  assert.equal(playerName('inventory:x',{type:'custom',label:'Máquina arcade'}),'Máquina arcade');
});

test('the house schedule offers one advert in four shapes and each screen takes the closest',()=>{
  assert.deepEqual(XTANCO_HOUSE.map(item=>item.format),['9:16','4:5','1:1','16:9']);
  for(const item of XTANCO_HOUSE){assert.equal(item.url,stable(item.id));assert.equal(item.kind,'video');assert.match(item.title,/JTI · Tu sitio de siempre/);assert.ok(Number.isInteger(item.stockNumber));}
  for(const [aspect,format] of [[9/16,'9:16'],[.5,'9:16'],[2/3,'9:16'],[4/5,'4:5'],[1,'1:1'],[1.065,'1:1'],[1.6,'16:9'],[16/9,'16:9'],[24,'16:9'],[NaN,'9:16'],[0,'9:16']])assert.equal(houseTrack(aspect).format,format,String(aspect));
  assert.throws(()=>{XTANCO_HOUSE.push({});});
});

test('a tagged channel is the Stock content that names the screen, in tags or as a hashtag, and nothing unsafe',()=>{
  const items=[stock('a1',{tags:['Marca','xt-gracia-p1']}),stock('a2',{comment:'para la pared #XT-GRACIA-P1 hoy'}),stock('a3',{tags:['xt-gracia-p2']}),
    stock('img',{type:'image',tags:['XT-GRACIA-P1'],url:'https://stock.admira.store/stock/img/asset.jpg'}),stock('twin',{type:'digital-twin',tags:['xt-gracia-p1']}),
    stock('audio',{type:'audio',tags:['xt-gracia-p1']}),stock('hidden',{tags:['xt-gracia-p1'],oculto:true}),stock('a1',{tags:['xt-gracia-p1'],title:'duplicado'}),
    {id:'http',type:'video',url:'http://stock.admira.store/stock/http/asset.mp4',tags:['xt-gracia-p1']},{id:'creds',type:'video',url:'https://user:pw@stock.admira.store/x.mp4',tags:['xt-gracia-p1']},
    {id:'bad id!',type:'video',url:'https://stock.admira.store/stock/x/asset.mp4',tags:['xt-gracia-p1']},{id:'nourl',type:'video',tags:['xt-gracia-p1']},null];
  const channel=stockChannel(items,'XT-GRACIA-P1');
  assert.deepEqual(channel.map(track=>track.id),['a1','a2','img','twin']);
  assert.deepEqual(channel[0],{id:'a1',title:'Pieza a1',url:stable('a1'),stockNumber:1});assert.equal(channel[2].kind,'image');assert.equal(channel[2].url,stable('img'));assert.equal(channel[0].kind,undefined);
  assert.deepEqual(stockChannel(items,'xt-gracia-p2').map(track=>track.id),['a3']);
  assert.deepEqual(stockChannel(items,'XT-GRACIA-MH'),[]);assert.deepEqual(stockChannel(items,''),[]);assert.deepEqual(stockChannel(null,'XT-GRACIA-P1'),[]);
  assert.equal(stockChannel(Array.from({length:150},(_,i)=>stock('n'+i,{tags:['xt-gracia-p1']})),'XT-GRACIA-P1').length,100);
  assert.equal(stockChannel([stock('t',{tags:['xt-gracia-p1'],title:'Primera línea\nsegunda'})],'XT-GRACIA-P1')[0].title,'Primera línea');
});

function harness({library=[],stored={},pins={},fail=false}={}){
  let now=0,seq=0;const timers=new Map(),intervals=new Map(),videos=[],sequences=[],fetched=[],data=new Map(Object.entries(stored));
  const win={performance:{now:()=>now},Image:class{set src(value){this.url=value;}},setTimeout(fn,ms){const id=++seq;timers.set(id,{fn,at:now+ms});return id;},clearTimeout(id){timers.delete(id);},setInterval(fn,ms){const id=++seq;intervals.set(id,{fn,ms,next:now+ms});return id;},clearInterval(id){intervals.delete(id);}};
  const doc={createElement(tag){if(tag==='canvas')return {width:0,height:0,getContext:()=>({drawImage(){}})};const video={tag,attrs:{},poster:'',readyState:0,videoWidth:0,videoHeight:0,paused:true,getAttribute(name){return this.attrs[name]??null;},removeAttribute(name){delete this.attrs[name];},load(){},pause(){this.paused=true;}};videos.push(video);return video;}};
  const storage={getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};
  const sequencer=options=>{const value={options,index:0,playing:false,error:false,calls:[],state:()=>({index:value.index,playing:value.playing,error:value.error}),play(){value.calls.push('play');value.playing=true;return Promise.resolve();},pause(){value.calls.push('pause');value.playing=false;},jump(id){value.index=options.tracks.findIndex(t=>t.id===id);return Promise.resolve();},replaceTracks(tracks){value.calls.push('replace');options.tracks=tracks;value.index=0;},setLoop(){},dispose(){value.calls.push('dispose');}};sequences.push(value);return value;};
  const source={items:library};
  const fetcher=async(url,options)=>{fetched.push({url,options});if(fail)throw Error('offline');return {ok:true,json:async()=>({items:source.items})};};
  const players=createXtancoPlayers({win,doc,storage,fetcher,sequencer,pinned:id=>pins[id]||null});
  const advance=ms=>{const end=now+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).map(([id,t])=>({at:t.at,run:()=>{timers.delete(id);t.fn();}})).concat([...intervals].filter(([,t])=>t.next<=end).map(([,t])=>({at:t.next,run:()=>{t.next+=t.ms;t.fn();}}))).sort((a,b)=>a.at-b.at)[0];if(!due)break;now=due.at;due.run();}now=end;};
  const context=()=>{const calls=[];return {calls,canvas:{},save(){},restore(){},drawImage(...args){calls.push(['image',...args]);},fillRect(...args){calls.push(['fill',...args]);},set fillStyle(value){calls.push(['style',value]);}};};
  const ready=(video,src)=>{video.attrs.src=src;video.readyState=4;video.videoWidth=1080;video.videoHeight=1920;};
  return {players,win,videos,sequences,fetched,data,source,pins,advance,context,ready};
}
const totem={aspect:9/16,item:{type:'metahuman',label:'Metahuman AI'}};

test('players stay dormant until a screen is painted; then the house schedule plays, one clock per shape',async()=>{
  const h=harness();
  assert.equal(h.players.enabled,true);assert.equal(h.players.state().awake,false);assert.equal(h.fetched.length,0);assert.equal(h.videos.length,0);
  assert.equal(h.players.draw(h.context(),216,384,'',totem),false);assert.equal(h.players.state().awake,false,'a screen without identity is nobody');
  assert.equal(h.players.draw(h.context(),216,384,'metahuman',totem),false,'no frame yet');
  assert.equal(h.players.state().awake,true);assert.equal(h.fetched.length,1);assert.equal(h.fetched[0].options.cache,'no-store');assert.match(h.fetched[0].url,/stock\.admira\.store\/stock\/index\.json$/);
  h.players.draw(h.context(),216,384,'inventory:led',{aspect:9/16,item:{type:'led'}});h.players.draw(h.context(),384,216,'inventory:desk',{aspect:16/10,item:{type:'manager'}});h.players.draw(h.context(),384,384,'inventory:tab',{aspect:1.065,item:{type:'tablet'}});
  await flush();
  assert.deepEqual(h.players.state().channels.map(channel=>channel.key).sort(),['house:16:9','house:1:1','house:9:16']);assert.equal(h.videos.length,3,'two portrait screens share one hidden video');
  for(const video of h.videos){assert.equal(video.crossOrigin,'anonymous');assert.equal(video.muted,true);}
  for(const sequence of h.sequences)assert.ok(sequence.calls.includes('play'));
  assert.deepEqual(h.players.state().players.map(player=>[player.id,player.tag,player.source]),[['metahuman','XT-GRACIA-MH','house'],['inventory:led','XT-GRACIA-LED','house'],['inventory:desk','XT-GRACIA-OFICINA','house'],['inventory:tab','XT-GRACIA-TABLET','house']]);
  const portrait=h.sequences.find(sequence=>sequence.options.tracks[0].format==='9:16');h.ready(portrait.options.videos[0],stable(XTANCO_HOUSE[0].id));
  const ctx=h.context();assert.equal(h.players.draw(ctx,216,384,'metahuman',totem),true);assert.equal(ctx.calls.filter(call=>call[0]==='image').at(-1)[1],portrait.options.videos[0]);
  const info=h.players.info('metahuman','es');
  assert.deepEqual({...info,media:null},{id:'metahuman',tag:'XT-GRACIA-MH',name:'Tótem Metahuman',source:'house',state:'live',title:'JTI · Tu sitio de siempre · 9:16',stock:'#1343',kind:'video',index:0,total:1,next:'',media:null});
  assert.equal(info.media,portrait.options.videos[0]);
  // A screen that has not asked for a picture yet still has a name and a tag.
  assert.deepEqual(h.players.info('inventory:new','en',{type:'lottery'}),{id:'inventory:new',tag:'XT-GRACIA-LOTERIA',name:'Lottery terminal',source:null,state:'empty',title:'',stock:'',kind:'video',index:-1,total:0,next:'',media:null});
  assert.equal(h.players.info(''),null);
});

test('content tagged for a screen replaces the house schedule on that screen only, and follows the Stock',async()=>{
  const h=harness({library:[stock('a1',{tags:['xt-gracia-led']}),stock('a2',{comment:'#xt-gracia-led'}),stock('b1',{tags:['xt-gracia-p9']})]});
  h.players.draw(h.context(),216,384,'inventory:led',{aspect:9/16,item:{type:'led'}});h.players.draw(h.context(),216,384,'metahuman',totem);
  assert.deepEqual(h.players.state().channels.map(channel=>channel.key),['house:9:16'],'the house plays while the Stock is being read');
  await flush();
  assert.deepEqual(h.players.state().players.map(player=>[player.id,player.source,player.channel]),[['inventory:led','tag','tag:XT-GRACIA-LED'],['metahuman','house','house:9:16']]);
  const tagged=h.sequences.find(sequence=>sequence.options.tracks[0].id==='a1');assert.deepEqual(tagged.options.tracks.map(track=>track.url),[stable('a1'),stable('a2')]);
  assert.equal(h.players.info('inventory:led').total,2);assert.equal(h.players.info('inventory:led').next,'Pieza a2');assert.equal(h.players.info('inventory:led').stock,'#1');
  // One more piece appears in the Stock: the same clock takes the new list at the next reading.
  h.source.items=[...h.source.items,stock('a3',{tags:['xt-gracia-led']})];
  h.players.draw(h.context(),216,384,'inventory:led',{aspect:9/16,item:{type:'led'}});h.advance(2000);h.players.draw(h.context(),216,384,'inventory:led',{aspect:9/16,item:{type:'led'}});
  for(let elapsed=0;elapsed<60000;elapsed+=2000){h.advance(2000);h.players.draw(h.context(),216,384,'inventory:led',{aspect:9/16,item:{type:'led'}});}
  await flush();assert.ok(h.fetched.length>=2);assert.equal(h.players.info('inventory:led').total,3);assert.ok(tagged.calls.includes('replace'));
  // The tag goes away: back to the house schedule, and the unused clock is released.
  h.source.items=[];for(let elapsed=0;elapsed<62000;elapsed+=2000){h.advance(2000);h.players.draw(h.context(),216,384,'inventory:led',{aspect:9/16,item:{type:'led'}});}
  await flush();assert.equal(h.players.state().players[0].source,'house');assert.equal(tagged.calls.at(-1),'dispose');
  // A screen may refuse the house schedule and simply stay as it is.
  h.players.draw(h.context(),216,384,'inventory:bare',{aspect:1,fallback:false,item:{type:'custom',label:'Sin parrilla'}});assert.equal(h.players.info('inventory:bare').state,'empty');
});

test('what Good pins on one of its four screens wins, with the very same video, and holds its last frame',async()=>{
  const video={tagName:'VIDEO',readyState:4,videoWidth:1920,videoHeight:1080,paused:false},pins={ds1:{kind:'video',title:'Campaña fijada',remote:true,element:video}};
  const h=harness({library:[stock('a1',{tags:['xt-gracia-p1']})],pins});
  const ctx=h.context();assert.equal(h.players.draw(ctx,216,384,'ds1',{aspect:9/16}),true);
  const drawn=ctx.calls.filter(call=>call[0]==='image');assert.equal(drawn[0][1],video);assert.equal(drawn[0].length,10,'it covers the screen like in Good');
  const [,,sx,sy,sw,sh,dx,dy,dw,dh]=drawn[0];assert.deepEqual([dx,dy,dw,dh],[0,0,216,384]);assert.ok(Math.abs(sw/sh-9/16)<1e-9&&sy===0&&sx>0,'a portrait cut from the middle of a landscape frame');
  await flush();
  assert.equal(h.players.state().awake,false,'no clock of its own');assert.equal(h.videos.length,0);assert.equal(h.fetched.length,0);
  assert.deepEqual(h.players.state().players,[{id:'ds1',tag:'XT-GRACIA-P1',aspect:9/16,source:'good',channel:null,title:'Campaña fijada'}]);
  const info=h.players.info('ds1','en');assert.equal(info.source,'good');assert.equal(info.state,'live');assert.equal(info.title,'Campaña fijada');assert.equal(info.name,'Wall screen 1');assert.equal(info.media,video);
  video.paused=true;assert.equal(h.players.info('ds1').state,'paused');video.paused=false;
  // Between two pinned pieces the element is not ready: the last frame stays instead of the house advert.
  h.advance(200);h.players.draw(h.context(),216,384,'ds1',{aspect:9/16});video.readyState=0;
  const held=h.context();assert.equal(h.players.draw(held,216,384,'ds1',{aspect:9/16}),true);assert.notEqual(held.calls[0][1],video);assert.equal(h.videos.length,0);
  // Unpinned in Good: the screen returns to its own tagged channel.
  delete pins.ds1;assert.equal(h.players.draw(h.context(),216,384,'ds1',{aspect:9/16}),false);await flush();
  assert.equal(h.players.state().players[0].source,'tag');assert.equal(h.players.state().awake,true);
  // Good's pins belong only to its four screens, and a web pin is not a picture.
  const other=harness({pins:{'inventory:led':{kind:'video',title:'x',element:video},metahuman:{kind:'web',title:'Quiosco',element:video},ds2:{kind:'image',title:'Cartel',element:{tagName:'IMG',complete:true,naturalWidth:800,naturalHeight:1000}}}});
  other.players.draw(other.context(),216,384,'inventory:led',{aspect:9/16,item:{type:'led'}});other.players.draw(other.context(),216,384,'metahuman',totem);
  assert.deepEqual(other.players.state().players.map(player=>player.source),['house','house']);
  const poster=other.context();assert.equal(other.players.draw(poster,300,375,'ds2',{aspect:4/5}),true);assert.equal(other.players.info('ds2').kind,'image');assert.equal(other.players.info('ds2').state,'live');
});

test('players sleep when the view stops painting, can be switched off, and forget screens that left the room',async()=>{
  const h=harness();h.players.draw(h.context(),216,384,'metahuman',totem);h.players.draw(h.context(),384,216,'inventory:desk',{aspect:1.6,item:{type:'manager'}});await flush();
  h.advance(1500);h.players.draw(h.context(),216,384,'metahuman',totem);h.advance(1500);assert.equal(h.players.state().awake,true);
  h.advance(4000);assert.equal(h.players.state().awake,false);for(const sequence of h.sequences)assert.equal(sequence.calls.at(-1),'pause');
  h.players.draw(h.context(),216,384,'metahuman',totem);assert.equal(h.players.state().awake,true);assert.equal(h.videos.length,2,'clocks are reused');
  h.players.retain(['metahuman']);assert.deepEqual(h.players.state().players.map(player=>player.id),['metahuman']);assert.deepEqual(h.players.state().channels.map(channel=>channel.key),['house:9:16']);
  assert.equal(h.players.set(false),false);assert.equal(JSON.parse(h.data.get(XTANCO_PLAYERS_KEY)).enabled,false);
  assert.equal(h.players.draw(h.context(),216,384,'metahuman',totem),false);assert.equal(h.players.state().awake,false);assert.equal(h.players.state().channels.length,0);assert.equal(h.players.info('metahuman').state,'off');
  assert.equal(h.players.info('inventory:other','es',{type:'led'}).state,'off');
  assert.equal(h.players.set(true),true);h.players.draw(h.context(),216,384,'metahuman',totem);assert.equal(h.players.state().awake,true);
  h.players.dispose();h.players.dispose();assert.equal(h.players.draw(h.context(),216,384,'metahuman',totem),false);assert.equal(h.players.state().players.length,0);
  assert.equal(readXtancoPlayers({getItem:()=>'{"enabled":false}'}),false);assert.equal(readXtancoPlayers({getItem:()=>'{broken'}),true);assert.equal(readXtancoPlayers(null),true);
  assert.equal(harness({stored:{[XTANCO_PLAYERS_KEY]:'{"enabled":false}'}}).players.enabled,false);
  // The Stock being unreachable never leaves a screen dark: the house schedule needs no index.
  const offline=harness({fail:true});offline.players.draw(offline.context(),216,384,'metahuman',totem);await flush();
  assert.equal(offline.players.state().failed,true);assert.equal(offline.players.state().players[0].source,'house');
});

test('two screens with one identity and different shapes share a player instead of rebuilding it on every draw',async()=>{
  // Two totems in the room: one photographed (9:16), one turned and drawn from its render (narrower).
  const h=harness({library:Array.from({length:40},(_,i)=>stock('n'+i,{tags:['otra-cosa']}))});
  const paint=()=>{h.players.draw(h.context(),216,384,'metahuman',{aspect:9/16,item:{type:'metahuman'}});h.players.draw(h.context(),176,384,'metahuman',{aspect:.458,item:{type:'metahuman'}});};
  paint();await flush();
  const clocks=h.sequences.length,reads=h.fetched.length,calls=h.sequences.map(sequence=>sequence.calls.length);
  for(let frame=0;frame<60;frame++){h.advance(16);paint();}
  assert.equal(h.sequences.length,clocks);assert.equal(h.fetched.length,reads);assert.deepEqual(h.sequences.map(sequence=>sequence.calls.length),calls,'no resync per frame');
  assert.deepEqual(h.players.state().players.map(player=>[player.id,player.channel]),[['metahuman','house:9:16']]);
  // Each one is still painted in its own proportion.
  const portrait=h.sequences[0].options.videos[0];h.ready(portrait,stable(XTANCO_HOUSE[0].id));
  const wide=h.context(),narrow=h.context();h.players.draw(wide,216,384,'metahuman',{aspect:9/16});h.players.draw(narrow,176,384,'metahuman',{aspect:.458});
  assert.equal(wide.calls.filter(call=>call[0]==='image').length,1,'the advert fills a screen of its own shape');assert.ok(narrow.calls.filter(call=>call[0]==='image').length>=2,'bands filled on the narrower one');
  // Shapes that ask for different adverts are two stable players under one identity.
  h.players.draw(h.context(),384,216,'metahuman',{aspect:16/9});await flush();
  const settled=h.sequences.length;for(let frame=0;frame<30;frame++){h.advance(16);paint();h.players.draw(h.context(),384,216,'metahuman',{aspect:16/9});}
  assert.equal(h.sequences.length,settled);assert.deepEqual(h.players.state().players.map(player=>player.channel).sort(),['house:16:9','house:9:16']);
  assert.equal(h.players.info('metahuman').tag,'XT-GRACIA-MH');
  h.players.retain([]);assert.equal(h.players.state().players.length,0);
  // Good's pin on a shared screen: the held frame survives both shapes.
  const video={tagName:'VIDEO',readyState:4,videoWidth:1920,videoHeight:1080,paused:false},pinned=harness({pins:{metahuman:{kind:'video',title:'Fijado',element:video}}});
  const both=()=>[pinned.players.draw(pinned.context(),216,384,'metahuman',{aspect:9/16}),pinned.players.draw(pinned.context(),176,384,'metahuman',{aspect:.458})];
  assert.deepEqual(both(),[true,true]);pinned.advance(200);both();video.readyState=0;assert.deepEqual(both(),[true,true],'held between two pieces on both screens');
  assert.equal(pinned.players.state().players.length,1);
});

test('an on-air card says what a screen plays, where it comes from and which tag addresses it',()=>{
  const en=(es,english)=>english;
  const house={name:'Tótem Metahuman',tag:'XT-GRACIA-MH',state:'live',source:'house',title:'JTI · Tu sitio de siempre · 9:16',stock:'#1343',kind:'video',index:0,total:1,next:'',media:{tagName:'VIDEO'}};
  assert.deepEqual(describeScreen({name:'Metahuman AI',info:house}),{state:'live',label:'Tótem Metahuman',tag:'XT-GRACIA-MH',title:'JTI · Tu sitio de siempre · 9:16',next:'',media:house.media,image:false,meta:'Parrilla de la casa · #1343'});
  const tagged=describeScreen({info:{...house,source:'tag',index:1,total:3,next:'Otra pieza',stock:'#332'},t:en});assert.equal(tagged.meta,'Tagged channel · 2/3 · #332');assert.equal(tagged.next,'Otra pieza');
  assert.equal(describeScreen({info:{...house,source:'good',stock:'',title:''}}).meta,'Lo que emite Good');assert.equal(describeScreen({info:{...house,source:'good',title:''}}).title,'Sin título');
  assert.equal(describeScreen({info:{...house,state:'error'}}).state,'error');assert.equal(describeScreen({info:{...house,state:'paused',kind:'image'}}).image,true);
  // A preview wins over everything and belongs to this browser alone.
  const preview=describeScreen({name:'Pared',info:house,web:{title:'Quiosco'},preview:{title:'Campaña nueva',kind:'image'}});
  assert.deepEqual([preview.state,preview.title,preview.meta,preview.image,preview.tag,preview.label],['preview','Campaña nueva','Sólo en este navegador',true,'XT-GRACIA-MH','Tótem Metahuman']);
  assert.equal(describeScreen({preview:{},t:en}).title,'Preview content');
  // A page pinned in Good (ordering kiosk, admira.tv channel) is shown in the room and touched apart.
  const web=describeScreen({name:'Metahuman AI',info:{...house,state:'empty',source:null},web:{title:'Quiosco de pedido'}});
  assert.deepEqual([web.state,web.title,web.meta,web.next,web.web,web.tag],['live','Quiosco de pedido','Lo que emite Good · web','Doble clic para tocarla',true,'XT-GRACIA-MH']);
  assert.equal(describeScreen({web:{},t:en}).title,'Interactive page');
  // Nothing on air: at rest (its own drawing shows), empty, or players switched off.
  assert.deepEqual([describeScreen({name:'Tótem',lit:true}).state,describeScreen({name:'Tótem',lit:true}).title,describeScreen({name:'Tótem',lit:true}).label],['rest','Pantalla en reposo','Tótem']);
  assert.equal(describeScreen({name:'Marco'}).state,'empty');assert.equal(describeScreen({name:'Marco',t:en}).title,'No content');
  const off=describeScreen({info:{...house,state:'off'}});assert.deepEqual([off.state,off.title,off.meta],['off','Players en pausa','/emision escena on los enciende']);
  assert.equal(describeScreen({info:{...house,state:'off'},lit:true}).meta,'Players en pausa · /emision escena on');
  assert.deepEqual(readBestScreens({getItem:()=>null}),{onAir:false,light:true});assert.deepEqual(readBestScreens({getItem:()=>'{"onAir":true,"light":false}'}),{onAir:true,light:false});
  assert.deepEqual(readBestScreens({getItem:()=>'{broken'}),{onAir:false,light:true});assert.deepEqual(readBestScreens(null),{onAir:false,light:true});assert.equal(BEST_SCREENS_KEY,'xpaceos.best.screens.v1');
});

test('/emision acts on the room that is open: in Best · Hiperreal it never jumps to Matrix',async()=>{
  const previous=globalThis.XpaceHiperreal,chosen=[];
  const router={mode:'best',choose:async tier=>{chosen.push(tier);return {ok:true};}};
  let prefs={onAir:false,light:true},enabled=true;
  const screens=[{id:'metahuman',state:'live'},{id:'ds1',state:'preview'},{id:'ds2',state:'empty'}];
  globalThis.XpaceHiperreal={screens:{state:()=>({...prefs,hover:'',screens}),set(value){prefs={...prefs,...value};return {...prefs};}},players:{get enabled(){return enabled;},set(value){enabled=value!==false;return enabled;}}};
  try{
    const status=await executeVisualCommand('/emision estado',{router});
    assert.equal(status.ok,true);assert.equal(status.mode,'best');assert.deepEqual(status.hiperreal,{onAir:false,light:true,players:true,screens:3});
    assert.match(status.message,/^Xtanco · Best Hiperreal: 3 pantallas · 2 en emisión · fichas «En emisión» OFF · luz de pantallas ON · players ON\. /);assert.doesNotMatch(status.message,/ {2}/);
    assert.equal((await executeVisualCommand('/emision',{router})).hiperreal.onAir,true);assert.equal((await executeVisualCommand('/emision',{router})).hiperreal.onAir,false);
    assert.equal((await executeVisualCommand('/emision on',{router})).hiperreal.onAir,true);
    const light=await executeVisualCommand('/onair light off',{router,lang:'en'});assert.equal(light.hiperreal.light,false);assert.match(light.message,/screen light OFF · players ON\. Hover a screen/);
    const off=await executeVisualCommand('/emision escena off',{router});assert.equal(off.hiperreal.players,false);assert.equal(enabled,false);assert.match(off.message,/Se paran los canales por etiqueta y la parrilla de la casa/);
    assert.deepEqual([off.hiperreal.onAir,off.hiperreal.light],[true,false],'switching players leaves cards and light alone');
    const on=await executeVisualCommand('/emision escena',{router});assert.equal(on.hiperreal.players,true);assert.match(on.message,/XT-GRACIA-…/);
    assert.deepEqual(chosen,[],'the view never changes');
    assert.equal((await executeVisualCommand('/emision banana',{router})).ok,false);
    // Without players (another vertical in the same view) the scene switch is not Best's to answer.
    globalThis.XpaceHiperreal.players=null;const scene=globalThis.XpaceScenePlaylists;delete globalThis.XpaceScenePlaylists;
    try{assert.match((await executeVisualCommand('/emision escena on',{router})).message,/no están listas/);assert.equal((await executeVisualCommand('/emision luz on',{router})).hiperreal.players,null);}
    finally{if(scene)globalThis.XpaceScenePlaylists=scene;}
  }finally{if(previous===undefined)delete globalThis.XpaceHiperreal;else globalThis.XpaceHiperreal=previous;}
});
