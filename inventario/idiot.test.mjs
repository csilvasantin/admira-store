// /inventario idIoT (Carlos, 7-oct-2026): cada elemento IoT dado de alta en un Xpacio de un Proyecto tiene un
// nombre único Proyecto_Xpacio_Tipo_n que lo identifica y lo agrupa por su prefijo.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {idPart,iotType,projectOf,xpaceLabel,uniqueXpaceLabels,nameElements,catalogElements,twinElements,buildIdIot,pendingNames,parseIdIotCommand,selectRows,formatIdIot,formatProjects,toCsv} from './idiot.mjs';
import {executeIdIotCommand,runIdIot,starbucksRegistry,STARBUCKS_LOCATION} from './idiot-command.mjs';
const projects=JSON.parse(fs.readFileSync(new URL('../admira-xp/scripts/project-catalog.json',import.meta.url))).projects;
const pg103={id:'alsea-sbux-021',name:'Starbucks Paseo de Gracia',addr:'Paseo de Gracia 103 · Barcelona · 08008',circuit:'alsea_starbucks',external:{brand:'Starbucks'},
 surfaces:[{name:'Menu board digital',surface:'pantalla'},{name:'Pantalla recogida',surface:'pantalla',screen:'sbux-pg103-recogida'},{name:'Escaparate',surface:'escaparate'}]};
const otros=[
 {id:'alsea-sbux-003',name:'Starbucks Santiago C.C. As Cancellas',addr:'Avenida del camino frances 3 Santiago de Compostela 15703 La Coruna',circuit:'alsea_starbucks',surfaces:[{name:'Menu board digital',surface:'pantalla'}]},
 {id:'bbva-0002-espana',name:'BBVA España',addr:'España',surfaces:[{name:'Fachada / escaparate',surface:'escaparate'}]},
 {id:'bbva-0004-espana',name:'BBVA España',addr:'España',surfaces:[{name:'Fachada / escaparate',surface:'escaparate'}]},
 {id:'altadis-bcn-001',name:'Estanc Gran de Gràcia 61',addr:'Carrer Gran de Gràcia 61 · 08012 Barcelona',circuit:'altadis_bcn',external:{brand:'Estanco'},surfaces:[{name:'P1 · Vertical escaparate',surface:'escaparate'},{name:'P2 · Horizontal mostrador',surface:'pantalla'}]},
 {id:'365-demo-bcn-tetuan',name:'365 · Plaça de Tetuan, 3',addr:'Plaça de Tetuan, 3 · Eixample',circuit:'demo_365_bcn',external:{brand:'365'},surfaces:[{name:'Altavoz (hilo musical + locuciones)',surface:'audio'},{name:'Pantalla vertical 9:16',surface:'pantalla'}]},
 {id:'the-i',name:'I',addr:'',kind:'MUPI · Circuito Admira · AdmiraNeXT Player (iOS)',surfaces:[{name:'MUPI vertical',surface:'pantalla',screen:'the-i-mupi'}]}
];
const red=[pg103,...otros];

