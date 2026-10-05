/* Human app routing and retained perimeter session; embedded players stay public. */
(function(root){
  'use strict';
  const doc=root.document;if(!doc)return;
  let embedded=true;try{embedded=root.top!==root.self;}catch(_){}
  if(!embedded&&['xpaceos.com','www.xpaceos.com'].includes(root.location.hostname)){
    const target=new URL('https://www.admira.store'+root.location.pathname+root.location.search+root.location.hash);
    try{
      const language=root.localStorage.getItem('xtanco_lang'),quality=root.localStorage.getItem('xtanco_render');
      if(!target.searchParams.has('lang')&&['es','en'].includes(language))target.searchParams.set('lang',language);
      if(!target.searchParams.has('quality')&&!target.searchParams.has('visual')&&['16bit','good','better','best','matrix'].includes(quality))target.searchParams.set('quality',quality);
    }catch(_){}
    root.location.replace(target.href);
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
