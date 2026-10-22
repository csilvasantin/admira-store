import {receiverFor} from '../../admira-xp/scripts/ainimation-receivers.mjs?v=five-touch-1';
import {registerInteractiveScreens} from '../../admira-xp/scripts/ainimation-delivery.mjs?v=five-touch-1';
const q=new URLSearchParams(location.search),language=q.get('lang')==='en'?'en':'es',t=(es,en)=>language==='en'?en:es,config=receiverFor(q.get('loc'),q.get('screen'));
document.documentElement.lang=language;document.getElementById('language').value=language;
document.getElementById('language').onchange=e=>{const u=new URL(location.href);u.searchParams.set('lang',e.target.value);location.href=u.href;};
if(config){
 document.title=config.name+' · '+config.label+' · admira.store';document.getElementById('venue').textContent=config.name;document.getElementById('screen-label').textContent=config.label;
 document.getElementById('identity').textContent=config.screen;document.getElementById('kind').textContent=t('Pantalla virtual · táctil','Virtual touch screen');
 const display=document.getElementById('display');display.dataset.orientation=config.orientation;display.dataset.receiverScreen=config.screen;display.setAttribute('aria-label',config.name+' · '+config.label);
 document.getElementById('empty-title').textContent=t('Sin contenido asignado','No content assigned');document.getElementById('empty-copy').textContent=t('Esta pantalla virtual está preparada para recibir un interactivo.','This virtual screen is ready to receive an interactive.');
 document.getElementById('receiver-status').textContent=t('Receptor conectado. Restaurar pantalla vuelve a este estado.','Receiver connected. Restore screen returns to this state.');
 const dispose=registerInteractiveScreens({root:document.querySelector('main'),host:id=>id===config.screen?display:null,location:config.location});window.addEventListener('pagehide',dispose,{once:true});
}else{
 document.getElementById('receiver-status').textContent=t('No existe un receptor para esta combinación de Xpacio y pantalla.','No receiver matches this Xpace and screen.');document.getElementById('display').hidden=true;
}
