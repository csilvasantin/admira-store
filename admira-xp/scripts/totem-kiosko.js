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
  // Starbucks: same defaults whatever the entry route (selector, Street View/admira.biz, direct link).
  function isSbux(){ try{ const q=new URLSearchParams(location.search); return q.get('loc')==='alsea-sbux-021'||q.get('project')==='starbucks'||q.get('circuit')==='alsea_starbucks'||!!window.XpaceStarbucks?.active?.(); }catch(_){ return false; } }
  (function normalizeSbux(){ try{ if(!isSbux()) return; const u=new URL(location.href); let ch=false;
    if(!u.searchParams.get('project')){ u.searchParams.set('project','starbucks'); ch=true; }
    if(!u.searchParams.get('circuit')){ u.searchParams.set('circuit','alsea_starbucks'); ch=true; }
    if(ch) history.replaceState(history.state,'',u.toString()); }catch(_){} })();
  // Cada entrada Starbucks empieza en quiosco; el avatar elegido se conserva para activarlo manualmente.
  let starbucksMode=null;
  function stored(){ if(isSbux()) return starbucksMode!==false; try{ const v=localStorage.getItem(MODE_KEY); if(v==='on') return true; if(v==='off') return false; return isSbux(); }catch(_){ return isSbux(); } }
  function storedUrl(){ try{ return localStorage.getItem(URL_KEY)||''; }catch(_){ return ''; } }
  function remember(on,url){ if(isSbux()) starbucksMode=!!on; try{ localStorage.setItem(MODE_KEY,on?'on':'off'); if(url) localStorage.setItem(URL_KEY,url); else if(!on) localStorage.removeItem(URL_KEY); }catch(_){} }
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
    if(a==='reset'||a==='reiniciar'||a==='cero'){ colaReset(); return {ok:true,message:en()?'↺ Queue reset: open orders closed; Admirito goes back to his demo.':'↺ Cola a cero: pedidos abiertos cerrados; Admirito vuelve a su demo.'}; }
    if(head==='audio'||head==='voz'||head==='avisos'){ const v=(parts[1]||'toggle').toLowerCase(), on=/^(on|si|sí|1|activar|unmute)$/.test(v)?true:/^(off|no|0|parar|mute|silencio)$/.test(v)?false:!colaAudioOn(); setColaAudio(on); return {ok:true,message:on?(en()?'🔊 Queue announcements ON':'🔊 Avisos de la cola activados'):(en()?'🔇 Queue announcements OFF':'🔇 Avisos de la cola parados')}; }
    if(a==='menu'||a==='menú'||a==='atajos'){ try{ atajosWin&&atajosWin.open(); }catch(_){} tocado=true; return {ok:true,message:en()?'Queue shortcuts shown.':'Atajos de colas a la vista.'}; }
    return {ok:false,message:'/totem on|off · /totem kiosko · /totem url <https> · /totem luna · /totem admiratv · /totem pedidos · /totem reset · /totem audio on|off · /totem menu'};
  }
  // ── panel «Pedidos · TPV» ─────────────────────────────────────────────
  let box=null, btn=null, modal=null, tbtn=null, atajos=null, atajosWin=null, boxWin=null;
  // Audios de la gestión de colas (Carlos, 7-oct-2026): se pueden parar y volver a activar por si molestan.
  // Afecta a los avisos de pedido listo y a lo que el quiosco pide decir en el gemelo, y a la pantalla del
  // iPad abierta en grande (se le pasa &voz=0). Se recuerda en este navegador. /totem audio on|off.
  const AUDIO_KEY='xpace:cola-audio';
  function colaAudioOn(){ try{ return window.localStorage.getItem(AUDIO_KEY)!=='off'; }catch(_){ return true; } }
  function setColaAudio(on){ on=!!on; try{ if(on) window.localStorage.removeItem(AUDIO_KEY); else window.localStorage.setItem(AUDIO_KEY,'off'); }catch(_){}
    if(!on){ try{ if(vozAudio) vozAudio.pause(); }catch(_){} try{ window.speechSynthesis&&window.speechSynthesis.cancel(); }catch(_){} colaPend.length=0;colaGeneration++; }
    render(); toast(on?(en()?'🔊 Queue announcements ON':'🔊 Avisos de la cola activados'):(en()?'🔇 Queue announcements OFF':'🔇 Avisos de la cola parados'));
    try{ window.dispatchEvent(new CustomEvent('xpace:cola-audio',{detail:{on:on}})); }catch(_){} return on; }
  // Reset de la demo: cierra (recogido) todos los pedidos abiertos de la cola del quiosco y vacía la lista
  // local; con la cola a cero el iPad vuelve solo a Admirito haciendo su demo. La numeración no vuelve a A001
  // (eso exige la clave de servicio del relé, que no vive en el navegador).
  async function colaReset(){ const st=colaStore()||'starbucks-paseo-de-gracia'; let n=0;
    try{ const d=await (await fetch(COLA_RELAY+'/cola/estado?store='+encodeURIComponent(st),{cache:'no-store'})).json();
      const todos=[].concat(d.recibido||[],d.preparando||[],d.listo||[]);
      await Promise.all(todos.map(p=>fetch(COLA_RELAY+'/cola/avanzar?store='+encodeURIComponent(st),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:p.id,numero:p.numero,a:'recogido'})}).then(r=>{ if(r.ok) n++; }).catch(()=>{})));
    }catch(_){}
    orders.length=0; colaPend.length=0;colaGeneration++; try{ window.speechSynthesis&&window.speechSynthesis.cancel(); if(vozAudio) vozAudio.pause(); }catch(_){}
    render(); toast(en()?'↺ Queue reset · '+n+' orders closed':'↺ Cola a cero · '+n+' pedidos cerrados');
    try{ window.dispatchEvent(new CustomEvent('xpace:cola-reset',{detail:{store:st,cerrados:n}})); }catch(_){} return n; }
  // Presentación Alsea (Carlos, 7-oct-2026): los botones flotantes del tótem («🛒 Kiosk/Quiosco» y «👆 Tocar el tótem»)
  // no salen por defecto; aparecen cuando ya se ha interactuado con el tótem (toque en escena, abrirlo en grande o /totem).
  let tocado=false;
  const esTotem=n=>!!(n&&n.closest&&n.closest('#totemAvatar,.matrix-wall-avatar'));
  document.addEventListener('pointerdown',e=>{ if(esTotem(e.target)) tocado=true; },true);
  // Vista táctil: el tótem del gemelo mide ~60 px; para TOCARLO se abre a tamaño de pantalla real (9:16).
  function touch(on){ ensure(); const f=modal.querySelector('iframe'); const p=(typeof DS_PIN==='object'&&DS_PIN)?DS_PIN['metahuman']:null;
    if(on&&p&&p.src){ tocado=true; f.src=p.src; modal.classList.add('on'); } else { modal.classList.remove('on'); f.src='about:blank'; } }
  function ensure(){
    if(box) return;
    const css=document.createElement('style');
    css.textContent='#kioskOrders{position:fixed;right:14px;bottom:86px;width:300px;max-height:46vh;overflow:auto;background:#0f1f1a;color:#f2f5f3;border:2px solid #00a862;border-radius:14px;font:13px/1.35 Inter,system-ui,sans-serif;z-index:9000;box-shadow:0 10px 30px rgba(0,0,0,.4);display:none}#kioskOrders.on{display:block}#kioskOrders h4{margin:0;padding:10px 12px;background:#00704a;font-size:14px;display:flex;justify-content:space-between;align-items:center}#kioskOrders h4 small{font-weight:600;opacity:.85}#kioskOrders h4{gap:6px;cursor:move}#kioskOrders h4 .kt{flex:1}#kioskOrders h4 button{font:700 11px Inter,system-ui,sans-serif;border:0;border-radius:99px;padding:3px 8px;cursor:pointer;background:#ffffff26;color:#fff}#kioskOrders h4 button:hover{background:#ffffff44}#kioskOrders h4 .xp-floating-close{background:transparent;font-size:16px;padding:0 4px}#colaAtajos{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:9400;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:0 8px 8px;background:#0f1f1af2;border:1px solid #00a862;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.4);font:13px Inter,system-ui,sans-serif;color:#f2f5f3}#colaAtajos.vacio,#colaAtajos[hidden]{display:none}#colaAtajos .xp-floating-header{flex:1 0 100%}#colaAtajos>button:not(.xp-floating-close){position:static;transform:none;box-shadow:none}#kioskOrders .o{padding:9px 12px;border-bottom:1px solid #2f4a40}#kioskOrders .o b{font-size:20px;color:#d4b072}#kioskOrders .o i{font-style:normal;float:right;font-size:11px;padding:2px 7px;border-radius:99px;background:#2e5248}#kioskOrders .o i.paid{background:#2f7d4f}#kioskOrders .empty{padding:12px;opacity:.7}#kioskModal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9500;display:none;align-items:center;justify-content:center}#kioskModal.on{display:flex}#kioskModal .wrap{position:relative;height:92vh;aspect-ratio:9/16}#kioskModal iframe{width:100%;height:100%;border:0;border-radius:18px;background:#000;box-shadow:0 20px 60px rgba(0,0,0,.5)}#kioskModal .x{position:absolute;top:-14px;right:-14px;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font:700 20px system-ui;cursor:pointer}#kioskTouch{position:fixed;right:150px;bottom:40px;z-index:9000;background:#d4b072;color:#1e1a12;border:0;border-radius:99px;padding:8px 14px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;display:none}#kioskBtn{display:none;position:fixed;right:14px;bottom:40px;z-index:9000;background:#00704a;color:#fff;border:0;border-radius:99px;padding:8px 14px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35)}';
    document.head.appendChild(css);
    box=document.createElement('div'); box.id='kioskOrders'; document.body.appendChild(box);
    box.innerHTML='<h4><span class="kt"></span><small>DEMO</small><button class="kr" type="button"></button><button class="ka" type="button"></button></h4><div class="kb" aria-live="polite"></div>';
    box.querySelector('.kr').addEventListener('click',e=>{ e.stopPropagation(); colaReset(); });
    box.querySelector('.ka').addEventListener('click',e=>{ e.stopPropagation(); setColaAudio(!colaAudioOn()); });
    // Barra de atajos («Abrir gestor de colas», «Quiosco», «Tocar el tótem»): una ventana como las demás.
    atajos=document.createElement('div'); atajos.id='colaAtajos'; atajos.className='vacio'; document.body.appendChild(atajos);
    window.XpaceColaAtajos={host:atajos};
    btn=document.createElement('button'); btn.id='kioskBtn'; btn.type='button';
    btn.addEventListener('click',()=>{ const r=kioskOn()?totemCommand('off'):totemCommand('kiosko'); if(r&&!r.ok) toast(r.message); });
    atajos.appendChild(btn);
    modal=document.createElement('div'); modal.id='kioskModal'; modal.innerHTML='<div class="wrap"><iframe title="Quiosco · tótem" allow="autoplay; fullscreen"></iframe><button class="x" type="button" aria-label="Cerrar">✕</button></div>';
    modal.addEventListener('click',e=>{ if(e.target===modal||e.target.classList.contains('x')) touch(false); });
    document.body.appendChild(modal);
    tbtn=document.createElement('button'); tbtn.id='kioskTouch'; tbtn.type='button'; tbtn.addEventListener('click',()=>touch(true)); atajos.appendChild(tbtn);
    render();
    // Movibles, redimensionables y con cierre, como el resto de ventanas del gemelo (y en el menú Ventanas).
    import('./floating-panels.mjs?v=windows-menu-1').then(F=>{
      boxWin=F.attachFloatingPanel(box,{label:en()?'Orders · POS':'Pedidos · TPV',handle:box.querySelector('h4'),key:'kiosk-orders',menu:'kiosk-orders',onClose:()=>panel(false),onOpen:()=>panel(true)});
      atajosWin=F.attachFloatingPanel(atajos,{label:en()?'Queues · Kiosk':'Colas · Quiosco',key:'cola-atajos',menu:'cola-atajos'});
    }).catch(()=>{});
  }
  function render(){
    if(!box) return;
    tbtn.textContent=en()?'👆 Touch the totem':'👆 Tocar el tótem'; tbtn.style.display=(kioskOn()&&tocado)?'block':'none';
    btn.textContent=kioskOn()?(en()?'🛒 Kiosk · off':'🛒 Quiosco · quitar'):(en()?'🛒 Kiosk':'🛒 Quiosco');
    box.querySelector('.kt').textContent=en()?'Orders · POS':'Pedidos · TPV';
    const kr=box.querySelector('.kr'),ka=box.querySelector('.ka'),audio=colaAudioOn();
    kr.textContent='↺ Reset'; kr.title=en()?'Reset the kiosk queue to zero (Admirito goes back to his demo)':'Dejar a cero la cola del quiosco (Admirito vuelve a su demo)';
    ka.textContent=audio?'🔊':'🔇'; ka.title=audio?(en()?'Stop the queue announcements':'Parar los avisos de la cola'):(en()?'Turn the queue announcements on':'Activar los avisos de la cola'); ka.setAttribute('aria-pressed',String(audio));
    if(atajos) atajos.classList.toggle('vacio',![].some.call(atajos.querySelectorAll('#kioskBtn,#kioskTouch,#ipadColaChip'),b=>b.id==='ipadColaChip'?b.classList.contains('on'):b.style.display==='block'));
    box.querySelector('.kb').innerHTML=(orders.length?orders.slice().reverse().map(o=>{
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
  function totemSpeak(text,langTag,{queue=false}={}){
    const t=String(text||'').replace(/\s+/g,' ').trim().slice(0,400); if(!t) return {spoken:false,via:'none'};
    try{ if(typeof showEv==='function') showEv('🗣 '+t.slice(0,90),'#00a862'); }catch(_){}
    let muted=false; try{ muted=(typeof homeMusicMuted!=='undefined')&&homeMusicMuted; }catch(_){}
    // /audio mute manda sobre todo, también sobre la cara viva (Carlos, 7-oct-2026).
    if(window.dsMasterMute) return {spoken:false,via:'muted'};
    if(!colaAudioOn()) return {spoken:false,via:'cola-audio-off'};
    // 1) la cara viva (MetaHuman en pared/panel): la misma ruta que las respuestas del avatar
    let face=false; try{ face=!!(window.MH_FACE_ENABLED||((typeof metahumanWallOn==='function')&&metahumanWallOn())); }catch(_){}
    if(!queue&&face&&typeof mhSayToFace==='function'){ try{ mhSayToFace(t); return {spoken:true,via:'metahuman'}; }catch(_){} }
    if(muted&&!queue) return {spoken:false,via:'muted'};
    // 2) voz de Admirito (Carlos, 7-oct-2026): ElevenLabs en castellano vía el proxy mcp-ainimation /voz
    //    (caché por frase, la clave nunca llega aquí). Si falla o tarda >6 s → voz del navegador es-ES.
    if(!/^en/i.test(String(langTag||''))&&elOn()){ const done=elSpeak(t,()=>browserSpeak(t,langTag)); return {spoken:true,via:'elevenlabs',done}; }
    return browserSpeak(t,langTag);
  }
  // Voz por defecto: Santiago (nuzVc5hpXBWZjFEe4izg), la fija el worker /voz.
  const VOZ_URL='https://mcp-ainimation.admira.store/voz'; let vozAudio=null; window.__admiritoVoz=window.__admiritoVoz||[];
  window.addEventListener('xpace:master-mute',e=>{ if(e&&e.detail&&e.detail.muted){ colaGeneration++;colaPend.length=0; try{ if(vozAudio) vozAudio.pause(); }catch(_){} try{ window.speechSynthesis&&window.speechSynthesis.cancel(); }catch(_){} } });
  function elOn(){ try{ const q=new URLSearchParams(location.search); if(q.get('voz_el')==='0') return false; return localStorage.getItem('xpace:voz-admirito')!=='navegador'; }catch(_){ return true; } }
  function elSpeak(t,fallback){
    return new Promise(resolve=>{
      let done=false,tm;const fin=(ok,why)=>{if(done)return;done=true;clearTimeout(tm);window.__admiritoVoz.push({texto:t,via:ok?'elevenlabs':'respaldo',why:why||'',at:Date.now()});if(ok)resolve();else Promise.resolve(fallback()?.done).then(resolve);};
      try{if(vozAudio)vozAudio.pause();try{window.speechSynthesis&&window.speechSynthesis.cancel();}catch(_){}
        let id='';try{id=new URLSearchParams(location.search).get('vozid')||'';}catch(_){}
        const a=vozAudio=new Audio(VOZ_URL+'?texto='+encodeURIComponent(t.slice(0,240))+(id?'&voz='+encodeURIComponent(id):''));
        tm=setTimeout(()=>{a.pause();fin(false,'timeout');},6000);
        a.onplaying=()=>{clearTimeout(tm);window.__admiritoVoz.push({texto:t,via:'elevenlabs-sonando',at:Date.now()});tm=setTimeout(()=>{a.pause();if(!done){done=true;resolve();}},20000);};
        a.onended=()=>fin(true);a.onerror=()=>fin(false,'error');a.play().catch(e=>fin(false,'play:'+(e&&e.name)));
      }catch(_){fin(false,'excepcion');}
    });
  }
  function browserSpeak(t,langTag){
    // voz del gemelo: castellano de España (es-ES), como la megafonía local
    try{
      const ss=window.speechSynthesis; if(!ss||typeof window.SpeechSynthesisUtterance!=='function') return {spoken:false,via:'none'};
      const l=/^en/i.test(String(langTag||''))?'en-GB':'es-ES';
      const u=new window.SpeechSynthesisUtterance(t); u.lang=l; u.rate=0.98; u.pitch=1.3; u.volume=1;
      const vs=ss.getVoices()||[]; const v=vs.find(x=>x.lang===l)||vs.find(x=>(x.lang||'').replace('_','-')===l); if(v) u.voice=v;
      let finish;const done=new Promise(resolve=>{finish=resolve;});const tm=setTimeout(()=>{try{ss.cancel();}catch(_){}finish();},20000);u.onend=u.onerror=()=>{clearTimeout(tm);finish();};
      try{ ss.cancel(); }catch(_){} ss.speak(u); return {spoken:true,via:'speech-'+l,done};
    }catch(_){ return {spoken:false,via:'none'}; }
  }
  window.addEventListener('message',e=>{
    const d=e.data; if(!d||d.type!=='say'||(d.source!=='admingo'&&d.source!=='ainimation-xperiencia')) return;
    if(!SAY_ORIGIN.test(e.origin)) return;
    // La cola del gemelo es el único emisor del aviso listo, incluso con el iPad abierto.
    const owned=!!colaStore()&&/(?:pedido Starbucks est[áa] preparado|Starbucks order is ready)/i.test(String(d.text||''));
    const r=owned?{spoken:true,via:'queue-owner'}:totemSpeak(d.text,d.lang);
    (window.__totemSaid=window.__totemSaid||[]).push({text:String(d.text||''),lang:d.lang||'es-ES',via:r.via,at:Date.now()});
    try{ e.source&&e.source.postMessage({source:'xpaceos-totem',type:'say-ack',id:d.id,spoken:r.spoken,via:r.via},e.origin); }catch(_){}
  });
  // ── Cola de pedidos → Admirito del gemelo (7-oct-2026, Carlos) ──
  // Con Starbucks en escena (o ?cola=<store>) lee /cola/estado del relé de ainimation cada 3 s y, cuando un
  // pedido pasa a «listo», se anuncia una vez en castellano y después una vez en inglés: «NOMBRE, tu pedido Starbucks está preparado»
  // (sin nombre: «Pedido A015, …»). Un único emisor espera el final real de cada voz antes de la siguiente.
  // Los listos que ya había al abrir no se anuncian. Demo: pago SIMULADO. Rastro: window.__gemeloColaAvisos.
  const COLA_RELAY='https://mcp-ainimation.admira.store';
  const colaVistos=new Set(),colaPend=[];let colaPrimera=true,colaHablando=false,colaStoreActual='',colaGeneration=0;
  window.__gemeloColaAvisos=window.__gemeloColaAvisos||[];
  function colaStore(){ try{ const q=new URLSearchParams(location.search).get('cola'); if(q) return q.replace(/[^a-z0-9-]/g,'').slice(0,80); }catch(_){}
    if(isSbux())return 'starbucks-paseo-de-gracia';return ''; }
  function colaTexto(p,language=en()?'en':'es'){const n=String(p.nombre||'').replace(/[^\p{L} '\-]/gu,'').trim().slice(0,24),english=language==='en';
    return n?(english?n+', your Starbucks order is ready':n+', tu pedido Starbucks está preparado'):(english?'Order '+p.numero+', your Starbucks order is ready':'Pedido '+p.numero+', tu pedido Starbucks está preparado');}
  async function colaSiguiente(){if(colaHablando||!colaPend.length)return;colaHablando=true;const generation=colaGeneration;
    try{while(colaPend.length&&generation===colaGeneration){const p=colaPend.shift();for(const language of ['es','en']){if(generation!==colaGeneration||!colaAudioOn()||window.dsMasterMute)break;const t=colaTexto(p,language),langTag=language==='en'?'en-GB':'es-ES';
      const r=totemSpeak(t,langTag,{queue:true});toast('☕ '+t);window.__gemeloColaAvisos.push({id:p.id||p.numero,numero:p.numero,nombre:p.nombre||null,text:t,lang:langTag,via:r.via,at:Date.now()});await r.done;
    }}}finally{colaHablando=false;if(colaPend.length)void colaSiguiente();}}
  async function colaTic(){ const st=colaStore(); if(!st){ colaStoreActual=''; return; }
    if(st!==colaStoreActual){ colaStoreActual=st; colaGeneration++;colaPend.length=0;colaVistos.clear(); colaPrimera=true; }
    try{ const d=await (await fetch(COLA_RELAY+'/cola/estado?store='+encodeURIComponent(st),{cache:'no-store'})).json();
      (d.listo||[]).forEach(p=>{ const key=p.id||p.numero;if(!colaVistos.has(key)){ colaVistos.add(key); if(!colaPrimera) colaPend.push(p); } });
      colaPrimera=false; colaSiguiente(); }catch(_){} }
  setInterval(colaTic,3000);
  function boot(){ ensure(); setInterval(()=>{ try{ if(!tocado&&esTotem(document.activeElement)) tocado=true; /* clic dentro del iframe del tótem = foco */ btn.style.display=(tocado&&(kioskOn()||(window.XpaceStarbucks&&window.XpaceStarbucks.active())||new URLSearchParams(location.search).has('kiosko')))?'block':'none'; render(); const t=document.getElementById('totemAvatar'); if(t){ t.style.zIndex=kioskOn()?'60':'6'; } }catch(_){} },1500);
    try{ const q=new URLSearchParams(location.search); if(q.has('kiosko')) setTimeout(()=>totemCommand('kiosko'),2500); else if(stored()) setTimeout(()=>{ if(stored()) setTotem(true,storedUrl()); },2500); /* si en esos 2,5 s se apagó (Tótem OFF o /avatar <nivel> on), no se vuelve a encender */ }catch(_){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.totemKioskCommand=function(a){ tocado=true; return totemCommand(a); }; // /totem tecleado = interacción
  window.XpaceTotem={on:stored,url:()=>storedUrl()||kioskUrl(),kioskUrl:kioskUrl,set:setTotem,formato:formatoDe,key:MODE_KEY};
  window.XpaceTotemKiosk={touched:()=>tocado,reset:colaReset,audio:colaAudioOn,setAudio:setColaAudio,cola:()=>window.__gemeloColaAvisos.slice(),colaTexto:colaTexto,say:totemSpeak,touch:touch,on:()=>totemCommand('kiosko'),off:()=>totemCommand('off'),orders:()=>orders.slice(),url:kioskUrl};
})();
