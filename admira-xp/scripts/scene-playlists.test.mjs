import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {SCENE_PLAYLISTS_KEY,DEVICE_LAYOUT_KEY,SCENE_SEEDS,SURFACE_ASPECT,sceneKind,sceneTrack,sceneCatalog,sceneLayout,sceneGroups,sceneSlice,coverRect,containRect,readScenePlaylists,createScenePlaylists} from './scene-playlists.mjs';
import {parseVisualCommand,executeVisualCommand} from './xtanco-visual-command.mjs';

const stock=(id,ext='mp4')=>'https://stock.admira.store/stock/'+id+'/asset.'+ext+'?v=1',stable=id=>'https://api.admira.store/stock/asset/'+id;
const track=(id,extra={})=>({id,title:'Pieza '+id,url:stock(id),...extra});
const WALL=[6,5,4,3,2,1].map(n=>'starbucks-wall-0'+n),TPV='starbucks-tpv-01',IPAD='starbucks-ipad-01';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' ≉ '+b);

test('scene media uses the stable Stock route that always grants cross-origin reads',()=>{
 assert.equal(sceneTrack(track('abc-1')).url,stable('abc-1'));assert.equal(sceneTrack(track('abc-1')).title,'Pieza abc-1');
 assert.equal(sceneTrack({id:'r2',url:'https://pub-bf043a4daa3b43b7a0b769617729d074.r2.dev/stock/r2/asset.jpg'}).url,stable('r2'));
 for(const url of [stable('abc-1'),'https://example.com/stock/abc/asset.mp4','https://stock.admira.store/other/abc.mp4','not a url']){const item={id:'x',url};assert.equal(sceneTrack(item),item);}
 assert.equal(sceneKind(WALL[0]),'wall');assert.equal(sceneKind(TPV),'tpv');assert.equal(sceneKind(IPAD),'ipad');
});

test('the catalogue starts from the repo seeds and follows playlists managed through MCP',()=>{
 const seeds={wall:[track('w1'),track('xmas',{condition:'/navidad'})],tpv:[track('t1')],ipad:[]};
 assert.deepEqual(sceneCatalog(null,seeds).wall.tracks.map(t=>t.id),['w1']);assert.equal(sceneCatalog(null,seeds).tpv.tracks[0].id,'t1');
 const state={controls:{},playlists:{wall:{managed:true,tracks:[track('w9'),track('w8',{condition:'/navidad'})]},tpv:{managed:false,tracks:[track('ignored')]},ipad:{managed:true,tracks:[track('photo',{kind:'image'})]}}};
 const live=sceneCatalog(state,seeds);
 assert.deepEqual(live.wall.tracks.map(t=>t.id),['w9']);assert.deepEqual(live.tpv.tracks.map(t=>t.id),['t1']);assert.equal(live.ipad.tracks[0].kind,'image');
 assert.deepEqual(sceneCatalog({...state,controls:{demoMode:'christmas'}},seeds).wall.tracks.map(t=>t.id),['w8']);
 assert.ok(SCENE_SEEDS.wall.length>=3&&SCENE_SEEDS.tpv.length>=1);
});

test('assignments come from this browser unless MCP shares a newer layout',()=>{
 const custom={playlists:{'playlist-a':{title:'A',tracks:[{id:'a1',title:'A1',url:stock('a1')}],loop:false}},assignments:{[WALL[0]]:'playlist-a'}};
 assert.deepEqual(sceneLayout(null,null),{playlists:{},assignments:{}});
 assert.equal(sceneLayout({config:custom,remoteRevision:5},null).assignments[WALL[0]],'playlist-a');
 assert.equal(sceneLayout({config:custom,remoteRevision:5},{deviceLayout:{playlists:{},assignments:{}},deviceLayoutRevision:5}).assignments[WALL[0]],'playlist-a','same revision keeps local');
 assert.deepEqual(sceneLayout({config:custom,remoteRevision:5},{deviceLayout:{playlists:{},assignments:{}},deviceLayoutRevision:6}).assignments,{});
 assert.deepEqual(sceneLayout({config:{broken:true}},{deviceLayout:{nope:1},deviceLayoutRevision:9}),{playlists:{},assignments:{}});
});

