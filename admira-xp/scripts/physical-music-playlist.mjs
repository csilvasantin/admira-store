import {contextPlaylist} from './context-playlist-client.mjs?v=local-playlist-349';
export const MUSIC_SCREEN='iphone17-mupi',MUSIC_PLAYLIST_URL='/admira-xp/api/music-playlist';
const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
export function physicalMusicTracks(data,catalog=[]){
 if(!data||data.ok!==true||!Array.isArray(data.draft?.items)||!Array.isArray(data.auto))throw Error('Invalid physical music playlist');
 const items=[...data.draft.items,...data.auto];if(items.length>200)throw Error('Music playlist too large');
 const meta=new Map(catalog.map(x=>[x.id,x])),seen=new Set(),tracks=[];
 for(const item of items){const id=String(item.stockId||item.id||''),url=safe(item.asset||item.url),kind=String(item.assetType||item.kind||item.type||'').toLowerCase();
  if(!id||!url||!['video','audio','music'].includes(kind))throw Error('Invalid music track');if(seen.has(id))continue;seen.add(id);
  const extra=meta.get(id)||{},cover=[item.thumbnail,item.poster,item.cover,extra.thumbnail,extra.poster,extra.cover].map(safe).find(Boolean)||'';
  const visualUrl=kind==='video'?url:'';
  const width=Number(item.width||item.ancho||extra.width||extra.ancho),height=Number(item.height||item.alto||extra.height||extra.alto),dimensions=Number.isFinite(width)&&width>0&&Number.isFinite(height)&&height>0?{width,height}:{};
  tracks.push({id,stockId:id,url,title:String(item.title||id),kind:kind==='video'?'video':'audio',cover,visualUrl,...dimensions,...(Number(item.seconds)>0?{seconds:Number(item.seconds)}:{})});
 }return tracks;
}
export function watchPhysicalMusic(onState){
 const client=contextPlaylist();if(!client)return ()=>{};
 return client.subscribe(state=>onState({tracks:state.tracks,scope:state.scope,revision:state.data?.revision,error:state.error}));
}
