// Coordinate convention: street door z=0, rear checkout z=14. Looking from
// the door towards the checkout, LEFT is x=4 and RIGHT is x=0 (Three.js +z).
export const LAYOUT_REVISION='rear-led-door-v5';
export const REFERENCE_FRAME={origin:'street entrance',forward:'+z towards rear checkout',left:'+x',right:'-x'};
export const CORRECTED_POSES={
  'rack-1':{from:[.04,8.1],to:[3.46,10.05]},
  'rack-2':{from:[.04,10.8],to:[3.46,11.05]},
  'rack-right-0':{from:[3.46,3.5],to:[3.46,2.8]},
  'rack-right-1':{from:[3.46,6.1],to:[.04,4.25]},
  'rack-right-2':{from:[3.46,8.7],to:[.04,7.5]},
  'arcade-mario':{from:[3.3,5.1],to:[.08,6.8]},
  bench:{from:[.08,12.6],to:[3.27,12.6]},
  screen:{from:[.09,4.25],to:[3.77,6.45]},
  counter:{from:[1.1,12],to:[.05,12]}
};
const V4_POSES={counter:CORRECTED_POSES.counter};
const V3_POSES={screen:{from:[3.77,4.25],to:[3.77,6.45]},'rack-1':{from:[3.46,8.1],to:[3.46,10.05]},'rack-2':{from:[3.46,10.8],to:[3.46,11.05]},counter:CORRECTED_POSES.counter};
// Only untouched default poses are corrected. Explicit moves, scale, rotation,
// locks, visibility, records and inventory history remain the user's own.
export function migrateReferenceLayout(saved,defaults){
  if(saved?.version!==1||!Array.isArray(saved.layout)||saved.layoutRevision===LAYOUT_REVISION)return saved;
  const next=structuredClone(saved),correct=item=>{
    const pose=(saved.layoutRevision==='jordan-wall-v4'?V4_POSES:saved.layoutRevision==='door-to-rear-v3'?V3_POSES:CORRECTED_POSES)[item?.id];
    if(pose&&Math.abs(item.col-pose.from[0])<1e-8&&Math.abs(item.row-pose.from[1])<1e-8&&!(item.rot||0)&&(item.sx??1)===1&&(item.sy??1)===1){item.col=pose.to[0];item.row=pose.to[1];}
    if(item?.id==='rack-rear-right'&&item.col===.04&&item.row===10.2&&!(item.rot||0)&&(item.sx??1)===1&&(item.sy??1)===1&&item.fp?.[0]===.5&&item.fp?.[1]===3.1)item.fp=[.5,1.5];
    const previousLabels={'back-wall':['Fondo · mural IOT Gallery','Rear · IOT Gallery mural'],counter:['Caja del fondo · frente metálico','Rear checkout · metal front']};
    if(previousLabels[item?.id]?.includes(item.label)){const fresh=defaults.find(d=>d.id===item.id);if(fresh)item.label=fresh.label;}
    return item;
  };
  next.layout.forEach(correct);
  for(const group of ['removed','added'])Object.values(next.ledger?.[group]||{}).forEach(correct);
  const known=new Set(next.layout.map(i=>i.id));
  for(const item of defaults)if(!known.has(item.id)&&!next.ledger?.removed?.[item.id])next.layout.push(structuredClone(item));
  next.layoutRevision=LAYOUT_REVISION;
  return next;
}
export function referenceStorage(storage,defaults){
  const suffix=':real-store-v2';
  return {
    getItem(key){
      const raw=storage.getItem(key+suffix);if(!raw)return null;
      try{const saved=JSON.parse(raw),next=migrateReferenceLayout(saved,defaults);
        if(next!==saved){const backup=key+suffix+':before-'+(saved.layoutRevision==='jordan-wall-v4'?'rear-led-door-v5':saved.layoutRevision==='door-to-rear-v3'?'jordan-wall-v4':'orientation-v3');if(!storage.getItem(backup))storage.setItem(backup,raw);const value=JSON.stringify(next);storage.setItem(key+suffix,value);return value;}
      }catch{}
      return raw;
    },
    setItem(key,value){const next=JSON.parse(value);next.layoutRevision=LAYOUT_REVISION;storage.setItem(key+suffix,JSON.stringify(next));}
  };
}
