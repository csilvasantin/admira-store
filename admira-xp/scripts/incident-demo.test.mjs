import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseIncidentCommand,CAUSES,pick,runIncidentDemo,REPORT_TO} from './incident-demo.mjs';
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
 const fetcher=async(url,opt)=>{calls.push(['report',url,JSON.parse(opt.body).id]);return {ok:true,status:200,json:async()=>({ok:true,sent:true,message_id:'<m@admira.live>'})};};
 const closed=await runIncidentDemo('/cerrar incidencia',{store:mem,fetcher});assert.match(closed.message,/INC-CLI001 cerrada/);assert.match(closed.message,new RegExp('Informe enviado a '+REPORT_TO));
 assert.deepEqual(calls.at(-1),['report','https://data.yokup.com/api/demo/incident-report','INC-CLI001']);
 assert.match((await runIncidentDemo('/cerrar incidencia',{store:mem,fetcher})).message,/No hay incidencias abiertas por la CLI/);
 delete globalThis.XpaceMatrixOptions;
});
test('cableado: CLI, ayuda, panel (nunca la pantalla 1, sólo tickets de la CLI), cámara y documentación',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),panel=fs.readFileSync(new URL('./starbucks-incidents.mjs',import.meta.url),'utf8'),pano=fs.readFileSync(new URL('./matrix-panorama.mjs',import.meta.url),'utf8');
 assert.match(html,/\['crear','create','cerrar','close'\]\.includes\(cmd\)/);assert.match(html,/incident-demo\.mjs\?v=cli-incidencia-1/);assert.match(html,/'\/crear incidencia','\/cerrar incidencia'/);
 assert.match(panel,/\/\^pantalla-\[2-6\]\$\//);assert.match(panel,/:manual:cli-/);assert.match(panel,/uuid:'cli-'\+uuid/);assert.match(pano,/function focusScreen\(id/);assert.match(pano,/incidentDemo:\{/);
 assert.match(fs.readFileSync(new URL('../help.html',import.meta.url),'utf8'),/id="incident-cli-demo"/);assert.ok(JSON.parse(fs.readFileSync(new URL('../../mcp/funcionalidades.json',import.meta.url),'utf8')).incident_cli_demo);
});
