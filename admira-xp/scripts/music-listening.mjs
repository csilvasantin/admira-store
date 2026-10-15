export const MUSIC_TPV_ID='starbucks-tpv-01';
const audible=state=>state.started&&!state.muted&&!state.suppressed;
// Call the shared owner synchronously inside the browser gesture, never a second audio element.
export function toggleMusicFromGesture(music,{win=globalThis,blocked=()=>false}={}){
 if(blocked()||win.dsMasterMute)return false;music.toggle();return true;
}
export function mountMusicListeningButton(host,{music,win=globalThis,blocked=()=>false,t=(es)=>es,signal}={}){
 const button=host.ownerDocument.createElement('button');button.type='button';button.className='matrix-tpv-listen';button.dataset.musicListen='tpv';
 const label=host.ownerDocument.createElement('span');button.append(label);host.append(button);
 const update=state=>{const on=audible(state),text=on?t('Silenciar hilo musical','Mute background music'):t('Escuchar hilo musical','Listen to background music');button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',text);button.title=text;label.textContent=on?'♪ '+t('Sonando','Playing'):'♪ '+t('Escuchar','Listen');};
 button.addEventListener('click',event=>{if(!toggleMusicFromGesture(music,{win,blocked}))return;event.preventDefault();event.stopPropagation();},{signal});
 const unsubscribe=music.subscribe(update);let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;unsubscribe();button.remove();};signal?.addEventListener('abort',dispose,{once:true});return {button,dispose};
}
// Canvas scenes keep their normal camera/checkout controls. A short click on the scheduled TPV is a music gesture.
export function installMusicCanvasGesture({music,win=globalThis,doc=win.document,isActive=()=>false}={}){
 let down=null;const controls=new AbortController(),options={capture:true,signal:controls.signal};
 const pointer=event=>{down={x:event.clientX,y:event.clientY,moved:false};};
 const move=event=>{if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>6)down.moved=true;};
 const click=event=>{const moved=down?.moved;down=null;if(moved||!isActive()||win.XpaceMatrixOptions||event.target?.tagName!=='CANVAS'||event.target.closest?.('.device-layout-active'))return;
  const api=win.XpaceHiperreal?.furniture||win.XpaceSceneScreens||win.XpaceOptionsPlayback;
  if(api?.screenAt?.(event.clientX,event.clientY)!==MUSIC_TPV_ID)return;
  // A preview, powered-off screen or app owns this surface ahead of the music base.
  if(win.XpaceScreenMedia?.get?.(MUSIC_TPV_ID)?.kind!=='music-visual'||win.XpaceScenePlaylists?.state?.().off?.includes(MUSIC_TPV_ID))return;
  if(toggleMusicFromGesture(music,{win})){event.preventDefault();event.stopPropagation();}
 };
 doc.addEventListener('pointerdown',pointer,options);doc.addEventListener('pointermove',move,options);doc.addEventListener('click',click,options);return ()=>controls.abort();
}
