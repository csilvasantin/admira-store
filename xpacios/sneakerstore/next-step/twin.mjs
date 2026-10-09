import {loadCreatorMedia} from './creator-media.mjs?v=creator-tools-2';
import * as T from '../../../admira-xp/scripts/premium-three.mjs';
import {fitScreenAperture} from '../screen-format.mjs?v=surface-fit-1';
import {drawCreatorCampaign} from './creator-render.mjs?v=creator-tools-2';
import {INSTALLATIONS,drawNextStep,loadNextStepAssets,createClock} from './render.mjs';
// Replacement textures are session-only. Original geometry/material state restores on stop.
export function mapCampaignSurface(mesh,installation,texture,rect=null){
 if(!mesh?.material?.map)return()=>{};
 const state={map:mesh.material.map,visible:mesh.visible,scale:mesh.scale.clone(),position:mesh.position.clone(),uv:mesh.geometry.getAttribute('uv')};
 const restore=()=>{mesh.material.map=state.map;mesh.material.needsUpdate=true;mesh.visible=state.visible;mesh.scale.copy(state.scale);mesh.position.copy(state.position);if(state.uv)mesh.geometry.setAttribute('uv',state.uv);else mesh.geometry.deleteAttribute('uv');};
 const source=rect||{x:0,y:0,w:installation?.width,h:installation?.height},size=mesh.geometry.parameters;
 const bounded=[source.x,source.y,source.w,source.h,installation?.width,installation?.height].every(Number.isFinite)&&source.x>=0&&source.y>=0&&source.w>0&&source.h>0&&source.x+source.w<=installation.width+1e-7&&source.y+source.h<=installation.height+1e-7;
 const fit=bounded&&texture&&fitScreenAperture(mesh.userData.aperture,source.w,source.h);
 if(!fit||!Number.isFinite(size?.width)||!Number.isFinite(size?.height)||size.width<=0||size.height<=0){mesh.visible=false;return restore;}
 const u0=source.x/installation.width,u1=(source.x+source.w)/installation.width,v0=1-(source.y+source.h)/installation.height,v1=1-source.y/installation.height;
 mesh.material.map=texture;mesh.material.needsUpdate=true;mesh.visible=true;mesh.scale.set(fit.w/size.width,fit.h/size.height,1);
 if(mesh.userData.apertureCenter)mesh.position.copy(mesh.userData.apertureCenter);
 mesh.geometry.setAttribute('uv',new T.Float32BufferAttribute([u0,v1,u1,v1,u0,v0,u1,v0],2));
 return restore;
}

export async function mountNextStep({objects,en=false,creator=null}){
 const product=await loadNextStepAssets(),media=creator?.mode==='full'?await loadCreatorMedia(creator):null,clock=createClock(),masters=new Map(),undo=[];let active=true,last=-1,lastTime=-1;
 for(const i of INSTALLATIONS){const canvas=document.createElement('canvas');canvas.width=Math.round(i.width*Math.min(1,960/i.width,960/i.height));canvas.height=Math.round(i.height*canvas.width/i.width);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearFilter;texture.generateMipmaps=false;masters.set(i.id,{canvas,texture,i});}
 function map(mesh,id,rect=null){const master=masters.get(id);undo.push(mapCampaignSurface(mesh,master?.i,master?.texture,rect));}
 function planes(id){const list=[];objects.get(id)?.traverse(m=>{if(m.isMesh&&m.material?.map)list.push(m);});return list;}
 map(planes('screen')[0],'landscape');map(planes('entry-display')[0],'portrait');map(planes('tablet')[0],'tablet');map(planes('narrow-led')[0],'column');for(const m of planes('upper-displays'))map(m,'strip');
 const jordan=INSTALLATIONS.find(i=>i.id==='jordan');planes('left-video-bank').forEach((m,n)=>map(m,'jordan',jordan.screens[n]));
 const rear=INSTALLATIONS.find(i=>i.id==='rear'),rearAperture=objects.get('back-wall')?.userData.aperture;
 for(const m of planes('back-wall')){const r=m.userData.rearRect;if(!r||!rearAperture)continue;map(m,'rear',{x:(1-(r.x+r.w)/rearAperture.w)*rear.width,y:(1-(r.y+r.h)/rearAperture.h)*rear.height,w:r.w/rearAperture.w*rear.width,h:r.h/rearAperture.h*rear.height});}
 function update(now){if(!active||now-last<50)return false;last=now;const sec=clock.time();if(sec===lastTime)return false;lastTime=sec;for(const {canvas,texture,i}of masters.values()){if(creator)drawCreatorCampaign(canvas,i,media?.frame(sec)||product,sec,creator,media?.background);else drawNextStep(canvas,i,product,sec,en);texture.needsUpdate=true;}return true;}
 update(0);
 return {update,texture:id=>masters.get(id)?.texture,pause:()=>{clock.pause();media?.pause();},play:()=>{clock.play();media?.play().catch(()=>clock.pause());},restart:()=>{clock.restart();media?.restart();},get paused(){return clock.paused;},stop(){if(!active)return;active=false;media?.dispose();for(const restore of undo)restore();for(const {texture}of masters.values())texture.dispose();}};
}
