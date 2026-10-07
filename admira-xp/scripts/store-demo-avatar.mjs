import {loadStoreDemoEngine} from './store-demo-bridge.mjs?v=local-autopilot-1';

const AVATAR_ORIGIN='https://digitalavatar.ai';
export function bindStoreDemoAvatar(root=globalThis,{dispatch}={}){
  const doc=root.document;if(!doc||root.__storeDemoAvatarBound)return;
  root.__storeDemoAvatarBound=true;
  const frames=()=>Array.from(doc.querySelectorAll('#da-suite-frame, #starbucks-avatar-wall[data-mode="avatar"] iframe'));
  const active=f=>!f.inert&&(f.closest?.('#da-suite')?.classList.contains('open')??true);
  const owned=f=>{try{return !!f?.contentWindow&&new URL(f.getAttribute('src'),root.location.href).origin===AVATAR_ORIGIN;}catch{return false;}};
  async function catalog(f){
    try{
      const api=await loadStoreDemoEngine(root);await api.listo?.();
      if(!owned(f))return;
      const m=api.subdemos?.();if(!m)return;
      f.contentWindow.postMessage({type:'da-subdemos',plataforma:m.plataforma,nombre:m.nombre||'',subdemos:m.subdemos.map((d,k)=>({n:k+1,id:d.id,nombre:d.nombre,desc:d.desc||'',aliases:(d.aliases||[]).slice()}))},AVATAR_ORIGIN);
    }catch{/* The command dispatcher reports a failed load when a demo is requested. */}
  }
  const requests=new WeakMap();
  const langMessage=(es,en)=>doc.documentElement.lang?.startsWith('en')?en:es;
  function feedback(f,result){
    const host=f.closest?.('#starbucks-avatar-wall')||f.closest?.('#da-suite');
    if(!host)return;
    let note=host.querySelector('.store-demo-avatar-feedback');
    if(!note){note=doc.createElement('pre');note.className='store-demo-avatar-feedback';note.setAttribute('role','status');note.style.cssText='position:relative;z-index:2;white-space:pre-wrap;max-height:35vh;overflow:auto;margin:8px;padding:12px;background:#101820;color:#fff;font:14px/1.5 system-ui;border-radius:8px';host.appendChild(note);}
    note.textContent=result?.message||'';note.hidden=!note.textContent;
  }
  function reply(f,requestId,result){
    if(!requestId||!owned(f))return;
    let snapshot=null;try{const json=JSON.stringify(result?.demo??null);if(new TextEncoder().encode(json).length<=8192)snapshot=JSON.parse(json);}catch{}
    f.contentWindow.postMessage({type:'da-demo-result',requestId,ok:result?.ok===true,message:String(result?.message||'').slice(0,4000),estado:root.AdmiraExperto?.demoEstado?.()||null,result:snapshot},AVATAR_ORIGIN);
  }
  function reveal(f,text,result){
    const arg=text.replace(/^\/?demo(?:@\w+)?\s*/i,'').toLowerCase();
    const control=/^(?:help|ayuda|\?|estado|status|pausa|pause|reanudar|resume|continuar|siguiente|next|parar|stop|off|tpv\s+(?:off|stop|estado|status))$/.test(arg);
    const visual=result?.ok===true&&!control&&(!!result.demo||arg==='tpv'||arg==='');
    if(!visual){feedback(f,result);return;}
    const note=f.closest?.('#starbucks-avatar-wall')?.querySelector('.store-demo-avatar-feedback');if(note)note.hidden=true;
    f.closest?.('#starbucks-avatar-wall')?.querySelector('.matrix-avatar-close')?.click();
    // Native Matrix may itself remain in the top layer. Keep the local rehearsal
    // inside that live dialog so its controls are visible and receive input.
    const panel=doc.querySelector?.('#ax-demo-muestra');
    const modal=Array.from(doc.querySelectorAll('dialog[open]')).find(d=>d.matches?.(':modal'));
    if(panel&&modal&&!modal.contains(panel))modal.appendChild(panel);
  }
  const warmed=new WeakMap();
  function warm(){
    for(const f of frames()){
      const src=f.getAttribute('src');if(!owned(f)||!active(f)||warmed.get(f)===src)continue;
      if(!warmed.has(f))f.addEventListener('load',()=>{if(active(f))void catalog(f);});
      warmed.set(f,src);void catalog(f);
    }
  }
  // Capture runs before the central avatar's bubble fallback, even when that
  // loader was registered earlier. Only the actual owned face can request it.
  root.addEventListener('message',event=>{
    const d=event.data,f=frames().find(face=>event.source===face.contentWindow);
    if(event.origin!==AVATAR_ORIGIN||!owned(f)||!active(f)||!d||d.type!=='da-demo')return;
    let text=typeof d.texto==='string'?d.texto.trim():'';
    if(!text&&typeof d.id==='string'&&/^(?:store\/)?[a-z0-9-]{1,64}$/i.test(d.id))text='/demo '+d.id.replace(/^store\//i,'');
    text=text.replace(/^demo(?=\s|$)/i,'/demo');
    if(!/^\/?demo(?:\s|$)/i.test(text)||text.length>200||/[\r\n]/.test(text))return;
    event.stopImmediatePropagation();
    if(Object.prototype.hasOwnProperty.call(d,'requestId')&&(typeof d.requestId!=='string'||!/^[a-zA-Z0-9_.:-]{1,128}$/.test(d.requestId)))return;
    const requestId=d.requestId||'';
    let seen=requests.get(f);if(!seen){seen=new Map();requests.set(f,seen);}
    if(requestId&&seen.has(requestId)){const prior=seen.get(requestId);if(prior.text!==text)reply(f,requestId,{ok:false,message:'Request ID already used for another command'});else void prior.job.then(result=>reply(f,requestId,result));return;}
    if(requestId&&seen.size>=128){const result={ok:false,message:langMessage('Recarga la página antes de enviar más comandos.','Reload the page before sending more commands.')};reply(f,requestId,result);feedback(f,result);return;}
    // Use the same native dispatcher as the composer, including legacy TPV.
    const job=Promise.resolve(dispatch||import('./xtanco-visual-command.mjs?v=store-local-autopilot-1').then(m=>m.executeVisualCommand)).then(async(executeVisualCommand)=>{
      const router=root.__xtancoVisualTiers,lang=doc.documentElement.lang?.slice(0,2)||'es';
      return await executeVisualCommand(text,{router,lang});
    }).catch(()=>({ok:false,local:true,message:doc.documentElement.lang?.startsWith('en')?'Demo engine unavailable':'Motor de demos no disponible'}));
    if(requestId)seen.set(requestId,{text,job});
    void job.then(result=>{
      reply(f,requestId,result);reveal(f,text,result);
      root.dispatchEvent(new root.CustomEvent('admira:demo-feedback',{detail:result}));
    });
  },true);
  new root.MutationObserver(warm).observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','inert','class','open']});
  warm();
}
if(typeof window!=='undefined')bindStoreDemoAvatar(window);
