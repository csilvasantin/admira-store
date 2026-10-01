// All virtual screens follow the first video's clock; no audio output or physical writes.
export function createScreenPlaylist({videos,tracks,initialURL,loop=true,onState=()=>{}}){
 let index=Math.max(0,tracks.findIndex(t=>t.url===initialURL)),disposed=false,playing=false,error=false,generation=0,finished=false;
 const emit=()=>onState({playing,error,index,count:videos.length,title:tracks[index]?.title||''});
 for(const v of videos){v.muted=true;v.playsInline=true;v.loop=false;v.preload='auto';}
 const sync=()=>{const lead=videos[0];if(!playing||!lead||lead.readyState<2)return;for(const v of videos.slice(1)){if(v.readyState>=2&&Math.abs(v.currentTime-lead.currentTime)>.2)v.currentTime=lead.currentTime;}};
 const timer=setInterval(sync,500);
 async function play(){
  if(disposed||!tracks.length||!videos.length)return;
  if(finished){index=0;finished=false;for(const v of videos){v.src=tracks[0].url;v.load();}}
  const ticket=++generation;error=false;playing=false;emit();
  for(const v of videos)if(v.getAttribute('src')!==tracks[index].url){v.src=tracks[index].url;v.load();}
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
 function pause(){++generation;playing=false;for(const v of videos)v.pause();emit();}
 const ended=()=>{if(!playing||disposed)return;if(!loop&&index===tracks.length-1){finished=true;pause();return;}index=(index+1)%tracks.length;for(const v of videos){v.src=tracks[index].url;v.load();}void play();};
 const failed=()=>{pause();error=true;emit();};
 videos[0]?.addEventListener('ended',ended);for(const v of videos)v.addEventListener('error',failed);
 emit();
 function replaceTracks(incoming){
  const current=tracks[index]?.url,wasPlaying=playing;tracks=[...incoming];
  const kept=tracks.findIndex(t=>t.url===current);if(kept>=0){index=kept;emit();return;}
  ++generation;index=Math.min(index,Math.max(0,tracks.length-1));
  for(const v of videos){v.pause();if(tracks.length)v.src=tracks[index].url;else v.removeAttribute('src');v.load();}
  playing=false;error=false;if(wasPlaying&&tracks.length)void play();else emit();
 }
 async function jump(trackId){
  const target=tracks.findIndex(t=>t.id===trackId||t.stockId===trackId);
  if(target<0)throw Error('Unknown track');
  pause();index=target;error=false;finished=false;
  for(const v of videos){v.src=tracks[index].url;v.load();}
  await play();return {playing,error,index};
 }
 return {play,pause,jump,replaceTracks,setLoop(value){loop=value!==false;},state:()=>({playing,error,index,loop,finished}),dispose(){disposed=true;++generation;clearInterval(timer);videos[0]?.removeEventListener('ended',ended);for(const v of videos){v.removeEventListener('error',failed);v.pause();}}};
}
