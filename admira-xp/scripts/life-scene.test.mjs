import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifeScene} from './life-scene.mjs';
import {Group,Box3} from './premium-three.mjs';
import {VISITOR_PROFILES} from './visitor-profiles.mjs';
import {buildCustomerNavigation} from './customer-navigation.mjs';

// Canvas drawing is procedural; these offline tests exercise ownership and
// geometry contracts. Actual shading and composition are reviewed in WebGL.
const canvasFactory=()=>({width:0,height:0,getContext:()=>new Proxy({},{
  get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)
})});
const input={cols:14,rows:8,wallHeight:3.25,inside:2,entries:17,
  layout:[{id:'counter',type:'counter',col:1,row:2,sx:1.2,sy:.9,rot:1,flipX:true,label:'Caja'},
    {id:'shelf',type:'shelves',col:4,row:1},{id:'wine',type:'wineRack',col:6,row:1},
    {id:'lamp',type:'floorLamp',col:10,row:5},{id:'screen',type:'tft',col:9,row:0,ph:.8,wallY:2.2},
    {id:'assistant',type:'metahuman',col:13,row:3}],
  actors:[{id:'ana',label:'Ana',kind:'staff',col:2,row:3,heading:0,walking:false,
    color:'#648f78',skin:'#c68642',hair:'#443322',pants:'#334455',shoes:'#223344',scale:.9,accessory:1}]
};
const meshes=model=>{const result=[];model.scene.traverse(o=>{if(o.isMesh)result.push(o);});return result;};

test('Better and Best keep seven distinct Starbucks drop identities and restore each screen texture',()=>{
 for(const quality of ['better','best']){
  const raw={...input,venue:'alsea-sbux-021',layout:globalThis.XpaceStarbucks.layout(),actors:[]},model=createLifeScene(raw,{canvasFactory,assetQuality:quality});
  const screens=meshes(model).filter(o=>o.userData.previewOnly);assert.equal(screens.length,7);assert.equal(new Set(screens.map(o=>o.userData.surfaceId)).size,7);
  assert.equal(meshes(model).filter(o=>o.userData.screenTarget).length,7);
  const chosen=screens.find(o=>o.userData.surfaceId==='starbucks-wall-03'),original=chosen.material;
  model.refreshMedia(null,null,(ctx,w,h,id)=>id==='starbucks-wall-03');assert.equal(chosen.visible,true);assert.notEqual(chosen.material,original);assert.equal(screens.filter(o=>o.visible).length,1);
  model.refreshMedia(null,null,()=>false);assert.equal(chosen.visible,false);assert.equal(chosen.material,original);assert.equal(JSON.stringify(raw.layout),JSON.stringify(globalThis.XpaceStarbucks.layout()));model.dispose();
 }
});

test('Life preserves raw grid transforms, live metadata and source immutability',()=>{
  const raw=structuredClone(input),original=JSON.stringify(raw),model=createLifeScene(raw,{canvasFactory});
  const counter=model.scene.getObjectByName('furniture:counter');
  assert.deepEqual(counter.position.toArray(),[1,0,2]);assert.deepEqual(counter.scale.toArray(),[-1.2,.9,1.2]);assert.equal(counter.rotation.y,-Math.PI/2);
  assert.equal(counter.userData.layoutId,'counter');assert.equal(model.snapshot.entries,17);
  assert.equal(model.snapshot.actors[0].label,'Ana');assert.equal(model.snapshot.actors[0].hair,'#443322');assert.equal(model.snapshot.actors[0].scale,.9);
  const uuids=model.world.children.map(o=>o.uuid),actor=model.actors.children[0];
  model.update({...raw,projection:{width:800,height:600,ox:450,oy:120,tileW:90,tileH:30}});
  assert.deepEqual(model.world.children.map(o=>o.uuid),uuids);assert.equal(model.actors.children[0],actor);
  assert.equal(JSON.stringify(raw),original);model.dispose();
});

