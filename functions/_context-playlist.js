import {readSession,siteForHost} from './_perimetro.js';
export const PERMISSION_URL='https://www.admiranext.com/pruebas/api/xpace/playlist-permission';
export const PLAYLIST_URL='https://admira.tv/api/xpace-playlists';
export const STOCK_URL='https://stock.admira.store/stock/index.json';
export const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function validContext(value){return value&&['projectId','venueId'].every(key=>typeof value[key]==='string'&&/^[a-z0-9][a-z0-9_-]{1,79}$/.test(value[key]))&&typeof value.channelId==='string'&&/^(music|screen-[a-z0-9][a-z0-9-]{0,47})$/.test(value.channelId);}
export async function authorizeContext(request,env,scope,fetcher=fetch){
 if(!validContext(scope))return {response:json({ok:false,error:'select_venue_and_channel'},400)};
 const url=new URL(request.url),site=siteForHost(url.hostname);
 if(!['admira.store','www.admira.store'].includes(url.hostname))return {response:json({ok:false,error:'canonical_origin_required'},403)};
 if(request.method==='POST'&&(request.headers.get('Origin')!==url.origin||request.headers.get('X-Admira-Playlist-Request')!=='1'))return {response:json({ok:false,error:'invalid_origin'},403)};
 const session=site&&await readSession(request,env,site,fetcher);if(!session||session.agent||session.lectura)return {response:json({ok:false,error:'login_required'},401)};
 if(!env.XPACE_PLAYLIST_SERVICE_KEY)return {response:json({ok:false,error:'playlist_permission_unavailable'},503)};
 let permission;
 try{
  const response=await fetcher(PERMISSION_URL,{method:'POST',headers:{'Content-Type':'application/json','Origin':url.origin,'X-Admira-Playlist-Service-Key':env.XPACE_PLAYLIST_SERVICE_KEY},body:JSON.stringify({email:session.email,...scope}),signal:AbortSignal.timeout(4500),cache:'no-store'});
  permission=await response.json();if(!response.ok||permission.ok!==true)return {response:json({ok:false,error:permission.error||'venue_access_denied'},response.status)};
 }catch{return {response:json({ok:false,error:'playlist_permission_unavailable'},503)};}
 if(!validContext(permission.scope)||permission.scope.projectId!==scope.projectId||permission.scope.channelId!==scope.channelId||typeof permission.grant!=='string'||!permission.capabilities?.read)return {response:json({ok:false,error:'invalid_permission'},503)};
 // Only the explicit demo alias may canonicalize to another venue identifier.
 if(permission.scope.venueId!==scope.venueId&&!(scope.venueId==='demo-starbucks'&&permission.scope.venueId==='alsea-sbux-021'))return {response:json({ok:false,error:'invalid_permission'},503)};
 return {permission};
}
export async function stockCatalog(fetcher=fetch){const response=await fetcher(STOCK_URL,{signal:AbortSignal.timeout(2500),cf:{cacheTtl:60,cacheEverything:true}});if(!response.ok)throw Error('stock_unavailable');const data=await response.json();const items=Array.isArray(data)?data:data.items||data.assets;if(!Array.isArray(items))throw Error('stock_unavailable');return items;}
const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
export function contentTrack(item,extra={}){
 const kind=['audio','music','locucion'].includes(item.assetType||item.type)?'audio':item.assetType||item.type;
 const id=String(item.stockId||item.id),url=safe(item.asset||item.url);
 if(!id||!url||!['audio','video','image'].includes(kind))throw Error('invalid_playlist_content');
 const cover=[item.thumbnail,item.poster,item.cover,extra.thumbnail,extra.poster,extra.cover].map(safe).find(Boolean)||'';
 const width=Number(item.width||extra.width||extra.ancho),height=Number(item.height||extra.height||extra.alto);
 return {id,stockId:id,title:String(item.title||id),url,kind,cover,visualUrl:kind==='video'?url:'',...(Number.isFinite(width)&&width>0&&Number.isFinite(height)&&height>0?{width,height}:{}),...(Number(item.seconds)>0?{seconds:Number(item.seconds)}:{})};
}