test('one clock per playlist in use: powered-off devices and empty playlists stay out',()=>{
 const catalog={wall:{tracks:[track('w1'),track('w2')],loop:true},tpv:{tracks:[track('t1')]},ipad:{tracks:[]}};
 const layout={playlists:{'playlist-a':{title:'A',tracks:[track('a1')],loop:false}},assignments:{[WALL[0]]:'playlist-a',[TPV]:'playlist-a'}};
 const groups=sceneGroups({layout,catalog,off:{[WALL[1]]:true,[WALL[2]]:false}});
 assert.deepEqual([...groups.keys()],['wall','playlist-a']);
 assert.deepEqual(groups.get('wall').devices,[WALL[5],WALL[4],WALL[3],WALL[2]].sort());
 assert.deepEqual(groups.get('playlist-a').devices,[WALL[0],TPV]);assert.equal(groups.get('playlist-a').loop,false);assert.equal(groups.get('wall').loop,true);
 assert.deepEqual(groups.get('wall').tracks.map(t=>t.url),[stable('w1'),stable('w2')]);
});

test('/sincro slices one video across the wall only where every screen shares its clock',()=>{
 assert.equal(sceneSlice(WALL[0],'individual'),null);assert.equal(sceneSlice(TPV,'total'),null);
 assert.deepEqual(sceneSlice('starbucks-wall-04','groups'),{count:3,index:0},'screen 3 is the left of 1–3');
 assert.deepEqual(sceneSlice('starbucks-wall-06','groups'),{count:3,index:2});assert.equal(sceneSlice('starbucks-wall-03','groups'),null,'screen 4 stands alone');
 assert.deepEqual(sceneSlice('starbucks-wall-01','total'),{count:6,index:0});assert.deepEqual(sceneSlice('starbucks-wall-06','total'),{count:6,index:5});
 assert.equal(sceneSlice('starbucks-wall-06','groups',numbers=>!numbers.includes(2)),null);
});

test('frames keep their proportion on the physical screen and slices tile without gaps',()=>{
 const aspect=SURFACE_ASPECT.wall,portrait={sw:1080,sh:1920};
 const fit=containRect({...portrait,w:512,h:768,aspect});
 near(fit.h,768);near(fit.y,0);near(fit.w,512*(1080/1920)/aspect);near(fit.x,(512-fit.w)/2);
 const wide=containRect({sw:1920,sh:1080,w:512,h:768,aspect});near(wide.w,512);near(wide.x,0);near(wide.h,768*aspect/(1920/1080));
 const cover=coverRect({...portrait,aspect});near(cover.w,1080);near(cover.x,0);near(cover.h,1080/aspect);near(cover.y,(1920-cover.h)/2);
 const parts=[0,1,2].map(index=>coverRect({sw:1920,sh:1080,aspect,count:3,index}));
 for(const part of parts){near(part.w/part.h,aspect);assert.ok(part.x>=-1e-6&&part.x+part.w<=1920+1e-6);}
 near(parts[1].x,parts[0].x+parts[0].w);near(parts[2].x,parts[1].x+parts[1].w);near(parts[0].x+parts[2].x+parts[2].w,1920,'centred');
 near(SURFACE_ASPECT.ipad,4/3);
});

