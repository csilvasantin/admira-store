import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createSceneSnapshot} from './xtanco-scene-snapshot.mjs';
import {normalizeSnapshot} from './premium-model.mjs';
const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185};
const at=(col,row,kind)=>({x:iso.ox+(col-row)*40-(kind==='customer'?5:7),y:iso.oy+(col+row)*14-20});
test('both views receive the running layout and stable actor identities without changing the simulation',()=>{
 const snapshot=createSceneSnapshot(),staff={...at(3,2),hired:true,dir:1},customer={...at(6,4,'customer'),st:'walk'};
 const game={staff:[staff,{...at(8,1),hired:false}],custs:[customer],passersby:[],custIn:7,doorAnim:.4};
 const layout=[{id:'desk',type:'manager',col:5,row:4,sx:1.2,rot:1}];
 const raw={active:true,iso,layout,game,footprints:{manager:[2,1]}},before=JSON.stringify(raw);
 const a=snapshot(raw);assert.equal(JSON.stringify(raw),before);
 assert.deepEqual(a.actors.map(v=>[v.col,v.row]),[[3,2],[6,4]]);assert.equal(a.entries,7);assert.equal(a.inside,1);
 assert.deepEqual(a.layout[0].fp,[2,1]);assert.equal(a.layout[0].rot,1);
 customer.x+=40;const b=snapshot(raw);assert.equal(a.actors[1].id,b.actors[1].id);assert.equal(b.actors[1].col,6.5);
 b.layout[0].fp[0]=99;assert.deepEqual(raw.footprints.manager,[2,1]);
 assert.equal(snapshot({...raw,active:false}),null);
});
// Run the legacy wall helpers themselves so changed defaults remain visible here.
function wallHelpers(ISO){
 const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const start=source.indexOf('function getWallItemFootprintCols('),end=source.indexOf('// Devuelve el polígono REAL',start);
 const context=vm.createContext({ISO,toIso:(col,row)=>({x:ISO.ox+(col-row)*ISO.tileW/2,y:ISO.oy+(col+row)*ISO.tileH/2})});
 vm.runInContext(source.slice(start,end),context);
 return {isWallMountedType:type=>['tft','door','aroma','led','tablet','metahuman'].includes(type),getWallItemRenderPoly:context.getWallItemRenderPoly};
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('custom reference heights are converted from pixels before renderer normalization',()=>{
 const snapshot=createSceneSnapshot(),layout=[{id:'imported',type:'custom',col:3,row:4,ph:46},{id:'default',type:'custom',col:5,row:2},{id:'short',type:'custom',col:7,row:1,ph:4}];
 const raw={active:true,iso,layout,game:{}},before=JSON.stringify(raw),scene=snapshot(raw),unit=iso.wallH/scene.wallHeight;
 near(scene.layout[0].ph,46/unit);near(scene.layout[1].ph,46/unit);near(scene.layout[2].ph,12/unit);
 near(normalizeSnapshot(scene).layout[0].ph,46/unit);assert.notEqual(normalizeSnapshot(scene).layout[0].ph,8);
 assert.equal(JSON.stringify(raw),before);assert.equal(scene.layout[0].wallY,undefined);
});
test('wall height and center follow legacy TFT, door, aroma and LED polygons in world units',()=>{
 const snapshot=createSceneSnapshot(),layout=[{id:'tft',type:'tft',col:9,row:0,wallY:12},{id:'default-tft',type:'tft',col:5,row:0},{id:'door',type:'door',col:10,row:0},{id:'aroma',type:'aroma',col:1,row:0},{id:'led',type:'led',col:0,row:0,wallY:90}];
 const raw={active:true,iso,layout,game:{},wallHelpers:wallHelpers(iso)},before=JSON.stringify(layout),scene=snapshot(raw),unit=iso.wallH/scene.wallHeight;
 near(scene.layout[0].ph,90/unit);near(scene.layout[0].wallY,(165-12-45)/unit);
 near(scene.layout[1].wallY,(165-Math.round(165*.02)-45)/unit);
 near(scene.layout[2].ph,Math.round(165*.75)/unit);near(scene.layout[2].wallY,Math.round(165*.75)/2/unit);
 near(scene.layout[3].ph,34/unit);near(scene.layout[3].wallY,(165-12-17)/unit);
 const ledHeight=Math.max(14,Math.round(165*.12));near(scene.layout[4].ph,ledHeight/unit);near(scene.layout[4].wallY,(165+ledHeight/2)/unit);
 assert.equal(JSON.stringify(layout),before);
 const normalized=normalizeSnapshot(scene);near(normalized.layout[0].wallY,scene.layout[0].wallY);assert.ok(normalized.layout[0].wallY<scene.wallHeight);
});
test('wall conversion respects moved items and updated isometric dimensions without retaining pixel coordinates',()=>{
 const snapshot=createSceneSnapshot(),movedIso={...iso,tileW:120,tileH:42,wallH:330,ox:620,oy:210},layout=[{id:'left',type:'tft',col:2,row:0,wallY:24},{id:'right',type:'tft',col:10,row:0,wallY:24},{id:'top',type:'aroma',col:1,row:0,wallY:0}];
 const scene=snapshot({active:true,iso:movedIso,layout,game:{},wallHelpers:wallHelpers(movedIso)}),unit=movedIso.wallH/scene.wallHeight;
 near(scene.layout[0].ph,135/unit);near(scene.layout[0].wallY,(330-24-135/2)/unit);
 near(scene.layout[0].wallY,scene.layout[1].wallY);near(scene.layout[2].wallY,(330-17)/unit);
});
