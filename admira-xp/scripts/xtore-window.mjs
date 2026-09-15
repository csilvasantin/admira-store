import {SCREEN,TTL,allowedOrigin,playbackState,targetTime,MirrorSession,exteriorPassages,exteriorStatistics,PassageState,acceptsCameraFrame,TrafficState} from './xtore-window-core.mjs?v=real-traffic-1';
import {movableWindow} from './floating-window.mjs';
import {createExteriorProgram} from './exterior-program.mjs';
const qs=new URLSearchParams(location.search);
const enabled=qs.get('virtualPlayer')===SCREEN;
const dock=document.getElementById('telegramDock'),expert=document.getElementById('pfExpert');
const entry=document.createElement('button');entry.type='button';entry.id='xtore-window-entry';entry.textContent='Player y cámara';
const actions=dock.querySelector('.tg-cli-row .tg-actions');actions.append(entry);
const grip=document.createElement('span');grip.id='xtore-expert-grip';grip.textContent='⠿ CONTROL XTORE';grip.setAttribute('aria-label','Mover Control Xtore');dock.querySelector('.tg-cli-row').prepend(grip);
const closeDock=document.createElement('button');closeDock.type='button';closeDock.textContent='×';closeDock.setAttribute('aria-label','Cerrar modo experto');actions.append(closeDock);
const dockWindow=movableWindow(dock,grip,{key:'xtore-expert-position',closeButton:closeDock,onClose:()=>{if(!document.body.classList.contains('xp-left-hidden'))expert.click();}});
expert.addEventListener('click',()=>{if(!document.body.classList.contains('xp-left-hidden'))dockWindow.restore();});
if(!enabled){entry.onclick=()=>{location.href='?autostart=xtanco&virtualPlayer='+SCREEN;};}else{
  document.title='Xtore · zapatillas — Player virtual · XpaceOS';
  const panel=document.createElement('section');panel.id='xtore-window-panel';panel.setAttribute('aria-label','Player virtual de zapatillas');
  panel.hidden=true;
  panel.innerHTML='<header id="xtore-window-header" aria-label="Mover ventana Player y cámara"><strong>Xtore · zapatillas</strong><button type="button" id="xtore-close" aria-label="Cerrar Player y cámara">×</button></header><div id="xtore-window-body"><p id="xtore-link-status" role="status">Conecta el player interior para reflejarlo en las pantallas del gemelo.</p><button id="xtore-connect">Conectar player y cámara ↗</button> <button id="xtore-disconnect">Desconectar</button><details id="xtore-camera"><summary>Cámara del escaparate · Puerta Cam</summary><canvas width="1" height="1" hidden></canvas><p id="xtore-camera-status" role="status">Sin vídeo de cámara.</p></details><p id="xtore-exterior-status" role="status">Exterior · esperando Puerta Cam</p><p id="xtore-media-status" role="status">Player sin señal</p><button id="xtore-sound">Activar sonido del gemelo</button><p class="xtore-note">Fuente exterior: cámara de la Xtore de zapatillas · AdmiraXperience. Pasos detectados en esta sesión. Cerrar esta ventana mantiene la reproducción.</p></div>';
  document.body.append(panel);
  const trafficDetails=document.createElement('details');trafficDetails.id='xtore-traffic';
  trafficDetails.innerHTML='<summary>Reglas de exterior</summary><p id="xtore-traffic-status" role="status">Trayectorias sin conectar.</p><p id="xtore-program-status" role="status">Contenido exterior en espera.</p><p class="xtore-note">Personas, coches y motos, o bicis y patinetes confirmados activan sus piezas musicales del escaparate. Sin presencia reciente vuelve el espejo del player interior. Las trayectorias se representan con sprites genéricos; un patinete requiere confirmación manual.</p>';
  panel.querySelector('#xtore-window-body').append(trafficDetails);
  const panelWindow=movableWindow(panel,panel.querySelector('header'),{key:'xtore-player-window-position',closeButton:panel.querySelector('#xtore-close'),onClose:()=>{panel.hidden=true;entry.focus();}});
  function openPanel(){if(document.body.classList.contains('xp-left-hidden'))expert.click();panel.hidden=false;panelWindow.restore();}
  entry.onclick=()=>{if(panel.hidden)openPanel();else panel.hidden=true;};
  const status=panel.querySelector('#xtore-link-status'),mediaStatus=panel.querySelector('#xtore-media-status'),cameraStatus=panel.querySelector('#xtore-camera-status'),camera=panel.querySelector('canvas');
  const passageState=new PassageState(),trafficState=new TrafficState(),originalCamera=document.createElement('canvas');
  const exteriorProgram=createExteriorProgram({document,onState:message=>{panel.querySelector('#xtore-program-status').textContent=message;}});
  function reportTraffic(){
    const value=trafficState.read();
    panel.querySelector('#xtore-traffic-status').textContent=value.status==='live'
      ?`Puerta Cam · ${value.tracks.length} trayectorias presentes · sprites genéricos`
      :value.status==='stale'?'Sin trayectorias recientes de Puerta Cam':value.status==='waiting'?'Esperando trayectorias de Puerta Cam':'Trayectorias sin conectar.';
    return value;
  }
  let modifiedCamera=false,hasOriginal=false;
  let peer=null,origin='',token='',connection=null,connected=false,lastMedia=0,lastCamera=0,latest=null,element=null,mediaKey='',audio=false,loadFailed=false,applied=false;
  function send(event){if(peer&&!peer.closed)peer.postMessage({source:'xpace-xtore-twin',screen:SCREEN,session:token,event},origin);}
  function stopMedia(){if(element){element.pause?.();element.removeAttribute('src');element.load?.();}element=null;mediaKey='';latest=null;applied=false;lastMedia=0;mediaStatus.textContent='Player sin señal · esperando al interior';}
  function stopCamera(){camera.hidden=true;camera.width=1;camera.height=1;originalCamera.width=1;originalCamera.height=1;lastCamera=0;modifiedCamera=false;hasOriginal=false;cameraStatus.textContent='Cámara sin señal reciente';renderCameraViews();}
  function disconnect(){send('disconnect');connected=false;peer=null;connection=null;passageState.clear();trafficState.clear();exteriorProgram.clear();reportTraffic();stopMedia();stopCamera();status.textContent='Desconectado. Las pantallas esperan al player virtual.';}
  function bind(target,targetOrigin,session){disconnect();peer=target;origin=targetOrigin;token=session;connection=new MirrorSession({peer,origin,session});send('hello');}
  const requested=qs.get('twinOrigin'),session=qs.get('twinSession');
  if(window.opener&&allowedOrigin(requested,location.origin)&&/^[a-f0-9-]{36}$/.test(session||''))bind(window.opener,requested,session);
  panel.querySelector('#xtore-connect').onclick=()=>{
    if(peer&&!peer.closed){send('hello');status.textContent='Comprobando el enlace con el player interior…';return;}
    const testOrigin=qs.get('analyzerOrigin');
    const analyzerOrigin=/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(location.origin)&&allowedOrigin(testOrigin,location.origin)?testOrigin:'https://admira.tv';
    const session=crypto.randomUUID(),url=new URL('/videoanalytics/xtore/',analyzerOrigin);
    url.search=new URLSearchParams({twinOrigin:location.origin,twinSession:session});
    const target=window.open(url.href,'xtore-analyzer-'+session,'popup,width=1180,height=900');
    if(!target){status.textContent='Permite la ventana del analizador en Chrome y vuelve a conectar.';return;}
    bind(target,url.origin,session);status.textContent='Abre Puerta Cam y comparte su pestaña en el analizador.';
  };
  panel.querySelector('#xtore-disconnect').onclick=disconnect;
  panel.querySelector('#xtore-sound').onclick=()=>{audio=!audio;if(element)element.muted=!audio;panel.querySelector('#xtore-sound').textContent=audio?'Silenciar gemelo':'Activar sonido del gemelo';};
  function synchronize(){
    if(!element||!latest)return;
    if(latest.type==='image'){applied=element.complete&&element.naturalWidth>0;return;}
    if(element.readyState<1)return;
    const pos=targetTime(latest);
    if(Math.abs(element.currentTime-pos)>.8)try{element.currentTime=pos;}catch{}
    element.playbackRate=latest.rate;element.muted=!audio;
    if(latest.paused)element.pause();else if(element.paused)element.play().catch(()=>{mediaStatus.textContent='Reproducción bloqueada · pulsa Activar sonido o vuelve a conectar';});
    applied=element.readyState>=2&&(latest.paused||!element.paused);
  }
  function apply(p){
    latest=p;lastMedia=p.ts;
    const key=p.id+'|'+p.url+'|'+p.type;
    if(key!==mediaKey){
      element?.pause?.();if(element){element.removeAttribute('src');element.load?.();}
      mediaKey=key;loadFailed=false;applied=false;
      const next=document.createElement(p.type==='image'?'img':p.type==='audio'?'audio':'video');element=next;
      // Keep the game canvas origin-clean, including its existing camera tools.
      next.crossOrigin='anonymous';next.referrerPolicy='no-referrer';next.muted=!audio;next.playsInline=true;next.preload='auto';
      next.addEventListener(p.type==='image'?'load':'loadedmetadata',()=>{if(element===next)synchronize();});
      next.addEventListener('error',()=>{if(element===next){loadFailed=true;applied=false;mediaStatus.textContent='No se pudo cargar la pieza del interior';}});
      next.src=p.url;
    }
    synchronize();
    if(!loadFailed)mediaStatus.textContent=(applied?'Reflejando · ':'Cargando · ')+p.title+' · '+(p.loop?'playlist base':'condicional');
  }
  window.addEventListener('message',e=>{
    const d=connection?.receive(e);
    if(!d){e.data?.bitmap?.close?.();e.data?.originalBitmap?.close?.();return;}
    if(d.event==='hello'||d.event==='ready'){
      if(!connected){trafficState.clear('waiting');reportTraffic();}
      connected=true;status.textContent='Player interior enlazado · espejo interior y reglas de exterior';
      if(d.event==='hello')send('ready');return;
    }
    if(!connected){d.bitmap?.close?.();d.originalBitmap?.close?.();return;}
    if(d.event==='statistics'){passageState.update(d.passages,d.ts,true);window.dispatchEvent(new Event('xtore-statistics'));}
    else if(d.event==='traffic'){
      if(trafficState.update(d.traffic)){reportTraffic();window.dispatchEvent(new Event('xtore-traffic'));}
    }
    else if(d.event==='traffic-off'){trafficState.clear('stale');exteriorProgram.clear();reportTraffic();window.dispatchEvent(new Event('xtore-traffic'));}
    else if(d.event==='playback'){const p=playbackState(d.playback);if(p)apply(p);else stopMedia();}
    else if(d.event==='playback-off')stopMedia();
    else if(d.event==='camera'){
      const bmp=d.bitmap;
      if(!(bmp instanceof ImageBitmap)||bmp.width>480||bmp.height>1920||!acceptsCameraFrame(d.frameAt,d.modified,lastCamera,modifiedCamera)){bmp?.close?.();d.originalBitmap?.close?.();return;}
      camera.width=bmp.width;camera.height=bmp.height;camera.getContext('2d').drawImage(bmp,0,0);bmp.close();camera.hidden=false;lastCamera=d.frameAt;
      modifiedCamera=d.modified===true;hasOriginal=false;
      const original=d.originalBitmap;
      if(original instanceof ImageBitmap&&original.width<=480&&original.height<=1920){
        originalCamera.width=original.width;originalCamera.height=original.height;originalCamera.getContext('2d').drawImage(original,0,0);hasOriginal=true;
      }
      if(!hasOriginal&&d.modified===false){originalCamera.width=camera.width;originalCamera.height=camera.height;originalCamera.getContext('2d').drawImage(camera,0,0);hasOriginal=true;}
      original?.close?.();
      passageState.update(d.passages,d.frameAt);
      renderCameraViews();window.dispatchEvent(new Event('xtore-statistics'));
      const exterior=passageState.read()?.person??null;
      panel.querySelector('#xtore-exterior-status').textContent=exterior===null?'Exterior · contador de pasos no disponible':`Exterior · ${exterior.toLocaleString('es')} pasos de personas · esta sesión`;
      const names={person:'personas',car:'coches',motorcycle:'motos',bicycle:'bicis'};
      cameraStatus.textContent='Puerta Cam · presencia: '+Object.entries(names).map(([kind,name])=>`${Math.max(0,Math.min(100,Math.floor(d.counts?.[kind]||0)))} ${name}`).join(' · ');
    }else if(d.event==='camera-off')stopCamera();
    else if(d.event==='disconnect')disconnect();
  });
  function renderCameraViews(root=document){
    const fresh=lastCamera>0&&Date.now()-lastCamera<1500;
    for(const canvas of root.querySelectorAll('[data-xtore-camera-view]')){
      const clean=canvas.dataset.xtoreCameraView==='clean';
      const available=fresh&&(clean?modifiedCamera:hasOriginal);
      canvas.hidden=!available;
      if(available){const source=clean?camera:originalCamera;canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);}
      else {canvas.width=1;canvas.height=1;}
    }
    for(const empty of root.querySelectorAll('[data-xtore-camera-empty]')){
      empty.hidden=fresh&&(empty.dataset.xtoreCameraEmpty==='clean'?modifiedCamera:hasOriginal);
    }
  }
  function draw(ctx,w,h,surface='interior'){
    if(surface==='exterior'&&exteriorProgram.draw(ctx,w,h))return true;
    ctx.save();ctx.fillStyle='#071117';ctx.fillRect(0,0,w,h);
    const fresh=latest&&Date.now()-lastMedia<TTL&&!loadFailed;
    const drawable=fresh&&element&&(latest.type==='image'?element.complete&&element.naturalWidth:latest.type==='video'&&element.readyState>=2);
    if(drawable){
      const vw=element.videoWidth||element.naturalWidth,vh=element.videoHeight||element.naturalHeight;
      const scale=Math.min(w/vw,h/vh);if(vw&&vh)ctx.drawImage(element,(w-vw*scale)/2,(h-vh*scale)/2,vw*scale,vh*scale);
    }else{ctx.textAlign='center';ctx.fillStyle='#8ce8e0';ctx.font=`${Math.max(4,w/16)}px sans-serif`;ctx.fillText(fresh&&latest.type==='audio'?'♪ '+latest.title:'PLAYER VIRTUAL',w/2,h/2,w-6);}
    ctx.restore();return true;
  }
  window.__xtoreWindowPlayer={draw,traffic:()=>trafficState.read(),openCamera(){openPanel();panel.querySelector('#xtore-camera').open=true;},cameraActive:()=>Date.now()-lastCamera<1500&&lastCamera>0,exterior:()=>passageState.read()?.person??null,exteriorStatistics:()=>passageState.read(),renderCameraViews};
  // Click the actual camera position already computed by the isometric renderer.
  document.addEventListener('click',e=>{
    const p=window.XPACE_MUPICAM?.pos,convert=window.__dsQuadCvToClient;
    if(!p||!convert)return;const at=convert([{x:p.x,y:p.y-7}])?.[0];
    if(at&&Math.hypot(e.clientX-at.x,e.clientY-at.y)<20){window.__xtoreWindowPlayer.openCamera();}
  });
  setInterval(()=>{
    if(peer?.closed){disconnect();return;}
    if(peer)send(connected?'heartbeat':'hello');
    if(lastMedia&&Date.now()-lastMedia>=TTL)stopMedia();
    if(lastCamera&&Date.now()-lastCamera>=1500)stopCamera();
    exteriorProgram.update(reportTraffic());
    const total=passageState.read()?.person??null;
    panel.querySelector('#xtore-exterior-status').textContent=total===null?'Exterior · contador sin conexión':`Personas que han pasado: ${total.toLocaleString('es')}`;
  },500);
  window.addEventListener('pagehide',event=>{disconnect();if(!event.persisted)exteriorProgram.destroy();});
}
