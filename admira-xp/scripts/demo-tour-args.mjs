// Verbos y opciones del registro de demos (demos.json) para /demo, sin dependencias: lo usan el parser síncrono
// (xtanco-visual-command.mjs) y el recorrido (demo-tour.mjs).
// Idioma (Carlos, 8-oct-2026 07:20): /demo all es|en, ESP|ENG (convención /idioma), --idioma es, --lang en.
export const norm=s=>String(s??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function langToken(t){const v=norm(t);return ['es','esp','espanol','castellano','spanish'].includes(v)?'es':['en','eng','ingles','english'].includes(v)?'en':null;}
// Separa --enviar y el idioma del resto: «todas esp --enviar» → {rest:'todas',send:true,lang:'es'}.
export function splitFlags(arg){const words=norm(arg).split(/\s+/).filter(Boolean),rest=[];let send=false,lang=null;
 for(let i=0;i<words.length;i++){const w=words[i];
  if(/^--?(enviar|send)$/.test(w)){send=true;continue;}
  if(/^--?(idioma|lang|language)$/.test(w)&&langToken(words[i+1])){lang=langToken(words[++i]);continue;}
  const eq=/^--?(idioma|lang|language)=(\w+)$/.exec(w);if(eq&&langToken(eq[2])){lang=langToken(eq[2]);continue;}
  if(rest.length&&i===words.length-1||rest.length&&/^--?(enviar|send)$/.test(words[i+1]||'')){const l=langToken(w);if(l){lang=l;continue;}}
  rest.push(w);}
 return {rest:rest.join(' '),send,lang};}
export function parseTourArg(arg){const {rest:a,send,lang}=splitFlags(arg);const extra=o=>lang?{...o,lang}:o;
 if(!a&&!lang&&!send)return {action:'help'};
 if(!a||['help','ayuda','?','lista','list','menu'].includes(a))return send?null:extra({action:'help'});
 // /demo capsula <tipología> <calidad> (10-oct-2026): cápsulas «¿Sabías que…?» (scripts/capsula-demo.mjs).
 const cap=/^(capsulas?|capsules?|sabias(?:\s+que)?|didyouknow)(?:\s+(.*))?$/.exec(a);if(cap&&!send)return extra({action:'capsula',arg:cap[2]||''});
 if(['all','todas','todo','tour','recorrido'].includes(a))return extra({action:'all',send});
 if(['next','skip','saltar'].includes(a))return {action:'next'};
 return null;}
