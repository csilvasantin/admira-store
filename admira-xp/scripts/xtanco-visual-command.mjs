// Visual modes affect only this browser. This command has no bot, network,
// game-state or legacy /render dependency: the public tier router owns the view.
const aliases=new Map([
  ['good','good'],['8','good'],['8bit','good'],['8-bit','good'],
  ['better','better'],['life','better'],['16','better'],['16bit','better'],['16-bit','better'],
  ['best','best'],['32','best'],['32bit','best'],['32-bit','best'],['hiperrealista','best'],['hyperrealistic','best'],
  ['matrix','matrix']
]);

export function parseVisualCommand(input){
  const text=String(input||'').trim();
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
    ? 'Local visual styles (Expert CLI or __xtExec): type good, better, best or matrix. Matrix shows Avenida Admira in layers, with a fixed camera, editable furniture and live visitors. /inventario lists the 43 shared models; use /inventario añadir 1, /inventario eliminar 1 and /inventario deshacer to add, remove and undo. /mudanza toggles an empty floor-and-walls view without changing the real layout. /mode, 8/16/32 and /mode status are also accepted.'
    : 'Estilos visuales locales (CLI experto o __xtExec): escribe good, better, best o matrix. Matrix muestra Avenida Admira por capas, con cámara fija, mobiliario editable y visitantes en vivo. /inventario enumera los 43 modelos compartidos; usa /inventario añadir 1, /inventario eliminar 1 y /inventario deshacer. /mudanza alterna una vista vacía de suelo y paredes sin modificar el layout real. También se aceptan /modo, 8/16/32 y /modo estado.'};
  if(typeof router?.choose!=='function')return {ok:false,local:true,message:en
    ? 'The visual selector is not ready. Try again from Advanced (▤).'
    : 'El selector visual no está listo. Reintenta desde Avanzado (▤).'};
  if(command.status){
    const mode=router.mode,label={good:'Good · 8-bit',better:'Better · 16-bit',best:en?'Best · 32-bit · live 3D store and people':'Best · 32-bit · tienda y personas en 3D en vivo',matrix:en?'Matrix · Avenida Admira · fixed camera, editable furniture and live visitors':'Matrix · Avenida Admira · cámara fija, mobiliario editable y visitantes en vivo'}[mode];
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
      ? 'Matrix · Avenida Admira: fixed camera, editable furniture and live visitors, synchronized with the same Xtanco. /inventario lists 43 shared models. Use /inventario añadir 1, /inventario eliminar 1 and /inventario deshacer to add, remove and undo. Type good, better or best to change view.'
      : 'Matrix · Avenida Admira: cámara fija, mobiliario editable y visitantes en vivo, sincronizados con el mismo Xtanco. /inventario enumera 43 modelos compartidos. Usa /inventario añadir 1, /inventario eliminar 1 y /inventario deshacer. Escribe good, better o best para cambiar de vista.'};
  }
  if(command.tier==='best'){
    if(router.availability!=='preview')return {ok:false,local:true,mode,requested:'best',message:en
      ? 'The Best preview is not available. Interactive Best is still in preparation.'
      : 'La vista previa Best no está disponible. Best interactivo sigue en preparación.'};
    return {ok:true,local:true,mode,requested:'best',availability:'preview',preview:true,busy:!!router.busy,message:en
      ? 'Best · 32-bit: live 3D store and people, synchronized with the same Xtanco. Type good, better or matrix in the Expert CLI to change view.'
      : 'Best · 32-bit: tienda y personas en 3D en vivo, sincronizadas con el mismo Xtanco. Escribe good, better o matrix en el CLI experto para cambiar de vista.'};
  }
  return {ok:true,local:true,mode,availability:router.availability||'interactive',preview:false,busy:!!router.busy,message:mode==='good'
    ? (en?'Good · 8-bit: fused back to the classic twin; HUD and Expert CLI remain in place.':'Good · 8-bit: fusión de vuelta al gemelo clásico; el HUD y el CLI experto permanecen en su sitio.')
    : (en?'Better · 16-bit: fused into the live isometric 3D twin; HUD and Expert CLI remain in place.':'Better · 16-bit: fusión al gemelo 3D isométrico en vivo; el HUD y el CLI experto permanecen en su sitio.')};
}
