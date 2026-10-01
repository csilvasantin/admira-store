import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createScreenPlaylist} from './screen-playlist.mjs';
import {STARBUCKS_SCREEN_PLAYLIST as playlist,STARBUCKS_WALL_MAPPING as mapping} from './starbucks-screens.mjs';
import {validateMapping} from './matrix-mapping.mjs';
class Video extends EventTarget{
 currentTime=0;readyState=4;paused=true;src='';
 getAttribute(n){return this[n];}load(){this.currentTime=0;}play(){this.paused=false;return this.reject?Promise.reject(Error('blocked')):Promise.resolve();}pause(){this.paused=true;}
}
const flush=()=>new Promise(r=>setImmediate(r));
test('six-screen public contracts match runtime, keep portrait proportions and no physical player IDs',async()=>{
 for(const [file,value]of [['starbucks-screen-playlist.json',playlist],['starbucks-wall-mapping.json',mapping]])assert.deepEqual(JSON.parse(await readFile(new URL('../'+file,import.meta.url))),value);
 const clean=validateMapping(mapping);assert.equal(clean.players.length,6);assert.equal(new Set(clean.players.map(p=>p.id)).size,6);
 assert.ok(clean.players.every(p=>p.width===360&&p.height===640&&p.playerId===''&&new URL(p.url).protocol==='https:'));
 assert.throws(()=>validateMapping({...mapping,players:[{...mapping.players[0],width:0}]}));
});
test('all six screens play muted, pause/resume without resetting and loop together',async()=>{
 const videos=Array.from({length:6},()=>new Video()),control=createScreenPlaylist({videos,tracks:playlist.tracks});
 try{await control.play();assert.ok(videos.every(v=>v.muted&&!v.paused));videos.forEach(v=>v.currentTime=4);control.pause();assert.ok(videos.every(v=>v.paused&&v.currentTime===4));await control.play();assert.ok(videos.every(v=>!v.paused&&v.currentTime===4));videos[0].dispatchEvent(new Event('ended'));await flush();assert.ok(videos.every(v=>v.currentTime===0&&!v.paused));}finally{control.dispose();}assert.ok(videos.every(v=>v.paused));
});
test('one blocked screen pauses the group and exposes an error; explicit retry recovers',async()=>{
 const videos=[new Video(),new Video()];videos[1].reject=true;const control=createScreenPlaylist({videos,tracks:playlist.tracks});
 try{await control.play();assert.equal(control.state().error,true);assert.ok(videos.every(v=>v.paused));videos[1].reject=false;await control.play();assert.equal(control.state().playing,true);}finally{control.dispose();}
});
test('leaving the view while play is pending cannot announce playback afterwards',async()=>{
 const v=new Video();let resolve;v.play=()=>new Promise(r=>resolve=r);const c=createScreenPlaylist({videos:[v],tracks:playlist.tracks});const pending=c.play();c.dispose();resolve();await pending;assert.equal(c.state().playing,false);assert.equal(v.paused,true);
});
test('live playlist changes preserve current track; removing current switches and clear stops all media',async()=>{
 const v=new Video();v.removeAttribute=n=>{v[n]='';};const a={id:'a',url:'https://a.test/1.mp4'},b={id:'b',url:'https://a.test/2.mp4'},c=createScreenPlaylist({videos:[v],tracks:[a]});
 try{await c.play();v.currentTime=3;c.replaceTracks([a,b]);assert.equal(v.currentTime,3);c.replaceTracks([b]);await flush();assert.equal(v.src,b.url);assert.equal(v.paused,false);c.pause();c.replaceTracks([a]);assert.equal(v.paused,true);c.replaceTracks([]);assert.equal(v.src,'');assert.equal(v.paused,true);}finally{c.dispose();}
});
test('loop defaults on, can stop at the last item, and manual play restarts a completed schedule',async()=>{
 const v=new Video(),tracks=[{id:'a',url:'https://media.test/a.mp4'},{id:'b',url:'https://media.test/b.mp4'}],c=createScreenPlaylist({videos:[v],tracks});
 try{await c.play();v.dispatchEvent(new Event('ended'));await flush();assert.equal(c.state().index,1);v.dispatchEvent(new Event('ended'));await flush();assert.equal(c.state().index,0);assert.equal(c.state().playing,true);
 c.setLoop(false);v.currentTime=4;assert.equal(v.currentTime,4);v.dispatchEvent(new Event('ended'));await flush();assert.equal(c.state().index,1);v.dispatchEvent(new Event('ended'));await flush();assert.equal(c.state().index,1);assert.equal(c.state().playing,false);assert.equal(c.state().finished,true);assert.equal(v.paused,true);
 await c.play();assert.equal(c.state().index,0);assert.equal(c.state().playing,true);c.setLoop(true);await c.jump('b');v.dispatchEvent(new Event('ended'));await flush();assert.equal(c.state().index,0);assert.equal(c.state().playing,true);
 }finally{c.dispose();}
});
