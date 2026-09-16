// Visual modes affect only this browser. This command has no bot, network,
// game-state or legacy /render dependency: the public tier router owns the view.
const aliases=new Map([
  ['good','good'],['8','good'],['8bit','good'],['8-bit','good'],
  ['better','better'],['life','better'],['16','better'],['16bit','better'],['16-bit','better'],
  ['best','best'],['32','best'],['32bit','best'],['32-bit','best'],['hiperrealista','best'],['hyperrealistic','best']
]);

export function parseVisualCommand(input){
  const match=String(input||'').trim().match(/^\/?(?:modo|mode)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
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

export async function executeVisualCommand(input,{router,lang='es'}={}){
  const command=parseVisualCommand(input);if(!command)return null;
  const en=lang==='en';
  if(command.help)return {ok:!command.invalid,local:true,message:en
    ? 'Local visual styles (twin console or __xtExec): /mode good · Good 8-bit; /mode better · Better 16-bit (isometric 3D); /mode best · Best 32-bit / hyperrealistic (static preview, not interactive). /modo, 8/16/32 and /mode status are also accepted.'
    : 'Estilos visuales locales (consola del gemelo o __xtExec): /modo good · Good 8-bit; /modo better · Better 16-bit (3D isométrico); /modo best · Best 32-bit / hiperrealista (vista previa estática, no interactiva). También /mode, 8/16/32 y /modo estado.'};
  if(typeof router?.choose!=='function')return {ok:false,local:true,message:en
    ? 'The visual selector is not ready. Try again from Advanced (▤).'
    : 'El selector visual no está listo. Reintenta desde Avanzado (▤).'};
  if(command.status){
    const mode=router.mode,label={good:'Good · 8-bit',better:'Better · 16-bit',best:en?'Best · 32-bit / hyperrealistic · static preview, not interactive':'Best · 32-bit / hiperrealista · vista previa estática, no interactiva'}[mode];
    return {ok:!!label&&!router.error,local:true,mode,availability:router.availability,preview:mode==='best',busy:!!router.busy,message:router.error|| (label
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
  if(command.tier==='best'){
    if(router.availability!=='preview')return {ok:false,local:true,mode,requested:'best',message:en
      ? 'The Best preview is not available. Interactive Best is still in preparation.'
      : 'La vista previa Best no está disponible. Best interactivo sigue en preparación.'};
    return {ok:true,local:true,mode,requested:'best',availability:'preview',preview:true,busy:!!router.busy,message:en
      ? 'Best · 32-bit / hyperrealistic: static conceptual preview, not the interactive twin. Use “Back to Good” to return.'
      : 'Best · 32-bit / hiperrealista: vista previa conceptual estática, no es el gemelo interactivo. Usa «Volver a Good» para regresar.'};
  }
  return {ok:true,local:true,mode,availability:router.availability||'interactive',preview:false,busy:!!router.busy,message:mode==='good'
    ? (en?'Good · 8-bit: back to the classic twin and its controls.':'Good · 8-bit: vuelta al gemelo clásico y sus controles.')
    : (en?'Better · 16-bit: opening the live isometric 3D twin. Use “Back to twin” to return.':'Better · 16-bit: abriendo el gemelo 3D isométrico en vivo. Usa «Volver al gemelo» para regresar.')};
}
