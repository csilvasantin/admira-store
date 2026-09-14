export const SCREEN='xtore-virtual-zapatillas';
export const TTL=2500;
export function exteriorPassages(passages,frameAt,now=Date.now()){
  if(!Number.isFinite(frameAt)||now-frameAt>=1500||frameAt>now+1000||!passages)return null;
  if(!['person','car','motorcycle','bicycle'].every(k=>Number.isSafeInteger(passages[k])&&passages[k]>=0&&passages[k]<=10000000))return null;
  return passages.person;
}
export function allowedOrigin(origin,own){
  return ['https://admira.tv','https://www.admira.tv'].includes(origin)||
    (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(own)&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
}
export function playbackState(p,now=Date.now()){
  if(!p||typeof p.id!=='string'||p.id.length>150||typeof p.url!=='string'||p.url.length>4096)return null;
  let u;try{u=new URL(p.url);}catch{return null;}
  if(u.protocol!=='https:'||u.username||u.password)return null;
  if(!['video','audio','image'].includes(p.type)||!Number.isFinite(p.ts)||now-p.ts>TTL||p.ts-now>1000)return null;
  if(!Number.isFinite(p.position)||p.position<0||p.position>86400||!Number.isFinite(p.duration)||p.duration<0||p.duration>86400)return null;
  if(typeof p.paused!=='boolean'||!Number.isFinite(p.rate)||p.rate<.25||p.rate>4)return null;
  return {id:p.id,url:u.href,title:String(p.title||'').slice(0,250),type:p.type,position:p.position,duration:p.duration,paused:p.paused,rate:p.rate,loop:p.loop===true,ts:p.ts};
}
export function targetTime(p,now=Date.now()){
  const position=p.position+(p.paused?0:Math.max(0,now-p.ts)/1000*p.rate);
  return p.duration>0?Math.min(position,Math.max(0,p.duration-.05)):position;
}
export class MirrorSession{
  constructor({peer,origin,session,now=()=>Date.now()}){Object.assign(this,{peer,origin,session,now});this.seq=-1;}
  receive(e){
    const d=e.data;
    if(e.source!==this.peer||e.origin!==this.origin||d?.source!=='admira-xtore-twin'||d.screen!==SCREEN||d.session!==this.session)return null;
    if(d.event==='hello'){this.seq=-1;return d;}
    if(!Number.isSafeInteger(d.seq)||d.seq<=this.seq||!Number.isFinite(d.ts)||this.now()-d.ts>TTL||d.ts-this.now()>1000)return null;
    this.seq=d.seq;return d;
  }
}
