// /inventario idIoT — el CLI de Experto enseña el nombre único de cada elemento IoT (ver idiot.mjs).
// Una sola fuente por Xpacio, siempre la misma, para que un idIoT no nombre dos cosas distintas según desde dónde
// se pregunte: (1) Starbucks Pg. Gràcia 103 → su registro del gemelo (pared, TPV, iPad, altavoz);
// (2) cualquier otro Xpacio del catálogo → sus superficies; (3) una escena de demostración sin Xpacio del
// catálogo → el IoT colocado en su inventario local.
import {buildIdIot,buildTwinOnly,twinElements,parseIdIotCommand,selectRows,formatIdIot,formatProjects,toCsv,iotType,IDIOT_HELP} from './idiot.mjs?v=idiot-1';
export const CATALOG_URL='https://api.admira.store/da/locations';
export const STARBUCKS_LOCATION='alsea-sbux-021';
const here=file=>new URL(file,import.meta.url).href;

/** Registro IoT del Starbucks de Pg. Gràcia 103: las mismas fichas que Inventario/ITIL lista como IoT. */
export async function starbucksRegistry(load=file=>import(here(file))){
 const [wall,tpv,ipad,manifest]=await Promise.all([load('../admira-xp/scripts/starbucks-screens.mjs'),load('../admira-xp/scripts/starbucks-tpv.mjs'),load('../admira-xp/scripts/starbucks-ipad.mjs'),fetchJson(here('./starbucks/manifest.json'))]);
 const numbers=wall.STARBUCKS_SCREEN_PLAYLIST?.display?.screenNumbersById||{},codes=new Map((manifest?.units||[]).map(u=>[u.instance_id,u.itil_code]));
 const device=(p,type,name)=>({type,name:name||String(p.name||p.id),instance:String(p.id),code:codes.get(p.id)||'',player:String(p.playerId||''),number:numbers[p.id]||0,source:'gemelo'});
 return [
  ...wall.STARBUCKS_WALL_MAPPING.players.map(p=>device(p,'Pantalla','Pared de pantallas · '+(numbers[p.id]||p.name))).sort((a,b)=>a.number-b.number),
  ...tpv.STARBUCKS_TPV_MAPPING.players.map(p=>device(p,'TPV')),
  ...ipad.STARBUCKS_IPAD_MAPPING.players.map(p=>device(p,'iPad')),
  {type:'Altavoz',name:'Altavoz · hilo musical',instance:'starbucks-alsea-paseo-de-gracia',code:'',player:'',number:0,source:'gemelo'}
 ];
}
async function fetchJson(url,fetcher=globalThis.fetch){
 if(url.startsWith('file:')){const fs=await import('node:fs');return JSON.parse(fs.readFileSync(new URL(url),'utf8'));}
 const r=await fetcher(url,{cache:'force-cache'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();
}
let memo=null;
/** Catálogo de Xpacios (9 MB): una descarga por sesión, 10 min de vigencia. */
export async function loadNetwork({fetcher=globalThis.fetch,now=Date.now(),force=false}={}){
 if(!force&&memo&&now-memo.at<600_000)return memo.data;
 const [catalog,projects]=await Promise.all([fetcher(CATALOG_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}),fetchJson(here('../admira-xp/scripts/project-catalog.json'),fetcher)]);
 const data={locations:Array.isArray(catalog?.locations)?catalog.locations:[],projects:projects?.projects||[]};
 memo={at:now,data};return data;
}
export function resetNetworkCache(){memo=null;}

/**
 * ctx: {lang, twin:{space,project,projectLabel,locationId,name,addr,rows}, filter(locations), network(), registry(), download(name,text)}
 * `twin.rows` son las filas de Inventario/ITIL del Xpacio abierto; `filter` aplica el cliente activo (/marca).
 */
export async function executeIdIotCommand(raw,ctx={}){
 const cmd=parseIdIotCommand(raw);if(!cmd)return null;
 const lang=ctx.lang==='en'?'en':'es',en=lang==='en',result=(ok,message)=>({ok,local:true,kind:'inventory',message});
 if(cmd.scope==='help')return result(true,'INVENTARIO · idIoT\n'+IDIOT_HELP[lang]);
 const twin=ctx.twin||{},linked=!!twin.locationId;
 const deliver=(rows,title,text)=>{
  if(cmd.csv){
   if(!rows.length)return result(false,formatIdIot(rows,{lang,title}));
   const name='idIoT-'+String(title||'red').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.csv';
   try{ctx.download?.(name,toCsv(rows));}catch{return result(false,en?'The CSV could not be downloaded.':'No se pudo descargar el CSV.');}
   return result(true,`INVENTARIO · idIoT · ${title} · ${rows.length} ${en?'IoT elements exported to':'elementos IoT exportados a'} ${name}`);
  }
  return result(true,text??formatIdIot(rows,{lang,title}));
 };
 // Escena de demostración: no está en el catálogo, sólo existe su inventario local.
 if(cmd.scope==='here'&&!linked){
  const rows=buildTwinOnly({projectId:twin.project||'demo',projectLabel:twin.projectLabel||twin.project||'Demo',xpaceId:'',xpaceName:twin.name||'Demo',addr:twin.addr||'',elements:twinElements(twin.rows||[])});
  const note=en?'\nDemo scene: it is not an Xpace of the central registry, so these names live only in this inventory.':'\nEscena de demostración: no es un Xpacio del catálogo central, así que estos nombres sólo existen en este inventario.';
  return deliver(rows,(twin.projectLabel||'Demo')+' › '+(twin.name||'Demo'),cmd.csv?undefined:formatIdIot(rows,{lang,title:(twin.projectLabel||'Demo')+' › '+(twin.name||'Demo')})+note);
 }
 let network,registry;
 try{[network,registry]=await Promise.all([(ctx.network||loadNetwork)(),(ctx.registry||starbucksRegistry)().catch(()=>null)]);}
 catch{return result(false,en?'The Xpace registry could not be loaded. Check the connection and retry.':'No se pudo cargar el catálogo de Xpacios. Comprueba la conexión y reintenta.');}
 const locations=typeof ctx.filter==='function'?ctx.filter(network.locations):network.locations;
 const all=buildIdIot({locations,projects:network.projects,twin:registry?{locationId:STARBUCKS_LOCATION,elements:registry}:null});
 if(cmd.scope==='projects')return deliver(all,en?'network':'red',cmd.csv?undefined:formatProjects(all,{lang}));
 if(cmd.scope==='all')return deliver(all,en?'network':'red');
 if(cmd.scope==='here'){
  const rows=all.filter(r=>r.xpaceId===twin.locationId);
  if(!rows.length)return result(false,(en?'This Xpace is not in the central registry: ':'Este Xpacio no está en el catálogo central: ')+twin.locationId);
  return deliver(rows,rows[0].project+' › '+rows[0].xpaceName);
 }
 const found=selectRows(all,cmd.query,network.projects);
 return deliver(found.rows,found.label);
}
export {iotType};

const DEMO_NAMES={xtanco:['Estancos','Gran de Gràcia'],supermercado:['Supermercado','Demo'],cafeteria:['Cafetería','Demo'],cafebreria:['Cafebrería','Demo'],creator:['Xpace Creator','Demo'],shoptalk:['Shoptalk','Demo']};
/**
 * Entrada del gemelo: resuelve qué Xpacio está abierto y delega. `source` es XpaceInventorySource.read();
 * `storeCfg` la ficha del Xpacio cargada por ?loc=; `starbucks` si la escena es el Starbucks de Pg. Gràcia 103.
 */
export async function runIdIot(raw,{lang,source,storeCfg,starbucks=false,filter,download,network,registry,loadAssets}={}){
 const cmd=parseIdIotCommand(raw);if(!cmd)return null;
 const space=String(source?.space||''),locationId=starbucks?STARBUCKS_LOCATION:/^xtanco_.+/.test(space)?space.slice(7):String(storeCfg?.id||'');
 const twin={space,project:source?.project||space,locationId,name:storeCfg?.name||'',addr:storeCfg?.addr||'',rows:[]};
 if(!locationId&&cmd.scope==='here'){
  const [label,name]=DEMO_NAMES[space]||[space||'Demo','Demo'];twin.projectLabel=label;twin.name=name;
  try{
   const [{inventoryRows},model]=await Promise.all([import(here('./workspace-model.mjs')),loadAssets?null:import(here('./model.mjs'))]);
   const {assets}=await (loadAssets||model.loadCatalog)();
   twin.rows=inventoryRows({space,layout:source?.layout||[],removed:source?.removed||{},assets});
  }catch{return {ok:false,local:true,kind:'inventory',message:lang==='en'?'The local inventory could not be loaded. Reload the Xperience and retry.':'No se pudo cargar el inventario local. Recarga la Xperience y reintenta.'};}
 }
 return executeIdIotCommand(raw,{lang,twin,filter,download,network,registry});
}
