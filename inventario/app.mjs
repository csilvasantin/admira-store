import {preview} from './viewer.mjs?v=shelves-best-1';
import {mountCounterStage} from './counter-stage.mjs?v=shelves-best-1';
import {furnitureURL} from '../admira-xp/scripts/furniture-asset.mjs?v=shelves-best-1';
import {referenceLabel,referencePhotoURL} from './starbucks/reference-model.mjs?v=photo-references-1';
import {loadComponents,componentsFor,componentLabel,breakdownURL} from './breakdown-model.mjs?v=components-20261002-1';
let disposePilot,stageQueue=Promise.resolve();
function inspectAsset(asset){
 const qualitySelect=document.querySelector('#model-quality'),quality=qualitySelect.value;
 const current=new URL(location.href);current.searchParams.set('asset',asset.number);current.searchParams.set('quality',quality);history.replaceState(null,'',current);
 document.querySelector('#quality-note').textContent=asset.number===2&&quality==='best'?'Best · madera con veta y relieve, herrajes, envases y etiquetas detallados.':'Perfil '+quality.toUpperCase()+' · modelo 3D completo';
 const select=document.querySelector('#model-select');select.value=String(asset.number);
 stageQueue=stageQueue.then(async()=>{select.disabled=true;qualitySelect.disabled=true;disposePilot?.();disposePilot=null;const oldCanvas=document.querySelector('#mostrador canvas');oldCanvas.replaceWith(oldCanvas.cloneNode(false));
  document.querySelector('[data-status]').textContent='Cargando '+asset.name+'…';
  document.querySelector('[data-blend]').href=furnitureURL(asset.number,quality,'blend');
  document.querySelector('[data-glb]').href=furnitureURL(asset.number,quality);
  disposePilot=await mountCounterStage(document.querySelector('#mostrador'),asset,{controlsHost:document,quality});select.disabled=false;qualitySelect.disabled=false;
 });return stageQueue;
}
window.addEventListener('pagehide',()=>disposePilot?.());
import {STOCK_URL,numberedCatalog,loadCatalog,instancesFor} from './model.mjs?v=catalog-43-objects-1';
const $=s=>document.querySelector(s),store=window.XpaceInventory,tiers=['good','better','best'];
let data,stock,registry,assets=[],category='Todas',selected=null,angle=0,space='xtanco',renderRevision=0;
const realPhotos=new Map();
const cache=new Map();
let componentsPromise,breakdownAsset,breakdownRevision=0;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function photoFor(asset){
 const reference=realPhotos.get(asset.number);if(!reference)return null;
 const link=el('a',undefined,'catalog-real-photo');link.href='./starbucks/?view=references&ref='+reference.reference_id;link.setAttribute('aria-label','Ver foto real · Ref. '+referenceLabel(reference)+' · '+asset.name);
 const image=el('img');image.src=referencePhotoURL(reference,new URL('./starbucks/',location.href));image.alt='Foto real de '+asset.name;image.loading='lazy';image.decoding='async';image.width=96;image.height=76;
 image.onerror=()=>{image.replaceWith(el('span','Foto no disponible','catalog-photo-unavailable'));};
 link.append(image,el('small','Foto real · Ref. '+referenceLabel(reference)+(reference.photo_scope==='type'?' · tipo':'')));return link;
}
function layout(){return store.retained(space,store.layout(space)||data.layouts[space]||[]);}
function imageFor(asset,tier,rotation=0){const key=asset.id+':'+tier+':'+rotation;if(!cache.has(key))cache.set(key,preview(asset,tier,rotation).catch(e=>{cache.delete(key);throw e;}));return cache.get(key);}
function versions(asset,rotation=0){const fragment=document.createDocumentFragment();for(const [i,tier]of tiers.entries()){
 const figure=el('figure',undefined,'version '+tier),stage=el('div',undefined,'stage'),status=el('span','Preparando vista…','loading'),caption=el('figcaption');caption.append(el('b',['Good','Better','Best'][i]),el('span',[8,16,32][i]+' bits'));stage.append(status);figure.append(stage,caption);fragment.append(figure);
 imageFor(asset,tier,rotation).then(src=>{const img=el('img');img.alt=asset.name+' · '+tier+' · Blender 3D';img.onload=()=>status.remove();img.onerror=()=>{status.textContent='Imagen no disponible';img.remove();};img.src=src;stage.append(img);}).catch(()=>{status.textContent='Vista no disponible';status.classList.add('error');});
 }return fragment;}
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);const a=assets.find(a=>a.id===e.target.dataset.id);if(a)e.target.replaceChildren(versions(a));}},{rootMargin:'180px'});
function render(){
 if(!data)return;renderRevision++;observer.disconnect();const list=layout();$('#total').textContent=assets.length;$('#placed').textContent=list.length;
 $('#layout-source').textContent=store.layout(space)?'Último layout recibido del gemelo':'Distribución base · abre el gemelo para sincronizar';$('#open-space').href='/admira-xp/?play='+space+'&inventory=1';
 const query=$('#search').value.trim().toLocaleLowerCase('es');const shown=assets.filter(a=>(category==='Todas'||a.category===category)&&(a.number+' '+a.name).toLocaleLowerCase('es').includes(query));
 const fragment=document.createDocumentFragment();shown.forEach((a,i)=>{
  const card=el('article',undefined,'card'),head=el('div',undefined,'card-head'),title=el('div',undefined,'card-title');title.append(el('span',a.category+' / '+(a.source||'XpaceOS'),'badge'),el('h2',a.name));const photo=photoFor(a);if(photo)head.append(photo);head.append(title,el('span',String(a.number).padStart(2,'0'),'number'));
  const previews=el('div',undefined,'previews');previews.dataset.id=a.id;for(const tier of tiers)previews.append(el('div','···','stage loading'));
  const foot=el('div',undefined,'card-foot'),instances=instancesFor(a,list),visible=instances.filter(i=>store.visible(space,i.id)).length;
  foot.append(el('span',instances.length?visible+'/'+instances.length+' visibles · '+a.fp.join(' × ')+' tiles':a.fp.join(' × ')+' tiles · sin colocar'));
  const actions=el('div',undefined,'card-actions'),button=el('button','Ver pieza ↗'),breakdown=el('button','Desglose');button.onclick=()=>openDetail(a);button.setAttribute('aria-label','Ver pieza '+a.name);breakdown.onclick=()=>openBreakdown(a);breakdown.setAttribute('aria-label','Desglose '+a.name);actions.append(button,breakdown);foot.append(actions);card.append(head,previews,foot);fragment.append(card);observer.observe(previews);
 });$('#catalog').replaceChildren(fragment);$('#empty').hidden=shown.length>0;
}
function showInstances(){
 if(!selected)return;const instances=instancesFor(selected,layout());$('#instance-note').textContent=instances.length?(space==='xtanco'?'La visibilidad se aplica a Good, Better y al Best editable del inventario.':'La visibilidad se aplica al gemelo Good. Better y Best operativos están conectados al Xtanco.'):'Esta pieza aún no está colocada. Puedes añadirla desde el editor de mobiliario o el importador Pixeria de la Xperience.';
 $('#footprint').textContent='Huella '+selected.fp.join(' × ')+' tiles'+' · modelo Blender interpretado';
 $('#instances').replaceChildren(...instances.map(item=>{const row=el('div',undefined,'instance'),name=el('div',item.label||selected.name);name.append(el('small',item.id+' · posición '+item.col+', '+item.row));const visible=store.visible(space,item.id),button=el('button',visible?'Visible ●':'Oculto ○');button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',(visible?'Ocultar ':'Mostrar ')+(item.label||item.id));button.onclick=()=>{try{store.setVisible(space,item.id,!store.visible(space,item.id));$('#save-error').textContent='';}catch{$('#save-error').textContent='No se pudo guardar. Comprueba que el almacenamiento del navegador esté disponible.';}};row.append(name,button);return row;}));
}
function openDetail(a){selected=a;angle=0;$('#detail-name').textContent=a.number+'. '+a.name;$('#detail-category').textContent=a.source?'PIXERIA / INTERPRETACIÓN BLENDER 3D':'XPACEOS / MODELO BLENDER 3D';const photo=photoFor(a);$('#detail-real-photo').replaceChildren(...(photo?[photo]:[]));$('#detail-real-photo').hidden=!photo;$('#detail-previews').replaceChildren(versions(a));showInstances();$('#detail').showModal();$('#inspect-detail').onclick=()=>{$('#detail').close();inspectAsset(a);$('#mostrador').scrollIntoView({behavior:'smooth',block:'start'});};}
$('#close-detail').onclick=()=>$('#detail').close();$('#rotate').onclick=()=>{angle=(angle+Math.PI/4)%(2*Math.PI);$('#detail-previews').replaceChildren(versions(selected,angle));};
function componentRow(component,lang){
 const row=el('li',undefined,'component-row'),main=el('div',undefined,'component-main'),label=el('div'),quantity=el('span',component.quantity==null?(lang==='en'?'Unspecified':'Sin determinar'):String(component.quantity),'component-quantity');
 label.append(el('strong',componentLabel(component.label,lang)));if(component.note)label.append(el('p',componentLabel(component.note,lang),'component-note'));
 quantity.setAttribute('aria-label',(lang==='en'?'Model quantity: ':'Cantidad en el modelo: ')+quantity.textContent);main.append(label,quantity);row.append(main);
 if(component.components?.length){const details=el('details'),summary=el('summary',lang==='en'?'View subcomponents':'Ver subcomponentes'),list=el('ul',undefined,'component-list');list.append(...component.components.map(child=>componentRow(child,lang)));details.append(summary,el('p',lang==='en'?'Quantities per component unit.':'Cantidades por unidad del componente.','component-note'),list);row.append(details);}
 return row;
}
async function showBreakdown(){
 const revision=++breakdownRevision,asset=breakdownAsset,lang=$('#breakdown-language').value,tr=(es,en)=>lang==='en'?en:es,dialog=$('#breakdown');dialog.lang=lang;
 $('#breakdown-title').textContent=tr('Desglose','Breakdown')+' · '+asset.name;$('#breakdown-identity').textContent=String(asset.number).padStart(2,'0')+' / '+tr('COMPONENTES DEL MODELO BEST','BEST MODEL COMPONENTS');
 $('#close-breakdown').setAttribute('aria-label',tr('Cerrar desglose','Close breakdown'));$('#breakdown-language-label').textContent=tr('Idioma','Language');$('#breakdown-description').textContent=tr('Elementos del modelo Best. Cantidades por una unidad del mueble o dispositivo.','Elements of the Best model. Quantities per furniture or device unit.');$('#breakdown-view').textContent=tr('Ver pieza en 3D ↗','View piece in 3D ↗');$('#breakdown-link').textContent=tr('Enlace al desglose ↗','Breakdown link ↗');$('#breakdown-link').href=breakdownURL(location.href,asset,lang).href;
 const content=$('#breakdown-content');content.setAttribute('aria-busy','true');content.replaceChildren(el('p',tr('Cargando componentes…','Loading components…'),'notice'));$('#breakdown-sources').replaceChildren();
 try{
  const data=await (componentsPromise??=loadComponents().catch(error=>{componentsPromise=null;throw error;}));if(revision!==breakdownRevision||!dialog.open)return;
  const entry=componentsFor(data,asset);if(!entry?.groups?.length){content.replaceChildren(el('p',tr('El desglose de esta pieza está pendiente de documentación.','The breakdown for this piece has not been documented yet.')));return;}
  content.replaceChildren(...entry.groups.map(group=>{const section=el('section',undefined,'component-group'),list=el('ul',undefined,'component-list');list.append(...group.components.map(component=>componentRow(component,lang)));section.append(el('h3',componentLabel(group.label,lang)),list);return section;}));
  const sources=el('details'),summary=el('summary',tr('Origen del desglose','Breakdown sources')),list=el('ul');for(const source of entry.source||[]){if(!/^[\w./-]+$/.test(source)||source.includes('..'))continue;const item=el('li'),link=el('a',source);link.href=new URL('/'+source,location.origin).href;link.target='_blank';link.rel='noopener';item.append(link);list.append(item);}sources.append(summary);if(entry.note)sources.append(el('p',componentLabel(entry.note,lang)));sources.append(list);$('#breakdown-sources').append(sources);
 }catch{if(revision!==breakdownRevision||!dialog.open)return;const message=el('p',tr('No se pudo cargar el desglose.','The breakdown could not be loaded.'),'error'),retry=el('button',tr('Reintentar','Try again'));retry.onclick=showBreakdown;content.replaceChildren(message,retry);}finally{if(revision===breakdownRevision)content.setAttribute('aria-busy','false');}
}
function openBreakdown(asset){breakdownAsset=asset;$('#breakdown-language').value=new URLSearchParams(location.search).get('lang')==='en'?'en':'es';history.replaceState(null,'',breakdownURL(location.href,asset,$('#breakdown-language').value));$('#breakdown').showModal();showBreakdown();}
$('#breakdown-language').onchange=()=>{history.replaceState(null,'',breakdownURL(location.href,breakdownAsset,$('#breakdown-language').value));showBreakdown();};$('#close-breakdown').onclick=()=>$('#breakdown').close();$('#breakdown').addEventListener('close',()=>{breakdownRevision++;const url=new URL(location.href);url.searchParams.delete('view');history.replaceState(null,'',url);});
$('#breakdown-view').onclick=()=>{$('#breakdown').close();const url=new URL(location.href);url.searchParams.delete('view');url.hash='mostrador';history.replaceState(null,'',url);$('#model-quality').value='best';inspectAsset(breakdownAsset);$('#mostrador').scrollIntoView({behavior:'smooth',block:'start'});};
$('#search').oninput=render;$('#space').onchange=e=>{space=e.target.value;render();};document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));render();});
$('#restore').onclick=()=>{try{store.restore(space);}catch{$('#sync').textContent='No se pudo restaurar la visibilidad.';}};
store.subscribe(s=>{if(s===space){render();showInstances();}});window.addEventListener('storage',e=>{if(e.key==='xpaceos:inventory-layout:'+space){render();showInstances();}});
function merge(items){assets=numberedCatalog(data.native,[...stock.items,...items],registry);render();}
$('#refresh').onclick=async()=>{const button=$('#refresh');button.disabled=true;$('#sync').textContent='Consultando Pixeria…';try{const r=await fetch(STOCK_URL,{signal:AbortSignal.timeout(20000),cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.items))throw Error();merge(d.items);$('#sync').textContent=assets.length+' piezas numeradas · metadatos actualizados desde Pixeria'+(d.total>d.items.length?' · el servicio ha limitado la respuesta':'')+'.';}catch{$('#sync').textContent='Pixeria no responde. Conservamos el catálogo cargado; puedes volver a intentarlo.';}finally{button.disabled=false;}};
try{
 const [catalog,photos]=await Promise.all([loadCatalog(),fetch('./starbucks/manifest.json').then(r=>r.ok?r.json():null).catch(()=>null)]);({data,stock,registry}=catalog);for(const unit of photos?.units||[]){if(unit.asset_number>=44&&unit.asset_number<=50&&unit.photo&&unit.reference_id&&!realPhotos.has(unit.asset_number)){try{referencePhotoURL(unit,new URL('./starbucks/',location.href));realPhotos.set(unit.asset_number,unit);}catch{}}}merge(stock.items);const selector=$('#model-select');selector.replaceChildren(...assets.map(a=>{const o=el('option',a.number+'. '+a.name);o.value=a.number;return o;}));selector.onchange=()=>inspectAsset(assets.find(a=>a.number===Number(selector.value)));const params=new URLSearchParams(location.search);const qualitySelect=$('#model-quality');qualitySelect.value=tiers.includes(params.get('quality'))?params.get('quality'):'best';qualitySelect.onchange=()=>inspectAsset(assets.find(a=>a.number===Number(selector.value)));inspectAsset(assets.find(a=>a.number===Number(params.get('asset')))||assets[0]);$('#sync').textContent=assets.length+' piezas con identificadores permanentes · catálogo Pixeria del '+new Date(stock.fetchedAt).toLocaleDateString('es-ES')+'.';
 if(params.get('view')==='breakdown')openBreakdown(assets.find(a=>a.number===Number(params.get('asset')))||assets[0]);
 imageFor(data.native.find(x=>x.type==='counter'),'best').then(src=>{$('#hero-img').src=src;}).catch(()=>{$('#hero-img').alt='Mostrador: vista no disponible';});
}catch(e){$('#catalog').textContent=e.message;$('#sync').textContent='Recarga la página para volver a intentarlo.';}
window.addEventListener('pagehide',()=>observer.disconnect());
