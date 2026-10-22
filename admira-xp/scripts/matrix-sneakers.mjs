// Matrix · Sneakers Store · Santa Rosa 19 (FLT-102615, orden de Carlos 22-oct-2026).
// The store's own 360° capture (IEU photographs, scene «entrada» by default) with its two
// virtual players mapped on the photographed screens, plus the browser camera that
// estimates sex/age on-device (LIVE_FACE in index.html) and sends the audience to
// api.admira.store/audience for this venue. The Starbucks Matrix (matrix-panorama.mjs)
// is untouched: matrix-preview-ui.mjs picks this module only for this loc.
import * as T from './premium-three.mjs';
import {angularPhotographMaterial,angularPatch} from './panorama-surface.mjs?v=surface-fit-1';
import {PANORAMA_MAP} from '../../xpacios/sneakerstore/next-step/panorama-map.mjs?v=surface-fit-1';

export const SNEAKERS_LOC='sneakers-store-santa-rosa-19';
export const SNEAKERS_SEGMENTATION_URL='https://admira.tv/videoanalytics/xtore/';
export const SNEAKERS_STORE_URL='/xpacios/sneakerstore/?project=sneakers-store&circuit=sneakerstore&loc='+SNEAKERS_LOC;
const PLAYLIST_API='https://mcp.admira.store/playlists/';
// Same channels as xpacios/sneakerstore/contract.json (screen_formats).
export const SNEAKERS_SCREENS=Object.freeze([
 Object.freeze({id:SNEAKERS_LOC+'-screen',orientation:'horizontal',playlist:'playlist-be8a1e99-1cce-4818-a796-da3372216d1e',installations:Object.freeze(['landscape','rear']),es:'Pantalla horizontal · LCD gigante y LED del fondo',en:'Landscape screen · giant LCD and rear LED'}),
 Object.freeze({id:SNEAKERS_LOC+'-entry-display',orientation:'vertical',playlist:'playlist-cadea3fa-89fe-40f9-828f-bd37ce4720db',installations:Object.freeze(['portrait']),es:'Pantalla vertical de entrada',en:'Entrance portrait display'})
]);
export const SNEAKERS_AUDIENCE=Object.freeze({loc:SNEAKERS_LOC,screen:SNEAKERS_SCREENS[0].id});
export const SNEAKERS_SCENES=Object.freeze({
 entrada:Object.freeze({es:'Entrada',en:'Entrance',url:'../../xpacios/sneakerstore/panoramas/entrada.jpg'}),
 centro:Object.freeze({es:'Centro',en:'Centre',url:'../../xpacios/sneakerstore/panoramas/centro.jpg'})
});
// Source crops of the rear LED (one landscape canvas split around the doorway), as
// INSTALLATIONS.rear in xpacios/sneakerstore/next-step/render.mjs: 2880 × 2304.
const REAR_CROPS=[[0,0,1080/2880,1],[1080/2880,0,720/2880,756/2304],[1800/2880,0,1080/2880,1]];

