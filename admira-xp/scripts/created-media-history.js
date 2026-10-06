/* Completed creation receipts, per Xpace and browser. No generation, playback or remote writes. */
(function(root){'use strict';
 const MAX=6,LEGACY='xpaceos.expert-previews.v1';
 let context='default';try{const q=new URL(root.location.href).searchParams;context=q.get('loc')||q.get('store')||q.get('project')||'default';}catch(_){}
 const KEY='xpaceos.created-media.v2:'+encodeURIComponent(context);
 function valid(kind,v){
  if(!['image','video','music','voice'].includes(kind)||!v||!/^[-\w]{1,120}$/.test(v.id||''))return null;
  let u;try{u=new URL(v.url);}catch(_){return null;}
  if(u.username||u.password||u.protocol!=='https:')return null;
  if(u.origin==='https://stock.admira.store'&&u.pathname.startsWith('/stock/'+v.id+'/asset.'))u=new URL('https://api.admira.store/stock/asset/'+v.id);
  if(u.origin!=='https://api.admira.store'||u.pathname!=='/stock/asset/'+v.id)return null;
  return {...v,kind,url:u.href,at:Number(v.at)||Date.now()};
 }
 function read(storage,key){try{const v=JSON.parse(storage?.getItem(key)||'[]');return Array.isArray(v)?v.map(x=>valid(x.kind,x)).filter(Boolean):[];}catch(_){return [];}}
 let items=read(root.localStorage,KEY);if(!items.length)items=read(root.sessionStorage,LEGACY);
 function persist(){for(const storage of [root.localStorage,root.sessionStorage])try{storage?.setItem(KEY,JSON.stringify(items));}catch(_){}}
 function add(kind,value){const v=valid(kind,value);if(!v)return null;items=[v,...items.filter(x=>x.id!==v.id||x.kind!==kind)].slice(0,MAX);persist();root.dispatchEvent?.(new root.CustomEvent('xpace:media-created',{detail:{kind,track:v}}));return v;}
 function clear(){items=[];persist();try{root.sessionStorage?.removeItem(LEGACY);}catch(_){}}
 persist();root.XpaceCreatedMedia={key:KEY,add,clear,list:()=>items.map(x=>({...x})),valid};
})(typeof window!=='undefined'?window:globalThis);
