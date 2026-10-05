// All virtual screens follow the first video's clock; no audio output or physical writes.
export function createScreenPlaylist({videos,tracks,initialURL,loop=true,onState=()=>{},loadImage=url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=url;}),schedule=setTimeout,unschedule=clearTimeout}){
 let index=Math.max(0,tracks.findIndex(t=>t.url===initialURL)),disposed=false,playing=false,error=false,generation=0,finished=false;
 let imageTimer=null,imageRemaining=30000,imageStarted=0;
 const isImage=()=>tracks[index]?.kind==='image';
 function clearImage(){if(imageTimer!==null){imageRemaining=Math.max(0,imageRemaining-(Date.now()-imageStarted));unschedule(imageTimer);imageTimer=null;}}
 function loadTrack(){clearImage();imageRemaining=30000;for(const v of videos){v.pause();if(isImage()){v.removeAttribute('src');v.poster=tracks[index].url;}else{v.poster='';v.src=tracks[index]?.url||'';}v.load();}}
 const emit=()=>onState({playing,error,index,count:videos.length,title:tracks[index]?.title||''});
 for(const v of videos){v.muted=true;v.playsInline=true;v.loop=false;v.preload='auto';}
 const sync=()=>{const lead=videos[0];if(!playing||isImage()||!lead||lead.readyState<2)return;for(const v of videos.slice(1)){if(v.readyState>=2&&Math.abs(v.currentTime-lead.currentTime)>.2)v.currentTime=lead.currentTime;}};
 const timer=setInterval(sync,500);
 async function play(){
  if(disposed||!tracks.length||!videos.length)return;
  if(finished){index=0;finished=false;loadTrack();}
  clearImage();
  const ticket=++generation;error=false;playing=false;emit();
  if(isImage()){
   if(videos.some(v=>v.poster!==tracks[index].url))loadTrack();
   try{await loadImage(tracks[index].url);}catch{if(ticket===generation){error=true;emit();}return;}
   if(disposed||ticket!==generation)return;playing=true;imageStarted=Date.now();imageTimer=schedule(()=>{imageTimer=null;imageRemaining=30000;ended();},imageRemaining);emit();return;
  }
  for(const v of videos)if(v.getAttribute('src')!==tracks[index].url){v.poster='';v.src=tracks[index].url;v.load();}
  if(videos.some(v=>v.readyState<3)){
   const ready=await Promise.allSettled(videos.map(v=>v.readyState>=3?Promise.resolve():new Promise((resolve,reject)=>{const done=e=>{clearTimeout(timeout);v.removeEventListener('canplay',loaded);v.removeEventListener('error',failed);e?reject(e):resolve();};const loaded=()=>done(),failed=()=>done(Error('Video unavailable')),timeout=setTimeout(()=>done(Error('Video timeout')),20000);v.addEventListener('canplay',loaded,{once:true});v.addEventListener('error',failed,{once:true});})));
   if(disposed||ticket!==generation)return;if(ready.some(r=>r.status==='rejected')){error=true;videos.forEach(v=>v.pause());emit();return;}
  }
  const time=videos[0].currentTime;for(const v of videos.slice(1))if(Math.abs(v.currentTime-time)>.04)v.currentTime=time;
  const results=await Promise.allSettled(videos.map(v=>v.play()));
  if(disposed||ticket!==generation)return;
  error=results.some(r=>r.status==='rejected');playing=!error;
  if(error)for(const v of videos)v.pause();else sync();emit();
 }
 function pause(){clearImage();++generation;playing=false;for(const v of videos)v.pause();emit();}
 const ended=()=>{if(!playing||disposed)return;if(!loop&&index===tracks.length-1){finished=true;pause();return;}index=(index+1)%tracks.length;loadTrack();void play();};
 const failed=()=>{pause();error=true;emit();};
 videos[0]?.addEventListener('ended',ended);for(const v of videos)v.addEventListener('error',failed);
 emit();
 function replaceTracks(incoming){
  const current=tracks[index]?.url,wasPlaying=playing;tracks=[...incoming];
  const kept=tracks.findIndex(t=>t.url===current);if(kept>=0){index=kept;emit();return;}
  ++generation;index=Math.min(index,Math.max(0,tracks.length-1));
  if(tracks.length)loadTrack();else{clearImage();for(const v of videos){v.pause();v.poster='';v.removeAttribute('src');v.load();}}
  playing=false;error=false;if(wasPlaying&&tracks.length)void play();else emit();
 }
 async function jump(trackId){
  const target=tracks.findIndex(t=>t.id===trackId||t.stockId===trackId);
  if(target<0)throw Error('Unknown track');
  pause();index=target;error=false;finished=false;
  loadTrack();
  await play();return {playing,error,index};
 }
 return {play,pause,jump,replaceTracks,setLoop(value){loop=value!==false;},state:()=>({playing,error,index,loop,finished}),dispose(){clearImage();disposed=true;++generation;clearInterval(timer);videos[0]?.removeEventListener('ended',ended);for(const v of videos){v.removeEventListener('error',failed);v.pause();}}};
}
