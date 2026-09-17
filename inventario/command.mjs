import {loadCatalog,instancesFor} from './model.mjs?v=catalog-43';
import {findPlacement} from './placement.mjs?v=inventory-cli-3';
export function parseInventoryCommand(raw){
 const text=String(raw||'').trim();
 if(!/^\/?(?:inventario|eliminar|añadir|anadir)(?:@\w+)?(?:\s|$)/i.test(text))return null;
 const body=text.replace(/^\/?inventario(?:@\w+)?\s*/i,'').trim();
 if(!body)return {action:'list'};
 if(/^deshacer$/i.test(body))return {action:'undo'};
 const match=body.match(/^\/?(eliminar|añadir|anadir)(?:@\w+)?\s+(?:(?:el|la)\s+)?(.+)$/i);
 if(match){
  const value=match[2].trim().replace(/^["“](.*)["”]$/,'$1'),action=/eliminar/i.test(match[1])?'remove':'add';
  if(/^[1-9]\d*$/.test(value)&&Number.isSafeInteger(Number(value)))return {action,number:Number(value)};
  if(value.length<=120&&/^[\p{L}]/u.test(value))return {action,name:value};
 }
 return {action:'help'};
}
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function resolveAsset(cmd,assets){
 if(cmd.number)return {asset:assets.find(a=>a.number===cmd.number)};
 const name=normalize(cmd.name),exact=assets.filter(a=>normalize(a.name)===name);
 const candidates=exact.length?exact:assets.filter(a=>normalize(a.name).includes(name));
 return candidates.length===1?{asset:candidates[0]}:{candidates};
}
const help='Comandos: /inventario · /inventario añadir 43 · /inventario añadir silla de madera · /inventario eliminar 43 · /inventario eliminar mostrador · /inventario deshacer. Número o nombre sin distinguir tildes/mayúsculas. Añadir coloca una unidad; eliminar retira todas las unidades del modelo. Guardado en este navegador; el catálogo y sus números se conservan.';
const locks=new Set();
export async function executeInventoryCommand(raw,{store,space,getLayout,applyLayout,getRoom=()=>null,load=loadCatalog,makeId=()=> 'inventory_'+crypto.randomUUID()}={}){
 const cmd=parseInventoryCommand(raw);if(!cmd)return null;
 const result=(ok,message)=>({ok,local:true,kind:'inventory',message});
 if(cmd.action==='help')return result(false,help);
 try{
  const {assets}=await load();
  if(cmd.action==='list')return result(true,`INVENTARIO · ${assets.length} piezas · ${space||'sin Xpacio activo'}\n`+assets.map(a=>`${a.number}. ${a.name} · ${instancesFor(a,getLayout?.()||[]).length} en el espacio`).join('\n')+'\n\n'+help);
  if(!space||!store||!getLayout||!applyLayout)return result(false,'Abre un Xpacio antes de modificar su mobiliario.');
  if(locks.has(space))return result(false,'Hay un cambio de inventario en curso. Espera a que termine.');
  locks.add(space);
  try{
   const before=store.removals(space),next=structuredClone(before);next.added ||= {};
   const visibility=store.read?.(space)||{},nextVisibility=structuredClone(visibility);
   const current=getLayout();let updated,message;
   if(cmd.action==='remove'||cmd.action==='add'){
    const {asset,candidates}=resolveAsset(cmd,assets);
    if(!asset)return result(false,candidates?.length?`El nombre coincide con varias piezas. Usa su número o nombre completo:\n${candidates.map(a=>a.number+'. '+a.name).join('\n')}`:`No existe el mueble ${cmd.number||cmd.name}. Consulta /inventario.`);
    const items=instancesFor(asset,current);
    if(cmd.action==='remove'){
     if(!items.length)return result(false,`${asset.number}. ${asset.name} no está colocado en este Xpacio. No se ha eliminado nada.`);
     next.undo={action:'remove',number:asset.number,name:asset.name,items:structuredClone(items),addedIds:items.filter(i=>next.added[i.id]).map(i=>i.id)};
     for(const item of items){next.removed[item.id]=structuredClone(item);delete next.added[item.id];}
     const ids=new Set(items.map(i=>i.id));updated=current.filter(i=>!ids.has(i.id));
     message=`Retirado: ${asset.number}. ${asset.name} · ${items.length} unidad(es) del Xpacio ${space}. Para recuperarla: /inventario añadir ${asset.number} o /inventario deshacer.`;
    }else{
     if(current.length>=300)return result(false,'Este Xpacio ha alcanzado el límite de 300 piezas. Retira alguna antes de añadir.');
     const retired=instancesFor(asset,Object.values(next.removed)).find(i=>!current.some(x=>x.id===i.id));
     const item=retired?structuredClone(retired):{id:makeId(),type:asset.type,label:asset.name,fp:[...asset.fp],sx:1,sy:1,rot:0,...(asset.img?{custom:true,img:asset.img,ph:asset.ph}:{}),...(['tft','aroma'].includes(asset.type)?{wallY:2.2,ph:asset.type==='tft'?1.1:.75}:{})};
     if(current.some(i=>i.id===item.id))return result(false,'No se pudo crear un identificador único. Reintenta.');
     const placement=findPlacement(item,current,getRoom()||{},assets,retired);
     if(!placement)return result(false,'No hay un hueco libre adecuado en este Xpacio. Retira o mueve otra pieza y vuelve a intentarlo.');
     Object.assign(item,placement);delete next.removed[item.id];next.added[item.id]=structuredClone(item);
     next.undo={action:'add',number:asset.number,name:asset.name,items:[structuredClone(item)],retired:retired?structuredClone(retired):null,visibility:visibility[item.id]||null};
     nextVisibility[item.id]={visible:true,updatedAt:Date.now()};updated=[...current,item];
     message=`Añadido: ${asset.number}. ${asset.name} · posición ${item.col}, ${item.row}${retired?' · pieza recuperada':''}. Puedes moverla desde el editor. /inventario deshacer revierte este cambio.`;
    }
   }else{
    const undo=next.undo;if(!undo?.items?.length)return result(false,'No hay ningún cambio de inventario que deshacer en este Xpacio.');
    if(undo.action==='add'){
     const ids=new Set(undo.items.map(i=>i.id));updated=current.filter(i=>!ids.has(i.id));
     for(const item of undo.items){next.removed[item.id]=undo.retired||item;delete next.added[item.id];if(undo.visibility)nextVisibility[item.id]=undo.visibility;else delete nextVisibility[item.id];}
     message=`Deshecho: alta de ${undo.number}. ${undo.name}.`;
    }else{
     if(undo.items.some(item=>current.some(i=>i.id===item.id)))return result(false,'No se puede deshacer: una pieza actual utiliza el mismo identificador. No se ha sobrescrito nada.');
     // Do not restore furniture over newly placed objects. Older callers without
     // room information retain the legacy exact-position undo behavior.
     const room=getRoom();updated=[...current];
     for(const item of undo.items){if(room){const p=findPlacement(item,updated,room,assets,item);if(!p||p.col!==Math.round(item.col)||p.row!==Math.round(item.row))return result(false,'La posición original está ocupada. Usa /inventario añadir '+undo.number+' para buscar un hueco libre.');}updated.push(item);delete next.removed[item.id];if(undo.addedIds?.includes(item.id))next.added[item.id]=structuredClone(item);}
     message=`Restaurado: ${undo.number}. ${undo.name} · ${undo.items.length} unidad(es), con su posición original en ${space}.`;
    }
    next.undo=null;
   }
   // Atomic intent + visibility + layout: failed writes restore both ledgers.
   try{store.writeRemovals(space,next);store.writeVisibility?.(space,nextVisibility);await applyLayout(updated);}
   catch(error){try{store.writeRemovals(space,before);store.writeVisibility?.(space,visibility);}catch{}throw error;}
   store.publish(space,updated);store.notify(space);return result(true,message+' Guardado en este navegador.');
  }finally{locks.delete(space);}
 }catch{return result(false,'No se pudo guardar el cambio o cargar el inventario. Comprueba el almacenamiento del navegador y vuelve a intentarlo.');}
}
