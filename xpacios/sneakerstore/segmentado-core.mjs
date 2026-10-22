// Contenido segmentado · lógica pura (sin DOM ni red): clase detectada → carril → contenido → frase del MetaHuman.
// Carriles y alias calcados de admira.tv/canal.html r64 (AUD_KIND_ALIAS / AUD_KIND_LANE) para que la matriz
// de brain.digitalavatar.ai/segmentation se lea igual aquí que en el player real.
export const KINDS=Object.freeze({
  person:{lane:'Persona',es:'Persona',en:'Person',icon:'🚶'},
  car:{lane:'Coche',es:'Coche',en:'Car',icon:'🚗'},
  motorcycle:{lane:'Moto',es:'Moto',en:'Motorbike',icon:'🏍️'},
  bicycle:{lane:'Bici',es:'Bici',en:'Bicycle',icon:'🚲'},
  scooter:{lane:'Patinete',es:'Patinete',en:'Scooter',icon:'🛴'},
});
export const KIND_ALIAS=Object.freeze({person:'person',persona:'person',people:'person',car:'car',coche:'car',auto:'car',vehicle:'car',motorcycle:'motorcycle',moto:'motorcycle',motorbike:'motorcycle',bicycle:'bicycle',bici:'bicycle',bike:'bicycle',scooter:'scooter',patinete:'scooter'});
export const LANE_KIND=Object.freeze(Object.fromEntries(Object.entries(KINDS).map(([kind,{lane}])=>[lane,kind])));
export const NEUTRAL_HOLD_MS=6000;   // igual que NEUTRAL_HOLD_MS del bus y de canal.html: el neutro no rebota
export const PRESENCE_GRACE_MS=1500; // igual que PRESENCE_GRACE de Xtore: evidencia de un fotograma reciente
export const MIN_SCORE=.45;
export const SCREEN='sneakers-store-santa-rosa-19-screen';
export const LOCATION='sneakers-store-santa-rosa-19';
export const SEG_API='https://brain.digitalavatar.ai/segmentation';
export const BUS_API='https://mcp-tv.admira.store/audience/'+SCREEN;
export const AUDIENCE_API='https://api.admira.store/audience';
export const STOCK_INDEX='https://stock.admira.store/stock/index.json';
export const METAHUMAN={base:'https://neo-digitalavatar.csilvasantin.workers.dev/',probe:'images/favicon-32x32.png',room:'xtanco',say:'https://brain.digitalavatar.ai/metahuman/say',web:'https://digitalavatar.ai/best.html?kiosk=1&embed=1&audio=off&listen=0'};

export function normalizeKind(value){const key=String(value??'').trim().toLowerCase();return KIND_ALIAS[key]||LANE_KIND[String(value??'').trim()]||null;}
export function laneOf(kind){return KINDS[normalizeKind(kind)]?.lane||'neutral';}

// Clase dominante de un fotograma. La persona manda (es quien entra en la tienda); entre vehículos, la de más confianza.
export function dominant(detections,{minScore=MIN_SCORE}={}){
  const counts={};let best=null;
  for(const d of Array.isArray(detections)?detections:[]){
    const kind=normalizeKind(d?.class??d?.kind);const score=Number(d?.score);
    if(!kind||!Number.isFinite(score)||score<minScore||score>1)continue;
    counts[kind]=(counts[kind]||0)+1;
    if(!best||(kind==='person'&&best.kind!=='person')||(kind===best.kind&&score>best.score)||(best.kind!=='person'&&kind!=='person'&&score>best.score))best={kind,score};
  }
  return best?{...best,count:counts[best.kind],counts}:null;
}

// Estado del carril con anti-rebote: una clase fresca gana al instante; el neutro se sostiene NEUTRAL_HOLD_MS.
export class LaneTracker{
  constructor({neutralHold=NEUTRAL_HOLD_MS,grace=PRESENCE_GRACE_MS}={}){this.neutralHold=neutralHold;this.grace=grace;this.kind=null;this.score=0;this.count=0;this.since=0;this.lastSeen=-Infinity;this.neutralSince=-Infinity;this.changes=0;}
  observe(observation,at=Date.now()){
    const kind=normalizeKind(observation?.kind);
    if(kind){
      if(kind!==this.kind){this.kind=kind;this.since=at;this.changes++;}
      this.score=Number(observation.score)||0;this.count=Math.max(1,Number(observation.count)||1);this.lastSeen=at;
    }
    return this.state(at);
  }
  state(at=Date.now()){
    if(this.kind&&at-this.lastSeen>this.grace){this.kind=null;this.score=0;this.count=0;this.neutralSince=at;this.changes++;}
    const holding=!this.kind&&at-this.neutralSince<this.neutralHold;
    return {kind:this.kind,lane:this.kind?KINDS[this.kind].lane:'neutral',score:this.score,count:this.count,since:this.kind?this.since:this.neutralSince,lastSeen:this.lastSeen,fresh:!!this.kind,holding,changes:this.changes};
  }
}

