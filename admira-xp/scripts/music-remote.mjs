import {toggleMusicFromGesture} from './music-listening.mjs?v=local-playlist-349';
import {mountContextPlaylistEditor} from './context-playlist-editor.mjs?v=local-playlist-349';
// Playback buttons control the twin’s web clock. The scoped editor persists TV
// associations separately, without issuing physical transport commands or ACKs.
export function mountMusicRemote(host,{music,win=globalThis,t=es=>es,blocked=()=>false,signal,onToggle=()=>{}}={}){
 const doc=host.ownerDocument,make=(tag,text)=>{const node=doc.createElement(tag);if(text)node.textContent=text;return node;};
 const details=make('details'),summary=make('summary'),body=make('div'),scope=make('p'),current=make('p'),status=make('p'),controls=make('div'),select=make('select'),launch=make('button'),previous=make('button'),listen=make('button'),next=make('button');
 details.className='music-remote';details.dataset.musicRemote='true';body.className='music-remote-body';controls.className='music-remote-controls';status.setAttribute('role','status');
 for(const button of [previous,listen,next,launch])button.type='button';select.setAttribute('aria-label',t('Playlist del hilo musical','Background music playlist'));
 previous.dataset.musicRemoteAction='previous';listen.dataset.musicRemoteAction='listen';next.dataset.musicRemoteAction='next';launch.dataset.musicRemoteAction='launch';
 controls.append(previous,listen,next);body.append(scope,current,controls,select,launch,status);details.append(summary,body);host.append(details);
 const editor=mountContextPlaylistEditor(body,{t,signal});
 editor.setInitialStockSelection?.(win.XpaceContextPlaylists?.initialSelection?.('music')||[]);
 let signature='',disposed=false;const label=()=>{summary.textContent=details.open?t('PLEGAR MANDO INTERACTIVO','COLLAPSE INTERACTIVE REMOTE'):t('DESPLEGAR MANDO INTERACTIVO','EXPAND INTERACTIVE REMOTE');};
 function update(state=music.state()){
  if(disposed)return;label();scope.textContent=t('Controles del gemelo · reloj web','Twin controls · web clock');current.textContent=state.title||t('Esperando playlist','Waiting for playlist');
  previous.textContent=t('Anterior','Previous');next.textContent=t('Siguiente','Next');launch.textContent=t('Lanzar pista','Launch track');const audible=state.started&&!state.muted&&!state.suppressed;
  listen.textContent=audible?t('Silenciar','Mute'):t('Escuchar','Listen');listen.setAttribute('aria-pressed',String(audible));
  status.textContent=win.dsMasterMute?t('Audio general silenciado','Master audio muted'):state.suppressed?t('Aviso activo · el hilo espera','Announcement active · music waits'):state.muted?t('Silenciado · la playlist continúa','Muted · playlist continues'):state.playing?t('Sonando en el gemelo','Playing in the twin'):t('Pulsa Escuchar para reanudar','Press Listen to resume');
  const elapsed=Math.max(0,Math.floor(state.position||0));status.textContent+=' · '+Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0')+' '+t('(tiempo web)','(web time)');
  const tracks=music.getTracks(),key=JSON.stringify(tracks.map(track=>[track.url,track.title]));if(key!==signature){signature=key;const value=select.value;select.replaceChildren(...tracks.map((track,i)=>{const option=make('option',(i+1)+'. '+track.title);option.value=track.url;return option;}));select.value=tracks.some(track=>track.url===value)?value:state.url||tracks[0]?.url||'';}
  for(const button of [previous,listen,next,launch])button.disabled=!tracks.length||blocked();select.disabled=!tracks.length||blocked();
 }
 function run(action){if(blocked()||disposed)return;try{const result=action();Promise.resolve(result).catch(error=>{status.textContent=error.message;});}catch(error){status.textContent=error.message;}}
 previous.addEventListener('click',()=>run(()=>{const tracks=music.getTracks(),index=tracks.findIndex(track=>track.url===music.state().url);if(tracks.length)return music.jump(tracks[(index+tracks.length-1)%tracks.length].url);}),{signal});
 next.addEventListener('click',()=>run(()=>music.next()),{signal});listen.addEventListener('click',()=>run(()=>toggleMusicFromGesture(music,{win,blocked})),{signal});launch.addEventListener('click',()=>run(()=>music.jump(select.value)),{signal});
 details.addEventListener('toggle',()=>{label();onToggle(details.open);update();},{signal});
 // The remote must not turn a button press into a camera drag or another TPV click.
 for(const type of ['pointerdown','pointerup','click','keydown','keyup','wheel'])details.addEventListener(type,event=>event.stopPropagation(),{signal});
 const unsubscribe=music.subscribe(update);const timer=win.setInterval(()=>update(),500);const dispose=()=>{if(disposed)return;disposed=true;unsubscribe();editor.dispose();win.clearInterval(timer);details.remove();};signal?.addEventListener('abort',dispose,{once:true});return {node:details,update,dispose,get open(){return details.open;}};
}
