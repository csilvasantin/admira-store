// Shared pure contract: copied verbatim to the MCP backend.
export const DEVICE_IDS=[...Array.from({length:6},(_,i)=>'starbucks-wall-0'+(i+1)),'starbucks-tpv-01'];
export const basePlaylist=id=>id==='starbucks-tpv-01'?'tpv':'wall';
export const emptyDeviceLayout=()=>({playlists:{},assignments:{}});
const fail=m=>{throw Error(m);};
export function cleanLoop(value=true){if(typeof value!=='boolean')fail('loop must be a boolean');return value;}
export function cleanTracks(tracks){
 if(!Array.isArray(tracks)||tracks.length>100)fail('Expected up to 100 tracks');const ids=new Set();
 return tracks.map((t,i)=>{let u;try{u=new URL(t.url);}catch{fail('Use a playable HTTPS media URL');}
 if(u.protocol!=='https:'||u.username||u.password||/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname))fail('Use a direct HTTPS media URL, not a YouTube page');
 const id=String(t.id||t.stockId||'track-'+i),title=String(t.title||'').trim();if(!/^[\w-]{1,100}$/.test(id)||ids.has(id)||!title||title.length>200)fail('Track IDs must be unique and titles 1–200 characters');ids.add(id);return {id,title,url:u.href};});
}
export function validateDeviceLayout(value){
 if(!value||typeof value!=='object'||!value.playlists||!value.assignments)fail('Invalid device layout');const out=emptyDeviceLayout();
 if(Object.keys(value.playlists).length>24)fail('Maximum 24 playlists');
 for(const [id,p] of Object.entries(value.playlists)){if(!/^playlist-[a-z0-9-]{1,64}$/.test(id))fail('Playlist id must start with playlist-');const title=String(p.title||'').trim();if(!title||title.length>100)fail('Playlist title required (1–100 characters)');out.playlists[id]={title,tracks:cleanTracks(p.tracks),loop:cleanLoop(p.loop)};}
 for(const [id,p] of Object.entries(value.assignments)){if(!DEVICE_IDS.includes(id)||!(['wall','tpv'].includes(p)||Object.hasOwn(out.playlists,p)))fail('Unknown device or playlist');out.assignments[id]=p;}
 return out;
}
export const assignedPlaylist=(config,id)=>config.assignments[id]||basePlaylist(id);
export function changeDeviceLayout(current,args){
 const next=validateDeviceLayout(current),{action}=args;
 if(action==='save_playlist'){const id=args.playlist_id;if(!/^playlist-[a-z0-9-]{1,64}$/.test(id))fail('Playlist id must start with playlist-');next.playlists[id]={title:args.title,tracks:args.tracks,loop:cleanLoop(args.loop===undefined?next.playlists[id]?.loop:args.loop)};}
 else if(action==='remove_playlist'){if(!Object.hasOwn(next.playlists,args.playlist_id))fail('Unknown custom playlist');delete next.playlists[args.playlist_id];for(const [id,p] of Object.entries(next.assignments))if(p===args.playlist_id)delete next.assignments[id];}
 else if(action==='assign'||action==='reset'){
  if(!Array.isArray(args.device_ids)||!args.device_ids.length||args.device_ids.length>7||args.device_ids.some(id=>!DEVICE_IDS.includes(id)))fail('Select 1–7 known devices');
  for(const id of args.device_ids)if(action==='reset')delete next.assignments[id];else next.assignments[id]=args.playlist_id;
 }else fail('Unknown device layout action');return validateDeviceLayout(next);
}
