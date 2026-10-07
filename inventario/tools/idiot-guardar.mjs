#!/usr/bin/env node
// Guarda en el catálogo central de Xpacios el idIoT que aún no tenga nombre guardado.
//   node inventario/tools/idiot-guardar.mjs            → sólo enseña lo que haría (no escribe)
//   OMNIP_ADMIN_TOKEN=… node inventario/tools/idiot-guardar.mjs --aplicar [--copia <fichero>]
// Escribe con POST /locations/iot, que SÓLO añade nombres: no toca ningún otro campo de la ficha, no cambia un
// nombre ya guardado y rechaza el lote entero si dejara dos idIoT iguales. La credencial sólo viaja en la cabecera.
import fs from 'node:fs';
import {buildIdIot,pendingNames} from '../idiot.mjs';
import {starbucksRegistry,STARBUCKS_LOCATION} from '../idiot-command.mjs';
const API=process.env.OMNIP_API||'https://brain.digitalavatar.ai',args=process.argv.slice(2),aplicar=args.includes('--aplicar');
const copia=args.includes('--copia')?args[args.indexOf('--copia')+1]:'';
const projects=JSON.parse(fs.readFileSync(new URL('../../admira-xp/scripts/project-catalog.json',import.meta.url))).projects;
const catalog=await fetch(API+'/locations',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('GET /locations → HTTP '+r.status);return r.json();});
// Las fichas que el catálogo añade desde Yokup (D1) no viven en el KV: no se pueden nombrar aquí.
const locations=(catalog.locations||[]).filter(l=>l&&l.source!=='yokup-retailer');
if(copia)fs.writeFileSync(copia,JSON.stringify(catalog));
const rows=buildIdIot({locations,projects,twin:{locationId:STARBUCKS_LOCATION,elements:await starbucksRegistry()}});
const unicos=new Set(rows.map(r=>r.idIoT.toLowerCase())).size,names=pendingNames(rows);
const faltan=rows.filter(r=>!r.stored).length;
console.log(`Catálogo: ${locations.length} Xpacios · ${rows.length} elementos IoT · ${unicos} nombres distintos · ${rows.length-faltan} ya guardados · ${faltan} por guardar en ${Object.keys(names).length} Xpacios`);
if(unicos!==rows.length){console.error('Hay nombres repetidos: no se escribe.');process.exit(2);}
if(!faltan){console.log('Nada que guardar.');process.exit(0);}
if(!aplicar){console.log('Ensayo: no se ha escrito nada. Añade --aplicar para guardar.');process.exit(0);}
const token=process.env.OMNIP_ADMIN_TOKEN||'';
if(!token){console.error('Falta OMNIP_ADMIN_TOKEN en el entorno.');process.exit(2);}
const res=await fetch(API+'/locations/iot',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({names})});
const out=await res.json().catch(()=>({}));
console.log('POST /locations/iot → HTTP '+res.status,JSON.stringify({ok:out.ok,locations:out.locations,names:out.names,total:out.total,skippedCount:out.skippedCount,error:out.error,idIoT:out.idIoT}));
if(out.skipped&&out.skipped.length)console.log('Saltados (primeros):',JSON.stringify(out.skipped.slice(0,8)));
process.exit(res.ok&&out.ok?0:1);
