// Ensayos de la suite (/demo 1–5) dentro del gemelo (Carlos, 8-oct-2026): el motor común (admiranext.com/suite/experto.js)
// pinta #ax-demo-muestra con su interfaz traducida pero el catálogo publicado sólo en castellano y estilos en línea por
// defecto. Sin tocar ese motor: aquí se viste la ventana con el mismo cristal de marca que la tarjeta del recorrido y,
// con la página en inglés (/idioma ENG o /demo all en), se traducen sus textos de catálogo; al volver a ESP se restauran.
export const DEMO_TERMS_EN=Object.freeze({local:'venue',contenido:'content',destinos:'destinations',volumen:'volume',horario:'schedule',estado:'status',playlist:'playlist',prioridad:'priority',orden:'order',reproduccion:'playback',producto:'product',evento:'event',regla:'rule'});
export const DEMO_TEXT_EN=Object.freeze({
 'Gestión de locuciones':'Voiceover management','Seleccionar una locución, asignarla a una zona y preparar su horario.':'Select a voiceover, assign it to a zone and prepare its schedule.',
 'Abrir el local de demostración y su gestión de audio.':'Open the demo venue and its audio management.','Seleccionar la locución preparada de café y bollería; escucharla.':'Select the prepared coffee and pastry voiceover and listen to it.',
 'Asignar entrada y caja, volumen 65 y horario de desayuno.':'Assign entrance and register, volume 65 and the breakfast schedule.','Revisar la programación y el resultado antes de activarlo.':'Review the schedule and the result before activating it.',
 'Locución de desayuno':'Breakfast voiceover','Entrada':'Entrance','Caja':'Register','Programación de ejemplo preparada':'Prepared example schedule',
 'Locución preparada para el ensayo; programación de ejemplo.':'Voiceover prepared for the rehearsal; example schedule.',
 'Ensayo preparado de esta función. No realiza altas, generación ni publicación.':'Prepared rehearsal of this feature. No registrations, generation or publishing.',
 'Gestión de música':'Music management','Seleccionar la playlist del local, zonas, volumen y franjas horarias.':'Select the venue playlist, zones, volume and time slots.',
 'Abrir la gestión del hilo musical del local.':'Open the venue background-music management.','Escuchar el ambiente musical preparado y seleccionarlo.':'Listen to the prepared music ambience and select it.',
 'Asignar sala y terraza, volumen 45 y la franja de tarde.':'Assign dining room and terrace, volume 45 and the afternoon slot.','Revisar cómo conviven música y locución en la programación.':'Review how music and voiceover share the schedule.',
 'Ambiente de cafetería':'Coffee-shop ambience','Sala':'Dining room','Terraza':'Terrace','La locución atenúa temporalmente la música':'The voiceover temporarily lowers the music',
 'Pista preparada para ilustrar la gestión del hilo musical.':'Track prepared to illustrate background-music management.',
 'Gestión de imágenes':'Image management','Seleccionar creatividades, organizarlas en playlist y asignar pantallas.':'Select creatives, arrange them in a playlist and assign screens.',
 'Abrir la gestión de contenidos visuales del local.':'Open the venue visual-content management.','Seleccionar la creatividad de café preparada.':'Select the prepared coffee creative.',
 'Asignarla a la pantalla de entrada y fijar su orden en la playlist.':'Assign it to the entrance screen and set its order in the playlist.','Revisar el calendario y la vista previa de la pantalla.':'Review the calendar and the screen preview.',
 'Creatividad de café':'Coffee creative','Pantalla de entrada':'Entrance screen','Campaña de desayuno':'Breakfast campaign','Creatividad preparada para el ensayo de gestión.':'Creative prepared for the management rehearsal.',
 'Gestión de vídeo':'Video management','Ordenar clips en playlist, asignar destinos y comprobar su reproducción.':'Arrange clips in a playlist, assign destinations and check playback.',
 'Abrir la playlist de vídeo del local.':'Open the venue video playlist.','Previsualizar el clip preparado de la campaña.':'Preview the prepared campaign clip.',
 'Asignarlo a la pantalla de pared y colocarlo después de la imagen.':'Assign it to the wall screen and place it after the image.','Revisar la reproducción y la programación por destino.':'Review playback and the schedule per destination.',
 'Clip de campaña de café':'Coffee campaign clip','Pantalla de pared':'Wall screen','Bucle dentro de la playlist':'Loop within the playlist','Clip preparado para el ensayo de gestión.':'Clip prepared for the management rehearsal.',
 'Gestión del TPV':'POS management','Seleccionar un producto y enseñar su relación con audio, pantallas y reglas del local.':'Select a product and show how it links to the venue audio, screens and rules.',
 'Abrir el TPV del gemelo de demostración.':'Open the demo twin POS.','Seleccionar un muffin para mostrar la operación en caja.':'Select a muffin to show the register operation.',
 'Revisar la regla que relaciona el producto con su campaña.':'Review the rule linking the product to its campaign.','Comprobar los destinos de audio y vídeo asociados en este ensayo.':'Check the audio and video destinations linked in this rehearsal.',
 'Selección de producto en TPV':'Product selected at the POS','Si se selecciona el muffin, mostrar la campaña asociada':'If the muffin is selected, show the linked campaign','Altavoces':'Speakers','Datos de ejemplo':'Example data'
});
const PHRASES=Object.keys(DEMO_TEXT_EN).filter(k=>k.length>=14).sort((a,b)=>b.length-a.length);
// Una línea: exacta; si no, frases largas conocidas dentro (títulos «b. Gestión de música», líneas del log del motor).
export function translateDemoLine(line){if(Object.hasOwn(DEMO_TEXT_EN,line.trim()))return line.replace(line.trim(),DEMO_TEXT_EN[line.trim()]);let out=line;for(const p of PHRASES)if(out.includes(p))out=out.split(p).join(DEMO_TEXT_EN[p]);return out;}
export function translateDemoText(text){return String(text??'').split('\n').map(translateDemoLine).join('\n');}
export function translateDemoTerm(term){const k=String(term||'').trim().toLowerCase();return DEMO_TERMS_EN[k]||term;}
export const SKIN_CSS='#ax-demo-muestra{--xb:var(--mbx-brand,#00704A);--xa0:var(--mbx-accent,#00e5a8);--xa:color-mix(in srgb,var(--xa0) 45%,#e6fff5);background:radial-gradient(120% 90% at 50% 0%,rgba(0,40,28,.55),rgba(2,8,6,.78))!important;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}'
 +'@supports (color:oklch(from red l c h)){#ax-demo-muestra{--xa:oklch(from var(--xa0) max(l,.8) max(c,.15) h)}}'
 // La tarjeta del recorrido vive arriba al centro: el ensayo baja para no taparse el título.
 +'body:has(#xpaceDemoTourCard:not(.placed)) #ax-demo-muestra{align-items:flex-start!important;padding-top:min(236px,34vh)!important}'
 +'body:has(#xpaceDemoTourCard:not(.placed)) #ax-demo-muestra>div{max-height:calc(100vh - min(236px,34vh) - 16px)!important;overflow:auto!important}'
 +'#ax-demo-muestra>div{background:rgba(6,40,30,.78)!important;background:linear-gradient(150deg,color-mix(in srgb,var(--xb) 46%,rgba(8,22,18,.82)),rgba(6,16,13,.86) 70%)!important;color:#f3fffa!important;border:1px solid color-mix(in srgb,var(--xa) 50%,rgba(255,255,255,.2))!important;border-radius:22px!important;box-shadow:0 24px 70px rgba(0,0,0,.5),0 0 40px color-mix(in srgb,var(--xa) 22%,transparent),inset 0 0 0 1px rgba(255,255,255,.05)!important;backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);padding:22px 24px 18px!important;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif!important;max-width:min(920px,94vw)!important;scrollbar-width:thin;scrollbar-color:rgba(200,255,235,.3) transparent}'
 +'#ax-demo-muestra h2{font:800 22px/1.2 system-ui,-apple-system,sans-serif!important;letter-spacing:-.01em;margin:0 0 6px!important;color:#fff}'
 +'#ax-demo-muestra h2+p{color:rgba(235,255,247,.82)!important;margin:0 0 12px!important}'
 +'#ax-demo-muestra [data-demo-status]{display:inline-block;margin:0 0 6px;font:700 11.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--xa);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:6px 10px}'
 +'#ax-demo-muestra [data-demo-phase]{font:650 21px/1.35 system-ui,-apple-system,sans-serif!important;margin:4px 0 6px!important;color:#fff}'
 +'#ax-demo-muestra [data-demo-phase]+p{color:rgba(235,255,247,.62)!important}'
 +'#ax-demo-muestra dl[data-demo-case]{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:10px 0 4px;padding:12px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px}'
 +'#ax-demo-muestra dt{font:700 11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:.12em;text-transform:uppercase;color:var(--xa)}'
 +'#ax-demo-muestra dd{margin:0!important;color:#eafff6!important}'
 +'#ax-demo-muestra button{appearance:none;-webkit-appearance:none;font:650 13px/1 system-ui,-apple-system,sans-serif;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:9px 15px;cursor:pointer;transition:background .2s,border-color .2s,transform .15s}'
 +'#ax-demo-muestra button:hover{background:rgba(255,255,255,.16);border-color:var(--xa)}#ax-demo-muestra button:active{transform:scale(.97)}#ax-demo-muestra button:disabled{opacity:.45;cursor:default}'
 +'#ax-demo-muestra button[data-demo-pause]+button{background:var(--xa);color:#04261c;border-color:transparent;font-weight:800}'
 +'#ax-demo-muestra label{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:rgba(235,255,247,.86);cursor:pointer}'
 +'#ax-demo-muestra input[type=checkbox]{accent-color:var(--xa);width:16px;height:16px;margin:0}'
 +'#ax-demo-muestra a{color:var(--xa)!important;font-weight:650;text-decoration:none}#ax-demo-muestra a:hover{text-decoration:underline}'
 +'#ax-demo-muestra p:last-child{align-items:center;gap:8px!important}'
 +'#ax-demo-muestra video,#ax-demo-muestra img,#ax-demo-muestra audio{border-radius:14px}'
 +'@media (prefers-reduced-motion:reduce){#ax-demo-muestra button{transition:none}}';
