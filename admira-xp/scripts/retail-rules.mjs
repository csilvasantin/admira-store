import './xpl-runtime.js?v=retail-rules-1';
import {POS_DEMO_SONG,createPOSDemoSound} from './pos-demo-sound.mjs?v=retail-rules-1';
export const RETAIL_RULES_KEY='xpaceos.xpl.retail.v1:alsea-sbux-021:starbucks-tpv-01';
export const RETAIL_STOCK_URL='https://api.admira.store/stock/list?limit=200';
export const RETAIL_EVENTS=Object.freeze(['muffinPicked','muffinDelivered']);
export function songAsset(item){
 if(!item?.id||!item.url)return null;
 try{const u=new URL(item.url);if(u.protocol!=='https:'||!['stock.admira.store','api.admira.store'].includes(u.hostname))return null;}catch{return null;}
 return {id:String(item.id),title:String(item.title||item.id),url:item.url};
}
export function defaultRetailRule(){return {id:'muffin-song',enabled:true,priority:1,when:{join:'and',conds:[{fact:'muffinPicked',value:true}]},do:[{id:'playSong',value:POS_DEMO_SONG.id}]};}
export function validRetailRule(r){return r&&typeof r.id==='string'&&r.when?.conds?.length===1&&RETAIL_EVENTS.includes(r.when.conds[0].fact)&&r.when.conds[0].value===true&&r.do?.length===1&&r.do[0].id==='playSong'&&typeof r.do[0].value==='string';}
export function createRetailRulebook({storage=globalThis.localStorage,XPL=globalThis.XPL,fetcher=globalThis.fetch,onChange=()=>{}}={}){
 let rules=[defaultRetailRule()],songs=[POS_DEMO_SONG],loading=false,error='',loaded=false,inflight;
 try{const raw=storage.getItem(RETAIL_RULES_KEY);if(raw!==null){const d=JSON.parse(raw);if(d.version===1&&Array.isArray(d.rules)){rules=d.rules.filter(validRetailRule);songs=[...new Map([POS_DEMO_SONG,...(d.songs||[]).map(songAsset).filter(Boolean)].map(s=>[s.id,s])).values()];}}}catch{}
 const state=()=>({rules:structuredClone(rules),songs:structuredClone(songs),loading,error});
 function save(next){if(!Array.isArray(next)||next.some(r=>!validRetailRule(r)))throw Error('rule');const copy=structuredClone(next);storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:1,rules:copy,songs}));rules=copy;onChange(state());}
 async function refresh(){if(inflight)return inflight;loading=true;error='';onChange(state());inflight=(async()=>{try{const res=await fetcher(RETAIL_STOCK_URL,{cache:'no-store'});if(!res.ok)throw Error('stock');const d=await res.json();const items=(d.items||[]).filter(i=>i.type==='music').map(songAsset).filter(Boolean);songs=[...new Map([...songs,...items].map(s=>[s.id,s])).values()];loaded=true;try{storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:1,rules,songs}));}catch{error='storage';}}catch{error='stock';}finally{loading=false;inflight=null;onChange(state());}return state();})();return inflight;}
 function select(event,snapshot=rules){if(!RETAIL_EVENTS.includes(event))return null;const facts={muffinPicked:false,muffinDelivered:false,[event]:true};const matches=snapshot.filter(r=>r.enabled!==false&&validRetailRule(r)&&XPL.evalCondition(r.when,{fact:id=>facts[id]}));matches.sort((a,b)=>(a.priority||0)-(b.priority||0));const rule=matches.at(-1);if(!rule)return null;return songs.find(s=>s.id===rule.do[0].value)||null;}
 return {state,save,refresh,ensure:()=>loaded?Promise.resolve(state()):refresh(),select};
}
let shared;
export function retailRulebook(){return shared||(shared=createRetailRulebook({onChange:()=>globalThis.dispatchEvent(new CustomEvent('xpace:retail-rules'))}));}
// A gesture snapshots the editable rules and primes audio. Each event fires once.
export function createRetailRulePlayer({book,audio,music,onState=()=>{}}){
 let snapshot=[],fired=new Set(),current=null,playing=false,error='',generation=0;
 const sound=createPOSDemoSound({audio,music,onEnded:()=>{playing=false;onState(state());}});
 const state=()=>({playing,title:current?.title||'',error});
 function stop(){generation++;sound.stop();playing=false;error='';onState(state());}
 function prepare(){stop();snapshot=book.state().rules;fired.clear();current=book.select('muffinPicked',snapshot)||book.select('muffinDelivered',snapshot);if(current)sound.prepare(current);}
 async function fire(event){if(fired.has(event))return state();fired.add(event);const track=book.select(event,snapshot);if(!track)return state();const token=generation;try{if(track.id!==current?.id){current=track;sound.prepare(track);}await sound.play();if(token!==generation)return state();playing=true;error='';onState(state());}catch{if(token===generation){playing=false;error='audio';onState(state());throw Error('audio');}}return state();}
 return {state,prepare,fire,stop,dispose(){stop();sound.dispose();}};
}
