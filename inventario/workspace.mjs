import {loadCatalog} from './model.mjs?v=scope-20261004-1';
import {inventoryRows} from './workspace-model.mjs?v=inventory-merge-20261004-1';
import {inventoryURL} from './context.mjs?v=scope-20261004-1';
export function mountInventoryWorkspace({listHost,detailHost,read,onCount=()=>{},signal,load=loadCatalog}){
 const doc=listHost.ownerDocument,t=(es,en)=>doc.documentElement.lang==='en'?en:es;
 const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!=null)node.textContent=text;if(cls)node.className=cls;return node;};
 const search=el('input'),summary=el('p'),list=el('div',null,'itil-unit-list'),status=el('p');search.type='search';search.setAttribute('aria-label',t('Buscar en el inventario del Xpacio','Search this Xpace inventory'));search.placeholder=t('Buscar pieza…','Search item…');status.setAttribute('role','status');listHost.append(summary,search,list,status);
 let complete=false,assets=[],units=[],devices=[],rows=[],selectedId=null,activeSpace='',last='',opened=false,revision=0,disposeStage,stageRevision=0,disposed=false;
 const ready=load().then(catalog=>{assets=catalog.assets;}).catch(()=>{status.textContent=t('No se pudo cargar el catálogo. Se conservan los elementos de la escena.','Catalogue unavailable. Scene items are retained.');});
 let starbucksPromise;
 async function starbucks(){return starbucksPromise??=Promise.all([fetch(new URL('./starbucks/manifest.json',import.meta.url)).then(r=>{if(!r.ok)throw Error();return r.json();}),import('../admira-xp/scripts/starbucks-screens.mjs'),import('../admira-xp/scripts/starbucks-tpv.mjs')]).then(([manifest,wall,pos])=>({units:manifest.units,devices:[...wall.STARBUCKS_WALL_MAPPING.players,...pos.STARBUCKS_TPV_MAPPING.players,{id:'starbucks-alsea-paseo-de-gracia',name:t('Altavoz · hilo musical','Speaker · background music')}]})).catch(()=>{starbucksPromise=null;status.textContent=t('No se pudo cargar el registro Starbucks. Reintenta.','Starbucks registry unavailable. Retry.');return {units:[],devices:[]};});}
 function emptyDetail(){stageRevision++;disposeStage?.();disposeStage=null;detailHost.replaceChildren(el('p',t('Selecciona una pieza del inventario para ver su detalle.','Select an inventory item to view its details.')));}
 function render(){
  summary.textContent=activeSpace+' · '+rows.length+' '+t('piezas','items');const query=search.value.trim().toLocaleLowerCase();list.replaceChildren();
  for(const row of rows.filter(row=>(row.name+' '+row.id+' '+(row.code||'')).toLocaleLowerCase().includes(query))){
   const button=el('button',null,'itil-unit');button.type='button';button.dataset.inventoryId=row.id;button.setAttribute('aria-pressed',String(row.id===selectedId));button.append(el('strong',row.name),el('small',(row.asset?row.asset.number+' · ':'')+row.category+' · '+(row.code||row.id)));
   button.addEventListener('click',()=>select(row.id),{signal});list.append(button);
  }
  if(!list.children.length)list.append(el('p',t('No hay piezas que coincidan.','No matching items.')));
 }
 async function select(id){
  const row=rows.find(row=>row.id===id);if(!row)return;selectedId=id;render();const turn=++stageRevision;disposeStage?.();disposeStage=null;detailHost.replaceChildren();detailHost.dataset.inventoryId=id;
  detailHost.append(el('h3',row.name),el('p',row.category+' · '+(row.code||row.id)));
  const fields=el('dl');for(const [label,value]of [[t('Instancia','Instance'),row.id],[t('Modelo','Model'),row.asset?row.asset.number+' · '+row.asset.name:t('Pendiente','Pending')],[t('Estado','Status'),row.virtual?t('Virtual · vinculación física pendiente','Virtual · physical binding pending'):row.retired?t('Retirado de la distribución','Removed from layout'):row.placed?t('En la distribución','In the layout'):t('Ficha registrada · posición pendiente','Registered record · position pending')],[t('Posición','Position'),Number.isFinite(row.item?.col)&&Number.isFinite(row.item?.row)?row.item.col+', '+row.item.row:null],[t('Referencia','Reference'),row.reference]]){if(value==null)continue;fields.append(el('dt',label),el('dd',String(value)));}detailHost.append(fields);
  if(row.asset){
   const stage=el('div',null,'itil-unit-stage'),canvas=el('canvas'),note=el('p',t('Cargando modelo…','Loading model…'));canvas.tabIndex=0;canvas.setAttribute('aria-label',row.name+' · 3D');note.dataset.status='';stage.append(canvas,note);detailHost.append(stage);
   const source=read(),url=inventoryURL(doc.location.href,{space:source.space,project:source.project,lang:doc.documentElement.lang});url.searchParams.set('asset',row.asset.number);url.searchParams.set('quality','better');const link=el('a',t('Abrir modelo y desglose ↗','Open model and breakdown ↗'));link.href=url.href;link.addEventListener('click',()=>doc.defaultView.XpaceInventory?.publish(source.space,read().layout),{signal});detailHost.append(link);
   try{const {mountCounterStage}=await import('./counter-stage.mjs?v=cafebreria-1');if(turn!==stageRevision||disposed)return;const dispose=await mountCounterStage(stage,row.asset,{controlsHost:stage,quality:'better'});if(turn!==stageRevision||disposed)dispose?.();else disposeStage=dispose;}catch{if(turn===stageRevision)note.textContent=t('Vista 3D no disponible. La ficha se conserva.','3D view unavailable. Record retained.');}
  }
 }
 async function refresh(force=false){
  const snapshot=read(),key=JSON.stringify([snapshot,doc.documentElement.lang]);if(!force&&key===last)return;last=key;const turn=++revision;await ready;
  let registry={units:[],devices:[]};if(snapshot.space==='starbucks_pg103')registry=await starbucks();if(turn!==revision||disposed)return;
  if(snapshot.space!==activeSpace){selectedId=null;search.value='';emptyDetail();}activeSpace=snapshot.space;
  units=registry.units;devices=registry.devices;rows=inventoryRows({...snapshot,assets,units,devices});complete=true;onCount(rows.length);
  if(opened){render();if(selectedId&&rows.some(row=>row.id===selectedId))select(selectedId);else{selectedId=null;emptyDetail();}}
 }
 search.addEventListener('input',render,{signal});const timer=setInterval(()=>refresh(),750);signal?.addEventListener('abort',dispose,{once:true});
 function dispose(){disposed=true;clearInterval(timer);stageRevision++;disposeStage?.();}
 refresh(true);return {async show(){opened=true;listHost.hidden=false;detailHost.hidden=false;await refresh(true);render();if(!selectedId)emptyDetail();},hide(){opened=false;listHost.hidden=true;detailHost.hidden=true;stageRevision++;disposeStage?.();disposeStage=null;},refresh,select,dispose,get count(){return complete?rows.length:null;}};
}
