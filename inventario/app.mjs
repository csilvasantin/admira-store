import {preview} from './viewer.mjs?v=catalog-43';
import {mountCounterStage} from './counter-stage.mjs?v=catalog-43';
import {furnitureURL} from '../admira-xp/scripts/furniture-asset.mjs';
let disposePilot,stageQueue=Promise.resolve();
function inspectAsset(asset){
 const select=document.querySelector('#model-select');select.value=String(asset.number);
 stageQueue=stageQueue.then(async()=>{select.disabled=true;disposePilot?.();disposePilot=null;const oldCanvas=document.querySelector('#mostrador canvas');oldCanvas.replaceWith(oldCanvas.cloneNode(false));
  document.querySelector('[data-status]').textContent='Cargando '+asset.name+'…';
  document.querySelector('[data-blend]').href=furnitureURL(asset.number,'best','blend');
  document.querySelector('[data-glb]').href=furnitureURL(asset.number,'best');
  disposePilot=await mountCounterStage(document.querySelector('#mostrador'),asset);select.disabled=false;
 });return stageQueue;
}
window.addEventListener('pagehide',()=>disposePilot?.());
import {STOCK_URL,numberedCatalog,loadCatalog,instancesFor} from './model.mjs?v=catalog-43';
const $=s=>document.querySelector(s),store=window.XpaceInventory,tiers=['good','better','best'];
let data,stock,registry,assets=[],category='Todas',selected=null,angle=0,space='xtanco',renderRevision=0;
const cache=new Map();
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
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
  const card=el('article',undefined,'card'),head=el('div',undefined,'card-head'),title=el('div');title.append(el('span',a.category+' / '+(a.source||'XpaceOS'),'badge'),el('h2',a.name));head.append(title,el('span',String(a.number).padStart(2,'0'),'number'));
  const previews=el('div',undefined,'previews');previews.dataset.id=a.id;for(const tier of tiers)previews.append(el('div','···','stage loading'));
  const foot=el('div',undefined,'card-foot'),instances=instancesFor(a,list),visible=instances.filter(i=>store.visible(space,i.id)).length;
  foot.append(el('span',instances.length?visible+'/'+instances.length+' visibles · '+a.fp.join(' × ')+' tiles':a.fp.join(' × ')+' tiles · sin colocar'));
  const button=el('button','Ver pieza ↗');button.onclick=()=>openDetail(a);button.setAttribute('aria-label','Ver pieza '+a.name);foot.append(button);card.append(head,previews,foot);fragment.append(card);observer.observe(previews);
 });$('#catalog').replaceChildren(fragment);$('#empty').hidden=shown.length>0;
}
function showInstances(){
 if(!selected)return;const instances=instancesFor(selected,layout());$('#instance-note').textContent=instances.length?(space==='xtanco'?'La visibilidad se aplica a Good, Better y al Best editable del inventario.':'La visibilidad se aplica al gemelo Good. Better y Best operativos están conectados al Xtanco.'):'Esta pieza aún no está colocada. Puedes añadirla desde el editor de mobiliario o el importador Pixeria de la Xperience.';
 $('#footprint').textContent='Huella '+selected.fp.join(' × ')+' tiles'+' · modelo Blender interpretado';
 $('#instances').replaceChildren(...instances.map(item=>{const row=el('div',undefined,'instance'),name=el('div',item.label||selected.name);name.append(el('small',item.id+' · posición '+item.col+', '+item.row));const visible=store.visible(space,item.id),button=el('button',visible?'Visible ●':'Oculto ○');button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',(visible?'Ocultar ':'Mostrar ')+(item.label||item.id));button.onclick=()=>{try{store.setVisible(space,item.id,!store.visible(space,item.id));$('#save-error').textContent='';}catch{$('#save-error').textContent='No se pudo guardar. Comprueba que el almacenamiento del navegador esté disponible.';}};row.append(name,button);return row;}));
}
function openDetail(a){selected=a;angle=0;$('#detail-name').textContent=a.number+'. '+a.name;$('#detail-category').textContent=a.source?'PIXERIA / INTERPRETACIÓN BLENDER 3D':'XPACEOS / MODELO BLENDER 3D';$('#detail-previews').replaceChildren(versions(a));showInstances();$('#detail').showModal();$('#inspect-detail').onclick=()=>{$('#detail').close();inspectAsset(a);$('#mostrador').scrollIntoView({behavior:'smooth',block:'start'});};}
$('#close-detail').onclick=()=>$('#detail').close();$('#rotate').onclick=()=>{angle=(angle+Math.PI/4)%(2*Math.PI);$('#detail-previews').replaceChildren(versions(selected,angle));};
$('#search').oninput=render;$('#space').onchange=e=>{space=e.target.value;render();};document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));render();});
$('#restore').onclick=()=>{try{store.restore(space);}catch{$('#sync').textContent='No se pudo restaurar la visibilidad.';}};
store.subscribe(s=>{if(s===space){render();showInstances();}});window.addEventListener('storage',e=>{if(e.key==='xpaceos:inventory-layout:'+space){render();showInstances();}});
function merge(items){assets=numberedCatalog(data.native,[...stock.items,...items],registry);render();}
$('#refresh').onclick=async()=>{const button=$('#refresh');button.disabled=true;$('#sync').textContent='Consultando Pixeria…';try{const r=await fetch(STOCK_URL,{signal:AbortSignal.timeout(20000),cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.items))throw Error();merge(d.items);$('#sync').textContent=assets.length+' piezas numeradas · metadatos actualizados desde Pixeria'+(d.total>d.items.length?' · el servicio ha limitado la respuesta':'')+'.';}catch{$('#sync').textContent='Pixeria no responde. Conservamos el catálogo cargado; puedes volver a intentarlo.';}finally{button.disabled=false;}};
try{
 ({data,stock,registry}=await loadCatalog());merge(stock.items);const selector=$('#model-select');selector.replaceChildren(...assets.map(a=>{const o=el('option',a.number+'. '+a.name);o.value=a.number;return o;}));selector.onchange=()=>inspectAsset(assets.find(a=>a.number===Number(selector.value)));inspectAsset(assets[0]);$('#sync').textContent=assets.length+' piezas con identificadores permanentes · catálogo Pixeria del '+new Date(stock.fetchedAt).toLocaleDateString('es-ES')+'.';
 imageFor(data.native.find(x=>x.type==='counter'),'best').then(src=>{$('#hero-img').src=src;}).catch(()=>{$('#hero-img').alt='Mostrador: vista no disponible';});
}catch(e){$('#catalog').textContent=e.message;$('#sync').textContent='Recarga la página para volver a intentarlo.';}
window.addEventListener('pagehide',()=>observer.disconnect());
