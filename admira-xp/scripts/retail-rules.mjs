import './xpl-runtime.js?v=xtore-ux-3';
import {POS_DEMO_SONG,createPOSDemoSound} from './pos-demo-sound.mjs?v=xtore-ux-3';
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
export const RETAIL_SCREEN_IDS=[...Array.from({length:6},(_,i)=>'starbucks-wall-0'+(i+1)),'starbucks-tpv-01','starbucks-ipad-01'];
export const reactionForAction=action=>RETAIL_REACTIONS.find(r=>r.action===action?.id);
export function reactionFor(rule){return reactionForAction(rule.do?.[0]);}
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
export function validRetailRule(r){return r&&typeof r.id==='string'&&r.when?.conds?.length===1&&RETAIL_EVENTS.includes(r.when.conds[0].fact)&&r.when.conds[0].value===true&&Array.isArray(r.do)&&r.do.length>=1&&r.do.length<=8&&r.do.every(a=>!!reactionForAction(a)&&typeof a.value==='string'&&(a.filter===undefined||typeof a.filter==='string')&&(a.screens===undefined||Array.isArray(a.screens)&&a.screens.length>=1&&a.screens.length<=8&&new Set(a.screens).size===a.screens.length&&a.screens.every(id=>RETAIL_SCREEN_IDS.includes(id))));}
export function createRetailRulebook({storage=globalThis.localStorage,XPL=globalThis.XPL,fetcher=globalThis.fetch,onChange=()=>{}}={}){
 let rules=[defaultRetailRule()],songs=[mediaAsset(POS_DEMO_SONG)],loading=false,error='',loaded=false,inflight;
 try{const raw=storage.getItem(RETAIL_RULES_KEY);if(raw!==null){const d=JSON.parse(raw);if([1,2,3].includes(d.version)&&Array.isArray(d.rules)){rules=d.rules.filter(validRetailRule);songs=[...new Map([mediaAsset(POS_DEMO_SONG),...(d.media||d.songs||[]).map(mediaAsset).filter(Boolean)].map(s=>[s.kind+':'+s.id,s])).values()];}}}catch{}
 const state=()=>({rules:structuredClone(rules),media:structuredClone(songs),songs:structuredClone(songs.filter(a=>a.kind==='music')),loading,error});
 function save(next){if(!Array.isArray(next)||next.some(r=>!validRetailRule(r)))throw Error('rule');const copy=structuredClone(next);storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:3,rules:copy,media:songs}));rules=copy;onChange(state());}
 async function refresh(){if(inflight)return inflight;loading=true;error='';onChange(state());inflight=(async()=>{try{const res=await fetcher(RETAIL_CATALOG_URL,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(65000)});if(!res.ok)throw Error('stock');const d=await res.json();const items=(d.items||[]).map(mediaAsset).filter(Boolean);songs=[...new Map([...songs,...items].map(s=>[s.kind+':'+s.id,s])).values()];loaded=true;try{storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:3,rules,media:songs}));}catch{error='storage';}}catch{error='stock';}finally{loading=false;inflight=null;onChange(state());}return state();})();return inflight;}
 function selectActions(event,snapshot=rules){if(!RETAIL_EVENTS.includes(event))return [];const facts={muffinPicked:false,muffinDelivered:false,[event]:true};const matches=snapshot.filter(r=>r.enabled!==false&&validRetailRule(r)&&XPL.evalCondition(r.when,{fact:id=>facts[id]}));matches.sort((a,b)=>(a.priority||0)-(b.priority||0));const rule=matches.at(-1);if(!rule)return [];return rule.do.flatMap(action=>{const asset=songs.find(s=>s.id===action.value&&s.kind===reactionForAction(action).kind);return asset?[{...asset,screens:action.screens||['starbucks-tpv-01']}]:[];});}
 const select=(event,snapshot=rules)=>selectActions(event,snapshot)[0]||null;
 return {state,save,refresh,ensure:()=>loaded?Promise.resolve(state()):refresh(),select,selectActions};
}
let shared;
export function retailRulebook(){return shared||(shared=createRetailRulebook({onChange:()=>globalThis.dispatchEvent(new CustomEvent('xpace:retail-rules'))}));}
// Snapshot and prime all actions inside the original gesture. One event, N DOs.
export function createRetailRulePlayer({book,audio,audioFactory, music,visual,visualFactory,onState=()=>{}}){
 let plans=new Map(),fired=new Set(),active=[],error='',generation=0;
 const state=()=>({playing:active.some(x=>x.playing),title:[...new Set(active.map(x=>x.asset.title))].join(' + '),kind:active[0]?.asset.kind||'',error,actions:active.map(x=>({title:x.asset.title,kind:x.asset.kind,screens:x.asset.screens,playing:x.playing}))});
 const publish=()=>onState(state());
 function stop(){generation++;for(const entries of plans.values())for(const e of entries){e.dispose();e.playing=false;}plans.clear();active=[];error='';publish();}
 function prepare(){stop();fired.clear();const snapshot=book.state().rules;let audioUsed=false;for(const event of RETAIL_EVENTS){
   const assets=book.selectActions?book.selectActions(event,snapshot):[book.select(event,snapshot)].filter(Boolean),hasAudio=assets.some(a=>['music','locucion'].includes(a.kind));let videoAudioUsed=false;
   const entries=[];
   for(let index=0;index<assets.length;index++){
    const asset=assets[index];
    const destinations=['image','video'].includes(asset.kind)?asset.screens.filter(id=>!assets.slice(index+1).some(a=>['image','video'].includes(a.kind)&&a.screens.includes(id))):[null];
    for(const destination of destinations){const entry={asset:{...asset,screens:destination?[destination]:[]},playing:false};
     const end=value=>{entry.playing=false;if(value?.error)error='media';publish();};
     if(['music','locucion'].includes(asset.kind)){
      const node=audioUsed?audioFactory?.():audio;audioUsed=true;if(!node)continue;
      const adapter=createPOSDemoSound({audio:node,music,onEnded:end});adapter.prepare(asset);entry.play=()=>adapter.play();entry.dispose=()=>{adapter.dispose();if(node!==audio)node.remove?.();};
     }else{
      const muted=hasAudio||videoAudioUsed;if(asset.kind==='video')videoAudioUsed=true;
      const adapter=visualFactory?visualFactory(destination,{muted}):visual;if(!adapter)continue;
      const unsubscribe=adapter.subscribe?.(end);adapter.prepare(asset);entry.play=()=>adapter.play();entry.dispose=()=>{unsubscribe?.();adapter.dispose?.();adapter.stop?.();};
     }entries.push(entry);
    }
   }plans.set(event,entries);
  }}
 async function fire(event){if(fired.has(event))return state();fired.add(event);const entries=plans.get(event)||[];if(!entries.length)return state();const token=generation;
  // A later delivery reaction replaces the pickup reaction without losing priming.
  for(const e of active)if(!entries.includes(e)){e.dispose();e.playing=false;}active=entries;error='';
  await Promise.all(entries.map(async e=>{try{await e.play();if(token===generation)e.playing=true;}catch{if(token===generation){e.playing=false;error='media';}}}));
  if(token===generation)publish();return state();
 }
 return {state,prepare,fire,stop,dispose:stop};
}
