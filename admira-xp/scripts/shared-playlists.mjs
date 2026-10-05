const API='https://mcp.admira.store/playlists',KEY='xpaceos.playlist-owners.v1';
export const playlistReference=id=>id==='wall'?'#playliststarbucks-wall':id==='ipad'?'#playliststarbucks-ipad':id==='tpv'?'#playliststarbucks-tpv':'#playlist'+id.replace(/^playlist-/,'');
const uuid=id=>/^playlist-[0-9a-f-]{36}$/.test(id)?id.slice(9):null;
export function createSharedPlaylists(){
 let owners={};try{owners=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
 async function request(url,body,token){const r=await fetch(url,{method:body?'POST':'GET',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.error||'Playlist unavailable');return data;}
 return {
  known:id=>!!owners[id],
  revision:id=>owners[id]?.revision,
  async save(id,draft,expected){const owner=owners[id];const result=owner?await request(API+'/'+uuid(id),{...draft,expected_revision:expected},owner.token):await request(API,draft);owners[result.playlist_id]={token:result.owner_token||owner.token,revision:result.revision};localStorage.setItem(KEY,JSON.stringify(owners));return result;},
  async read(id){if(!owners[id])return null;return request(API+'/'+uuid(id));},
  accept(id,revision){if(owners[id]){owners[id].revision=revision;localStorage.setItem(KEY,JSON.stringify(owners));}}
 };
}
