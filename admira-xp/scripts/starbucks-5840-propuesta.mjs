// #5840/#5843 · estado vivo PROPUESTO del gemelo Starbucks con la campaña de admira-studio #5839 (Oráculo).
// No escribe nada en ningún sitio: dado el estado de mcp.admira.store/matrix/starbucks devuelve el mismo estado con el
// vertical ES/EN al frente del muro (P1-P6) y del TPV, y el horizontal ES/EN al frente del iPad. Música, controles,
// disposición y el resto de pistas quedan igual, así que el hilo musical sigue sonando con los vídeos (que van mudos).
// La vista previa de la rama lo sirve en lugar del estado vivo; con visto bueno, es lo que hay que aplicar por MCP.
//   node admira-xp/scripts/starbucks-5840-propuesta.mjs estado-vivo.json [base-de-medios] > propuesto.json
import {readFileSync} from 'node:fs';
import {STARBUCKS_5839} from './starbucks-demo.mjs?v=devices-2';
import {validMatrixState} from './matrix-remote.mjs';
export const SBUX_5839_BASE='https://www.admira.store/admira-xp/media/starbucks-5839/';
const IPAD_ID='starbucks-alsea-paseo-de-gracia-ipad';
export function proposeStarbucks5840(state,mediaBase=SBUX_5839_BASE){
 const track=t=>({id:t.id,title:t.title,url:mediaBase+t.url.slice(SBUX_5839_BASE.length),duration:t.duration});
 const vertical=['es-vertical','en-vertical'].map(k=>track(STARBUCKS_5839[k])),horizontal=['es-horizontal','en-horizontal'].map(k=>track(STARBUCKS_5839[k]));
 const nuevos=new Set([...vertical,...horizontal].map(t=>t.id));
 const delante=(playlist,tracks)=>({...playlist,managed:true,tracks:[...tracks,...(playlist?.tracks||[]).filter(t=>!nuevos.has(t.id))]});
 const p=state.playlists;
 return {...state,revision:state.revision+1,previewCommand:null,updatedBy:'propuesta #5840 (admira-studio #5839)',
  playlists:{...p,wall:delante(p.wall,vertical),tpv:delante(p.tpv,vertical),ipad:delante(p.ipad||{id:IPAD_ID},horizontal)}};
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].split('/').pop())){
 const out=proposeStarbucks5840(JSON.parse(readFileSync(process.argv[2],'utf8')),process.argv[3]||SBUX_5839_BASE);
 if(!validMatrixState(out)){console.error('estado propuesto no válido');process.exit(1);}
 process.stdout.write(JSON.stringify(out,null,1)+'\n');
}
