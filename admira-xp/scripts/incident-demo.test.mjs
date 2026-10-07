import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {describeOpen,screenLabel,PHOTO_KEY,parseIncidentCommand,CAUSES,pick,runIncidentDemo,REPORT_TO} from './incident-demo.mjs';
test('parsea /crear incidencia, /cerrar incidencia [id] y sus alias en inglés',()=>{
 assert.deepEqual(parseIncidentCommand('/crear incidencia'),{action:'create',id:''});assert.deepEqual(parseIncidentCommand('/create incident'),{action:'create',id:''});
 assert.deepEqual(parseIncidentCommand('/cerrar incidencia inc-ab12cd'),{action:'close',id:'INC-AB12CD'});assert.deepEqual(parseIncidentCommand('/close incident'),{action:'close',id:''});
 assert.equal(parseIncidentCommand('/cerrar tienda'),null);assert.equal(parseIncidentCommand('/crear incidencia ; rm'),null);
});
test('15 motivos con gravedad válida y nota de cierre en ES/EN',()=>{assert.ok(CAUSES.length>=15);for(const c of CAUSES){assert.ok(['urgente','alta','normal','baja'].includes(c.sev));for(const k of ['es','en','fix_es','fix_en'])assert.ok(c[k].length>10);}assert.equal(pick([1,2,3],()=>0.99),3);});
test('crea en una candidata al azar y cierra la última de la CLI enviando el informe',async()=>{
 const stages=new Map(),store=new Map(),mem={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},calls=[];
 globalThis.XpaceMatrixOptions={isActive:()=>true,incidentDemo:{candidates:()=>['starbucks-wall-02','starbucks-wall-04'],focus:async()=>true,name:id=>id,stage:id=>stages.get(id),
  open:async o=>{calls.push(['open',o.deviceId,o.severity]);stages.set('INC-CLI001','abierta');return {id:'INC-CLI001'};},close:async o=>{calls.push(['close',o.id,o.note]);stages.set(o.id,'cerrada');return {inc:{id:o.id,stage:'cerrada',resolution:o.note}};}}};
 const created=await runIncidentDemo('/crear incidencia',{store:mem,rnd:()=>0.6});assert.match(created.message,/INC-CLI001 · starbucks-wall-04/);
 const fetcher=async(url,opt)=>{calls.push(['report',url,JSON.parse(opt.body).id]);return {ok:true,status:200,json:async()=>({ok:true,sent:true,message_id:'<m@admira.live>',telegram:{sent:true,message_id:42},pages:3,ai:'meta/llama'})};};
 const closed=await runIncidentDemo('/cerrar incidencia',{store:mem,fetcher});assert.match(closed.message,/INC-CLI001 cerrada/);assert.match(closed.message,new RegExp('Informe enviado a '+REPORT_TO));assert.match(closed.message,/📨 PDF también en tu Telegram · #42 · 3 págs\. · IA/);
 assert.deepEqual(calls.at(-1),['report','https://data.yokup.com/api/demo/incident-report','INC-CLI001']);
 assert.match((await runIncidentDemo('/cerrar incidencia',{store:mem,fetcher})).message,/No hay incidencias abiertas en las pantallas del gemelo/);
 delete globalThis.XpaceMatrixOptions;
});
test('cableado: CLI, ayuda, panel (nunca la pantalla 1, sólo tickets de la CLI), cámara y documentación',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),panel=fs.readFileSync(new URL('./starbucks-incidents.mjs',import.meta.url),'utf8'),pano=fs.readFileSync(new URL('./matrix-panorama.mjs',import.meta.url),'utf8');
 assert.match(html,/\['crear','create','cerrar','close'\]\.includes\(cmd\)/);assert.match(html,/incident-demo\.mjs\?v=cli-incidencia-4/);assert.match(html,/'\/crear incidencia','\/cerrar incidencia'/);
 assert.match(panel,/\/\^pantalla-\[2-6\]\$\//);assert.match(panel,/:manual:cli-/);assert.match(panel,/uuid:'cli-'\+uuid/);assert.match(pano,/function focusScreen\(id/);assert.match(pano,/incidentDemo:\{/);
 assert.match(fs.readFileSync(new URL('../help.html',import.meta.url),'utf8'),/id="incident-cli-demo"/);assert.ok(JSON.parse(fs.readFileSync(new URL('../../mcp/funcionalidades.json',import.meta.url),'utf8')).incident_cli_demo);
});
test('r47: ficha modal en la capa superior, menú ☰ plegado durante la demo y el CLI no borra lo que se escribe',async()=>{
 const panel=fs.readFileSync(new URL('./starbucks-incidents.mjs',import.meta.url),'utf8'),css=fs.readFileSync(new URL('./matrix-panorama.css',import.meta.url),'utf8'),html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(panel,/createElement\('dialog'\)/);assert.match(panel,/ficha\.showModal\(\)/);assert.match(panel,/close\(o\)\{return demoClose\(o\)\.finally\(closeFicha\);\}/);assert.match(panel,/await wait\(hold\)/);assert.match(panel,/hold=3000/);
 assert.match(css,/dialog\.matrix-ficha\{position:fixed;inset:64px 16px auto auto/);
 const a=html.indexOf('async function sendComposerText('),b=html.indexOf('function bindDockButton(',a),body=html.slice(a,b);
 assert.equal((body.match(/composer\.value='';/g)||[]).length,(body.match(/composer\.value\.trim\(\)===clean/g)||[]).length);
 const {collapseLeftMenu}=await import('./incident-demo.mjs');let collapsed=false,clicks=0;
 const panelEl={classList:{contains:c=>c==='is-collapsed'&&collapsed}},btn={click(){clicks++;collapsed=!collapsed;}};
 const doc={querySelector:s=>!collapsed&&s==='.quad-left:not(.is-collapsed)'?panelEl:null,getElementById:id=>id==='pfOptions'?btn:null};
 const restore=collapseLeftMenu(doc);assert.equal(collapsed,true);restore();assert.equal(collapsed,false);assert.equal(clicks,2);
 collapsed=true;clicks=0;collapseLeftMenu(doc)();assert.equal(clicks,0);
});
// r48 (Carlos 21:39): el informe va con la marca blanca del cliente y fotos de la pantalla (abierta / cerrada).
test('informe con marca del recurso, foto de apertura guardada y fotos/marca en el mensaje',async()=>{
 const {brandIdFor,captureIncidentPhoto,brandLogoJpeg}=await import('./incident-snapshot.mjs?v=cli-incidencia-3');
 assert.equal(brandIdFor('','demo:starbucks-alsea-paseo-de-gracia:pantalla-5:manual:cli-x'),'starbucks');assert.equal(brandIdFor('lumbre','demo:starbucks-x:p'),'lumbre');assert.equal(brandIdFor('admira','demo:frescaria-a:p'),'frescaria');
 assert.equal(await captureIncidentPhoto({snapshot:()=>null},'x',{doc:null}),null);assert.equal(await brandLogoJpeg('starbucks',{doc:null}),null);
 const store=new Map([[PHOTO_KEY,JSON.stringify({'INC-CLI002':{src:'data:image/jpeg;base64,AAA',at:5}})],['xpaceos.starbucks.cli-incidents.v1',JSON.stringify([{id:'INC-CLI002',deviceId:'starbucks-wall-03',cause:0,steps:[]}])]]),mem={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};let body=null;
 globalThis.XpaceMatrixOptions={isActive:()=>true,incidentDemo:{candidates:()=>[],focus:async()=>true,name:id=>id,stage:()=>'abierta',close:async o=>({inc:{id:o.id,stage:'cerrada',resolution:o.note,resource:'demo:starbucks-alsea-paseo-de-gracia:pantalla-3:manual:cli-y'}})}};
 const fetcher=async(url,opt)=>{body=JSON.parse(opt.body);return {ok:true,status:200,json:async()=>({ok:true,sent:true,message_id:'<m@admira.live>',telegram:{sent:true,message_id:7},pages:3,ai:'meta/llama',photos:2,brand:'starbucks'})};};
 const r=await runIncidentDemo('/cerrar incidencia',{store:mem,fetcher});
 assert.equal(body.marca,'starbucks');assert.equal(body.photos.open,'data:image/jpeg;base64,AAA');assert.equal(body.photos.open_at,5);assert.match(r.message,/3 págs\. · IA · 2 fotos · marca starbucks/);
 assert.equal(JSON.parse(store.get(PHOTO_KEY))['INC-CLI002'],undefined,'la foto se borra tras el informe');
 delete globalThis.XpaceMatrixOptions;
});
// r53 (Carlos 23:06): «¿cómo me dices que no hay incidencias si se ve en la pantalla?»
test('sin id ni incidencias de la CLI lista TODAS las abiertas del gemelo; con id cierra también una manual; 409 del portal explicado',async()=>{
 const cf={id:'INC-CFHI7Z',priority:'urgente',assignee:'Sofía P.',created_at:Date.parse('2026-10-07T16:50:00Z'),equipo:'pantalla-1',deviceId:'starbucks-wall-01',via:'manual',stage:'abierta'};
 assert.equal(describeOpen([cf]),'Hay 1 incidencia abierta en pantalla 1: INC-CFHI7Z (urgente, abierta manualmente a las 18:50, técnico Sofía P.). No la abrió la CLI; para cerrarla escribe /cerrar incidencia INC-CFHI7Z');
 assert.match(describeOpen([cf],{en:true}),/^There is 1 open incident on screen 1: INC-CFHI7Z \(urgent, opened manually at 18:50, technician Sofía P\.\)\. The CLI did not open it; to close it type \/close incident INC-CFHI7Z$/);
 const two=describeOpen([cf,{...cf,id:'INC-TEST01',equipo:'pantalla-4',priority:'alta',created_at:Date.now()-600000}]);assert.match(two,/^Hay 2 incidencias abiertas/);assert.match(two,/• pantalla 4 · INC-TEST01 · alta · hace 10 min/);assert.match(two,/\/cerrar incidencia INC-XXXX/);
 assert.equal(screenLabel({equipo:'tpv'}),'TPV');
 const store=new Map(),mem={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},closed=[];let body=null;
 globalThis.XpaceMatrixOptions={isActive:()=>true,incidentDemo:{candidates:()=>[],focus:async()=>true,name:id=>id,stage:()=>null,listOpen:async()=>[cf],
  close:async o=>{closed.push(o.id);if(o.id==='INC-HELD01'){const e=Error('la lleva un técnico en el portal del comercio (Sofía P.)');e.code='portal_assigned';e.url='https://www.yokup.com/ticket?id=INC-HELD01';throw e;}return {inc:{id:o.id,stage:'cerrada',resolution:o.note,resource:'demo:starbucks-alsea-paseo-de-gracia:pantalla-1:manual:040c'}};}}};
 const r1=await runIncidentDemo('/cerrar incidencia',{store:mem});assert.match(r1.message,/^Hay 1 incidencia abierta en pantalla 1: INC-CFHI7Z/);assert.doesNotMatch(r1.message,/No hay incidencias/);assert.equal(closed.length,0,'sin id no cierra una que no abrió la CLI');
 const fetcher=async(u,o)=>{body=JSON.parse(o.body);return {ok:true,status:200,json:async()=>({ok:true,sent:true,message_id:'<m@admira.live>',telegram:{sent:true,message_id:9},pages:3})};};
 const r2=await runIncidentDemo('/cerrar incidencia INC-CFHI7Z',{store:mem,fetcher});assert.match(r2.message,/INC-CFHI7Z cerrada/);assert.match(r2.message,/Informe enviado a csilvasantin@gmail\.com/);assert.equal(body.id,'INC-CFHI7Z');assert.deepEqual(closed,['INC-CFHI7Z']);
 const r3=await runIncidentDemo('/cerrar incidencia INC-HELD01',{store:mem,fetcher});assert.match(r3.message,/^⚠ INC-HELD01 no se ha cerrado: la lleva un técnico en el portal del comercio \(Sofía P\.\)\. Se cierra desde su ficha, con evidencia: https:\/\/www\.yokup\.com\/ticket\?id=INC-HELD01$/);
 delete globalThis.XpaceMatrixOptions;
});
