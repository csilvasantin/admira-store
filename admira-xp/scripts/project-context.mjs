// Project/circuit IDs belong to admira.app; scene verticals are rendering adapters.
export const STARBUCKS_LOCATION = 'alsea-sbux-021';
export const ADAPTERS = Object.freeze({
  estancos: {circuit:'estancos',vertical:'xtanco',label:'Xtanco',venueEs:'Gran de Gràcia · escena de demostración',venueEn:'Gran de Gràcia · demo scene',linked:false},
  cafebreria: {circuit:'cafebreria',vertical:'cafeteria',label:'Cafebrería',venueEs:'Cafebrería · escena de demostración',venueEn:'Cafebrería · demo scene',linked:false},
  starbucks: {circuit:'alsea_starbucks',vertical:'cafeteria',label:'Starbucks',venueEs:'Paseo de Gracia 103 · Barcelona',venueEn:'Paseo de Gracia 103 · Barcelona',loc:STARBUCKS_LOCATION,linked:true}
});
export function projectContext(href,vertical){
  const url=new URL(href);
  if(url.searchParams.get('loc')===STARBUCKS_LOCATION)return {id:'starbucks',...ADAPTERS.starbucks};
  const requested=url.searchParams.get('project');
  if(requested && (!ADAPTERS[requested] || requested==='starbucks'))return {id:'',unavailable:requested};
  const scene=vertical||url.searchParams.get('autostart');
  const id=scene==='cafeteria'?'cafebreria':scene==='xtanco'?'estancos':scene?'':requested||'estancos';
  return id?{id,...ADAPTERS[id]}:{id:''};
}
export function projectUrl(href,id,currentQuality){
  const adapter=ADAPTERS[id];if(!adapter)throw new RangeError('No linked rendering adapter for this project');
  const url=new URL(href),p=url.searchParams;
  const requested=currentQuality||p.get('visual')||p.get('quality')||'better';
  // Matrix opens the Starbucks venue. Best has no Cafebrería adapter yet.
  const quality=id==='starbucks'?requested:requested==='matrix'||(id==='cafebreria'&&requested==='best')?'better':requested;
  for(const key of ['loc','quality','visual','play','from','virtualPlayer','twinOrigin','twinSession','analyzerOrigin'])p.delete(key);
  url.hash='';p.set('project',id);p.set('circuit',adapter.circuit);p.set('autostart',adapter.vertical);
  p.set('quality',['good','better','best','matrix'].includes(quality)?quality:'better');
  if(adapter.loc)p.set('loc',adapter.loc);
  if(id==='cafebreria')url.pathname='/xpacios/cafebreria/';
  return url.href;
}
