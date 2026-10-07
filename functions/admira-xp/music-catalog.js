// Public music metadata only. Fixed upstream; never forwards browser credentials.
export const MUSIC_STOCK_SOURCE='https://api.admira.store/stock/list?type=music&limit=200';
export async function onRequest({request},fetchImpl=fetch){
 const headers={'Cache-Control':'no-store','Vary':'Origin'},origin=request.headers.get('Origin');
 if(['https://www.xpaceos.com','https://xpaceos.com'].includes(origin))headers['Access-Control-Allow-Origin']=origin;
 if(request.method!=='GET')return Response.json({error:'method_not_allowed'},{status:405,headers});
 try{
  const res=await fetchImpl(MUSIC_STOCK_SOURCE,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw Error('stock');const data=await res.json(),items=[];
  for(const item of data.items||[]){
   if(item.type!=='music'||!/^[-\w]{1,120}$/.test(item.id||''))continue;
   let u;try{u=new URL(item.url);}catch{continue;}
   if(u.protocol!=='https:'||u.username||u.password||!['api.admira.store','stock.admira.store'].includes(u.hostname)||!u.pathname.startsWith('/stock/'))continue;
   items.push({id:item.id,type:'music',title:String(item.title||item.id),url:item.url});
  }
  return Response.json({items},{headers});
 }catch{return Response.json({error:'stock_unavailable'},{status:502,headers});}
}
