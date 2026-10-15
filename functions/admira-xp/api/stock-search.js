import {authorizeContext,stockCatalog,contentTrack,json} from '../../_context-playlist.js';
export async function onRequest({request,env},fetcher=fetch){
 if(request.method!=='GET')return json({ok:false,error:'method_not_allowed'},405);
 const params=new URL(request.url).searchParams,scope=Object.fromEntries(['projectId','venueId','channelId'].map(key=>[key,params.get(key)]));
 const access=await authorizeContext(request,env,scope,fetcher);if(access.response)return access.response;
 const query=(params.get('q')||'').trim().slice(0,120).toLocaleLowerCase().replace(/^#(?=\d+$)/,''),offset=Math.max(0,Math.min(10000,Number(params.get('offset'))||0));
 try{
  const allowed=scope.channelId==='music'?new Set(['audio','music','locucion','video','animation']):new Set(['image','photo','video','animation']);
  const items=(await stockCatalog(fetcher)).filter(item=>!item.oculto&&allowed.has(String(item.type||item.assetType).toLowerCase())&&(!query||[item.title,item.id,item.stockNumber,item.number,item.num,...(item.tags||[])].join(' ').toLocaleLowerCase().includes(query)));
  return json({ok:true,scope:access.permission.scope,total:items.length,offset,items:items.slice(offset,offset+30).flatMap(item=>{try{const type=item.type||item.assetType;return [{...contentTrack({...item,assetType:['music','locucion'].includes(type)?'audio':type==='animation'?'video':type==='photo'?'image':type}),stockNumber:item.num??item.stockNumber??item.number??null,studioUrl:'https://admira.studio/stock?q='+encodeURIComponent(item.id)}];}catch{return [];}})});
 }catch{return json({ok:false,error:'stock_temporarily_unavailable'},503);}
}
