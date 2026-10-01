import {validateFurnitureMove,furniturePose} from './distribuit.mjs?v=distribuir-3';
import {isWallFurniture} from './furniture-geometry.mjs';

const copy=value=>value==null?null:structuredClone(value);
const canonical=value=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(v=>JSON.parse(canonical(v))):Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(canonical(value[k]))])):value??null);
// Presentation-only mounting metadata is derived by the bridge, not persisted.
export function sameFurnitureObject(a,b){
  if(!a||!b)return a==null&&b==null;
  const clean=({mount,nativeFixed,inventoryHidden,...item})=>({...item,...furniturePose(item),locked:!!item.locked});
  return canonical(clean(a))===canonical(clean(b));
}
export function validateFurniturePlacement(scene,item){
  if(isWallFurniture(item))return {ok:true,position:furniturePose(item)};
  return validateFurnitureMove({...scene,layout:[...scene.layout.filter(i=>String(i.id)!==String(item.id)),{...item,locked:false}]},item.id,furniturePose(item),{swept:false});
}
export function findFurniturePlacement(scene,item){
  const positions=[];
  for(let row=0;row<=scene.rows;row+=.25)for(let col=0;col<=scene.cols;col+=.25)positions.push({col,row});
  positions.sort((a,b)=>Math.hypot(a.col-scene.cols/2,a.row-scene.rows/2)-Math.hypot(b.col-scene.cols/2,b.row-scene.rows/2));
  return positions.find(p=>validateFurniturePlacement(scene,{...item,...p}).ok)||null;
}
const entry=(ledger,visibility,id)=>({removed:copy(ledger.removed?.[id]),added:copy(ledger.added?.[id]),visible:copy(visibility[id])});
function applyEntry(ledger,visibility,id,value){
  for(const key of ['removed','added']){ledger[key]||={};if(value[key]===null)delete ledger[key][id];else ledger[key][id]=copy(value[key]);}
  if(value.visible===null)delete visibility[id];else visibility[id]=copy(value.visible);
}
// Plan one reversible object edit. All checks precede the bridge's atomic save.
export function planFurnitureObjectChange({scene,layout,ledger,visibility},request){
  const next=copy(layout),records=copy(ledger),views=copy(visibility),{action}=request;
  let id=String(request.id||request.item?.id||request.change?.id||''),index=next.findIndex(i=>String(i.id)===id),before=copy(next[index]),after,receipt;
  if(action==='undo'){
    const change=request.change;
    if(!change||!sameFurnitureObject(before,change.after)||canonical(entry(records,views,id))!==canonical(change.recordsAfter))throw Error('changed');
    after=copy(change.before);
    if(after){const valid=validateFurniturePlacement(scene,after);if(!valid.ok)throw Error(valid.reason);}
    applyEntry(records,views,id,change.recordsBefore);
    if(index>=0)next.splice(index,1);
    if(after)next.splice(Math.min(change.index,next.length),0,after);
  }else{
    const recordsBefore=entry(records,views,id);
    if(action==='add'){
      if(!id||['__proto__','prototype','constructor'].includes(id)||before||records.removed?.[id]||records.added?.[id])throw Error('changed');
      if(next.length>=300)throw Error('limit');
      after=copy(request.item);
      const placement=findFurniturePlacement(scene,after);if(!placement)throw Error('noSpace');
      Object.assign(after,placement);index=next.length;next.push(after);
      records.added||={};records.added[id]=copy(after);views[id]={visible:true,updatedAt:Date.now()};
    }else{
      const shown=scene.layout.find(i=>String(i.id)===id);
      if(!shown||!before||!sameFurnitureObject(shown,request.from))throw Error('changed');
      if(shown.nativeFixed)throw Error('structural');
      if(action==='lock'){
        if(typeof request.locked!=='boolean'||!!before.locked===request.locked)throw Error('invalid');
        after={...before,locked:request.locked};next[index]=after;
        // Retain poses and locks even if a factory layout is subsequently loaded.
        records.added||={};records.added[id]=copy(after);
      }else if(action==='remove'){
        after=null;next.splice(index,1);records.removed[id]=copy(before);delete records.added?.[id];
      }else throw Error('invalid');
    }
    receipt={kind:'object',id,index,before,after:copy(after),recordsBefore,recordsAfter:entry(records,views,id)};
  }
  // The standalone inventory CLI's single-step undo cannot safely replay over
  // a subsequent editor mutation. The editor maintains its own guarded history.
  records.undo=null;
  return {layout:next,ledger:records,visibility:views,receipt,id};
}
