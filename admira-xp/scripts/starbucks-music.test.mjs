import test from 'node:test';
import assert from 'node:assert/strict';
import {createStarbucksMusic,musicTracks,STARBUCKS_FEED} from './starbucks-music.mjs';
class AudioStub extends EventTarget{
 constructor(){super();this.src='';this.currentTime=0;this.playCalls=0;this.pauseCalls=0;this.loadCalls=0;}
 load(){this.currentTime=0;this.loadCalls++;}
 play(){this.playCalls++;this.paused=false;return this.reject?Promise.reject(Error()):Promise.resolve();}
 pause(){this.pauseCalls++;this.paused=true;}
 removeAttribute(){this.src='';}
}
const songs=[1,2,3].map(n=>({url:`https://audio.example/${n}.mp3`,title:`Track ${n}`}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){const audio=new AudioStub();let feed=songs;const music=createStarbucksMusic({audio,fetchFeed:async()=>({ok:true,json:async()=>({ok:true,playlist:feed})})});return {audio,music,setFeed(value){feed=value;}};}
test('playlist uses an isolated Starbucks feed and rejects invalid media URLs',()=>{
 assert.match(STARBUCKS_FEED,/store=starbucks-alsea-paseo-de-gracia&since=0/);
 assert.deepEqual(musicTracks([...songs,songs[0],{url:'javascript:alert(1)'},{url:'https://user:secret@example.com/a'},null]),songs);
});
test('loading does not autoplay; mute/unmute never pause, reload or reset position',async()=>{
 const {audio,music}=setup();await music.refresh();assert.equal(audio.playCalls,0);assert.equal(audio.muted,true);
 music.toggle();await tick();audio.currentTime=43;const loads=audio.loadCalls;
 music.toggle();assert.equal(audio.muted,true);assert.equal(audio.currentTime,43);assert.equal(audio.pauseCalls,0);assert.equal(audio.loadCalls,loads);
 audio.currentTime=49;music.toggle();assert.equal(audio.muted,false);assert.equal(audio.currentTime,49);assert.equal(audio.playCalls,1);music.dispose();
});
test('playlist advances and loops while muted, retaining mute on the next song',async()=>{
 const {audio,music}=setup();await music.refresh();music.toggle();await tick();music.toggle();
 for(const n of [2,3,1]){audio.dispatchEvent(new Event('ended'));await tick();assert.equal(audio.src,`https://audio.example/${n}.mp3`);assert.equal(audio.muted,true);assert.equal(audio.paused,false);}
 music.dispose();
});
test('refresh and leaving the view retain the running track and time',async()=>{
 const {audio,music,setFeed}=setup();await music.refresh();music.toggle();await tick();audio.currentTime=12;
 setFeed([songs[2],songs[0],songs[1]]);await music.refresh();assert.equal(audio.currentTime,12);assert.equal(music.state().index,1);
 music.mute();assert.equal(audio.pauseCalls,0);assert.equal(music.state().started,true);
 setFeed([]);await music.refresh();assert.equal(audio.currentTime,12);assert.equal(music.state().tracks,3);music.dispose();
});
test('empty playlist and blocked playback never report playing; explicit retry works',async()=>{
 const {audio,music,setFeed}=setup();setFeed([]);await music.refresh();music.toggle();await tick();assert.equal(music.state().started,false);assert.equal(audio.playCalls,0);
 setFeed(songs);await music.refresh();audio.reject=true;music.toggle();await tick();assert.equal(music.state().error,'play');assert.equal(audio.muted,true);
 audio.reject=false;music.toggle();await tick();assert.equal(music.state().started,true);assert.equal(audio.muted,false);music.dispose();
});
test('failed tracks skip without an infinite loop when every URL fails',async()=>{
 const {audio,music}=setup();await music.refresh();music.toggle();await tick();
 for(let i=0;i<3;i++){audio.dispatchEvent(new Event('error'));await tick();}
 assert.equal(audio.playCalls,3);assert.equal(music.state().started,false);assert.equal(music.state().error,'media');assert.equal(audio.muted,true);music.dispose();
});

test('published Stock selection survives an empty/expired feed and remains playable when offline',async()=>{
 const audio=new AudioStub();let feed=null;
 const music=createStarbucksMusic({audio,publishedTracks:[songs[0]],fetchFeed:async()=>{if(feed===null)throw Error('offline');return {ok:true,json:async()=>({playlist:feed})};}});
 assert.equal(music.state().tracks,1);assert.equal(audio.playCalls,0);await music.refresh();
 music.toggle();await tick();assert.equal(audio.src,songs[0].url);assert.equal(audio.muted,false);
 audio.currentTime=70;feed=[];await music.refresh();assert.equal(audio.currentTime,70);assert.equal(music.state().tracks,1);
 feed=[songs[0],songs[1]];await music.refresh();assert.equal(music.state().tracks,2);assert.equal(audio.currentTime,70);
 music.toggle();audio.dispatchEvent(new Event('ended'));await tick();assert.equal(audio.src,songs[1].url);assert.equal(audio.muted,true);music.dispose();
});

test('EXIT advances manually, preserves mute and emits the selected track for the mug bridge',async()=>{
 const {audio,music}=setup();await music.refresh();const events=[];const unsub=music.subscribe(s=>events.push(s));
 assert.equal(music.next(),true);await tick();assert.equal(audio.src,songs[1].url);assert.equal(audio.muted,true);assert.equal(music.state().reason,'next');assert.equal(music.state().position,0);assert.equal(music.state().playing,true);
 music.toggle();audio.currentTime=23;const before=music.state().revision;music.next();await tick();assert.equal(audio.src,songs[2].url);assert.equal(audio.muted,false);assert.ok(music.state().revision>before);assert.ok(events.some(s=>s.url===songs[2].url&&s.position===0&&s.reason==='next'));
 music.next();await tick();assert.equal(audio.src,songs[0].url);assert.equal(audio.muted,false);
 unsub();music.dispose();assert.equal(music.next(),false);
});
test('single-track next restarts and increments revision; empty next cannot pretend to play',async()=>{
 const {audio,music,setFeed}=setup();setFeed([]);await music.refresh();assert.equal(music.next(),false);assert.equal(music.state().started,false);
 setFeed([songs[0]]);await music.refresh();music.toggle();await tick();audio.currentTime=123;const revision=music.state().revision;music.next();await tick();assert.equal(audio.src,songs[0].url);assert.equal(audio.currentTime,0);assert.equal(music.state().revision,revision+1);music.dispose();
});
test('MCP playlist replaces queue authoritatively and removing current track keeps mute',async()=>{
 const {audio,music,setFeed}=setup();await music.refresh();music.toggle();await tick();music.mute();audio.currentTime=12;music.replaceTracks([songs[0],songs[2]]);assert.equal(audio.currentTime,12);music.replaceTracks([songs[2]]);await tick();assert.equal(audio.src,songs[2].url);assert.equal(audio.muted,true);music.replaceTracks([]);assert.equal(music.state().tracks,0);assert.equal(audio.paused,true);setFeed(songs);await music.refresh();assert.equal(music.state().tracks,0);music.dispose();
});

// Carlos, 7-oct-2026: la locución tiene PRIORIDAD — el hilo musical se para (antes seguía a volumen cero) y sigue donde estaba al terminar.
test('announcement suppression pauses the music where it is and resumes it once after the last nested release',async()=>{const {audio,music}=setup();await music.refresh();music.toggle();await tick();audio.currentTime=45;const volume=audio.volume,plays=audio.playCalls;const release=music.suppress(),nested=music.suppress();assert.equal(audio.paused,true);assert.equal(audio.pauseCalls,1);assert.equal(audio.volume,volume);assert.equal(audio.muted,false);assert.equal(audio.currentTime,45);assert.equal(music.state().suppressed,true);assert.equal(music.state().playing,false);release();release();assert.equal(audio.paused,true);assert.equal(audio.playCalls,plays);nested();await tick();assert.equal(audio.paused,false);assert.equal(audio.playCalls,plays+1);assert.equal(audio.currentTime,45);assert.equal(audio.volume,volume);assert.equal(music.state().suppressed,false);music.dispose();});
test('music that was not playing stays stopped after an announcement, and a track asked for meanwhile waits for it to end',async()=>{const {audio,music}=setup();await music.refresh();const idle=music.suppress();assert.equal(audio.pauseCalls,0);idle();await tick();assert.equal(audio.playCalls,0);music.toggle();await tick();const plays=audio.playCalls,hold=music.suppress();music.next();await tick();assert.equal(audio.playCalls,plays,'no arranca encima del aviso');hold();await tick();assert.equal(audio.playCalls,plays+1);assert.equal(audio.paused,false);music.dispose();});
