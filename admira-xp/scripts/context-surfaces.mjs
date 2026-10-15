import {contextPlaylist} from './context-playlist-client.mjs?v=local-playlist-349';
import {mountContextPlaylistEditor} from './context-playlist-editor.mjs?v=local-playlist-349';
import {createPainterPool} from './playlist-painter.mjs?v=local-playlist-349';
import {mountMusicRemote} from './music-remote.mjs?v=local-playlist-349';
import {starbucksMusic} from './starbucks-music.mjs?v=local-playlist-349';
export function channelForSurface(id){
 if(typeof id!=='string'||!/^[a-z0-9][a-z0-9-]{0,47}$/.test(id)||/(?:ipad|eink|e-ink)/.test(id))return null;
 return /(?:^|-)(?:tpv|speaker|music)(?:-|$)/.test(id)?'music':'screen-'+id;
}
export function mountSurfacePlaylistRemote(host,id,{t=es=>es,signal,onToggle=()=>{},blocked=()=>false,win=globalThis.window}={}){
 const channel=channelForSurface(id);if(!channel)return null;if(channel==='music')return mountMusicRemote(host,{music:starbucksMusic(),t,signal,onToggle,blocked,win});const doc=host.ownerDocument,details=doc.createElement('details'),summary=doc.createElement('summary');details.className='music-remote';details.dataset.contextSurface=id;summary.textContent=t('DESPLEGAR MANDO INTERACTIVO','EXPAND INTERACTIVE REMOTE');details.append(summary);host.append(details);
 const editor=mountContextPlaylistEditor(details,{client:contextPlaylist(channel,win),t,signal});editor.setInitialStockSelection(win.XpaceContextPlaylists?.initialSelection?.(channel)||[]);details.addEventListener('toggle',()=>{summary.textContent=details.open?t('PLEGAR MANDO INTERACTIVO','COLLAPSE INTERACTIVE REMOTE'):t('DESPLEGAR MANDO INTERACTIVO','EXPAND INTERACTIVE REMOTE');onToggle(details.open);},{signal});
 for(const name of ['pointerdown','pointerup','click','keydown','keyup','wheel'])details.addEventListener(name,event=>event.stopPropagation(),{signal});
 const dispose=()=>{editor.dispose();details.remove();};signal?.addEventListener('abort',dispose,{once:true});return {node:details,update(){},dispose,get open(){return details.open;}};
}
let runtime;
export function contextSurfaces(win=globalThis.window){
 if(!win)return null;if(runtime)return runtime;const pool=createPainterPool({win}),entries=new Map();
 function ensure(id){
  const channel=channelForSurface(id);if(!channel||channel==='music')return null;if(entries.has(id))return entries.get(id);
  const client=contextPlaylist(channel,win),entry={id,client,painter:null,value:null,claimed:false};entries.set(id,entry);
  entry.unsubscribe=client.subscribe(value=>{entry.value=value;if(value.scope)entry.claimed=true;if(value.data){if(!entry.painter)entry.painter=pool.make(channel,value.tracks||[]);else entry.painter.update(value.tracks||[]);}else if(entry.painter){pool.drop(entry.painter);entry.painter=null;}win.dispatchEvent(new CustomEvent('xpace:playlist',{detail:{id}}));});return entry;
 }
 function get(id){const entry=entries.get(id);if(!entry?.claimed)return null;const data=entry.value.data,item=entry.painter?.track();if(!data)return {id:'context-pending',title:entry.value.error?'Playlist no disponible':'Consultando playlist',kind:'empty',url:'',contextScoped:true,empty:true,state:entry.value.error?'error':'empty',source:'venue',total:0,index:-1};return {id:item?.id||'context-empty',title:item?.title||'',kind:item?.kind||'empty',url:item?.url||'',playlistId:data.binding.id,scheduled:true,contextScoped:true,revision:data.revision,empty:!item,state:!item?'empty':entry.painter?.sequence.state().playing?'live':'paused',total:entry.value.tracks.length,index:entry.painter?.sequence.state().index||0,source:'venue',media:entry.painter?.video||null};}
 function draw(ctx,w,h,id){const entry=entries.get(id);if(!entry?.claimed)return false;const painter=entry.painter;if(painter?.track()&&pool.paint(painter,ctx,w,h))return true;ctx.save();ctx.fillStyle='#10262a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#def4ed';ctx.font=Math.max(10,Math.round(w/18))+'px sans-serif';ctx.textAlign='center';ctx.fillText(entry.value.error?'Playlist no disponible':entry.value.data?.empty?'Playlist vacía':'Consultando playlist',w/2,h/2,w*.9);ctx.restore();return true;}
 function playlist(playlistId){const entry=[...entries.values()].find(entry=>entry.value?.data?.binding?.id===playlistId);return entry?{title:'Playlist · '+(entry.value.data.venue?.name||entry.value.scope.venueId),tracks:entry.value.tracks}:null;}
 function control(id,action,trackId){const sequence=ensure(id)?.painter?.sequence;if(!sequence)throw Error('Playlist pendiente de consulta');const value=sequence.state(),tracks=entries.get(id).value.tracks;if(action==='jump')return sequence.jump(trackId);if(action==='toggle')return value.playing?sequence.pause():sequence.play();if(tracks.length)return sequence.jump(tracks[(value.index+(action==='prev'?-1:1)+tracks.length)%tracks.length].id);}
 const buckets=()=>[...entries.values()].filter(entry=>entry.claimed).map(entry=>{const state=entry.painter?.sequence.state(),track=entry.painter?.track();return {playlistId:entry.value.data?.binding.id||'context-pending-'+entry.id,deviceIds:[entry.id],trackId:track?.id||'',url:track?.url||'',playing:!!state?.playing,index:state?.index||0,count:entry.value.tracks?.length||0};});
 runtime={ensure,get,draw,buckets,playlist,control,entries,dispose(){for(const entry of entries.values())entry.unsubscribe();entries.clear();pool.dispose();}};win.addEventListener('pagehide',runtime.dispose,{once:true});return runtime;
}