test('el nombre es Proyecto_Xpacio_Tipo_n y el ejemplo de Carlos sale tal cual',()=>{
 assert.equal(idPart('Paseo de Gràcia'),'PaseodeGracia');
 const rows=buildIdIot({locations:[pg103],projects});
 assert.deepEqual(rows.map(r=>r.idIoT),['Starbucks_PaseodeGracia_103_Pantalla_1','Starbucks_PaseodeGracia_103_Pantalla_2','Starbucks_PaseodeGracia_103_Escaparate_1']);
 assert.equal(rows[1].player,'sbux-pg103-recogida');assert.equal(rows[0].xpaceId,'alsea-sbux-021');assert.equal(rows[0].projectId,'starbucks');
});
test('el Xpacio se nombra por calle y número; si no hay calle, por su nombre; si no, por su id',()=>{
 assert.equal(xpaceLabel(otros[0],'Starbucks'),'Avenidadelcaminofrances_3');
 assert.equal(xpaceLabel({id:'x',name:'AVENIDA PASEO DE LOS HEROES 95 LOCAL E5',addr:'AVENIDA PASEO DE LOS HEROES 95 LOCAL E5 TIJUANA'},'Starbucks México'),'AvenidaPaseoDeLosHeroes_95');
 assert.equal(xpaceLabel({id:'metro-barcelona-aeroport-t1',name:'Metro Barcelona · Aeroport T1',addr:'Aeroport T1 · Metro de Barcelona'},'Metro BCN'),'BarcelonaAeroportT1');
 assert.equal(xpaceLabel({id:'mango-661',name:'Mango',addr:'Mango Store'},'Mango'),'661');
});
test('dos centros que se llamarían igual se distinguen por su id del catálogo: nunca hay dos idIoT iguales',()=>{
 const labels=uniqueXpaceLabels([otros[1],otros[2]],'BBVA');
 assert.deepEqual([...labels.values()],['0002','0004'],'«BBVA España» no dice nada: manda el número de su ficha');
 assert.notEqual(labels.get('bbva-0002-espana'),labels.get('bbva-0004-espana'));
 const rows=buildIdIot({locations:red,projects});
 assert.equal(new Set(rows.map(r=>r.idIoT)).size,rows.length);
 const repetidos=buildIdIot({locations:[pg103,{...pg103,id:'alsea-sbux-999'}],projects});
 assert.equal(new Set(repetidos.map(r=>r.idIoT)).size,repetidos.length,'misma calle y número en dos fichas');
});
test('el proyecto sale del circuito, del id o de la marca; lo que nadie reclama es SinProyecto',()=>{
 assert.equal(projectOf(pg103,projects).label,'Starbucks');
 assert.equal(projectOf(otros[1],projects).label,'BBVA');
 assert.equal(projectOf(otros[3],projects).label,'Altadis');
 assert.equal(projectOf({id:'bcn-kiosk-001',name:'Quiosc · premsa'},projects).id,'canalkiosk');
 assert.equal(projectOf(otros[5],projects).label,'AdmiraNeXT');
 assert.equal(projectOf({id:'qa-1',name:'QA'},projects).label,'SinProyecto');
});
test('el tipo distingue pantalla, escaparate, altavoz, TPV, iPad… y cada tipo se numera aparte',()=>{
 assert.equal(iotType({surface:'pantalla',name:'LED Frontal'}),'Pantalla');assert.equal(iotType({surface:'audio',name:'Altavoz (hilo musical)'}),'Altavoz');
 assert.equal(iotType({surface:'pantalla',name:'Audio Estación'}),'Audio');assert.equal(iotType({model:'tft'}),'Pantalla');assert.equal(iotType({model:'led'}),'LED');
 assert.equal(iotType({id:'starbucks-tpv-01',name:'Starbucks · TPV / POS'}),'TPV');assert.equal(iotType({id:'starbucks-ipad-01'}),'iPad');
 const named=nameElements('Starbucks','PaseodeGracia_103',[{type:'Pantalla',number:6},{type:'Pantalla',number:5},{type:'Pantalla'},{type:'TPV'},{type:'Pantalla',number:6}]);
 assert.deepEqual(named.map(e=>e.type+'_'+e.n),['Pantalla_6','Pantalla_5','Pantalla_1','TPV_1','Pantalla_2'],'el número declarado manda; el repetido no pisa');
 assert.deepEqual(catalogElements(otros[4]).map(e=>e.type),['Altavoz','Pantalla']);
});
test('el Starbucks de Pg. Gràcia 103 usa su registro del gemelo: pared 1–6, TPV, iPad y altavoz',async()=>{
 const registry=await starbucksRegistry();
 const rows=buildIdIot({locations:red,projects,twin:{locationId:STARBUCKS_LOCATION,elements:registry}}).filter(r=>r.xpaceId===STARBUCKS_LOCATION);
 assert.deepEqual(rows.map(r=>r.idIoT),[1,2,3,4,5,6].map(n=>'Starbucks_PaseodeGracia_103_Pantalla_'+n).concat(['Starbucks_PaseodeGracia_103_TPV_1','Starbucks_PaseodeGracia_103_iPad_1','Starbucks_PaseodeGracia_103_Altavoz_1']));
 assert.equal(rows.find(r=>r.idIoT.endsWith('Pantalla_6')).instance,'starbucks-wall-01','la pantalla 6 es la primera desde la entrada');
 assert.equal(rows.find(r=>r.type==='iPad').code,'PDG103-IPAD-01');
});
test('una escena de demostración nombra el IoT de su inventario local y no cuenta lo retirado ni el mobiliario',()=>{
 const rows=[{id:'led',name:'LED Banner',category:'IoT',asset:{type:'led',category:'IoT'}},{id:'counter',name:'Mostrador',category:'Mobiliario',asset:{type:'counter',category:'Mobiliario'}},{id:'tablet',name:'Tablet',asset:{type:'tablet',category:'IoT'},retired:true},{id:'tft-1',name:'Pantalla TFT',asset:{type:'tft',category:'IoT'}}];
 assert.deepEqual(twinElements(rows).map(e=>e.type),['LED','Pantalla']);
});
test('el comando se reconoce con sus alcances y no se confunde con el inventario de muebles',()=>{
 assert.deepEqual(parseIdIotCommand('/inventario idIoT'),{scope:'here',csv:false});
 assert.deepEqual(parseIdIotCommand('/inventario idiot starbucks csv'),{scope:'query',query:'starbucks',csv:true});
 assert.deepEqual(parseIdIotCommand('/inventory id-iot proyectos'),{scope:'projects',csv:false});
 assert.equal(parseIdIotCommand('/inventario id iot todo').scope,'all');
 assert.equal(parseIdIotCommand('/inventario'),null);assert.equal(parseIdIotCommand('/inventario añadir 43'),null);assert.equal(parseIdIotCommand('/inventario idiota'),null);
});
test('se busca por proyecto, por id de Xpacio o por un trozo del idIoT',()=>{
 const rows=buildIdIot({locations:red,projects});
 assert.equal(selectRows(rows,'sbux',projects).rows.length,4);assert.equal(selectRows(rows,'alsea-sbux-021',projects).kind,'xpace');
 assert.equal(selectRows(rows,'PaseodeGracia_103',projects).rows.length,3);assert.equal(selectRows(rows,'gran de gracia',projects).rows.length,2);
 assert.equal(selectRows(rows,'no-existe',projects).rows.length,0);
});
const ctx=(extra={})=>({network:async()=>({locations:red,projects}),registry:async()=>starbucksRegistry(),...extra});
test('sin argumento enseña el Xpacio abierto; con proyecto, todos sus Xpacios; «proyectos», el resumen de la red',async()=>{
 const aqui=await runIdIot('/inventario idIoT',{...ctx(),starbucks:true,source:{space:'starbucks_pg103',project:'starbucks'}});
 assert.equal(aqui.ok,true);assert.equal(aqui.kind,'inventory');assert.match(aqui.message,/^INVENTARIO · idIoT · Starbucks › Starbucks Paseo de Gracia · 9 elementos IoT · 1 Xpacio/);
 assert.match(aqui.message,/Starbucks_PaseodeGracia_103_Pantalla_1 — Pared de pantallas · 1 · sin player vinculado/);assert.match(aqui.message,/xpacio:alsea-sbux-021/);
 const proyecto=await runIdIot('/inventario idIoT starbucks',{...ctx(),source:{space:'xtanco'}});
 assert.match(proyecto.message,/10 elementos IoT · 2 Xpacios/);assert.match(proyecto.message,/Starbucks_Avenidadelcaminofrances_3_Pantalla_1/);
 assert.match(proyecto.message,/Starbucks_PaseodeGracia_103_TPV_1/,'el mismo nombre se vea desde el gemelo que se vea');
 const resumen=await runIdIot('/inventario idIoT proyectos',ctx());
 assert.match(resumen.message,/Starbucks_ — Starbucks · 2 Xpacios · 10 elementos/);assert.match(resumen.message,/Altadis_ — Altadis · 1 Xpacios · 2 elementos/);
 const en=await runIdIot('/inventario idIoT bbva',{...ctx(),lang:'en'});assert.match(en.message,/2 IoT elements · 2 Xpaces/);assert.match(en.message,/no player bound/);
});
test('el cliente activo (/marca) limita lo que se ve y «csv» descarga la lista completa',async()=>{
 const solo=await runIdIot('/inventario idIoT proyectos',ctx({filter:list=>list.filter(l=>l.circuit==='alsea_starbucks')}));
 assert.match(solo.message,/1 proyectos/);assert.doesNotMatch(solo.message,/BBVA/);
 let file;const csv=await runIdIot('/inventario idIoT starbucks csv',ctx({download:(name,text)=>{file={name,text};}}));
 assert.equal(csv.ok,true);assert.equal(file.name,'idIoT-starbucks.csv');assert.equal(file.text.trim().split('\n').length,11);
 assert.match(file.text,/^idIoT;project;xpaceName;addr;xpaceId;type;n;name;code;player;source;stored\n/);assert.match(toCsv([{idIoT:'a;b'}]),/"a;b"/);
});
test('una escena de demostración sin Xpacio del catálogo se nombra sola y avisa de que no es central',async()=>{
 const demo=await runIdIot('/inventario idIoT',{source:{space:'xtanco',project:'estancos',layout:[{id:'led',type:'led'},{id:'counter',type:'counter'}],removed:{}},
  loadAssets:async()=>({assets:[{id:'native:led',type:'led',category:'IoT',name:'LED Banner'},{id:'native:counter',type:'counter',category:'Mobiliario',name:'Mostrador'}]}),network:async()=>{throw Error('no debe pedir la red');}});
 assert.equal(demo.ok,true);assert.match(demo.message,/Estancos_GrandeGracia_LED_1 — LED Banner/);assert.match(demo.message,/Escena de demostración/);assert.doesNotMatch(demo.message,/Mostrador/);
});
test('sin red no inventa nombres: lo dice',async()=>{
 const r=await executeIdIotCommand('/inventario idIoT starbucks',{network:async()=>{throw Error('offline');}});
 assert.equal(r.ok,false);assert.match(r.message,/No se pudo cargar el catálogo de Xpacios/);
 const vacio=await runIdIot('/inventario idIoT zzz',ctx());assert.match(vacio.message,/Ningún elemento IoT dado de alta coincide/);
 assert.match(formatProjects([]),/0 proyectos/);assert.match(formatIdIot([]),/Ningún elemento/);
});

