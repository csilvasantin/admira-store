// Guided local demo. Uses real basket actions, never synthetic pointer events.
export const POS_DEMO_FOCUS={yaw:12.2,pitch:-6,fov:45};
export const POS_DEMO_STEPS=Object.freeze({focus:1400,outline:2700,pick:3400,travel:5800,drop:6400});
const ease=p=>p*p*(3-2*p);
export function interpolateView(a,b,p){p=ease(Math.max(0,Math.min(1,p)));const delta=((b.yaw-a.yaw+540)%360)-180;return {yaw:a.yaw+delta*p,pitch:a.pitch+(b.pitch-a.pitch)*p,fov:a.fov+(b.fov-a.fov)*p};}
export function createPOSDemo({camera,checkout,isAvailable,presentation,drop,sound,onState=()=>{},requestFrame=globalThis.requestAnimationFrame,cancelFrame=globalThis.cancelAnimationFrame,now=()=>performance.now()}={}){
 let epoch=0,run=null,frame=0,phase='idle',song=false,error='',disposed=false;
 const state=()=>({phase,running:!!run,song,error});
 const emit=()=>onState(state());
 function stop({restore=true}={}){const old=run;epoch++;run=null;cancelFrame(frame);sound.stop();song=false;presentation.clear();if(old&&restore)camera.set(old.before);phase='idle';error='';emit();}
 async function finish(current){
  if(run!==current)return;
  if(!isAvailable()){stop();return;}
  try{if(!drop())throw Error('basket');}catch(e){run=null;phase='error';error=e.message||'basket';presentation.clear();sound.stop();emit();return;}
  run=null;phase='checkout';presentation.clear();emit();
  try{await sound.play();if(disposed||epoch!==current.epoch||phase!=='checkout')return;song=true;phase='completed';emit();}
  catch{if(disposed||epoch!==current.epoch||phase!=='checkout')return;song=false;phase='error';error='audio';emit();}
 }
 function tick(time){const current=run;if(!current||disposed)return;if(!isAvailable()){stop();return;}
  const elapsed=Math.max(0,time-current.start),s=POS_DEMO_STEPS;
  if(elapsed<s.focus){phase='focus';camera.set(interpolateView(current.before,POS_DEMO_FOCUS,elapsed/s.focus));presentation.show({phase});}
  else if(elapsed<s.outline){phase='outline';camera.set(POS_DEMO_FOCUS);presentation.show({phase});}
  else if(elapsed<s.pick){phase='pick';presentation.show({phase,progress:0,lift:(elapsed-s.outline)/(s.pick-s.outline)});}
  else if(elapsed<s.travel){phase='travel';const p=(elapsed-s.pick)/(s.travel-s.pick);camera.set(interpolateView(POS_DEMO_FOCUS,checkout,p));presentation.show({phase,progress:ease(p),lift:1});}
  else if(elapsed<s.drop){phase='drop';camera.set(checkout);presentation.show({phase,progress:1,lift:1});}
  else{void finish(current);return;}
  emit();frame=requestFrame(tick);
 }
 return {state,start(){if(disposed)return {ok:false,error:'unavailable'};if(run||phase==='checkout')return {ok:false,error:'busy'};if(!isAvailable())return {ok:false,error:'unavailable'};stop({restore:false});const before=camera.get();run={before,start:now(),epoch};phase='focus';error='';sound.prepare();presentation.begin();emit();frame=requestFrame(tick);return {ok:true};},stop,songEnded(){song=false;emit();},dispose(){stop({restore:false});disposed=true;}};
}
