import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO_TEXT_EN,DEMO_TERMS_EN,translateDemoText,translateDemoTerm,SKIN_CSS} from '../admira-xp/scripts/store-demo-skin.mjs';
import {createVoiceSpeaker,voiceLogLine,WATER_THANKS} from '../admira-xp/scripts/retail-voice.mjs';
// Textos del catálogo publicado del motor común (admiranext.com/subdemos/store.subdemos.json, 8-oct-2026) que se ven en el ensayo.
const CATALOG=["Gestión de locuciones", "Seleccionar una locución, asignarla a una zona y preparar su horario.", "Abrir el local de demostración y su gestión de audio.", "Seleccionar la locución preparada de café y bollería; escucharla.", "Asignar entrada y caja, volumen 65 y horario de desayuno.", "Revisar la programación y el resultado antes de activarlo.", "Locución de desayuno", "Entrada", "Caja", "Programación de ejemplo preparada", "Locución preparada para el ensayo; programación de ejemplo.", "Ensayo preparado de esta función. No realiza altas, generación ni publicación.", "Gestión de música", "Seleccionar la playlist del local, zonas, volumen y franjas horarias.", "Abrir la gestión del hilo musical del local.", "Escuchar el ambiente musical preparado y seleccionarlo.", "Asignar sala y terraza, volumen 45 y la franja de tarde.", "Revisar cómo conviven música y locución en la programación.", "Ambiente de cafetería", "Sala", "Terraza", "La locución atenúa temporalmente la música", "Pista preparada para ilustrar la gestión del hilo musical.", "Gestión de imágenes", "Seleccionar creatividades, organizarlas en playlist y asignar pantallas.", "Abrir la gestión de contenidos visuales del local.", "Seleccionar la creatividad de café preparada.", "Asignarla a la pantalla de entrada y fijar su orden en la playlist.", "Revisar el calendario y la vista previa de la pantalla.", "Creatividad de café", "Pantalla de entrada", "Campaña de desayuno", "Creatividad preparada para el ensayo de gestión.", "Gestión de vídeo", "Ordenar clips en playlist, asignar destinos y comprobar su reproducción.", "Abrir la playlist de vídeo del local.", "Previsualizar el clip preparado de la campaña.", "Asignarlo a la pantalla de pared y colocarlo después de la imagen.", "Revisar la reproducción y la programación por destino.", "Clip de campaña de café", "Pantalla de pared", "Bucle dentro de la playlist", "Clip preparado para el ensayo de gestión.", "Gestión del TPV", "Seleccionar un producto y enseñar su relación con audio, pantallas y reglas del local.", "Abrir el TPV del gemelo de demostración.", "Seleccionar un muffin para mostrar la operación en caja.", "Revisar la regla que relaciona el producto con su campaña.", "Comprobar los destinos de audio y vídeo asociados en este ensayo.", "Selección de producto en TPV", "Si se selecciona el muffin, mostrar la campaña asociada", "Altavoces"];
const TERMS=["contenido", "destinos", "estado", "evento", "horario", "local", "orden", "playlist", "prioridad", "producto", "regla", "reproduccion", "volumen"];
test('every Spanish rehearsal text of demos 1–5 has an English version; headings and engine log lines translate inside',()=>{
 for(const s of CATALOG)assert.ok(DEMO_TEXT_EN[s],'missing EN: '+s);
 for(const k of TERMS)assert.ok(DEMO_TERMS_EN[k],'missing term: '+k);
 assert.equal(translateDemoText('b. Gestión de música'),'b. Music management');
 assert.equal(translateDemoText('Sala\nTerraza'),'Dining room\nTerrace');
 assert.equal(translateDemoText('Demo 2 · Gestión de música — Seleccionar la playlist del local, zonas, volumen y franjas horarias.'),'Demo 2 · Music management — Select the venue playlist, zones, volume and time slots.');
 assert.equal(translateDemoTerm('destinos'),'destinations');assert.equal(translateDemoTerm('alsea'),'alsea');
 assert.equal(translateDemoText('alsea-sbux-021'),'alsea-sbux-021');
});
test('rehearsal window uses the brand glass look and styled controls',()=>{
 for(const sel of ['#ax-demo-muestra>div','backdrop-filter','#ax-demo-muestra button','accent-color','--mbx-brand','prefers-reduced-motion'])assert.ok(SKIN_CSS.includes(sel),sel);
});
test('voiceover leaves a visible trace: CLI log line and last response, in the spoken language',async()=>{
 assert.equal(voiceLogLine({language:'es',text:WATER_THANKS.es}),'🔊 Locución: «Gracias por comprar agua de proximidad»');
 assert.equal(voiceLogLine({language:'en',text:WATER_THANKS.en}),'🔊 Voiceover: “Thank you for buying locally sourced water”');
 const log=[],shown=[],events=[];const win={document:{documentElement:{lang:'en'}},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o.detail;}},dispatchEvent:e=>events.push(e.detail.phase),XpaceAppendLog:(k,l,t)=>log.push(t),XpaceShowResponse:t=>shown.push(t),
  XpaceAnnouncements:{playStock(u,t,{onState}){setTimeout(()=>onState({phase:'done'}),2);return true;}}};
 await createVoiceSpeaker({id:'sayText',value:WATER_THANKS.es,text:{...WATER_THANKS},voice:'both'},{win}).play();
 assert.deepEqual(log,['🔊 Locución: «Gracias por comprar agua de proximidad»','🔊 Voiceover: “Thank you for buying locally sourced water”']);assert.deepEqual(shown,log);assert.deepEqual(events,['start','start','end']);
});
