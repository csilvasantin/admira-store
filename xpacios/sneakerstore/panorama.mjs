import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {createCampaignOverlay} from './next-step/panorama-overlay.mjs?v=surface-fit-1';
import {PANORAMA_MAP} from './next-step/panorama-map.mjs?v=surface-fit-1';
import {angularPhotographMaterial} from '../../admira-xp/scripts/panorama-surface.mjs?v=surface-fit-1';

// Store-owned IEU photographs only. Camera streams and credentials stay in IEU.
export const SCENES = {
  entrada: {es:'Entrada',en:'Entrance',url:'./panoramas/entrada.jpg',yaw:0},
  centro: {es:'Centro',en:'Centre',url:'./panoramas/centro.jpg',yaw:Math.PI},
  fondo: {es:'Fondo',en:'Rear',url:'./panoramas/fondo.jpg',yaw:Math.PI},
};

export function createPanorama({canvas,onState=()=>{},onError=()=>{}}) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
  renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(85,1,.1,20);
  const geometry=new T.SphereGeometry(10,64,40);geometry.scale(-1,1,1);
  const material=angularPhotographMaterial(),sphere=new T.Mesh(geometry,material);
  scene.add(sphere);scene.background=new T.Color('#080f14');
  const cache=new Map(),pending=new Map(),loader=new T.TextureLoader();
  let active=false,disposed=false,current='',request=0,yaw=0,pitch=0,drag=null;
  let campaign=null,overlay=null;
  function refreshOverlay(){if(overlay){scene.remove(overlay.group);overlay.dispose();overlay=null;}if(campaign&&current&&material.map){overlay=createCampaignOverlay(current,campaign,material.map);scene.add(overlay.group);}canvas.dataset.campaign=campaign?'next-step':'';}
  function render(){if(!active||disposed)return;camera.lookAt(Math.cos(pitch)*Math.cos(yaw),Math.sin(pitch),Math.cos(pitch)*Math.sin(yaw));canvas.dataset.yaw=String(yaw);canvas.dataset.pitch=String(pitch);canvas.dataset.fov=String(camera.fov);canvas.dataset.mapping='angular-aperture-v1';renderer.render(scene,camera);}
  function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();}
  function textureFor(id){
    if(cache.has(id))return Promise.resolve(cache.get(id));
    if(!pending.has(id))pending.set(id,loader.loadAsync(new URL(SCENES[id].url,import.meta.url).href).then(texture=>{
      if(disposed){texture.dispose();throw Error('disposed');}
      // Retain the original photograph on disk; bound GPU memory on mobile.
      const source=texture.image,max=Math.min(4096,renderer.capabilities.maxTextureSize);
      if(source.width>max){const image=document.createElement('canvas');image.width=max;image.height=Math.round(source.height*max/source.width);image.getContext('2d').drawImage(source,0,0,image.width,image.height);texture.image=image;}
      texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;cache.set(id,texture);return texture;
    }).finally(()=>pending.delete(id)));
    return pending.get(id);
  }
  async function show(id='entrada') {
    if(!SCENES[id]||disposed)return;
    active=true;canvas.hidden=false;const serial=++request;
    onState({id,loading:true});
    try {
      const texture=await textureFor(id);if(disposed||serial!==request||!active)return;
      material.map=texture;material.needsUpdate=true;current=id;yaw=campaign?PANORAMA_MAP[id].yaw:SCENES[id].yaw;pitch=0;camera.fov=85;camera.updateProjectionMatrix();refreshOverlay();resize();onState({id,loading:false});
    } catch(error){if(serial===request&&!disposed)onError(error);}
  }
  function zoom(factor){camera.fov=T.MathUtils.clamp(camera.fov/factor,35,95);camera.updateProjectionMatrix();render();}
  const handlers={
    pointerdown(e){if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);canvas.focus();},
    pointermove(e){if(drag?.id!==e.pointerId)return;yaw=drag.yaw-(e.clientX-drag.x)*.003;pitch=T.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.003,-1.35,1.35);render();},
    pointerup(){drag=null;},pointercancel(){drag=null;},
    wheel(e){e.preventDefault();zoom(Math.exp(-e.deltaY*.001));},
    keydown(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch=Math.min(1.35,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-1.35,pitch-.1);if(e.key==='+')zoom(1.15);if(e.key==='-')zoom(1/1.15);render();}
  };
  for(const [name,fn]of Object.entries(handlers))canvas.addEventListener(name,fn,{passive:false});
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  return {show,zoom,render,setCampaign(next){const changed=next!==campaign;campaign=next;if(changed&&campaign&&current){yaw=PANORAMA_MAP[current].yaw;pitch=0;}if(changed)refreshOverlay();render();},get current(){return current;},hide(){active=false;++request;canvas.hidden=true;drag=null;},dispose(){disposed=true;active=false;++request;overlay?.dispose();observer.disconnect();for(const[name,fn]of Object.entries(handlers))canvas.removeEventListener(name,fn);for(const texture of cache.values())texture.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
