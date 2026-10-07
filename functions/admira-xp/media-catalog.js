// Public, read-only Pixeria media. Fixed type allowlist; no credential forwarding.
const TYPES=['music','audio','locucion','image','video'];
export async function onRequest({request},fetchImpl=fetch){
 const headers={'Cache-Control':'no-store','Vary':'Origin'},origin=request.headers.get('Origin');
 if(['https://www.xpaceos.com','https://xpaceos.com'].includes(origin))headers['Access-Control-Allow-Origin']=origin;
 if(request.method!=='GET')return Response.json({error:'method_not_allowed'},{status:405,headers});
 const requested=new URL(request.url).searchParams.get('type')||'all';
 if(requested!=='all'&&!TYPES.includes(requested))return Response.json({error:'invalid_type'},{status:400,headers});
 try{
  const pages=await Promise.all((requested==='all'?TYPES:requested==='music'?['music','audio']:[requested]).map(async type=>{
   const res=await fetchImpl('https://api.admira.store/stock/list?type='+type+'&limit=200',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
   if(!res.ok)throw Error('stock');const data=await res.json();return (data.items||[]).filter(i=>i.type===type);
  }));
  const items=[];
  for(const item of pages.flat()){
   if(item.oculto||!/^[-\w]{1,120}$/.test(item.id||''))continue;
   let u;try{u=new URL(item.url);}catch{continue;}
   if(u.protocol!=='https:'||u.username||u.password||!['api.admira.store','stock.admira.store'].includes(u.hostname)||!u.pathname.startsWith('/stock/'))continue;
   items.push({id:item.id,type:item.type,title:String(item.title||item.id),url:item.url,tags:Array.isArray(item.tags)?item.tags.filter(t=>typeof t==='string'):[]});
  }
  return Response.json({items},{headers});
 }catch{return Response.json({error:'stock_unavailable'},{status:502,headers});}
}