function harness({state=null,stored={}}={}){
 let now=0;const timers=new Map(),intervals=new Map(),videos=[],sequences=[],watches=[],data=new Map(Object.entries(stored));let seq=0;
 class FakeImage{constructor(){FakeImage.made.push(this);this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}set src(value){this.url=value;}}
 FakeImage.made=[];
 const win={performance:{now:()=>now},Image:FakeImage,setTimeout(fn,ms){const id=++seq;timers.set(id,{fn,at:now+ms});return id;},clearTimeout(id){timers.delete(id);},setInterval(fn,ms){const id=++seq;intervals.set(id,{fn,ms,next:now+ms});return id;},clearInterval(id){intervals.delete(id);}};
 const doc={createElement(tag){if(tag==='canvas')return {width:0,height:0,getContext:()=>({drawImage(){}})};const video={tag,attrs:{},poster:'',readyState:0,videoWidth:0,videoHeight:0,paused:true,getAttribute(name){return this.attrs[name]??null;},removeAttribute(name){delete this.attrs[name];},load(){},pause(){this.paused=true;}};videos.push(video);return video;}};
 const storage={getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};
 const sequencer=options=>{const value={options,index:0,playing:false,error:false,calls:[],state:()=>({index:value.index,playing:value.playing,error:value.error}),play(){value.calls.push('play');value.playing=true;return Promise.resolve();},pause(){value.calls.push('pause');value.playing=false;},jump(id){value.calls.push('jump:'+id);value.index=options.tracks.findIndex(t=>t.id===id);return Promise.resolve();},replaceTracks(tracks){value.calls.push('replace');options.tracks=tracks;value.index=0;},setLoop(loop){value.loop=loop;},dispose(){value.calls.push('dispose');}};sequences.push(value);return value;};
 const watch=({onState})=>{const entry={onState,stopped:false};watches.push(entry);if(state)onState(state);return ()=>{entry.stopped=true;};};
 const advance=ms=>{const end=now+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).map(([id,t])=>({id,at:t.at,run:()=>{timers.delete(id);t.fn();}})).concat([...intervals].filter(([,t])=>t.next<=end).map(([id,t])=>({id,at:t.next,run:()=>{t.next+=t.ms;t.fn();}}))).sort((a,b)=>a.at-b.at)[0];if(!due)break;now=due.at;due.run();}now=end;};
 const context=()=>{const calls=[];return {calls,save(){},restore(){},drawImage(...args){calls.push(['image',...args]);},fillRect(...args){calls.push(['fill',...args]);},set fillStyle(value){calls.push(['style',value]);}};};
 const seeds={wall:[track('w1'),track('w2')],tpv:[track('t1')],ipad:[track('photo',{kind:'image',url:stock('photo','jpg')})]};
 const runtime=createScenePlaylists({win,doc,storage,watch,sequencer,seeds,mode:()=>win.mode||'individual'});
 const ready=(video,src)=>{video.attrs.src=src;video.readyState=4;video.videoWidth=1080;video.videoHeight=1920;};
 return {runtime,win,videos,sequences,watches,data,advance,context,ready,images:FakeImage.made,set now(value){now=value;}};
}

test('the schedule stays dormant until a Starbucks screen is drawn and never answers other screens',()=>{
 const h=harness();
 assert.equal(h.runtime.draw(h.context(),512,768,'ds1'),false);assert.equal(h.runtime.get('escaparate'),null);
 assert.equal(h.sequences.length,0);assert.equal(h.watches.length,0);assert.equal(h.runtime.state().awake,false);
 const ctx=h.context();assert.equal(h.runtime.draw(ctx,512,768,WALL[0]),false,'no frame yet');
 assert.equal(h.runtime.state().awake,true);assert.equal(h.watches.length,1);
 assert.deepEqual(h.runtime.state().groups.map(g=>[g.playlistId,g.devices.length,g.total]),[['wall',6,2],['tpv',1,1],['ipad',1,1]]);
 assert.equal(h.videos.length,3,'one hidden video per playlist, not per screen');
 for(const video of h.videos)assert.equal(video.crossOrigin,'anonymous');
 for(const sequence of h.sequences)assert.ok(sequence.calls.includes('play'));
 assert.equal(h.sequences[0].options.tracks[0].url,stable('w1'));
 assert.deepEqual(h.runtime.get(WALL[3]),{id:'w1',title:'Pieza w1',url:stable('w1'),kind:'video',playlistId:'wall',scheduled:true});
});

