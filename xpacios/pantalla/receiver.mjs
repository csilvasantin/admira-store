import {receiverFor} from '../../admira-xp/scripts/ainimation-receivers.mjs?v=scene-3d-1';
const q=new URLSearchParams(location.search),language=q.get('lang')==='en'?'en':'es',t=(es,en)=>language==='en'?en:es,config=receiverFor(q.get('loc'),q.get('screen'));
document.documentElement.lang=language;document.getElementById('language').value=language;document.getElementById('language-label').textContent=t('Idioma','Language');
document.getElementById('language').onchange=e=>{const u=new URL(location.href);u.searchParams.set('lang',e.target.value);location.href=u.href;};
const status=document.getElementById('receiver-status');
if(config){
 document.title=config.name+' · '+config.label+' · 3D · admira.store';document.getElementById('venue').textContent=config.name+' · '+config.label;
 const frame=document.createElement('iframe');frame.id='twin';frame.title=t('Escena 3D de ','3D scene of ')+config.name;frame.setAttribute('allow','autoplay');
 const target=new URL('/admira-xp/',location.origin);for(const [key,value] of Object.entries({loc:config.location,screen:config.screen,autostart:'xtanco',quality:'better',ainimationScene:'1',lang:language}))target.searchParams.set(key,value);
 if(q.has('ainimation'))target.searchParams.set('ainimation',q.get('ainimation'));
 window.addEventListener('message',event=>{const data=event.data;if(event.origin!==location.origin||event.source!==frame.contentWindow||data?.type!=='ainimation-scene-receiver'||data.location!==config.location||data.screen!==config.screen)return;status.textContent=data.reason==='view-closed'?t('Selecciona Better para volver a la pantalla 3D.','Select Better to return to the 3D screen.'):data.ready?t('Escena 3D · pantalla táctil vinculada. Restaurar recupera su contenido de base.','3D scene · touch screen linked. Restore recovers its base content.'):t('El soporte de esta pantalla no está en la distribución actual. Recupéralo en el editor.','This screen support is missing from the current layout. Restore it in the editor.');});
 status.textContent=t('Cargando la escena 3D de ','Loading the 3D scene of ')+config.name+'…';frame.src=target.href;document.getElementById('scene').append(frame);
}else status.textContent=t('No existe un receptor para esta combinación de Xpacio y pantalla.','No receiver matches this Xpace and screen.');
