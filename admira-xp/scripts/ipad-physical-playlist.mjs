// One read-only source for the Starbucks virtual iPad and its physical counterpart.
export const IPAD_SCREEN='ipad-admin-mupi';
export const IPAD_PLAYLIST_URL='/admira-xp/api/ipad-playlist';
export const IPAD_POLL_MS=15000;
export function physicalIPadTracks(value){
 if(!value||value.ok!==true||!value.draft||!Array.isArray(value.draft.items)||!Array.isArray(value.auto))throw Error('Invalid iPad playlist');
 const items=[...value.draft.items,...value.auto];if(items.length>200)throw Error('iPad playlist too large');
 const seen=new Set(),tracks=[];
 for(const item of items){
  const id=String(item.stockId||item.id||''),url=item.asset||item.url;
  const kind=String(item.assetType||item.type||item.kind||'video').toLowerCase();
  if(!id||!['video','image'].includes(kind)||typeof url!=='string')throw Error('Invalid iPad media');
  const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw Error('Invalid iPad URL');
  if(seen.has(id))continue;seen.add(id);
  tracks.push({id,stockId:item.stockId||id,title:String(item.title||id),url,kind,...(Number(item.seconds)>0?{seconds:Number(item.seconds)}:{})});
 }
 return tracks;
}
export function createPhysicalPlaylistWatch({fetcher=globalThis.fetch,timers=globalThis,interval=IPAD_POLL_MS,url=IPAD_PLAYLIST_URL,screen=IPAD_SCREEN,normalize}={}){
 let tracks=null,error=false,timer=null,request=null,running=false,generation=0;
 const listeners=new Set();
 const report=()=>{for(const listener of listeners)listener({tracks,error,screen});};
 async function poll(){
  if(running||!listeners.size)return;running=true;const current=generation;
  const ac=request=new AbortController(),timeout=timers.setTimeout(()=>ac.abort(),8000);
  try{
   const response=await fetcher(url,{cache:'no-store',signal:ac.signal});if(!response.ok)throw Error('iPad playlist unavailable');
   const data=await response.json();const next=normalize(data);
   if(current!==generation||!listeners.size)return;
   tracks=next;error=false;report();
  }catch(_){if(current===generation&&listeners.size){error=true;report();}}
  finally{timers.clearTimeout(timeout);if(request===ac)request=null;running=false;if(listeners.size)timer=timers.setTimeout(poll,interval);}
 }
 return onState=>{
  listeners.add(onState);if(tracks!==null)onState({tracks,error,screen});
  if(listeners.size===1){generation++;void poll();}
  return ()=>{listeners.delete(onState);if(!listeners.size){generation++;timers.clearTimeout(timer);request?.abort();}};
 };
}
export function createIPadPlaylistWatch(options={}){return createPhysicalPlaylistWatch({...options,normalize:data=>{
 if(data.screen!==IPAD_SCREEN||!Array.isArray(data.tracks))throw Error('Invalid shared iPad playlist');
 return physicalIPadTracks({ok:data.ok,draft:{items:data.tracks},auto:[]});
}});}
let sharedWatch;
export function watchIPadPlaylist(onState){sharedWatch??=createIPadPlaylistWatch();return sharedWatch(onState);}
