/* iPad del mostrador de Starbucks = gestor de colas (7-oct-2026, Carlos). Tres fases: recibido → en preparación → preparado.
 * El dispositivo virtual starbucks-ipad-01 (horizontal, 1024×768) pinta en la escena la pantalla de la cola
 * de ainimation (Admirito + «¡Listo para recoger!» con nombres + «En preparación»). Es una vista previa:
 * al pulsarla se abre en grande la página real https://www.ainimation.studio/cola/ipad.html (4:3), como el
 * avatar y el quiosco del tótem. Un previo arrastrado al iPad (Pixeria) manda sobre la cola.
 * /ipad cola · /ipad off (vuelve a la playlist) · /ipad abrir. Demo: pedidos de ejemplo, pago SIMULADO. */
(function(root){'use strict';const doc=root.document;if(!doc)return;
  const ID='starbucks-ipad-01',KEY='xpace:ipad-cola',RELAY='https://mcp-ainimation.admira.store';
  const store=()=>{try{const q=new URLSearchParams(location.search).get('cola');if(q)return q.replace(/[^a-z0-9-]/g,'').slice(0,80);}catch(_){}return 'starbucks-paseo-de-gracia';};
  const pageUrl=()=>'https://www.ainimation.studio/cola/ipad.html?store='+store();
  // Gestor de colas oficial (Carlos, 7-oct-2026): al tocar el iPad se abre admira.tv/gestorColas (pantalla del iPad + control de barra).
  const GC='https://admira.tv/gestorColas',salaQ=()=>store()==='starbucks-paseo-de-gracia'?'':'&sala='+store();
  const colasUrl=()=>GC+'/pantalla/?marca=starbucks'+salaQ(),controlUrl=()=>GC+'/?marca=starbucks'+salaQ();
  let on=true;try{on=root.localStorage.getItem(KEY)!=='off';}catch(_){}
  let down=null,last=0;const dbg=(how,e,x)=>{try{root.__ipadColaDebug={how,x,t:new Date().toISOString(),at:[e&&e.clientX,e&&e.clientY],top:(doc.elementsFromPoint(e.clientX,e.clientY)||[]).slice(0,4).map(n=>n.tagName+'.'+String(n.className).slice(0,40))};}catch(_){}};
  let data=null,nuevos=new Map(),vistos=null,modal=null;
  // Presentación Alsea (Carlos, 7-oct-2026): el botón «Abrir gestor de colas» no sale por defecto;
  // aparece cuando ya se ha interactuado con el iPad (abierto una vez por toque, doble clic o /ipad abrir).
  let tocado=false;
  const active=()=>{try{return on&&(!!(root.XpaceStarbucks&&root.XpaceStarbucks.active())||!!doc.querySelector('.matrix-landscape-ipad'));}catch(_){return false;}};
  async function tic(){if(!active())return;try{const d=await (await fetch(RELAY+'/cola/estado?store='+store(),{cache:'no-store'})).json();
    const ls=(d.listo||[]).map(p=>p.numero);if(vistos){ls.forEach(n=>{if(!vistos.has(n))nuevos.set(n,Date.now());});}vistos=new Set(ls);data=d;}catch(_){}}
  setInterval(tic,3000);setTimeout(tic,800);
  // Modo demo (Carlos, 7-oct-2026): frases simpáticas en español de España invitando a pedir en el quiosco.
  const FRASES=['¡Hola! Soy Admirito, la nube más cafetera de Paseo de Gracia','¿Un café? Pídelo en el quiosco y te llamo por tu nombre','Hoy el Caffè Latte está de rechupete, ¡palabra de nube!','Toca el quiosco, elige y paga con el móvil: yo te aviso aquí','Si llueve, que sea de cookies','Pide en el quiosco y escribe tu nombre: me encanta decirlo alto','Un cortado, un latte, un té… ¡venga, pide!'];
  const nom=s=>String(s||'').replace(/[^\p{L} '\-]/gu,'').trim().slice(0,14);
  function drawCola(ctx,w,h){
    ctx.save();ctx.fillStyle='#1E3932';ctx.fillRect(0,0,w,h);
    ctx.textBaseline='middle';
    // Admirito (nube) a la izquierda; sin pedidos pendientes hace gracias (modo demo)
    const d0=data||{},demo=!['recibido','preparando','listo'].some(k=>Array.isArray(d0[k])&&d0[k].length),tt=Date.now()/1000,gr=Math.floor(tt/6)%4;
    if(!demo){ctx.fillStyle='#0f2620';ctx.fillRect(0,0,w,70);ctx.fillStyle='#fff';ctx.font='bold 38px Inter,system-ui,sans-serif';ctx.textBaseline='middle';ctx.fillText('☁️ ADMIRITO · COLA',24,36);}
    // The idle canvas uses the complete screen, matching the embedded queue page.
    ctx.save();if(demo){ctx.translate(w*.5,h*.5);const fit=Math.min(w/460,h/430);ctx.scale(fit,fit);ctx.translate(-w*.25,-h*.52);}
    const dy=demo?(gr===0?-Math.abs(Math.sin(tt*4))*40:gr===3?Math.sin(tt*6)*10:0):0,dx=demo&&gr===3?Math.sin(tt*3)*22:0,rot=demo&&gr===1?Math.sin(tt*3)*.14:0,sc=demo&&gr===2?1+Math.abs(Math.sin(tt*4))*.07:1;
    ctx.save();ctx.translate(w*.25+dx,h*.52+dy);ctx.rotate(rot);ctx.scale(sc,sc);ctx.translate(-w*.25,-h*.52);
    const cx=w*.25,cy=h*.52;ctx.fillStyle='#6a9e3f';[[0,0,120],[-95,30,80],[95,30,80],[-50,-60,80],[55,-55,85]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(cx+x,cy+y,r+14,0,7);ctx.fill();});
    ctx.fillStyle='#f3f8ec';[[0,0,120],[-95,30,80],[95,30,80],[-50,-60,80],[55,-55,85]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(cx+x,cy+y,r,0,7);ctx.fill();});
    ctx.fillStyle='#1d2a17';[-45,45].forEach(x=>{ctx.beginPath();ctx.arc(cx+x,cy-5,18,0,7);ctx.fill();});
    ctx.strokeStyle='#1d2a17';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy+30,demo?36:30,.15*Math.PI,.85*Math.PI);ctx.stroke();ctx.restore();ctx.restore();
    if(demo){const f=FRASES[Math.floor(tt/7)%FRASES.length],size=Math.max(16,Math.min(27,w/32));ctx.font='bold '+size+'px Inter,system-ui,sans-serif';const lines=[];let line='';for(const word of f.split(' ')){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>w*.8){lines.push(line);line=word;}else line=next;}lines.push(line);const lh=size*1.3,bh=lines.length*lh+24,by=h-bh-34;ctx.fillStyle='#F2F0EB';ctx.fillRect(w*.08,by,w*.84,bh);ctx.fillStyle='#1E3932';lines.forEach((l,i)=>ctx.fillText(l,w*.1,by+18+lh*(i+.5)));ctx.fillStyle='#FFE58A';ctx.fillRect(0,h-26,w,26);ctx.fillStyle='#3A2E00';ctx.font='bold 17px Inter,system-ui,sans-serif';ctx.fillText('DEMO · pago SIMULADO · toca para abrir el gestor de colas',24,h-13,w-48);ctx.restore();return true;}
    const d=data||{listo:[],preparando:[]},now=Date.now();
    // aviso reciente (12 s)
    const rec=(d.listo||[]).find(p=>nuevos.has(p.numero)&&now-nuevos.get(p.numero)<12000);
    if(rec){ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect?ctx.roundRect(20,h-170,w*.5-30,140,24):ctx.rect(20,h-170,w*.5-30,140);ctx.fill();ctx.fillStyle='#00704A';ctx.font='bold 34px Inter,system-ui,sans-serif';
      ctx.fillText((nom(rec.nombre)||('Pedido '+rec.numero))+',',40,h-128,w*.5-70);ctx.fillStyle='#1E3932';ctx.font='bold 28px Inter,system-ui,sans-serif';ctx.fillText('tu pedido Starbucks',40,h-88,w*.5-70);ctx.fillText('está preparado ☕',40,h-54,w*.5-70);}
    // columnas
    const x0=w*.52;ctx.fillStyle='#9EE6C4';ctx.font='bold 36px Inter,system-ui,sans-serif';ctx.fillText('✅ ¡Preparado!',x0,115);
    let y=170;(d.listo||[]).slice(0,4).forEach(p=>{const nu=nuevos.has(p.numero)&&now-nuevos.get(p.numero)<12000;ctx.fillStyle=nu?'#00A862':'#fff';ctx.fillRect(x0,y-34,w-x0-24,68);
      ctx.fillStyle=nu?'#fff':'#1E3932';ctx.font='900 48px Inter,system-ui,sans-serif';ctx.fillText(p.numero,x0+14,y);ctx.font='bold 30px Inter,system-ui,sans-serif';ctx.fillText(nom(p.nombre),x0+150,y,w-x0-190);y+=82;});
    if(!(d.listo||[]).length){ctx.fillStyle='#ffffff88';ctx.font='28px Inter,system-ui,sans-serif';ctx.fillText('—',x0,170);y=250;}
    ctx.fillStyle='#fff';ctx.font='bold 30px Inter,system-ui,sans-serif';ctx.fillText('⏳ En preparación',x0,Math.max(y,250)+10);
    ctx.font='bold 34px Inter,system-ui,sans-serif';ctx.fillText((d.preparando||[]).slice(0,5).map(p=>p.numero).join('  ')||'—',x0,Math.max(y,250)+62,w-x0-24);
    ctx.fillStyle='#ffffffaa';ctx.font='bold 26px Inter,system-ui,sans-serif';ctx.fillText('🧾 Recibido',x0,Math.max(y,250)+120);ctx.font='bold 30px Inter,system-ui,sans-serif';ctx.fillText((d.recibido||[]).slice(0,5).map(p=>p.numero).join('  ')||'—',x0,Math.max(y,250)+164,w-x0-24);
    ctx.fillStyle='#FFE58A';ctx.fillRect(0,h-26,w,26);ctx.fillStyle='#3A2E00';ctx.font='bold 17px Inter,system-ui,sans-serif';ctx.fillText('DEMO · pago SIMULADO · toca para abrir el gestor de colas',w*.52,h-13);
    ctx.restore();return true;}
  // Engancha el pintado de pantallas: el previo de Pixeria (si lo hay) manda; si no, la cola.
  function hook(){const M=root.XpaceScreenMedia;if(!M||M.__cola)return !!M;const get=M.get,draw=M.draw;
    M.get=id=>get(id)||(id===ID&&active()?{id:'cola-ipad',kind:'web-app',app:'gestorColas',url:colasUrl(),control:controlUrl()}:null);
    M.draw=(ctx,w,h,id)=>draw(ctx,w,h,id)||(id===ID&&active()?drawCola(ctx,w,h):false);M.__cola=true;return true;}
  if(!hook()){const t=setInterval(()=>{if(hook())clearInterval(t);},500);}
  function ensure(){if(modal)return;const css=doc.createElement('style');
    css.textContent='#ipadColaModal{position:fixed;inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:rgba(0,0,0,.6);z-index:2147483000;display:none;align-items:center;justify-content:center}#ipadColaModal.on{display:flex}#ipadColaModal::backdrop{background:transparent}.ipad-cola-hit{position:absolute;inset:0;z-index:50;pointer-events:auto;cursor:pointer;background:transparent}#ipadColaModal .wrap{position:relative;width:min(92vw,calc(88vh*4/3));aspect-ratio:4/3;border:14px solid #111;border-radius:30px;background:#000;box-shadow:0 20px 60px rgba(0,0,0,.5)}#ipadColaModal iframe{width:100%;height:100%;border:0;border-radius:16px;background:#1E3932}#ipadColaModal .bar{position:absolute;left:0;right:0;bottom:-58px;display:flex;gap:10px;justify-content:center}#ipadColaModal .bar a{background:#00704A;color:#fff;font:700 15px system-ui;padding:10px 16px;border-radius:999px;text-decoration:none}#ipadColaModal .bar a.c{background:#fff;color:#1E3932}#ipadColaChip{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:9400;display:none;background:#00704A;color:#fff;border:0;border-radius:999px;padding:9px 16px;font:700 14px system-ui;box-shadow:0 6px 20px rgba(0,0,0,.35);cursor:pointer}#ipadColaChip.on{display:block}#ipadColaModal .x{position:absolute;top:-26px;right:-26px;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font:700 20px system-ui;cursor:pointer}';
    doc.head.appendChild(css);modal=doc.createElement('dialog');modal.id='ipadColaModal';modal.innerHTML='<div class="wrap"><iframe title="iPad del mostrador · gestor de colas" allow="autoplay"></iframe><button class="x" type="button" aria-label="Cerrar">✕</button><div class="bar"><a class="o" target="_blank" rel="noopener">↗ Abrir gestor de colas</a><a class="c" target="_blank" rel="noopener">🎛️ Control de barra</a></div></div>';
    const cerrar=e=>{if(Date.now()-last<400)return;if(e.target===modal||e.target.classList.contains('x')){e.stopPropagation();e.preventDefault();abrir(false);}};modal.addEventListener('pointerup',cerrar);modal.addEventListener('click',cerrar);modal.addEventListener('cancel',e=>{e.preventDefault();abrir(false);});doc.body.appendChild(modal);}
  function abrir(v){ensure();const f=modal.querySelector('iframe');if(v){tocado=true;modal.querySelector('.bar .o').href=colasUrl();modal.querySelector('.bar .c').href=controlUrl();f.src=colasUrl();modal.classList.add('on');try{if(!modal.open)modal.showModal();}catch(_){}}else{modal.classList.remove('on');try{if(modal.open)modal.close();}catch(_){}f.src='about:blank';}}
  // Pulsar el iPad en la escena (clic sin arrastre, fuera de /layout) lo abre en grande.
  const inQuad=(x,y,q)=>{let s=0;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],c=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(c!==0){if(s&&Math.sign(c)!==s)return false;s=Math.sign(c);}}return true;};
  function hit(e){const cv=doc.getElementById('c');if(!cv||!active())return false;const q=root.XpaceStarbucks.screenQuads&&root.XpaceStarbucks.screenQuads[ID];if(!q)return false;
    const r=cv.getBoundingClientRect();return inQuad((e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height,q);}
  // Doble clic en el iPad del mostrador = lo mismo que el tótem: abre la web real (cola/ipad.html) en grande
  // con ampliar/cerrar (✕, clic fuera o Escape). Vale en Good 2D (canvas #c), Better/Best 3D (XpaceSceneScreens)
  // y Matrix · 360 (nodo .matrix-landscape-ipad). En /layout no se intercepta.
  const enLayout=()=>doc.body.classList.contains('device-layout-active')||doc.documentElement.classList.contains('device-layout-active');
  // Hit-test POR COORDENADAS (no por e.target): en Matrix el panorama captura el puntero y en Good/3D
  // hay capas encima del canvas, así que el destino del evento casi nunca es el iPad (r30, Carlos 7-oct).
  function esIpad(e){const x=e.clientX,y=e.clientY;let els=[];try{els=doc.elementsFromPoint(x,y)||[];}catch(_){}
    if(els[0]&&els[0].closest&&els[0].closest('nav,button,a,input,textarea,select,#ipadColaChip,#ipadColaModal'))return false;
    if(els.some(n=>n.closest&&n.closest('.matrix-landscape-ipad')))return true;
    for(const n of doc.querySelectorAll('.matrix-landscape-ipad')){const r=n.getBoundingClientRect();if(r.width&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom&&els.some(el=>el===n.parentElement||(el.contains&&el.contains(n))||(n.parentElement&&n.parentElement.contains(el))))return true;}
    const cv=doc.getElementById('c');if(cv&&els.includes(cv)&&hit(e))return true;
    try{const S=root.XpaceSceneScreens;if(S&&typeof S.screenAt==='function'&&S.screenAt(x,y)===ID)return true;}catch(_){}
    try{const O=root.XpaceOptionsPlayback;if(O&&typeof O.screenAt==='function'&&O.screenAt(x,y)===ID)return true;}catch(_){}
    return false;}
  doc.addEventListener('dblclick',e=>{if(!on||enLayout()||(modal&&modal.classList.contains('on')))return;if(esIpad(e)){e.stopPropagation();e.preventDefault();abrir(true);}},true);
  // Un toque/clic (sin arrastre) basta: Carlos pulsa una vez en el iPad, no hace doble clic.
  const tap=e=>{if(!on||enLayout()||(modal&&modal.classList.contains('on'))||Date.now()-last<600)return;const d=down;if(!d||Math.hypot(e.clientX-d.x,e.clientY-d.y)>8||Date.now()-d.t>700)return;const ok=esIpad(e);if(e.type==='pointerup')dbg(ok?'tap-open':'tap-miss',e);if(ok){last=Date.now();down=null;if(e.type==="click"){e.stopPropagation();e.preventDefault();}abrir(true);}};
  root.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:Date.now()};},true);
  root.addEventListener('pointerup',tap,true);root.addEventListener('click',e=>{if(Date.now()-last<600){e.stopPropagation();e.preventDefault();return;}tap(e);},true);
  // Botón «Abrir gestor de colas»: oculto hasta la primera interacción con el iPad (tocado); luego queda como atajo.
  let chip=null;setInterval(()=>{const a=active()&&!enLayout();if(!chip){if(!a||!doc.body)return;chip=doc.createElement('button');chip.id='ipadColaChip';chip.type='button';chip.textContent='🧾 Abrir gestor de colas';chip.title='iPad del mostrador · admira.tv/gestorColas';chip.addEventListener('click',e=>{e.stopPropagation();abrir(true);});ensure();doc.body.appendChild(chip);}chip.classList.toggle('on',a&&tocado&&!modal.classList.contains('on'));},1000);
  doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal&&modal.classList.contains('on'))abrir(false);});

  // ── Matrix · 360 (7-oct-2026): ahí el iPad es un <div class="matrix-mapped-player matrix-landscape-ipad"> deformado
  // sobre la foto, que no pasa por XpaceScreenMedia (por eso seguía en verde con «iPad»). Si no hay vídeo/imagen de
  // playlist o previo dentro, le metemos la página real de la cola (&escena=1: sin voz propia, habla el gemelo).
  function matrixIpad(){
    const nodes=doc.querySelectorAll('.matrix-landscape-ipad');
    nodes.forEach(node=>{
      let fr=node.querySelector('iframe.ipad-cola-frame');
      const otro=[...node.querySelectorAll('.matrix-player-media')].some(m=>m!==fr&&((m.tagName==='VIDEO'&&(m.currentSrc||m.getAttribute('src')))||m.tagName==='IMG'||(m.tagName==='IFRAME'&&!m.classList.contains('ipad-cola-frame'))));
      if(!on||otro){ if(fr){fr.remove();node.classList.remove('ipad-cola-on');} const hh=node.querySelector('.ipad-cola-hit');if(hh&&!on)hh.remove(); return; }
      if(!fr){ fr=doc.createElement('iframe');fr.className='ipad-cola-frame';fr.title='iPad del mostrador · gestor de colas';fr.setAttribute('tabindex','-1');fr.setAttribute('aria-hidden','true');
        fr.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;background:#1E3932;pointer-events:none;z-index:1';
        fr.src=pageUrl()+'&escena=1&v=ipad-idle-20261007';node.prepend(fr);node.classList.add('ipad-cola-on');
         }
      node.style.pointerEvents=(doc.body.classList.contains('device-layout-active')||doc.documentElement.classList.contains('device-layout-active'))?'':'auto';node.style.cursor='pointer';
      if(on&&!node.querySelector('.ipad-cola-hit')){const h=doc.createElement('div');h.className='ipad-cola-hit';h.title='Toca para abrir el gestor de colas';const go=e=>{if(enLayout())return;e.stopPropagation();e.preventDefault();if(Date.now()-last<600)return;last=Date.now();dbg('matrix-overlay',e);abrir(true);};h.addEventListener('pointerdown',e=>e.stopPropagation());h.addEventListener('pointerup',go);h.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();});node.appendChild(h);}
      const idle=node.querySelector('.matrix-ipad-idle');if(idle)idle.style.display='none';
    });
    try{root.__ipadColaMatrix=nodes.length;}catch(_){}
  }
  setInterval(matrixIpad,1500);
  function command(a){a=String(a||'').trim().toLowerCase();if(!a||a==='cola'||a==='on'){on=true;try{root.localStorage.removeItem(KEY);}catch(_){}return {ok:true,message:'🧾 iPad del mostrador → gestor de colas (Admirito). Tócalo para abrirlo en grande.'};}
    if(a==='off'||a==='playlist'){on=false;setTimeout(matrixIpad,0);try{root.localStorage.setItem(KEY,'off');}catch(_){}return {ok:true,message:'📺 iPad del mostrador → su playlist de vídeo.'};}
    if(a==='abrir'||a==='open'){abrir(true);return {ok:true,message:colasUrl()};}return {ok:false,message:'/ipad cola · /ipad off · /ipad abrir'};}
  root.XpaceIpadCola={id:ID,url:colasUrl,sceneUrl:pageUrl,controlUrl,on:()=>active(),open:()=>abrir(true),close:()=>abrir(false),touched:()=>tocado,command,draw:drawCola,data:()=>data,demo:()=>{const d=data||{};return !['recibido','preparando','listo'].some(k=>Array.isArray(d[k])&&d[k].length);},frases:FRASES};
})(typeof window!=='undefined'?window:globalThis);