// Lectura del bus mcp-tv (v2.2): misma decisión que audienceRemoteLane de canal.html.
export function parseBus(data){
  const lab=data?.label||null,fresh=!!data?.fresh&&!!lab;
  const busLane=typeof data?.decision?.lane==='string'?data.decision.lane:'';
  let kind=fresh?(normalizeKind(lab.kind||'person')||'person'):null;
  const sex=fresh&&kind==='person'&&(lab.sex==='m'||lab.sex==='f')?lab.sex:'u';
  const present=fresh&&(kind!=='person'||sex!=='u'||(!!busLane&&busLane!=='neutral'));
  if(!present)kind=null;
  const lane=!present?'neutral':busLane&&busLane!=='neutral'?busLane:KINDS[kind].lane;
  return {fresh,present,kind,lane,sex,age:present?(data.decision?.age_seg||null):null,ok:data?.ok===true,ttl:Number(data?.ttl_ms)||null,server:data?.server_ts||null};
}

// Tipología que pide una regla: campo `kind`, tag `kind:<k>` o id r-coche/r-moto/r-bici/r-persona (canal.html ruleKind).
export function ruleKind(rule){
  let k=String(rule?.kind||'').toLowerCase().trim();
  if(!k)for(const t of String(rule?.tag||'').split(/[,+]/)){const m=/^\s*kind:([a-z]+)/i.exec(t);if(m){k=m[1].toLowerCase();break;}}
  if(!k)for(const t of String(rule?.id||'').toLowerCase().split(/[-_:.\s]+/))if(KIND_ALIAS[t]){k=t;break;}
  if(!k||k==='any')return '';
  return KIND_ALIAS[k]||k;
}
export function ruleTag(rule){return String(rule?.tag||'').split(/[,+]/).map(x=>x.trim()).filter(x=>x&&!/^kind:/i.test(x));}
export function matchRule(rule,kind){
  if(!rule||rule.enabled===false)return false;
  const rk=ruleKind(rule);if(!rk||rk!==kind)return false;
  if(kind!=='person'&&rule.gender&&rule.gender!=='any')return false;
  if((rule.minCount==null?1:rule.minCount)>1)return false;
  return !(rule.conds&&rule.conds.length);   // clima/día no se fabrican aquí
}
export function kindRules(matrix){return (matrix?.rules||[]).filter(r=>ruleKind(r));}

const MEDIA=new Set(['video','image','animation']);
export function orientationOf(item){
  const tags=(item?.tags||[]).map(t=>String(t).toLowerCase());
  const o=String(item?.orientacion||'').toLowerCase();
  if(o.startsWith('vert')||o==='portrait'||tags.includes('vertical')||tags.includes('portrait')||tags.includes('9:16'))return 'vertical';
  if(o.startsWith('hor')||o==='landscape'||tags.includes('horizontal')||tags.includes('landscape')||tags.includes('16:9'))return 'horizontal';
  const w=Number(item?.ancho),h=Number(item?.alto);if(w>0&&h>0)return h>w?'vertical':'horizontal';
  return null;
}
const normal=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
function asTrack(item){return {id:item.id,title:item.title||item.id,url:item.url,type:item.type||'video',num:item.num??null};}
// Contenido de un carril: assets explícitos de la regla → piezas del Stock por tag y formato → playlist de la ficha.
export function resolveContent({matrix,kind,stock=[],playlist=null,orientation='horizontal'}){
  const rule=(matrix?.rules||[]).find(r=>matchRule(r,kind))||null;
  const fits=item=>item?.url&&MEDIA.has(item.type)&&(orientationOf(item)===orientation||orientationOf(item)===null);
  if(rule){
    const ids=new Set((rule.assets||[]).map(String));
    const explicit=stock.filter(item=>ids.has(String(item.id))||ids.has(String(item.num))).filter(fits).map(asTrack);
    if(explicit.length)return {rule,items:explicit,source:'assets'};
    const tags=ruleTag(rule).map(normal).filter(Boolean);
    if(tags.length){
      const tagged=stock.filter(item=>fits(item)&&(item.tags||[]).map(normal).some(t=>tags.includes(t))).map(asTrack);
      if(tagged.length)return {rule,items:tagged,source:'tag'};
    }
  }
  const base=(playlist?.tracks||[]).filter(t=>t?.url).map(t=>({id:t.id,title:t.title||t.id,url:t.url,type:'video'}));
  return {rule,items:base,source:'playlist'};
}