test('Only Xtanco ds1 owns an isolated portrait texture; the base player still draws exactly once',()=>{
  const model=createLifeScene(input,{canvasFactory});
  const screens=meshes(model).filter(o=>o.material.map?.image?.width===512&&o.material.map?.image?.height===768);
  const ds1=screens.find(o=>o.userData.surfaceId==='ds1'),ds2=screens.find(o=>o.userData.surfaceId==='ds2');
  assert.ok(screens.length>=4);assert.ok(ds1);assert.ok(ds2);assert.notEqual(ds1.material.map,ds2.material.map);
  assert.equal(new Set(screens.filter(o=>o!==ds1).map(o=>o.material.map)).size,1);
  let draws=0,previewDraws=0;model.refreshMedia({draw(ctx,width,height){draws++;assert.equal(width,512);assert.equal(height,768);}},(ctx,width,height,id)=>{previewDraws++;assert.equal(id,'ds1');assert.equal(width,512);assert.equal(height,768);return true;});
  assert.equal(draws,1);assert.equal(previewDraws,1);const uuids=meshes(model).map(o=>o.uuid);
  for(const mode of ['sunset','night','day'])model.setLighting(mode);
  assert.deepEqual(meshes(model).map(o=>o.uuid),uuids);model.dispose();
});

test('Stopping ds1 priority restores the latest base frame, and Starbucks never requests Xtanco priority',()=>{
  const recordCanvas=()=>{const canvas={width:0,height:0},context=new Proxy({canvas,drawImage(image){canvas.frame=image.frame;}},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)});canvas.getContext=()=>context;return canvas;};
  const model=createLifeScene(input,{canvasFactory:recordCanvas}),screens=meshes(model).filter(o=>o.userData.liveMedia),ds1=screens.find(o=>o.userData.surfaceId==='ds1'),ds2=screens.find(o=>o.userData.surfaceId==='ds2');
  let frame='base-1',draws=0;const player={draw(ctx){draws++;ctx.canvas.frame=frame;}};
  model.refreshMedia(player,ctx=>{ctx.canvas.frame='selected-product';return true;});
  assert.equal(ds1.material.map.image.frame,'selected-product');assert.equal(ds2.material.map.image.frame,'base-1');
  frame='base-feed-update';model.refreshMedia(player,()=>false);
  assert.equal(ds1.material.map.image.frame,'base-feed-update');assert.equal(ds2.material.map.image.frame,'base-feed-update');assert.equal(draws,2);
  model.update({...input,venue:'alsea-sbux-021',layout:globalThis.XpaceStarbucks.layout(),actors:[]});let previewDraws=0;
  model.refreshMedia(player,()=>{previewDraws++;return true;});assert.equal(previewDraws,0);assert.equal(draws,3);model.dispose();
  const starbucks=createLifeScene({...input,venue:'alsea-sbux-021',layout:[],actors:[]},{canvasFactory:recordCanvas});
  assert.equal(meshes(starbucks).some(o=>o.userData.surfaceId==='ds1'),false);starbucks.refreshMedia(player,()=>{previewDraws++;return true;});assert.equal(previewDraws,0);starbucks.dispose();
});

test('moving mode rebuilds Better with architecture only and restores the exact live contents',()=>{
  const model=createLifeScene(input,{canvasFactory});
  model.update({...input,moving:true,layout:[],actors:[]});
  assert.equal(model.snapshot.moving,true);assert.equal(model.actors.children.length,0);
  assert.equal(model.scene.getObjectByName('furniture:counter'),undefined);
  assert.equal(model.scene.getObjectByName('life:entrance'),undefined);
  assert.ok(model.scene.getObjectByName('life:architecture'));
  model.update(input);
  assert.ok(model.scene.getObjectByName('furniture:counter'));assert.ok(model.scene.getObjectByName('life:entrance'));
  assert.equal(model.actors.children.length,1);model.dispose();
});

