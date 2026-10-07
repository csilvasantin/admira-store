// idIoT · nombre único de cada elemento IoT dado de alta en un Xpacio de un Proyecto (Carlos, 7-oct-2026).
//   Proyecto_Xpacio_Tipo_n  →  Starbucks_PaseodeGracia_103_Pantalla_1
// El prefijo agrupa: «Starbucks_» es el proyecto, «Starbucks_PaseodeGracia_103_» el Xpacio. El nombre se DERIVA
// (no se guarda todavía en el catálogo central): mismo catálogo → mismo nombre, en cualquier navegador.
// Módulo puro: lo usan el CLI del gemelo (/inventario idIoT) y cualquier agente que lo importe.
const plain=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'');
const fold=s=>plain(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/** Un tramo del nombre: sin tildes, sin espacios ni signos, primera letra en mayúscula («Paseo de Gracia» → PaseodeGracia). */
export function idPart(text){const s=plain(text).replace(/[^A-Za-z0-9]+/g,'');return s?s[0].toUpperCase()+s.slice(1):'';}

// Tipo del elemento. Tres orígenes: el modelo del inventario del gemelo, el dispositivo virtual de la escena y la
// superficie del catálogo de Xpacios.
const MODEL_TYPE={led:'LED',tft:'Pantalla',metahuman:'Mupi',tablet:'Tablet',aroma:'Aroma',djBooth:'Audio',turnKiosk:'Turnos',ipadLandscape:'iPad'};
const SURFACE_TYPE={pantalla:'Pantalla',escaparate:'Escaparate',pudo:'Taquilla',mostrador:'Mostrador',pwa:'PWA',atm:'Cajero',audio:'Audio',vending:'Vending',robot:'Robot'};
export function iotType({model,surface,id,name}={}){
 if(model&&MODEL_TYPE[model])return MODEL_TYPE[model];
 const k=fold(id)+' '+fold(name);
 if(/\b(altavoz|altavoces|speaker)\b/.test(k))return 'Altavoz';
 if(surface&&/\baudio\b/.test(k))return 'Audio';
 if(surface&&/\btotem\b/.test(k))return 'Totem';
 if(surface&&SURFACE_TYPE[String(surface).toLowerCase()])return SURFACE_TYPE[String(surface).toLowerCase()];
 if(/\b(tpv|pos)\b/.test(k))return 'TPV';
 if(/\bipad\b/.test(k))return 'iPad';
 if(/\b(totem|kiosk|kiosko|quiosco)\b/.test(k))return 'Totem';
 if(/\b(camara|camera|cam)\b/.test(k))return 'Camara';
 if(/\b(wall|pantalla|screen|mupi|tft|led)\b/.test(k))return 'Pantalla';
 return 'Dispositivo';
}

// Proyectos que el catálogo del gemelo aún no lista pero la parrilla de admira.tv sí.
const EXTRA_PROJECTS=[{id:'altadis',circuit:'altadis_bcn',label:'Altadis',aliases:[]}];
/** Proyecto de un Xpacio del catálogo: por circuito, por su id o alias, por su marca; si nada lo dice, «Sin proyecto». */
export function projectOf(location,projects=[]){
 const all=[...projects,...EXTRA_PROJECTS],circuit=String(location?.circuit||''),tokens=String(location?.id||'').toLowerCase().split('-').slice(0,2);
 const named=t=>all.find(p=>p.id===t||fold(p.label).replace(/ /g,'')===t||(p.aliases||[]).some(a=>fold(a)===t));
 const hit=all.find(p=>circuit&&p.circuit===circuit)||named(tokens[0])||named(tokens[1]||'');
 if(hit)return {id:hit.id,label:hit.label,circuit:hit.circuit||''};
 const brand=String(location?.external?.brand||location?.client||'').trim();
 if(brand)return {id:fold(brand).replace(/ /g,'-'),label:brand,circuit};
 if(/circuito (?:demo )?admira/i.test(String(location?.kind||'')))return {id:'admiranext',label:'AdmiraNeXT',circuit};
 return {id:'sin-proyecto',label:'SinProyecto',circuit};
}

// Tramo del Xpacio. Primero la dirección (calle + número, que es como se nombra un centro: «Paseo de Gracia 103»);
// si la ficha no trae calle, su nombre sin la marca; y si tampoco, su id del catálogo.
const NUM=/^(\D{3,}?)[\s,]+(?:n[ºo°.]?\s*)?(\d{1,4}[A-Za-z]?)(?=$|[\s,])/;
const calm=t=>/[a-z]/.test(t)?t:String(t).toLowerCase().replace(/(^|[^a-zà-ÿ])([a-zà-ÿ])/g,(m,a,b)=>a+b.toUpperCase());
function withoutWords(text,words){const drop=new Set(words.flatMap(w=>fold(w).split(' ')).filter(Boolean));return String(text||'').split(/\s+/).filter(w=>!drop.has(fold(w))).join(' ');}
const STREET=/^(?:c\/|calle|carrer|av\.?|avda\.?|avenida|avinguda|paseo|passeig|pg\.?|plaza|plaça|pl\.?|rambla|ronda|v[ií]a|gran v[ií]a|camino|cam[ií]|travessera|carretera|ctra\.?|boulevard|blvd|rue|street|road)(?:\s|$)/i;
const GENERIC=/^(?:espana|mexico|spain|store|oficina|office|tienda|shop|postbox)*$/i;
export function xpaceLabel(location={},projectLabel=''){
 const street=calm(String(location.addr||'').split('·')[0].trim()),m=NUM.exec(street);
 if(m&&idPart(m[1]))return idPart(m[1])+'_'+m[2].toUpperCase();
 const name=withoutWords(calm(String(location.name||'').replace(/\s*·\s*/g,' ').trim()),[projectLabel]),nm=NUM.exec(name);
 if(nm&&idPart(nm[1]))return idPart(nm[1])+'_'+nm[2].toUpperCase();
 if(STREET.test(street)&&idPart(street))return idPart(street);
 const own=idPart(name);
 if(own&&!GENERIC.test(own))return own;
 return idTail(location.id,projectLabel)||own||idPart(location.id)||'Xpacio';
}
// Lo que distingue a un Xpacio dentro de su proyecto: los números de su id del catálogo; si no tiene, el resto del id.
function idTail(id,projectLabel){const drop=new Set(fold(projectLabel).split(' ')),t=String(id||'').split(/[^A-Za-z0-9]+/).filter(x=>x&&!drop.has(x.toLowerCase())),nums=t.filter(x=>/^\d+$/.test(x));return (nums.length?nums:t).map(idPart).join('');}

/** Tramos únicos de TODOS los Xpacios de un proyecto: si dos centros se llaman igual, se les añade su id del catálogo. */
export function uniqueXpaceLabels(locations,projectLabel=''){
 const labels=new Map(),count=new Map();
 for(const l of locations){const label=xpaceLabel(l,projectLabel);labels.set(l.id,label);count.set(label,(count.get(label)||0)+1);}
 const used=new Set();
 for(const l of locations){
  let label=labels.get(l.id);
  if(count.get(label)>1){const tail=idTail(l.id,projectLabel)||idPart(l.id);label=label===tail?label:label+'_'+tail;}
  for(let i=2;used.has(label);i+=1)label=labels.get(l.id)+'_'+(idTail(l.id,projectLabel)||idPart(l.id))+'_'+i;
  used.add(label);labels.set(l.id,label);
 }
 return labels;
}

/** Numera los elementos de UN Xpacio por tipo. El número declarado (pantalla 6 de la pared) manda sobre el orden. */
export function nameElements(projectLabel,xpace,elements){
 const prefix=idPart(projectLabel)+'_'+xpace,used=new Map(),n=new Array(elements.length).fill(0);
 const of=type=>{if(!used.has(type))used.set(type,new Set());return used.get(type);};
 elements.forEach((e,i)=>{const d=Number.isInteger(e.number)&&e.number>0?e.number:0;if(d&&!of(e.type).has(d)){of(e.type).add(d);n[i]=d;}});
 elements.forEach((e,i)=>{if(n[i])return;let k=1;while(of(e.type).has(k))k+=1;of(e.type).add(k);n[i]=k;});
 return elements.map((e,i)=>({...e,n:n[i],idIoT:prefix+'_'+e.type+'_'+n[i]}));
}

/** Elementos IoT de un Xpacio del catálogo central: una fila por superficie dada de alta. */
export function catalogElements(location){
 return (Array.isArray(location?.surfaces)?location.surfaces:[]).filter(Boolean).map(s=>({type:iotType({surface:s.surface,name:s.name}),name:String(s.name||s.surface||''),player:String(s.screen||''),status:String(s.status||''),source:'catalogo'}));
}
/** Elementos IoT del inventario del gemelo abierto: filas de Inventario/ITIL cuya categoría es IoT. */
export function twinElements(rows,{numbers={}}={}){
 return rows.filter(r=>r&&!r.retired&&(r.category==='IoT'||r.asset?.category==='IoT')).map(r=>({type:iotType({model:r.asset?.type||r.item?.type,id:r.id,name:r.name}),name:String(r.name||r.id),instance:String(r.id),code:String(r.code||''),player:String(r.playerId||''),number:numbers[r.id]||0,virtual:!!r.virtual,source:'gemelo'}));
}

/**
 * Toda la red: Proyecto → Xpacio → elemento IoT. `twin` sustituye, en su Xpacio, las superficies genéricas del
 * catálogo por el inventario real del gemelo ({locationId, elements}).
 */
export function buildIdIot({locations=[],projects=[],twin=null}={}){
 const groups=new Map();
 for(const l of locations){if(!l||!l.id)continue;const p=projectOf(l,projects);if(!groups.has(p.id))groups.set(p.id,{project:p,locations:[]});groups.get(p.id).locations.push(l);}
 const rows=[];
 for(const {project,locations:list} of groups.values()){
  const labels=uniqueXpaceLabels(list,project.label);
  for(const l of list){
   const own=twin&&twin.locationId===l.id?twin.elements:catalogElements(l);
   for(const e of nameElements(project.label,labels.get(l.id),own))rows.push({...e,projectId:project.id,project:project.label,xpaceId:String(l.id),xpaceName:String(l.name||l.id),addr:String(l.addr||'')});
  }
 }
 return rows;
}
/** El Xpacio abierto en el gemelo cuando no está en el catálogo (escena de demostración). */
export function buildTwinOnly({projectId,projectLabel,xpaceId='',xpaceName='',addr='',elements=[]}){
 const label=xpaceLabel({id:xpaceId||xpaceName,name:xpaceName,addr},projectLabel);
 return nameElements(projectLabel,label,elements).map(e=>({...e,projectId,project:projectLabel,xpaceId,xpaceName,addr}));
}

export function parseIdIotCommand(raw){
 const m=/^\/?(?:inventario|inventory)(?:@\w+)?\s+id[\s_-]?iot\b\s*(.*)$/i.exec(String(raw||'').trim());
 if(!m)return null;
 let rest=m[1].trim(),csv=false;
 if(/(?:^|\s)csv$/i.test(rest)){csv=true;rest=rest.replace(/(?:^|\s)csv$/i,'').trim();}
 if(!rest)return {scope:'here',csv};
 if(/^(?:proyectos|projects|resumen|summary)$/i.test(rest))return {scope:'projects',csv};
 if(/^(?:todo|todos|all|red|network)$/i.test(rest))return {scope:'all',csv};
 if(/^(?:ayuda|help|\?)$/i.test(rest))return {scope:'help',csv:false};
 return {scope:'query',query:rest.slice(0,80),csv};
}
/** Filtra por proyecto (id, nombre, alias o circuito), por id de Xpacio o por texto dentro del idIoT. */
export function selectRows(rows,query,projects=[]){
 const q=fold(query),compact=q.replace(/ /g,'');
 const project=projects.find(p=>[p.id,p.label,p.circuit,...(p.aliases||[])].some(v=>fold(v)===q));
 if(project)return {kind:'project',label:project.label,rows:rows.filter(r=>r.projectId===project.id)};
 const byProject=rows.filter(r=>fold(r.projectId)===q||fold(r.project)===q);
 if(byProject.length)return {kind:'project',label:byProject[0].project,rows:byProject};
 const byXpace=rows.filter(r=>r.xpaceId.toLowerCase()===String(query).trim().toLowerCase());
 if(byXpace.length)return {kind:'xpace',label:byXpace[0].xpaceName,rows:byXpace};
 return {kind:'text',label:query,rows:rows.filter(r=>fold(r.idIoT).replace(/ /g,'').includes(compact)||fold(r.xpaceName+' '+r.addr).includes(q))};
}

export const IDIOT_HELP={
 es:'idIoT · nombre único de cada elemento IoT: Proyecto_Xpacio_Tipo_n. /inventario idIoT (este Xpacio) · /inventario idIoT starbucks (un proyecto, o un id de Xpacio, o un texto) · /inventario idIoT proyectos (resumen de la red) · añade «csv» al final para descargar la lista completa.',
 en:'idIoT · unique name of every IoT element: Project_Xpace_Type_n. /inventario idIoT (this Xpace) · /inventario idIoT starbucks (a project, an Xpace id or any text) · /inventario idIoT proyectos (network summary) · append "csv" to download the full list.'
};
const detail=(r,en)=>[r.name,r.code,r.player?(en?'player ':'player ')+r.player:(en?'no player bound':'sin player vinculado')].filter(Boolean).join(' · ');
/** Texto para el CLI: agrupado por Xpacio, con tope de líneas para que quepa en la consola. */
export function formatIdIot(rows,{lang='es',title='',limit=60}={}){
 const en=lang==='en',xpaces=new Set(rows.map(r=>r.projectId+'|'+r.xpaceId)).size;
 const head=`INVENTARIO · idIoT · ${title||(en?'network':'red')} · ${rows.length} ${en?'IoT elements':'elementos IoT'} · ${xpaces} ${en?(xpaces===1?'Xpace':'Xpaces'):(xpaces===1?'Xpacio':'Xpacios')}`;
 if(!rows.length)return head+'\n'+(en?'No registered IoT element matches. ':'Ningún elemento IoT dado de alta coincide. ')+IDIOT_HELP[en?'en':'es'];
 const lines=[head];let last='',shown=0;
 for(const r of rows){
  if(shown>=limit)break;
  const key=r.projectId+'|'+r.xpaceId;
  if(key!==last){lines.push(`▸ ${r.project} › ${r.xpaceName}${r.addr?' · '+r.addr.split('·')[0].trim():''}${r.xpaceId?' · xpacio:'+r.xpaceId:''}`);last=key;}
  lines.push('  '+r.idIoT+' — '+detail(r,en));shown+=1;
 }
 if(rows.length>shown)lines.push(en?`… and ${rows.length-shown} more. Narrow the search or append "csv" to download them all.`:`… y ${rows.length-shown} más. Afina la búsqueda o añade «csv» para descargarlos todos.`);
 return lines.join('\n');
}
export function formatProjects(rows,{lang='es',limit=40}={}){
 const en=lang==='en',by=new Map();
 for(const r of rows){if(!by.has(r.projectId))by.set(r.projectId,{label:r.project,xpaces:new Set(),n:0,prefix:r.idIoT.split('_')[0]});const g=by.get(r.projectId);g.xpaces.add(r.xpaceId);g.n+=1;}
 const list=[...by.entries()].sort((a,b)=>b[1].n-a[1].n);
 const lines=[`INVENTARIO · idIoT · ${list.length} ${en?'projects':'proyectos'} · ${rows.length} ${en?'IoT elements':'elementos IoT'}`];
 for(const [id,g] of list.slice(0,limit))lines.push(`${g.prefix}_ — ${g.label} · ${g.xpaces.size} ${en?'Xpaces':'Xpacios'} · ${g.n} ${en?'elements':'elementos'} · /inventario idIoT ${id}`);
 if(list.length>limit)lines.push(en?`… and ${list.length-limit} more projects.`:`… y ${list.length-limit} proyectos más.`);
 return lines.join('\n');
}
const cell=v=>{const s=String(v==null?'':v);return /[",;\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
export function toCsv(rows){
 const cols=['idIoT','project','xpaceName','addr','xpaceId','type','n','name','code','player','source'];
 return [cols.join(';'),...rows.map(r=>cols.map(c=>cell(r[c])).join(';'))].join('\n')+'\n';
}
