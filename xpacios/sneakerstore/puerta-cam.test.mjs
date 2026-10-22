// Puerta Cam como en IEU (Carlos, 22-oct-2026): tarjeta sobre la puerta y «Ver stream» con el vídeo de la calle de la
// pestaña de IEU compartida, recortado al recuadro de la cámara.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PerspectiveCamera,Vector3} from '../../admira-xp/scripts/premium-three.mjs';
import {CROP_KEY,cropFromCorners,parseCrop,sourceRect,createPuertaCam,SHARE_OPTIONS,STREAM_ENDPOINT,HLS_URL} from './puerta-cam.mjs';
import {PUERTA_CAM_ANCHOR,directionOf,hotspotAt} from './hotspots.mjs';

const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
function fakeStream(){
  const track={readyState:'live',listeners:{},stop(){this.readyState='ended';},addEventListener(type,fn){this.listeners[type]=fn;}};
  return {track,getVideoTracks:()=>[track],getTracks:()=>[track]};
}
function memoryStorage(){const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),map};}

test('el recorte sale de dos esquinas en cualquier orden y descarta clics sueltos o datos rotos',()=>{
  assert.deepEqual(cropFromCorners({x:.6,y:.3},{x:.3,y:.05}),{x:.3,y:.05,w:.3,h:.25});
  assert.equal(cropFromCorners({x:.5,y:.5},{x:.51,y:.52}),null,'un clic suelto no es un recuadro');
  assert.equal(cropFromCorners({x:-1,y:.5},{x:.5,y:.6}),null);assert.equal(cropFromCorners(null,{x:.5,y:.6}),null);
  assert.deepEqual(parseCrop('{"x":0.3,"y":0.05,"w":0.3,"h":0.25}'),{x:.3,y:.05,w:.3,h:.25});
  for(const bad of ['', 'null', '{"x":0.8,"y":0,"w":0.5,"h":0.2}', '{"x":0.1,"y":0.1,"w":0,"h":0.2}', '{"x":"0.1","y":0,"w":0.2,"h":0.2}'])assert.equal(parseCrop(bad),null,bad);
  assert.deepEqual(sourceRect(null,1920,1080),{sx:0,sy:0,sw:1920,sh:1080},'sin recorte, toda la pestaña');
  assert.deepEqual(sourceRect({x:.25,y:.1,w:.5,h:.3},1920,1080),{sx:480,sy:108,sw:960,sh:324});
});

test('la pestaña de IEU se comparte una sola vez para la ventana y el segmentado, y se libera al dejar de compartir',async()=>{
  let calls=0,last=null;const changes=[];
  const navigator={mediaDevices:{getDisplayMedia:async options=>{calls++;assert.deepEqual(options,SHARE_OPTIONS);return last=fakeStream();}}};
  const cam=createPuertaCam({navigator,onChange:()=>changes.push(cam.live)});
  assert.equal(cam.live,false);assert.equal(cam.stream,null);
  const [a,b]=await Promise.all([cam.share(),cam.share()]);assert.equal(a,b);assert.equal(calls,1,'dos peticiones a la vez, un solo selector');
  assert.equal(await cam.share(),a);assert.equal(calls,1,'ya compartida: se reutiliza');assert.equal(cam.live,true);
  last.track.readyState='ended';last.track.listeners.ended();assert.equal(cam.live,false);assert.equal(cam.stream,null,'cerrar la pestaña en Chrome la libera');
  await cam.share();assert.equal(calls,2);cam.stop();assert.equal(last.track.readyState,'ended');assert.equal(cam.live,false);
  assert.deepEqual(changes,[true,false,true,false]);
  await assert.rejects(createPuertaCam({navigator:{}}).share(),/share_unsupported/);
});