test('interior staff follow continuous paths without advancing source positions or counters',()=>{
  const raw=structuredClone(input),model=createLifeScene(raw,{canvasFactory}),actor=model.actors.children[0];
  model.animate(1000);
  const moved={...raw,actors:[{...raw.actors[0],col:2.6,row:3.4,heading:.8,walking:true}]};
  const source=JSON.stringify(moved);model.update(moved);model.animate(1050);
  assert.equal(model.actors.children[0],actor);assert.ok(actor.position.x>2&&actor.position.x<2.6);
  assert.ok(actor.rotation.y>0&&actor.rotation.y<.8);assert.notEqual(actor.userData.legs[0].rotation.x,0);
  assert.equal(model.snapshot.actors[0].col,2.6);assert.equal(model.snapshot.entries,17);
  for(let time=1066;time<=3000;time+=16)model.animate(time);
  assert.ok(Math.hypot(actor.position.x-2.6,actor.position.z-3.4)<.00001);assert.equal(JSON.stringify(moved),source);
  const prior=actor.position.clone();model.update({...moved,actors:[{...moved.actors[0],col:9,row:7}]});assert.ok(actor.position.equals(prior),'an interior snapshot jump must not teleport through furniture');
  const nav=buildCustomerNavigation({...raw,colliders:model.snapshot.colliders},{radius:.72,allowOutside:true});
  let previous={col:actor.position.x,row:actor.position.z};
  for(let time=3016;time<=18000;time+=16){model.animate(time);const pose={col:actor.position.x,row:actor.position.z};assert.ok(nav.segmentClear(previous,pose));previous=pose;}
  assert.ok(Math.hypot(actor.position.x-9,actor.position.z-7)<.00001);
  model.dispose();
});

test('customers in Better follow safe corners and stop their gait when an aisle is closed',()=>{
  const raw={cols:12,rows:8,layout:[{id:'island',type:'counter',col:5,row:2,fp:[2,3]}],actors:[{...input.actors[0],id:'customer-safe',kind:'customer',col:3,row:3,scale:1}]};
  const nav=buildCustomerNavigation(raw,{allowOutside:true}),model=createLifeScene(raw,{canvasFactory}),root=model.actors.children[0];
  model.animate(0);model.update({...raw,actors:[{...raw.actors[0],col:9,walking:true}]});
  let previous={col:root.position.x,row:root.position.z},detoured=false;
  for(let time=16;time<9000;time+=16){
    model.animate(time);const p={col:root.position.x,row:root.position.z};
    assert.ok(nav.isWalkable(p));assert.ok(nav.segmentClear(previous,p));
    detoured ||= p.row<1.8||p.row>5.2;previous=p;
  }
  assert.ok(detoured);assert.ok(Math.abs(root.position.x-9)<.01);
  const legs=root.userData.legs.map(leg=>leg.rotation.x);model.animate(9500);
  assert.deepEqual(root.userData.legs.map(leg=>leg.rotation.x),legs);assert.ok(legs.every(n=>n===0));
  assert.equal(raw.actors[0].col,3);model.dispose();
});

test('Best receives the displayed movement state when a customer cannot reach a target',async()=>{
  const raw={cols:8,rows:6,layout:[{id:'divider',type:'shelves',col:3,row:0,fp:[1,6]}],actors:[{...input.actors[0],id:'held',kind:'customer',col:1,row:2}]};
  const asset=personAsset(),model=createLifeScene(raw,{canvasFactory,assetQuality:'best',loadPerson:()=>asset});
  await settled();model.animate(0);
  const target={...raw,actors:[{...raw.actors[0],col:6,walking:true}]};model.update(target);
  for(let time=16;time<1000;time+=16)model.animate(time);
  const root=model.actors.children[0];assert.equal(root.position.x,1);
  assert.equal(asset.calls.at(-1)[1].walking,false);assert.equal(model.snapshot.actors[0].walking,true);
  assert.equal(target.actors[0].col,6);model.dispose();
});

test('Layout churn and actor appearance replacement release owned resources',()=>{
  const model=createLifeScene(input,{canvasFactory}),baseline=model.resources;
  let actorInstancesDisposed=0;
  model.actors.children[0].traverse(o=>{if(o.isInstancedMesh)o.addEventListener('dispose',()=>actorInstancesDisposed++);});
  for(let i=0;i<12;i++)model.update({...input,
    layout:input.layout.map(item=>({...item,col:item.col+(i%2)*.2})),
    actors:[{...input.actors[0],id:`visitor-${i}`,color:i%2?'#776644':'#448877'}]
  });
  assert.ok(actorInstancesDisposed>0);assert.deepEqual(model.resources,baseline);assert.equal(model.actors.children.length,1);
  const sharedGeometry=meshes(model)[0].geometry;let geometryDisposed=0;sharedGeometry.addEventListener('dispose',()=>geometryDisposed++);
  model.dispose();model.dispose();assert.equal(geometryDisposed,1);assert.equal(model.scene.children.length,0);
  assert.deepEqual(model.resources,{geometry:0,materials:0,textures:0});
});

