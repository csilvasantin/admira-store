/* Local screen previews. Original players, pins and playlists remain the owners. */
(function(root){'use strict';const doc=root.document;if(!doc)return;const entries=new Map(),pending=new Map();
 function dispose(entry){if(entry?.media.tagName==='VIDEO'){entry.media.pause();entry.media.removeAttribute('src');entry.media.load();}}
 // https: o blob: de ESTE origen (cápsulas «¿Sabías que…?», 10-oct-2026); un blob de otro realm/origen no carga y se rechaza.
 function validate(track){const url=new URL(track.url),blob=url.protocol==='blob:'&&url.origin===root.location?.origin;if(!['image','video'].includes(track.kind)||!track.id||(url.protocol!=='https:'&&!blob)||url.username||url.password)throw Error('Invalid screen content');return {...track,url:url.href};}
 async function preview(id,value){if(!id)throw Error('No screen');const track=validate(value),token={};pending.set(id,token);const media=doc.createElement(track.kind==='image'?'img':'video');media.crossOrigin='anonymous';
  if(track.kind==='video'){media.muted=true;media.loop=true;media.playsInline=true;media.preload='auto';}
  try{await new Promise((resolve,reject)=>{const timer=root.setTimeout(()=>finish(Error('Media timeout')),20000);function finish(error){root.clearTimeout(timer);media.onload=null;media.onerror=null;media.onloadeddata=null;error?reject(error):resolve();}media.onerror=()=>finish(Error('Media unavailable'));if(track.kind==='image')media.onload=()=>finish();else media.onloadeddata=()=>finish();media.src=track.url;if(track.kind==='video')media.load();});if(pending.get(id)!==token){dispose({media});return false;}if(track.kind==='video')await media.play();if(pending.get(id)!==token){dispose({media});return false;}dispose(entries.get(id));entries.set(id,{track,media});pending.delete(id);return true;}catch(error){dispose({media});if(pending.get(id)===token)pending.delete(id);throw error;}
 }
 function restore(id){pending.delete(id);dispose(entries.get(id));entries.delete(id);}
 function draw(ctx,w,h,id){const e=entries.get(id);if(!e)return false;const m=e.media,sw=m.videoWidth||m.naturalWidth,sh=m.videoHeight||m.naturalHeight;if(!sw||!sh)return false;const scale=Math.min(w/sw,h/sh);ctx.save();ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);ctx.drawImage(m,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);ctx.restore();return true;}
 root.XpaceScreenMedia={preview,restore,draw,get:id=>entries.get(id)?.track||null};root.addEventListener('pagehide',()=>{for(const id of pending.keys())pending.delete(id);for(const id of entries.keys())restore(id);});
})(typeof window!=='undefined'?window:globalThis);
