import * as T from './premium-three.mjs';
import {furniturePose,sameFurniturePose,validateFurniturePath} from './distribuit.mjs?v=imported-space-1';
import {planFurnitureObjectChange} from './distribuit-objects.mjs?v=imported-space-1';
import {pixeriaFurnitureAsset,loadPixeriaFurniture,disposePixeriaModel} from './pixeria-furniture.mjs';
import {furnitureBounds} from './furniture-geometry.mjs';

// Imported objects use the same footprint corner, quarter turns and editor as
// native Xpacios. Their original geometry and scene identities are retained.
export function bindImportedObjects(root,entries){
  root.updateMatrixWorld(true);
  const bindings=new Map(),layout=[];
  const floor=entries.find(e=>e.id==='glb:suelo')?.object;
  const floorY=floor?new T.Box3().setFromObject(floor).max.y:0;
  for(const entry of entries){
    if(!entry.object)continue;
    const box=new T.Box3().setFromObject(entry.object),size=box.getSize(new T.Vector3());
    const group=new T.Group();group.name='itil:'+entry.id;
    root.add(group);group.position.copy(root.worldToLocal(box.min.clone()));
    group.updateMatrixWorld(true);group.attach(entry.object);
    const structural=entry.categoria==='Arquitectura',presentationExcluded=entry.presentationExcluded===true;
    // Structural pieces remain fixed inventory records, but walls, jambs and
    // low architecture still impede a body. The floor and overhead beams do
    // not become navigation obstacles merely because they are architecture.
    const navigationSolid=structural&&!presentationExcluded&&box.max.y>floorY+.12&&box.min.y<floorY+1.9;
    const item={id:entry.id,type:'custom',source:'Cafebrería',label:entry.nombre,col:box.min.x,row:box.min.z,rot:0,sx:1,sy:1,fp:[Math.max(.1,size.x),Math.max(.1,size.z)],locked:structural||presentationExcluded,nativeFixed:structural||presentationExcluded,presentationExcluded,navigationSolid,solid:box.min.y-floorY<.2&&!structural&&!presentationExcluded&&entry.categoria!=='Desglose',inventoryId:'cafebreria:'+entry.id};
    group.userData.item=item;
    bindings.set(entry.id,{group,entry,baseY:box.min.y});layout.push(item);
  }
  function apply(next){
    const byId=new Map(next.map(i=>[i.id,i]));
    for(const [id,{group,baseY}] of bindings){
      const item=byId.get(id);group.visible=!!item&&item.hidden!==true&&item.presentationExcluded!==true;
      if(!item)continue;
      group.userData.item=item;
      group.position.copy(root.worldToLocal(new T.Vector3(item.col,baseY,item.row)));
      group.rotation.y=-(item.rot||0)*Math.PI/2;group.scale.set(item.sx??1,item.sy??1,item.sx??1);
    }
    root.updateMatrixWorld(true);
  }
  function add(item,object){const group=new T.Group();group.name='itil:'+item.id;root.add(group);group.add(object);group.userData.item=item;bindings.set(item.id,{group,entry:{id:item.id,nombre:item.label,categoria:'Pixeria'},baseY:0});}
  return {bindings,layout,apply,add};
}