const settled=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function personAsset(){
  const calls=[];let disposed=0;
  return {scene:new Group(),animate:(...args)=>calls.push(args),dispose:()=>{disposed++;},calls,get disposed(){return disposed;}};
}

test('Human assets are optional and requested only for non-robot Best actors',async()=>{
  let loads=0;const loadPerson=()=>{loads++;return personAsset();};
  const models=[
    createLifeScene(input,{canvasFactory,loadPerson}),
    createLifeScene(input,{canvasFactory,assetQuality:'better',loadPerson}),
    createLifeScene({...input,actors:[{...input.actors[0],robot:true}]},{canvasFactory,assetQuality:'best',loadPerson})
  ];
  await settled();assert.equal(loads,0);
  for(const model of models){assert.ok(model.actors.children[0].userData.body);model.animate(1000);model.dispose();}
});

test('Best async replacement retains actor selection and source interpolation, then disposes once',async()=>{
  const pending=deferred(),asset=personAsset(),raw=structuredClone(input),original=JSON.stringify(raw);
  const model=createLifeScene(raw,{canvasFactory,assetQuality:'best',loadPerson:()=>pending.promise});
  const root=model.actors.children[0],body=root.userData.body;
  assert.equal(root.userData.personAssetStatus,'loading');assert.equal(body.parent,root);
  model.animate(1000);await settled();pending.resolve(asset);await settled();
  assert.equal(model.actors.children[0],root);assert.equal(root.userData.actorId,'ana');assert.equal(root.userData.selectable,true);
  assert.equal(root.userData.personAssetStatus,'ready');assert.equal(asset.scene.parent,root);assert.equal(body.parent,null);
  assert.equal(root.userData.resources.size,0);assert.equal(root.userData.body,null);
  model.update({...raw,actors:[{...raw.actors[0],col:2.6,row:3.4,heading:.8,walking:true}]});model.animate(1050);
  assert.equal(model.actors.children[0],root);assert.ok(root.position.x>2&&root.position.x<2.6);
  assert.ok(root.rotation.y>0&&root.rotation.y<.8);assert.equal(root.scale.x,.9);
  assert.equal(asset.calls.length,1);assert.equal(asset.calls[0][0],1050);assert.deepEqual(asset.calls[0][1],model.snapshot.actors[0]);
  assert.equal(asset.calls[0][2].position,root.position);assert.equal(asset.calls[0][2].heading,root.rotation.y);
  assert.equal(asset.calls[0][1].walking,true);assert.equal(model.snapshot.entries,17);assert.equal(JSON.stringify(raw),original);
  model.update({...raw,actors:[]});assert.equal(asset.disposed,1);assert.equal(asset.scene.parent,null);
  model.animate(1100);assert.equal(asset.calls.length,1);model.dispose();model.dispose();assert.equal(asset.disposed,1);
  assert.deepEqual(model.resources,{geometry:0,materials:0,textures:0});
});

test('Appearance changes and scene disposal invalidate pending Best replacements',async()=>{
  const requests=[],loadPerson=actor=>{const request={...deferred(),actor};requests.push(request);return request.promise;};
  const model=createLifeScene(input,{canvasFactory,assetQuality:'best',loadPerson});await settled();
  const firstRoot=model.actors.children[0],changed={...input,actors:[{...input.actors[0],age:'nino'}]};
  model.update(changed);await settled();assert.equal(requests.length,2);
  const stale=personAsset();requests[0].resolve(stale);await settled();
  assert.equal(stale.disposed,1);assert.equal(stale.scene.parent,null);assert.equal(firstRoot.parent,null);
  const activeRoot=model.actors.children[0],active=personAsset();requests[1].resolve(active);await settled();
  assert.equal(active.scene.parent,activeRoot);assert.equal(active.disposed,0);
  model.update({...input,actors:[{...input.actors[0],hair:'#112233'}]});await settled();
  assert.equal(active.disposed,1);assert.equal(requests.length,3);
  model.dispose();const late=personAsset();requests[2].resolve(late);await settled();
  assert.equal(late.disposed,1);assert.equal(late.scene.parent,null);assert.equal(model.scene.children.length,0);
  assert.deepEqual(model.resources,{geometry:0,materials:0,textures:0});
});

