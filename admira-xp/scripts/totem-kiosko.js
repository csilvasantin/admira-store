/* totem-kiosko.js — Quiosco de pedido en el tótem del gemelo (7-oct-2026, Carlos).
 * /totem kiosko · /quiosco   → pin web del tótem (DS_PIN.metahuman) = Xperiencia «Quiosco de pedido»
 * /totem url <https://…>    → cualquier interactivo HTTPS en el tótem (recibe toques: es un iframe)
 * /totem off                → retira el pin (vuelve el tótem a su estado anterior)
 * /totem luna · /totem admiratv [espacio] → atajos a los modos de siempre (/avatar3d on · /admiratv)
 * Los pedidos llegan por postMessage {source:'ainimation-xperiencia', event:'order', order} y se
 * pintan en el panel «Pedidos · TPV». DEMO SIMULADA: sin TPV real ni dinero real. */
(function(){
  'use strict';
  const KIOSK_BASE='https://www.ainimation.studio/xperiencias/kiosko-pedido/';
  const DEFAULT_URL=KIOSK_BASE+'?store=starbucks-paseo-de-gracia&marca=starbucks';
  const en=()=>typeof lang!=='undefined'&&lang==='en';
  const orders=[];
  // Formato del player (7-oct-2026): el iframe del tótem dice a la pieza su forma y su tamaño.
  function formatoDe(w,h){ w=Math.round(+w||0); h=Math.round(+h||0); if(!(w>0&&h>0)) return ''; const ar=w/h; return '&formato='+(ar<0.8?'vertical':ar>1.25?'horizontal':'cuadrado')+'&w='+w+'&h='+h; }
  function kioskUrl(size){
    const l=en()?'en':'es';
    let u=DEFAULT_URL;
    try{ if(!(window.XpaceStarbucks&&window.XpaceStarbucks.active())&&!window.XpaceStarbucksDemo) u=KIOSK_BASE+'?store=xpacio&marca=starbucks'; }catch(_){}
    let f=''; try{ if(size) f=formatoDe(size.w,size.h); else { const t=document.getElementById('totemAvatar'); const r=t&&t.getBoundingClientRect(); f=r&&r.width?formatoDe(r.width,r.height):'&formato=vertical&w=1080&h=1920'; } }catch(_){}
    return u+'&lang='+l+'&host=gemelo'+f;
  }
  // ── Interruptor Tótem (7-oct-2026, Carlos): ON = el player del tótem enseña el interactivo
  // (Starbucks → quiosco de pedido de Paseo de Gracia); OFF = el avatar digital de siempre.
  // Se recuerda en este navegador como los demás interruptores.
  const MODE_KEY='xpace:totem-interactivo', URL_KEY='xpace:totem-url';
  function stored(){ try{ return localStorage.getItem(MODE_KEY)==='on'; }catch(_){ return false; } }
  function storedUrl(){ try{ return localStorage.getItem(URL_KEY)||''; }catch(_){ return ''; } }
  function remember(on,url){ try{ localStorage.setItem(MODE_KEY,on?'on':'off'); if(url) localStorage.setItem(URL_KEY,url); else if(!on) localStorage.removeItem(URL_KEY); }catch(_){} }
  function announce(){ try{ window.dispatchEvent(new CustomEvent('xpace:totem-mode',{detail:{on:stored(),url:storedUrl()}})); }catch(_){} }
  const inMatrix=()=>!!window.XpaceStarbucksDemo;
  function setTotem(on,url){
    remember(!!on,on?(url||''):'');
    // En Matrix · Starbucks el player es la pared junto a la salida (matrix-wall-avatar escucha el evento).
    if(!inMatrix()){ if(on) pin(url||kioskUrl(),url?'Web':(en()?'Ordering kiosk':'Quiosco de pedido')); else unpin(); }
    announce(); return on;
  }
  function pin(url,name){
    if(typeof DS_PIN!=='object'||DS_PIN===null) return false;
    const cur=DS_PIN['metahuman'];
    if(!window.__totemKioskPrev&&!(cur&&cur.kiosk)) window.__totemKioskPrev=cur||null;
    DS_PIN['metahuman']={kind:'web',name:name,src:url,kiosk:true};
    try{ if(typeof emitTotemNow==='function') emitTotemNow(true); }catch(_){}
    try{ if(typeof positionTotemAvatar==='function') positionTotemAvatar(); }catch(_){}
    panel(true); return true;
  }
  function unpin(){
    if(typeof DS_PIN!=='object'||DS_PIN===null) return false;
    const prev=window.__totemKioskPrev; window.__totemKioskPrev=null;
    if(prev) DS_PIN['metahuman']=prev; else { try{ delete DS_PIN['metahuman']; }catch(_){ DS_PIN['metahuman']=null; } }
    try{ if(typeof emitTotemNow==='function') emitTotemNow(true); }catch(_){}
    try{ if(typeof positionTotemAvatar==='function') positionTotemAvatar(); }catch(_){}
    panel(false); try{ touch(false); }catch(_){} return true;
  }
  function kioskOn(){ const p=(typeof DS_PIN==='object'&&DS_PIN)?DS_PIN['metahuman']:null; return !!(p&&p.kiosk); }
  function toast(msg){ try{ if(typeof showEv==='function') showEv(msg,'#00a862'); }catch(_){} }
  function totemCommand(arg){
    const raw=String(arg||'').trim(), a=raw.toLowerCase();
    const parts=raw.split(/\s+/), head=(parts[0]||'').toLowerCase();
    if(!a||a==='kiosko'||a==='quiosco'||a==='kiosk'||a==='on'||a==='interactivo'){
      setTotem(true,'');
      if(inMatrix()||kioskOn()){ toast(en()?'🛒 Kiosk ON · totem':'🛒 Quiosco ON · tótem');
        return {ok:true,message:(en()?'🛒 Ordering kiosk on the totem (simulated demo). Touch it to order. /totem off to remove.':'🛒 Quiosco de pedido en el tótem (demo simulada). Tócalo para pedir. /totem off para quitarlo.')+'\n'+kioskUrl()}; }
      return {ok:false,message:en()?'No totem in this Xpace.':'No hay tótem en este Xpacio.'};
    }
    if(head==='url'){
      const u=parts.slice(1).join(' ');
      let ok=false; try{ ok=new URL(u).protocol==='https:'; }catch(_){}
      if(!ok) return {ok:false,message:en()?'Usage: /totem url https://…':'Uso: /totem url https://…'};
      setTotem(true,u); toast('🌐 '+u.slice(0,60)); return {ok:true,message:'🌐 '+(en()?'Totem → ':'Tótem → ')+u};
    }
    if(a==='off'||a==='stop'||a==='apagar'||a==='avatar digital'){ setTotem(false); return {ok:true,message:en()?'Totem OFF · the player shows the digital avatar.':'Tótem OFF · el player enseña el avatar digital.'}; }
    if(a==='luna'||a==='avatar'){ remember(false); unpin(); announce(); try{ if(typeof setAvatar3dTotem==='function'&&setAvatar3dTotem(true)){ try{emitTotemNow(true);}catch(_){} return {ok:true,message:'🧑‍💻 Luna / Avatar 3D en el tótem.'}; } }catch(_){} return {ok:false,message:'Avatar3D no disponible.'}; }
    if(head==='admiratv'||head==='tv'){ remember(false); unpin(); announce(); try{ return setAdmiraTvCommand(parts.slice(1).join(' ')||'on'); }catch(_){ return {ok:false,message:'admira.tv no disponible.'}; } }
    if(a==='pedidos'||a==='orders'){ panel(true); return {ok:true,message:orders.length+(en()?' orders':' pedidos')}; }
    return {ok:false,message:'/totem on|off · /totem kiosko · /totem url <https> · /totem luna · /totem admiratv · /totem pedidos'};
  }
  // ── panel «Pedidos · TPV» ─────────────────────────────────────────────
  let box=null, btn=null, modal=null, tbtn=null;
  // Vista táctil: el tótem del gemelo mide ~60 px; para TOCARLO se abre a tamaño de pantalla real (9:16).
  function touch(on){ ensure(); const f=modal.querySelector('iframe'); const p=(typeof DS_PIN==='object'&&DS_PIN)?DS_PIN['metahuman']:null;
    if(on&&p&&p.src){ f.src=p.src; modal.classList.add('on'); } else { modal.classList.remove('on'); f.src='about:blank'; } }
  function ensure(){
    if(box) return;
    const css=document.createElement('style');
    css.textContent='#kioskOrders{position:fixed;right:14px;bottom:86px;width:300px;max-height:46vh;overflow:auto;background:#0f1f1a;color:#f2f5f3;border:2px solid #00a862;border-radius:14px;font:13px/1.35 Inter,system-ui,sans-serif;z-index:9000;box-shadow:0 10px 30px rgba(0,0,0,.4);display:none}#kioskOrders.on{display:block}#kioskOrders h4{margin:0;padding:10px 12px;background:#00704a;font-size:14px;display:flex;justify-content:space-between;align-items:center}#kioskOrders h4 small{font-weight:600;opacity:.85}#kioskOrders .o{padding:9px 12px;border-bottom:1px solid #2f4a40}#kioskOrders .o b{font-size:20px;color:#d4b072}#kioskOrders .o i{font-style:normal;float:right;font-size:11px;padding:2px 7px;border-radius:99px;background:#2e5248}#kioskOrders .o i.paid{background:#2f7d4f}#kioskOrders .empty{padding:12px;opacity:.7}#kioskModal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9500;display:none;align-items:center;justify-content:center}#kioskModal.on{display:flex}#kioskModal .wrap{position:relative;height:92vh;aspect-ratio:9/16}#kioskModal iframe{width:100%;height:100%;border:0;border-radius:18px;background:#000;box-shadow:0 20px 60px rgba(0,0,0,.5)}#kioskModal .x{position:absolute;top:-14px;right:-14px;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font:700 20px system-ui;cursor:pointer}#kioskTouch{position:fixed;right:150px;bottom:40px;z-index:9000;background:#d4b072;color:#1e1a12;border:0;border-radius:99px;padding:8px 14px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;display:none}#kioskBtn{position:fixed;right:14px;bottom:40px;z-index:9000;background:#00704a;color:#fff;border:0;border-radius:99px;padding:8px 14px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35)}';
    document.head.appendChild(css);
    box=document.createElement('div'); box.id='kioskOrders'; box.setAttribute('aria-live','polite'); document.body.appendChild(box);
    btn=document.createElement('button'); btn.id='kioskBtn'; btn.type='button';
    btn.addEventListener('click',()=>{ const r=kioskOn()?totemCommand('off'):totemCommand('kiosko'); if(r&&!r.ok) toast(r.message); });
    document.body.appendChild(btn);
    modal=document.createElement('div'); modal.id='kioskModal'; modal.innerHTML='<div class="wrap"><iframe title="Quiosco · tótem" allow="autoplay; fullscreen"></iframe><button class="x" type="button" aria-label="Cerrar">✕</button></div>';
    modal.addEventListener('click',e=>{ if(e.target===modal||e.target.classList.contains('x')) touch(false); });
    document.body.appendChild(modal);
    tbtn=document.createElement('button'); tbtn.id='kioskTouch'; tbtn.type='button'; tbtn.addEventListener('click',()=>touch(true)); document.body.appendChild(tbtn);
    render();
  }
  function render(){
    if(!box) return;
    tbtn.textContent=en()?'👆 Touch the totem':'👆 Tocar el tótem'; tbtn.style.display=kioskOn()?'block':'none';
    btn.textContent=kioskOn()?(en()?'🛒 Kiosk · off':'🛒 Quiosco · quitar'):(en()?'🛒 Kiosk':'🛒 Quiosco');
    box.innerHTML='<h4>'+(en()?'Orders · POS':'Pedidos · TPV')+' <small>DEMO</small></h4>'+(orders.length?orders.slice().reverse().map(o=>{
      const paid=o.status==='paid-simulated';
      return '<div class="o"><i class="'+(paid?'paid':'')+'">'+(paid?(en()?'paid (sim.)':'pagado (sim.)'):(en()?'pay at counter':'paga en barra'))+'</i><b>'+esc(o.number||'—')+'</b> · '+esc(fmt(o.total,o.currency))+'<br>'+(o.lines||[]).map(l=>esc(l.qty+'× '+l.name+(l.options&&l.options.length?' ('+l.options.join(', ')+')':''))).join('<br>')+'</div>';
    }).join(''):'<div class="empty">'+(en()?'No orders yet. Touch the totem to order.':'Sin pedidos. Toca el tótem para pedir.')+'</div>');
  }
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt=(n,c)=>{ try{ return new Intl.NumberFormat(en()?'en-IE':'es-ES',{style:'currency',currency:c||'EUR'}).format(+n||0); }catch(_){ return String(n); } };
  function panel(on){ ensure(); box.classList.toggle('on',!!on); render(); }
  window.addEventListener('message',e=>{
    const d=e.data; if(!d||d.source!=='ainimation-xperiencia'||d.event!=='order'||!d.order) return;
    if(!/^https:\/\/(www\.)?ainimation\.studio$|^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(e.origin)) return;
    const o=d.order; if(orders.some(x=>x.id===o.id)) return;
    orders.push(o); if(orders.length>30) orders.shift();
    panel(true); toast((en()?'🧾 Order ':'🧾 Pedido ')+(o.number||'')+' · '+fmt(o.total,o.currency));
    try{ window.dispatchEvent(new CustomEvent('xpace:kiosk-order',{detail:o})); }catch(_){}
  });
  // ── «say» de Admingo/quiosco (7-oct-2026): el avatar del tótem locuta lo que pide la Xperiencia ──
  // Contrato: {source:'admingo'|'ainimation-xperiencia', type:'say', id, text, lang} SOLO desde ainimation.studio.
  // Respuesta: {type:'say-ack', id, spoken, via}. Sin ack en 500 ms el quiosco usa la voz de su navegador.
  const SAY_ORIGIN=/^https:\/\/(www\.)?ainimation\.studio$/;
  function totemSpeak(text,langTag){
    const t=String(text||'').replace(/\s+/g,' ').trim().slice(0,400); if(!t) return {spoken:false,via:'none'};
    try{ if(typeof showEv==='function') showEv('🗣 '+t.slice(0,90),'#00a862'); }catch(_){}
    let muted=false; try{ muted=(typeof homeMusicMuted!=='undefined')&&homeMusicMuted; }catch(_){}
    // 1) la cara viva (MetaHuman en pared/panel): la misma ruta que las respuestas del avatar
    let face=false; try{ face=!!(window.MH_FACE_ENABLED||((typeof metahumanWallOn==='function')&&metahumanWallOn())); }catch(_){}
    if(face&&typeof mhSayToFace==='function'){ try{ mhSayToFace(t); return {spoken:true,via:'metahuman'}; }catch(_){} }
    if(muted) return {spoken:false,via:'muted'};
    // 2) voz del gemelo: castellano de España (es-ES), como la megafonía local
    try{
      const ss=window.speechSynthesis; if(!ss||typeof window.SpeechSynthesisUtterance!=='function') return {spoken:false,via:'none'};
      const l=/^en/i.test(String(langTag||''))?'en-GB':'es-ES';
      const u=new window.SpeechSynthesisUtterance(t); u.lang=l; u.rate=0.96; u.pitch=1; u.volume=1;
      const vs=ss.getVoices()||[]; const v=vs.find(x=>x.lang===l)||vs.find(x=>(x.lang||'').replace('_','-')===l); if(v) u.voice=v;
      try{ ss.cancel(); }catch(_){} ss.speak(u); return {spoken:true,via:'speech-'+l};
    }catch(_){ return {spoken:false,via:'none'}; }
  }
  window.addEventListener('message',e=>{
    const d=e.data; if(!d||d.type!=='say'||(d.source!=='admingo'&&d.source!=='ainimation-xperiencia')) return;
    if(!SAY_ORIGIN.test(e.origin)) return;
    const r=totemSpeak(d.text,d.lang);
    (window.__totemSaid=window.__totemSaid||[]).push({text:String(d.text||''),lang:d.lang||'es-ES',via:r.via,at:Date.now()});
    try{ e.source&&e.source.postMessage({source:'xpaceos-totem',type:'say-ack',id:d.id,spoken:r.spoken,via:r.via},e.origin); }catch(_){}
  });
  function boot(){ ensure(); setInterval(()=>{ try{ btn.style.display=(kioskOn()||(window.XpaceStarbucks&&window.XpaceStarbucks.active())||new URLSearchParams(location.search).has('kiosko'))?'block':'none'; render(); const t=document.getElementById('totemAvatar'); if(t){ t.style.zIndex=kioskOn()?'60':'6'; t.style.pointerEvents=kioskOn()?'auto':''; } }catch(_){} },1500);
    try{ const q=new URLSearchParams(location.search); if(q.has('kiosko')) setTimeout(()=>totemCommand('kiosko'),2500); else if(stored()) setTimeout(()=>{ setTotem(true,storedUrl()); },2500); }catch(_){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.totemKioskCommand=totemCommand;
  window.XpaceTotem={on:stored,url:()=>storedUrl()||kioskUrl(),kioskUrl:kioskUrl,set:setTotem,formato:formatoDe,key:MODE_KEY};
  window.XpaceTotemKiosk={say:totemSpeak,touch:touch,on:()=>totemCommand('kiosko'),off:()=>totemCommand('off'),orders:()=>orders.slice(),url:kioskUrl};
})();
