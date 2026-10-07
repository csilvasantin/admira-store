// Only prepared local rehearsals. The native CLI keeps ownership of its log,
// history, white label and physical controls; the shared engine owns /demo.
export const STORE_DEMO_ENGINE_URL='https://www.admiranext.com/suite/experto.js';
let loading;
function ready(root){return typeof root.AdmiraExperto?.demo==='function'&&typeof root.AdmiraExperto?.demoEstado==='function';}
export function hasStoreRehearsal(root=globalThis){return !!root.AdmiraExperto?.demoEstado?.().activo;}
export function loadStoreDemoEngine(root=globalThis){
  if(ready(root))return Promise.resolve(root.AdmiraExperto);
  if(loading)return loading;
  if(!root.document)return Promise.reject(Error('demo engine unavailable'));
  loading=new Promise((resolve,reject)=>{
    const script=root.document.createElement('script');
    // A fresh query avoids receiving the previous catalog-only engine from CDN.
    script.src=STORE_DEMO_ENGINE_URL+'?v=store-local-autopilot-1-'+Date.now();
    script.dataset.pata='admira.store';script.dataset.cli='admira.store';
    // Use the public demo API without binding a second CLI or changing the HUD.
    script.dataset.panel='#store-demo-engine';script.dataset.toggle='';script.dataset.dock='off';
    const fail=()=>{clearTimeout(timeout);script.remove();reject(Error('demo engine unavailable'));};
    const timeout=setTimeout(fail,12000);
    script.onerror=fail;
    script.onload=()=>{clearTimeout(timeout);if(ready(root))resolve(root.AdmiraExperto);else fail();};
    root.document.head.appendChild(script);
  }).catch(error=>{loading=null;throw error;});
  return loading;
}
export async function runStoreDemo(text,{lang='es',root=globalThis}={}){
  const en=lang==='en';
  try{
    const api=await loadStoreDemoEngine(root);await api.listo?.();
    // Switching to a management rehearsal stops any native muffin journey.
    const controls=/^\/demo\s+(?:pausa|pause|reanudar|resume|continuar|siguiente|next|parar|stop|off|estado|status)$/i;
    if(/\/(?:demo)\s+(?:pausa|pause|reanudar|resume|continuar)$/i.test(text)&&!hasStoreRehearsal(root))
      return {ok:false,local:true,message:en?'No management rehearsal is running. The native /demo tpv journey supports status and stop, without pause/resume.':'No hay un ensayo de gestión en curso. El recorrido nativo /demo tpv admite estado y stop, sin pausa/reanudación.'};
    const log=root.document.createElement('ul');
    const result=api.demo(text,log);
    const native=root.XpacePOSExperience?.demo;
    const nativeState=native?.state?.();
    if(result&&!controls.test(text)&&(nativeState?.running||nativeState?.song))native.stop();
    if(!result&&!log.children.length)throw Error('unrecognized demo');
    return {ok:!log.querySelector('.err'),local:true,demo:result,
      message:Array.from(log.children,el=>el.textContent).join('\n')||JSON.stringify(result)};
  }catch{
    return {ok:false,local:true,message:en?'The local demo engine could not load. Retry /demo help; no sale or broadcast was performed.':'No se pudo cargar el motor de demos locales. Reintenta /demo help; no se realizó ninguna venta ni emisión.'};
  }
}
