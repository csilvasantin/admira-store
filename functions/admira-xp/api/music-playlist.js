import {physicalMusicTracks,MUSIC_SCREEN} from '../../../admira-xp/scripts/physical-music-playlist.mjs';
export const MUSIC_SOURCE='https://admira.tv/api/playlist?screen='+MUSIC_SCREEN;
export async function onRequest({request},fetcher=fetch){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 // xpaceos.com (GitHub Pages, sin funciones) lee aquí la misma playlist para el TPV de sus centros (16-oct-2026).
 const origin=request.headers.get('Origin')||'';if(['https://www.xpaceos.com','https://xpaceos.com'].includes(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Vary']='Origin';}
 if(request.method!=='GET')return Response.json({ok:false,error:'GET only'},{status:405,headers:{...headers,Allow:'GET'}});
 try{
  const [source,art]=await Promise.allSettled([
   fetcher(MUSIC_SOURCE,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(6000)}).then(async r=>{if(!r.ok)throw Error('source');return r.json();}),
   fetcher('https://stock.admira.store/stock/index.json',{headers:{Accept:'application/json'},cf:{cacheTtl:60,cacheEverything:true},signal:AbortSignal.timeout(2000)}).then(async r=>{if(!r.ok)throw Error('art');const d=await r.json();return Array.isArray(d)?d:d.items||d.assets||[];})
  ]);if(source.status!=='fulfilled')throw Error('source');const data=source.value,catalog=art.status==='fulfilled'?art.value:[];
  return Response.json({ok:true,screen:MUSIC_SCREEN,revision:data.draft?.rev??null,tracks:physicalMusicTracks(data,catalog)},{headers});
 }catch{return Response.json({ok:false,error:'Physical music temporarily unavailable'},{status:502,headers});}
}
