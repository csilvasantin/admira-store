// Puerta Cam en la tienda 360 (Carlos, 22-oct-2026): la tarjeta del dispositivo sobre la puerta de Entrada, como en
// IEU (Puerta Cam · estado · Ver stream), y una ventana flotante con el directo de la calle que firma nuestro servidor
// con el token de cámaras de IEU (puerta-cam.mjs). Solo directo: capturar la pantalla «no es lo que queremos»; si el
// directo no llega, la ventana dice por qué y deja reintentar.
import {movableWindow} from '../../admira-xp/scripts/floating-window.mjs';
import {createPuertaCam} from './puerta-cam.mjs?v=puerta-cam-3';
import {PUERTA_CAM_ANCHOR} from './hotspots.mjs?v=puerta-cam-1';

// Por qué no hay directo, en palabras: el código lo da el servidor (functions/xpacios/sneakerstore/puerta-cam-stream.js).
export function directProblem(code,t){
  if(code==='login_required')return t('El directo de Puerta Cam se ve cuando has entrado en admira.store con tu cuenta.','Puerta Cam plays once you are signed in to admira.store.');
  if(code==='not_configured'||code==='camera_not_configured')return t('El directo de Puerta Cam está pendiente de configurar en el servidor.','The Puerta Cam live stream is not configured on the server yet.');
  if(code==='hls_unsupported')return t('Este navegador no puede reproducir el directo.','This browser cannot play the live stream.');
  return t('IEU no ha dado el directo ahora mismo.','IEU did not provide the live stream right now.');
}

export function mountPuertaCam({document,t,stage,storage=null}){
  const el=(tag,props={},...children)=>{const node=Object.assign(document.createElement(tag),props);node.append(...children);return node;};
  const hhmm=()=>new Date().toLocaleTimeString(document.documentElement.lang==='en'?'en-GB':'es-ES',{hour:'2-digit',minute:'2-digit'});

  // ── Tarjeta del dispositivo, pegada a la puerta ─────────────────────────────────────────────────────────────
  const cardChip=el('span',{className:'puerta-chip'}),cardTime=el('time'),cardClose=el('button',{type:'button',className:'puerta-x',textContent:'×'});
  const cardStream=el('button',{type:'button',className:'puerta-card-stream',textContent:t('Ver stream','View stream')});
  const card=el('div',{id:'puerta-card',className:'puerta-card'},
    el('div',{className:'puerta-card-head'},el('b',{textContent:'Puerta Cam'}),cardClose),cardChip,
    el('div',{className:'puerta-card-meta'},el('span',{textContent:t('cámara','camera')}),cardTime),cardStream);
  card.setAttribute('role','group');card.setAttribute('aria-label','Puerta Cam');cardClose.setAttribute('aria-label',t('Cerrar','Close'));
  card.dataset.inView='false';

  // ── Ventana flotante del directo ────────────────────────────────────────────────────────────────────────────
  const winChip=el('span',{className:'puerta-chip'}),winClose=el('button',{type:'button',className:'puerta-x',textContent:'×'});
  const handle=el('header',{className:'puerta-window-head'},el('b',{textContent:t('Puerta Cam · Santa Rosa 19','Puerta Cam · Santa Rosa 19')}),winChip,winClose);
  const canvas=el('canvas',{className:'puerta-canvas'});
  const connecting=el('p',{className:'puerta-connecting',textContent:t('Conectando con el directo de IEU…','Connecting to the IEU live stream…')});
  const problem=el('p'),loginLink=el('a',{className:'puerta-login',textContent:t('Iniciar sesión','Sign in')});
  const retryButton=el('button',{type:'button',className:'puerta-primary',textContent:t('Reintentar','Retry')});
  const help=el('div',{className:'puerta-help'},connecting,problem,el('div',{className:'puerta-actions'},loginLink,retryButton));
  const stopButton=el('button',{type:'button',textContent:t('Cerrar directo','Close live stream')});
  const tools=el('footer',{className:'puerta-actions'},stopButton,el('small',{className:'puerta-source',textContent:t('Directo de IEU','IEU live stream')}));
  const win=el('section',{id:'puerta-window',className:'puerta-window',hidden:true},handle,el('div',{className:'puerta-view'},canvas,help),tools);
  win.setAttribute('role','dialog');win.setAttribute('aria-label','Puerta Cam');winClose.setAttribute('aria-label',t('Cerrar','Close'));
  stage.append(card,win);

  const video=el('video',{muted:true,playsInline:true});
  let frame=0,anchor=null,failure=null,trying=false;
  const cam=createPuertaCam({onChange:render});
  const motion=movableWindow(win,handle,{key:'sneakerstore.puertaCam.window.v1',bounds:stage,storage,closeButton:winClose,onClose:closeWindow});

  function render(){
    const live=cam.live;
    for(const chip of [cardChip,winChip]){chip.textContent=live?t('TRANSMITIENDO','STREAMING'):t('EN IEU','IN IEU');chip.dataset.live=String(live);}
    cardTime.textContent=live?hhmm():'—';
    help.hidden=live;canvas.hidden=!live;tools.hidden=!live;connecting.hidden=!trying;
    problem.hidden=trying||!failure;problem.textContent=failure?directProblem(failure,t):'';
    loginLink.hidden=trying||failure!=='login_required';loginLink.href='/auth/login?return_to='+encodeURIComponent(location.pathname+location.search);
    retryButton.hidden=trying||!failure||failure==='login_required';
    if(live&&video.srcObject!==cam.stream){video.srcObject=cam.stream;video.play().catch(()=>{});}
    if(!live)video.srcObject=null;
    if(!win.hidden&&live&&!frame)frame=requestAnimationFrame(draw);
  }
  function draw(){
    frame=0;if(win.hidden||!cam.live)return;
    if(video.readyState>=2&&video.videoWidth){
      if(canvas.width!==video.videoWidth||canvas.height!==video.videoHeight){canvas.width=video.videoWidth;canvas.height=video.videoHeight;}
      canvas.getContext('2d').drawImage(video,0,0);
    }
    frame=requestAnimationFrame(draw);
  }
  function connect(){
    if(cam.live||trying)return;
    trying=true;failure=null;render();
    cam.connect().then(()=>{failure=null;},e=>{failure=e?.code||'play_failed';}).finally(()=>{trying=false;render();});
  }
  function openWindow(){
    card.dataset.closed='false';
    if(win.hidden){win.hidden=false;motion.restore();}
    connect();render();
  }
  function closeWindow(){win.hidden=true;cancelAnimationFrame(frame);frame=0;render();}

  cardStream.onclick=openWindow;cardClose.onclick=()=>{card.dataset.closed='true';};
  retryButton.onclick=connect;stopButton.onclick=()=>cam.stop();
  const clock=setInterval(()=>{if(cam.live)cardTime.textContent=hhmm();},20000);
  render();

  return {
    cam,open:openWindow,
    attach(panorama){anchor?.remove();anchor=panorama?.anchor?.(card,PUERTA_CAM_ANCHOR)||null;},
    dispose(){clearInterval(clock);cancelAnimationFrame(frame);anchor?.remove();motion.dispose();cam.stop();card.remove();win.remove();},
  };
}
