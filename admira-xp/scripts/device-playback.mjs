import {createScreenPlaylist} from './screen-playlist.mjs?v=options-preview-1';
import {assignedPlaylist,emptyDeviceLayout} from './device-layout.mjs?v=ipad-20261005-1';
// One local playback clock per playlist. Pause partitions keep wall/POS controls independent.
export function createDevicePlayback({onState=()=>{}}={}){
 let entries=[],layout=emptyDeviceLayout(),defaults={},disposed=false,reconciling=false,preview=null;const buckets=new Map(),paused=new Set();
 const notify=()=>{if(!disposed&&!reconciling)onState();};
 function reconcile(){if(disposed)return;reconciling=true;const next=new Map();
  for(const entry of entries){const pid=preview?.ids.includes(entry.id)?'__preview':assignedPlaylist(layout,entry.id),key=pid+':'+(paused.has(entry.id)?'paused':'playing');if(!next.has(key))next.set(key,{pid,entries:[],loop:pid==='__preview'?true:(layout.playlists[pid]||defaults[pid])?.loop!==false,tracks:pid==='__preview'?[preview.track]:(layout.playlists[pid]||defaults[pid])?.tracks||[]});next.get(key).entries.push(entry);}
  for(const [key,b] of buckets)if(!next.has(key)||next.get(key).entries.map(e=>e.id).join()!==b.ids||next.get(key).entries.some((e,i)=>e.video!==b.entries[i]?.video)){b.player.dispose();buckets.delete(key);}
  for(const [key,b] of next){let old=buckets.get(key);const json=JSON.stringify(b.tracks);if(old){old.player.setLoop(b.loop);if(old.tracks!==json){old.player.replaceTracks(b.tracks);old.tracks=json;}continue;}
   const videos=b.entries.map(e=>e.video);if(!b.tracks.length)for(const v of videos){v.pause();v.removeAttribute('src');v.load();}else if(key.endsWith(':paused'))for(const v of videos)if(!b.tracks.some(t=>t.url===(v.getAttribute('src')||v.poster))){if(b.tracks[0].kind==='image'){v.removeAttribute('src');v.poster=b.tracks[0].url;}else{v.poster='';v.src=b.tracks[0].url;}v.load();v.pause();}const player=createScreenPlaylist({videos,tracks:b.tracks,loop:b.loop,initialURL:videos[0]?.getAttribute('src')||videos[0]?.poster,onState:notify});old={player,pid:b.pid,ids:b.entries.map(e=>e.id).join(),entries:b.entries,tracks:json};buckets.set(key,old);if(!key.endsWith(':paused'))void player.play();
  }reconciling=false;notify();
 }
 async function jump(playlistId,trackId){
   const tracks=(layout.playlists[playlistId]||defaults[playlistId])?.tracks||[];
   if(!tracks.some(t=>t.id===trackId||t.stockId===trackId))throw Error('Unknown track');
   const members=entries.filter(e=>assignedPlaylist(layout,e.id)===playlistId);
   if(!members.length)throw Error('No active devices use this playlist');
   if(preview?.ids.some(id=>members.some(e=>e.id===id)))preview=null;
   for(const e of members)paused.delete(e.id);reconcile();
   return buckets.get(playlistId+':playing').player.jump(trackId);
 }
 return {
  get previewIds(){return preview?[...preview.ids]:[];},
  async preview(ids,track){
   const active=entries.filter(e=>ids.includes(e.id)).map(e=>e.id);
   if(!active.length)throw Error('No active devices selected');
   const url=new URL(track.url);if(url.protocol!=='https:'||url.username||url.password||!track.id)throw Error('Invalid preview content');
   preview={ids:active,track:{...track}};for(const id of active)paused.delete(id);reconcile();
   return buckets.get('__preview:playing').player.jump(track.id);
  },
  async reload(ids){
   const targets=new Set(ids);if(preview?.ids.some(id=>targets.has(id))){for(const id of preview.ids)targets.add(id);preview=null;}
   reconcile();const pids=[...new Set(entries.filter(e=>targets.has(e.id)).map(e=>assignedPlaylist(layout,e.id)))];
   const results=[];for(const pid of pids){const track=(layout.playlists[pid]||defaults[pid])?.tracks[0];if(track)results.push(await jump(pid,track.id||track.stockId));}
   return {error:results.some(r=>r.error),playing:results.some(r=>r.playing),empty:!results.length};
  },
  update({devices=entries,config=layout,catalog=defaults}={}){entries=devices;layout=config;defaults=catalog;reconcile();},
  setPlaying(ids,value){for(const id of ids)value?paused.delete(id):paused.add(id);reconcile();if(value)for(const b of buckets.values())if(b.entries.some(e=>ids.includes(e.id))&&!b.player.state().playing)void b.player.play();},
  jump,
  nowPlaying(ids){return [...buckets.values()].filter(b=>b.entries.some(e=>ids.includes(e.id))).map(b=>{const state=b.player.state(),track=JSON.parse(b.tracks)[state.index];return {...state,playlistId:b.pid,preview:b.pid==='__preview',deviceIds:b.entries.filter(e=>ids.includes(e.id)).map(e=>e.id),trackId:track?.id||track?.stockId,url:track?.url};});},
  state(ids){const chosen=[...buckets.values()].filter(b=>b.entries.some(e=>ids.includes(e.id)));return {playing:chosen.some(b=>b.player.state().playing),error:chosen.some(b=>b.player.state().error),count:entries.filter(e=>ids.includes(e.id)).length};},
  dispose(){disposed=true;for(const b of buckets.values())b.player.dispose();buckets.clear();}
 };
}