test('Failed or invalid Best loads leave the existing animated fallback and release bad assets',async()=>{
  let invalidDisposed=0;
  for(const loadPerson of [()=>Promise.reject(new Error('offline')),()=>{throw new Error('bad asset');},()=>({scene:new Group(),dispose(){invalidDisposed++;}})]){
    const model=createLifeScene(input,{canvasFactory,assetQuality:'best',loadPerson}),root=model.actors.children[0],body=root.userData.body,resources=model.resources;
    await settled();assert.equal(root.userData.personAssetStatus,'fallback');assert.equal(body.parent,root);assert.deepEqual(model.resources,resources);
    model.animate(0);model.update({...input,actors:[{...input.actors[0],row:3.4,walking:true}]});model.animate(50);
    assert.notEqual(root.userData.legs[0].rotation.x,0);model.dispose();
  }
  assert.equal(invalidDisposed,1);
});

test('all shared visitor profiles keep their source identity, proportions and appearance across Better updates',()=>{
  const actors=VISITOR_PROFILES.map((profile,i)=>({id:`person-${profile.id}`,kind:'customer',col:i%8,row:Math.floor(i/8),heading:0,walking:false,
    color:'#ff00ff',skin:'#c68642',hair:'#111111',scale:profile.age==='child'?.7:1,gender:profile.gender,age:profile.age,
    visitorProfileId:profile.id,visitorStyle:profile.style}));
  const raw={...input,actors},unchanged=JSON.stringify(raw),model=createLifeScene(raw,{canvasFactory});
  assert.equal(model.actors.children.length,24);
  const roots=[...model.actors.children];
  for(const [i,root] of roots.entries()){
    const profile=VISITOR_PROFILES[i],body=root.userData.body;
    assert.equal(root.userData.actorId,actors[i].id);assert.equal(root.userData.visitorProfileId,profile.id);
    assert.equal(root.userData.actor.color,'#ff00ff');assert.equal(root.userData.actor.gender,profile.gender);
    assert.deepEqual(body.scale.toArray(),[profile.style.width,profile.style.height,Math.sqrt(profile.style.width)]);
    assert.equal(root.userData.head.userData.hairstyle,profile.style.hairstyle);
    assert.equal(body.userData.outfit,profile.style.outfit);assert.equal(body.userData.accessory,profile.style.accessory);
    assert.equal([...root.userData.resources][0].color.getHexString(),profile.style.palette.color.slice(1));
  }
  model.update({...raw,actors:actors.map(actor=>({...actor,col:actor.col+.1,walking:true}))});model.animate(1000);
  assert.deepEqual(model.actors.children,roots);assert.equal(JSON.stringify(raw),unchanged);
  let releases=0;for(const material of roots[0].userData.resources)material.addEventListener('dispose',()=>releases++);
  const resourceCount=roots[0].userData.resources.size;
  model.update({...raw,actors:[{...actors[0],visitorProfileId:'replacement',visitorStyle:VISITOR_PROFILES[1].style}]});
  assert.notEqual(model.actors.children[0],roots[0]);assert.equal(releases,resourceCount);
  model.dispose();assert.deepEqual(model.resources,{geometry:0,materials:0,textures:0});
});

test('shared visitor styling does not replace staff or robot uniforms and proportions',()=>{
  const profile=VISITOR_PROFILES[2];
  for(const extra of [{kind:'staff'},{kind:'customer',robot:true}]){
    const actor={...input.actors[0],...extra,visitorProfileId:profile.id,visitorStyle:profile.style};
    const model=createLifeScene({...input,actors:[actor]},{canvasFactory}),root=model.actors.children[0];
    assert.deepEqual(root.userData.body.scale.toArray(),[1,1,1]);assert.equal(root.userData.visitorProfileId,null);
    assert.equal([...root.userData.resources][0].color.getHexString(),actor.color.slice(1));model.dispose();
  }
});

test('Better interprets a missing visitor gender from the shared style without rewriting its source metadata',async()=>{
  const actor={id:'untyped-person',kind:'customer',col:2,row:3,color:'#224466',skin:'#d3aa88',gender:null,age:null,
    visitorProfileId:'shared-female',visitorStyle:{gender:'female',age:'child',palette:{color:'#446688'}}};
  const unchanged=JSON.stringify(actor),loaded=[];
  const model=createLifeScene({...input,actors:[actor]},{canvasFactory,assetQuality:'best',loadPerson:visual=>{loaded.push(visual);return personAsset();}});
  assert.equal(model.actors.children[0].userData.head.userData.hairstyle,'long');
  await settled();assert.equal(loaded[0].gender,'female');assert.equal(loaded[0].age,'child');
  assert.equal(model.snapshot.actors[0].gender,null);assert.equal(model.snapshot.actors[0].age,null);assert.equal(JSON.stringify(actor),unchanged);model.dispose();
  const malformed=createLifeScene({...input,actors:[{...actor,visitorStyle:{gender:{},age:'not-an-age'}}]},{canvasFactory});
  assert.equal(malformed.snapshot.actors[0].gender,null);malformed.dispose();
});

