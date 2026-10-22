import {receiverFor} from './ainimation-receivers.mjs?v=scene-3d-1';
export const AINIMATION_API='https://ainimation-interactive-library-preview.csilvasantin.workers.dev/api';
export const AINIMATION_LOCATION='alsea-sbux-021';
export const AINIMATION_SCREEN_IDS=['starbucks-avatar-wall','starbucks-ipad-01'];
export function validateDelivery(data,id,location){
 if(!/^[a-f0-9]{64}$/.test(id)||!(location===AINIMATION_LOCATION?AINIMATION_SCREEN_IDS.includes(data?.destination?.screen?.id):receiverFor(location,data?.destination?.screen?.id))||data?.id!==id||data.destination?.id!==location||data.destination?.kind!=='virtual'||data.destination.screen?.touch!==true||typeof data.title!=='string'||data.title.length>80)throw Error('Entrega o destino no válido / Invalid delivery or destination');
 const url=new URL(data.playerUrl);if(url.href!==AINIMATION_API+'/deliveries/'+id+'/player')throw Error('Player no permitido / Player not allowed');
 return data;
}
export function registerInteractiveScreens({win=window,root,host,blocked=()=>false,focus=()=>{},refocus=false,location=AINIMATION_LOCATION}){
 const doc=root.ownerDocument,t=(es,en)=>doc.documentElement.lang==='en'?en:es;let current;
 function stop(){if(!current)return;current.frame.src='about:blank';current.frame.remove();current.panel.remove();current=null;}
 const registry={has:id=>(location===AINIMATION_LOCATION?AINIMATION_SCREEN_IDS.includes(id):!!receiverFor(location,id))&&!!host(id),stop,show(data){
  validateDelivery(data,data?.id,location);
  const id=data.destination.screen.id,parent=host(id);if(!registry.has(id)||blocked(id))throw Error(t('La pantalla no está disponible o está apagada.','The screen is unavailable or powered off.'));
  stop();const frame=doc.createElement('iframe');frame.title=data.title;frame.src=data.playerUrl;frame.setAttribute('sandbox','allow-scripts');frame.referrerPolicy='no-referrer';frame.dataset.ainimationScreen=id;frame.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;z-index:20;background:#102621;pointer-events:auto';
  const panel=doc.createElement('div');panel.className='ainimation-screen-controls';panel.style.cssText='position:absolute;bottom:16px;left:16px;max-width:calc(100% - 32px);z-index:5000;background:#001d10;color:#b8ee77;border:1px solid #39ff14;padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;font:13px monospace';
  const status=doc.createElement('span');status.setAttribute('role','status');status.textContent=t('En pantalla virtual: ','On virtual screen: ')+data.destination.screen.name+' · '+data.title;
  const enlarge=doc.createElement('button'),restore=doc.createElement('button');enlarge.textContent=t('Abrir pantalla','Open screen');restore.textContent=t('Restaurar pantalla','Restore screen');
  enlarge.onclick=()=>{const d=doc.createElement('dialog'),f=frame.cloneNode(),b=doc.createElement('button');d.style.cssText='position:fixed;inset:0;margin:auto;box-sizing:border-box;width:min(1000px,96vw);height:92svh;padding:12px;background:#001b0d;color:#b8ee77;border:1px solid #39ff14';f.removeAttribute('data-ainimation-screen');f.style.cssText='display:block;width:100%;height:calc(100% - 52px);border:0;background:#102621';b.textContent=t('Cerrar pantalla','Close screen');b.onclick=()=>{d.close();d.remove();};d.addEventListener('cancel',e=>{e.preventDefault();b.click();});d.append(b,f);doc.body.append(d);d.showModal();};
  for(const b of [enlarge,restore])b.style.cssText='min-height:44px;padding:10px;border:1px solid #39ff14;background:#002a13;color:#b8ee77;font:700 13px monospace';restore.onclick=stop;panel.append(status);if(refocus){const focusButton=doc.createElement('button');focusButton.textContent=t('Enfocar en 3D','Focus in 3D');focusButton.style.cssText=enlarge.style.cssText;focusButton.onclick=()=>focus(id);panel.append(focusButton);}panel.append(enlarge,restore);parent.append(frame);root.append(panel);current={frame,panel};focus(id);return{screen:id,virtual:true};
 }};
 win.XpaceAINimation=registry;win.dispatchEvent(new win.Event('xpace:ainimation-ready'));
 return()=>{stop();if(win.XpaceAINimation===registry)delete win.XpaceAINimation;};
}
export async function receiveDelivery(win=window,request=fetch){
 const q=new URLSearchParams(win.location.search),id=q.get('ainimation');if(!id)return;
 const doc=win.document,t=(es,en)=>doc.documentElement.lang==='en'?en:es;
 const d=doc.createElement('dialog');d.style.cssText='position:fixed;inset:0;margin:auto;box-sizing:border-box;width:min(900px,calc(100vw - 24px));height:min(850px,94svh);max-height:94svh;overflow:auto;background:#001b0d;color:#b8ee77;border:1px solid #39ff14;padding:18px;font:15px monospace';d.setAttribute('aria-label',t('Recibir interactivo de AINimation','Receive AINimation interactive'));
 const h=doc.createElement('h2'),status=doc.createElement('p'),frame=doc.createElement('iframe'),apply=doc.createElement('button'),close=doc.createElement('button');h.textContent=t('Interactivo de AINimation','AINimation interactive');status.setAttribute('role','status');status.textContent=t('Cargando la versión…','Loading version…');frame.style.cssText='width:100%;height:50svh;border:1px solid #39ff14;display:none;background:#102621';frame.setAttribute('sandbox','allow-scripts');frame.referrerPolicy='no-referrer';apply.disabled=true;apply.textContent=t('Mostrar en esta pantalla','Show on this screen');close.textContent=t('Cancelar','Cancel');for(const b of [apply,close])b.style.cssText='min-height:44px;padding:12px;margin:10px 8px 0 0;border:1px solid #39ff14;background:#002a13;color:#b8ee77;font:700 14px monospace;max-width:100%';d.append(h,status,frame,apply,close);doc.body.append(d);d.showModal();
 let data;const ready=()=>{apply.disabled=!data||!win.XpaceAINimation?.has(data.destination.screen.id);};win.addEventListener('xpace:ainimation-ready',ready);
 function hide(){win.removeEventListener('xpace:ainimation-ready',ready);frame.src='about:blank';d.close();d.remove();}
 close.onclick=hide;d.addEventListener('cancel',e=>{e.preventDefault();hide();});
 try{if(!/^[a-f0-9]{64}$/.test(id))throw Error(t('Enlace no válido','Invalid link'));const r=await request(AINIMATION_API+'/deliveries/'+id,{signal:AbortSignal.timeout(30000),credentials:'omit',referrerPolicy:'no-referrer'});if(!r.ok)throw Error(t('No se pudo recuperar el envío.','Could not retrieve delivery.'));data=validateDelivery(await r.json(),id,q.get('loc'));if(q.has('screen')&&q.get('screen')!==data.destination.screen.id)throw Error(t('La pantalla del enlace no coincide con el envío.','The link screen does not match the delivery.'));h.textContent=data.title;status.textContent=data.destination.name+' · '+data.destination.screen.name+'. '+t('Revisa el recorrido. Al mostrarlo, Restaurar pantalla recupera la programación anterior.','Review the journey. After displaying it, Restore screen reveals the previous schedule.');frame.title=data.title;frame.src=data.playerUrl;frame.style.display='block';ready();
  apply.onclick=()=>{try{win.XpaceAINimation.show(data);hide();}catch(error){status.textContent=error.message;}};
 }catch(error){status.textContent=error.message;}
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
 const start=()=>{if(new URLSearchParams(window.location.search).get('ainimationScene')==='1'&&!window.XpaceAINimation)window.addEventListener('xpace:ainimation-ready',()=>void receiveDelivery(),{once:true});else void receiveDelivery();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
