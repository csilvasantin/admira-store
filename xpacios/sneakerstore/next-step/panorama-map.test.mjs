import test from 'node:test';
import assert from 'node:assert/strict';
import {PANORAMA_MAP,photoRay,projectQuad} from './panorama-map.mjs';
import {INSTALLATIONS} from './render.mjs';
test('every photographed screen keeps its observed corners under spherical projection',()=>{
 for(const map of Object.values(PANORAMA_MAP))for(const surface of map.surfaces){
  const project=projectQuad(surface.quad);
  [[0,0],[1,0],[0,1],[1,1]].forEach(([u,v],n)=>{const ray=project(u,v),expected=photoRay(surface.quad[n]);assert.ok(Math.hypot(...ray.map((x,i)=>x-expected[i]))<1e-9);});
  for(const [u,v] of [[.5,.5],[.1,.9],[.9,.1]])assert.ok(Math.abs(Math.hypot(...project(u,v))-1)<1e-12);
  const i=INSTALLATIONS.find(i=>i.id===surface.installation);assert.ok(i);if(surface.screen!==undefined)assert.ok(i.screens[surface.screen]);
 }
});
test('projection survives the panorama seam without reflecting or widening a screen',()=>{
 const project=projectQuad([[2040,400],[8,400],[2040,600],[8,600]]),middle=project(.5,.5);assert.ok(middle[0]>.99);assert.ok(Math.abs(middle[2])<1e-9);
});
test('rear photographic doorway and foreground remain explicitly protected',()=>{
 for(const id of ['entrada','centro','fondo']){assert.ok(PANORAMA_MAP[id].surfaces.some(s=>s.installation==='rear'));assert.ok(PANORAMA_MAP[id].occluders.length);}
});
