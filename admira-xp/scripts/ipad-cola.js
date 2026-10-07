/* iPad del mostrador de Starbucks = gestor de colas (7-oct-2026, Carlos).
 * El dispositivo virtual starbucks-ipad-01 (horizontal, 1024×768) pinta en la escena la pantalla de la cola
 * de ainimation (Admirito + «¡Listo para recoger!» con nombres + «En preparación»). Es una vista previa:
 * al pulsarla se abre en grande la página real https://www.ainimation.studio/cola/ipad.html (4:3), como el
 * avatar y el quiosco del tótem. Un previo arrastrado al iPad (Pixeria) manda sobre la cola.
 * /ipad cola · /ipad off (vuelve a la playlist) · /ipad abrir. Demo: pedidos de ejemplo, pago SIMULADO. */
(function(root){'use strict';const doc=root.document;if(!doc)return;
  const ID='starbucks-ipad-01',KEY='xpace:ipad-cola',RELAY='https://mcp-ainimation.admira.store';
  const store=()=>{try{const q=new URLSearchParams(location.search).get('cola');if(q)return q.replace(/[^a-z0-9-]/g,'').slice(0,80);}catch(_){}return 'starbucks-paseo-de-gracia';};
  const pageUrl=()=>'https://www.ainimation.studio/cola/ipad.html?store='+store();
  let on=true;try{on=root.localStorage.getItem(KEY)!=='off';}catch(_){}
  let data=null,nuevos=new Map(),vistos=null,modal=null;
  const active=()=>{try{return on&&(!!(root.XpaceStarbucks&&root.XpaceStarbucks.active())||!!doc.querySelector('.matrix-landscape-ipad'));}catch(_){return false;}};
  async function tic(){if(!active())return;try{const d=await (await fetch(RELAY+'/cola/estado?store='+store(),{cache:'no-store'})).json();
    const ls=(d.listo||[]).map(p=>p.numero);if(vistos){ls.forEach(n=>{if(!vistos.has(n))nuevos.set(n,Date.now());});}vistos=new Set(ls);data=d;}catch(_){}}
  setInterval(tic,3000);setTimeout(tic,800);
  // Modo demo (Carlos, 7-oct-2026): frases simpáticas en español de España invitando a pedir en el quiosco.
  const FRASES=['¡Hola! Soy Admirito, la nube más cafetera de Paseo de Gracia','¿Un café? Pídelo en el quiosco y te llamo por tu nombre','Hoy el Caffè Latte está de rechupete, ¡palabra de nube!','Toca el quiosco, elige y paga con el móvil: yo te aviso aquí','Si llueve, que sea de cookies','Pide en el quiosco y escribe tu nombre: me encanta decirlo alto','Un cortado, un latte, un té… ¡venga, pide!'];
  const nom=s=>String(s||'').replace(/[^\p{L} '\-]/gu,'').trim().slice(0,14);
  function drawCola(ctx,w,h){
    ctx.save();ctx.fillStyle='#1E3932';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#0f2620';ctx.fillRect(0,0,w,70);ctx.fillStyle='#fff';ctx.font='bold 38px Inter,system-ui,sans-serif';ctx.textBaseline='middle';ctx.fillText('☁️ ADMIRITO · COLA',24,36);
    // Admirito (nube) a la izquierda; sin pedidos pendientes hace gracias (modo demo)
    const d0=data||{listo:[],preparando:[]},demo=!((d0.listo||[]).length||(d0.preparando||[]).length),tt=Date.now()/1000,gr=Math.floor(tt/6)%4;
    const dy=demo?(gr===0?-Math.abs(Math.sin(tt*4))*40:gr===3?Math.sin(tt*6)*10:0):0,dx=demo&&gr===3?Math.sin(tt*3)*22:0,rot=demo&&gr===1?Math.sin(tt*3)*.14:0,sc=demo&&gr===2?1+Math.abs(Math.sin(tt*4))*.07:1;
    ctx.save();ctx.translate(w*.25+dx,h*.52+dy);ctx.rotate(rot);ctx.scale(sc,sc);ctx.translate(-w*.25,-h*.52);
    const cx=w*.25,cy=h*.52;ctx.fillStyle='#6a9e3f';[[0,0,120],[-95,30,80],[95,30,80],[-50,-60,80],[55,-55,85]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(cx+x,cy+y,r+14,0,7);ctx.fill();});
    ctx.fillStyle='#f3f8ec';[[0,0,120],[-95,30,80],[95,30,80],[-50,-60,80],[55,-55,85]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(cx+x,cy+y,r,0,7);ctx.fill();});
    ctx.fillStyle='#1d2a17';[-45,45].forEach(x=>{ctx.beginPath();ctx.arc(cx+x,cy-5,18,0,7);ctx.fill();});
    ctx.strokeStyle='#1d2a17';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy+30,demo?36:30,.15*Math.PI,.85*Math.PI);ctx.stroke();ctx.restore();
    const d=data||{listo:[],preparando:[]},now=Date.now();
    // aviso reciente (12 s)
    const rec=(d.listo||[]).find(p=>nuevos.has(p.numero)&&now-nuevos.get(p.numero)<12000);
    if(rec){ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect?ctx.roundRect(20,h-170,w*.5-30,140,24):ctx.rect(20,h-170,w*.5-30,140);ctx.fill();ctx.fillStyle='#00704A';ctx.font='bold 34px Inter,system-ui,sans-serif';
      ctx.fillText((nom(rec.nombre)||('Pedido '+rec.numero))+',',40,h-128,w*.5-70);ctx.fillStyle='#1E3932';ctx.font='bold 28px Inter,system-ui,sans-serif';ctx.fillText('tu pedido Starbucks',40,h-88,w*.5-70);ctx.fillText('está preparado ☕',40,h-54,w*.5-70);}
    else if(demo){const f=FRASES[Math.floor(tt/7)%FRASES.length];ctx.fillStyle='#F2F0EB';ctx.beginPath();ctx.roundRect?ctx.roundRect(20,h-190,w*.5-30,160,24):ctx.rect(20,h-190,w*.5-30,160);ctx.fill();
      ctx.fillStyle='#1E3932';ctx.font='bold 27px Inter,system-ui,sans-serif';const ws=f.split(' ');let ln='',yy=h-152;for(const wd of ws){const tst=ln?ln+' '+wd:wd;if(ctx.measureText(tst).width>w*.5-80&&ln){ctx.fillText(ln,40,yy);ln=wd;yy+=36;}else ln=tst;}ctx.fillText(ln,40,yy);}
    // columnas
    const x0=w*.52;ctx.fillStyle='#9EE6C4';ctx.font='bold 36px Inter,system-ui,sans-serif';ctx.fillText('✅ ¡Listo!',x0,115);
    let y=170;(d.listo||[]).slice(0,4).forEach(p=>{const nu=nuevos.has(p.numero)&&now-nuevos.get(p.numero)<12000;ctx.fillStyle=nu?'#00A862':'#fff';ctx.fillRect(x0,y-34,w-x0-24,68);
      ctx.fillStyle=nu?'#fff':'#1E3932';ctx.font='900 48px Inter,system-ui,sans-serif';ctx.fillText(p.numero,x0+14,y);ctx.font='bold 30px Inter,system-ui,sans-serif';ctx.fillText(nom(p.nombre),x0+150,y,w-x0-190);y+=82;});
    if(!(d.listo||[]).length){ctx.fillStyle='#ffffff88';ctx.font='28px Inter,system-ui,sans-serif';ctx.fillText('—',x0,170);y=250;}
    ctx.fillStyle='#fff';ctx.font='bold 30px Inter,system-ui,sans-serif';ctx.fillText('⏳ En preparación',x0,Math.max(y,250)+10);
    ctx.font='bold 34px Inter,system-ui,sans-serif';ctx.fillText((d.preparando||[]).slice(0,5).map(p=>p.numero).join('  ')||'—',x0,Math.max(y,250)+62,w-x0-24);
    ctx.fillStyle='#FFE58A';ctx.fillRect(0,h-26,w,26);ctx.fillStyle='#3A2E00';ctx.font='bold 17px Inter,system-ui,sans-serif';ctx.fillText('DEMO · pago SIMULADO · toca para abrir',w*.52,h-13);
    ctx.restore();return true;}
  // Engancha el pintado de pantallas: el previo de Pixeria (si lo hay) manda; si no, la cola.
  function hook(){const M=root.XpaceScreenMedia;if(!M||M.__cola)return !!M;const get=M.get,draw=M.draw;
    M.get=id=>get(id)||(id===ID&&active()?{id:'cola-ipad',kind:'cola',url:pageUrl()}:null);
    M.draw=(ctx,w,h,id)=>draw(ctx,w,h,id)||(id===ID&&active()?drawCola(ctx,w,h):false);M.__cola=true;return true;}
  if(!hook()){const t=setInterval(()=>{if(hook())clearInterval(t);},500);}
  function ensure(){if(modal)return;const css=doc.createElement('style');
    css.textContent='#ipadColaModal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9500;display:none;align-items:center;justify-content:center}#ipadColaModal.on{display:flex}#ipadColaModal .wrap{position:relative;width:min(92vw,calc(88vh*4/3));aspect-ratio:4/3;border:14px solid #111;border-radius:30px;background:#000;box-shadow:0 20px 60px rgba(0,0,0,.5)}#ipadColaModal iframe{width:100%;height:100%;border:0;border-radius:16px;background:#1E3932}#ipadColaModal .x{position:absolute;top:-26px;right:-26px;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font:700 20px system-ui;cursor:pointer}';
    doc.head.appendChild(css);modal=doc.createElement('div');modal.id='ipadColaModal';modal.innerHTML='<div class="wrap"><iframe title="iPad del mostrador · gestor de colas" allow="autoplay"></iframe><button class="x" type="button" aria-label="Cerrar">✕</button></div>';
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.classList.contains('x'))abrir(false);});doc.body.appendChild(modal);}
  function abrir(v){ensure();const f=modal.querySelector('iframe');if(v){f.src=pageUrl();modal.classList.add('on');}else{modal.classList.remove('on');f.src='about:blank';}}
  // Pulsar el iPad en la escena (clic sin arrastre, fuera de /layout) lo abre en grande.
  const inQuad=(x,y,q)=>{let s=0;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],c=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(c!==0){if(s&&Math.sign(c)!==s)return false;s=Math.sign(c);}}return true;};
  function hit(e){const cv=doc.getElementById('c');if(!cv||!active())return false;const q=root.XpaceStarbucks.screenQuads&&root.XpaceStarbucks.screenQuads[ID];if(!q)return false;
    const r=cv.getBoundingClientRect();return inQuad((e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height,q);}
  let down=null;doc.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};},true);
  doc.addEventListener('click',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;if((doc.body.classList.contains('device-layout-active')||doc.documentElement.classList.contains('device-layout-active'))||e.target.id!=='c')return;if(hit(e)){e.stopPropagation();e.preventDefault();abrir(true);}},true);

  // ── Matrix · 360 (7-oct-2026): ahí el iPad es un <div class="matrix-mapped-player matrix-landscape-ipad"> deformado
  // sobre la foto, que no pasa por XpaceScreenMedia (por eso seguía en verde con «iPad»). Si no hay vídeo/imagen de
  // playlist o previo dentro, le metemos la página real de la cola (&escena=1: sin voz propia, habla el gemelo).
  function matrixIpad(){
    const nodes=doc.querySelectorAll('.matrix-landscape-ipad');
    nodes.forEach(node=>{
      let fr=node.querySelector('iframe.ipad-cola-frame');
      const otro=[...node.querySelectorAll('.matrix-player-media')].some(m=>m!==fr&&((m.tagName==='VIDEO'&&(m.currentSrc||m.getAttribute('src')))||m.tagName==='IMG'||(m.tagName==='IFRAME'&&!m.classList.contains('ipad-cola-frame'))));
      if(!on||otro){ if(fr){fr.remove();node.classList.remove('ipad-cola-on');} return; }
      if(!fr){ fr=doc.createElement('iframe');fr.className='ipad-cola-frame';fr.title='iPad del mostrador · gestor de colas';fr.setAttribute('tabindex','-1');fr.setAttribute('aria-hidden','true');
        fr.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;background:#1E3932;pointer-events:none;z-index:1';
        fr.src=pageUrl()+'&escena=1';node.prepend(fr);node.classList.add('ipad-cola-on');
        if(!node.__colaClick){node.__colaClick=true;node.addEventListener('click',e=>{if(!on||doc.documentElement.classList.contains('device-layout-active')||doc.body.classList.contains('device-layout-active'))return;if(!node.querySelector('iframe.ipad-cola-frame'))return;e.stopPropagation();abrir(true);},true);} }
      node.style.pointerEvents=(doc.body.classList.contains('device-layout-active')||doc.documentElement.classList.contains('device-layout-active'))?'':'auto';node.style.cursor='pointer';
      const idle=node.querySelector('.matrix-ipad-idle');if(idle)idle.style.display='none';
    });
    try{root.__ipadColaMatrix=nodes.length;}catch(_){}
  }
  setInterval(matrixIpad,1500);
  function command(a){a=String(a||'').trim().toLowerCase();if(!a||a==='cola'||a==='on'){on=true;try{root.localStorage.removeItem(KEY);}catch(_){}return {ok:true,message:'🧾 iPad del mostrador → gestor de colas (Admirito). Tócalo para abrirlo en grande.'};}
    if(a==='off'||a==='playlist'){on=false;setTimeout(matrixIpad,0);try{root.localStorage.setItem(KEY,'off');}catch(_){}return {ok:true,message:'📺 iPad del mostrador → su playlist de vídeo.'};}
    if(a==='abrir'||a==='open'){abrir(true);return {ok:true,message:pageUrl()};}return {ok:false,message:'/ipad cola · /ipad off · /ipad abrir'};}
  root.XpaceIpadCola={id:ID,url:pageUrl,on:()=>active(),open:()=>abrir(true),close:()=>abrir(false),command,draw:drawCola,data:()=>data,demo:()=>{const d=data||{};return !((d.listo||[]).length||(d.preparando||[]).length);},frases:FRASES};
})(typeof window!=='undefined'?window:globalThis);
