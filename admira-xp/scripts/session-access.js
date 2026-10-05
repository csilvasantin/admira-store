/* Human app routing and retained perimeter session; embedded players stay public. */
(function(root){
  'use strict';
  const doc=root.document;if(!doc)return;
  let embedded=true;try{embedded=root.top!==root.self;}catch(_){}
  if(!embedded&&['xpaceos.com','www.xpaceos.com'].includes(root.location.hostname)){
    root.location.replace('https://www.admira.store'+root.location.pathname+root.location.search+root.location.hash);
    return;
  }
  let active=false;
  root.XpaceAccess={active:()=>active};
  const refresh=async()=>{
    try{
      const response=await root.fetch('/auth/session',{credentials:'same-origin',cache:'no-store',redirect:'error',signal:root.AbortSignal.timeout(10000)});
      const data=response.ok?await response.json():null;active=data?.ok===true;
    }catch(_){active=false;}
    root.dispatchEvent(new root.Event('xpace:session'));
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
  root.addEventListener('pageshow',event=>{if(event.persisted)refresh();});
})(typeof window!=='undefined'?window:globalThis);
