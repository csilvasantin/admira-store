const CATALOG_URL=new URL('../../mcp/funcionalidades.json',import.meta.url);
const statusLabels={native:'Control nativo',partial:'Integración parcial',presentation_only:'Sólo representación',classic_only:'Controles en Good',outside_view:'Fuera de esta vista',code_present:'Código presente',planned:'En preparación'};
const gapStatuses=new Set(['partial','presentation_only','classic_only','outside_view']);
const $=id=>document.getElementById(id);
const text=value=>typeof value==='string'?value:'';
const list=value=>Array.isArray(value)?value:[];
const normalize=value=>String(value).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const sourceCommit=catalog=>/^[a-f\d]{40}$/i.test(text(catalog.audit?.source_commit))?catalog.audit.source_commit:'';
let entries=[],loading=false;

function node(tag,className='',content=''){
  const element=document.createElement(tag);if(className)element.className=className;
  if(content!==undefined&&content!=='')element.textContent=content;return element;
}
function section(title){const block=node('section','detail-section');block.append(node('h3','',title));return block;}
function renderTier(name,value={}){
  const tier=node('div','tier'),status=text(value.status);
  tier.append(node('h3','tier-name',name));
  const badge=node('span','coverage',statusLabels[status]||'Sin clasificar');badge.dataset.status=status;
  tier.append(badge,node('p','tier-detail',text(value.detail)||'Sin detalle en el catálogo.'));return tier;
}
function renderCommands(feature){
  const block=section('Comandos existentes'),commands=list(feature.commands);
  block.append(node('p','read-only-note','Referencia de lectura. Esta página no ejecuta comandos.'));
  if(!commands.length){block.append(node('p','','No hay comandos documentados para esta función.'));return block;}
  const ul=node('ul','command-list');
  for(const command of commands){
    const item=node('li'),heading=node('div','command-header');
    const state=node('span','command-status',command.status==='source_verified'?'Verificado en código':command.status==='warning'?'Revisar alcance':'Sin validar');state.dataset.status=text(command.status);
    heading.append(node('code','',text(command.text)),state);item.append(heading);
    if(command.note)item.append(node('p','command-note',text(command.note)));
    if(command.entrypoint)item.append(node('span','entrypoint',`Entrada: ${text(command.entrypoint)}`));
    ul.append(item);
  }
  block.append(ul);return block;
}
function renderMcp(feature){
  const block=section('Conexión MCP'),tools=list(feature.mcp?.tools);
  if(!tools.length)block.append(node('p','','No hay herramientas MCP asociadas en este catálogo.'));
  else{
    const ul=node('ul','tool-list');
    for(const tool of tools){
      const item=node('li'),heading=node('div','tool-header');
      heading.append(node('code','',`${text(tool.server)} / ${text(tool.name)}`),node('span','tool-access',tool.access==='read'?'Consulta':tool.access==='write'?'Modifica estado':'Acceso sin clasificar'));
      item.append(heading);if(tool.scope)item.append(node('p','tool-scope',text(tool.scope)));ul.append(item);
    }
    block.append(ul);
  }
  if(feature.mcp?.gap)block.append(node('p','mcp-gap',text(feature.mcp.gap)));return block;
}
function renderRestore(feature){
  const block=section('Criterios de recuperación'),criteria=list(feature.restore);
  if(!criteria.length)block.append(node('p','','Sin criterios adicionales documentados.'));
  else{const ul=node('ul','criteria');for(const criterion of criteria)ul.append(node('li','',text(criterion)));block.append(ul);}
  return block;
}
function renderEvidence(feature,commit){
  const block=section('Evidencias de código'),evidence=list(feature.evidence);
  block.append(node('p','read-only-note',commit?'Las líneas corresponden al commit auditado indicado junto a la versión, no a HEAD.':'Sin commit válido: estas referencias no están ancladas a una revisión verificable.'));
  if(!evidence.length)block.append(node('p','','No hay referencias de código en esta entrada.'));
  else{
    const ul=node('ul','evidence-list');
    for(const reference of evidence){
      const line=Number.isInteger(reference.line)&&reference.line>0?`:${reference.line}`:'';
      const item=node('li');item.append(node('code','',`${text(reference.path)}${line}`));
      if(reference.symbol)item.append(node('span','evidence-symbol',text(reference.symbol)));ul.append(item);
    }
    block.append(ul);
  }
  return block;
}
function renderFeature(feature,commit){
  const article=node('article','feature-card');article.id=feature.id;article.setAttribute('aria-labelledby',`${feature.id}-title`);
  const header=node('div','feature-heading'),top=node('div','feature-heading-top');
  const title=node('h2','',`${feature.number}.- ${feature.title}`);title.id=`${feature.id}-title`;
  const anchor=node('a','feature-anchor',feature.id);anchor.href=`#${feature.id}`;anchor.setAttribute('aria-label',`Enlace a ${feature.number}.- ${feature.title}`);
  top.append(title,anchor);header.append(top,node('p','feature-summary',feature.summary));
  const tiers=node('div','tier-grid');tiers.append(renderTier('Good',feature.good),renderTier('Better',feature.better),renderTier('Best',feature.best));
  const details=node('details','feature-details'),content=node('div','details-content');
  details.append(node('summary','','Comandos, MCP y criterios de recuperación'));
  content.append(renderCommands(feature),renderMcp(feature),renderRestore(feature),renderEvidence(feature,commit));details.append(content);
  article.append(header,tiers,details);return article;
}
function markActive(id){
  for(const entry of entries){if(entry.feature.id===id)entry.link.setAttribute('aria-current','location');else entry.link.removeAttribute('aria-current');}
}
function applyFilters(){
  const terms=normalize($('feature-search').value).trim().split(/\s+/).filter(Boolean);
  const filter=document.querySelector('input[name="coverage-filter"]:checked')?.value||'all';let shown=0;
  for(const entry of entries){
    const status=entry.feature.better?.status;
    const matches=terms.every(term=>entry.search.includes(term))&&(filter==='all'||(filter==='gaps'&&gapStatuses.has(status))||(filter==='native'&&status==='native'));
    entry.article.hidden=entry.link.hidden=!matches;if(matches)shown++;
  }
  $('result-count').textContent=`${shown} de ${entries.length} funciones`;
  $('empty-state').hidden=shown!==0;
}
function clearFilters(){
  $('feature-search').value='';document.querySelector('input[name="coverage-filter"][value="all"]').checked=true;applyFilters();
}
function followHash(){
  const id=location.hash.slice(1),entry=entries.find(item=>item.feature.id===id);
  if(!entry)return;if(entry.article.hidden)clearFilters();markActive(id);
  requestAnimationFrame(()=>entry.article.scrollIntoView({block:'start',behavior:'auto'}));
}
function validateCatalog(catalog){
  if(catalog?.schema_version!=='1.0'||!Array.isArray(catalog.features)||!catalog.features.length)throw new Error('El catálogo no contiene una lista válida de funcionalidades.');
  const ids=new Set();
  for(const feature of catalog.features){
    if(!feature||!/^\d{2,}$/.test(text(feature.number))||feature.id!==`XP-F${feature.number}`||ids.has(feature.id)||!text(feature.title).trim())throw new Error('El catálogo contiene una entrada incompleta o repetida.');
    ids.add(feature.id);
  }
  return catalog;
}
async function loadCatalog(){
  if(loading)return;loading=true;
  $('load-error').hidden=true;$('load-state').hidden=false;$('empty-state').hidden=true;$('result-count').textContent='Cargando…';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(CATALOG_URL,{cache:'no-cache',signal:controller.signal});
    if(!response.ok)throw new Error(`El catálogo de origen respondió con HTTP ${response.status}.`);
    const catalog=validateCatalog(await response.json()),commit=sourceCommit(catalog);
    $('feature-list').replaceChildren();$('feature-nav').replaceChildren();
    entries=catalog.features.map(feature=>{
      const article=renderFeature(feature,commit),link=node('a','',`${feature.number}.- ${feature.title}`);link.href=`#${feature.id}`;
      link.addEventListener('click',()=>{markActive(feature.id);if(matchMedia('(max-width:720px)').matches)$('feature-index').open=false;});
      $('feature-list').append(article);$('feature-nav').append(link);
      return {feature,article,link,search:normalize(JSON.stringify(feature))};
    });
    $('total-count').textContent=String(entries.length);
    const gaps=entries.filter(entry=>gapStatuses.has(entry.feature.better?.status)).length;
    $('gap-count').textContent=String(gaps);
    $('native-count').textContent=String(entries.filter(entry=>entry.feature.better?.status==='native').length);
    $('coverage-note').textContent=`${gaps} funciones con huecos en Better no equivale a ${gaps} funciones totalmente ausentes: incluye integraciones parciales, representación sin controles y funciones fuera de esta vista.`;
    $('numbering-note').textContent=text(catalog.numbering?.policy)||'Los números y los ID son estables: buscar o filtrar no los cambia.';
    const updated=text(catalog.updated_at);$('catalog-version').textContent=`Catálogo v${catalog.schema_version}${updated?` · Actualizado ${updated}`:''}`;
    $('catalog-source').replaceChildren();
    if(commit){
      const link=node('a','',commit.slice(0,12));link.href=`https://github.com/csilvasantin/xpaceos/tree/${commit}`;link.title=commit;
      $('catalog-source').append('Código auditado: ',link,'. Las líneas de evidencia corresponden a este commit, no a HEAD.');
      if(text(catalog.audit?.baseline_note))$('catalog-source').append(' ',text(catalog.audit.baseline_note));
    }else $('catalog-source').textContent='No se ha indicado un commit válido. Las referencias de código no están ancladas a una revisión verificable.';
    $('feature-search').disabled=false;$('feature-filters').disabled=false;$('load-state').hidden=true;
    applyFilters();followHash();
  }catch(error){
    $('load-state').hidden=true;$('load-error').hidden=false;$('result-count').textContent='Catálogo no disponible';
    $('load-error-detail').textContent=error.name==='AbortError'?'El catálogo no ha respondido a tiempo. Reintenta o consulta el archivo de origen.':error instanceof SyntaxError?'El archivo recibido no contiene JSON válido. No se muestran estados estimados.':error.message||'No se pudo leer el catálogo. No se muestran estados estimados.';
    $('catalog-version').textContent='Fuente: mcp/funcionalidades.json · sin cargar';
  }finally{clearTimeout(timeout);loading=false;}
}
$('feature-search').addEventListener('input',applyFilters);
$('feature-filters').addEventListener('change',applyFilters);
$('clear-search').addEventListener('click',()=>{clearFilters();$('feature-search').focus();});
$('retry-load').addEventListener('click',loadCatalog);
window.addEventListener('hashchange',followHash);
if(matchMedia('(max-width:720px)').matches)$('feature-index').open=false;
void loadCatalog();