export function createImportedBridge({roomId,cols,rows,layout,storage=globalThis.localStorage,onSave=()=>{},onImport=()=>{},catalogProvider,prepareAsset=loadPixeriaFurniture,releaseAsset=disposePixeriaModel}){
  const key='xpaceos:imported-space:v1:'+roomId;
  const original=structuredClone(layout),ids=new Set(layout.map(i=>i.id));
  let state={layout:structuredClone(layout),ledger:{removed:{},added:{},undo:null},visibility:{},records:{}},active=true;
  try{const saved=JSON.parse(storage.getItem(key)||'null');
    if(saved?.version===1&&Array.isArray(saved.layout)){
      // Unknown imported models cannot silently become fabricated geometry.
      const clean=saved.layout.filter(i=>(ids.has(i.id)||i.source==='PixerIA')&&Object.values(furniturePose(i)).every(Number.isFinite));
      state={...state,...saved,layout:clean.map(i=>{const base=original.find(o=>o.id===i.id);return base?{...base,...furniturePose(i),locked:base.nativeFixed?true:!!i.locked,hidden:!!i.hidden}:i;})};
    }
  }catch{}
  const structuralColliders=original.filter(i=>i.navigationSolid===true).map(i=>({...furnitureBounds(i),id:'architecture:'+i.id}));
  const read=()=>({roomId,cols,rows,active,layout:structuredClone(state.layout).map(i=>({...i,label:state.records?.[i.id]?.nombre||i.label})),colliders:structuredClone(structuralColliders),hardness:{fixed:[]},footprints:{}});
  const persist=next=>{storage.setItem(key,JSON.stringify({...next,version:1}));state=next;onSave(read(),state.records);};
  return {key,read,begin:()=>Symbol(roomId),end:()=>{},
    async commit(request){
      if(request.signal?.aborted||!active||request.roomId!==roomId)throw Error('room');
      const item=state.layout.find(i=>i.id===request.id);
      if(!item||!sameFurniturePose(item,request.from))throw Error('changed');
      const result=validateFurniturePath(read(),item.id,request.path);if(!result.ok)throw Error(result.reason);
      persist({...state,layout:state.layout.map(i=>i.id===item.id?{...i,...result.position}:i)});
    },
    async mutate(request){
      if(request.signal?.aborted||!active||request.roomId!==roomId)throw Error('room');
      const plan=planFurnitureObjectChange({scene:read(),...state},request);
      persist({...state,layout:plan.layout,ledger:plan.ledger,visibility:plan.visibility});return plan.receipt;
    },
    async catalog(){
      if(catalogProvider)return catalogProvider();
      const response=await fetch('https://api.admira.store/stock/list?type=furni&limit=200',{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('asset');
      const data=await response.json();return (data.items||[]).map(pixeriaFurnitureAsset).filter(Boolean);
    },
    async importItem({roomId:requested,assetId,signal}){
      if(requested!==roomId||!active||signal?.aborted)throw Error('room');
      const asset=(await this.catalog()).find(a=>a.assetId===assetId);if(!asset)throw Error('asset');
      const model=await prepareAsset(asset);
      try{
        if(!active||signal?.aborted)throw Error('room');
        const id='pixeria:'+asset.assetId+':'+Date.now().toString(36),item={...asset,id,type:'custom',rot:0,sx:1,sy:1,col:0,row:0,locked:false};
        const plan=planFurnitureObjectChange({scene:read(),...state},{action:'add',item});
        storage.setItem(key,JSON.stringify({...state,layout:plan.layout,ledger:plan.ledger,visibility:plan.visibility,version:1}));
        state={...state,layout:plan.layout,ledger:plan.ledger,visibility:plan.visibility};
        onImport(plan.receipt.after,model);onSave(read(),state.records);return plan.receipt;
      }catch(error){releaseAsset(model);throw error;}
    },
    get records(){return structuredClone(state.records);},
    editRecord(id,patch){if(typeof id!=='string'||['__proto__','constructor','prototype'].includes(id))throw Error('invalid');const fields=['nombre','fabricante','modelo','garantia','ubicacion'];const clean=Object.fromEntries(fields.filter(k=>typeof patch[k]==='string').map(k=>[k,patch[k].trim().slice(0,500)]));persist({...state,records:{...state.records,[id]:{...state.records[id],...clean}}});},
    setVisible(id,visible){if(!state.layout.some(i=>i.id===id)||typeof visible!=='boolean')throw Error('invalid');persist({...state,layout:state.layout.map(i=>i.id===id?{...i,hidden:!visible}:i)});},
    restore(){persist({...state,layout:structuredClone(original),ledger:{removed:{},added:{},undo:null},visibility:{}});},
    dispose(){active=false;}
  };
}
