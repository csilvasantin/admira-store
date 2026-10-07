import {quadTransform} from './matrix-mapping.mjs?v=wall-1';
// Body zones calibrated in the same 360° capture as the wall players; TL/TR/BR/BL.
export const PEOPLE=Object.freeze([
 {voice:'male',corners:[{yaw:57.221129,pitch:5.718988},{yaw:49.532582,pitch:6.322304},{yaw:48.584135,pitch:-3.070109},{yaw:56.190591,pitch:-2.788450}]},
 {voice:'female',corners:[{yaw:64.508346,pitch:3.688911},{yaw:59.816657,pitch:4.011151},{yaw:58.630058,pitch:-5.263250},{yaw:63.322456,pitch:-4.857706}]}
]);
export function mountPersonAnnouncements(surface,{status,onBeforePlay=()=>{}}={}){
 const doc=surface.ownerDocument,win=doc.defaultView||globalThis;let revision=0,active='',disposed=false;
 const t=(es,en)=>doc.documentElement.lang==='en'?en:es,lang=()=>doc.documentElement.lang==='en'?'en':'es';
 const buttons=PEOPLE.map(person=>{const b=doc.createElement('button');b.type='button';b.className='matrix-person-announcement';b.dataset.personVoice=person.voice;b.hidden=true;surface.append(b);
  for(const type of ['pointerdown','pointerup','wheel','keydown'])b.addEventListener(type,e=>e.stopPropagation());
  b.addEventListener('click',async e=>{e.stopPropagation();if(active===person.voice){revision++;win.XpaceAnnouncements?.stopStock();active='';render();status.textContent=t('Locución detenida','Voiceover stopped');return;}
   const ticket=++revision;win.XpaceAnnouncements?.stop();active=person.voice;render();const language=lang(),name=win.XpaceVoiceReceipts?.VOICES[language][person.voice].name||person.voice;
   status.textContent=t('Buscando última locución · ','Loading latest voiceover · ')+name;
   try{const receipt=await win.XpaceVoiceReceipts?.latest(person.voice,language);if(disposed||ticket!==revision)return;
    if(!receipt){active='';render();status.textContent=t('Crea primero una locución con ','First create a voiceover with ')+name;return;}
    if(!win.XpaceAnnouncements?.playStock)throw Error('player_unavailable');onBeforePlay();
    win.XpaceAnnouncements.playStock(receipt.url,receipt.title,{language,onState(s){if(disposed||ticket!==revision)return;const ended=['done','stopped','error'].includes(s.phase);if(ended){active='';render();}status.textContent=s.phase==='error'?t('No se pudo reproducir · ','Playback failed · ')+name:s.phase==='done'?t('Locución completada · ','Voiceover complete · ')+name:s.phase==='stopped'?t('Locución detenida · ','Voiceover stopped · ')+name:t('Emitiendo · ','Playing · ')+name;}});
   }catch(_){if(disposed||ticket!==revision)return;active='';render();status.textContent=t('No se pudo recuperar la locución · ','Could not load the voiceover · ')+name;}
  });return {person,button:b};});
 function render(){for(const {person,button}of buttons){const name=win.XpaceVoiceReceipts?.VOICES[lang()][person.voice].name||person.voice;const text=(active===person.voice?t('Detener locución · ','Stop voiceover · '):t('Emitir última locución · ','Play latest voiceover · '))+name;button.title=text;button.setAttribute('aria-label',text);button.setAttribute('aria-pressed',String(active===person.voice));button.dataset.voiceName=name;}}
 const observer=new win.MutationObserver(()=>{revision++;if(active)win.XpaceAnnouncements?.stopStock();active='';status.textContent='';render();});observer.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});render();
 return {draw(project,marking){for(const {person,button}of buttons){const pts=person.corners.map(project),matrix=pts.every(Boolean)&&quadTransform(pts,120,160);button.hidden=!matrix||!!marking;if(matrix)button.style.transform='matrix3d('+matrix.join(',')+')';}},dispose(){disposed=true;revision++;if(active)win.XpaceAnnouncements?.stopStock();observer.disconnect();for(const {button}of buttons)button.remove();}};
}
