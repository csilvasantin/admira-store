// Coordinate convention: street door z=0, rear checkout z=14. Looking from
// the door towards the checkout, LEFT is x=4 and RIGHT is x=0 (Three.js +z).
export const LAYOUT_REVISION='door-to-rear-v3';
export const REFERENCE_FRAME={origin:'street entrance',forward:'+z towards rear checkout',left:'+x',right:'-x'};
export const CORRECTED_POSES={
  'rack-1':{from:[.04,8.1],to:[3.46,8.1]},
  'rack-2':{from:[.04,10.8],to:[3.46,10.8]},
  'rack-right-0':{from:[3.46,3.5],to:[3.46,2.8]},
  'rack-right-1':{from:[3.46,6.1],to:[.04,4.25]},
  'rack-right-2':{from:[3.46,8.7],to:[.04,7.5]},
  'arcade-mario':{from:[3.3,5.1],to:[.08,6.8]},
  bench:{from:[.08,12.6],to:[3.27,12.6]},
  screen:{from:[.09,4.25],to:[3.77,4.25]}
};
// Only untouched default poses are corrected. Explicit moves, scale, rotation,
// locks, visibility, records and inventory history remain the user's own.
export function migrateReferenceLayout(saved,defaults){
  if(saved?.version!==1||!Array.isArray(saved.layout)||saved.layoutRevision===LAYOUT_REVISION)return saved;
  const next=structuredClone(saved),correct=item=>{
    const pose=CORRECTED_POSES[item?.id];
    if(pose&&Math.abs(item.col-pose.from[0])<1e-8&&Math.abs(item.row-pose.from[1])<1e-8&&!(item.rot||0)&&(item.sx??1)===1&&(item.sy??1)===1){item.col=pose.to[0];item.row=pose.to[1];}
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
        if(next!==saved){const backup=key+suffix+':before-orientation-v3';if(!storage.getItem(backup))storage.setItem(backup,raw);const value=JSON.stringify(next);storage.setItem(key+suffix,value);return value;}
      }catch{}
      return raw;
    },
    setItem(key,value){const next=JSON.parse(value);next.layoutRevision=LAYOUT_REVISION;storage.setItem(key+suffix,JSON.stringify(next));}
  };
}
