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
  const active=()=>{try{return on&&!!(root.XpaceStarbucks&&root.XpaceStarbucks.active());}catch(_){return false;}};
  async function tic(){if(!active())return;try{const d=await (await fetch(RELAY+'/cola/estado?store='+store(),{cache:'no-store'})).json();
    const ls=(d.listo||[]).map(p=>p.numero);if(vistos){ls.forEach(n=>{if(!vistos.has(n))nuevos.set(n,Date.now());});}vistos=new Set(ls);data=d;}catch(_){}}
  setInterval(tic,3000);setTimeout(tic,800);
  const nom=s=>String(s||'').replace(/[^\p{L} '\-]/gu,'').trim().slice(0,14);
  function drawCola(ctx,w,h){
    ctx.save();ctx.fillStyle='#1E3932';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#0f2620';ctx.fillRect(0,0,w,70);ctx.fillStyle='#fff';ctx.font='bold 38px Inter,system-ui,sans-serif';ctx.textBaseline='middle';ctx.fillText('☁️ ADMIRITO · COLA',24,36);
    // Admirito (nube) a la izquierda
    const cx=w*.25,cy=h*.52;ctx.fillStyle='#6a9e3f';[[0,0,120],[-95,30,80],[95,30,80],[-50,-60,80],[55,-55,85]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(cx+x,cy+y,r+14,0,7);ctx.fill();});
    ctx.fillStyle='#f3f8ec';[[0,0,120],[-95,30,80],[95,30,80],[-50,-60,80],[55,-55,85]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(cx+x,cy+y,r,0,7);ctx.fill();});
    ctx.fillStyle='#1d2a17';[-45,45].forEach(x=>{ctx.beginPath();ctx.arc(cx+x,cy-5,18,0,7);ctx.fill();});
    ctx.strokeStyle='#1d2a17';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy+30,30,.15*Math.PI,.85*Math.PI);ctx.stroke();
    const d=data||{listo:[],preparando:[]},now=Date.now();
    // aviso reciente (12 s)
    const rec=(d.listo||[]).find(p=>nuevos.has(p.numero)&&now-nuevos.get(p.numero)<12000);
    if(rec){ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect?ctx.roundRect(20,h-170,w*.5-30,140,24):ctx.rect(20,h-170,w*.5-30,140);ctx.fill();ctx.fillStyle='#00704A';ctx.font='bold 34px Inter,system-ui,sans-serif';
      ctx.fillText((nom(rec.nombre)||('Pedido '+rec.numero))+',',40,h-128,w*.5-70);ctx.fillStyle='#1E3932';ctx.font='bold 28px Inter,system-ui,sans-serif';ctx.fillText('tu pedido Starbucks',40,h-88,w*.5-70);ctx.fillText('está preparado ☕',40,h-54,w*.5-70);}
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
  function command(a){a=String(a||'').trim().toLowerCase();if(!a||a==='cola'||a==='on'){on=true;try{root.localStorage.removeItem(KEY);}catch(_){}return {ok:true,message:'🧾 iPad del mostrador → gestor de colas (Admirito). Tócalo para abrirlo en grande.'};}
    if(a==='off'||a==='playlist'){on=false;try{root.localStorage.setItem(KEY,'off');}catch(_){}return {ok:true,message:'📺 iPad del mostrador → su playlist de vídeo.'};}
    if(a==='abrir'||a==='open'){abrir(true);return {ok:true,message:pageUrl()};}return {ok:false,message:'/ipad cola · /ipad off · /ipad abrir'};}
  root.XpaceIpadCola={id:ID,url:pageUrl,on:()=>active(),open:()=>abrir(true),close:()=>abrir(false),command,draw:drawCola,data:()=>data};
})(typeof window!=='undefined'?window:globalThis);
