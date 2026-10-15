import {physicalIPadTracks,IPAD_SCREEN} from '../../../admira-xp/scripts/ipad-physical-playlist.mjs';
export const IPAD_SOURCE='https://admira.tv/api/playlist?screen='+IPAD_SCREEN;
export async function onRequest({request},fetcher=fetch){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 if(request.method!=='GET')return new Response(JSON.stringify({ok:false,error:'GET only'}),{status:405,headers:{...headers,Allow:'GET'}});
 try{
  const upstream=await fetcher(IPAD_SOURCE,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000),cache:'no-store'});
  if(!upstream.ok)throw Error('upstream');
  const data=await upstream.json(),tracks=physicalIPadTracks(data);
  return new Response(JSON.stringify({ok:true,screen:IPAD_SCREEN,tracks,revision:data.draft.rev??null}),{headers});
 }catch(_){return new Response(JSON.stringify({ok:false,error:'iPad playlist temporarily unavailable'}),{status:502,headers});}
}
