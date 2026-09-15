export const SCREEN='xtore-virtual-zapatillas';
export const TTL=2500;
export const TRAFFIC_TTL=1500;
const TRAFFIC_KINDS=new Set(['person','car','motorcycle','bicycle','scooter']);
const exactKeys=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));

// No data from bitmap messages can extend these independently timed tracks.
export function validatedTraffic(value,now=Date.now()){
  if(!exactKeys(value,['frameAt','tracks'])||!Number.isFinite(now)||!Number.isFinite(value.frameAt)||
    value.frameAt>now||now-value.frameAt>=TRAFFIC_TTL||!Array.isArray(value.tracks)||value.tracks.length>100)return null;
  const ids=new Set(),tracks=[];
  for(const track of value.tracks){
    const keys=['id','kind','box','x','y','observedAt','confirmed',...(track?.kind==='scooter'?['manual']:[])];
    if(!exactKeys(track,keys)||!Number.isSafeInteger(track.id)||track.id<1||ids.has(track.id)||
      !TRAFFIC_KINDS.has(track.kind)||track.confirmed!==true||(track.kind==='scooter'&&track.manual!==true)||
      !Array.isArray(track.box)||track.box.length!==4||!track.box.every(Number.isFinite)||
      track.box[0]<0||track.box[1]<0||track.box[2]<=0||track.box[3]<=0||
      track.box[0]+track.box[2]>1.000000001||track.box[1]+track.box[3]>1.000000001||
      !Number.isFinite(track.x)||!Number.isFinite(track.y)||track.x<0||track.x>1||track.y<0||track.y>1||
      Math.abs(track.x-(track.box[0]+track.box[2]/2))>1e-9||Math.abs(track.y-(track.box[1]+track.box[3]))>1e-9||
      !Number.isFinite(track.observedAt)||track.observedAt>value.frameAt||now-track.observedAt>=TRAFFIC_TTL)return null;
    ids.add(track.id);
    tracks.push(Object.freeze({...track,box:Object.freeze([...track.box])}));
  }
  return {frameAt:value.frameAt,tracks:Object.freeze(tracks)};
}

export class TrafficState{
  constructor(now=()=>Date.now()){this.now=now;this.clear();}
  clear(status='disconnected'){this.value=null;this.at=-Infinity;this.status=status;}
  update(value){
    const next=validatedTraffic(value,this.now());
    if(!next||next.frameAt<=this.at)return false;
    this.value=next;this.at=next.frameAt;this.status='live';return true;
  }
  read(){
    const now=this.now();
    if(this.value&&(now<this.at||now-this.at>=TRAFFIC_TTL)){this.value=null;this.status='stale';}
    return {status:this.status,source:'puerta-cam',frameAt:Number.isFinite(this.at)?this.at:null,
      tracks:this.value?this.value.tracks.filter(track=>now>=track.observedAt&&now-track.observedAt<TRAFFIC_TTL):[]};
  }
}
// Inference finishes after the raw preview. A fresh processed frame may upgrade
// that preview even if it was captured earlier; it retains its original expiry.
export function acceptsCameraFrame(frameAt,modified,lastCamera,wasModified,now=Date.now()){
  if(!Number.isFinite(frameAt)||now-frameAt>=1500||frameAt>now+1000)return false;
  return frameAt>lastCamera||(modified===true&&wasModified!==true);
}
export function exteriorStatistics(passages,frameAt,now=Date.now(),ttl=1500){
  if(!Number.isFinite(frameAt)||now-frameAt>=ttl||frameAt>now+1000||!passages)return null;
  if(!['person','car','motorcycle','bicycle'].every(k=>Number.isSafeInteger(passages[k])&&passages[k]>=0&&passages[k]<=10000000))return null;
  const counts=Object.fromEntries(['person','car','motorcycle','bicycle'].map(k=>[k,passages[k]]));
  counts.scooter=Number.isSafeInteger(passages.scooter)&&passages.scooter>=0&&passages.scooter<=10000000?passages.scooter:null;
  return counts;
}
export function exteriorPassages(passages,frameAt,now=Date.now()){
  return exteriorStatistics(passages,frameAt,now)?.person??null;
}
// Counter snapshots have their own heartbeat. Camera pauses must not erase totals.
export class PassageState{
  constructor(now=()=>Date.now()){this.now=now;this.clear();}
  clear(){this.value=null;this.at=0;this.dedicated=false;}
  update(passages,at,dedicated=false){
    if(this.dedicated&&!dedicated)return false;
    const value=exteriorStatistics(passages,at,this.now(),dedicated?4000:1500);
    if(!value||at<this.at)return false;
    this.value=value;this.at=at;this.dedicated=dedicated;return true;
  }
  read(){return exteriorStatistics(this.value,this.at,this.now(),this.dedicated?4000:1500);}
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
