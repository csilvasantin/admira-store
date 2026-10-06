// Read-only recovery of already public XpaceOS PA. Fixed Stock endpoint; no generation/session forwarding.
export async function onRequest({request},fetchImpl=fetch){
 const headers={'Cache-Control':'no-store','Vary':'Origin'},origin=request.headers.get('Origin');
 if(['https://www.xpaceos.com','https://xpaceos.com'].includes(origin))headers['Access-Control-Allow-Origin']=origin;
 if(request.method!=='GET')return Response.json({error:'method_not_allowed'},{status:405});
 try{
  const res=await fetchImpl('https://api.admira.store/stock/list?type=locucion&limit=100',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(60000)});
  if(!res.ok)throw Error('stock');const data=await res.json(),latest={};
  for(const item of data.items||[]){
   if(item.type!=='locucion'||!item.tags?.includes('xpaceos')||!/^elevenlabs/.test(item.motor||'')||!/^[-\w]{1,120}$/.test(item.id||''))continue;
   const match=String(item.comment||'').match(/Created in XpaceOS · (female|male) · (es|en)(?:\b|$)/);if(!match)continue;
   const at=Date.parse(item.createdAt);if(!Number.isFinite(at))continue;const key=match[2]+':'+match[1];
   if(!latest[key]||latest[key].at<at)latest[key]={id:item.id,url:'https://api.admira.store/stock/asset/'+item.id,num:item.num||null,title:item.prompt||item.title||'Stock',voice:match[1],language:match[2],at};
  }
  return Response.json({items:Object.values(latest)},{headers});
 }catch(_){return Response.json({error:'stock_unavailable'},{status:502,headers});}
}