// Reglas por tipología que la matriz de la tienda necesita y hoy no tiene (22-oct-2026 solo había sexo/edad/clima).
// Persona: piezas del creador NEXT STEP (tag sneakers) · Coche: «Aparca. Entra. Estrena. · Xtore · coche» (#990) · Moto/Bici: por tag.
export function defaultKindRules(){
  const base={gender:'any',age:'any',minCount:1,slot:'any',conds:[],join:'and',category:'any',medio:'any'};
  return [
    {...base,id:'r-persona',kind:'person',tag:'kind:person,sneakers',assets:[]},
    {...base,id:'r-coche',kind:'car',tag:'kind:car,coche',assets:['auto-9a75882d2e3a36bce8e6']},
    {...base,id:'r-moto',kind:'motorcycle',tag:'kind:motorcycle,motocicleta,moto',assets:[]},
    {...base,id:'r-bici',kind:'bicycle',tag:'kind:bicycle,bici,bicicleta',assets:[]},
  ];
}
// Añade solo las tipologías que faltan; nunca toca ni reordena las reglas existentes (sexo, edad, lluvia, finde…).
export function mergeKindRules(matrix,rules=defaultKindRules()){
  const present=new Set(kindRules(matrix).map(ruleKind));
  const added=rules.filter(r=>!present.has(ruleKind(r)));
  return {matrix:{...(matrix||{}),rules:[...(matrix?.rules||[]),...added],default:matrix?.default||{category:'any',tag:'',medio:'any'}},added:added.map(r=>r.id)};
}

const PHRASES={
  es:{person:['¡Hola! Bienvenido a Sneakers Store. Mira la campaña NEXT STEP: la zapatilla que da el siguiente paso.','Pasa, pasa. En NEXT STEP tienes el modelo nuevo de la temporada en la pantalla grande.'],car:['Aparca, entra y estrena. Las zapatillas nuevas te esperan en Santa Rosa diecinueve.'],motorcycle:['Deja la moto un momento: dentro hay zapatillas que corren más que tú.'],bicycle:['Pedalea hasta la puerta: tenemos zapatillas para rodar toda la ciudad.'],scooter:['Frena el patinete un segundo: la colección nueva está en la pantalla de la entrada.'],neutral:['']},
  en:{person:['Hi! Welcome to Sneakers Store. Check out the NEXT STEP campaign: the sneaker that takes the next step.','Come in. NEXT STEP shows the new season model on the big screen.'],car:['Park, come in and wear something new. The new sneakers are waiting at Santa Rosa nineteen.'],motorcycle:['Leave the bike for a moment: inside there are sneakers faster than you.'],bicycle:['Ride up to the door: we have sneakers to roll across the whole city.'],scooter:['Stop the scooter for a second: the new collection is on the entrance screen.'],neutral:['']},
};
export function metahumanPhrase(kind,lang='es',variant=0){const list=PHRASES[lang==='en'?'en':'es'][normalizeKind(kind)||'neutral']||[''];return list[Math.abs(variant)%list.length]||'';}
// Host de Pixel Streaming vivo → MetaHuman; si no, avatar web (mudo) y la voz la pone el navegador.
export function metahumanTarget({hostAlive}){return hostAlive===true?{mode:'metahuman',src:METAHUMAN.base+'uiless.html?AutoConnect=true&AutoPlayVideo=true&StartVideoMuted=true&HoveringMouse=true&MatchViewportRes=true&ViewportResolutionScale=1',voice:'stream'}:{mode:'web',src:METAHUMAN.web,voice:'browser'};}
// Regla de locución: solo al cambiar de carril con presencia, y nunca dos frases en menos de minGap.
export function shouldSpeak({kind,previousKind,lastSpokenAt,now,minGap=10000}){return !!kind&&kind!==previousKind&&now-lastSpokenAt>=minGap;}

// Muestra para api.admira.store/audience (el informe de clearchannel.tv cuenta caras; los vehículos van en kind).
export function audienceSample(state,{loc=LOCATION,screen=SCREEN}={}){
  const kind=normalizeKind(state?.kind);
  return {loc,screen,faces:kind==='person'?Math.max(1,Number(state.count)||1):0,gender:'',genderScore:0,ageBucket:'',emotion:'',kind:kind||'none',lane:kind?KINDS[kind].lane:'neutral',score:Number(state?.score)||0};
}

// Secuencia de demo (sin cámara): lo que pasa por la puerta y cuánto dura.
export function demoScript(){return [{kind:'person',ms:9000},{kind:null,ms:3000},{kind:'car',ms:7000},{kind:null,ms:2500},{kind:'motorcycle',ms:6000},{kind:null,ms:2500},{kind:'bicycle',ms:6000},{kind:null,ms:4000}];}
export function demoStep(script,elapsed){const total=script.reduce((s,x)=>s+x.ms,0);let t=((elapsed%total)+total)%total;for(const step of script){if(t<step.ms)return {...step,remaining:step.ms-t};t-=step.ms;}return {...script[0],remaining:script[0].ms};}
