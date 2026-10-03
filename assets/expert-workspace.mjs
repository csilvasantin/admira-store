import {inventoryContext,inventoryURL} from '../inventario/context.mjs?v=scope-20261004-1';
import '../admira-xp/scripts/expert-categories.js?v=20261003-expert-1';
import '../admira-xp/scripts/expert-dock.js?v=20261003-expert-1';

const action=(es,en,command)=>({es,en,command});
export const EXPERT_CATEGORIES=[
 {id:'signage',es:'Signage',en:'Signage',detail:{es:'playlist',en:'playlist'},actions:[action('Abrir Signage en el gemelo','Open Signage in the twin','/ds')]},
 {id:'admiralive',es:'AdmiraLive',en:'AdmiraLive',detail:{es:'Texto LED',en:'LED text'},input:{es:'Texto LED',en:'LED text'},actions:[{...action('Aplicar texto','Apply text','/admiralive'),input:true},action('Apagar','Turn off','/admiralive off')]},
 {id:'livecam',es:'LiveCam',en:'LiveCam',detail:{es:'cámara',en:'camera'},actions:[action('Activar / desactivar cámara','Toggle camera','/livecam')]},
 {id:'dvr',es:'DVR',en:'DVR',detail:{es:'rebobinar',en:'rewind'},actions:[action('Abrir reproducción','Open replay','/dvr'),action('Volver al directo','Return to live','/envivo')]},
 {id:'anonymizer',es:'Anonymizer',en:'Anonymizer',detail:{es:'Píxeles ↔ humanos',en:'Pixels ↔ humans'},actions:[{es:'Abrir Anonymizer en Pixeria',en:'Open Anonymizer in Pixeria',href:'https://www.pixeria.com/anonimizador'}]},
 {id:'editor',es:'Mobiliario',en:'Furniture',detail:{es:'editor',en:'editor'},actions:[action('Distribuir muebles','Distribute furniture','/distribuir')]},
 {id:'avatar3d',es:'Avatar3D',en:'Avatar3D',detail:{es:'en vivo',en:'live'},actions:[action('Encender tótem en el gemelo','Turn on twin totem','/avatar3d on'),action('Apagar tótem en el gemelo','Turn off twin totem','/avatar3d off'),action('Avatar digital · on','Digital avatar · on','/avatardigital on'),action('Avatar digital · off','Digital avatar · off','/avatardigital off')]},
 {id:'impactos',es:'Audiencia',en:'Audience',detail:{es:'impactos · CPM',en:'impacts · CPM'},actions:[action('Mostrar audiencia','Show audience','/impactos on'),action('Ocultar audiencia','Hide audience','/impactos off')]},
 {id:'inventory',es:'Inventario/ITIL',en:'Inventory/ITIL',detail:{es:'… elementos',en:'… items'},actions:[action('Consultar inventario','View inventory','/inventario')]},
 {id:'perception',es:'Percepción',en:'Perception',detail:{es:'La pantalla te ve',en:'The screen sees you'},actions:[{es:'Abrir el gemelo · categoría Percepción',en:'Open the twin · Perception category',href:'/admira-xp/?autostart=xtanco&quality=better'}]},
];
export function expertCategories(overrides={}){return EXPERT_CATEGORIES.map(def=>({...def,...overrides[def.id],id:def.id}));}

// Tools retain their own nodes, listeners and close lifecycle. The placeholder
// restores their original parent when they detach or Expert closes.
export function createExpertDock({doc,accept=()=>true,onChange=()=>{}}){
 const records=new Map();
 function release(panel){
  const record=records.get(panel);if(!record)return false;
  panel.classList.remove('xs-expert-docked');record.detach.remove();
  if(panel.isConnected&&record.anchor.parentNode)record.anchor.before(panel);
  record.anchor.remove();records.delete(panel);onChange();return true;
 }
 function dock(panel,host,label,onDetach){
  if(!panel||!panel.isConnected||!accept(panel))return false;
  if(records.has(panel)){if(panel.parentNode===host)return false;host.append(panel);onChange();return true;}
  const anchor=doc.createComment('Expert tool original location');panel.before(anchor);
  const detach=doc.createElement('button');detach.type='button';detach.className='xs-tool-detach';detach.textContent='↗';detach.setAttribute('aria-label',label);
  detach.addEventListener('click',()=>{onDetach?.(panel);release(panel);});
  (panel.querySelector('.xp-floating-header,.xp-floating-handle,header')||panel).append(detach);
  records.set(panel,{anchor,detach});panel.classList.add('xs-expert-docked');host.append(panel);onChange();return true;
 }
 function prune(){for(const [panel,record]of records)if(!panel.isConnected){record.anchor.remove();records.delete(panel);}}
 return {dock,release,releaseAll(){for(const panel of [...records.keys()])release(panel);},prune,has:panel=>records.has(panel)};
}

