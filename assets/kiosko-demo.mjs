import {runTazaDemo} from './taza-demo.mjs?v=twin-20261007';
const STORE='starbucks-paseo-de-gracia',RELAY='https://mcp-ainimation.admira.store';
let cleanup;
export async function runKioskoDemo(args='',lang='es'){
 const en=lang==='en';
 if(/^(cerrar|close|off|stop)$/i.test(args)){cleanup?.();return en?'Kiosk demo closed.':'Demo kiosko cerrada.';}
 if(args)return en?'Use /demo kiosko or /demo kiosko close.':'Usa /demo kiosko o /demo kiosko cerrar.';
 if(document.getElementById('kiosko-demo'))return en?'Kiosk demo already open.':'La demo kiosko ya está abierta.';
 const response=await fetch('https://ainimation.studio/taza/api/store-binding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storeId:'starbucks-queue',screen:''})});
 const binding=await response.json();if(!response.ok||!binding.ok)throw Error('PlayerTaza: asociación no disponible');
 runTazaDemo('taza',lang);
 const box=document.createElement('section');box.id='kiosko-demo';box.setAttribute('aria-label',en?'Kiosk demo':'Demo kiosko');
 box.style.cssText='position:fixed;inset:55px 380px 20px 12px;min-width:300px;z-index:2147482900;background:#10231e;color:white;border:2px solid #00a862;border-radius:12px;display:flex;flex-direction:column;font:14px system-ui;overflow:auto';
 const bar=document.createElement('div');bar.style.cssText='padding:12px';
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent=en?'1. Choose a drink, enter your name, and confirm simulated payment (tap QR). No charge.':'1. Elige una bebida, escribe tu nombre y confirma el pago simulado tocando el QR. Sin cobro.';
 const controls=document.createElement('div');const close=document.createElement('button');close.textContent=en?'Close demo ×':'Cerrar demo ×';
 const queue=document.createElement('a');queue.href='https://admira.tv/gestorColas/?store='+STORE;queue.target='_blank';queue.rel='noopener';queue.textContent=en?'Open queue manager ↗':'Abrir gestor de colas ↗';queue.style.cssText='color:#90ffcf;margin:12px';
 const prep=document.createElement('button'),ready=document.createElement('button');prep.textContent=en?'2. Prepare my order':'2. Preparar mi pedido';ready.textContent=en?'3. Ready · check mug':'3. Listo · comprobar taza';prep.disabled=ready.disabled=true;
 controls.append(close,queue,prep,ready);bar.append(controls,status);
 const frame=document.createElement('iframe');frame.title=en?'Ordering kiosk · simulated payment':'Quiosco de pedido · pago simulado';frame.allow='autoplay';frame.src='https://www.ainimation.studio/xperiencias/kiosko-pedido/?store='+STORE+'&marca=starbucks&demo=order-message-v2&lang='+lang;frame.style.cssText='border:0;flex:1;min-height:500px;width:100%;background:#fff';box.append(bar,frame);document.body.append(box);
 let order=null,alive=true;
 async function advance(a){if(!order||!alive)return;prep.disabled=ready.disabled=true;try{
  const r=await fetch(RELAY+'/cola/avanzar?store='+STORE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:order.id,a})});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Queue unavailable');
  status.textContent=order.number+' · '+(order.customerName||'')+' · '+(a==='listo'?(en?'Ready. Check your name + LISTO on the physical mug. Keep PlayerTaza open.':'Listo. Comprueba tu nombre + LISTO en la taza física. Mantén PlayerTaza abierto.'):(en?'Preparing. Press Ready when finished.':'En preparación. Pulsa Listo al terminar.'));ready.disabled=a==='listo';
 }catch(e){status.textContent=e.message;prep.disabled=ready.disabled=false;}}
 const receive=e=>{const d=e.data;if(!alive||e.source!==frame.contentWindow||!['https://www.ainimation.studio','https://ainimation.studio'].includes(e.origin)||d?.source!=='ainimation-xperiencia'||d.event!=='order'||!d.order?.id)return;
  order=d.order;status.textContent=(en?'Order received: ':'Pedido recibido: ')+order.number+' · '+(order.customerName||'')+(en?'. Check the queue manager, then Prepare.':'. Comprueba el gestor de colas y pulsa Preparar.');prep.disabled=false;ready.disabled=true;};
 window.addEventListener('message',receive);prep.onclick=()=>advance('preparando');ready.onclick=()=>advance('listo');
 cleanup=()=>{alive=false;window.removeEventListener('message',receive);box.remove();cleanup=null;};close.onclick=cleanup;
 return en?'Guided kiosk demo opened: order → simulated payment → queue → mug.':'Demo kiosko abierta: pedido → pago simulado → cola → taza.';
}
