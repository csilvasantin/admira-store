import './xpl-runtime.js?v=agua-voz-1';
import {POS_DEMO_SONG,createPOSDemoSound} from './pos-demo-sound.mjs?v=xtore-ux-3';
import {WATER_THANKS,VOICE_MODES,createVoiceSpeaker} from './retail-voice.mjs?v=agua-voz-1';
export const RETAIL_RULES_KEY='xpaceos.xpl.retail.v1:alsea-sbux-021:starbucks-tpv-01';
export const RETAIL_STOCK_URL='https://api.admira.store/stock/list?type=music&limit=200';
export const RETAIL_CATALOG_URL='https://www.admira.store/admira-xp/media-catalog';
// waterDelivered (8-oct-2026): dejar una botella de agua en la caja. Cada entrega vuelve a disparar sus DO.
export const RETAIL_EVENTS=Object.freeze(['muffinPicked','muffinDelivered','waterDelivered']);
export const RETAIL_EVENT_LABELS=Object.freeze({muffinPicked:{es:'Cojo un muffin',en:'I pick up a muffin'},muffinDelivered:{es:'Llevo un muffin a la caja',en:'I take a muffin to the register'},waterDelivered:{es:'Dejo una botella de agua en la caja',en:'I leave a water bottle at the register'}});
export const RETAIL_REACTIONS=Object.freeze([
 {kind:'music',action:'playSong',filter:'#musica',es:'Música',en:'Music'},
 {kind:'locucion',action:'playVoice',filter:'#locucion',es:'Locución',en:'Voiceover'},
 {kind:'image',action:'showImage',filter:'#imagen',es:'Imagen',en:'Image'},
 {kind:'video',action:'playVideo',filter:'#video',es:'Vídeo',en:'Video'}
]);
// Reacciones sin catálogo (8-oct-2026): texto editable leído por megafonía y la oferta del agua (imagen dinámica 12 → 0).
export const RETAIL_TEXT_REACTIONS=Object.freeze([
 {kind:'tts',action:'sayText',filter:'',es:'🔊 Locución (texto)',en:'🔊 Voiceover (text)'},
 {kind:'offer',action:'showWaterOffer',filter:'',es:'Oferta del agua (imagen)',en:'Water offer (image)',only:'waterDelivered'}
]);
export const RETAIL_RULE_REACTIONS=Object.freeze([...RETAIL_REACTIONS,...RETAIL_TEXT_REACTIONS]);
export const RETAIL_SCREEN_IDS=[...Array.from({length:6},(_,i)=>'starbucks-wall-0'+(i+1)),'starbucks-tpv-01','starbucks-ipad-01'];
export const reactionForAction=action=>RETAIL_RULE_REACTIONS.find(r=>r.action===action?.id);
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
export const WATER_OFFER_SCREENS=Object.freeze(['starbucks-ipad-01',...Array.from({length:6},(_,i)=>'starbucks-wall-0'+(i+1))]);
export function defaultWaterRule(){return {id:'water-thanks',enabled:true,priority:1,when:{join:'and',conds:[{fact:'waterDelivered',value:true}]},do:[{id:'showWaterOffer',value:'water-offer',screens:[...WATER_OFFER_SCREENS]},{id:'sayText',value:WATER_THANKS.es,text:{...WATER_THANKS},voice:'auto'}]};}
const textAction=a=>a.id!=='sayText'||(a.text===undefined||a.text&&typeof a.text==='object'&&['es','en'].every(k=>a.text[k]===undefined||typeof a.text[k]==='string'&&a.text[k].length<=200))&&(a.voice===undefined||VOICE_MODES.includes(a.voice));
// Pantallas donde la regla activa de agua de más prioridad pone la oferta; sin regla de agua con oferta, ninguna.
export function waterOfferScreens(rules){const r=(rules||[]).filter(x=>x.enabled!==false&&validRetailRule(x)&&x.when.conds[0].fact==='waterDelivered').sort((a,b)=>(a.priority||0)-(b.priority||0)).at(-1);const o=r?.do.find(a=>a.id==='showWaterOffer');return o?[...(o.screens||WATER_OFFER_SCREENS)]:[];}
export function defaultRetailRule(){return {id:'muffin-song',enabled:true,priority:1,when:{join:'and',conds:[{fact:'muffinPicked',value:true}]},do:[{id:'playSong',filter:'#musica',value:POS_DEMO_SONG.id}]};}
export function validRetailRule(r){return r&&typeof r.id==='string'&&r.when?.conds?.length===1&&RETAIL_EVENTS.includes(r.when.conds[0].fact)&&r.when.conds[0].value===true&&Array.isArray(r.do)&&r.do.length>=1&&r.do.length<=8&&r.do.every(a=>!!reactionForAction(a)&&(reactionForAction(a).only===undefined||reactionForAction(a).only===r.when.conds[0].fact)&&textAction(a)&&typeof a.value==='string'&&(a.filter===undefined||typeof a.filter==='string')&&(a.screens===undefined||Array.isArray(a.screens)&&a.screens.length>=1&&a.screens.length<=8&&new Set(a.screens).size===a.screens.length&&a.screens.every(id=>RETAIL_SCREEN_IDS.includes(id))));}
export function createRetailRulebook({storage=globalThis.localStorage,XPL=globalThis.XPL,fetcher=globalThis.fetch,onChange=()=>{}}={}){
 let rules=[defaultRetailRule(),defaultWaterRule()],songs=[mediaAsset(POS_DEMO_SONG)],loading=false,error='',loaded=false,inflight;
 try{const raw=storage.getItem(RETAIL_RULES_KEY);if(raw!==null){const d=JSON.parse(raw);if([1,2,3].includes(d.version)&&Array.isArray(d.rules)){rules=d.rules.filter(validRetailRule);if(!(d.seeded||[]).includes('water')&&!rules.some(r=>r.when.conds[0].fact==='waterDelivered'))rules.push(defaultWaterRule());songs=[...new Map([mediaAsset(POS_DEMO_SONG),...(d.media||d.songs||[]).map(mediaAsset).filter(Boolean)].map(s=>[s.kind+':'+s.id,s])).values()];}}}catch{}
 const state=()=>({rules:structuredClone(rules),media:structuredClone(songs),songs:structuredClone(songs.filter(a=>a.kind==='music')),loading,error});
 function save(next){if(!Array.isArray(next)||next.some(r=>!validRetailRule(r)))throw Error('rule');const copy=structuredClone(next);storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:3,seeded:['water'],rules:copy,media:songs}));rules=copy;onChange(state());}
 async function refresh(){if(inflight)return inflight;loading=true;error='';onChange(state());inflight=(async()=>{try{const res=await fetcher(RETAIL_CATALOG_URL,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(65000)});if(!res.ok)throw Error('stock');const d=await res.json();const items=(d.items||[]).map(mediaAsset).filter(Boolean);songs=[...new Map([...songs,...items].map(s=>[s.kind+':'+s.id,s])).values()];loaded=true;try{storage.setItem(RETAIL_RULES_KEY,JSON.stringify({version:3,seeded:['water'],rules,media:songs}));}catch{error='storage';}}catch{error='stock';}finally{loading=false;inflight=null;onChange(state());}return state();})();return inflight;}
 function selectActions(event,snapshot=rules){if(!RETAIL_EVENTS.includes(event))return [];const facts={muffinPicked:false,muffinDelivered:false,waterDelivered:false,[event]:true};const matches=snapshot.filter(r=>r.enabled!==false&&validRetailRule(r)&&XPL.evalCondition(r.when,{fact:id=>facts[id]}));matches.sort((a,b)=>(a.priority||0)-(b.priority||0));const rule=matches.at(-1);if(!rule)return [];return rule.do.flatMap(action=>{if(action.id==='sayText')return [{id:'say:'+rule.id,kind:'tts',title:'🔊 '+(action.text?.es||action.value||WATER_THANKS.es),url:'',action:structuredClone(action),screens:[]}];if(action.id==='showWaterOffer')return [{id:'water-offer',kind:'offer',title:'Oferta agua / Water offer',url:'',screens:action.screens||[...WATER_OFFER_SCREENS]}];const asset=songs.find(s=>s.id===action.value&&s.kind===reactionForAction(action).kind);return asset?[{...asset,screens:action.screens||['starbucks-tpv-01']}]:[];});}
 const select=(event,snapshot=rules)=>selectActions(event,snapshot)[0]||null;
 return {state,save,refresh,ensure:()=>loaded?Promise.resolve(state()):refresh(),select,selectActions};
}
let shared;
export function retailRulebook(){return shared||(shared=createRetailRulebook({onChange:()=>globalThis.dispatchEvent(new CustomEvent('xpace:retail-rules'))}));}
// Snapshot and prime all actions inside the original gesture. One event, N DOs.
export function createRetailRulePlayer({book,audio,audioFactory, music,visual,visualFactory,speakerFactory=action=>createVoiceSpeaker(action),onState=()=>{}}){
 let plans=new Map(),fired=new Set(),active=[],error='',generation=0,repeat=[];
 const state=()=>({playing:active.some(x=>x.playing),title:[...new Set(active.map(x=>x.asset.title))].join(' + '),kind:active[0]?.asset.kind||'',error,actions:active.map(x=>({title:x.asset.title,kind:x.asset.kind,screens:x.asset.screens,playing:x.playing}))});
 const publish=()=>onState(state());
 function stop(){generation++;for(const entries of [...plans.values(),repeat])for(const e of entries){e.dispose();e.playing=false;}plans.clear();active=[];repeat=[];error='';publish();}
 function prepare(){stop();fired.clear();const snapshot=book.state().rules;let audioUsed=false;for(const event of RETAIL_EVENTS){
   if(event==='waterDelivered')continue; // se planifica en cada entrega (fire)
   const assets=book.selectActions?book.selectActions(event,snapshot):[book.select(event,snapshot)].filter(Boolean),hasAudio=assets.some(a=>['music','locucion','tts'].includes(a.kind));let videoAudioUsed=false;
   const entries=[];
   for(let index=0;index<assets.length;index++){
    const asset=assets[index];
    const destinations=['image','video'].includes(asset.kind)?asset.screens.filter(id=>!assets.slice(index+1).some(a=>['image','video'].includes(a.kind)&&a.screens.includes(id))):[null];
    for(const destination of destinations){const entry={asset:{...asset,screens:destination?[destination]:[]},playing:false};
     const end=value=>{entry.playing=false;if(value?.error)error='media';publish();};
     if(asset.kind==='offer')continue; // la pinta la experiencia TPV (waterOfferScreens)
     if(asset.kind==='tts'){const sp=speakerFactory?.(asset.action);if(!sp)continue;entry.play=async()=>{entry.playing=true;publish();try{await sp.play();}finally{end();}};entry.dispose=()=>sp.stop();entries.push(entry);continue;}
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
 // Agua: cada botella entregada vuelve a sonar; no sustituye la reacción del muffin que esté sonando.
 async function fireRepeat(event){for(const e of repeat)e.dispose();repeat=[];const assets=(book.selectActions?book.selectActions(event,book.state().rules):[]).filter(a=>a.kind==='tts');const entries=[];for(const asset of assets){const sp=speakerFactory?.(asset.action);if(!sp)continue;const entry={asset:{...asset},playing:false,dispose:()=>sp.stop()};entry.play=async()=>{entry.playing=true;publish();try{await sp.play();}finally{entry.playing=false;publish();}};entries.push(entry);}repeat=entries;active=[...active.filter(e=>!entries.includes(e)),...entries];for(const e of entries)await e.play().catch(()=>{error='media';});active=active.filter(e=>!entries.includes(e));publish();return state();}
 async function fire(event){if(event==='waterDelivered')return fireRepeat(event);if(fired.has(event))return state();fired.add(event);const entries=plans.get(event)||[];if(!entries.length)return state();const token=generation;
  // A later delivery reaction replaces the pickup reaction without losing priming.
  for(const e of active)if(!entries.includes(e)){e.dispose();e.playing=false;}active=entries;error='';
  await Promise.all(entries.map(async e=>{try{await e.play();if(token===generation)e.playing=true;}catch{if(token===generation){e.playing=false;error='media';}}}));
  if(token===generation)publish();return state();
 }
 return {state,prepare,fire,stop,dispose:stop};
}
