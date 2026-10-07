(function(root){
 const KEY='xpaceos.day-summary.v1';
 function create({storage,onDisable=()=>{},lang=()=> 'es'}={}){
  let on=false;try{on=storage?.getItem(KEY)==='on';}catch{}
  return {enabled:()=>on,set(value){try{storage?.setItem(KEY,value?'on':'off');}catch{}on=!!value;if(!on)onDisable();return on;},handle(text){
   const m=String(text||'').trim().match(/^\/(?:resumen\s+dia|summary\s+day|day\s+summary)(?:\s+(.*))?$/i);if(!m)return null;
   const value=(m[1]||'').toLowerCase(),en=lang()==='en';if(!['on','off','estado','status'].includes(value))return {ok:false,local:true,message:en?'Use /summary day on|off (default OFF).':'Usa /resumen dia on|off (por defecto OFF).'};
   if(value==='on'||value==='off')this.set(value==='on');return {ok:true,local:true,message:(en?'End-of-day summary · ':'Resumen del día · ')+(on?'ON':'OFF')};
  }};
 }
 if(typeof module!=='undefined')module.exports={create,KEY};
 if(root.document){let storage;try{storage=root.localStorage;}catch{}root.XpaceDaySummary=create({storage,lang:()=>root.document.documentElement.lang,onDisable:()=>root.closeDaySummary?.()});}
})(typeof window==='undefined'?globalThis:window);