test('a frame is painted whole with filled bands, held between items and crossfaded into the next',()=>{
 const h=harness(),wall=()=>h.videos[0];
 h.runtime.draw(h.context(),512,768,WALL[0]);h.ready(wall(),stable('w1'));
 let ctx=h.context();assert.equal(h.runtime.draw(ctx,512,768,WALL[0]),true);
 const images=ctx.calls.filter(c=>c[0]==='image');assert.equal(images.length,2,'darkened cover behind, whole frame on top');
 assert.equal(images[0][1],wall());assert.equal(images[1].length,6);near(images[1][5],768);assert.ok(ctx.calls.some(c=>c[0]==='fill'));
 h.win.mode='groups';ctx=h.context();h.runtime.draw(ctx,512,768,'starbucks-wall-06');
 const slice=ctx.calls.filter(c=>c[0]==='image');assert.equal(slice.length,1);assert.equal(slice[0].length,10,'source crop of one third');assert.ok(slice[0][2]>0);h.win.mode='individual';
 h.advance(200);h.runtime.draw(h.context(),512,768,WALL[0]);
 wall().readyState=0;wall().attrs.src=stable('w2');
 ctx=h.context();assert.equal(h.runtime.draw(ctx,512,768,WALL[0]),true,'held frame while the next item loads');assert.notEqual(ctx.calls.find(c=>c[0]==='image')[1],wall());
 h.ready(wall(),stable('w2'));ctx=h.context();h.advance(100);assert.equal(h.runtime.draw(ctx,512,768,WALL[0]),true);
 const sources=new Set(ctx.calls.filter(c=>c[0]==='image').map(c=>c[1]));assert.equal(sources.size,2,'old frame under the new one');
 h.advance(600);ctx=h.context();h.runtime.draw(ctx,512,768,WALL[0]);assert.deepEqual([...new Set(ctx.calls.filter(c=>c[0]==='image').map(c=>c[1]))],[wall()]);
});

test('it sleeps when no scene paints (Matrix, hidden tab) and wakes on the next draw',()=>{
 const h=harness();h.runtime.draw(h.context(),512,768,TPV);
 h.advance(1500);h.runtime.draw(h.context(),512,768,TPV);h.advance(1500);assert.equal(h.runtime.state().awake,true,'still in use');
 h.advance(4000);assert.equal(h.runtime.state().awake,false);assert.equal(h.watches[0].stopped,true);
 for(const sequence of h.sequences)assert.equal(sequence.calls.at(-1),'pause');
 h.runtime.draw(h.context(),512,768,TPV);assert.equal(h.runtime.state().awake,true);assert.equal(h.watches.length,2);
 for(const sequence of h.sequences)assert.equal(sequence.calls.at(-1),'play');assert.equal(h.videos.length,3,'players are reused');
});

test('live MCP state replaces tracks, powers screens off and follows shared assignments',()=>{
 const state={revision:7,controls:{},devicesOff:{[WALL[0]]:true},deviceLayoutRevision:2,deviceLayout:{playlists:{'playlist-a':{title:'A',tracks:[{id:'a1',title:'A1',url:stock('a1')}],loop:false}},assignments:{[WALL[1]]:'playlist-a'}},
  playlists:{wall:{managed:true,tracks:[track('w9')]},tpv:{managed:true,tracks:[track('t9')]},ipad:{managed:true,tracks:[]}}};
 const h=harness({state});const ctx=h.context();
 assert.equal(h.runtime.draw(ctx,512,768,WALL[0]),true,'an off screen is painted black');assert.deepEqual(ctx.calls.at(-1),['fill',0,0,512,768]);
 assert.equal(h.runtime.get(WALL[0]).kind,'off');
 const groups=h.runtime.state().groups;assert.equal(h.runtime.state().revision,7);
 assert.deepEqual(groups.map(g=>[g.playlistId,g.devices.length]),[['wall',4],['tpv',1],['playlist-a',1]]);
 assert.equal(h.runtime.get(IPAD),null,'empty playlist leaves the illustrative screen');
 assert.equal(h.runtime.get(WALL[1]).playlistId,'playlist-a');assert.equal(h.sequences.find(s=>s.options.tracks[0].id==='a1').options.loop,false);
 const wall=h.sequences.find(s=>s.calls.includes('replace'));assert.equal(wall.options.tracks[0].url,stable('w9'));
 h.watches[0].onState({...state,revision:8,devicesOff:{},playlists:{...state.playlists,tpv:{managed:true,tracks:[]}}});
 assert.deepEqual(h.runtime.state().groups.map(g=>[g.playlistId,g.devices.length]),[['wall',5],['playlist-a',1]]);
 assert.ok(h.sequences.some(s=>s.calls.at(-1)==='dispose'),'unused clocks are released');
});

