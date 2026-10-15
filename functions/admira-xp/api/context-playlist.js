import {authorizeContext,PLAYLIST_URL,stockCatalog,contentTrack,json} from '../../_context-playlist.js';
const keys=new Set(['projectId','venueId','channelId','operation','stockId','expectedRevision','requestId','seedStockIds']);
export async function onRequest({request,env},fetcher=fetch){
 if(!['GET','POST'].includes(request.method))return json({ok:false,error:'method_not_allowed'},405);
 let body;if(request.method==='POST'){try{body=await request.json();}catch{return json({ok:false,error:'invalid_json'},400);}if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!keys.has(key))||!['add','remove'].includes(body.operation)||typeof body.stockId!=='string'||!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0||typeof body.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(body.requestId))return json({ok:false,error:'invalid_operation'},400);}
 const params=new URL(request.url).searchParams,scope=Object.fromEntries(['projectId','venueId','channelId'].map(key=>[key,body?.[key]||params.get(key)]));
 const access=await authorizeContext(request,env,scope,fetcher);if(access.response)return access.response;const {permission}=access;
 if(body&&!permission.capabilities?.[body.operation])return json({ok:false,error:'forbidden'},403);
 if(body?.seedStockIds!==undefined&&(!Array.isArray(body.seedStockIds)||body.seedStockIds.length>200||body.seedStockIds.some(id=>typeof id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,159}$/.test(id))||body.expectedRevision!==0))return json({ok:false,error:'invalid_initial_selection'},400);
 try{
  const [response,catalogResult]=await Promise.all([
   fetcher(PLAYLIST_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+permission.grant},body:JSON.stringify(body?{operation:body.operation,stockId:body.stockId,expectedRevision:body.expectedRevision,requestId:body.requestId,...(body.seedStockIds?{seedStockIds:body.seedStockIds}:{})}:{operation:'resolve'}),signal:AbortSignal.timeout(6000),cache:'no-store'}),
   stockCatalog(fetcher).catch(()=>[])
  ]);
  const data=await response.json();if(!response.ok||data.ok!==true)return json({ok:false,error:data.error||'playlist_unavailable',...(data.actual?{revision:data.actual.rev}:{})},response.status);
  if(data.scope?.projectId!==permission.scope.projectId||data.scope?.venueId!==permission.scope.venueId||data.scope?.channelId!==permission.scope.channelId||!Array.isArray(data.effectiveItems))throw Error('invalid_response');
  const catalog=new Map(catalogResult.map(item=>[String(item.id),item]));
  return json({...data,renderer:permission.renderer||null,tracks:data.effectiveItems.map(item=>contentTrack(item,catalog.get(String(item.stockId||item.id)))),venue:{id:permission.venue.id,name:permission.venue.name},project:{id:permission.project.id,name:permission.project.name},capabilities:permission.capabilities});
 }catch{return json({ok:false,error:'playlist_temporarily_unavailable'},503);}
}
