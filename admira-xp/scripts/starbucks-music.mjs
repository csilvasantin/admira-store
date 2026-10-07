import {STARBUCKS_PUBLISHED_TRACKS} from './starbucks-playlist.mjs?v=devices-1';
export const STARBUCKS_STORE='starbucks-alsea-paseo-de-gracia';
export const STARBUCKS_FEED=`https://api.admira.store/hilomusical/next?store=${STARBUCKS_STORE}&since=0`;
// Physical wall speaker, above and to the left of the emergency-exit sign.
export const STARBUCKS_SPEAKER={yaw:-126.12658,pitch:9.74027};
export const STARBUCKS_EXIT={yaw:-129.314172,pitch:7.892714};
export const STARBUCKS_MUSIC_EVENT='xpaceos:starbucks-music';

export function musicTracks(value){
  if(!Array.isArray(value))return [];
  const seen=new Set();
  return value.flatMap(item=>{
    try{
      const url=new URL(item.url);
      if(url.protocol!=='https:'||url.username||url.password||seen.has(url.href))return [];
      seen.add(url.href);
      return [{url:url.href,title:String(item.title||'Starbucks · Alsea').slice(0,160)}];
    }catch{return [];}
  }).slice(0,100);
}

// One transport per page. Mute changes audibility, never transport position.
// Kept separate from the game's bgMusic, whose mute action pauses playback.
export function createStarbucksMusic({audio,publishedTracks=[],fetchFeed=()=>fetch(STARBUCKS_FEED,{cache:'no-store'})}={}){
  const published=musicTracks(publishedTracks);
  let tracks=[...published],index=0,started=false,loading=false,error='',request=null,disposed=false,seeded=false;
  let managed=false,suppressions=0,resumeAfter=false;
  let playVersion=0,revision=0,reason='initial',lastClockEmit=0;
  const listeners=new Set(),failed=new Set();
  audio.preload='metadata';audio.loop=false;audio.muted=true;audio.volume=.35;
  const state=()=>({schemaVersion:1,store:STARBUCKS_STORE,managed,suppressed:suppressions>0,tracks:tracks.length,index,title:tracks[index]?.title||'',url:tracks[index]?.url||'',position:Number.isFinite(audio.currentTime)?audio.currentTime:0,playing:started&&!audio.paused,started,muted:audio.muted,loading,error,revision,reason,updatedAt:Date.now()});
  const emit=()=>{for(const fn of listeners)fn(state());};
  async function play(){
    // Prioridad de las locuciones (Carlos, 7-oct-2026): con un aviso sonando la música no arranca; queda
    // apuntada para seguir cuando el aviso termine.
    if(suppressions>0){resumeAfter=true;emit();return;}
    const version=++playVersion;
    try{await audio.play();if(disposed||version!==playVersion)return;error='';emit();}
    catch{if(disposed||version!==playVersion)return;started=false;audio.muted=true;error='play';emit();}
  }
  function select(next,cause='select'){index=next;revision++;reason=cause;audio.src=tracks[index].url;audio.load();}
  function advance(manual=false){
    if(disposed||!tracks.length||(!manual&&!started))return false;
    if(manual){failed.clear();error='';started=true;}
    select((index+1)%tracks.length,manual?'next':'ended');void play();emit();return true;
  }
  const ended=()=>advance(false);
  const clock=()=>{const now=Date.now();if(!disposed&&now-lastClockEmit>=1000){lastClockEmit=now;emit();}};
  function mediaError(){
    if(disposed||!tracks.length)return;
    failed.add(tracks[index].url);
    const nextIndex=tracks.findIndex((t,i)=>i!==index&&!failed.has(t.url));
    if(started&&nextIndex>=0){select(nextIndex);void play();}
    else{++playVersion;started=false;audio.muted=true;error='media';}
    emit();
  }
  audio.addEventListener('ended',ended);audio.addEventListener('error',mediaError);audio.addEventListener('timeupdate',clock);
  return {
    state,
    getTracks:()=>tracks.map(t=>({...t})),
    async jump(url){const next=tracks.findIndex(t=>t.url===url);if(next<0)throw Error('Unknown track');failed.clear();error='';started=true;select(next,'jump');await play();emit();return state();},
    suppress(){
      // La locución tiene prioridad: el hilo musical se PARA (antes seguía avanzando a volumen cero) y,
      // al terminar, sigue en el mismo punto si estaba sonando. Los avisos anidados sólo lo reanudan al soltarse el último.
      if(suppressions++===0){resumeAfter=started&&!audio.paused;if(resumeAfter){++playVersion;audio.pause();}}emit();let released=false;
      return ()=>{if(released)return;released=true;suppressions=Math.max(0,suppressions-1);if(!suppressions&&!disposed){const resume=resumeAfter&&started;resumeAfter=false;if(resume)void play();}emit();};
    },
    replaceTracks(incoming){
      managed=true;const next=musicTracks(incoming),current=tracks[index]?.url,wasStarted=started;
      const kept=next.findIndex(t=>t.url===current);tracks=next;failed.clear();error='';
      if(kept>=0){index=kept;emit();return;}
      ++playVersion;audio.pause();index=Math.min(index,Math.max(0,tracks.length-1));
      if(!tracks.length){started=false;revision++;reason='playlist';audio.removeAttribute('src');audio.load();emit();return;}
      select(index,'playlist');if(wasStarted)void play();emit();
    },
    next:()=>advance(true),
    setActiveLang(lang){
      lang = lang === 'es' ? 'es' : 'en';
      const classify = (title)=>/\bES\b|español|Nyla|Prioridad|Flagship Tarde/i.test(String(title||'')) ? 'es'
        : (/\bEN\b|Deep House|Retail Morning|english/i.test(String(title||'')) ? 'en' : '');
      const preferred = tracks.map((t,i)=>({t,i})).filter(x=>classify(x.t.title)===lang);
      if(!preferred.length){emit();return state();}
      const wasStarted=started; select(preferred[0].i,'lang'); if(wasStarted) void play(); emit(); return state();
    },

    subscribe(fn){listeners.add(fn);fn(state());return ()=>listeners.delete(fn);},
    refresh(){
      if(request||disposed||managed)return request;
      loading=true;emit();
      request=(async()=>{
        try{
          const response=await fetchFeed();if(!response.ok)throw Error('feed');
          const data=await response.json();if(data.ok===false)throw Error('feed');
          const feed=musicTracks(data.playlist);let incoming=musicTracks([...published,...feed]);if(disposed||managed)return;
          if(globalThis.XpaceMediaOptions){for(const item of data.playlist||[])if(!tracks.some(t=>t.url===item.url))try{globalThis.XpaceMediaOptions.stage('music',item,{created:seeded});}catch{}seeded=true;incoming=musicTracks([...published,...tracks]);}
          // An empty/transient response must not cut off a playing song.
          if(incoming.length){
            const current=tracks[index]?.url,kept=incoming.findIndex(t=>t.url===current);
            tracks=kept<0&&started&&current?[tracks[index],...incoming]:incoming;
            index=kept>=0?kept:0;
            if(!started&&current!==tracks[index].url)select(index);
          }
          if(error==='feed')error='';
        }catch{if(!disposed)error='feed';}
        finally{loading=false;request=null;if(!disposed)emit();}
      })();return request;
    },
    toggle(){
      if(disposed)return;
      if(!tracks.length){void this.refresh();emit();return;}
      if(started){audio.muted=!audio.muted;emit();return;}
      const retry=!!error;failed.clear();started=true;error='';audio.muted=false;
      // Called synchronously by a real click so browsers can grant audio.
      if(retry||audio.src!==tracks[index].url)select(index,'start');
      void play();emit();
    },
    mute(){audio.muted=true;emit();},
    dispose(){disposed=true;++playVersion;audio.pause();audio.removeAttribute('src');audio.load();audio.removeEventListener('ended',ended);audio.removeEventListener('timeupdate',clock);audio.removeEventListener('error',mediaError);listeners.clear();}
  };
}

let shared;
export function starbucksMusic(){
  if(!shared){
    const audio=new Audio();audio.id='starbucksMusic';audio.hidden=true;document.body.append(audio);
    shared=createStarbucksMusic({audio,publishedTracks:STARBUCKS_PUBLISHED_TRACKS});
    // Local contract for the PlayerTaza bridge; no remote/hardware acknowledgement implied.
    window.XpaceStarbucksMusic=Object.freeze({getState:shared.state,subscribe:fn=>shared.subscribe(fn),next:()=>shared.next()});
    shared.subscribe(state=>window.dispatchEvent(new CustomEvent(STARBUCKS_MUSIC_EVENT,{detail:state})));
    window.addEventListener('pagehide',()=>shared.mute());
  }
  return shared;
}