test('Better visitors keep their bodies clear of furniture at every heading and walking phase',()=>{
  const layout=[{id:'near-counter',type:'counter',col:3,row:2,fp:[1,2]}];
  const overlap=b=>b.max.x>3+1e-6&&b.min.x<4-1e-6&&b.max.z>2+1e-6&&b.min.z<4-1e-6;
  for(const profile of VISITOR_PROFILES){
    for(const heading of [0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI,Math.PI*5/4,Math.PI*3/2,Math.PI*7/4]){
      const actor={id:`arm-${profile.id}`,kind:'customer',col:2.75999,row:3,heading,walking:false,
        color:'#334455',skin:'#c68642',visitorProfileId:profile.id,visitorStyle:profile.style};
      const source={cols:8,rows:8,layout,actors:[actor]},unchanged=JSON.stringify(source);
      const model=createLifeScene(source,{canvasFactory:()=>null}),root=model.actors.children[0];
      const check=()=>{
        root.updateWorldMatrix(true,true);
        for(const arm of root.userData.arms)assert.equal(overlap(new Box3().setFromObject(arm)),false,`${profile.id}, heading ${heading}`);
        assert.ok(root.position.x<=2.27999,'body clearance includes the actual animated mesh');
        assert.equal(source.actors[0].col,2.75999,'a bad external pose never rewrites the source actor');
      };
      check();model.animate(0);check();
      const goal={...actor,row:3.85,walking:true};model.update({...source,actors:[goal]});
      let walked=false;
      for(let t=16;t<=1200;t+=16){model.animate(t);check();walked ||= root.userData.customerMotion.pose.walking;}
      assert.ok(walked);assert.equal(JSON.stringify(source),unchanged);model.dispose();
    }
  }
});

test('body clearance leaves Better shoulder positions natural after nearby furniture is removed',()=>{
  const actor={id:'a',kind:'customer',col:2.75999,row:3,heading:0,walking:false,color:'#334455',skin:'#c68642'};
  const raw={cols:8,rows:8,layout:[{id:'counter',type:'counter',col:3,row:2}],actors:[actor]};
  const model=createLifeScene(raw,{canvasFactory:()=>null}),root=model.actors.children[0];
  model.animate(0);
  assert.ok(root.userData.arms.every(arm=>arm.position.equals(arm.userData.restPosition)));
  model.update({...raw,layout:[]});model.animate(16);
  for(const arm of root.userData.arms)assert.deepEqual(arm.position.toArray(),arm.userData.restPosition.toArray());
  model.dispose();
});


test('Distribuit changes poses without rebuilding furniture or reloading assets',async()=>{
  let loads=0;const model=createLifeScene(input,{canvasFactory,loadFurniture:()=>{loads++;return null;}});
  await Promise.resolve();const roots=[...model.world.children],resources={...model.resources};
  for(let i=0;i<30;i++)model.update({...input,layout:input.layout.map(item=>item.id==='counter'?{...item,col:1+i*.25}:item)});
  assert.deepEqual(model.world.children,roots);assert.deepEqual(model.resources,resources);assert.equal(loads,input.layout.length);
  assert.equal(model.scene.getObjectByName('furniture:counter').position.x,8.25);model.dispose();
});
test('Cafebrería furniture has explicit tables, books and seating in Better',()=>{
  const layout=[{id:'table',type:'cafeTable',col:2,row:2,fp:[1,1]},{id:'books',type:'bookcase',col:0,row:5,fp:[1,2]},{id:'sofa',type:'sofa',col:2,row:7,fp:[2,1]}];
  const model=createLifeScene({...input,layout,actors:[]},{canvasFactory});
  for(const item of layout){const root=model.scene.getObjectByName('furniture:'+item.id);assert.ok(root.children.length>1);const bounds=new Box3().setFromObject(root);assert.ok(bounds.max.y>.6);}
  model.dispose();
});
test('Starbucks keeps absolute fixture geometry while moving its layout anchor',()=>{
  const original={...input,venue:'alsea-sbux-021',layout:globalThis.XpaceStarbucks.layout(),actors:[]};
  const model=createLifeScene(original,{canvasFactory}),root=model.world.children.find(o=>o.userData.item?.id==='sb-table-a'),before=new Box3().setFromObject(root);
  model.update({...original,layout:original.layout.map(i=>i.id==='sb-table-a'?{...i,col:i.col+1,row:i.row+.5}:i)});
  const after=new Box3().setFromObject(root);assert.equal(model.world.children.includes(root),true);assert.ok(Math.abs(after.min.x-before.min.x-1)<1e-6);assert.ok(Math.abs(after.min.z-before.min.z-.5)<1e-6);model.dispose();
});

