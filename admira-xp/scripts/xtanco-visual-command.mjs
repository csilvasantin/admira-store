import {runStoreDemo,hasStoreRehearsal} from './store-demo-bridge.mjs?v=local-autopilot-1';
import {parseTourArg,splitFlags,langToken} from './demo-tour-args.mjs?v=capsula-1';
import {parseScreenDisplayCommand,setScreenDisplayMode,parseScreenLayoutCommand,setScreenNumbersVisible} from './screen-display.mjs?v=number-layout-1';
// Visual modes affect only this browser. This command has no bot, network,
// game-state or legacy /render dependency: the public tier router owns the view.
const aliases=new Map([
  ['good','good'],['8','good'],['8bit','good'],['8-bit','good'],
  ['better','better'],['life','better'],['16','better'],['16bit','better'],['16-bit','better'],
  ['best','best'],['32','best'],['32bit','best'],['32-bit','best'],['hiperrealista','best'],['hyperrealistic','best'],
  ['matrix','matrix']
]);

// Named solutions remain global. Numbers and content names belong to the Store catalog;
// the exact /demo tpv command and its explicit controls retain the native twin journey.
export const DEMO_SOLUTIONS=Object.freeze([
  {id:'studio',alias:['pixeria','contenido','contenidos','creatividad'],name:'admira.studio',url:'https://www.admira.studio/',urlEn:'https://www.admira.studio/'},
  {id:'store',alias:['tienda','xpace','xpaceos','gemelo','twin'],name:'admira.store'},
  {id:'tv',alias:['canal','adcelerate','calle','videoanalytics'],name:'admira.tv',url:'https://admira.tv/adcelerate/demo/?view=human&site=starbucks'},
  {id:'app',alias:['yokup','operaciones','itil','incidencias','retailer'],name:'admira.app · Yokup',url:'https://www.yokup.com/retailer?marca=starbucks'},
  {id:'biz',alias:['negocio','clearchannel','retailmedia','comercial'],name:'admira.biz',url:'https://www.admira.biz/'}
]);
export function demoSolution(arg){const a=String(arg||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^admira\./,'');return DEMO_SOLUTIONS.find(d=>d.id===a||d.alias.includes(a))||null;}

