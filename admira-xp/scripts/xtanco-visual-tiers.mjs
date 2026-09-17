export const TIER_STORAGE_KEY='xtanco_visual_tier_v2';
export function requestedTier(search='',storage){
  const params=new URLSearchParams(search);
  const requested=params.get('visual')??params.get('quality');
  if(requested!==null)return requested==='life'?'better':['good','better','best','matrix'].includes(requested)?requested:'good';
  try{const saved=storage?.getItem(TIER_STORAGE_KEY);return ['better','best','matrix'].includes(saved)?saved:'good';}catch{return 'good';}
}

/** Presentation router only: never imports a renderer or creates a GPU context.
 * Best is a live 3D presentation; the 30 operational areas retain their own status.
 * Openers receive {signal,requestId}; async view events echo that requestId.
 * Views must cancel pending work on abort/close and never reopen after abort.
 */
export function createVisualTiers({openBetter,closeBetter,subscribeBetter,openBest,closeBest,subscribeBest,openMatrix,closeMatrix,subscribeMatrix,storage,onChange=()=>{},onBestRequested=()=>{}}){
  const views={better:{open:openBetter,close:closeBetter},best:{open:openBest,close:closeBest},matrix:{open:openMatrix,close:closeMatrix}};
  const previewNotice='Best · tienda y personas en 3D en vivo; funciones operativas completas en preparación.';
  const tierNotice=tier=>tier==='best'?previewNotice:tier==='matrix'?'Matrix · Avenida Admira · mobiliario editable e inventario compartido · cámara fija.':'';
  const isPreview=tier=>tier==='best'||tier==='matrix';
  const tierLabel=tier=>({good:'Good',better:'Better',best:'Best',matrix:'Matrix'})[tier];
  let mode='good',busy=false,notice='',error='',active=null,sequence=0,disposed=false;
  const snapshot=()=>({mode,busy,notice,error,availability:isPreview(mode)?'preview':'interactive',preview:isPreview(mode)});
  const publish=()=>{if(!disposed)onChange(snapshot());};
  const save=()=>{try{storage?.setItem(TIER_STORAGE_KEY,mode);}catch{}};
  const result=(requested,ok,cancelled=false)=>({...snapshot(),requested,ok,...(cancelled?{cancelled:true}:{})});
  function settle(request,ok,cancelled=false){
    if(request.settled)return;request.settled=true;request.resolve(result(request.tier,ok,cancelled));
  }
  function awaitReady(request){
    request.settled=false;request.promise=new Promise(resolve=>{request.resolve=resolve;});
  }
  function release(request,reason,close=true){
    if(!request)return;
    // Detach before abort/close: either can synchronously announce a close.
    if(active===request)active=null;
    request.controller.abort();
    if(close){try{views[request.tier].close?.(reason);}catch{error='No se pudo cerrar la vista anterior';notice=error;}}
    settle(request,false,true);
  }
  function receive(tier,state={}){
    if(disposed||!active||active.tier!==tier)return;
    const request=active;
    if(state.requestId!==undefined&&state.requestId!==request.id)return;
    request.seenEvent=true;
    if(!state.open){
      mode='good';busy=false;error=state.error||'';notice=error;
      release(request,state.reason||'close',false);
      if(state.reason!=='pagehide')save();publish();return;
    }
    // A view can retry in the same dialog/request after an earlier result.
    // New callers must await that retry, not inherit its previous readiness.
    if(state.busy&&request.settled)awaitReady(request);
    request.opened=true;busy=!!state.busy;error=state.error||'';
    notice=error||tierNotice(tier);publish();
    if(request.initialized&&!busy)settle(request,!error);
  }
  const subscriptions=[subscribeBetter?.(state=>receive('better',state)),subscribeBest?.(state=>receive('best',state)),subscribeMatrix?.(state=>receive('matrix',state))];
  function choose(value,options={}){
    const next=value==='life'?'better':['good','better','best','matrix'].includes(value)?value:'good';
    if(disposed)return Promise.resolve(result(next,false,true));
    if(active?.tier===next){publish();return active.settled?Promise.resolve(result(next,!error)):active.promise;}
    const previous=active;mode='good';busy=false;error='';notice='';
    release(previous,'switch');
    if(error){save();publish();return Promise.resolve(result(next,false));}
    if(next==='good'){save();publish();return Promise.resolve(result(next,true));}
    if(next==='best')onBestRequested();
    if(typeof views[next].open!=='function'){
      const label=tierLabel(next);error=`${label} no disponible · puedes reintentar`;notice=error;
      save();publish();return Promise.resolve(result(next,false));
    }
    const request={id:++sequence,tier:next,controller:new AbortController(),opened:false,seenEvent:false,initialized:false,settled:false};
    awaitReady(request);
    active=request;mode=next;busy=true;notice=tierNotice(next);save();publish();
    function opened(){
      if(active!==request||disposed)return;
      request.initialized=true;
      // An opener without observable events is ready when its promise resolves.
      if(!request.seenEvent){request.opened=true;busy=false;}
      publish();if(!busy)settle(request,request.opened&&!error);
    }
    function failed(){
      if(active!==request||disposed)return;
      const label=tierLabel(next);mode='good';busy=false;error=`${label} no disponible · puedes reintentar`;notice=error;
      // A rejected initializer is a failure, not a superseded request.
      settle(request,false);release(request,'error');save();publish();
    }
    try{Promise.resolve(views[next].open({signal:request.controller.signal,requestId:request.id})).then(opened,failed);}catch{failed();}
    return request.promise;
  }
  publish();
  return {choose,get mode(){return mode;},get busy(){return busy;},get notice(){return notice;},get error(){return error;},
    get availability(){return isPreview(mode)?'preview':'interactive';},get preview(){return isPreview(mode);},
    dispose(){if(disposed)return;disposed=true;for(const unsubscribe of subscriptions)unsubscribe?.();mode='good';busy=false;release(active,'dispose');}
  };
}
