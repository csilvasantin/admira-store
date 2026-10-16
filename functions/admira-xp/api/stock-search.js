import {authorizeContext,stockCatalog,contentTrack,json} from '../../_context-playlist.js';
// Búsqueda por palabras (Carlos, 16-oct-2026: «el buscador por el stock con hashtag combinado no funciona», p. ej.
// «#musica #1983»): cada palabra por separado, sin la almohadilla, sin tildes ni mayúsculas, y tienen que estar todas
// en el título, las etiquetas, el id o el número de Stock. «#1308» sola sigue encontrando el Stock 1308.
const sinTildes=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
export const palabras=q=>sinTildes(q).split(/\s+/).map(w=>w.replace(/^#+/,'')).filter(Boolean).slice(0,8);
export const coincide=(item,ws)=>{if(!ws.length)return true;const texto=sinTildes([item.title,item.id,item.stockNumber,item.number,item.num,...(item.tags||[])].join(' '));return ws.every(w=>texto.includes(w));};
export async function onRequest({request,env},fetcher=fetch){
 if(request.method!=='GET')return json({ok:false,error:'method_not_allowed'},405);
 const params=new URL(request.url).searchParams,scope=Object.fromEntries(['projectId','venueId','channelId'].map(key=>[key,params.get(key)]));
 const access=await authorizeContext(request,env,scope,fetcher);if(access.response)return access.response;
 const query=palabras((params.get('q')||'').trim().slice(0,120)),offset=Math.max(0,Math.min(10000,Number(params.get('offset'))||0));
 try{
  const allowed=scope.channelId==='music'?new Set(['audio','music','locucion','video','animation']):new Set(['image','photo','video','animation']);
  const items=(await stockCatalog(fetcher)).filter(item=>!item.oculto&&allowed.has(String(item.type||item.assetType).toLowerCase())&&coincide(item,query));
  return json({ok:true,scope:access.permission.scope,total:items.length,offset,items:items.slice(offset,offset+30).flatMap(item=>{try{const type=item.type||item.assetType;return [{...contentTrack({...item,assetType:['music','locucion'].includes(type)?'audio':type==='animation'?'video':type==='photo'?'image':type}),stockNumber:item.num??item.stockNumber??item.number??null,studioUrl:'https://admira.studio/stock?q='+encodeURIComponent(item.id)}];}catch{return [];}})});
 }catch{return json({ok:false,error:'stock_temporarily_unavailable'},503);}
}
