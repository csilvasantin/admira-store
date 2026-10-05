import {inventoryCategory,inventoryCaption,cafeRecordName} from '../../inventario/labels.mjs?v=inventory-lang-20261004-1';
import {attachFloatingPanel} from '../../admira-xp/scripts/floating-panels.mjs?v=inventory-lang-20261004-1';
import {unitByInstance, recordForUnit, recordFields, recordURL, redactPrivateInventoryFields} from '../../inventario/cafebreria/ci-record.mjs?v=itil-map-20261005-1';
export function mountCafeInventory({host,manifest,bridge,bindings,onSelect,onEdit,onClose=()=>{},getDetailHost=()=>null,onCount=()=>{},signal}){
 const language=()=>document.documentElement.lang==='en'?'en':'es',phrases=new Map(),t=(es,enText)=>{const pair=[es,enText];phrases.set(es,pair);phrases.set(enText,pair);return pair[language()==='en'?1:0];};
 let ciManifest=null,selectedId=null,displayedName='';
 fetch('/inventario/cafebreria/manifest.json',{signal}).then(r=>r.ok?r.json():null).then(data=>{ciManifest=data;if(selectedId)select(selectedId);else render();}).catch(()=>{ciManifest=null;});
 const panel=document.createElement('aside');panel.className='cafe-inventory';panel.hidden=true;panel.setAttribute('aria-label',t('Inventario ITIL de Cafebrería','Cafebrería ITIL inventory'));
 panel.innerHTML=`<p>${t('Piezas de la escena visual. Las fichas pendientes no tienen modelo ni medidas confirmadas.','Visual scene pieces. Pending records have no model or confirmed dimensions.')}</p><input type="search" aria-label="${t('Buscar elemento','Search element')}" placeholder="${t('Buscar elemento…','Search element…')}"><p data-count></p><div data-list></div><section data-record hidden></section><div class="cafe-inventory-actions"><button data-export="json">JSON ↓</button><button data-export="csv">CSV ↓</button><button data-restore>${t('Restaurar distribución','Restore layout')}</button><a href="/inventario/?space=cafebreria&project=cafebreria&asset=51&quality=all#mostrador">${t('Librería · pieza ITIL 51 ↗','Bookcase · ITIL piece 51 ↗')}</a></div><p role="status" data-status></p>`;
 const record=panel.querySelector('[data-record]');record.className='itil-record';record.dataset.inventoryDetail='';
 host.append(panel);
 const floating=attachFloatingPanel(panel,{label:t('Inventario ITIL · Cafebrería','ITIL inventory · Cafebrería'),bounds:host,key:'cafe-itil-inventory-v1',onClose:()=>{panel.hidden=true;onClose();},onOpen:()=>{panel.hidden=false;render();},menu:true});
 const listen=(node,event,fn)=>node.addEventListener(event,fn,{signal});
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
  const originalById=new Map(manifest.items.map(row=>[row.id,row]));
 const name=row=>cafeRecordName(row,originalById.get(row.id),language());
 function rows(){const poses=new Map(bridge.read().layout.map(i=>[i.id,i]));const extras=bridge.read().layout.filter(i=>!manifest.items.some(r=>r.id===i.id)).map(i=>({id:i.id,nombre:i.label,categoria:'Pixeria',origen:'importado'}));return [...manifest.items,...extras].map(row=>({...row,...bridge.records[row.id],itilId:'cafebreria:'+row.id,geometry:bindings.has(row.id),pose:poses.get(row.id)||null}));}
 function render(){
  for(const link of document.querySelectorAll('#expertCategoryDetail [data-detail-category=inventory] a[href*="/inventario/"]')){const url=new URL(link.href);url.searchParams.set('lang',language());link.href=url;}
  const all=rows(),query=panel.querySelector('input').value.toLocaleLowerCase(),shown=all.filter(r=>(name(r)+' '+r.id+' '+inventoryCategory(r.categoria,language())).toLocaleLowerCase().includes(query));
  onCount(all.length);
  panel.querySelector('[data-count]').textContent=all.length+' '+t('fichas','records')+' · '+bindings.size+' 3D · '+(all.length-bindings.size)+' '+t('pendientes','pending');
  const list=panel.querySelector('[data-list]');list.replaceChildren();
  for(const r of shown){const row=el('div'),button=el('button',name(r)),note=el('small',inventoryCategory(r.categoria,language())+' · '+r.id+' · '+(r.geometry?(r.presentationExcluded?t('auxiliar excluido','excluded auxiliary'):r.pose?t('3D','3D'):t('retirado','removed')):t('sin geometría','no geometry')));row.className='cafe-itil-row';button.dataset.itilId=r.id;button.setAttribute('aria-pressed',String(r.id===selectedId));listen(button,'click',()=>select(r.id));row.append(button,note);list.append(row);}
 }
 function select(id){
  selectedId=id;render();const row=rows().find(r=>r.id===id);if(!row)return;
  const url=new URL(location.href);url.searchParams.set('asset',id);history.replaceState(null,'',url);
  if(row.geometry&&row.pose&&!row.presentationExcluded)onSelect(id);
  const detailHost=getDetailHost();if(detailHost)detailHost.append(record);else panel.append(record);record.hidden=false;record.dataset.inventoryId=id;record.replaceChildren(el('h3',name(row)),el('small',row.itilId));
  if(row.presentationExcluded)record.append(el('p',t(row.presentationReason?.es||'Auxiliar excluido de la escena.',row.presentationReason?.en||'Auxiliary excluded from the scene.')));
  if(row.medidas){const sizes=el('p');for(const [k,v] of Object.entries(row.medidas)){if(sizes.childNodes.length)sizes.append(document.createTextNode(' · '));sizes.append(el('span',t(k,({ancho:'width',fondo:'depth',alto:'height',unidad:'unit'})[k]||k)),document.createTextNode(': '+v));}record.append(sizes);}
  const registered=ciManifest?unitByInstance(ciManifest,id):null;
  const ci=registered?recordForUnit(ciManifest,registered):null;
  if(ci){
    const box=el('section');box.className='ci-record';box.setAttribute('aria-label',t('Ficha ITIL y 3D','ITIL and 3D record'));
    box.append(el('h4',t('Ficha ITIL y 3D','ITIL and 3D record')));
    box.append(el('p',t('Vínculo público confirmado el '+ci.confirmed_on+'. Yokup mantiene garantía, serie e histórico. Esta vista no los copia.','Public link confirmed on '+ci.confirmed_on+'. Yokup keeps warranty, serial and history. This view does not copy them.')));
    const dl=el('dl');dl.className='ci-record-fields';
    for(const [label,value] of recordFields(ci,language()==='en')){dl.append(el('dt',label),el('dd',value));}
    box.append(dl);
    const link=el('a',t('Abrir ficha maestra e histórico en Yokup ↗','Open master record and history in Yokup ↗'));
    link.href=recordURL(ci.code,location.href);link.target='_blank';link.rel='noopener';box.append(link);
    if(ciManifest?.yokup_alta==='pending_carlos') box.append(el('p',t('Alta Yokup de códigos CAF-* pendiente de confirmación de Carlos.','Yokup registration of CAF-* codes pending Carlos confirmation.')));
    record.append(box);
  }
  // Galería pública (/xpacios): no editar ni persistir garantía/serie. Solo nombre, fabricante, modelo, ubicación.
  const form=el('form');for(const [key,es,english]of [['nombre','Nombre','Name'],['fabricante','Fabricante','Manufacturer'],['modelo','Modelo','Model'],['ubicacion','Ubicación','Location']]){const label=el('label',t(es,english)),input=el('input');input.name=key;input.value=key==='nombre'?name(row):row[key]||'';if(key==='nombre')displayedName=input.value;label.append(input);form.append(label);}
  const save=el('button',t('Guardar ficha','Save record'));save.type='submit';form.append(save);listen(form,'submit',event=>{event.preventDefault();try{const values=redactPrivateInventoryFields(Object.fromEntries(new FormData(form)));if(values.nombre===displayedName)values.nombre=row.nombre;values.garantia='';bridge.editRecord(id,values);panel.querySelector('[data-status]').textContent=t('Ficha guardada en este navegador (sin garantía ni serie).','Record saved in this browser (no warranty or serial).');select(id);}catch{panel.querySelector('[data-status]').textContent=t('No se pudo guardar la ficha.','Could not save the record.');}});record.append(form);
  if(row.geometry&&row.pose&&!row.presentationExcluded){const edit=el('button',t('Editar en 3D','Edit in 3D')),visible=el('button',row.pose.hidden?t('Mostrar','Show'):t('Ocultar','Hide'));listen(edit,'click',()=>onEdit(id));listen(visible,'click',()=>{try{bridge.setVisible(id,!!row.pose.hidden);select(id);}catch{panel.querySelector('[data-status]').textContent=t('No se pudo guardar.','Could not save.');}});record.append(edit,visible);}else if(!row.presentationExcluded)record.append(el('p',t('Pendiente de modelar o retirado de la distribución.','Awaiting modelling or removed from the layout.')));
 }
 listen(document,'xpace:expert-category',event=>{if(!['inventory','itil'].includes(event.detail.id)){panel.append(record);record.hidden=selectedId===null;}else if(selectedId){const host=getDetailHost();if(host)host.append(record);}});
 listen(document,'xpace:shell-panel',event=>{if(event.detail.panel==='expert'&&!event.detail.open){panel.append(record);record.hidden=selectedId===null;}});
 listen(panel.querySelector('input'),'input',render);
 listen(panel.querySelector('[data-restore]'),'click',()=>{try{bridge.restore();render();panel.querySelector('[data-status]').textContent=t('Distribución original restaurada.','Original layout restored.');}catch{panel.querySelector('[data-status]').textContent=t('No se pudo restaurar.','Could not restore.');}});
 for(const button of panel.querySelectorAll('[data-export]'))listen(button,'click',()=>{const all=rows(),csv=button.dataset.export==='csv',quote=v=>'"'+String(v??'').replaceAll('"','""')+'"',data=csv?['itilId,itil_code,nombre,categoria,geometry,col,row,rot,fabricante,modelo',...all.map(r=>{const clean=redactPrivateInventoryFields(r);const code=ciManifest&&unitByInstance(ciManifest,r.id)?.itil_code||'';return [clean.itilId,code,clean.nombre,clean.categoria,clean.geometry,clean.pose?.col,clean.pose?.row,clean.pose?.rot,clean.fabricante,clean.modelo].map(quote).join(',')})].join('\n'):JSON.stringify({schema:'xpaceos.scene-itil/1',scene:'cafebreria',classification:manifest.classification,privacy:'no_warranty_no_serial',items:all.map(r=>{const clean=redactPrivateInventoryFields(r);const unit=ciManifest&&unitByInstance(ciManifest,r.id);return {...clean,itil_code:unit?.itil_code||'',garantia:undefined,serial:undefined}})},null,2),url=URL.createObjectURL(new Blob([data],{type:csv?'text/csv;charset=utf-8':'application/json'})),link=el('a');link.href=url;link.download='cafebreria-itil.'+(csv?'csv':'json');link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 function syncLanguage(){
  const current=rows().find(row=>row.id===selectedId),input=record.querySelector('input[name=nombre]');
  if(current){const translated=name(current);record.querySelector('h3').textContent=translated;if(input&&input.value===displayedName)input.value=translated;displayedName=translated;}
  const walker=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT),texts=[];while(walker.nextNode())texts.push(walker.currentNode);
  if(!panel.contains(record)){const detailWalker=document.createTreeWalker(record,NodeFilter.SHOW_TEXT);while(detailWalker.nextNode())texts.push(detailWalker.currentNode);}
  for(const node of texts){if(node.parentElement?.closest('h3,[data-list]'))continue;const pair=phrases.get(node.textContent);if(pair)node.textContent=pair[language()==='en'?1:0];}
  const search=panel.querySelector('input');search.placeholder=t('Buscar elemento…','Search element…');search.setAttribute('aria-label',t('Buscar elemento','Search element'));
  panel.setAttribute('aria-label',t('Inventario ITIL de Cafebrería','Cafebrería ITIL inventory'));
  floating.setLabel(t('Inventario ITIL · Cafebrería','ITIL inventory · Cafebrería'));
  const link=panel.querySelector('.cafe-inventory-actions a'),url=new URL(link.href);url.searchParams.set('lang',language());link.href=url;
  render();
 }
 const languageObserver=new MutationObserver(syncLanguage);languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});signal?.addEventListener('abort',()=>languageObserver.disconnect(),{once:true});
 syncLanguage();return {open(id){panel.hidden=false;floating.restore();render();if(id)select(id);},select,refresh:render,get count(){return rows().length;},dispose(){languageObserver.disconnect();record.remove();floating.dispose();panel.remove();}};
}
