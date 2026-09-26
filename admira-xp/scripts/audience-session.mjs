const keys=['person','car','motorcycle','bicycle','scooter'];
const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000;
export function validAudience(v){
  return !!(v&&v.schema==='admira.audience-session.v1'&&/^[a-f0-9-]{36}$/.test(v.sessionId||'')&&
    v.site==='admira-xperience-santa-rosa-19'&&v.source==='puerta-cam'&&v.screen==='xtore-virtual-zapatillas'&&v.metric==='cumulative-passages'&&
    Number.isSafeInteger(v.startedAt)&&v.startedAt>0&&Number.isSafeInteger(v.updatedAt)&&v.updatedAt>=v.startedAt&&count(v.revision)&&
    ['analyzing','paused','waiting','disconnected'].includes(v.state)&&keys.every(k=>count(v.counts?.[k]))&&
    ['enter','exit','unknown'].every(k=>count(v.directions?.[k]))&&v.directions.enter+v.directions.exit+v.directions.unknown===v.counts.person&&
    Array.isArray(v.directionAxis)&&v.directionAxis.length===2&&v.directionAxis.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1))&&Math.hypot(v.directionAxis[1][0]-v.directionAxis[0][0],v.directionAxis[1][1]-v.directionAxis[0][1])>=.2&&
    v.directionMeaning?.enter==='toward-camera'&&v.directionMeaning?.exit==='toward-street-end');
}
export class AudienceSessionState{
  constructor(now=()=>Date.now()){this.now=now;this.clear();}
  clear(){this.value=null;this.at=0;}
  update(value,at){
    if(!validAudience(value)||!Number.isFinite(at)||at<this.at||this.now()-at>=4000||at>this.now()+1000)return false;
    const prev=this.value;
    if(prev?.sessionId===value.sessionId){
      if(value.revision<prev.revision||keys.some(k=>value.counts[k]<prev.counts[k])||value.directions.enter<prev.directions.enter||value.directions.exit<prev.directions.exit)return false;
      if(value.revision===prev.revision&&(keys.some(k=>value.counts[k]!==prev.counts[k])||['enter','exit','unknown'].some(k=>value.directions[k]!==prev.directions[k])))return false;
    }
    this.value=structuredClone(value);this.at=at;return true;
  }
  read(){return this.value&&this.now()-this.at<4000?structuredClone(this.value):null;}
}
export function sessionStoreTarget(audience,limit=80){
  if(!validAudience(audience))return null;
  return {total:audience.counts.person,rendered:Math.min(limit,audience.counts.person),overflow:Math.max(0,audience.counts.person-limit)};
}