// Traduce (o restaura) los textos de catálogo del ensayo según el idioma de la página.
export function skinDemoPopup(o,lang){
 if(!o)return 0;const doc=o.ownerDocument,en=lang==='en';let n=0;const orig=o.__xdsOrig||(o.__xdsOrig=new WeakMap());
 const walker=doc.createTreeWalker(o,4);const nodes=[];for(let t=walker.nextNode();t;t=walker.nextNode())nodes.push(t);
 for(const t of nodes){const parent=t.parentElement;if(!parent||parent.closest('button,a,label,script,style'))continue;
  const base=orig.has(t)&&orig.get(t).en===t.nodeValue?orig.get(t).es:t.nodeValue;
  const next=en?(parent.tagName==='DT'?translateDemoTerm(base):translateDemoText(base)):base;
  if(next!==t.nodeValue){t.nodeValue=next;n++;}
  if(en&&next!==base)orig.set(t,{es:base,en:next});}
 const h=o.querySelector('h2');if(h)o.setAttribute('aria-label',h.textContent.replace(/^[a-z0-9]+\.\s*/i,''));
 return n;
}
// Una sola vez por documento: estilo + observador que viste cada ventana nueva del motor y sigue el idioma.
export function installStoreDemoSkin(doc=globalThis.document){
 if(!doc?.head||doc.__xdsSkin)return doc?.__xdsSkin||null;
 const st=doc.createElement('style');st.id='xpaceStoreDemoSkin';st.textContent=SKIN_CSS;doc.head.append(st);
 const lang=()=>doc.documentElement.lang==='en'?'en':'es';let busy=false;
 const apply=()=>{const o=doc.getElementById('ax-demo-muestra');if(!o||busy)return;busy=true;try{skinDemoPopup(o,lang());}finally{busy=false;}};
 const Obs=doc.defaultView?.MutationObserver;let mo=null,root=null;
 if(Obs){mo=new Obs(()=>{const o=doc.getElementById('ax-demo-muestra');if(o&&o!==root){root=o;inner.observe(o,{subtree:true,childList:true,characterData:true});}apply();});
  var inner=new Obs(()=>apply());mo.observe(doc.body,{childList:true});mo.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});}
 apply();
 return doc.__xdsSkin={apply,dispose(){mo?.disconnect();inner?.disconnect();st.remove();doc.__xdsSkin=null;}};
}
