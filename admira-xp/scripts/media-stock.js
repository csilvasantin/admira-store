/* One durable operation per paid generation; resume by ID, never regenerate on poll. */
(function(root){'use strict';
 const prefix='xpace-media-pending-v1:',audioReceiptKey='xpace-media-stock-audio.v1',endpoints={image:'advertising-image',video:'advertising-video',audio:'announcement-tts'};
 function pending(kind){try{return JSON.parse(root.sessionStorage.getItem(prefix+kind)||'null');}catch(_){return null;}}
 function keep(kind,value){try{value?root.sessionStorage.setItem(prefix+kind,JSON.stringify(value)):root.sessionStorage.removeItem(prefix+kind);}catch(_){}}
 function completed(kind,stock,payload){root.XpaceCreatedMedia?.add(kind==='audio'?'voice':kind,{...stock,title:payload.text,language:payload.language});}
 const error=(code)=>Object.assign(new Error(code),{code});
 function receipt(stock){if(!stock?.id||!stock.url)throw error('invalid_stock');const u=new URL(stock.url);if(u.origin!=='https://api.admira.store'||u.pathname!=='/stock/asset/'+stock.id)throw error('invalid_stock');return stock;}
 function sleep(ms,signal){return new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(error('cancelled'));};const timer=root.setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});});}
 async function generate(kind,payload,{signal,onProgress=()=>{}}={}){
  if(!endpoints[kind])throw error('invalid_kind');
  let saved=pending(kind);const signature=JSON.stringify(payload);
  // An explicit changed brief/voice/language replaces local playback, while the old server job still archives.
  if(saved&&JSON.stringify(saved.payload)!==signature)saved=null;
  const resumed=!!saved;saved=saved||{requestId:root.crypto.randomUUID(),payload};keep(kind,saved);
  const status=root.document?.getElementById({image:'imagePromptStatus',video:'videoPromptStatus',audio:'announcementStatus'}[kind]);if(status)status.dataset.requestId=saved.requestId;
  const previousLink=root.document?.getElementById(kind+'StockLink');if(previousLink)previousLink.hidden=true;
  if(kind==='audio'){const archive=root.document?.getElementById('announcementArchiveStatus');if(archive)archive.hidden=true;}
  const requestSignal=()=>signal||root.AbortSignal?.timeout(180000);
  const post=()=>root.fetch('/admira-xp/'+endpoints[kind],{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId:saved.requestId}),signal:requestSignal()});
  let response=resumed?await root.fetch('/admira-xp/media-job?requestId='+saved.requestId,{credentials:'same-origin',redirect:'error',cache:'no-store',signal:requestSignal()}):await post();
  // A previous network failure may have happened before admission. Same ID is safe.
  if(resumed&&response.status===404)response=await post();
  const started=Date.now();
  for(;;){
   if(response.status===401){keep(kind,null);throw error('auth');}
   if(!response.ok)throw error('generation');
   if(String(response.headers.get('Content-Type')).startsWith('audio/')){
    const stock=receipt({id:response.headers.get('X-Stock-Id'),url:response.headers.get('X-Stock-Url'),num:Number(response.headers.get('X-Stock-Num'))||null});
    const audioBlob=await response.blob();if(!audioBlob.size)throw error('empty_audio');completed(kind,stock,payload);keep(kind,null);return {stock,audioBlob};
   }
   const data=await response.json(),job=data?.job;if(!data.ok||!job)throw error('generation');
   onProgress(job.status);
   if(job.status==='failed'){keep(kind,null);throw error(job.error||'generation');}
   if(job.status==='done'){
    const stock=receipt(job.stock);let audioBlob;
    if(kind==='audio'){const asset=await root.fetch(stock.url,{credentials:'omit',signal});if(!asset.ok)throw error('stock_unavailable');audioBlob=await asset.blob();if(!audioBlob.size)throw error('empty_audio');}
    completed(kind,stock,payload);keep(kind,null);return {stock,audioBlob};
   }
   if(Date.now()-started>10*60*1000)throw error('still_pending');
   await sleep(4000,signal);
   response=await root.fetch('/admira-xp/media-job?requestId='+saved.requestId,{credentials:'same-origin',redirect:'error',cache:'no-store',signal:requestSignal()});
  }
 }
 function link(kind,stock){stock=receipt(stock);const a=root.document?.getElementById(kind+'StockLink');if(!a)return;a.href='https://www.pixeria.com/stock.html?highlight='+encodeURIComponent(stock.id);a.dataset.stockId=stock.id;a.dataset.assetUrl=stock.url;if(kind==='audio'){a.dataset.stockNum=stock.num||'';try{root.sessionStorage.setItem(audioReceiptKey,JSON.stringify(stock));}catch(_){}const archive=root.document.getElementById('announcementArchiveStatus');if(archive){archive.dataset.stockNum=stock.num||'';archive.hidden=false;}}a.hidden=false;renderLinks();if(['image','video'].includes(kind))root.XpaceMediaOptions?.stage(kind,stock);}
 function renderLinks(){const en=root.document.documentElement.lang==='en';for(const a of root.document.querySelectorAll('[data-media-stock]'))a.textContent=a.id==='audioStockLink'?(en?'Open in Stock · Public announcements':'Ver en Stock · Megafonía'):(en?'Open in Stock':'Ver en Stock');const archive=root.document.getElementById('announcementArchiveStatus');if(archive&&!archive.hidden)archive.textContent=(en?'Last announcement saved automatically in Stock · Public announcements':'Última locución guardada automáticamente en Stock · Megafonía')+(archive.dataset.stockNum?' · #'+archive.dataset.stockNum:'');}
 root.XpaceMedia={generate,pending,link};
 if(root.MutationObserver)new root.MutationObserver(renderLinks).observe(root.document.documentElement,{attributes:true,attributeFilter:['lang']});try{const stored=JSON.parse(root.sessionStorage.getItem(audioReceiptKey)||'null');if(stored)link('audio',stored);}catch(_){}renderLinks();
})(typeof window!=='undefined'?window:globalThis);
