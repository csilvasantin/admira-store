import {contextPlaylist,playlistContext} from './context-playlist-client.mjs?v=local-playlist-349';
import {mountContextPlaylistEditor} from './context-playlist-editor.mjs?v=local-playlist-349';
import {contextSurfaces,channelForSurface,mountSurfacePlaylistRemote} from './context-surfaces.mjs?v=local-playlist-349';
import {starbucksMusic} from './starbucks-music.mjs?v=local-playlist-349';
import {stockSelections} from './stock-identifiers.mjs?v=local-playlist-349';
const win=window,doc=win.document,t=(es,en)=>doc.documentElement.lang==='en'?en:es;
const initialScope=JSON.stringify(playlistContext(win.location.href)),initialSelections={music:stockSelections(win.XpaceOptionsPlayback?.state?.('music')?.tracks),screens:stockSelections(win.XpaceOptionsPlayback?.state?.('screens')?.tracks)};
const initialSelection=channel=>initialScope===JSON.stringify(playlistContext(win.location.href))?initialSelections[channel==='music'?'music':'screens']:[];
starbucksMusic();
const surfaces=contextSurfaces(win),media=win.XpaceScreenMedia;if(media?.setLocalSchedule)media.setLocalSchedule(surfaces);
const options=doc.querySelector('[data-options-playlist="music"] .options-playlist-body');
if(options){const editor=mountContextPlaylistEditor(options,{client:contextPlaylist('music'),t});editor.setInitialStockSelection(initialSelection('music'));const list=options.querySelector(':scope > ol');if(list)list.hidden=true;}
let screenIds=[],selectedScreen='';
const screenOptions=doc.querySelector('[data-options-playlist="screens"] .options-playlist-body');
if(screenOptions){const select=doc.createElement('select'),host=doc.createElement('div');select.setAttribute('aria-label',t('Pantalla de este establecimiento','Screen in this venue'));screenOptions.append(select,host);let editor,signature='';const choose=()=>{selectedScreen=select.value;editor?.dispose();if(!selectedScreen)return;surfaces.ensure(selectedScreen);editor=mountContextPlaylistEditor(host,{client:contextPlaylist(channelForSurface(selectedScreen)),t});editor.setInitialStockSelection(initialSelection('screens'));};select.addEventListener('change',choose);contextPlaylist('music').subscribe(state=>{const renderer=state.data?.renderer,ids=renderer==='starbucks'?Array.from({length:6},(_,i)=>'starbucks-wall-0'+(i+1)):['xtanco','office','lab','cafeteria','sneakers-store'].includes(renderer)?['ds1','ds2','escaparate','metahuman']:[],next=JSON.stringify([state.scope,ids]);if(next===signature)return;signature=next;screenIds=ids;editor?.dispose();editor=null;host.replaceChildren();selectedScreen=ids.includes(selectedScreen)?selectedScreen:ids[0]||'';select.replaceChildren(...ids.map(id=>new Option(id,id)));select.value=selectedScreen;select.disabled=!ids.length;if(ids.length)choose();else host.textContent=t('Selecciona un establecimiento con superficies registradas.','Choose a venue with registered surfaces.');});}
let detailRemote=null;
win.addEventListener('xpace:device-detail',event=>{detailRemote?.dispose();detailRemote=null;const {id,host}=event.detail||{};if(!host||!channelForSurface(id))return;surfaces.ensure(id);detailRemote=mountSurfacePlaylistRemote(host,id,{t,win});});
// Matrix's existing calibration remains the geometry owner. A local playlist is
// painted inside that same viewport, below incidents/checkout and above base media.
const mounted=new WeakMap();let frame=0,disposed=false;
function render(){
 if(disposed)return;
 for(const host of doc.querySelectorAll('.matrix-mapped-player[data-device-id]')){
  const id=host.dataset.deviceId,channel=channelForSurface(id);if(!channel||channel==='music')continue;surfaces.ensure(id);let item=mounted.get(host);
  if(!item){const canvas=doc.createElement('canvas');canvas.className='context-surface-canvas';canvas.width=360;canvas.height=640;canvas.dataset.contextSurface=id;host.append(canvas);item={canvas,ctx:canvas.getContext('2d')};mounted.set(host,item);}
  const blocked=host.classList.contains('device-off')||!!host.querySelector('.matrix-incident-chip,.matrix-pos-checkout,.retail-reaction-media');item.canvas.hidden=blocked||win.XpaceScreenMedia?.previewed?.(id)||win.XpaceSignageAdapter?.screenPreview?.(id)||!surfaces.get(id);if(!item.canvas.hidden)surfaces.draw(item.ctx,item.canvas.width,item.canvas.height,id);
 }
 frame=win.requestAnimationFrame(render);
}render();
win.addEventListener('pagehide',()=>{disposed=true;win.cancelAnimationFrame(frame);detailRemote?.dispose();},{once:true});
win.XpaceContextPlaylists=Object.freeze({client:channel=>contextPlaylist(channel),scope:()=>playlistContext(win.location.href),initialSelection,surfaces,screenIds:()=>screenIds,selectedScreen:()=>selectedScreen,mountRemote:(host,id,opts={})=>mountSurfacePlaylistRemote(host,id,{t,win,...opts})});