test('the queue manager keeps the iPad while its playlist has no video, as in Matrix',()=>{
 const h=harness();assert.equal(h.runtime.draw(h.context(),1024,768,IPAD),false);
 h.videos[2].poster=h.sequences[2].options.tracks[0].url;assert.equal(h.runtime.draw(h.context(),1024,768,IPAD),false,'the photo is still loading');
 const image=h.images.find(i=>i.url===stable('photo'));assert.ok(image,'image items load through the stable route');assert.equal(image.crossOrigin,'anonymous');
 Object.assign(image,{complete:true,naturalWidth:1600,naturalHeight:1200});
 const ctx=h.context();assert.equal(h.runtime.draw(ctx,1024,768,IPAD),true);assert.equal(ctx.calls.filter(c=>c[0]==='image').length,1,'4:3 photo fills a 4:3 screen without bands');
 assert.equal(h.runtime.get(IPAD).kind,'image');
 h.win.XpaceIpadCola={on:()=>true};assert.equal(h.runtime.draw(h.context(),1024,768,IPAD),false);assert.equal(h.runtime.get(IPAD),null);
 h.win.XpaceIpadCola={on:()=>false};assert.equal(h.runtime.draw(h.context(),1024,768,IPAD),true);
});

test('an item that fails is skipped after a pause and the switch is remembered',()=>{
 const h=harness();h.runtime.draw(h.context(),512,768,WALL[0]);
 const wall=h.sequences[0];wall.options.onState({error:true,index:0});
 for(let i=0;i<3;i++){h.advance(1000);h.runtime.draw(h.context(),512,768,WALL[0]);}assert.ok(!wall.calls.includes('jump:w2'));
 h.advance(1100);assert.ok(wall.calls.includes('jump:w2'));h.runtime.draw(h.context(),512,768,WALL[0]);
 h.sequences[1].options.onState({error:true,index:0});h.advance(5000);assert.ok(!h.sequences[1].calls.some(c=>c.startsWith('jump')),'a single item is not retried in a loop');
 assert.equal(h.runtime.set(false),false);assert.equal(JSON.parse(h.data.get(SCENE_PLAYLISTS_KEY)).enabled,false);
 assert.equal(h.runtime.draw(h.context(),512,768,WALL[0]),false);assert.equal(h.runtime.get(WALL[0]),null);assert.equal(h.runtime.state().groups.length,0);
 assert.equal(readScenePlaylists({getItem:()=>'{"enabled":false}'}),false);assert.equal(readScenePlaylists({getItem:()=>'{broken'}),true);assert.equal(readScenePlaylists(null),true);
 assert.equal(h.runtime.set(true),true);h.runtime.draw(h.context(),512,768,WALL[0]);assert.equal(h.runtime.state().groups.length,3);
 const saved=harness({stored:{[DEVICE_LAYOUT_KEY]:JSON.stringify({config:{playlists:{},assignments:{[TPV]:'wall'}},remoteRevision:0})}});
 saved.runtime.draw(saved.context(),512,768,TPV);assert.deepEqual(saved.runtime.state().groups.map(g=>[g.playlistId,g.devices.length]),[['wall',7],['ipad',1]]);
});

