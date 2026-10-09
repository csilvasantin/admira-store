import {loadCreatorMedia} from './creator-media.mjs?v=creator-full-1';
import * as T from '../../../admira-xp/scripts/premium-three.mjs';
import {drawCreatorCampaign} from './creator-render.mjs?v=creator-full-1';
import {INSTALLATIONS,drawNextStep,loadNextStepAssets,createClock} from './render.mjs';
// Replacement textures are session-only. Original geometry/material state restores on stop.
export async function mountNextStep({objects,en=false,creator=null}){
 const product=await loadNextStepAssets(),media=creator?.mode==='full'?await loadCreatorMedia(creator):null,clock=createClock(),masters=new Map(),undo=[];let active=true,last=-1,lastTime=-1;
 for(const i of INSTALLATIONS){const canvas=document.createElement('canvas');canvas.width=Math.round(i.width*Math.min(1,960/i.width,960/i.height));canvas.height=Math.round(i.height*canvas.width/i.width);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearFilter;texture.generateMipmaps=false;masters.set(i.id,{canvas,texture,i});}
 function map(mesh,id,uv=null,scale=null){if(!mesh?.material?.map)return;undo.push({mesh,map:mesh.material.map,visible:mesh.visible,scale:mesh.scale.clone(),position:mesh.position.clone(),uv:mesh.geometry.getAttribute('uv').clone()});mesh.material.map=masters.get(id).texture;mesh.material.needsUpdate=true;mesh.visible=true;if(scale)mesh.scale.set(...scale);if(uv)mesh.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}
 function planes(id){const list=[];objects.get(id)?.traverse(m=>{if(m.isMesh&&m.material?.map)list.push(m);});return list;}
 map(planes('screen')[0],'landscape',null,[3.34,1.88,1]);map(planes('entry-display')[0],'portrait',null,[1.00125,1.78,1]);map(planes('tablet')[0],'tablet',null,[1,.9411764706,1]);map(planes('narrow-led')[0],'column',null,[1,.8780487805,1]);for(const m of planes('upper-displays'))map(m,'strip',null,[1,.4464285714,1]);
 const jordan=INSTALLATIONS.find(i=>i.id==='jordan');planes('left-video-bank').forEach((m,n)=>{const s=jordan.screens[n],u0=s.x/jordan.width,u1=(s.x+s.w)/jordan.width,v0=1-s.h/jordan.height;map(m,'jordan',[u0,1,u1,1,u0,v0,u1,v0]);});
 for(const m of planes('back-wall')){const r=m.userData.rearRect;if(!r)continue;map(m,'rear',[1-(r.x+r.w)/4,(r.y+r.h)/3.2,1-r.x/4,(r.y+r.h)/3.2,1-(r.x+r.w)/4,r.y/3.2,1-r.x/4,r.y/3.2],[1,1,1]);m.position.set(r.x+r.w/2,r.y+r.h/2,-.035);}
 function update(now){if(!active||now-last<50)return false;last=now;const sec=clock.time();if(sec===lastTime)return false;lastTime=sec;for(const {canvas,texture,i}of masters.values()){if(creator)drawCreatorCampaign(canvas,i,media?.frame(sec)||product,sec,creator);else drawNextStep(canvas,i,product,sec,en);texture.needsUpdate=true;}return true;}
 update(0);
 return {update,texture:id=>masters.get(id)?.texture,pause:()=>{clock.pause();media?.pause();},play:()=>{clock.play();media?.play().catch(()=>clock.pause());},restart:()=>{clock.restart();media?.restart();},get paused(){return clock.paused;},stop(){if(!active)return;active=false;media?.dispose();for(const s of undo){s.mesh.material.map=s.map;s.mesh.material.needsUpdate=true;s.mesh.visible=s.visible;s.mesh.scale.copy(s.scale);s.mesh.position.copy(s.position);s.mesh.geometry.setAttribute('uv',s.uv);}for(const {texture}of masters.values())texture.dispose();}};
}
