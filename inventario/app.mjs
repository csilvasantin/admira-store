import {coffeeCollectionURL,UNREAL_PROJECT_DOWNLOAD_URL} from './coffee-collection.mjs?v=hiperreal-tanda4-20261008-1';
import {qualityProfiles,selectedQuality,comparisonProfiles,qualityLabel,hasHiperreal} from './quality-model.mjs?v=hiperreal-tanda4-20261008-1';
import {inventoryContext,inventoryURL,twinURL,scopedAssets,scopedInstances} from './context.mjs?v=scope-20261004-1';
import {preview} from './viewer.mjs?v=hiperreal-tanda4-20261008-1';
import {mountCounterStage} from './counter-stage.mjs?v=hiperreal-tanda4-20261008-1';
import {furnitureURL} from '../admira-xp/scripts/furniture-asset.mjs?v=hiperreal-tanda4-20261008-1';
import {stageCamera} from './stage-camera.mjs?v=shelf-products-1';
import {pixelPreview} from './finish-rendering.mjs?v=hiperreal-tanda4-20261008-1';
import {referenceLabel,referencePhotoURL} from './starbucks/reference-model.mjs?v=ipad-20261005-1';
import {loadComponents,componentsFor,componentLabel,breakdownURL} from './breakdown-model.mjs?v=components-20261008-coffee47-1';
import {loadShelfParts} from '../admira-xp/scripts/shelf-parts.mjs?v=shelf-products-1';
import {mountShelfProductPanel} from './shelf-product-panel.mjs?v=shelf-products-1';
let disposePilot,stageQueue=Promise.resolve(),inspectionRevision=0,activeCamera,activeAssetNumber;
function configureQualitySelector(asset,requested){
 const selector=document.querySelector('#model-quality'),profiles=qualityProfiles(asset.number),quality=selectedQuality(asset.number,requested);
 selector.replaceChildren(...profiles.map(tier=>{const option=el('option',qualityLabel(tier)+' · '+({good:tr('básico','basic'),better:tr('estándar','standard'),best:tr('detallado','detailed'),matrix:tr('realista','realistic'),hiperreal:tr('fotorrealista','photoreal')}[tier]));option.value=tier;return option;}));
 const all=el('option',profiles.length===5?tr('Todos · comparar los cinco','All · compare all five'):profiles.length===4?tr('Todos · comparar los cuatro','All · compare all four'):tr('Todos · comparar los tres','All · compare all three'));all.value='all';selector.append(all);selector.value=quality;
 const count=document.querySelector('#finish-count');if(count)count.textContent=profiles.length;
 const legend=document.querySelector('#finish-legend');if(legend)legend.textContent=profiles.map((tier,i)=>qualityLabel(tier)+' · '+(tier==='matrix'?tr('realismo','realism'):tier==='hiperreal'?tr('fotorrealismo','photorealism'):[8,16,32][i])).join(' / ');
 const headline=document.querySelector('#finish-headline');if(headline)headline.textContent=profiles.length===5?tr('Cinco maneras de vivirlo.','Five ways to experience it.'):profiles.length===4?tr('Cuatro maneras de vivirlo.','Four ways to experience it.'):tr('Tres maneras de vivirlo.','Three ways to experience it.');
 return quality;
}
function inspectAsset(asset,requestedQuality=document.querySelector('#model-quality').value){
 if(!asset||!assets.some(a=>a.id===asset.id))return;
 const qualitySelect=document.querySelector('#model-quality'),quality=configureQualitySelector(asset,requestedQuality),profiles=comparisonProfiles(asset.number,quality),revision=++inspectionRevision;
 const current=new URL(location.href);current.searchParams.set('asset',asset.number);current.searchParams.set('quality',quality);history.replaceState(null,'',current);
 document.querySelector('#quality-note').textContent=quality==='all'?profiles.map(qualityLabel).join(' · ')+tr(' · gira o amplía una vista para compararlas.',' · orbit or zoom one view to compare them.'):quality==='hiperreal'?tr('Hiperreal · texturas PBR reales 2K–4K, imperfecciones, luz de cafetería (HDRI) y sombras de contacto.','Hiperreal · real 2K–4K PBR textures, imperfections, café lighting (HDRI) and contact shadows.'):quality==='matrix'?tr('Matrix · materiales físicos, reflejos de estudio y sombras suaves.','Matrix · physical materials, studio reflections and soft shadows.'):quality==='good'?tr('Good · pixel art nítido · píxeles sin suavizado.','Good · crisp pixel art · no pixel smoothing.'):asset.number===2&&quality==='best'?'Best · etiquetas de alta definición, madera con veta y herrajes detallados.':tr('Perfil ','Profile ')+quality.toUpperCase()+tr(' · modelo 3D completo',' · complete 3D model');
 const select=document.querySelector('#model-select');select.value=String(asset.number);
 stageQueue=stageQueue.catch(()=>{}).then(async()=>{if(revision!==inspectionRevision)return;select.disabled=true;qualitySelect.disabled=true;disposePilot?.();disposePilot=null;
  if(activeAssetNumber!==asset.number){activeAssetNumber=asset.number;activeCamera=stageCamera(asset.number===50?1.12:1);}const host=document.querySelector('#model-stages'),compare=quality==='all',disposers=[],camera=activeCamera;host.classList.toggle('compare-stages',compare);host.style.setProperty('--profile-count',profiles.length);host.replaceChildren();
  document.querySelector('[data-status]').textContent='Cargando '+asset.name+'…';
  const singleDownloads=document.querySelector('#single-downloads');singleDownloads.hidden=compare;if(!compare){document.querySelector('[data-blend]').href=furnitureURL(asset.number,quality,'blend');document.querySelector('[data-glb]').href=furnitureURL(asset.number,quality);}
  const profileDownloads=document.querySelector('#profile-downloads');profileDownloads.hidden=!compare;profileDownloads.replaceChildren();
  document.querySelector('#shelf-products')?.remove();const productsHost=document.createElement('div');productsHost.id='shelf-products';productsHost.className='shelf-products';host.after(productsHost);
  if(asset.number===47)for(const profile of quality==='all'?['best','matrix']:[['matrix','hiperreal'].includes(quality)?'matrix':'best']){const collection=el('a',tr('Despiece y productos ','Separated parts and products ')+qualityLabel(profile)+' ↗');collection.href=coffeeCollectionURL(location.href,{quality:profile}).href;collection.dataset.coffeeCollection=profile;productsHost.append(collection);}
  if(hasHiperreal(asset.number)&&['hiperreal','all'].includes(quality)){
   const base=new URL(`/inventario/assets/catalog/${String(asset.number).padStart(2,'0')}/hiperreal/`,location.origin),cycles=el('a',tr('Render hiperreal antes/después ↗','Hiperreal before/after render ↗')),hd=el('a',tr('Hiperreal HD para Unreal (GLB) ↓','Hiperreal HD for Unreal (GLB) ↓'));
   cycles.href=new URL(`preview/hiperreal-${asset.number}-comparativa.jpg`,base).href;cycles.target='_blank';cycles.rel='noopener';cycles.dataset.hiperrealRender='';
   hd.href=new URL('hiperreal-hd.glb',base).href;hd.download='';hd.dataset.hiperrealHd='';productsHost.append(cycles,hd);
  }
  if(asset.number===47&&['matrix','hiperreal','all'].includes(quality)){
   const collection=coffeeCollectionURL(location.href,{quality:'matrix'}),render=el('a',tr('Ver render de Unreal ↗','View Unreal render ↗')),project=el('a',tr('Proyecto Unreal ↓','Unreal project ↓'));
   render.href=new URL('unreal-studio.png',collection).href;render.target='_blank';render.rel='noopener';render.dataset.unrealRender='';
   project.href=UNREAL_PROJECT_DOWNLOAD_URL;project.download='';project.dataset.unrealProject='';productsHost.append(render,project);
  }
  const stages=profiles.map((tier,i)=>{const panel=document.createElement('section');panel.className='model-stage';panel.dataset.quality=tier;const title=document.createElement('h3');title.textContent=tier[0].toUpperCase()+tier.slice(1);title.hidden=!compare;const canvas=document.createElement('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label',asset.name+' '+title.textContent+': arrastra o usa las flechas para girar');const status=document.createElement('p');status.dataset.status='';status.setAttribute('role','status');panel.append(title,canvas,status);host.append(panel);
   if(compare){const downloads=document.createElement('div'),label=document.createElement('b');label.textContent=title.textContent;downloads.append(label);for(const extension of ['glb','blend']){const link=document.createElement('a');link.href=furnitureURL(asset.number,tier,extension);link.download='';link.textContent=extension==='glb'?'GLB ↓':'Blender ↓';link.setAttribute('aria-label','Descargar '+title.textContent+' '+(extension==='glb'?'GLB':'Blender'));downloads.append(link);}profileDownloads.append(downloads);}
   return {panel,tier,i};
  });
  try{for(const {panel,tier,i} of stages){disposers.push(await mountCounterStage(panel,asset,{controlsHost:i===0?document:document.createDocumentFragment(),quality:tier,cameraState:camera,onReady:async api=>{if(asset.number===51&&tier!=='good'){const {mountLibraryStage}=await import('./cafebreria/library-stage.mjs?v=windows-menu-1');return mountLibraryStage(productsHost,api);}if(asset.number!==2||tier!=='best')return;try{const doc=await loadShelfParts(),parts=mountShelfProductPanel(productsHost,doc,{autoOpen:new URLSearchParams(location.search).get('select')==='products',onSelect:part=>api.setPartSelection(part?.numeric_id)});api.onPartPick=id=>{const part=doc.parts.find(p=>p.numeric_id===id);if(part)parts.select(part);};return()=>parts.dispose();}catch{productsHost.textContent='No se pudo cargar la selección de componentes. Recarga para reintentar.';}}}));if(revision!==inspectionRevision)break;}disposePilot=()=>disposers.forEach(dispose=>dispose?.());document.querySelector('#mostrador > [data-status]').textContent=stages.some(({panel})=>panel.dataset.assetStatus==='error')?tr('Una vista no está disponible. Consulta su aviso o elige otro perfil.','A view is unavailable. Check its message or choose another profile.'):compare?profiles.map(qualityLabel).join(' · ')+tr(' · vistas sincronizadas',' · synchronized views'):asset.number+'. '+asset.name+' · '+quality.toUpperCase();}finally{select.disabled=false;qualitySelect.disabled=false;}
 });return stageQueue;
}
window.addEventListener('pagehide',()=>{disposePilot?.();for(const dispose of pixelPreviews.values())dispose();pixelPreviews.clear();});
import {STOCK_URL,numberedCatalog,loadCatalog,instancesFor} from './model.mjs?v=ipad-20261005-1';
const $=s=>document.querySelector(s),store=window.XpaceInventory;
const context=inventoryContext(location.href),en=context.lang==='en',tr=(es,english)=>en?english:es;
let data,stock,registry,allAssets=[],assets=[],ownedSeed=[],deviceRecords=[],category='Todas',selected=null,angle=0,space=context.space,renderRevision=0;
const ownership=new Map();
function activeLayout(){if(context.scoped&&!context.valid)return [];return store.retained(space,store.layout(space)||data.layouts[space]||ownedSeed);}
function ownedLayout(){const current=activeLayout();return [...current.map(item=>({...item,inventoryAssetId:ownership.get(item.id)||item.inventoryAssetId})),...ownedSeed.filter(item=>!current.some(i=>i.id===item.id))];}
function syncScope(){
 assets=scopedAssets(allAssets,ownedLayout(),context);
 const selector=$('#model-select'),previous=Number(selector.value);selector.replaceChildren(...assets.map(a=>{const option=el('option',a.number+'. '+a.name);option.value=a.number;return option;}));
 if(assets.some(a=>a.number===previous))selector.value=String(previous);
 $('#mostrador .pilot-heading .eyebrow').textContent=assets.length+' '+tr('PIEZAS / ','PIECES / ')+(context.scoped?context.name:tr('CATÁLOGO BLENDER','BLENDER CATALOGUE'));
 if(context.scoped){
  $('.intro h1').textContent=tr('Inventario de ','Inventory · ')+context.name;$('.intro .lede').textContent=tr('Mobiliario e IoT de este Xpacio. Cada elemento conserva su identidad.','Furniture and IoT belonging to this Xpace. Every item retains its identity.');
  $('#total').nextElementSibling.textContent=tr('modelos de este Xpacio','models in this Xpace');
  $('#mostrador').hidden=!assets.length;$('#hero').hidden=!assets.length;
 }
 if(selected&&!assets.some(a=>a.id===selected.id)){$('#detail').close();selected=null;}
 if(breakdownAsset&&!assets.some(a=>a.id===breakdownAsset.id)){$('#breakdown').close();breakdownAsset=null;}
 if(activeAssetNumber&&!assets.some(a=>a.number===activeAssetNumber)){inspectionRevision++;disposePilot?.();disposePilot=null;$('#model-stages').replaceChildren();$('#single-downloads').hidden=true;$('#profile-downloads').hidden=true;activeAssetNumber=null;}
}
function installContext(){
 if(!context.scoped)return;
 const applyTitle=()=>{const section=document.querySelector('.xs-section');if(section)section.textContent=context.name;};applyTitle();document.addEventListener('xpace:shell-ready',applyTitle,{once:true});
 document.title=tr('Inventario ITIL · ','ITIL inventory · ')+context.name+' · XpaceOS';
 const option=el('option',context.name);option.value=space;$('#space').replaceChildren(option);$('#space').disabled=true;
 for(const link of document.querySelectorAll('a')){
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin)continue;
  if(url.pathname==='/admira-xp/')link.href=twinURL(location.href,context);
  if(url.pathname.includes('/inventario/conjunto')||url.pathname.endsWith('/admira-xp/inventario.html')||url.pathname.startsWith('/xpacios/cafebreria/')&&space!=='cafebreria'||url.pathname.startsWith('/inventario/starbucks/')&&space!=='starbucks_pg103')link.hidden=true;
 }
 if(document.querySelector('[data-current-inventory]'))return;const full=el('a',tr('Volver al inventario completo del Xpacio ↗','Back to the full Xpace inventory ↗'));full.dataset.currentInventory='';full.href=twinURL(location.href,context);$('#layout-source').after(full);
}
installContext();
document.addEventListener('xpace:shell-ready',installContext,{once:true});
const realPhotos=new Map();
const cache=new Map();
const pixelPreviews=new Map();
function cleanPixelPreviews(){for(const [stage,dispose]of pixelPreviews)if(!stage.isConnected){dispose();pixelPreviews.delete(stage);}}
let componentsPromise,breakdownAsset,breakdownRevision=0;
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function photoFor(asset){
 const reference=realPhotos.get(asset.number);if(!reference)return null;
 const link=el('a',undefined,'catalog-real-photo');link.href='./starbucks/?view=references&ref='+reference.reference_id;link.setAttribute('aria-label','Ver foto real · Ref. '+referenceLabel(reference)+' · '+asset.name);
 const image=el('img');image.src=referencePhotoURL(reference,new URL('./starbucks/',location.href));image.alt='Foto real de '+asset.name;image.loading='lazy';image.decoding='async';image.width=96;image.height=76;
 image.onerror=()=>{image.replaceWith(el('span','Foto no disponible','catalog-photo-unavailable'));};
 link.append(image,el('small','Foto real · Ref. '+referenceLabel(reference)+(reference.photo_scope==='type'?' · tipo':'')));return link;
}
function layout(){return activeLayout().map(item=>({...item,inventoryAssetId:ownership.get(item.id)||item.inventoryAssetId}));}
function imageFor(asset,tier,rotation=0){const key=asset.id+':'+tier+':'+rotation;if(!cache.has(key))cache.set(key,preview(asset,tier,rotation).catch(e=>{cache.delete(key);throw e;}));return cache.get(key);}
function versions(asset,rotation=0){const fragment=document.createDocumentFragment();for(const [i,tier]of qualityProfiles(asset.number).entries()){
 const figure=el('figure',undefined,'version '+tier),stage=el('div',undefined,'stage'),status=el('span','Preparando vista…','loading'),caption=el('figcaption');caption.append(el('b',qualityLabel(tier)),el('span',tier==='matrix'?tr('realismo','realism'):tier==='hiperreal'?tr('fotorrealismo','photorealism'):[8,16,32][i]+' bits'));stage.append(status);figure.append(stage,caption);fragment.append(figure);
 imageFor(asset,tier,rotation).then(src=>{if(!stage.isConnected)return;const alt=asset.name+' · '+tier+' · Blender 3D';if(tier==='good'){pixelPreviews.set(stage,pixelPreview(stage,src,alt,()=>status.remove(),()=>{status.textContent='Imagen no disponible';}));return;}const img=el('img');img.alt=alt;img.onload=()=>status.remove();img.onerror=()=>{status.textContent='Imagen no disponible';img.remove();};img.src=src;stage.append(img);}).catch(()=>{status.textContent=tier==='matrix'?tr('Matrix no disponible','Matrix unavailable'):tr('Vista no disponible','View unavailable');status.classList.add('error');});
 }return fragment;}
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);const a=assets.find(a=>a.id===e.target.dataset.id);if(a)e.target.replaceChildren(versions(a));}},{rootMargin:'180px'});
// Cliente activo (/assets/xpace-cliente.js): Admira ve todas las piezas; con otro cliente se ocultan las de otros clientes.
document.addEventListener('xpace:cliente',()=>render());
function render(){
 if(!data)return;syncScope();renderRevision++;observer.disconnect();const list=layout();$('#total').textContent=assets.length;$('#placed').textContent=list.filter(item=>!item.referenceOnly).length;
 $('#layout-source').textContent=store.layout(space)?'Último layout recibido del gemelo':'Distribución base · abre el gemelo para sincronizar';$('#open-space').href=twinURL(location.href,{...context,space});
 const query=$('#search').value.trim().toLocaleLowerCase('es');const shown=assets.filter(a=>(category==='Todas'||a.category===category)&&(a.number+' '+a.name).toLocaleLowerCase('es').includes(query)&&(!window.XpaceCliente||window.XpaceCliente.visible({id:a.id,name:a.name})));
 const fragment=document.createDocumentFragment();shown.forEach((a,i)=>{
  const card=el('article',undefined,'card'),head=el('div',undefined,'card-head'),title=el('div',undefined,'card-title');title.append(el('span',a.category+' / '+(a.source||'XpaceOS'),'badge'),el('h2',a.name));const photo=photoFor(a);if(photo)head.append(photo);head.append(title,el('span',String(a.number).padStart(2,'0'),'number'));
  const previews=el('div',undefined,'previews');previews.dataset.id=a.id;previews.style.setProperty('--profile-count',qualityProfiles(a.number).length);for(const tier of qualityProfiles(a.number))previews.append(el('div','···','stage loading'));
  const foot=el('div',undefined,'card-foot'),instances=scopedInstances(a,list).filter(item=>!item.referenceOnly),visible=instances.filter(i=>store.visible(space,i.id)).length;
  foot.append(el('span',instances.length?visible+'/'+instances.length+' visibles · '+a.fp.join(' × ')+' tiles':a.fp.join(' × ')+' tiles · sin colocar'));
  const actions=el('div',undefined,'card-actions'),button=el('button','Ver pieza ↗'),breakdown=el('button','Desglose');button.onclick=()=>openDetail(a);button.setAttribute('aria-label','Ver pieza '+a.name);breakdown.onclick=()=>openBreakdown(a);breakdown.setAttribute('aria-label','Desglose '+a.name);actions.append(button,breakdown);if(a.number===47){const collection=el('a',tr('Despiece y productos ↗','Separated parts and products ↗'));collection.href=coffeeCollectionURL(location.href).href;collection.dataset.coffeeCollection='';actions.append(collection);}foot.append(actions);card.append(head,previews,foot);fragment.append(card);observer.observe(previews);
 });const extraRecords=context.scoped?list.filter(item=>!allAssets.some(asset=>scopedInstances(asset,[item]).length)&&item.id!=='sb-pillar').map(item=>({id:item.id,name:item.label||item.id,category:item.source==='PixerIA'||item.type==='custom'?'Pixeria':'Mobiliario'})):[];
 for(const record of extraRecords){if(category!=='Todas'&&category!==record.category||!(record.name+' '+record.id).toLocaleLowerCase('es').includes(query))continue;const card=el('article',undefined,'card');card.dataset.instanceId=record.id;card.append(el('span',record.category+' / '+context.name,'badge'),el('h2',record.name),el('p',record.id),el('p',tr('Elemento de este Xpacio. Modelo numerado pendiente.','Item belonging to this Xpace. Numbered model pending.')));fragment.append(card);}
 for(const record of deviceRecords){if(category!=='Todas'&&category!=='IoT'||!(record.name+' '+record.id).toLocaleLowerCase('es').includes(query))continue;const card=el('article',undefined,'card');card.dataset.deviceId=record.id;card.append(el('span','IoT / '+context.name,'badge'),el('h2',record.name),el('p',record.id),el('p',tr('Dispositivo virtual del Xpacio. Vinculación física pendiente.','Virtual Xpace device. Physical binding pending.')));fragment.append(card);}
 $('#catalog').replaceChildren(fragment);cleanPixelPreviews();$('#empty').hidden=$('#catalog').children.length>0; if(context.scoped&&!context.valid)$('#empty').textContent=tr('No se reconoce este Xpacio. Abre ITIL desde el proyecto que estás visitando.','Unknown Xpace. Open ITIL from the project you are visiting.');
}
function showInstances(){
 if(!selected)return;const instances=scopedInstances(selected,layout()).filter(item=>!item.referenceOnly);$('#instance-note').textContent=instances.length?(space==='xtanco'?'La visibilidad se aplica a Good, Better y al Best editable del inventario.':'La visibilidad se aplica al gemelo Good. Better y Best operativos están conectados al Xtanco.'):'Esta pieza aún no está colocada. Puedes añadirla desde el editor de mobiliario o el importador Pixeria de la Xperience.';
 $('#footprint').textContent='Huella '+selected.fp.join(' × ')+' tiles'+' · modelo Blender interpretado';
 $('#instances').replaceChildren(...instances.map(item=>{const row=el('div',undefined,'instance'),name=el('div',item.label||selected.name);name.append(el('small',item.id+' · posición '+item.col+', '+item.row));const visible=store.visible(space,item.id),button=el('button',visible?'Visible ●':'Oculto ○');button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',(visible?'Ocultar ':'Mostrar ')+(item.label||item.id));button.onclick=()=>{try{store.setVisible(space,item.id,!store.visible(space,item.id));$('#save-error').textContent='';}catch{$('#save-error').textContent='No se pudo guardar. Comprueba que el almacenamiento del navegador esté disponible.';}};row.append(name,button);return row;}));
}
function openDetail(a){selected=a;angle=0;$('#detail-name').textContent=a.number+'. '+a.name;$('#detail-category').textContent=a.source?'PIXERIA / INTERPRETACIÓN BLENDER 3D':'XPACEOS / MODELO BLENDER 3D';const photo=photoFor(a);$('#detail-real-photo').replaceChildren(...(photo?[photo]:[]));$('#detail-real-photo').hidden=!photo;$('#detail-previews').style.setProperty('--profile-count',qualityProfiles(a.number).length);$('#detail-previews').replaceChildren(versions(a));cleanPixelPreviews();showInstances();$('#detail').showModal();$('#inspect-detail').onclick=()=>{$('#detail').close();inspectAsset(a);$('#mostrador').scrollIntoView({behavior:'smooth',block:'start'});};}
$('#close-detail').onclick=()=>$('#detail').close();$('#rotate').onclick=()=>{angle=(angle+Math.PI/4)%(2*Math.PI);$('#detail-previews').replaceChildren(versions(selected,angle));cleanPixelPreviews();};
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
$('#search').oninput=render;$('#space').onchange=e=>{location.assign(inventoryURL(location.href,{space:e.target.value,project:e.target.value==='xtanco'?'estancos':e.target.value}));};document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));render();});
$('#restore').onclick=()=>{try{store.restore(space);}catch{$('#sync').textContent='No se pudo restaurar la visibilidad.';}};
store.subscribe(s=>{if(s===space){render();showInstances();}});window.addEventListener('storage',e=>{if(e.key==='xpaceos:inventory-layout:'+space){render();showInstances();}});
function merge(items){allAssets=numberedCatalog(data.native,[...stock.items,...items],registry);render();}
$('#refresh').onclick=async()=>{const button=$('#refresh');button.disabled=true;$('#sync').textContent='Consultando Pixeria…';try{const r=await fetch(STOCK_URL,{signal:AbortSignal.timeout(20000),cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.items))throw Error();merge(d.items);$('#sync').textContent=assets.length+' piezas numeradas · metadatos actualizados desde Pixeria'+(d.total>d.items.length?' · el servicio ha limitado la respuesta':'')+'.';}catch{$('#sync').textContent='Pixeria no responde. Conservamos el catálogo cargado; puedes volver a intentarlo.';}finally{button.disabled=false;}};
try{
 const [catalog,photos]=await Promise.all([loadCatalog(),context.space==='starbucks_pg103'||!context.scoped?fetch('./starbucks/manifest.json').then(r=>r.ok?r.json():null).catch(()=>null):null]);({data,stock,registry}=catalog);
 allAssets=catalog.assets;
 if(context.valid&&space==='starbucks_pg103'){
  for(const unit of photos?.units||[]){const asset=allAssets.find(a=>a.number===unit.asset_number);if(!asset)continue;ownership.set(unit.instance_id,asset.id);ownedSeed.push({id:unit.instance_id,type:asset.type,inventoryAssetId:asset.id,label:unit.name,referenceOnly:true});}
  const [{STARBUCKS_WALL_MAPPING},{STARBUCKS_TPV_MAPPING},{STARBUCKS_IPAD_MAPPING}]=await Promise.all([import('../admira-xp/scripts/starbucks-screens.mjs'),import('../admira-xp/scripts/starbucks-tpv.mjs'),import('../admira-xp/scripts/starbucks-ipad.mjs')]);
  deviceRecords=[...STARBUCKS_WALL_MAPPING.players,...STARBUCKS_TPV_MAPPING.players,...STARBUCKS_IPAD_MAPPING.players].map(device=>({id:device.id,name:device.name}));
  deviceRecords.push({id:'starbucks-alsea-paseo-de-gracia',name:tr('Altavoz · hilo musical','Speaker · background music')});
 }else if(context.valid&&space==='cafebreria'){
  ownedSeed=[{id:'cafebreriaLibrary',type:'cafebreriaLibrary',inventoryAssetId:'native:cafebreriaLibrary',referenceOnly:true}];
 }
 for(const unit of photos?.units||[]){if(unit.asset_number>=44&&unit.asset_number<=50&&unit.photo&&unit.reference_id&&!realPhotos.has(unit.asset_number)){try{referencePhotoURL(unit,new URL('./starbucks/',location.href));realPhotos.set(unit.asset_number,unit);}catch{}}}
 merge(stock.items);
 const selector=$('#model-select'),params=new URLSearchParams(location.search),qualitySelect=$('#model-quality');
 const choose=()=>{const asset=assets.find(a=>a.number===Number(selector.value));if(asset)inspectAsset(asset);};selector.onchange=choose;
 qualitySelect.onchange=choose;
 const requested=params.get('asset'),initial=requested?assets.find(a=>a.number===Number(requested)):assets[0];
 if(initial){inspectAsset(initial,params.get('quality')||'best');if(params.get('view')==='breakdown')openBreakdown(initial);}else{$('#single-downloads').hidden=true;$('#model-stages').replaceChildren(el('p',tr('Esta pieza no pertenece a este Xpacio. Elige una de su inventario.','This piece does not belong to this Xpace. Choose one from its inventory.')));}
 $('#sync').textContent=assets.length+' '+tr('modelos con identificadores permanentes','models with permanent identities')+(context.scoped?' · '+context.name:'');
 const hero=initial||assets[0];if(hero){$('.hero-note').textContent=hero.number+' / '+hero.name;$('#hero-img').alt=hero.name;imageFor(hero,'best').then(src=>{$('#hero-img').src=src;}).catch(()=>{$('#hero-img').alt=tr('Vista no disponible','Preview unavailable');});}
}catch(e){$('#catalog').textContent=e.message;$('#sync').textContent='Recarga la página para volver a intentarlo.';}
window.addEventListener('pagehide',()=>observer.disconnect());
