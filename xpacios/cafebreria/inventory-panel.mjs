import {attachFloatingPanel} from '../../admira-xp/scripts/floating-panels.mjs';
export function mountCafeInventory({host,manifest,bridge,bindings,onSelect,onEdit,onClose=()=>{},signal}){
 const en=document.documentElement.lang==='en',t=(es,enText)=>en?enText:es;
 const panel=document.createElement('aside');panel.className='cafe-inventory';panel.hidden=true;panel.setAttribute('aria-label',t('Inventario ITIL de Cafebrería','Cafebrería ITIL inventory'));
 panel.innerHTML=`<p>${t('Piezas de la escena visual. Las fichas pendientes no tienen modelo ni medidas confirmadas.','Visual scene pieces. Pending records have no model or confirmed dimensions.')}</p><input type="search" aria-label="${t('Buscar elemento','Search element')}" placeholder="${t('Buscar elemento…','Search element…')}"><p data-count></p><div data-list></div><section data-record hidden></section><div class="cafe-inventory-actions"><button data-export="json">JSON ↓</button><button data-export="csv">CSV ↓</button><button data-restore>${t('Restaurar distribución','Restore layout')}</button><a href="/inventario/?asset=51&quality=all#mostrador">${t('Librería · pieza ITIL 51 ↗','Bookcase · ITIL piece 51 ↗')}</a></div><p role="status" data-status></p>`;
 host.append(panel);
 const floating=attachFloatingPanel(panel,{label:t('Inventario ITIL · Cafebrería','ITIL inventory · Cafebrería'),bounds:host,key:'cafe-itil-inventory-v1',onClose:()=>{panel.hidden=true;onClose();},onOpen:()=>{panel.hidden=false;render();},menu:true});
 const listen=(node,event,fn)=>node.addEventListener(event,fn,{signal});
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 let selectedId=null;
 function rows(){const poses=new Map(bridge.read().layout.map(i=>[i.id,i]));const extras=bridge.read().layout.filter(i=>!manifest.items.some(r=>r.id===i.id)).map(i=>({id:i.id,nombre:i.label,categoria:'Pixeria',origen:'importado'}));return [...manifest.items,...extras].map(row=>({...row,...bridge.records[row.id],itilId:'cafebreria:'+row.id,geometry:bindings.has(row.id),pose:poses.get(row.id)||null}));}
 function render(){
  const all=rows(),query=panel.querySelector('input').value.toLocaleLowerCase(),shown=all.filter(r=>(r.nombre+' '+r.id+' '+r.categoria).toLocaleLowerCase().includes(query));
  panel.querySelector('[data-count]').textContent=all.length+' '+t('fichas','records')+' · '+bindings.size+' 3D · '+(all.length-bindings.size)+' '+t('pendientes','pending');
  const list=panel.querySelector('[data-list]');list.replaceChildren();
  for(const r of shown){const row=el('div'),button=el('button',r.nombre),note=el('small',r.categoria+' · '+r.id+' · '+(r.geometry?(r.pose?t('3D','3D'):t('retirado','removed')):t('sin geometría','no geometry')));row.className='cafe-itil-row';button.dataset.itilId=r.id;button.setAttribute('aria-pressed',String(r.id===selectedId));listen(button,'click',()=>select(r.id));row.append(button,note);list.append(row);}
 }
 function select(id){
  selectedId=id;render();const row=rows().find(r=>r.id===id);if(!row)return;
  const url=new URL(location.href);url.searchParams.set('asset',id);history.replaceState(null,'',url);
  if(row.geometry&&row.pose)onSelect(id);
  const record=panel.querySelector('[data-record]');record.hidden=false;record.replaceChildren(el('h3',row.nombre),el('small',row.itilId));
  if(row.medidas)record.append(el('p',Object.entries(row.medidas).map(([k,v])=>k+': '+v).join(' · ')));
  const form=el('form');for(const [key,es,english]of [['nombre','Nombre','Name'],['fabricante','Fabricante','Manufacturer'],['modelo','Modelo','Model'],['garantia','Garantía','Warranty'],['ubicacion','Ubicación','Location']]){const label=el('label',t(es,english)),input=el('input');input.name=key;input.value=row[key]||'';label.append(input);form.append(label);}
  const save=el('button',t('Guardar ficha','Save record'));save.type='submit';form.append(save);listen(form,'submit',event=>{event.preventDefault();try{bridge.editRecord(id,Object.fromEntries(new FormData(form)));panel.querySelector('[data-status]').textContent=t('Ficha guardada en este navegador.','Record saved in this browser.');select(id);}catch{panel.querySelector('[data-status]').textContent=t('No se pudo guardar la ficha.','Could not save the record.');}});record.append(form);
  if(row.geometry&&row.pose){const edit=el('button',t('Editar en 3D','Edit in 3D')),visible=el('button',row.pose.hidden?t('Mostrar','Show'):t('Ocultar','Hide'));listen(edit,'click',()=>onEdit(id));listen(visible,'click',()=>{try{bridge.setVisible(id,!!row.pose.hidden);select(id);}catch{panel.querySelector('[data-status]').textContent=t('No se pudo guardar.','Could not save.');}});record.append(edit,visible);}else record.append(el('p',t('Pendiente de modelar o retirado de la distribución.','Awaiting modelling or removed from the layout.')));
 }
 listen(panel.querySelector('input'),'input',render);
 listen(panel.querySelector('[data-restore]'),'click',()=>{try{bridge.restore();render();panel.querySelector('[data-status]').textContent=t('Distribución original restaurada.','Original layout restored.');}catch{panel.querySelector('[data-status]').textContent=t('No se pudo restaurar.','Could not restore.');}});
 for(const button of panel.querySelectorAll('[data-export]'))listen(button,'click',()=>{const all=rows(),csv=button.dataset.export==='csv',quote=v=>'"'+String(v??'').replaceAll('"','""')+'"',data=csv?['itilId,nombre,categoria,geometry,col,row,rot,fabricante,modelo,garantia',...all.map(r=>[r.itilId,r.nombre,r.categoria,r.geometry,r.pose?.col,r.pose?.row,r.pose?.rot,r.fabricante,r.modelo,r.garantia].map(quote).join(','))].join('\n'):JSON.stringify({schema:'xpaceos.scene-itil/1',scene:'cafebreria',classification:manifest.classification,items:all},null,2),url=URL.createObjectURL(new Blob([data],{type:csv?'text/csv;charset=utf-8':'application/json'})),link=el('a');link.href=url;link.download='cafebreria-itil.'+(csv?'csv':'json');link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 render();return {open(id){panel.hidden=false;floating.restore();render();if(id)select(id);},select,refresh:render,dispose(){floating.dispose();panel.remove();}};
}
