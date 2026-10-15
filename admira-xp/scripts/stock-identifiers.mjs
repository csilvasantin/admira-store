// Extract identifiers for an explicit, scoped adoption. URLs are never sent as
// programming content and cannot select a destination.
export function stockSelections(tracks=[]){const seen=new Set();return tracks.flatMap(track=>{let id=track.stockId;
 try{const url=new URL(track.url);if(!id&&['api.admira.store','stock.admira.store'].includes(url.hostname)&&url.protocol==='https:'&&!url.username&&!url.password)id=url.pathname.match(/^\/stock\/asset\/([\w-]+)$/)?.[1]||url.pathname.match(/^\/stock\/([\w-]+)\/asset\.[a-z0-9]+$/)?.[1];}catch{}
 if(typeof id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,159}$/.test(id)||seen.has(id))return [];seen.add(id);return [{id,title:String(track.title||id)}];});}