test('el recorte se recuerda en este navegador y uno guardado roto se ignora',()=>{
  const storage=memoryStorage();
  const cam=createPuertaCam({navigator:{},storage});assert.equal(cam.crop,null);
  cam.setCrop({x:.3,y:.05,w:.3,h:.25});assert.deepEqual(parseCrop(storage.getItem(CROP_KEY)),{x:.3,y:.05,w:.3,h:.25});
  assert.deepEqual(createPuertaCam({navigator:{},storage}).crop,{x:.3,y:.05,w:.3,h:.25},'vuelve al recargar');
  cam.setCrop(null);assert.equal(storage.getItem(CROP_KEY),null);
  storage.setItem(CROP_KEY,'{roto');assert.equal(createPuertaCam({navigator:{},storage}).crop,null);
});

test('la tarjeta Puerta Cam va sobre la puerta de IoT Gallery, centrada en la vista inicial de Entrada',()=>{
  assert.equal(PUERTA_CAM_ANCHOR.scene,'entrada');
  const d=directionOf(PUERTA_CAM_ANCHOR);assert.equal(hotspotAt('entrada',d),'iot-gallery');
  const camera=new PerspectiveCamera(85,1280/754,.1,20);camera.lookAt(1,0,0);camera.updateMatrixWorld();
  const p=new Vector3(d.x,d.y,d.z).multiplyScalar(5).project(camera),x=(p.x+1)/2*1280,y=(1-p.y)/2*754;
  assert.ok(x>600&&x<720,'centrada en la puerta: x='+x);assert.ok(y>260&&y<360,'bajo el rótulo: y='+y);
});