test('a preview always wins over the schedule and the schedule fills what has no preview',async()=>{
 const source=readFileSync(new URL('./screen-media.js',import.meta.url),'utf8'),listeners={};
 const media=()=>({tagName:'IMG',naturalWidth:800,naturalHeight:600,set src(value){queueMicrotask(()=>this.onload?.());}});
 const root={document:{createElement:media},addEventListener:(type,fn)=>{listeners[type]=fn;},setTimeout,clearTimeout};
 vm.runInNewContext(source,{window:root,globalThis:root,URL,Map,Promise,queueMicrotask,Error});
 const M=root.XpaceScreenMedia,drawn=[],ctx={save(){},restore(){},fillRect(){},drawImage(){drawn.push('preview');},set fillStyle(v){}};
 assert.equal(M.draw(ctx,512,768,'starbucks-wall-01'),false);assert.equal(M.get('starbucks-wall-01'),null);
 M.setSchedule({draw:(c,w,h,id)=>{drawn.push('schedule:'+id);return id!=='none';},get:id=>id==='none'?null:{id:'s',scheduled:true}});
 assert.equal(M.draw(ctx,512,768,'starbucks-wall-01'),true);assert.equal(M.draw(ctx,512,768,'none'),false);assert.equal(M.get('starbucks-wall-01').scheduled,true);assert.equal(M.previewed('starbucks-wall-01'),false);
 await M.preview('starbucks-wall-01',{id:'p',kind:'image',url:'https://example.com/p.png'});
 drawn.length=0;assert.equal(M.draw(ctx,512,768,'starbucks-wall-01'),true);assert.deepEqual(drawn,['preview']);assert.equal(M.get('starbucks-wall-01').id,'p');assert.equal(M.previewed('starbucks-wall-01'),true);
 M.restore('starbucks-wall-01');drawn.length=0;M.draw(ctx,512,768,'starbucks-wall-01');assert.deepEqual(drawn,['schedule:starbucks-wall-01']);
 M.setSchedule({draw:'no'});assert.equal(M.draw(ctx,512,768,'starbucks-wall-01'),false,'a malformed schedule is ignored');
});

test('/emision escena toggles scene playback without leaving the current view',async()=>{
 assert.deepEqual(parseVisualCommand('/emision escena'),{onAir:{scene:true,value:null}});
 assert.deepEqual(parseVisualCommand('/onair scene off'),{onAir:{scene:true,value:false}});
 assert.deepEqual(parseVisualCommand('/emisión escena on'),{onAir:{scene:true,value:true}});
 const chosen=[],router={mode:'good',choose:async mode=>{chosen.push(mode);return {ok:true};}};let enabled=true;
 globalThis.XpaceScenePlaylists={get enabled(){return enabled;},set:value=>enabled=value};
 try{
  const off=await executeVisualCommand('/emision escena',{router});assert.equal(off.ok,true);assert.equal(off.scenePlaylists,false);assert.match(off.message,/programación en las pantallas de la escena OFF/);
  const on=await executeVisualCommand('/onair scene on',{router,lang:'en'});assert.equal(on.scenePlaylists,true);assert.match(on.message,/same playlists as Matrix/);
  assert.deepEqual(chosen,[],'no switch to Matrix');
 }finally{delete globalThis.XpaceScenePlaylists;}
 assert.equal((await executeVisualCommand('/emision escena',{router})).ok,false);
 assert.match((await executeVisualCommand('/emision cosa',{router})).message,/\/emision escena \[on\|off\]/);
});

test('the three scenes load the schedule once and keep the documented wiring',()=>{
 const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
 const html=read('../index.html'),module=read('./scene-playlists.mjs'),renderer=read('./life-renderer.mjs'),room=read('./starbucks-room.js'),ui=read('./life-ui.mjs');
 assert.equal(html.split('scripts/scene-playlists.mjs').length,2);assert.ok(html.indexOf('scripts/screen-media.js')<html.indexOf('scripts/scene-playlists.mjs'));
 assert.match(room,/XpaceScreenMedia\?\.get\(id\)/);assert.match(ui,/getScreenPreview:\(\)=>window\.XpaceScreenMedia\?\.draw/);
 assert.match(renderer,/screenPreviewIds\?66:125/,'live screens refresh faster than idle ones');
 // Shared state lives in these modules: the specifiers must match the ones Matrix imports.
 const panorama=read('./matrix-panorama.mjs');
 for(const name of ['screen-display.mjs','device-layout.mjs','starbucks-demo.mjs','starbucks-ipad.mjs','matrix-remote.mjs']){const spec=module.match(new RegExp("'\\./"+name.replace('.','\\.')+"\\?v=[^']+'"))?.[0];assert.ok(spec&&panorama.includes(spec),name);}
 assert.doesNotMatch(module,/setScreenDisplayMode|localStorage\.setItem\(DEVICE|method:\s*'(?:POST|PUT|DELETE)'/,'read-only on layout, mode and MCP');
 assert.match(module,/crossOrigin='anonymous'/);assert.match(module,/pagehide',\(\)=>runtime\.rest\(\)/);
});