// «Guárdalo en la ficha» (Carlos, 7-oct-2026): el nombre guardado manda sobre el calculado.
test('un idIoT guardado en la ficha no cambia aunque cambien la dirección o el orden de las superficies',()=>{
 const mudado={...pg103,addr:'Rambla de Catalunya 5 · Barcelona',surfaces:[{name:'Pantalla nueva',surface:'pantalla'},{name:'Pantalla recogida',surface:'pantalla',idIoT:'Starbucks_PaseodeGracia_103_Pantalla_2'},{name:'Menu board digital',surface:'pantalla',idIoT:'Starbucks_PaseodeGracia_103_Pantalla_1'}]};
 const rows=buildIdIot({locations:[mudado],projects});
 assert.deepEqual(rows.map(r=>r.idIoT),['Starbucks_RambladeCatalunya_5_Pantalla_1','Starbucks_PaseodeGracia_103_Pantalla_2','Starbucks_PaseodeGracia_103_Pantalla_1']);
 assert.deepEqual(rows.map(r=>r.stored),[false,true,true]);
 assert.match(formatIdIot(rows),/Starbucks_RambladeCatalunya_5_Pantalla_1 — Pantalla nueva · sin player vinculado · sin guardar/);
 assert.doesNotMatch(formatIdIot(rows.slice(1)),/sin guardar/);
});
test('lo nuevo se numera sin pisar lo guardado, ni en su Xpacio ni en otro de la red',()=>{
 const a={...pg103,surfaces:[{name:'A',surface:'pantalla',idIoT:'Starbucks_PaseodeGracia_103_Pantalla_1'},{name:'B',surface:'pantalla'}]};
 const b={...pg103,id:'alsea-sbux-900',addr:'Otra 1',surfaces:[{name:'Ocupa',surface:'pantalla',idIoT:'Starbucks_PaseodeGracia_103_Pantalla_2'}]};
 const rows=buildIdIot({locations:[a,b],projects});
 assert.equal(new Set(rows.map(r=>r.idIoT.toLowerCase())).size,3);assert.equal(rows.find(r=>r.name==='B').idIoT,'Starbucks_PaseodeGracia_103_Pantalla_3');
});
test('el registro fino guardado en la ficha (iot[]) sustituye a sus superficies genéricas y al gemelo',async()=>{
 const registry=await starbucksRegistry(),antes=buildIdIot({locations:[pg103],projects,twin:{locationId:STARBUCKS_LOCATION,elements:registry}});
 const guardar=pendingNames(antes);
 assert.deepEqual(Object.keys(guardar),[STARBUCKS_LOCATION]);assert.equal(guardar[STARBUCKS_LOCATION].iot.length,9);assert.equal(guardar[STARBUCKS_LOCATION].surfaces,undefined);
 const ficha={...pg103,iot:guardar[STARBUCKS_LOCATION].iot},despues=buildIdIot({locations:[ficha],projects});
 assert.deepEqual(despues.map(r=>r.idIoT),antes.map(r=>r.idIoT));assert.ok(despues.every(r=>r.stored&&r.source==='ficha'));
 assert.deepEqual(pendingNames(despues),{});
});
test('lo pendiente de guardar sale por posición de superficie, con huecos donde ya hay nombre',()=>{
 const l={...otros[3],surfaces:[{name:'P1',surface:'escaparate',idIoT:'Altadis_CarrerGrandeGracia_61_Escaparate_1'},{name:'P2',surface:'pantalla'}]};
 const p=pendingNames(buildIdIot({locations:[l],projects}));
 assert.equal(p['altadis-bcn-001'].surfaces.length,2);assert.equal(p['altadis-bcn-001'].surfaces[0],undefined);assert.equal(p['altadis-bcn-001'].surfaces[1],'Altadis_CarrerGrandeGracia_61_Pantalla_1');
});
