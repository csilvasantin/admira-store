import * as T from '../../../admira-xp/scripts/premium-three.mjs';
import {INSTALLATIONS} from './render.mjs';
import {PANORAMA_MAP,photoRay,projectQuad} from './panorama-map.mjs';

export function createCampaignOverlay(id,campaign,photograph){
 const group=new T.Group(),resources=[],map=PANORAMA_MAP[id];
 if(!map||!campaign)return {group,dispose(){}};
 function mesh(positions,uvs,indices,texture){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false});const m=new T.Mesh(geometry,material);m.renderOrder=texture===photograph?3:2;group.add(m);resources.push(geometry,material);}
 for(const surface of map.surfaces){
  const i=INSTALLATIONS.find(i=>i.id===surface.installation),s=surface.screen===undefined?{x:0,y:0,w:i.width,h:i.height}:i.screens[surface.screen],project=projectQuad(surface.quad),p=[],uv=[],indices=[],steps=20;
  for(let y=0;y<=steps;y++)for(let x=0;x<=steps;x++){const u=x/steps,v=y/steps;p.push(...project(u,v).map(n=>n*9.98));uv.push((s.x+u*s.w)/i.width,1-(s.y+v*s.h)/i.height);}
  for(let y=0;y<steps;y++)for(let x=0;x<steps;x++){const a=y*(steps+1)+x,b=a+1,c=a+steps+1,d=c+1;indices.push(a,c,b,b,c,d);}
  mesh(p,uv,indices,campaign.texture(surface.installation));
 }
 // Foreground is copied from the same original photograph, never retouched.
 for(const polygon of map.occluders){
  const triangles=T.ShapeUtils.triangulateShape(polygon.map(([x,y])=>new T.Vector2(x,y)),[]),p=[],uv=[],indices=[],steps=12;
  for(const triangle of triangles){const start=p.length/3,rows=[];for(let y=0;y<=steps;y++){rows[y]=[];for(let x=0;x<=steps-y;x++){const weights=[1-(x+y)/steps,x/steps,y/steps],pt=[0,1].map(k=>weights.reduce((v,w,j)=>v+w*polygon[triangle[j]][k],0));rows[y][x]=p.length/3;p.push(...photoRay(pt).map(n=>n*9.96));uv.push(pt[0]/2048,1-pt[1]/1024);}}
   for(let y=0;y<steps;y++)for(let x=0;x<steps-y;x++){indices.push(rows[y][x],rows[y+1][x],rows[y][x+1]);if(x<steps-y-1)indices.push(rows[y][x+1],rows[y+1][x],rows[y+1][x+1]);}
  }
  mesh(p,uv,indices,photograph);
 }
 return {group,dispose(){for(const r of resources)r.dispose();}};
}