test('la tienda carga Puerta Cam aparte; IoT Gallery y «Ver stream» abren la ventana del stream con la misma pestaña que el segmentado',()=>{
  const store=read('./store.mjs'),ui=read('./puerta-cam-ui.mjs'),seg=read('./segmentado-ui.mjs'),panorama=read('./panorama.mjs');
  assert.doesNotMatch(store,/^\s*import\s[^;]*\/puerta-cam(-ui)?\.mjs/m,'nada de import estático: si falla, la tienda sigue');
  assert.match(store,/import\('\.\/puerta-cam-ui\.mjs\?v=puerta-cam-2'\)\.then\(/);assert.match(store,/\.catch\(error=>\{console\.warn\('Puerta Cam no disponible',error\);return null;\}\)/);
  assert.match(store,/if\(puerta\)\{puerta\.open\(\);return Promise\.resolve\(\);\}/,'IoT Gallery abre la ventana Puerta Cam');
  assert.match(store,/mountSegmented\(\{document,t,en,channels,status,puertaCam:puerta\?\.cam\|\|null\}\)/);
  assert.match(store,/void puertaReady\.then\(p=>p\?\.attach\(panorama\)\)/,'la tarjeta se ancla a la 360');
  assert.match(seg,/state\.stream=puertaCam\?await puertaCam\.share\(\{direct:true\}\):await navigator\.mediaDevices\.getDisplayMedia\(/,'el segmentado prueba antes el directo, sin selector');
  assert.match(seg,/if\(state\.stream&&state\.stream!==puertaCam\?\.stream\)state\.stream\.getTracks\(\)/,'el segmentado no corta la pestaña que también usa la ventana');
  assert.match(seg,/direct\?t\('Directo de IEU · detector COCO-SSD en el navegador'/,'el segmentado dice de dónde sale el vídeo');
  assert.match(ui,/movableWindow\(win,handle,\{key:'sneakerstore\.puertaCam\.window\.v1',bounds:stage,storage,closeButton:winClose,onClose:closeWindow\}\)/,'ventana movible y con cierre');
  assert.match(ui,/chip\.textContent=live\?t\('TRANSMITIENDO','STREAMING'\):t\('EN IEU','IN IEU'\)/,'solo «transmitiendo» cuando llega vídeo de verdad');
  assert.match(ui,/if\(!cam\.live&&DIRECT_DOWN\.has\(directError\)\)\{openIeu\(\);shareButton\.focus\(\);\}/,'sin directo, IEU y a compartir como antes');
  assert.match(ui,/cam\.connect\(\)\.then\(/,'«Ver stream» pide primero el directo');
  assert.match(ui,/sourceRect\(cropping\|\|cam\.source!=='tab'\?null:cam\.crop,/,'el recorte solo vale para la pestaña compartida');
  assert.match(ui,/await cam\.share\(\{direct:false\}\)/,'el botón de compartir abre el selector');
  assert.match(panorama,/anchor\(element,point\)\{/);assert.match(panorama,/renderer\.render\(scene,camera\);placeAnchors\(\);\}/);
});

// ── Directo de IEU (token de cámaras en el servidor) ──────────────────────────────────────────────────────────────
function directHarness({status=200,body={ok:true,url:'https://digitaltwin.ieu.ai/hub/streams/T1/index.m3u8'},native=false,supported=true}={}){
  const calls=[],hls=[];let streamTrack=null;
  const fetcher=async(url,options)=>{calls.push({url,options});return {ok:status>=200&&status<300,status,json:async()=>body};};
  class Hls{static isSupported(){return supported;}static Events={ERROR:'hlsError'};constructor(config){this.config=config;this.handlers={};hls.push(this);}
    loadSource(u){this.source=u;}attachMedia(v){this.media=v;}on(e,fn){this.handlers[e]=fn;}destroy(){this.destroyed=true;}}
  const document={createElement:()=>({canPlayType:()=>native?'maybe':'',play:async()=>{},pause(){},load(){},removeAttribute(){},captureStream(){const s=fakeStream();streamTrack=s.track;return s;}})};
  const loads=[];const cam=createPuertaCam({fetcher,document,loadHls:async()=>{loads.push(HLS_URL);return {default:Hls};},navigator:{mediaDevices:{getDisplayMedia:async()=>{calls.push({picker:true});return fakeStream();}}}});
  return {cam,calls,hls,loads,track:()=>streamTrack};
}
test('«Ver stream» reproduce el directo que firma nuestro servidor: sin IEU abierto ni selector de Chrome',async()=>{
  const h=directHarness();const stream=await h.cam.connect();
  assert.equal(h.calls[0].url,STREAM_ENDPOINT);assert.equal(h.calls[0].options.method,'POST');assert.equal(h.calls[0].options.credentials,'same-origin');
  assert.equal(h.loads.length,1,'hls.js solo se carga para reproducir');assert.equal(h.hls[0].source,'https://digitaltwin.ieu.ai/hub/streams/T1/index.m3u8');
  assert.equal(h.cam.live,true);assert.equal(h.cam.source,'direct');assert.equal(h.cam.stream,stream);
  assert.equal(await h.cam.share({direct:true}),stream,'el segmentado reutiliza el directo');assert.equal(h.calls.some(c=>c.picker),false);
  // Un enlace caducado (12 h) o un corte cierran el directo; el siguiente «Ver stream» pide otro.
  h.hls[0].handlers.hlsError(null,{fatal:true});assert.equal(h.cam.live,false);assert.equal(h.hls[0].destroyed,true);
  const native=directHarness({native:true});await native.cam.connect();assert.equal(native.loads.length,0,'HLS nativo (Safari) sin hls.js');
});
test('sin sesión, sin token o con IEU caído el directo dice por qué, y el segmentado cae a la pestaña compartida',async()=>{
  for(const [status,body,code] of [[401,{ok:false,error:'login_required',login:'/auth/login?return_to=%2Fxpacios%2Fsneakerstore%2F'},'login_required'],[503,{ok:false,error:'not_configured'},'not_configured'],[502,{ok:false,error:'ieu_401'},'ieu_401'],[200,{ok:true},'http_200']]){
    const h=directHarness({status,body});await assert.rejects(h.cam.connect(),e=>e.code===code);assert.equal(h.cam.live,false);
    const s=await h.cam.share({direct:true});assert.equal(h.calls.filter(c=>c.picker).length,1,'después, el selector de la pestaña');assert.equal(h.cam.source,'tab');assert.equal(h.cam.stream,s);
  }
  const h=directHarness({supported:false});await assert.rejects(h.cam.connect(),e=>e.code==='hls_unsupported');
});
