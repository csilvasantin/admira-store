// Separate audition preserves the scheduled speaker track and playlist.
export const POS_DEMO_SONG=Object.freeze({id:'1790706121644-y5mqrq',stockNumber:1308,title:'Bad Times Deep House',url:'https://stock.admira.store/stock/1790706121644-y5mqrq/asset.mp4?v=35775129'});
export function createPOSDemoSound({audio,music,track=POS_DEMO_SONG,onEnded=()=>{}}={}){
 let generation=0,primed=Promise.resolve(),release=null;
 function stop(){generation++;release?.();release=null;audio.pause();audio.muted=true;audio.removeAttribute('src');audio.load();}
 const ended=()=>{release?.();release=null;onEnded();};audio.addEventListener('ended',ended);audio.addEventListener('error',ended);
 return {prepare(next=track){stop();const token=generation;audio.src=next.url;audio.muted=true;audio.volume=.35;audio.load();try{primed=Promise.resolve(audio.play()).then(()=>{if(token===generation)audio.pause();},()=>{});}catch{primed=Promise.resolve();}},async play(){const token=generation;await primed;if(token!==generation)throw Error('cancelled');audio.currentTime=0;audio.muted=false;if(!release)release=music.suppress();try{await audio.play();if(token!==generation)throw Error('cancelled');}catch(e){if(token===generation){release?.();release=null;audio.pause();audio.muted=true;}throw e;}},stop,dispose(){stop();audio.removeEventListener('ended',ended);audio.removeEventListener('error',ended);}};
}