export function mountExpertWorkspace({panel,shell,config}){
 const doc=panel.ownerDocument,view=doc.defaultView,abort=new view.AbortController(),{signal}=abort;
 const cards=panel.querySelector('#expertQuickIcons'),detail=panel.querySelector('#expertCategoryDetail'),heading=panel.querySelector('#expertControlsLabel');
 const t=def=>doc.documentElement.lang==='en'?(def.en||def.es):(def.es||def.en);
 const definitions=expertCategories(config.expertCategories),sections=new Map();let selected='',released=new WeakSet(),pending=false;
 const listen=(el,event,handler)=>el.addEventListener(event,handler,{signal});
 const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
 const dock=createExpertDock({doc,accept:tool=>!released.has(tool),onChange:()=>doc.dispatchEvent(new view.Event('xpace:expert-dock'))});
 function dockTools(){
  if(!shell.state().expert||!selected)return;
  dock.prune();const host=sections.get(selected);if(!host)return;
  for(const selector of config.expertPanels?.[selected]||[])for(const tool of doc.querySelectorAll(selector))if(!tool.hidden&&view.getComputedStyle(tool).display!=='none')dock.dock(tool,host,t({es:'Desacoplar ventana',en:'Detach window'}),tool=>released.add(tool));
 }
 function section(def){
  if(sections.has(def.id))return sections.get(def.id);
  const host=el('section',null,'xs-category-detail');host.dataset.detailCategory=def.id;detail.append(host);sections.set(def.id,host);
  if(def.note){const note=el('p',t(def.note),'xs-category-note');note.dataset.shellEs=def.note.es;note.dataset.shellEn=def.note.en;host.append(note);}
  const actions=el('div',null,'expert-detail-actions');host.append(actions);let input;
  if(def.input){const label=el('label'),caption=el('span',t(def.input));caption.dataset.shellEs=def.input.es;caption.dataset.shellEn=def.input.en;input=el('input');input.type='text';label.append(caption,input);host.append(label);}
  for(const spec of def.actions||[]){
   const button=el(spec.href?'a':'button',t(spec));button.dataset.shellEs=spec.es;button.dataset.shellEn=spec.en;
   if(spec.href){const context=inventoryContext(doc.location?.href||view.location.href);button.href=spec.href==='/inventario/'&&context.scoped?inventoryURL(doc.location?.href||view.location.href,context).href:spec.href;if(/^https:/.test(spec.href)){button.target='_blank';button.rel='noopener noreferrer';}}
   else{button.type='button';listen(button,'click',async()=>{
    if(spec.input&&!input?.value.trim())return;
    released=new WeakSet();
    try{
     if(spec.target){const target=doc.getElementById(spec.target);if(!target){shell.print(t({es:'La escena sigue cargando. Vuelve a intentarlo.',en:'The scene is still loading. Try again.'}));return;}target.click();}
     else if(spec.command)await shell.run(spec.command+(spec.input?' '+input.value.trim():''));
     dockTools();
    }catch(error){shell.print(error.message);}
   });}
   actions.append(button);
  }
  return host;
 }
 function select(id){
  id=id==='itil'?'inventory':id==='pixerai'?'editor':id;
  const def=definitions.find(d=>d.id===id);if(!def)return;
  selected=id;released=new WeakSet();section(def);heading.textContent=t(def);heading.dataset.shellEs=def.es;heading.dataset.shellEn=def.en;
  for(const [id,host]of sections)host.hidden=id!==selected;
  for(const button of cards.children){const active=button.dataset.categoryId===selected;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));}
  const preview=panel.querySelector('#expertPreviewLabel');if(preview){const inventory=['inventory','itil'].includes(id);preview.dataset.shellEs=inventory?'DETALLE':'PREVIOS';preview.dataset.shellEn=inventory?'DETAIL':'PREVIEWS';preview.textContent=t({es:preview.dataset.shellEs,en:preview.dataset.shellEn});}
  panel.querySelector('.expert-workspace').dataset.activeCategory=id;
  doc.dispatchEvent(new view.CustomEvent('xpace:expert-category',{detail:{id}}));
  dockTools();
  if(['inventory','itil'].includes(id)&&view.XpaceInventoryUI)shell.run('/inventario');
 }
 function renderCards(){
  const focused=cards.contains(doc.activeElement)?doc.activeElement.dataset.categoryId:null;
  for(const def of definitions){
   let button=[...cards.children].find(b=>b.dataset.categoryId===def.id);
   if(!button){button=el('button');button.type='button';button.dataset.quickAction=def.id;listen(button,'click',()=>select(def.id));cards.append(button);}
   const count=def.id==='inventory'?view.XpaceInventoryUI?.count:null;
   button.replaceChildren(el('strong',t(def)),el('span',Number.isFinite(count)?count+' '+t({es:'elementos',en:'items'}):t(def.detail)));
   view.XpaceExpertCategories.decorate(button,{en:doc.documentElement.lang==='en'});
   if(Number.isFinite(count))button.title=t(def)+' · '+count+' '+t({es:'elementos',en:'items'});
   button.classList.toggle('is-selected',def.id===selected);button.setAttribute('aria-pressed',String(def.id===selected));
  }
  if(focused)[...cards.children].find(b=>b.dataset.categoryId===focused)?.focus({preventScroll:true});
 }
 const observer=new view.MutationObserver(()=>{
  if(pending)return;pending=true;view.requestAnimationFrame(()=>{pending=false;dockTools();});
 });observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 const language=new view.MutationObserver(()=>{renderCards();for(const node of detail.querySelectorAll('[data-shell-es]'))node.textContent=t({es:node.dataset.shellEs,en:node.dataset.shellEn});if(selected)select(selected);});language.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 listen(doc,'xpace:shell-panel',event=>{if(event.detail.panel!=='expert')return;if(!event.detail.open)dock.releaseAll();else dockTools();});
 renderCards();
 const dispose=()=>{dock.releaseAll();observer.disconnect();language.disconnect();abort.abort();};listen(view,'pagehide',dispose);
 return {select,dockTools,dispose,get selected(){return selected;}};
}
