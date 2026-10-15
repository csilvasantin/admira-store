export const CONTEXT_PLAYLIST_URL='/admira-xp/api/context-playlist';
export function playlistContext(href,channelId='music'){
 try{const params=new URL(href).searchParams,projectId=params.get('project'),venueId=params.get('venue')||params.get('loc');
  if(!projectId||!venueId||![projectId,venueId].every(id=>/^[a-z0-9][a-z0-9_-]{1,79}$/.test(id))||!/^(music|screen-[a-z0-9][a-z0-9-]{0,47})$/.test(channelId))return null;
  return {projectId,venueId,channelId};
 }catch{return null;}
}
const key=scope=>scope?JSON.stringify([scope.projectId,scope.venueId,scope.channelId]):'';
const scoped=(requested,actual)=>actual&&requested.projectId===actual.projectId&&requested.channelId===actual.channelId&&(requested.venueId===actual.venueId||requested.venueId==='demo-starbucks'&&actual.venueId==='alsea-sbux-021');
export class ContextPlaylistClient{
 constructor({fetcher=(...args)=>fetch(...args),makeId=()=>crypto.randomUUID()}={}){this.fetcher=fetcher;this.makeId=makeId;this.scope=null;this.generation=0;this.listeners=new Set();this.controllers=new Set();this.snapshot={scope:null,data:null,tracks:null,error:'select_venue_and_channel',loading:false,editing:false};}
 state(){return this.snapshot;}
 subscribe(fn){this.listeners.add(fn);fn(this.snapshot);return ()=>this.listeners.delete(fn);}
 emit(patch){this.snapshot={...this.snapshot,...patch};for(const fn of this.listeners)fn(this.snapshot);}
 setContext(scope){if(key(scope)===key(this.scope))return false;this.generation++;for(const controller of this.controllers)controller.abort();this.controllers.clear();this.scope=scope?{...scope}:null;this.emit({scope:this.scope,data:null,tracks:[],error:scope?'':'select_venue_and_channel',loading:!!scope,editing:false});if(scope)void this.refresh();return true;}
 validate(data,scope){if(!data||data.ok!==true||!scoped(scope,data.scope)||!Array.isArray(data.tracks)||data.tracks.length>200||!Number.isSafeInteger(data.revision)||data.revision<0)throw Error('invalid_playlist_response');return data;}
 async request(path,options={},generation=this.generation){
  const controller=new AbortController();this.controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),12000);
  try{const response=await this.fetcher(path,{cache:'no-store',credentials:'same-origin',...options,signal:controller.signal});const data=await response.json();if(generation!==this.generation)throw Error('context_changed');if(!response.ok||data.ok!==true)throw Error(data.error||'playlist_temporarily_unavailable');return data;}
  finally{clearTimeout(timeout);this.controllers.delete(controller);}
 }
 async refresh(){
  const scope=this.scope;if(!scope)return null;const generation=this.generation;this.emit({loading:true});
  try{const data=this.validate(await this.request(CONTEXT_PLAYLIST_URL+'?'+new URLSearchParams(scope),{},generation),scope);if(generation!==this.generation)return null;if(this.snapshot.data&&data.revision<this.snapshot.data.revision){this.emit({loading:false});return null;}this.emit({data,tracks:data.tracks,error:'',loading:false});return data;}
  catch(error){if(generation===this.generation)this.emit({error:error.message,loading:false});return null;}
 }
 async mutate(operation,stockId,{seedStockIds}={}){
  const scope=this.scope,data=this.snapshot.data,generation=this.generation;if(!scope||!data)throw Error('select_venue_and_channel');if(!data.capabilities?.[operation])throw Error('forbidden');if(this.snapshot.editing)throw Error('operation_in_progress');
  const body={...scope,operation,stockId,expectedRevision:data.revision,requestId:this.makeId(),...(data.revision===0&&seedStockIds?.length?{seedStockIds}:{})};this.emit({editing:true,error:''});
  try{const result=this.validate(await this.request(CONTEXT_PLAYLIST_URL,{method:'POST',headers:{'Content-Type':'application/json','X-Admira-Playlist-Request':'1'},body:JSON.stringify(body)},generation),scope);if(generation!==this.generation)throw Error('context_changed');if(this.snapshot.data&&result.revision<this.snapshot.data.revision){this.emit({editing:false,error:''});return this.snapshot.data;}this.emit({data:result,tracks:result.tracks,error:'',editing:false});return result;}
  catch(error){if(generation===this.generation){this.emit({editing:false,error:error.message});if(error.message==='revision_conflict')void this.refresh();}throw error;}
 }
 async search(query){const scope=this.scope,generation=this.generation;if(!scope)throw Error('select_venue_and_channel');const data=await this.request('/admira-xp/api/stock-search?'+new URLSearchParams({...scope,q:String(query).slice(0,120)}),{},generation);if(!scoped(scope,data.scope)||!Array.isArray(data.items))throw Error('invalid_stock_response');return data.items;}
 dispose(){this.generation++;for(const controller of this.controllers)controller.abort();this.controllers.clear();this.listeners.clear();}
}
const clients=new Map();
export function contextPlaylist(channelId='music',win=globalThis.window){
 if(!win)return null;if(clients.has(channelId))return clients.get(channelId);
 const client=new ContextPlaylistClient();clients.set(channelId,client);
 const update=()=>client.setContext(playlistContext(win.location.href,channelId));update();
 win.addEventListener('popstate',update);win.addEventListener('xpaceos:project-change',update);
 const contextTimer=win.setInterval(update,1000),pollTimer=win.setInterval(()=>{update();if(!win.document?.hidden&&client.scope&&!client.state().editing)void client.refresh();},15000);
 win.addEventListener('pagehide',()=>{win.clearInterval(contextTimer);win.clearInterval(pollTimer);client.dispose();},{once:true});return client;
}