export function parseVisualCommand(input){
  const text=String(input||'').trim();
  const conversion=text.match(/^\/(?:convertir|convert)(?:@\w+)?(?:\s+([\s\S]*))?$/i);if(conversion)return {conversion:(conversion[1]||'').trim().toLowerCase()};
  const conditional=text.match(/^\/(?:ifthendothat|componer)(?:@\w+)?(?:\s+([\s\S]*))?$/i);if(conditional){const arg=(conditional[1]||'on').trim().toLowerCase();return {conditional:['on','off','toggle','estado','status','help','ayuda','?'].includes(arg)?arg:'invalid'};}
  const guided=text.match(/^\/demo(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if(guided){
    const arg=(guided[1]||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    // Registro único de demos (demos.json · demo-tour.mjs): help/ayuda, all/todas [--enviar] y next son del recorrido.
    const tour=parseTourArg(arg);if(tour)return {guided:'tour',...tour};
    if(arg==='tpv')return {guided:'tpv'};
    if(['tpv off','tpv stop'].includes(arg))return {guided:'stop',native:true};
    if(['tpv estado','tpv status'].includes(arg))return {guided:'status',native:true};
    if(['off','stop'].includes(arg))return {guided:'stop'};
    if(['estado','status'].includes(arg))return {guided:'status'};
    return {guided:'suite',text:'/demo'+(arg?' '+arg:'')};
  }
  if(/^\/(?:navidad|christmas)(?:\s+(?:on|off))?$/i.test(text))return {demo:/off$/i.test(text)?'linear':'christmas'};
  if(/^\/(?:sincro|sync)\s+(?:ia|ai)$/i.test(text))return {demo:'ia'};
  const labels=parseScreenLayoutCommand(text);if(labels)return labels.legacy?null:{labels};
  const screen=parseScreenDisplayCommand(text);if(screen)return {screen};
  const aviso=text.match(/^\/(?:aviso|announcement)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if(aviso){const arg=(aviso[1]||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
   if(!arg)return {announcement:{action:'toggle'}};
   if(['estado','status'].includes(arg))return {announcement:{action:'status'}};
   const quality=['estandar','standard','normal','basica','basic','monica','macos'].includes(arg)?'estandar':['elevenlabs','eleven','11labs','premium','ia','ai'].includes(arg)?'elevenlabs':null;
   return quality?{announcement:{action:'quality',quality}}:{announcement:{action:'invalid'}};}
  if(/^\/mudanza(?:@\w+)?$/i.test(text))return {moving:true};
  const direct=text.toLowerCase();if(['good','better','best','matrix'].includes(direct))return {tier:direct};
  const match=text.match(/^\/?(?:modo|mode)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if(!match)return null;
  const argument=(match[1]||'').trim().toLowerCase();
  if(!argument||['help','ayuda','?'].includes(argument))return {help:true};
  if(['estado','status'].includes(argument))return {status:true};
  const tier=aliases.get(argument);
  if(tier)return {tier};
  // This XpaceOS dispatcher has no /modo store-code command. Keep typos and
  // extra tokens local too, so they cannot fall through to the Telegram echo.
  return {help:true,invalid:true};
}

export async function executeVisualCommand(input,{router,moving,lang='es'}={}){
  const command=parseVisualCommand(input);if(!command)return null;
  const en=lang==='en';
  if(command.conversion!==undefined){if(command.conversion!=='2da3d')return {ok:false,local:true,message:en?'Usage: /convertir 2da3d · compare the water rack photo and interactive ITIL model.':'Uso: /convertir 2da3d · compara la foto del botellero y el modelo ITIL interactivo.'};const {openWaterConversion}=await import('./water-conversion.mjs?v=water-2');await openWaterConversion({lang});return {ok:true,local:true,message:en?'Water rack: original photo and interactive 3D model, 13 bottles.':'Botellero: fotografía original y modelo 3D interactivo, 13 botellas.'};}
  if(command.conditional){const arg=command.conditional,api=globalThis.XPLComposer;const usage=en?'Visual rules: /ifthendothat opens IF·THEN·DO THAT. Choose pick up a muffin or take it to the register, then Music, Voiceover, Image or Video, its editable Pixeria filter and content. + Add reaction allows multiple simultaneous DO actions; select one or more image/video screens and use All · clear filter for the complete catalogue. /ifthendothat off closes it.':'Reglas visuales: /ifthendothat abre IF·THEN·DO THAT. Elige coger un muffin o llevarlo a la caja y una reacción: música, locución, imagen o vídeo, su filtro editable y contenido de Pixeria. + Añadir reacción permite varios DO simultáneos; marca una o varias pantallas para imágenes/vídeos y usa Todos · quitar filtro para el catálogo completo. /ifthendothat off cierra el editor.';if(['help','ayuda','?','invalid'].includes(arg))return {ok:arg!=='invalid',local:true,message:usage};if(!api)return {ok:false,local:true,message:en?'The rule editor is still loading. Retry in a moment.':'El editor de reglas aún está cargando. Reintenta en un momento.'};if(['estado','status'].includes(arg))return {ok:true,local:true,message:usage};if(arg==='off')api.close();else if(arg==='toggle')api.toggle();else api.open();return {ok:true,local:true,message:arg==='off'?(en?'Rule editor closed.':'Editor de reglas cerrado.'):usage};}
  if(command.guided){
    // Ensayos 1–5 del motor común: misma estética que la tarjeta y textos de catálogo en inglés con /idioma ENG.
    try{(await import('./store-demo-skin.mjs?v=demos-3')).installStoreDemoSkin(globalThis.document);}catch{}
    // /demo help · /demo all · /demo <id|n> del registro; durante un recorrido, stop/estado/siguiente son suyos.
    const tourActive=!!globalThis.XpaceDemoTour?.active?.(),arg=String(command.text||'').replace(/^\/demo\s*/,'');
    const live=tourActive?(['stop','status'].includes(command.guided)&&!command.native?command.guided:arg==='siguiente'?'next':['pausa','pause'].includes(arg)?'pause':['reanudar','resume','continuar','seguir'].includes(arg)?'resume':langToken(arg)?'language':null):null;
    if(command.guided==='tour'||live){
      const {handleDemoTour}=await import('./demo-tour.mjs?v=capsula-1');
      const action=command.guided==='tour'?command.action:live;
      const out=await handleDemoTour({...command,action,...(live==='language'?{lang:langToken(arg)}:{})},{lang,router});if(out)return out;
      if(command.guided==='tour'&&action==='next')return runStoreDemo('/demo siguiente',{lang}); // sin recorrido: el ensayo de la suite conserva «siguiente».
    }
    if(command.guided==='suite'){const f=splitFlags(arg);
      if(!demoSolution(f.rest))try{const {handleDemoTour,loadDemoRegistry,findDemo}=await import('./demo-tour.mjs?v=capsula-1');const d=findDemo(await loadDemoRegistry(),arg);
        if(d&&d.kind!=='suite'){const out=await handleDemoTour({action:'run',id:d.id,send:f.send,...(f.lang?{lang:f.lang}:{})},{lang,router});if(out)return out;}
        // /demo 3 en · /demo musica es: la demo de la suite en ese idioma, sin pasar el idioma como texto al motor.
        if(d&&d.kind==='suite'&&f.lang)return runStoreDemo('/demo '+f.rest,{lang:f.lang});}catch{}
    }
    if(command.guided==='suite'||(!command.native&&hasStoreRehearsal()&&['stop','status'].includes(command.guided)))
      return runStoreDemo(command.text||('/demo '+(command.guided==='status'?'status':'stop')),{lang});
    if(command.guided==='tpv'&&hasStoreRehearsal())await runStoreDemo('/demo stop',{lang});
    if(command.guided==='stop'){globalThis.XpacePOSExperience?.demo?.stop();return {ok:true,local:true,message:en?'Demo stopped.':'Demo detenida.'};}
    if(command.guided==='status'){const state=globalThis.XpacePOSExperience?.demo?.state();return {ok:true,local:true,message:'Demo TPV · '+({idle:en?'idle':'en reposo',focus:en?'moving to muffins':'acercándose a los muffins',outline:en?'highlighting muffin':'marcando muffin',pick:en?'picking up':'recogiendo',travel:en?'carrying to register':'llevando a caja',drop:en?'dropping':'soltando',checkout:en?'starting reaction':'preparando reacción',completed:en?'completed':'completada',error:en?'error':'error'}[state?.phase]||(en?'idle':'en reposo'))+(state?.song?' · '+(state.songTitle||''):'' )};}
    try{const outcome=await router?.choose('matrix');if(!router||outcome?.ok===false||outcome?.cancelled||router.mode!=='matrix'||router.error||router.busy)throw Error();const result=globalThis.XpacePOSExperience?.demo?.start();if(!result?.ok)return {ok:false,local:true,message:result?.error==='busy'?(en?'A demo is already running. /demo off stops it.':'Ya hay una demo en curso. /demo off la detiene.'):(en?'POS unavailable. Close /layout or geometry editing and check the POS incident.':'TPV no disponible. Cierra /layout o la edición de geometría y comprueba la incidencia del TPV.')};return {ok:true,local:true,message:en?'POS demo started · muffin to register → editable Pixeria content.':'Demo TPV iniciada · muffin a caja → contenido editable de Pixeria.'};}catch{return {ok:false,local:true,message:en?'Could not open the POS demo. Retry Matrix.':'No se pudo abrir la demo TPV. Reintenta Matrix.'};}
  }
  if(command.demo){try{await router?.choose('matrix');if(!globalThis.XpaceStarbucksDemo)throw Error();await globalThis.XpaceStarbucksDemo.setMode(command.demo);if(command.demo==='ia')setScreenDisplayMode('groups');return {ok:true,local:true,message:'Matrix · '+({ia:'Sincro IA / AI sync',christmas:'Navidad / Christmas',linear:'Playlist estándar / Standard playlist'}[command.demo])};}catch{return {ok:false,local:true,message:en?'Could not load the demo. Retry.':'No se pudo cargar la demo. Reintenta.'};}}
  if(command.labels){
    if(command.labels.invalid)return {ok:false,local:true,message:en?'Usage: /layout [on|off] shows screen numbers. /layoiut is also accepted.':'Uso: /layout [on|off] muestra los números de pantalla. También se acepta /layoiut.'};
    try{
      const outcome=await router?.choose('matrix');
      if(!router||outcome?.ok===false||outcome?.cancelled||router.mode!=='matrix'||router.error||router.busy)throw Error();
      const visible=setScreenNumbersVisible(command.labels.visible);
      return {ok:true,local:true,mode:'matrix',screenNumbers:visible,message:(en?'Screen numbers ':'Números de pantalla ')+(visible?'ON':'OFF')+' · '+(en?'From the street entrance: 1–3 group 1; 4 standalone; 5–6 group 2.':'Desde la entrada: 1–3 grupo 1; 4 sola; 5–6 grupo 2.')};
    }catch{return {ok:false,local:true,message:en?'Could not open Matrix. Retry.':'No se pudo abrir Matrix. Reintenta.'};}
  }
  if(command.screen){
    if(command.screen.invalid)return {ok:false,local:true,message:en?'Usage: /sync [on|off], /synctotal. Groups: 1–3 / 4 / 5–6.':'Uso: /sincro [on|off], /sincrototal. Grupos: 1–3 / 4 / 5–6.'};
    if(typeof router?.choose!=='function')return {ok:false,local:true,message:en?'The visual selector is not ready. Retry.':'El selector visual no está listo. Reintenta.'};
    try{
      const outcome=await router.choose('matrix');
      if(outcome?.ok===false||outcome?.cancelled||router.mode!=='matrix'||router.error||router.busy)throw Error('unavailable');
      if(globalThis.XpaceStarbucksDemo?.mode==='ia')await globalThis.XpaceStarbucksDemo.setMode('linear');
      const mode=setScreenDisplayMode(command.screen.mode);
      const label=mode==='total'?(en?'one video across screens 1–6':'un vídeo repartido entre las pantallas 1–6'):mode==='groups'?(en?'one video per group: 1–3 / 4 / 5–6':'un vídeo por grupo: 1–3 / 4 / 5–6'):(en?'full video on each screen':'vídeo completo en cada pantalla');
      return {ok:true,local:true,mode:'matrix',screenLayout:mode,message:'Matrix · Starbucks: '+label+'. '+(en?'Layout saved in this browser; playback continues unchanged.':'Distribución guardada en este navegador; la reproducción mantiene su estado.')};
    }catch{return {ok:false,local:true,message:en?'Could not open Matrix. Retry.':'No se pudo abrir Matrix. Reintenta.'};}
  }
  if(command.announcement){
    const a=command.announcement,label=q=>q==='elevenlabs'?'ElevenLabs':(en?'Standard (macOS Mónica)':'Estándar (Mónica de macOS)');
    if(a.action==='invalid')return {ok:false,local:true,message:en?'Usage: /announcement plays or stops the closing announcement; /announcement standard|elevenlabs picks the voice; /announcement status.':'Uso: /aviso emite o detiene el aviso de cierre; /aviso estandar|elevenlabs elige la voz; /aviso estado.'};
    try{
      const outcome=await router?.choose('matrix');
      if(!router||outcome?.ok===false||outcome?.cancelled||router.mode!=='matrix'||router.error)throw Error();
      const api=globalThis.XpaceStarbucksDemo?.announcement;if(!api)throw Error();
      if(a.action==='quality'){const q=api.setQuality(a.quality);return {ok:!!q,local:true,mode:'matrix',announcementQuality:q,message:(en?'Closing announcement voice: ':'Voz del aviso de cierre: ')+label(q)+'. '+(en?'Saved in this browser. /announcement plays it.':'Guardada en este navegador. /aviso lo emite.')};}
      if(a.action==='status'){const st=api.state();return {ok:true,local:true,mode:'matrix',announcementQuality:st.quality,message:(en?'Closing announcement · voice ':'Aviso de cierre · voz ')+label(st.quality)+' · '+(st.playing||st.pending?(en?'playing':'sonando'):(en?'idle':'en reposo'))+'.'};}
      api.toggle();const st=api.state();
      return {ok:true,local:true,mode:'matrix',announcementQuality:st.quality,message:(st.playing||st.pending?(en?'Closing announcement playing · voice ':'Aviso de cierre sonando · voz '):(en?'Closing announcement stopped · voice ':'Aviso de cierre detenido · voz '))+label(st.quality)+'.'};
    }catch{return {ok:false,local:true,message:en?'The Starbucks Matrix is not ready. Open Matrix and retry.':'El Matrix del Starbucks no está listo. Abre Matrix y reintenta.'};}
  }
  if(command.moving){
    if(typeof moving?.toggle!=='function')return {ok:false,local:true,message:en
      ? 'Moving mode is not ready. Reload the twin and try /mudanza again.'
      : 'El modo mudanza no está listo. Recarga el gemelo y vuelve a escribir /mudanza.'};
    try{
      const active=!!moving.toggle();
      return {ok:true,local:true,moving:active,message:active
        ? (en?'Moving mode ON: the experience now shows only floor and walls. Type /mudanza again to restore every object.':'Mudanza ACTIVADA: la Xperiencia muestra únicamente suelo y paredes. Escribe /mudanza otra vez para recuperar todos los objetos.')
        : (en?'Moving mode OFF: every object has returned to its exact previous position.':'Mudanza DESACTIVADA: todos los objetos han vuelto a su posición anterior exacta.')};
    }catch{
      return {ok:false,local:true,message:en?'Could not change moving mode. Please retry.':'No se pudo cambiar el modo mudanza. Reintenta.'};
    }
  }
  if(command.help)return {ok:!command.invalid,local:true,message:en
    ? 'Local visual styles (Expert CLI or __xtExec): type good, better, best or matrix. Best shows Avenida Admira in layers, with a fixed camera, editable furniture and live visitors. /inventario lists the 43 shared models; use /inventario añadir 1, /inventario eliminar 1 and /inventario deshacer to add, remove and undo. /mudanza toggles an empty floor-and-walls view without changing the real layout. Matrix opens the Starbucks Alsea 360° capture and local screen/player mapping. /layout lets you click devices to edit playlists; Ctrl/Cmd + click selects devices to group. /christmas activates the seasonal playlist; /sync AI plays the six IA clips. /layout toggles screen numbers from the street entrance (6–5 | 4 | 3–2–1 in the wall view). /sync spans groups 1–3 / 4 / 5–6, /synctotal spans all six, /sync off restores individual screens. /mode, 8/16/32 and /mode status are also accepted.'
    : 'Estilos visuales locales (CLI experto o __xtExec): escribe good, better, best o matrix. Best muestra Avenida Admira por capas, con cámara fija, mobiliario editable y visitantes en vivo. /inventario enumera los 43 modelos compartidos; usa /inventario añadir 1, /inventario eliminar 1 y /inventario deshacer. /mudanza alterna una vista vacía de suelo y paredes sin modificar el layout real. Matrix abre la captura 360° del Starbucks Alsea y el mapeo local de pantallas/players. /layout permite pulsar dispositivos para editar playlists; Ctrl/Cmd + clic selecciona varios para unirlos. /navidad activa la playlist estacional; /sincro IA reproduce las seis piezas IA. /layout muestra u oculta números desde la entrada (6–5 | 4 | 3–2–1 mirando la pared). /sincro extiende por grupos 1–3 / 4 / 5–6, /sincrototal entre las seis y /sincro off restaura pantallas individuales. También se aceptan /modo, 8/16/32 y /modo estado.'};
  if(typeof router?.choose!=='function')return {ok:false,local:true,message:en
    ? 'The visual selector is not ready. Try again from Advanced (▤).'
    : 'El selector visual no está listo. Reintenta desde Avanzado (▤).'};
  if(command.status){
    const mode=router.mode,label={good:'Good · 8-bit',better:'Better · 16-bit',best:en?'Best · 32-bit · Avenida Admira · editable furniture and live visitors':'Best · 32-bit · Avenida Admira · mobiliario editable y visitantes en vivo',matrix:en?'Matrix · Starbucks Alsea · 360° capture and local player mapping':'Matrix · Starbucks Alsea · captura 360° y mapeo local de players'}[mode];
    return {ok:!!label&&!router.error,local:true,mode,availability:router.availability,preview:mode==='best'||mode==='matrix',busy:!!router.busy,message:router.error|| (label
      ? (en?'Current local visual mode: ':'Modo visual local actual: ')+label+'.'
      : (en?'The local visual mode is not available.':'El modo visual local no está disponible.'))};
  }
  let outcome;
  try{outcome=await router.choose(command.tier);}catch{
    return {ok:false,local:true,message:en?'Could not change the visual mode. Try again from Advanced (▤).':'No se pudo cambiar el modo visual. Reintenta desde Avanzado (▤).'};
  }
  const mode=router.mode;
  if(outcome?.cancelled)return {ok:false,local:true,mode,requested:command.tier,cancelled:true,message:en
    ? 'This view request was cancelled by a newer selection or a closed view.'
    : 'Esta solicitud de vista se canceló por otra selección o por el cierre de la vista.'};
  if(mode!==command.tier||outcome?.ok===false||router.error)return {ok:false,local:true,mode,requested:command.tier,message:en
    ? 'The requested view could not open. The current twin remains available; try again from Advanced (▤).'
    : 'No se pudo abrir la vista solicitada. El gemelo actual sigue disponible; reintenta desde Avanzado (▤).'};
  if(command.tier==='matrix'){
    if(router.availability!=='preview')return {ok:false,local:true,mode,requested:'matrix',message:en
      ? 'The Matrix preview is not available. Try again from Advanced (▤).'
      : 'La vista previa Matrix no está disponible. Reintenta desde Avanzado (▤).'};
    return {ok:true,local:true,mode,requested:'matrix',availability:'preview',preview:true,busy:!!router.busy,message:en
      ? 'Matrix · Starbucks Alsea: 360° panorama. Recalibrate map lets you mark each screen with four corners, enter its real player ID and preview URL, and save or export a local map. Real player connections are not verified.'
      : 'Matrix · Starbucks Alsea: panorama 360°. Recalibrar mapa permite marcar las cuatro esquinas de cada pantalla, anotar su ID real y URL de vista previa, y guardar o exportar el mapa local. Las conexiones reales no están verificadas.'};
  }
  if(command.tier==='best'){
    if(router.availability!=='preview')return {ok:false,local:true,mode,requested:'best',message:en
      ? 'The Best preview is not available. Interactive Best is still in preparation.'
      : 'La vista previa Best no está disponible. Best interactivo sigue en preparación.'};
    return {ok:true,local:true,mode,requested:'best',availability:'preview',preview:true,busy:!!router.busy,message:en
      ? 'Best · 32-bit: Avenida Admira, fixed camera, editable furniture and live visitors. /inventario lists the 43 shared models. Type good, better or matrix in the Expert CLI to change view.'
      : 'Best · 32-bit: Avenida Admira, cámara fija, mobiliario editable y visitantes en vivo. /inventario enumera los 43 modelos compartidos. Escribe good, better o matrix en el CLI experto para cambiar de vista.'};
  }
  return {ok:true,local:true,mode,availability:router.availability||'interactive',preview:false,busy:!!router.busy,message:mode==='good'
    ? (en?'Good · 8-bit: fused back to the classic twin; HUD and Expert CLI remain in place.':'Good · 8-bit: fusión de vuelta al gemelo clásico; el HUD y el CLI experto permanecen en su sitio.')
    : (en?'Better · 16-bit: fused into the live isometric 3D twin; HUD and Expert CLI remain in place.':'Better · 16-bit: fusión al gemelo 3D isométrico en vivo; el HUD y el CLI experto permanecen en su sitio.')};
}
