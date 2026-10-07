import './xpl-runtime.js?v=retail-media-2';
import {POS_DEMO_SONG,createPOSDemoSound} from './pos-demo-sound.mjs?v=retail-media-2';
export const RETAIL_RULES_KEY='xpaceos.xpl.retail.v1:alsea-sbux-021:starbucks-tpv-01';
export const RETAIL_STOCK_URL='https://api.admira.store/stock/list?type=music&limit=200';
export const RETAIL_CATALOG_URL='https://www.admira.store/admira-xp/media-catalog';
export const RETAIL_EVENTS=Object.freeze(['muffinPicked','muffinDelivered']);
export const RETAIL_REACTIONS=Object.freeze([
 {kind:'music',action:'playSong',filter:'#musica',es:'Música',en:'Music'},
 {kind:'locucion',action:'playVoice',filter:'#locucion',es:'Locución',en:'Voiceover'},
 {kind:'image',action:'showImage',filter:'#imagen',es:'Imagen',en:'Image'},
 {kind:'video',action:'playVideo',filter:'#video',es:'Vídeo',en:'Video'}
]);
export function reactionFor(rule){return RETAIL_REACTIONS.find(r=>r.action===rule.do?.[0]?.id);}
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function mediaAsset(item){
 const kind=item?.type==='audio'?'music':item?.type||item?.kind||'music';
 if(!item?.id||!item.url||!RETAIL_REACTIONS.some(r=>r.kind===kind))return null;
 try{const u=new URL(item.url);if(u.protocol!=='https:'||u.username||u.password||!u.pathname.startsWith('/stock/')||!['stock.admira.store','api.admira.store'].includes(u.hostname))return null;}catch{return null;}
 return {id:String(item.id),title:String(item.title||item.id),url:item.url,kind,tags:Array.isArray(item.tags)?item.tags.filter(t=>typeof t==='string'):[]};
}
export function songAsset(item){const a=mediaAsset(item);return a?.kind==='music'?a:null;}
export function filterRetailMedia(items,kind,query=''){
 const q=fold(query),builtins={'#musica':'music','#music':'music','#locucion':'locucion','#voiceover':'locucion','#imagen':'image','#image':'image','#video':'video'};
 return items.filter(a=>a.kind===kind&&(!q||q==='todos'||q==='all'||builtins[q]===kind||(q.startsWith('#')?a.tags.some(tag=>fold(tag).replace(/^#/,'')===q.slice(1)):fold(a.title+' '+a.tags.join(' ')).includes(q))));
}
export function defaultRetailRule(){return {id:'muffin-song',enabled:true,priority:1,when:{join:'and',conds:[{fact:'muffinPicked',value:true}]},do:[{id:'playSong',filter:'#musica',value:POS_DEMO_SONG.id}]};}
export function validRetailRule(r){return r&&typeof r.id==='string'&&r.when?.conds?.length===1&&RETAIL_EVENTS.includes(r.when.conds[0].fact)&&r.when.conds[0].value===true&&r.do?.length===1&&!!reactionFor(r)&&typeof r.do[0].value==='string'&&(r.do[0].filter===undefined||typeof r.do[0].filter==='string');}
export function createRetailRulebook({storage=globalThis.localStorage,XPL=globalThis.XPL,fetcher=globalThis.fetch,onChange=()=>{}}={}){
 let rules=[defaultRetailRule()],songs=[mediaAsset(POS_DEMO_SONG)],loading=false,error='',loaded=false,inflight;
 try{const raw=storage.getItem(RETAIL_RULES_KEY);if(raw!==null){const d=JSON.parse(raw);if([1,2].includes(d.version)&&Array.isArray(d.rules)){rules=d.rules.filter(validRetailRule);songs=[...new Map([mediaAsset(POS_DEMO_SONG),...(d.media||d.songs||[]).map(mediaAsset).filter(Boolean)].map(s=>[s.id,s])).values()];}}}catch{}
 const state=()=>({rules:structuredClone(rules),media:structuredClone(songs),songs:structuredClone(songs.filter(a=>a.kind==='music')),loading,error});
 function save(next){if(!Array.isArray(next)||next.some(r=>!validRetailRule(r)))throw Error('rule');const copy=structuredClone(next);storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:2,rules:copy,media:songs}));rules=copy;onChange(state());}
 async function refresh(){if(inflight)return inflight;loading=true;error='';onChange(state());inflight=(async()=>{try{const res=await fetcher(RETAIL_CATALOG_URL,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(65000)});if(!res.ok)throw Error('stock');const d=await res.json();const items=(d.items||[]).map(mediaAsset).filter(Boolean);songs=[...new Map([...songs,...items].map(s=>[s.id,s])).values()];loaded=true;try{storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:2,rules,media:songs}));}catch{error='storage';}}catch{error='stock';}finally{loading=false;inflight=null;onChange(state());}return state();})();return inflight;}
 function select(event,snapshot=rules){if(!RETAIL_EVENTS.includes(event))return null;const facts={muffinPicked:false,muffinDelivered:false,[event]:true};const matches=snapshot.filter(r=>r.enabled!==false&&validRetailRule(r)&&XPL.evalCondition(r.when,{fact:id=>facts[id]}));matches.sort((a,b)=>(a.priority||0)-(b.priority||0));const rule=matches.at(-1);if(!rule)return null;return songs.find(s=>s.id===rule.do[0].value&&s.kind===reactionFor(rule).kind)||null;}
 return {state,save,refresh,ensure:()=>loaded?Promise.resolve(state()):refresh(),select};
}
let shared;
export function retailRulebook(){return shared||(shared=createRetailRulebook({onChange:()=>globalThis.dispatchEvent(new CustomEvent('xpace:retail-rules'))}));}
// A gesture snapshots the editable rules and primes audio. Each event fires once.
export function createRetailRulePlayer({book,audio,music,visual,onState=()=>{}}){
 let snapshot=[],fired=new Set(),current=null,playing=false,error='',generation=0;
 const sound=createPOSDemoSound({audio,music,onEnded:()=>{playing=false;onState(state());}});
 const state=()=>({playing,title:current?.title||'',kind:current?.kind||'',error});
 function stop(){generation++;sound.stop();visual?.stop();playing=false;error='';onState(state());}
 function prepare(){stop();snapshot=book.state().rules;fired.clear();current=book.select('muffinPicked',snapshot)||book.select('muffinDelivered',snapshot);if(current){if(['music','locucion'].includes(current.kind))sound.prepare(current);else visual?.prepare(current);}}
 async function fire(event){if(fired.has(event))return state();fired.add(event);const track=book.select(event,snapshot);if(!track)return state();const token=generation;try{if(track.id!==current?.id||track.kind!==current?.kind){sound.stop();visual?.stop();current=track;if(['music','locucion'].includes(track.kind))sound.prepare(track);else visual?.prepare(track);}if(['music','locucion'].includes(track.kind))await sound.play();else{if(!visual)throw Error('display');await visual.play();}if(token!==generation)return state();playing=true;error='';onState(state());}catch{if(token===generation){playing=false;error='audio';onState(state());throw Error('audio');}}return state();}
 const unsubscribe=visual?.subscribe(value=>{playing=false;error=value?.error?'media':'';onState(state());});
 return {state,prepare,fire,stop,dispose(){stop();unsubscribe?.();sound.dispose();visual?.dispose();}};
}
