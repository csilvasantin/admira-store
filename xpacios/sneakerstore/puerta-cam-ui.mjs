// Puerta Cam en la tienda 360 (Carlos, 22-oct-2026): la tarjeta del dispositivo sobre la puerta de Entrada, como en
// IEU (Puerta Cam · estado · Ver stream), y una ventana flotante con el vídeo de la calle. «Ver stream» pide primero
// el directo de IEU a nuestro servidor (puerta-cam.mjs); sin él, queda la pestaña de IEU compartida, recortada al
// recuadro de la cámara que se marca una vez con dos esquinas.
import {movableWindow} from '../../admira-xp/scripts/floating-window.mjs';
import {createPuertaCam,cropFromCorners,sourceRect} from './puerta-cam.mjs?v=puerta-cam-2';
import {PUERTA_CAM_ANCHOR} from './hotspots.mjs?v=puerta-cam-1';

export function mountPuertaCam({document,t,stage,openIeu,storage=null}){
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

  // ── Ventana flotante del stream ─────────────────────────────────────────────────────────────────────────────
  const winChip=el('span',{className:'puerta-chip'}),winClose=el('button',{type:'button',className:'puerta-x',textContent:'×'});
  const handle=el('header',{className:'puerta-window-head'},el('b',{textContent:t('Puerta Cam · Santa Rosa 19','Puerta Cam · Santa Rosa 19')}),winChip,winClose);
  const canvas=el('canvas',{className:'puerta-canvas'}),hint=el('p',{className:'puerta-hint'});
  const openIeuButton=el('button',{type:'button',textContent:t('Abrir IEU ↗','Open IEU ↗')});
  const shareButton=el('button',{type:'button',className:'puerta-primary',textContent:t('Compartir pestaña de IEU','Share the IEU tab')});
  const loginLink=el('a',{className:'puerta-login',textContent:t('Iniciar sesión para ver el directo','Sign in to watch live')});
  const helpText=el('p'),connecting=el('p',{className:'puerta-connecting',textContent:t('Conectando con el directo de IEU…','Connecting to the IEU live stream…')});
  const help=el('div',{className:'puerta-help'},connecting,helpText,loginLink,el('div',{className:'puerta-actions'},openIeuButton,shareButton));
  const cropButton=el('button',{type:'button',textContent:t('Recortar','Crop')}),fullButton=el('button',{type:'button',textContent:t('Sin recorte','No crop')});
  const stopButton=el('button',{type:'button',textContent:t('Dejar de compartir','Stop sharing')});
  const sourceLabel=el('small',{className:'puerta-source'});
  const tools=el('footer',{className:'puerta-actions'},cropButton,fullButton,stopButton,sourceLabel);
  const win=el('section',{id:'puerta-window',className:'puerta-window',hidden:true},handle,el('div',{className:'puerta-view'},canvas,help),hint,tools);
  win.setAttribute('role','dialog');win.setAttribute('aria-label','Puerta Cam');winClose.setAttribute('aria-label',t('Cerrar','Close'));
  stage.append(card,win);

  const video=el('video',{muted:true,playsInline:true});
  let frame=0,cropping=null,anchor=null,directError=null,trying=false;
  const cam=createPuertaCam({storage,onChange:render});
  // Sin directo, se sabe por qué: sin sesión se ofrece entrar; sin token o sin cámara configurada, la pestaña.
  const DIRECT_DOWN=new Set(['not_configured','camera_not_configured','hls_unsupported']);
  const motion=movableWindow(win,handle,{key:'sneakerstore.puertaCam.window.v1',bounds:stage,storage,closeButton:winClose,onClose:closeWindow});

  function render(){
    const live=cam.live;
    for(const chip of [cardChip,winChip]){chip.textContent=live?t('TRANSMITIENDO','STREAMING'):t('EN IEU','IN IEU');chip.dataset.live=String(live);}
    cardTime.textContent=live?hhmm():'—';
    const tab=cam.source==='tab';
    help.hidden=live;canvas.hidden=!live;tools.hidden=!live;cropButton.hidden=!tab;fullButton.hidden=!tab;fullButton.disabled=!cam.crop&&!cropping;
    connecting.hidden=!trying;loginLink.hidden=trying||directError!=='login_required';
    loginLink.href='/auth/login?return_to='+encodeURIComponent(location.pathname+location.search);
    helpText.hidden=trying;helpText.textContent=directError==='login_required'
      ?t('El directo de Puerta Cam se ve sin abrir IEU cuando has entrado en admira.store. También puedes compartir la pestaña de IEU.','Puerta Cam plays without opening IEU once you are signed in to admira.store. You can also share the IEU tab.')
      :t('El vídeo de la calle está en IEU, que exige tu sesión. En su pestaña abre Store → Entrada → Puerta Cam → Ver stream y compártela aquí.','The street video lives in IEU, which requires your session. In its tab open Store → Entrada → Puerta Cam → View stream and share it here.');
    for(const b of [openIeuButton,shareButton])b.hidden=trying;
    stopButton.textContent=tab?t('Dejar de compartir','Stop sharing'):t('Cerrar directo','Close live stream');
    sourceLabel.textContent=live?(tab?t('Pestaña de IEU compartida','Shared IEU tab'):t('Directo de IEU','IEU live stream')):'';
    if(live&&video.srcObject!==cam.stream){video.srcObject=cam.stream;video.play().catch(()=>{});}
    if(!live){video.srcObject=null;cropping=null;}
    hint.textContent=cropping?(cropping.first?t('Ahora pulsa la esquina inferior derecha del vídeo de la calle.','Now click the bottom-right corner of the street video.'):t('Pulsa la esquina superior izquierda del vídeo de la calle.','Click the top-left corner of the street video.'))
      :live&&tab&&!cam.crop?t('Se ve toda la pestaña de IEU: pulsa «Recortar» y marca el recuadro de la cámara.','The whole IEU tab is shown: press “Crop” and mark the camera box.'):'';
    if(!win.hidden&&live&&!frame)frame=requestAnimationFrame(draw);
  }
  function draw(){
    frame=0;if(win.hidden||!cam.live)return;
    if(video.readyState>=2&&video.videoWidth){
      const {sx,sy,sw,sh}=sourceRect(cropping||cam.source!=='tab'?null:cam.crop,video.videoWidth,video.videoHeight);
      if(canvas.width!==sw||canvas.height!==sh){canvas.width=sw;canvas.height=sh;}
      canvas.getContext('2d').drawImage(video,sx,sy,sw,sh,0,0,sw,sh);
    }
    frame=requestAnimationFrame(draw);
  }
  canvas.addEventListener('click',e=>{
    if(!cropping)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    const point={x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))};
    if(!cropping.first){cropping={first:point};render();return;}
    const next=cropFromCorners(cropping.first,point);cropping=null;
    if(next)cam.setCrop(next);else render();
  });
  async function share(){
    try{await cam.share({direct:false});}catch(e){hint.textContent=e?.message==='share_unsupported'?t('Este navegador no permite compartir pestañas. Usa Chrome de escritorio.','This browser cannot share tabs. Use desktop Chrome.'):t('No se compartió la pestaña de IEU.','The IEU tab was not shared.');}
  }
  function openWindow(){
    card.dataset.closed='false';
    if(win.hidden){win.hidden=false;motion.restore();}
    // Si ya se sabe que no hay directo, como antes: IEU en su pestaña (todavía dentro del clic) y a compartir.
    if(!cam.live&&DIRECT_DOWN.has(directError)){openIeu();shareButton.focus();}
    else if(!cam.live&&!trying){
      trying=true;
      cam.connect().then(()=>{directError=null;},e=>{directError=e?.code||'play_failed';}).finally(()=>{trying=false;render();if(!cam.live)shareButton.focus();});
    }
    render();
  }
  function closeWindow(){win.hidden=true;cancelAnimationFrame(frame);frame=0;cropping=null;render();}

  cardStream.onclick=openWindow;cardClose.onclick=()=>{card.dataset.closed='true';};
  openIeuButton.onclick=()=>openIeu();shareButton.onclick=()=>void share();
  cropButton.onclick=()=>{cropping={first:null};render();};fullButton.onclick=()=>{cropping=null;cam.setCrop(null);};
  stopButton.onclick=()=>cam.stop();
  const clock=setInterval(()=>{if(cam.live)cardTime.textContent=hhmm();},20000);
  render();

  return {
    cam,open:openWindow,
    attach(panorama){anchor?.remove();anchor=panorama?.anchor?.(card,PUERTA_CAM_ANCHOR)||null;},
    dispose(){clearInterval(clock);cancelAnimationFrame(frame);anchor?.remove();motion.dispose();cam.stop();card.remove();win.remove();},
  };
}
