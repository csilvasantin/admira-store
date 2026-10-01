import {ADAPTERS,projectContext,projectUrl} from './project-context.mjs';
const select=document.getElementById('projectSelector'),chip=document.getElementById('projectContextChip');
let projects=Object.entries(ADAPTERS).map(([id,a])=>({id,label:a.label,circuit:a.circuit})),last='';
const english=()=>document.documentElement.lang==='en'||new URL(location.href).searchParams.get('lang')==='en';
const text=(en,es)=>english()?en:es;
function refresh(){
  const context=projectContext(location.href,window.__xtancoVisualState?.()?.vertical);
  const stamp=JSON.stringify([context,english(),projects]);if(stamp===last)return;last=stamp;
  document.getElementById('projectSelectorLabel').textContent=text('Project and venue','Proyecto y local');
  document.getElementById('projectFieldLabel').textContent=text('Project','Proyecto');
  document.getElementById('projectVenueLabel').textContent=text('Venue','Local');
  select.replaceChildren();
  const available=document.createElement('optgroup');available.label=text('Available Xpacios','Xpacios disponibles');
  for(const [id,a] of Object.entries(ADAPTERS)){
    const option=new Option(a.label,id);available.append(option);
  }
  select.append(available);
  const pending=document.createElement('optgroup');pending.label=text('Backoffice projects · no linked twin','Proyectos del backoffice · sin gemelo vinculado');
  for(const project of projects.filter(p=>!ADAPTERS[p.id])){const option=new Option(project.label,project.id);option.disabled=true;pending.append(option);}
  if(pending.children.length)select.append(pending);
  if(!context.id){select.prepend(new Option(text('Choose a project','Escoge un proyecto'),''));}
  select.value=context.id;
  chip.textContent=context.label||text('Select project','Elegir proyecto');
  chip.setAttribute('aria-label',text('Project and venue: ','Proyecto y local: ')+(context.label||'')+' · '+(english()?context.venueEn||'':context.venueEs||''));
  chip.title=chip.getAttribute('aria-label');
  document.getElementById('projectVenueName').textContent=english()?context.venueEn||'—':context.venueEs||'—';
  document.getElementById('projectSelectionStatus').textContent=context.unavailable?text('This project has no associated twin here. Open the backoffice.','Este proyecto no tiene un gemelo asociado aquí. Abre el backoffice.'):context.linked?text('Linked venue · '+context.loc,'Local vinculado · '+context.loc):text('Demo · no real venue linked','Demo · sin local real vinculado');
  const link=document.getElementById('projectBackofficeLink');link.textContent=text('Manage projects in admira.app ↗','Gestionar proyectos en admira.app ↗');
  // Keep canonical IDs visible in shareable links without migrating saved layouts.
  if(context.id){const url=new URL(location.href);url.searchParams.set('project',context.id);url.searchParams.set('circuit',context.circuit);if(url.href!==location.href)history.replaceState(history.state,'',url);}
}
select.addEventListener('change',()=>{if(ADAPTERS[select.value])location.assign(projectUrl(location.href,select.value));});
chip.addEventListener('click',()=>{if(document.getElementById('pfOptions').getAttribute('aria-expanded')!=='true')document.getElementById('pfOptions').click();select.focus({preventScroll:true});});
window.addEventListener('xpaceos:project-change',refresh);window.addEventListener('resize',refresh);
new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
refresh();
fetch(new URL('./project-catalog.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('catalog');return r.json();}).then(catalog=>{projects=catalog.projects;refresh();}).catch(()=>{});
// Scene selection and legacy CLI routes can change context without reloading.
setInterval(refresh,1000);
