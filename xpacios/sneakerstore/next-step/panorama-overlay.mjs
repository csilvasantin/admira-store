import * as T from '../../../admira-xp/scripts/premium-three.mjs';
import {angularPatch} from '../../../admira-xp/scripts/panorama-surface.mjs?v=surface-fit-1';
import {INSTALLATIONS} from './render.mjs';
import {PANORAMA_MAP} from './panorama-map.mjs?v=surface-fit-1';

export function createCampaignOverlay(id,campaign,photograph){
 const group=new T.Group(),resources=[],map=PANORAMA_MAP[id];
 if(!map||!campaign)return {group,dispose(){}};
 function add(mesh,order){if(!mesh)return;mesh.renderOrder=order;group.add(mesh);resources.push(mesh.geometry,mesh.material);}
 for(const surface of map.surfaces){
  const i=INSTALLATIONS.find(i=>i.id===surface.installation);if(!i)continue;
  const s=surface.screen===undefined?{x:0,y:0,w:i.width,h:i.height}:i.screens[surface.screen];if(!s)continue;
  const q=surface.quad,aperture=surface.aperture||[q[0],q[1],q[3],q[2]];
  add(angularPatch(aperture,campaign.texture(surface.installation),{quad:q,guard:surface.guard,crop:[s.x/i.width,s.y/i.height,s.w/i.width,s.h/i.height]}),2);
 }
 // Same per-fragment camera ray restores only the actual doorway/foreground.
 for(const polygon of map.occluders)add(angularPatch(polygon,photograph,{guard:0,radius:9.96}),3);
 return {group,dispose(){for(const r of resources)r.dispose();}};
}
