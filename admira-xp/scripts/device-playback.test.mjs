import test from 'node:test';import assert from 'node:assert/strict';import {createDevicePlayback} from './device-playback.mjs';
class Video extends EventTarget{src='';currentTime=0;readyState=4;paused=true;load(){this.currentTime=0;}getAttribute(){return this.src;}removeAttribute(){this.src='';}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
const tick=()=>new Promise(r=>setImmediate(r)),a={id:'a',title:'A',url:'https://media.test/a.mp4'},b={id:'b',title:'B',url:'https://media.test/b.mp4'};
test('group screens and POS, keep unrelated playback, independently pause and empty only assigned group',async()=>{const v=[new Video(),new Video(),new Video()],devices=[{id:'starbucks-wall-06',video:v[0]},{id:'starbucks-wall-05',video:v[1]},{id:'starbucks-tpv-01',video:v[2]}],runtime=createDevicePlayback();try{const config={playlists:{'playlist-local':{title:'Local',tracks:[b]}},assignments:{}};runtime.update({devices,config,catalog:{wall:{tracks:[a]},tpv:{tracks:[b]}}});await tick();v[1].currentTime=8;config.assignments={'starbucks-wall-06':'playlist-local','starbucks-tpv-01':'playlist-local'};runtime.update({config});await tick();assert.equal(v[0].src,b.url);assert.equal(v[2].src,b.url);assert.equal(v[1].src,a.url);assert.equal(v[1].currentTime,8);runtime.setPlaying(['starbucks-wall-06'],false);await tick();assert.ok(v[0].paused);assert.ok(!v[2].paused);config.playlists['playlist-local'].tracks=[];runtime.update({config});await tick();assert.equal(v[0].src,'');assert.equal(v[2].src,'');assert.equal(v[1].src,a.url);}finally{runtime.dispose();}});
test('jump restarts all members, resumes paused partitions and preserves unrelated playlists',async()=>{const v=[new Video(),new Video(),new Video()],runtime=createDevicePlayback();try{runtime.update({devices:[{id:'starbucks-wall-06',video:v[0]},{id:'starbucks-wall-05',video:v[1]},{id:'starbucks-tpv-01',video:v[2]}],catalog:{wall:{tracks:[a,b]},tpv:{tracks:[a]}}});await tick();runtime.setPlaying(['starbucks-wall-05'],false);v[2].currentTime=12;await runtime.jump('wall','b');assert.equal(v[0].src,b.url);assert.equal(v[1].src,b.url);assert.ok(v.slice(0,2).every(x=>!x.paused&&x.currentTime===0));assert.equal(v[2].currentTime,12);v[0].currentTime=9;await runtime.jump('wall','b');assert.equal(v[0].currentTime,0);v[0].dispatchEvent(new Event('ended'));await tick();assert.equal(v[0].src,a.url);assert.equal(v[1].src,a.url);await assert.rejects(runtime.jump('wall','missing'),/Unknown track/);assert.equal(v[0].src,a.url);await assert.rejects(runtime.jump('playlist-missing','a'),/Unknown track/);}finally{runtime.dispose();}});
test('temporary previews span only chosen devices without changing saved schedules; reload restarts and loops originals',async()=>{
 const v=[new Video(),new Video(),new Video()],ids=['starbucks-wall-06','starbucks-wall-05','starbucks-tpv-01'],runtime=createDevicePlayback(),c={id:'c',title:'C',url:'https://media.test/c.mp4'};
 const config={playlists:{'playlist-local':{title:'Local',tracks:[a,b]}},assignments:{[ids[0]]:'playlist-local',[ids[1]]:'playlist-local'}};const saved=JSON.stringify(config);
 try{runtime.update({devices:ids.map((id,i)=>({id,video:v[i]})),config,catalog:{wall:{tracks:[a,b]},tpv:{tracks:[b]}}});await tick();v[2].currentTime=8;
 await runtime.preview(ids.slice(0,2),c);assert.deepEqual(runtime.previewIds,ids.slice(0,2));assert.ok(v.slice(0,2).every(x=>x.src===c.url&&!x.paused));assert.equal(v[2].currentTime,8);assert.equal(JSON.stringify(config),saved);
 v[0].dispatchEvent(new Event('ended'));await tick();assert.equal(v[0].src,c.url);
 runtime.update({config});await tick();assert.equal(v[0].src,c.url);
 await runtime.reload([ids[0]]);assert.deepEqual(runtime.previewIds,[]);assert.ok(v.slice(0,2).every(x=>x.src===a.url&&x.currentTime===0&&!x.paused));assert.equal(v[2].currentTime,8);
 v[0].dispatchEvent(new Event('ended'));await tick();assert.equal(v[0].src,b.url);v[0].dispatchEvent(new Event('ended'));await tick();assert.equal(v[0].src,a.url);
 await runtime.preview([ids[0]],c);await runtime.jump('playlist-local','b');assert.deepEqual(runtime.previewIds,[]);assert.equal(v[0].src,b.url);
 await assert.rejects(runtime.preview(['missing'],c),/No active/);assert.equal(v[0].src,b.url);
 }finally{runtime.dispose();}
});
test('now-playing follows actual selected devices, automatic advance, pause, preview and reload',async()=>{
 const ids=['starbucks-wall-06','starbucks-tpv-01'],v=[new Video(),new Video()],runtime=createDevicePlayback();
 try{runtime.update({devices:ids.map((id,i)=>({id,video:v[i]})),catalog:{wall:{tracks:[a,b]},tpv:{tracks:[b]}}});await tick();
 assert.deepEqual(runtime.nowPlaying([ids[0]]).map(s=>[s.playlistId,s.trackId,s.playing,s.preview]),[['wall','a',true,false]]);
 v[0].dispatchEvent(new Event('ended'));await tick();assert.equal(runtime.nowPlaying([ids[0]])[0].trackId,'b');assert.equal(runtime.nowPlaying([ids[1]])[0].playlistId,'tpv');
 runtime.setPlaying([ids[0]],false);await tick();assert.equal(runtime.nowPlaying([ids[0]])[0].playing,false);assert.equal(runtime.nowPlaying([ids[1]])[0].playing,true);
 await runtime.preview([ids[0]],a);assert.equal(runtime.nowPlaying([ids[0]])[0].preview,true);assert.equal(runtime.nowPlaying([ids[0]])[0].trackId,'a');
 await runtime.reload([ids[0]]);assert.equal(runtime.nowPlaying([ids[0]])[0].preview,false);assert.equal(runtime.nowPlaying([ids[0]])[0].trackId,'a');
 v[0].dispatchEvent(new Event('error'));assert.equal(runtime.nowPlaying([ids[0]])[0].playing,false);assert.equal(runtime.nowPlaying([ids[0]])[0].error,true);
 }finally{runtime.dispose();}
});
test('changing a playlist loop flag keeps its current clock and does not affect unrelated devices',async()=>{
 const ids=['starbucks-wall-06','starbucks-tpv-01'],v=[new Video(),new Video()],runtime=createDevicePlayback(),config={playlists:{'playlist-loop':{title:'Loop',tracks:[a,b],loop:true}},assignments:{[ids[0]]:'playlist-loop'}};
 try{runtime.update({devices:ids.map((id,i)=>({id,video:v[i]})),config,catalog:{tpv:{tracks:[a,b]}}});await tick();v[0].currentTime=7;config.playlists['playlist-loop'].loop=false;runtime.update({config});assert.equal(v[0].currentTime,7);assert.equal(runtime.nowPlaying([ids[0]])[0].loop,false);
 await runtime.jump('playlist-loop','b');v[0].dispatchEvent(new Event('ended'));await tick();assert.equal(runtime.state([ids[0]]).playing,false);assert.equal(runtime.state([ids[1]]).playing,true);
 await runtime.reload([ids[0]]);assert.equal(v[0].src,a.url);assert.equal(runtime.nowPlaying([ids[0]])[0].loop,false);
 }finally{runtime.dispose();}
});

test('image identity survives paused partitions and playlist additions without launching a different item',async()=>{
 const previous=globalThis.Image;globalThis.Image=class{set src(value){queueMicrotask(()=>this.onload());}};
 const photo={id:'photo',title:'Coffee',kind:'image',url:'https://stock.example/coffee.jpg'},v=new Video(),id='starbucks-wall-06',runtime=createDevicePlayback(),config={playlists:{'playlist-mixed':{title:'Mixed',tracks:[a,photo]}},assignments:{[id]:'playlist-mixed'}};
 try{runtime.update({devices:[{id,video:v}],config});await tick();await runtime.jump('playlist-mixed','photo');assert.equal(v.poster,photo.url);runtime.setPlaying([id],false);await tick();assert.equal(runtime.nowPlaying([id])[0].trackId,'photo');assert.equal(runtime.state([id]).playing,false);config.playlists['playlist-mixed'].tracks.push(b);runtime.update({config});assert.equal(runtime.nowPlaying([id])[0].trackId,'photo');assert.equal(runtime.state([id]).playing,false);runtime.setPlaying([id],true);await tick();assert.equal(runtime.nowPlaying([id])[0].trackId,'photo');assert.equal(v.poster,photo.url);assert.equal(runtime.state([id]).playing,true);}finally{runtime.dispose();globalThis.Image=previous;}
});

test('successive Signage drops remain independent and reset restores all base schedules without editing them',async()=>{
 const ids=['starbucks-wall-06','starbucks-wall-05','starbucks-tpv-01'],v=ids.map(()=>new Video()),runtime=createDevicePlayback(),c={id:'c',title:'C',url:'https://media.test/c.mp4'},d={id:'d',title:'D',url:'https://media.test/d.mp4'},config={playlists:{},assignments:{}},saved=JSON.stringify(config);
 try{runtime.update({devices:ids.map((id,i)=>({id,video:v[i]})),config,catalog:{wall:{tracks:[a,b]},tpv:{tracks:[b]}}});await tick();await runtime.preview([ids[0]],c);await runtime.preview([ids[1]],d);assert.equal(v[0].src,c.url);assert.equal(v[1].src,d.url);assert.deepEqual(runtime.previewGroup(ids[0]),[ids[0]]);assert.deepEqual(runtime.previewGroup(ids[1]),[ids[1]]);assert.equal(v[2].src,b.url);assert.equal(JSON.stringify(config),saved);await runtime.reload(ids);assert.deepEqual(runtime.previewIds,[]);assert.equal(v[0].src,a.url);assert.equal(v[1].src,a.url);assert.equal(v[2].src,b.url);assert.ok(v.every(video=>video.muted));}finally{runtime.dispose();}
});
