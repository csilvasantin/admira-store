// Panel «Contenido segmentado»: Puerta Cam (IEU) → clase en vivo → carril → player virtual + MetaHuman.
// Fuentes de cámara: pestaña compartida de digitaltwin.ieu.ai (la API de IEU exige sesión: 401 sin ella y sin
// credencial en la Cúpula a 22-oct-2026), bus público mcp-tv.admira.store/audience/<pantalla>, o demo.
import {KINDS,SCREEN,SEG_API,BUS_API,AUDIENCE_API,STOCK_INDEX,METAHUMAN,LaneTracker,dominant,parseBus,resolveContent,mergeKindRules,kindRules,metahumanPhrase,metahumanTarget,shouldSpeak,audienceSample,demoScript,demoStep,normalizeKind} from './segmentado-core.mjs';
import {createDetector} from './segmentado-detector.mjs';

// Clips del Stock con tráfico real para el detector cuando no hay Puerta Cam (modo «vídeo»).
const DEMO_CLIPS=['https://stock.admira.store/stock/1792348829074-s04vy7/asset.mp4','https://stock.admira.store/stock/1792158948542-al54yo/asset.mp4'];
const IMAGE_MS=8000;

export function mountSegmented({document,t,en,channels,status=()=>{}}){
  const $=id=>document.getElementById(id),lang=en?'en':'es';
  const dialog=$('segmented-dialog'),cam=$('seg-cam-video'),stage=$('seg-cam-canvas'),overlay=$('seg-overlay'),mh=$('seg-mh');
  const screens={horizontal:{video:$('seg-video-h'),image:$('seg-image-h'),caption:$('seg-caption-h'),items:[],index:0,timer:0},vertical:{video:$('seg-video-v'),image:$('seg-image-v'),caption:$('seg-caption-v'),items:[],index:0,timer:0}};
  const tracker=new LaneTracker(),detector=createDetector({onProgress:p=>camStatus(p?t('Preparando detector · ','Preparing detector · ')+p:'')});
  const state={open:false,source:null,stream:null,matrix:null,matrixNote:'',stock:[],bus:null,busAt:0,lane:'neutral',kind:null,previousKind:null,lastSpokenAt:0,lastSaidText:'',mhMode:null,hostAlive:null,detections:[],demoStart:0,timers:[],detecting:false,audienceAt:0,published:0,clip:0};
  const KIND_LABEL=kind=>kind?KINDS[kind][lang]:t('Nadie','Nobody');
  function camStatus(text){$('seg-cam-status').textContent=text;}
  function note(text){$('seg-note').textContent=text;}

  // ── Textos ──────────────────────────────────────────────────────────────────────────────────────
  $('segmented-title').textContent=t('Contenido segmentado · Puerta Cam','Segmented content · Puerta Cam');
  $('close-segmented').setAttribute('aria-label',t('Cerrar','Close'));
  $('seg-cam-title').textContent=t('Puerta Cam · Santa Rosa 19 (IEU)','Puerta Cam · Santa Rosa 19 (IEU)');
  $('seg-share').textContent=t('Compartir Puerta Cam','Share Puerta Cam');$('seg-bus').textContent=t('Bus de audiencia','Audience bus');$('seg-demo').textContent=t('Modo demo','Demo mode');$('seg-video-demo').textContent=t('Vídeo de muestra','Sample video');$('seg-stop').textContent=t('Parar','Stop');
  $('seg-player-title').textContent=t('Player virtual · pantallas de la tienda','Virtual player · store screens');$('seg-mh-title').textContent=t('MetaHuman · Neo','MetaHuman · Neo');
  $('seg-voice-label').textContent=t('Voz del MetaHuman','MetaHuman voice');
  for(const [id,es,english] of [['seg-dt-kind','Clase','Class'],['seg-dt-score','Confianza','Confidence'],['seg-dt-last','Última detección','Last detection'],['seg-dt-source','Fuente','Source'],['seg-dt-bus','Bus mcp-tv','mcp-tv bus'],['seg-dt-matrix','Matriz','Matrix'],['seg-dt-audience','Audiencia publicada','Audience published']])$(id).textContent=t(es,english);
  $('seg-open-canal').href='https://admira.tv/canal.html?screen='+SCREEN+'&mode=conditional&audience=remote';$('seg-open-canal').textContent=t('Player real en admira.tv ↗','Real player on admira.tv ↗');
  $('seg-open-ieu').textContent=t('Abrir Puerta Cam en IEU ↗','Open Puerta Cam in IEU ↗');

  // ── Matriz y Stock ───────────────────────────────────────────────────────────────────────────────
  async function loadMatrix(){
    try{const r=await fetch(SEG_API+'?target='+encodeURIComponent(SCREEN)+'&t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const remote=await r.json();
      const own=kindRules(remote).length;const merged=mergeKindRules(remote);state.matrix=merged.matrix;
      state.matrixNote=own?t(own+' reglas por tipología en brain.digitalavatar.ai',own+' typology rules on brain.digitalavatar.ai'):t('sin reglas por tipología en el servidor · usando las 4 por defecto (locales)','no typology rules on the server · using the 4 defaults (local)');
    }catch(e){state.matrix=mergeKindRules(null).matrix;state.matrixNote=t('matriz no accesible (','matrix unavailable (')+e.message+') · '+t('reglas por defecto locales','local default rules');}
    $('seg-matrix').textContent=state.matrixNote;
  }
  async function loadStock(){try{const r=await fetch(STOCK_INDEX+'?t='+Math.floor(Date.now()/600000),{cache:'no-store'});const j=await r.json();state.stock=j.items||(Array.isArray(j)?j:[]);}catch{state.stock=[];}}

  // ── Player virtual ───────────────────────────────────────────────────────────────────────────────
  function showItem(format){
    const s=screens[format],item=s.items[s.index];clearTimeout(s.timer);
    if(!item){s.video.pause();s.video.removeAttribute('src');s.video.load();s.video.hidden=true;s.image.hidden=true;s.caption.textContent=t('Sin contenido','No content');return;}
    const isImage=item.type==='image'||item.type==='animation';
    s.image.hidden=!isImage;s.video.hidden=isImage;
    if(isImage){s.video.pause();s.image.src=item.url;s.timer=setTimeout(()=>next(format),IMAGE_MS);}
    else{s.video.src=item.url;s.video.load();s.video.play().catch(()=>{});}
    s.caption.textContent=(format==='horizontal'?'LCD + LED · ':t('Entrada · ','Entrance · '))+item.title+(item.num?' · #'+item.num:'');
  }
  function next(format){const s=screens[format];if(!s.items.length)return;s.index=(s.index+1)%s.items.length;showItem(format);}
  function applyLane(kind){
    for(const format of Object.keys(screens)){
      const s=screens[format],resolved=resolveContent({matrix:state.matrix,kind,stock:state.stock,playlist:channels[format]?.playlist,orientation:format});
      const signature=resolved.items.map(i=>i.id).join('|');
      if(s.signature===signature&&s.items.length)continue;
      s.signature=signature;s.items=resolved.items;s.index=0;s.source=resolved.source;s.rule=resolved.rule?.id||null;showItem(format);
      s.caption.textContent+=' · '+(resolved.source==='playlist'?t('playlist base','base playlist'):t('matriz ','matrix ')+(resolved.rule?.id||'')+' ('+resolved.source+')');
    }
  }
  for(const [format,s] of Object.entries(screens)){s.video.addEventListener('ended',()=>next(format));s.video.addEventListener('error',()=>{if(s.video.getAttribute('src'))next(format);});}

  // ── MetaHuman ────────────────────────────────────────────────────────────────────────────────────
  function probeHost(){return new Promise(resolve=>{const img=new Image();let done=false;const finish=v=>{if(!done){done=true;resolve(v);}};const timer=setTimeout(()=>finish(false),6000);img.onload=()=>{clearTimeout(timer);finish(true);};img.onerror=()=>{clearTimeout(timer);finish(false);};img.src=METAHUMAN.base+METAHUMAN.probe+'?t='+Date.now();});}
  async function mountMetahuman(){
    $('seg-mh-status').textContent=t('Sondeando host de Pixel Streaming…','Probing Pixel Streaming host…');
    state.hostAlive=await probeHost();if(!state.open)return;
    const target=metahumanTarget({hostAlive:state.hostAlive});state.mhMode=target.mode;
    if(mh.src!==target.src)mh.src=target.src;
    $('seg-mh-status').textContent=target.mode==='metahuman'?t('MetaHuman en vivo (Pixel Streaming) · voz por el stream','Live MetaHuman (Pixel Streaming) · voice through the stream'):t('Host de render apagado o bloqueado (workers.dev) · avatar web + voz del navegador','Render host down or blocked (workers.dev) · web avatar + browser voice');
  }
  async function speak(kind){
    const text=metahumanPhrase(kind,lang,tracker.changes);if(!text)return;
    state.lastSpokenAt=Date.now();state.lastSaidText=text;$('seg-mh-caption').textContent='“'+text+'”';
    if(!$('seg-voice').checked)return;
    if(state.mhMode==='metahuman'){try{const r=await fetch(METAHUMAN.say,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room:METAHUMAN.room,text})});if(!r.ok)throw Error('HTTP '+r.status);}catch(e){$('seg-mh-status').textContent=t('No se pudo locutar en el stream: ','Could not speak through the stream: ')+e.message;browserVoice(text);}}
    else browserVoice(text);
  }
  function browserVoice(text){try{const u=new SpeechSynthesisUtterance(text);u.lang=en?'en-US':'es-ES';speechSynthesis.cancel();speechSynthesis.speak(u);}catch{}}

  // ── Audiencia → api.admira.store/audience ─────────────────────────────────────────────────────────
  function publishAudience(current,force=false){
    // Solo audiencia real (pestaña de Puerta Cam o bus): una demo nunca entra en el informe de clearchannel.tv.
    if(state.source!=='share'&&state.source!=='bus'){$('seg-audience').textContent=state.published+' · '+t('demo: no se publica','demo: not published');return;}
    const now=Date.now();if(!current.kind||(!force&&now-state.audienceAt<20000))return;state.audienceAt=now;
    fetch(AUDIENCE_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(audienceSample(current)),keepalive:true}).then(r=>{if(r.ok){state.published++;$('seg-audience').textContent=state.published+' · '+new Date(now).toLocaleTimeString();}}).catch(()=>{});
  }

  // ── Bus mcp-tv (lectura pública) ─────────────────────────────────────────────────────────────────
  async function pollBus(){
    try{const r=await fetch(BUS_API+'?t='+Date.now(),{cache:'no-store'});state.bus=parseBus(await r.json());state.busAt=Date.now();}catch{state.bus=null;}
    const b=state.bus;$('seg-bus-state').textContent=!b?t('sin respuesta','no response'):b.present?b.lane+' · '+KIND_LABEL(b.kind):t('fresh:false · neutral (nadie publica)','fresh:false · neutral (no producer)');
    if(state.source==='bus'&&b)tracker.observe(b.present?{kind:b.kind,score:1,count:1}:null);
  }

  // ── Fuentes de cámara ─────────────────────────────────────────────────────────────────────────────
  function stopSource(){
    state.source=null;state.detecting=false;
    state.stream?.getTracks().forEach(track=>track.stop());state.stream=null;
    cam.pause();cam.srcObject=null;cam.removeAttribute('src');cam.load();cam.hidden=true;stage.hidden=true;overlay.getContext('2d').clearRect(0,0,overlay.width,overlay.height);
    for(const b of ['seg-share','seg-bus','seg-demo','seg-video-demo'])$(b).setAttribute('aria-pressed','false');
  }
  function pick(id){for(const b of ['seg-share','seg-bus','seg-demo','seg-video-demo'])$(b).setAttribute('aria-pressed',String(b===id));}
  async function shareTab(){
    stopSource();
    if(!navigator.mediaDevices?.getDisplayMedia){camStatus(t('Este navegador no permite compartir pestañas. Usa Chrome de escritorio.','This browser cannot share tabs. Use desktop Chrome.'));return;}
    camStatus(t('Elige la pestaña de digitaltwin.ieu.ai con Store → Entrada → Puerta Cam → Ver stream.','Choose the digitaltwin.ieu.ai tab with Store → Entrada → Puerta Cam → View stream.'));
    try{state.stream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser',frameRate:{ideal:10,max:15}},audio:false,monitorTypeSurfaces:'exclude',selfBrowserSurface:'exclude',surfaceSwitching:'exclude',systemAudio:'exclude'});}
    catch(e){camStatus(t('No se compartió la pestaña: ','Tab not shared: ')+e.message);return;}
    state.source='share';pick('seg-share');cam.srcObject=state.stream;cam.hidden=false;await cam.play().catch(()=>{});
    state.stream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(state.source==='share'){stopSource();camStatus(t('Pestaña dejada de compartir.','Tab sharing ended.'));}});
    $('seg-source').textContent=t('Pestaña compartida · detector COCO-SSD en el navegador','Shared tab · COCO-SSD detector in the browser');
    runDetector();
  }
  function demoVideo(){
    stopSource();state.source='video';pick('seg-video-demo');cam.hidden=false;cam.crossOrigin='anonymous';cam.loop=false;cam.src=DEMO_CLIPS[state.clip%DEMO_CLIPS.length];cam.play().catch(()=>{});
    cam.onended=()=>{if(state.source==='video'){state.clip++;cam.src=DEMO_CLIPS[state.clip%DEMO_CLIPS.length];cam.play().catch(()=>{});}};
    $('seg-source').textContent=t('Vídeo de muestra del Stock · detector COCO-SSD real','Stock sample video · real COCO-SSD detector');camStatus(t('DEMO · clips del Stock con tráfico; no es la Puerta Cam.','DEMO · Stock traffic clips; not the Puerta Cam.'));
    runDetector();
  }
  async function runDetector(){
    if(state.detecting)return;state.detecting=true;
    try{await detector.load();}catch(e){camStatus(t('Detector no disponible: ','Detector unavailable: ')+e.message);state.detecting=false;return;}
    camStatus(t('Analizando…','Analysing…'));
    while(state.detecting&&state.open&&(state.source==='share'||state.source==='video')){
      if(cam.readyState>=2&&cam.videoWidth>0){
        try{state.detections=await detector.detect(cam);}catch(e){camStatus(t('Error del detector: ','Detector error: ')+e.message);state.detections=[];}
        tracker.observe(dominant(state.detections));drawBoxes();
      }
      await new Promise(r=>setTimeout(r,250));
    }
  }
  function drawBoxes(){
    overlay.width=cam.videoWidth;overlay.height=cam.videoHeight;const ctx=overlay.getContext('2d');ctx.clearRect(0,0,overlay.width,overlay.height);ctx.lineWidth=3;ctx.font='bold 16px system-ui';
    for(const d of state.detections){const kind=normalizeKind(d.class);if(!kind)continue;ctx.strokeStyle=kind==='person'?'#35ed88':'#f59e0b';ctx.strokeRect(...d.bbox);ctx.fillStyle=ctx.strokeStyle;ctx.fillText(KINDS[kind].es+' '+Math.round(d.score*100)+'%',d.bbox[0]+4,d.bbox[1]+18);}
  }
  function demo(){
    stopSource();state.source='demo';pick('seg-demo');state.demoStart=Date.now();stage.hidden=false;
    $('seg-source').textContent=t('Secuencia simulada (sin cámara ni detector)','Simulated sequence (no camera or detector)');camStatus(t('DEMO · lo que pasa por la puerta está simulado; carriles, matriz, player y MetaHuman son reales.','DEMO · door traffic is simulated; lanes, matrix, player and MetaHuman are real.'));
  }
  function drawDemo(step){
    const ctx=stage.getContext('2d'),w=stage.width=640,h=stage.height=360;
    ctx.fillStyle='#0b1d2a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#1b3346';ctx.fillRect(0,h*.62,w,h*.38);ctx.fillStyle='#35ed88';ctx.fillRect(w*.42,h*.2,w*.16,h*.42);ctx.fillStyle='#071015';ctx.fillRect(w*.45,h*.24,w*.1,h*.38);
    ctx.fillStyle='#a2b7ae';ctx.font='14px ui-monospace,monospace';ctx.fillText('DEMO · Santa Rosa 19 · '+t('puerta','door'),16,26);
    if(step.kind){const x=w*.15+((Date.now()-state.demoStart)%step.ms)/step.ms*w*.7;ctx.font='96px system-ui';ctx.fillText(KINDS[step.kind].icon,x,h*.84);ctx.font='bold 18px system-ui';ctx.fillStyle='#dbffec';ctx.fillText(KINDS[step.kind][lang]+' · '+Math.ceil(step.remaining/1000)+' s',16,h-16);}
  }

  // ── Bucle de estado ───────────────────────────────────────────────────────────────────────────────
  function tick(){
    if(!state.open)return;
    if(state.source==='demo'){const step=demoStep(demoScript(),Date.now()-state.demoStart);tracker.observe(step.kind?{kind:step.kind,score:.9,count:1}:null);drawDemo(step);}
    const current=tracker.state();
    $('seg-lane').textContent=current.lane==='neutral'?t('Neutral · playlist','Neutral · playlist'):current.lane;$('seg-lane-icon').textContent=current.kind?KINDS[current.kind].icon:'·';
    $('seg-kind').textContent=KIND_LABEL(current.kind)+(current.count>1?' ×'+current.count:'');$('seg-score').textContent=current.kind?Math.round(current.score*100)+' %':'—';
    $('seg-last').textContent=Number.isFinite(current.lastSeen)?new Date(current.lastSeen).toLocaleTimeString()+(current.kind?'':t(' · sin presencia',' · no presence')):'—';
    if(current.lane!==state.lane||current.kind!==state.kind){
      state.previousKind=state.kind;state.lane=current.lane;state.kind=current.kind;applyLane(current.kind);
      if(shouldSpeak({kind:current.kind,previousKind:state.previousKind,lastSpokenAt:state.lastSpokenAt,now:Date.now()}))void speak(current.kind);
      publishAudience(current,true);status(t('Contenido segmentado · ','Segmented content · ')+current.lane+' · '+KIND_LABEL(current.kind));
    }else publishAudience(current);
  }

  // ── Abrir / cerrar ────────────────────────────────────────────────────────────────────────────────
  async function open(mode){
    if(!dialog.open)dialog.showModal();
    if(!state.open){state.open=true;state.lane='neutral';state.kind=null;note(t('La API de IEU exige sesión (401 sin ella) y la Cúpula no guarda credencial: el vídeo entra compartiendo la pestaña de Puerta Cam, como en Xtore. El bus se lee en público; publicar en él pide clave de flota (no va en el navegador).','The IEU API requires a session (401 without it) and the Vault holds no credential: video comes from sharing the Puerta Cam tab, as in Xtore. The bus is read publicly; publishing to it needs a fleet key (never in the browser).'));
      $('seg-source').textContent=t('Sin fuente · elige una','No source · choose one');$('seg-audience').textContent='0';
      await Promise.all([loadMatrix(),loadStock()]);if(!state.open)return;
      state.timers=[setInterval(tick,250),setInterval(pollBus,1000)];void pollBus();void mountMetahuman();applyLane(null);
    }
    if(mode==='demo')demo();else if(mode==='video')demoVideo();else if(mode==='bus'){stopSource();state.source='bus';pick('seg-bus');$('seg-source').textContent=t('Bus mcp-tv · lo que publique el productor de la Puerta Cam','mcp-tv bus · whatever the Puerta Cam producer publishes');camStatus(t('Leyendo el bus público; sin productor queda en neutral.','Reading the public bus; without a producer it stays neutral.'));}
    else if(mode==='cam'||mode==='share')void shareTab();
    return state;
  }
  function close(){
    stopSource();state.open=false;for(const timer of state.timers)clearInterval(timer);state.timers=[];
    for(const s of Object.values(screens)){clearTimeout(s.timer);s.video.pause();s.video.removeAttribute('src');s.video.load();s.items=[];s.signature='';}
    mh.removeAttribute('src');try{speechSynthesis.cancel();}catch{}
    if(dialog.open)dialog.close();
  }
  $('seg-share').onclick=()=>void shareTab();$('seg-bus').onclick=()=>void open('bus');$('seg-demo').onclick=demo;$('seg-video-demo').onclick=demoVideo;$('seg-stop').onclick=()=>{stopSource();camStatus(t('Fuente parada.','Source stopped.'));};
  $('close-segmented').onclick=close;dialog.addEventListener('close',()=>{if(state.open)close();});
  return {open,close,get state(){return {...state,current:tracker.state()};},dispose:close};
}
