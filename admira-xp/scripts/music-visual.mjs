import {starbucksMusic} from './starbucks-music.mjs?v=shared-music-20261015';
export const TPV_MUSIC_ID='starbucks-tpv-01';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function musicCoverSvg(title){const words=String(title||'').replace(/#[\p{L}\p{N}_-]+/gu,'').replace(/\(Stock\s+\d+\)/gi,'').replace(/\s+/g,' ').trim().split(/\s+/),lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>27&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640"><rect width="360" height="640" fill="#1e3932"/><circle cx="180" cy="225" r="115" fill="#00704a"/><circle cx="180" cy="225" r="65" fill="#f2f0eb"/><circle cx="180" cy="225" r="12" fill="#1e3932"/><text x="180" y="408" fill="#f2f0eb" text-anchor="middle" font-family="Arial,sans-serif" font-size="20">STARBUCKS</text><text x="180" y="440" fill="#b5d5c5" text-anchor="middle" font-family="Arial,sans-serif" font-size="13">HILO MUSICAL · MUSIC</text><text fill="#fff" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">'+lines.slice(0,5).map((text,i)=>'<tspan x="180" y="'+(490+i*25)+'">'+esc(text)+'</tspan>').join('')+'</text></svg>';}
export function blackMusicFrame(pixels){let dark=0,total=pixels.length/4;if(!total)return true;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<12&&pixels[i+1]<12&&pixels[i+2]<12)dark++;return dark/total>=.98;}
const safe=value=>{try{const u=new URL(value);return ['https:','data:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
export function createMusicVisual({music,doc=globalThis.document,win=globalThis}={}){
 const make=tag=>doc.createElement(tag),root=make('div'),fallback=make('img'),cover=make('img'),video=make('video'),probe=make('canvas');
 root.className='matrix-music-visual';root.dataset.musicVisual='true';root.style.cssText='position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;background:#1e3932';
 for(const img of [fallback,cover]){img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';img.crossOrigin='anonymous';}
 cover.hidden=true;video.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:transparent';video.hidden=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.crossOrigin='anonymous';video.loop=false;
 root.append(fallback,cover,video);probe.width=probe.height=16;const sampleContext=probe.getContext('2d',{willReadFrequently:true});
 let enabled=true,generation=0,disposed=false,current=null,key='',state=music.state(),showVideo=false,failed=false,frameHandle=0,usingVideoFrames=false;
 function visible(value){showVideo=value;video.hidden=!value;root.dataset.coverVisible=String(!value);}
 function cancelFrame(){if(!frameHandle)return;usingVideoFrames?video.cancelVideoFrameCallback?.(frameHandle):win.cancelAnimationFrame?.(frameHandle);frameHandle=0;}
 function sample(){
  if(disposed||!current||current.kind!=='video'||failed||video.ended||(Number.isFinite(video.duration)&&video.duration>0&&video.duration-video.currentTime<=2)||video.readyState<2||!video.videoWidth){visible(false);return;}
  try{sampleContext.drawImage(video,0,0,16,16);visible(!blackMusicFrame(sampleContext.getImageData(0,0,16,16).data));}catch{visible(false);}
 }
 function frame(){frameHandle=0;if(disposed)return;sample();if(state.playing&&!state.suppressed&&current?.kind==='video')scheduleFrame();}
 function scheduleFrame(){if(frameHandle||disposed)return;if(video.requestVideoFrameCallback){usingVideoFrames=true;frameHandle=video.requestVideoFrameCallback(frame);}else{usingVideoFrames=false;frameHandle=win.requestAnimationFrame?.(frame)||0;}}
 function select(track){
  generation++;cancelFrame();current=track;failed=false;visible(false);video.pause();video.muted=true;video.removeAttribute('src');video.load();cover.hidden=true;cover.removeAttribute('src');
  const title=track?.title||'Starbucks · hilo musical';fallback.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(musicCoverSvg(title));fallback.alt=title+' · carátula editorial';
  const artwork=safe(track?.cover);if(artwork)cover.src=artwork;
  if(track?.kind==='video'){video.src=safe(track.visualUrl||track.url);video.load();}
 }
 function sync(value=music.state()){
  if(disposed)return;state=value;const track=music.getTracks().find(t=>t.url===value.url)||null,next=track?JSON.stringify([track.id||track.url,track.url,track.kind,track.cover]):'';
  if(next!==key){key=next;select(track);}
  root.dataset.trackId=track?.id||track?.url||'';root.dataset.trackKind=track?.kind||'';root.dataset.musicState=value.suppressed?'suppressed':value.playing?'playing':'paused';
  if(track?.kind!=='video')return;if(!enabled){video.pause();cancelFrame();return;}
  video.muted=true;
  if(video.readyState>=1&&Number.isFinite(value.position)&&Math.abs(video.currentTime-value.position)>.35)try{video.currentTime=value.position;}catch{}
  if(value.playing&&!value.suppressed&&!failed&&!video.ended){if(video.paused){const ticket=generation;Promise.resolve(video.play()).catch(()=>{if(ticket===generation&&!disposed){failed=true;visible(false);}});}scheduleFrame();}
  else{video.pause();cancelFrame();}sample();
 }
 cover.addEventListener('load',()=>{if(!disposed&&cover.naturalWidth)cover.hidden=false;});cover.addEventListener('error',()=>{cover.hidden=true;});
 video.addEventListener('loadeddata',()=>{sample();sync();});video.addEventListener('error',()=>{failed=true;visible(false);cancelFrame();});video.addEventListener('ended',()=>{visible(false);cancelFrame();});
 select(null);const unsubscribe=music.subscribe(sync),timer=win.setInterval(()=>sync(),500);
 return {
  node:root,video,cover,fallback,sync,sample,setEnabled(value){enabled=value!==false;sync();},
  attach(host){if(disposed||!host)return;if(root.parentNode!==host)host.append(root);},detach(){root.remove();},
  state:()=>({id:TPV_MUSIC_ID,trackId:current?.id||current?.url||'',title:current?.title||'',kind:current?.kind||'',position:state.position||0,playing:enabled&&!!state.playing&&!state.suppressed,muted:true,cover:!showVideo,source:'iphone17-mupi'}),
  draw(ctx,w,h){if(disposed)return false;ctx.save();ctx.fillStyle='#1e3932';ctx.fillRect(0,0,w,h);const art=!cover.hidden&&cover.complete&&cover.naturalWidth?cover:fallback;
   if(art.complete&&art.naturalWidth)ctx.drawImage(art,0,0,w,h);else{ctx.fillStyle='#f2f0eb';ctx.font='bold '+Math.max(14,w/14)+'px sans-serif';ctx.fillText('STARBUCKS · HILO MUSICAL',w*.05,h*.4,w*.9);ctx.fillText(current?.title||'Cargando / Loading',w*.05,h*.52,w*.9);}
   if(showVideo){const sw=video.videoWidth,sh=video.videoHeight,fit=Math.min(w/sw,h/sh);ctx.drawImage(video,(w-sw*fit)/2,(h-sh*fit)/2,sw*fit,sh*fit);}ctx.restore();return true;},
  dispose(){if(disposed)return;disposed=true;unsubscribe();win.clearInterval(timer);cancelFrame();video.pause();video.removeAttribute('src');video.load();root.remove();}
 };
}
let shared=null,refs=0;
export function acquireMusicVisual(){shared??=createMusicVisual({music:starbucksMusic()});refs++;const visual=shared;let released=false;return {visual,release(){if(released)return;released=true;if(--refs===0){visual.dispose();shared=null;}}};}