test('Starbucks renders saved rotation, mirror and proportional scale at the same origin as Good',()=>{
 const fixture=globalThis.XpaceStarbucks.layout().find(i=>i.id==='sb-table-a'),pose={...fixture,col:5,row:3,rot:1,sx:1.5,sy:1.8,flipX:true};
 const raw=globalThis.XpaceStarbucks.build([pose],{quality:'better'}).find(g=>g.id===pose.id),model=createLifeScene({...input,venue:'alsea-sbux-021',layout:[pose],actors:[]},{canvasFactory});
 const root=model.world.children.find(o=>o.userData.item?.id===pose.id),actual=new Box3().setFromObject(root);
 assert.equal(root.rotation.y,-Math.PI/2);assert.deepEqual(root.scale.toArray(),[-1.5,1.8,1.5]);
 const parts=raw.parts.map(part=>globalThis.XpaceStarbucks.transformPart(part,pose));
 const bounds={minX:Math.min(...parts.map(p=>p.x)),maxX:Math.max(...parts.map(p=>p.x+p.w)),minZ:Math.min(...parts.map(p=>p.z)),maxZ:Math.max(...parts.map(p=>p.z+p.d)),maxY:Math.max(...parts.map(p=>p.y+p.h))};
 assert.ok(Math.abs(actual.min.x-bounds.minX)<1e-6);assert.ok(Math.abs(actual.max.x-bounds.maxX)<1e-6);
 assert.ok(Math.abs(actual.min.z-bounds.minZ)<1e-6);assert.ok(Math.abs(actual.max.z-bounds.maxZ)<1e-6);assert.ok(Math.abs(actual.max.y-bounds.maxY)<1e-6);model.dispose();
});


test('imported café can opt into the shared street without duplicate architecture or catalogue pollution',()=>{
 const empty={cols:11,rows:8,wallHeight:3.25,moving:true,layout:[],actors:[]};
 const isolated=createLifeScene(empty,{canvasFactory,inventory:true});
 assert.equal(isolated.scene.getObjectByName('life:exterior'),undefined);isolated.dispose();
 const model=createLifeScene(empty,{canvasFactory,inventory:true,surroundings:true,exteriorY:.44});
 const exterior=model.scene.getObjectByName('life:exterior');assert.ok(exterior);assert.equal(exterior.position.y,.44);
 assert.equal(model.world.children.length,0);assert.equal(model.scene.getObjectByName('life:architecture'),undefined);
 const grass=exterior.getObjectByName('life:exterior:grass');model.scene.updateMatrixWorld(true);assert.ok(Math.abs(grass.getWorldPosition(grass.position.clone()).y+.03)<1e-6);
 const buildings=[];exterior.traverse(n=>{if(n.name==='life:exterior:building')buildings.push(n);});assert.ok(buildings.length>20);assert.ok(buildings.every(n=>n.position.x<0||n.position.z<0));
 const ownedGeometry=buildings[0].geometry;let disposed=0;ownedGeometry.addEventListener('dispose',()=>disposed++);
 model.setLighting('night');assert.ok(buildings[0].material.emissiveIntensity>.1);
 model.setLighting('day');model.update({...empty,cols:12});assert.equal(disposed,1);assert.equal(exterior.parent,null);
 assert.equal(model.scene.getObjectByName('life:exterior').position.y,.44);model.dispose();model.dispose();assert.equal(model.scene.children.length,0);
});
