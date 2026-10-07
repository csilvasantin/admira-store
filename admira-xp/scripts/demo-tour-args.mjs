// Verbos del registro de demos (demos.json) para /demo, sin dependencias: lo usan el parser síncrono
// (xtanco-visual-command.mjs) y el recorrido (demo-tour.mjs).
export const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function parseTourArg(arg){const a=norm(arg);
 if(!a||['help','ayuda','?','lista','list','menu'].includes(a))return {action:'help'};
 const all=/^(all|todas|todo|tour|recorrido)(?:\s+--?(enviar|send))?$/.exec(a);if(all)return {action:'all',send:!!all[2]};
 if(['next','skip','saltar'].includes(a))return {action:'next'};
 return null;}
