/* Last completed PA per voice/language and Xpace. Saved audio only; never synthesize on click. */
(function(root){'use strict';
 const VOICES={es:{female:{name:'Sara Martín',id:'KHCvMklQZZo0O30ERnVn'},male:{name:'David Martín',id:'Nh2zY9kknu6z4pZy6FhD'}},en:{female:{name:'Cassidy',id:'56AoDkrOh6qfVPDXZ7Pt'},male:{name:'James',id:'EkK5I93UQWFDigLMpZcX'}}};
 const language=value=>/^en(?:-|$)/i.test(value||'')?'en':/^es(?:-|$)/i.test(value||'')?'es':null;
 function valid(value){
  if(!value||!['male','female'].includes(value.voice))return null;const lang=language(value.language);if(!lang||!/^[-\w]{1,120}$/.test(value.id||''))return null;
  let u;try{u=new URL(value.url);}catch(_){return null;}if(u.origin!=='https://api.admira.store'||u.username||u.password||u.pathname!=='/stock/asset/'+value.id)return null;
  if(value.voiceId&&value.voiceId!==VOICES[lang][value.voice].id)return null;
  return {...value,language:lang,voiceId:VOICES[lang][value.voice].id,at:Number(value.at)||Date.now()};
 }
 function fromStock(item){
  if(item?.type!=='locucion'||!item.tags?.includes('xpaceos')||!/^elevenlabs/.test(item.motor||''))return null;
  const match=String(item.comment||'').match(/Created in XpaceOS · (female|male) · (es|en)(?:\b|$)/);if(!match)return null;
  return valid({...item,voice:match[1],language:match[2],url:'https://api.admira.store/stock/asset/'+item.id,title:item.prompt||item.title,at:Date.parse(item.createdAt)});
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={VOICES,valid,fromStock};
 if(!root.document)return;
 let context='default';try{const q=new URL(root.location.href).searchParams;context=q.get('loc')||q.get('store')||q.get('project')||'default';}catch(_){}
 const KEY='xpaceos.voice-receipts.v1:'+encodeURIComponent(context),bank={};let pending=null,fetchedAt=0;
 function remember(value){const v=valid(value);if(!v)return null;const key=v.language+':'+v.voice;if(!bank[key]||bank[key].at<=v.at){bank[key]=v;try{root.localStorage.setItem(KEY,JSON.stringify(bank));}catch(_){}}return {...bank[key]};}
 try{for(const v of Object.values(JSON.parse(root.localStorage.getItem(KEY)||'{}')))remember(v);}catch(_){}
 for(const v of root.XpaceCreatedMedia?.list().slice().reverse()||[])if(v.kind==='voice')remember(v);
 root.addEventListener('xpace:media-created',e=>{if(e.detail?.kind==='voice')remember(e.detail.track);});
 async function latest(voice,lang){
  if(!VOICES[lang]?.[voice])return null;const key=lang+':'+voice;if(bank[key])return {...bank[key]};if(fetchedAt&&Date.now()-fetchedAt<30000)return null;
  // Recover already published XpaceOS PA when this browser has no matching receipt.
  // Strict metadata matching: no generic demo audio, no wrong language/voice, no paid POST.
  if(!pending)pending=(async()=>{const res=await root.fetch('/admira-xp/voice-receipts',{credentials:'same-origin',signal:root.AbortSignal.timeout(90000)});if(!res.ok)throw Error('stock_unavailable');const data=await res.json();for(const item of data.items||[]){const v=valid(item);if(v)remember(v);}fetchedAt=Date.now();})().finally(()=>{pending=null;});
  await pending;return bank[key]?{...bank[key]}:null;
 }
 root.XpaceVoiceReceipts={key:KEY,VOICES,remember,latest,get:(voice,lang)=>bank[lang+':'+voice]?{...bank[lang+':'+voice]}:null};
})(typeof window!=='undefined'?window:globalThis);