/** Photographed apertures of one scene, grouped by virtual player. Pure; no GPU. */
export function sneakersSurfaces(scene='entrada'){
 const map=PANORAMA_MAP[scene];if(!map)return [];
 const out=[];
 for(const screen of SNEAKERS_SCREENS)for(const s of map.surfaces){
  if(!screen.installations.includes(s.installation))continue;
  const crop=s.installation==='rear'?REAR_CROPS[s.screen]:[0,0,1,1];if(!crop)continue;
  out.push({screen:screen.id,installation:s.installation,quad:s.quad,aperture:s.aperture,guard:s.guard,crop});
 }
 return out;
}
export function playableTracks(playlist){
 return (Array.isArray(playlist?.tracks)?playlist.tracks:[]).filter(t=>typeof t?.url==='string'&&/^https:\/\//.test(t.url)&&/\.(mp4|webm|m4v|mov)(\?|#|$)/i.test(t.url));
}
export function audienceLine(state,en=false){
 if(!state)return en?'Camera unavailable in this view':'Cámara no disponible en esta vista';
 if(state.error)return (en?'Camera: ':'Cámara: ')+state.error;
 if(state.requesting)return en?'Asking for camera permission…':'Pidiendo permiso de cámara…';
 if(!state.active)return en?'Camera off · press «Camera» to segment the audience':'Cámara apagada · pulsa «Cámara» para segmentar la audiencia';
 if(!state.ready)return en?'Camera on · loading the on-device model…':'Cámara encendida · cargando el modelo local…';
 const sex={male:en?'man':'hombre',female:en?'woman':'mujer'}[state.gender]||'—';
 const faces=state.faces===1?(en?'1 face':'1 cara'):`${state.faces||0} ${en?'faces':'caras'}`;
 return `${faces} · ${sex} · ${state.ageBucket||'—'} · ${state.sending?(en?'sending to':'enviando a'):(en?'ready for':'lista para')} /audience (${state.loc} · ${state.screen})`;
}

export async function mountSneakersMatrix(root,{signal,lang='es',onReady=()=>{},scene:initial}={}){
 const en=lang==='en',t=(es,e)=>en?e:es;
 const requested=new URLSearchParams(location.search).get('scene');
 let scene=SNEAKERS_SCENES[initial]?initial:SNEAKERS_SCENES[requested]?requested:'entrada';
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
 root.innerHTML=`<div class="matrix-panorama sneakers-matrix" data-venue="${SNEAKERS_LOC}" aria-label="Sneakers Store · Santa Rosa 19 · 360°"><canvas class="sneakers-matrix-canvas" tabindex="0" aria-label="${t('Foto 360° de la tienda · arrastra para mirar','360° store photograph · drag to look')}"></canvas></div>
 <section class="sneakers-matrix-card" aria-label="${t('Segmentación por cámara','Camera segmentation')}" style="position:absolute;z-index:6;left:16px;bottom:var(--hud-safe-bottom,24px);max-width:min(460px,calc(100% - 32px));background:#061f1fe8;border:1px solid #528a83;border-radius:8px;color:#dcfffa;padding:10px 12px;font:12px/1.45 system-ui;display:grid;gap:7px">
  <b style="font-size:13px">Sneakers Store · Santa Rosa 19 · Matrix</b>
  <div style="display:flex;flex-wrap:wrap;gap:6px">
   <button type="button" data-sneakers="camera" aria-pressed="false">${t('Cámara · segmentar audiencia','Camera · segment audience')}</button>
   <a data-sneakers="segmentation" href="${SNEAKERS_SEGMENTATION_URL}" target="_blank" rel="noopener">${t('Segmentación en directo','Live segmentation')} ↗</a>
  </div>
  <span data-sneakers-audience role="status" aria-live="polite"></span>
  <ul data-sneakers-screens style="margin:0;padding-left:16px"></ul>
 </section>
 <div class="matrix-map-toolbar sneakers-matrix-toolbar">${Object.entries(SNEAKERS_SCENES).map(([id,s])=>`<button type="button" data-sneakers-scene="${id}" aria-pressed="${id===scene}">${t(s.es,s.en)}</button>`).join('')}<button type="button" data-sneakers="play" aria-pressed="false">${t('Reproducir pantallas','Play screens')}</button><button type="button" data-sneakers="home">${t('Vista inicial','Reset view')}</button><a href="${SNEAKERS_STORE_URL}" target="_blank" rel="noopener">${t('Tienda 3D','3D store')} ↗</a><span class="matrix-map-status" role="status">${t('Cargando panorama…','Loading panorama…')}</span></div>`;
 for(const el of root.querySelectorAll('.sneakers-matrix-card button,.sneakers-matrix-card a'))el.style.cssText='background:#082c2cf2;border:1px solid #528a83;border-radius:5px;color:#dcfffa;padding:6px 10px;font:12px/1.4 system-ui;cursor:pointer;text-decoration:none';
 const canvas=root.querySelector('canvas'),status=root.querySelector('.matrix-map-status'),card=root.querySelector('.sneakers-matrix-card'),toolbar=root.querySelector('.sneakers-matrix-toolbar');
 const audience=card.querySelector('[data-sneakers-audience]'),cameraButton=card.querySelector('[data-sneakers="camera"]'),screensList=card.querySelector('[data-sneakers-screens]');
 const playButton=toolbar.querySelector('[data-sneakers="play"]');
 const message=text=>{status.textContent=text;};
 for(const type of ['click','keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','wheel'])for(const el of [card,toolbar])el.addEventListener(type,e=>e.stopPropagation());
 // Like Starbucks: the controls live in Expert when it exists; the card stays on the scene.
 document.querySelector('#telegramDock .tg-actions')?.append(toolbar);

 let disposed=false,frame=0,yaw=PANORAMA_MAP[scene]?.yaw||0,pitch=0,drag=null,playing=false,pollTimer=0;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});renderer.outputColorSpace=T.SRGBColorSpace;
 const three=new T.Scene(),camera=new T.PerspectiveCamera(85,1,.1,20);three.background=new T.Color('#080f14');
 const geometry=new T.SphereGeometry(10,64,40);geometry.scale(-1,1,1);
 const material=angularPhotographMaterial(),sphere=new T.Mesh(geometry,material);three.add(sphere);
 const loader=new T.TextureLoader(),photos=new Map();
 let overlay=new T.Group();three.add(overlay);const overlayResources=[];
 const channels=new Map(SNEAKERS_SCREENS.map(s=>[s.id,{screen:s,tracks:[],index:0,video:null,texture:null,title:'',error:''}]));

 function render(){if(disposed)return;camera.lookAt(Math.cos(pitch)*Math.cos(yaw),Math.sin(pitch),Math.cos(pitch)*Math.sin(yaw));renderer.render(three,camera);}
 function loop(){if(disposed)return;render();frame=playing?requestAnimationFrame(loop):0;}
 function kick(){if(!frame&&!disposed)frame=requestAnimationFrame(loop);}
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();}
 function photo(id){
  if(!photos.has(id))photos.set(id,loader.loadAsync(new URL(SNEAKERS_SCENES[id].url,import.meta.url).href).then(texture=>{
   const source=texture.image,max=Math.min(4096,renderer.capabilities.maxTextureSize);
   if(source.width>max){const image=document.createElement('canvas');image.width=max;image.height=Math.round(source.height*max/source.width);image.getContext('2d').drawImage(source,0,0,image.width,image.height);texture.image=image;}
   texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;return texture;
  }).catch(error=>{photos.delete(id);throw error;}));
  return photos.get(id);
 }
 function clearOverlay(){three.remove(overlay);for(const r of overlayResources.splice(0))r.dispose?.();overlay=new T.Group();three.add(overlay);}
 function buildOverlay(){
  clearOverlay();
  for(const s of sneakersSurfaces(scene)){
   const c=channels.get(s.screen);if(!c?.texture)continue;
   const mesh=angularPatch(s.aperture||[s.quad[0],s.quad[1],s.quad[3],s.quad[2]],c.texture,{quad:s.quad,guard:s.guard,crop:s.crop});
   if(!mesh)continue;mesh.renderOrder=2;mesh.userData.screen=s.screen;overlay.add(mesh);overlayResources.push(mesh.geometry,mesh.material);
  }
  // Restore the photographed doorway/foreground over the virtual content.
  for(const polygon of PANORAMA_MAP[scene]?.occluders||[]){const mesh=angularPatch(polygon,material.map,{guard:0,radius:9.96});if(mesh){mesh.renderOrder=3;overlay.add(mesh);overlayResources.push(mesh.geometry,mesh.material);}}
  canvas.dataset.surfaces=String(overlay.children.filter(m=>m.userData.screen).length);
 }
 function renderScreens(){
  screensList.replaceChildren(...SNEAKERS_SCREENS.map(s=>{const c=channels.get(s.id),li=document.createElement('li');li.dataset.screen=s.id;li.textContent=`${t(s.es,s.en)} · ${s.id} · ${c.error||c.title||t('sin vídeo todavía','no video yet')}`;return li;}));
 }
 async function showScene(id){
  if(!SNEAKERS_SCENES[id]||disposed)return;
  message(t('Cargando panorama…','Loading panorama…'));
  const texture=await photo(id);if(disposed)return;
  scene=id;material.map=texture;material.needsUpdate=true;yaw=PANORAMA_MAP[id]?.yaw||0;pitch=0;camera.fov=85;camera.updateProjectionMatrix();
  for(const b of toolbar.querySelectorAll('[data-sneakers-scene]'))b.setAttribute('aria-pressed',String(b.dataset.sneakersScene===id));
  canvas.dataset.scene=id;buildOverlay();resize();
  message(t(`Panorama 360° · ${SNEAKERS_SCENES[id].es} · arrastra para mirar · rueda para zoom`,`360° panorama · ${SNEAKERS_SCENES[id].en} · drag to look · scroll to zoom`));
 }
 function playTrack(c){
  const track=c.tracks[c.index%c.tracks.length];if(!track||disposed)return;
  c.title=track.title||track.id||'';c.video.src=track.url;c.video.load();
  if(playing)c.video.play().catch(()=>{});renderScreens();
 }
 async function loadChannel(c){
  try{
   const response=await fetch(PLAYLIST_API+c.screen.playlist,{signal});if(!response.ok)throw Error('HTTP '+response.status);
   c.tracks=playableTracks(await response.json());if(!c.tracks.length)throw Error(t('playlist sin vídeos','playlist without videos'));
  }catch(error){if(disposed)return;c.error=t('playlist no disponible','playlist unavailable')+' ('+String(error?.message||error)+')';renderScreens();return;}
  if(disposed)return;
  const video=document.createElement('video');video.crossOrigin='anonymous';video.muted=true;video.playsInline=true;video.preload='auto';video.dataset.screen=c.screen.id;
  video.addEventListener('ended',()=>{c.index=(c.index+1)%c.tracks.length;playTrack(c);});
  video.addEventListener('loadeddata',()=>{if(disposed||c.texture)return;c.texture=new T.VideoTexture(video);c.texture.colorSpace=T.SRGBColorSpace;buildOverlay();kick();});
  video.addEventListener('error',()=>{if(disposed)return;c.error=t('vídeo no reproducible','video not playable');renderScreens();if(c.tracks.length>1){c.index=(c.index+1)%c.tracks.length;playTrack(c);}});
  c.video=video;playTrack(c);
 }
 async function setPlaying(next){
  playing=!!next;playButton.setAttribute('aria-pressed',String(playing));playButton.textContent=playing?t('Pausar pantallas','Pause screens'):t('Reproducir pantallas','Play screens');
  for(const c of channels.values()){if(!c.video)continue;if(playing)c.video.play().catch(()=>{});else c.video.pause();}
  if(playing)kick();
 }
 function syncAudience(){
  const api=window.__xpaceLiveCamera,state=api?.state?.();
  audience.textContent=audienceLine(state,en);cameraButton.disabled=!api;
  cameraButton.setAttribute('aria-pressed',String(!!state?.active));
  cameraButton.textContent=state?.active?t('Apagar cámara','Turn camera off'):t('Cámara · segmentar audiencia','Camera · segment audience');
  card.dataset.camera=state?.active?'on':'off';
 }
 cameraButton.addEventListener('click',async()=>{const api=window.__xpaceLiveCamera;if(!api)return;try{if(api.state().active)await api.stop();else await api.start();}catch{}syncAudience();});
 playButton.addEventListener('click',()=>void setPlaying(!playing));
 toolbar.querySelector('[data-sneakers="home"]').addEventListener('click',()=>{yaw=PANORAMA_MAP[scene]?.yaw||0;pitch=0;camera.fov=85;camera.updateProjectionMatrix();render();});
 for(const b of toolbar.querySelectorAll('[data-sneakers-scene]'))b.addEventListener('click',()=>void showScene(b.dataset.sneakersScene).catch(()=>message(t('No se pudo cargar esa foto 360°','Could not load that 360° photograph'))));
 const zoom=factor=>{camera.fov=T.MathUtils.clamp(camera.fov/factor,35,95);camera.updateProjectionMatrix();render();};
 const handlers={
  pointerdown(e){if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture?.(e.pointerId);canvas.focus();},
  pointermove(e){if(drag?.id!==e.pointerId)return;yaw=drag.yaw-(e.clientX-drag.x)*.003;pitch=T.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.003,-1.35,1.35);render();},
  pointerup(){drag=null;},pointercancel(){drag=null;},
  wheel(e){e.preventDefault();zoom(Math.exp(-e.deltaY*.001));},
  keydown(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch=Math.min(1.35,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-1.35,pitch-.1);if(e.key==='+')zoom(1.15);if(e.key==='-')zoom(1/1.15);render();}
 };
 for(const [name,fn]of Object.entries(handlers))canvas.addEventListener(name,fn,{passive:false});
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 const dispose=()=>{
  if(disposed)return;disposed=true;cancelAnimationFrame(frame);clearInterval(pollTimer);observer.disconnect();
  for(const [name,fn]of Object.entries(handlers))canvas.removeEventListener(name,fn);
  for(const c of channels.values()){if(c.video){c.video.pause();c.video.removeAttribute('src');c.video.load();}c.texture?.dispose();}
  for(const r of overlayResources.splice(0))r.dispose?.();
  for(const p of photos.values())p.then(texture=>texture.dispose(),()=>{});
  geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss?.();toolbar.remove();
  if(window.XpaceSneakersMatrix?.dispose===dispose)delete window.XpaceSneakersMatrix;
 };
 signal?.addEventListener('abort',dispose,{once:true});
 window.XpaceSneakersMatrix={venue:SNEAKERS_LOC,screens:SNEAKERS_SCREENS,audience:SNEAKERS_AUDIENCE,get scene(){return scene;},state:()=>({venue:SNEAKERS_LOC,scene,playing,surfaces:Number(canvas.dataset.surfaces||0),screens:[...channels.values()].map(c=>({id:c.screen.id,orientation:c.screen.orientation,playlist:c.screen.playlist,track:c.title,error:c.error,ready:!!c.texture,playing:!!c.video&&!c.video.paused})),camera:window.__xpaceLiveCamera?.state?.()||null}),show:showScene,play:()=>setPlaying(true),pause:()=>setPlaying(false),dispose};
 renderScreens();syncAudience();pollTimer=setInterval(syncAudience,1000);
 try{
  await showScene(scene);if(disposed)return dispose;
  for(const c of channels.values())void loadChannel(c);
  void setPlaying(true);
  onReady();
 }catch(error){if(!disposed){message(t('No se pudo cargar el panorama. Reintenta desde Matrix.','Could not load panorama. Retry Matrix.'));onReady(String(error?.message||error));}}
 return dispose;
}
