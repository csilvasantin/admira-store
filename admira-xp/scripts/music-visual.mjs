import {musicVisualPolicy} from './music-artwork.mjs?v=tpv-portrait-20261015';
import {starbucksMusic} from './starbucks-music.mjs?v=tpv-portrait-20261015';
export const TPV_MUSIC_ID='starbucks-tpv-01';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function musicCoverSvg(title,{artwork=false}={}){const words=String(title||'').replace(/#[\p{L}\p{N}_-]+/gu,'').replace(/\(Stock\s+\d+\)/gi,'').replace(/\s+/g,' ').trim().split(/\s+/),lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>27&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640"><rect width="360" height="640" fill="#1e3932"/>'+(artwork?'': '<circle cx="180" cy="225" r="115" fill="#00704a"/><circle cx="180" cy="225" r="65" fill="#f2f0eb"/><circle cx="180" cy="225" r="12" fill="#1e3932"/>')+'<text x="180" y="408" fill="#f2f0eb" text-anchor="middle" font-family="Arial,sans-serif" font-size="20">STARBUCKS</text><text x="180" y="440" fill="#b5d5c5" text-anchor="middle" font-family="Arial,sans-serif" font-size="13">HILO MUSICAL · MUSIC</text><text fill="#fff" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">'+lines.slice(0,5).map((text,i)=>'<tspan x="180" y="'+(490+i*25)+'">'+esc(text)+'</tspan>').join('')+'</text></svg>';}
export const cleanMusicTitle=title=>String(title||'').replace(/#[\p{L}\p{N}_-]+/gu,'').replace(/\(Stock\s+\d+\)/gi,'').replace(/^(?:ES|EN)\s*·\s*/,'').replace(/\s+/g,' ').trim();
export function musicCaptionLines(title){const lines=[];let line='';for(const word of cleanMusicTitle(title).split(/\s+/)){if((line+' '+word).trim().length>23&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return lines.slice(0,3);}
export function blackMusicFrame(pixels){let dark=0,total=pixels.length/4;if(!total)return true;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<12&&pixels[i+1]<12&&pixels[i+2]<12)dark++;return dark/total>=.98;}
const safe=value=>{try{const u=new URL(value);return ['https:','data:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
export function createMusicVisual({music,doc=globalThis.document,win=globalThis}={}){
 const make=tag=>doc.createElement(tag),root=make('div'),fallback=make('img'),cover=make('img'),video=make('video'),caption=make('div'),captionScope=make('small'),captionTitle=make('strong'),probe=make('canvas');
 root.className='matrix-music-visual';root.dataset.musicVisual='true';root.style.cssText='position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;background:#1e3932';
 for(const img of [fallback,cover]){img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';img.crossOrigin='anonymous';}
 cover.hidden=true;video.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:transparent';video.hidden=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';video.crossOrigin='anonymous';video.loop=false;
 caption.className='matrix-music-caption';caption.style.cssText='position:absolute;inset:0;box-sizing:border-box;flex-direction:column;justify-content:flex-end;gap:10px;padding:28px 24px;background:linear-gradient(transparent 40%,rgba(0,0,0,.92));color:#fff;font:600 24px/1.25 Arial,sans-serif;pointer-events:none';captionTitle.style.cssText='font:inherit;color:#fff;text-shadow:0 2px 8px #000;white-space:normal;overflow-wrap:anywhere';captionScope.style.cssText='font-size:11px;letter-spacing:.06em';captionScope.textContent='STARBUCKS · HILO MUSICAL';caption.append(captionScope,captionTitle);root.append(fallback,cover,caption,video);probe.width=probe.height=16;const sampleContext=probe.getContext('2d',{willReadFrequently:true});
 let enabled=true,generation=0,disposed=false,current=null,key='',state=music.state(),showVideo=false,failed=false,coverLoaded=false,dimensions={},frameHandle=0,usingVideoFrames=false;
 const policy=()=>musicVisualPolicy(current,dimensions);
 const usesVideo=()=>policy().mode==='portrait-video';
 function visible(value){showVideo=value;video.hidden=!value;fallback.hidden=value||coverLoaded;cover.hidden=value||!coverLoaded;caption.hidden=value||!coverLoaded;caption.style.display=value||!coverLoaded?'none':'flex';root.dataset.coverVisible=String(!value);}
 function cancelFrame(){if(!frameHandle)return;usingVideoFrames?video.cancelVideoFrameCallback?.(frameHandle):win.cancelAnimationFrame?.(frameHandle);frameHandle=0;}
 function describe(){const p=policy();root.dataset.visualMode=p.mode;root.dataset.sourceOrientation=p.orientation;root.dataset.videoFit=usesVideo()?'cover':'none';video.style.objectFit='cover';}
 function readDimensions(){
  if(video.getAttribute('src')&&video.readyState>=1&&video.videoWidth>0&&video.videoHeight>0)dimensions={width:video.videoWidth,height:video.videoHeight};describe();
  // Keep the measured dimensions after releasing a landscape metadata probe. It never becomes a playing layer.
  if(policy().orientation==='landscape'&&video.getAttribute('src')){video.pause();cancelFrame();video.removeAttribute('src');video.load();visible(false);}
 }
 function sample(){
  readDimensions();
  if(disposed||!current||!usesVideo()||failed||video.ended||(Number.isFinite(video.duration)&&video.duration>0&&video.duration-video.currentTime<=2)||video.readyState<2||!video.videoWidth){visible(false);return;}
  try{sampleContext.drawImage(video,0,0,16,16);visible(!blackMusicFrame(sampleContext.getImageData(0,0,16,16).data));}catch{visible(false);}
 }
 function frame(){frameHandle=0;if(disposed)return;sample();if(state.playing&&!state.suppressed&&usesVideo())scheduleFrame();}
 function scheduleFrame(){if(frameHandle||disposed)return;if(video.requestVideoFrameCallback){usingVideoFrames=true;frameHandle=video.requestVideoFrameCallback(frame);}else{usingVideoFrames=false;frameHandle=win.requestAnimationFrame?.(frame)||0;}}
 function select(track){
  generation++;cancelFrame();current=track;dimensions={width:track?.width||0,height:track?.height||0};failed=false;coverLoaded=false;visible(false);video.pause();video.muted=true;video.removeAttribute('src');video.load();cover.removeAttribute('src');
  const p=policy(),coverUrl=safe(p.url);describe();fallback.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(musicCoverSvg(p.title,{artwork:!!coverUrl}));fallback.alt=p.title+' · carátula editorial';
  const scale=1/(1-2*p.matte);cover.style.cssText='position:absolute;left:0;top:'+(-p.matte*scale*100)+'%;width:100%;height:'+(scale*100)+'%;object-fit:cover;object-position:'+(p.focusX*100)+'% '+(p.focusY*100)+'%';cover.alt=p.title+' · portada de la fuente';captionTitle.textContent=cleanMusicTitle(p.title);if(coverUrl)cover.src=coverUrl;
  // Unknown orientation is probed while hidden and paused. Only a verified portrait video may play.
  if(track?.kind==='video'&&p.orientation!=='landscape'){video.preload='metadata';video.src=safe(track.visualUrl||track.url);video.load();}
 }
 function sync(value=music.state()){
  if(disposed)return;state=value;const track=music.getTracks().find(t=>t.url===value.url)||null,next=track?JSON.stringify([track.id||track.url,track.url,track.kind,track.cover,track.width,track.height]):'';
  if(next!==key){key=next;select(track);}
  root.dataset.trackId=track?.id||track?.url||'';root.dataset.trackKind=track?.kind||'';root.dataset.musicState=value.suppressed?'suppressed':value.playing?'playing':'paused';readDimensions();
  if(!usesVideo()){video.pause();cancelFrame();visible(false);return;}if(!enabled){video.pause();cancelFrame();return;}
  video.muted=true;
  if(video.readyState>=1&&Number.isFinite(value.position)&&Math.abs(video.currentTime-value.position)>.35)try{video.currentTime=value.position;}catch{}
  if(value.playing&&!value.suppressed&&!failed&&!video.ended){if(video.paused){const ticket=generation;Promise.resolve(video.play()).catch(()=>{if(ticket===generation&&!disposed){failed=true;visible(false);}});}scheduleFrame();}
  else{video.pause();cancelFrame();}sample();
 }
 cover.addEventListener('load',()=>{if(!disposed&&cover.naturalWidth){coverLoaded=true;visible(showVideo);}});cover.addEventListener('error',()=>{coverLoaded=false;visible(showVideo);});
 video.addEventListener('loadedmetadata',()=>{readDimensions();sync();});video.addEventListener('loadeddata',()=>{sample();sync();});video.addEventListener('error',()=>{if(!video.getAttribute('src'))return;failed=true;visible(false);cancelFrame();});video.addEventListener('ended',()=>{visible(false);cancelFrame();});
 select(null);const unsubscribe=music.subscribe(sync),timer=win.setInterval(()=>sync(),500);
 return {
  node:root,video,cover,fallback,caption,sync,sample,setEnabled(value){enabled=value!==false;sync();},
  attach(host){if(disposed||!host)return;if(root.parentNode!==host)host.append(root);},detach(){root.remove();},
  state:()=>({id:TPV_MUSIC_ID,trackId:current?.id||current?.url||'',title:current?.title||'',kind:current?.kind||'',position:state.position||0,playing:enabled&&!!state.playing&&!state.suppressed,muted:true,cover:!showVideo,source:'iphone17-mupi'}),
  draw(ctx,w,h){if(disposed)return false;ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();ctx.fillStyle='#1e3932';ctx.fillRect(0,0,w,h);
   if(showVideo){const sw=video.videoWidth,sh=video.videoHeight,fit=Math.max(w/sw,h/sh);ctx.drawImage(video,(w-sw*fit)/2,(h-sh*fit)/2,sw*fit,sh*fit);}
   else{
    const hasCover=coverLoaded&&cover.complete&&cover.naturalWidth;
    if(!hasCover&&fallback.complete&&fallback.naturalWidth)ctx.drawImage(fallback,0,0,w,h);else if(!hasCover){ctx.fillStyle='#f2f0eb';ctx.font='bold '+Math.max(14,w/14)+'px sans-serif';ctx.fillText('STARBUCKS · HILO MUSICAL',w*.05,h*.4,w*.9);ctx.fillText(policy().title,w*.05,h*.52,w*.9);}
    if(hasCover){const sw=cover.naturalWidth,sh=cover.naturalHeight,p=policy(),sy=sh*p.matte,ch=sh*(1-2*p.matte),fit=Math.max(w/sw,h/ch),dw=sw*fit,dh=ch*fit;
     ctx.drawImage(cover,0,sy,sw,ch,(w-dw)*p.focusX,(h-dh)*p.focusY,dw,dh);
     const gradient=ctx.createLinearGradient(0,h*.4,0,h);gradient.addColorStop(0,'rgba(0,0,0,0)');gradient.addColorStop(1,'rgba(0,0,0,.92)');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.font='600 '+(w*.031)+'px Arial,sans-serif';ctx.fillText('STARBUCKS · HILO MUSICAL',w*.067,h*.80,w*.866);ctx.font='600 '+(w*.067)+'px Arial,sans-serif';musicCaptionLines(p.title).forEach((line,i)=>ctx.fillText(line,w*.067,h*.86+i*h*.047,w*.866));
    }
   }ctx.restore();return true;},
  dispose(){if(disposed)return;disposed=true;unsubscribe();win.clearInterval(timer);cancelFrame();video.pause();video.removeAttribute('src');video.load();root.remove();}
 };
}
let shared=null,refs=0;
export function acquireMusicVisual(){shared??=createMusicVisual({music:starbucksMusic()});refs++;const visual=shared;let released=false;return {visual,release(){if(released)return;released=true;if(--refs===0){visual.dispose();shared=null;}}};}
