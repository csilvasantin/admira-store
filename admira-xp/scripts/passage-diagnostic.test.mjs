import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {diagnosePassage} from './passage-diagnostic.mjs';
import {buildCustomerNavigation} from './customer-navigation.mjs';
import {physicalColliders,actorCollisionRadius} from './physical-colliders.mjs';

const native=(layout=[],extra={})=>({cols:14,rows:8,doorRow:3.35,doorHalfWidth:1,outsideDepth:3.5,doorOpen:0,layout,...extra});
const wall=(id,col)=>({id,type:'custom',label:id,col,row:0,fp:[.12,8]});
const from={col:11,row:4},to={col:3,row:4};
function factoryLayout(){
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),begin=html.indexOf('const FACTORY_LAYOUTS=')+'const FACTORY_LAYOUTS='.length;
  return vm.runInNewContext('('+html.slice(begin,html.indexOf('// Helper: ¿estamos dentro',begin)).replace(/;\s*$/,'')+')').xtanco;
}
function navigation(result){
  const [cols,rows,radius,allowOutside,doorRow,doorHalfWidth,outsideDepth,colliders]=JSON.parse(result.navigationKey);
  return buildCustomerNavigation({cols,rows,doorRow,doorHalfWidth,outsideDepth,layout:[],colliders},{radius,allowOutside});
}
function assertRoute(result){
  assert.equal(result.status,'clear');assert.equal(result.reason,'clear');assert.equal(result.blockers.length,0);
  assert.ok(Array.isArray(result.route)&&result.route.length>=1);
  assert.deepEqual(result.route[0],result.origin);assert.deepEqual(result.route.at(-1),result.target);
  const nav=navigation(result);
  for(const [i,p] of result.route.entries()){
    assert.ok(nav.isWalkable(p));
    if(!i)continue;
    const previous=result.route[i-1];assert.ok(nav.segmentClear(previous,p));
    // Independent body-versus-box sampling, separate from slab intersection.
    for(let n=0;n<=100;n++){
      const q={col:previous.col+(p.col-previous.col)*n/100,row:previous.row+(p.row-previous.row)*n/100};
      for(const box of nav.obstacles){
        const d=Math.hypot(Math.max(box.minCol-q.col,0,q.col-box.maxCol),Math.max(box.minRow-q.row,0,q.row-box.maxRow));
        assert.ok(d>=result.radius-1e-7,'rendered body intersects '+box.id);
      }
    }
  }
}

test('an empty native space diagnoses an open copy of the closed door for both actual bodies',()=>{
  for(const quality of ['good','better','best'])for(const actor of ['human','unitree']){
    const scene=native([],{quality,peopleVisibility:{staff:false,customers:false}}),saved=JSON.stringify(scene);
    const result=diagnosePassage(scene,{actor});
    assertRoute(result);assert.equal(result.radius,actorCollisionRadius({robot:actor==='unitree'}));
    assert.ok(result.origin.col>=scene.cols);assert.ok(result.target.col<=scene.cols-result.radius);
    assert.equal(result.doorMode,'open');assert.equal(result.actualDoorOpen,0);
    const live=buildCustomerNavigation({...scene,colliders:physicalColliders(scene)},{radius:result.radius,allowOutside:true});
    assert.equal(live.route(result.origin,result.target),null,'the actual closed leaf still blocks live navigation');
    assert.equal(JSON.stringify(scene),saved,'checking passage never opens the scene or activates people');
  }
});

test('real Xtanco reports its two implicated doorway fixtures consistently in all qualities',()=>{
  for(const quality of ['good','better','best'])for(const actor of ['human','unitree']){
    const scene=native(factoryLayout(),{quality}),result=diagnosePassage(scene,{actor});
    assert.equal(result.status,'blocked');assert.equal(result.route,null);
    assert.deepEqual(result.blockers.map(b=>b.itemId).sort(),['djBooth','metahuman']);
    assert.ok(result.blockers.every(b=>b.kind==='furniture'));
    const freed=diagnosePassage({...scene,layout:scene.layout.filter(i=>!result.blockers.some(b=>b.itemId===i.id))},{actor,from:result.origin,to:result.target});
    assertRoute(freed);
    for(const blocker of result.blockers){
      const retained=scene.layout.filter(i=>!result.blockers.some(b=>b.itemId===i.id)||i.id===blocker.itemId);
      assert.equal(diagnosePassage({...scene,layout:retained},{actor,from:result.origin,to:result.target}).status,'blocked','each reported fixture is implicated');
    }
  }
});

test('the real Starbucks bar overhang obstructs entry in all qualities without a fake arrival',()=>{
  for(const quality of ['good','better','best'])for(const actor of ['human','unitree']){
    const scene=native(globalThis.XpaceStarbucks.layout(),{quality,venue:'alsea-sbux-021'}),result=diagnosePassage(scene,{actor});
    assert.equal(result.status,'blocked');assert.equal(result.route,null);
    assert.ok(result.blockers.some(b=>b.itemId==='sb-pastry'&&b.maxRow>=4.17),'actual glass-bar overhang participates');
    const freed=diagnosePassage({...scene,layout:scene.layout.filter(i=>!result.blockers.some(b=>b.itemId===i.id))},{actor,from:result.origin,to:result.target});
    assertRoute(freed);
  }
});

test('a selected solid fixture is reached at its physical access perimeter, never inside its collision',()=>{
  const scene=native([{id:'fixture',type:'shelves',label:'Product shelf',col:5,row:3,rot:1,sx:1.5,flipX:true}]);
  for(const actor of ['human','unitree']){
    const result=diagnosePassage(scene,{actor,targetId:'fixture'});assertRoute(result);
    assert.equal(result.targetId,'fixture');assert.ok(navigation(result).isWalkable(result.target));
    assert.ok(result.route.length>=2,'the route really enters the room');
  }
});

test('a sealed partition cannot relocate the centre or selected destination to the starting side',()=>{
  const scene=native([wall('partition',10),{id:'shelf',type:'shelves',col:2,row:3}]);
  for(const actor of ['human','unitree'])for(const targetId of [null,'shelf']){
    const result=diagnosePassage(scene,{actor,targetId});
    assert.equal(result.status,'blocked');assert.equal(result.route,null);assert.ok(result.target.col<10);
    assert.deepEqual(result.blockers.map(b=>b.itemId),['partition']);
  }
});

test('serial walls report multiple implicated blockers and do not expose their counterfactual route',()=>{
  const scene=native([wall('first',10),wall('second',12),{id:'irrelevant',type:'custom',col:2,row:1,fp:[.2,.2]}]);
  const result=diagnosePassage(scene,{to:{col:7,row:4}});
  assert.equal(result.status,'blocked');assert.equal(result.route,null);
  assert.deepEqual(result.blockers.map(b=>b.itemId).sort(),['first','second']);
  assertRoute(diagnosePassage({...scene,layout:scene.layout.filter(i=>!result.blockers.some(b=>b.itemId===i.id))},{from:result.origin,to:result.target}));
});

test('fixed native architecture cannot be presented as a removable furniture unit',()=>{
  const result=diagnosePassage(native([{...wall('fixed-pillar',10),nativeFixed:true}]));
  assert.equal(result.status,'blocked');assert.equal(result.blockers.length,1);
  assert.equal(result.blockers[0].kind,'architecture');assert.equal(result.blockers[0].itemId,null);
});

test('preview moves, rotation and Undo rebuild saved dynamic colliders without losing structural walls',()=>{
  const blocker=wall('moving',10),scene=native([blocker],{colliders:[
    {id:'geometry:moving',minCol:10,maxCol:10.12,minRow:0,maxRow:8},
    {id:'architecture:retained',label:'Measured wall',minCol:4,maxCol:4.1,minRow:0,maxRow:8}
  ]});
  assert.equal(diagnosePassage(scene,{from,to:{col:6,row:4}}).status,'blocked');
  const draft={...scene,layout:[{...blocker,row:7,rot:1}]};
  const preview=diagnosePassage(draft,{from,to:{col:6,row:4}});assertRoute(preview);
  const geometry=navigation(preview).obstacles.filter(b=>b.id==='geometry:moving');
  assert.equal(geometry.length,0,'a custom model has no catalogue envelope; its saved envelope must be removed');
  const stillBlocked=diagnosePassage(draft,{from,to});
  assert.equal(stillBlocked.status,'blocked');assert.ok(stillBlocked.blockers.some(b=>b.id==='architecture:retained'&&b.kind==='architecture'&&b.itemId===null));
  assert.equal(diagnosePassage(scene,{from,to:{col:6,row:4}}).status,'blocked','Undo restores the original obstruction');
});

test('moving a catalogue model rebuilds actual mesh bounds rather than retaining its old preview envelope',()=>{
  const item={id:'metahuman',type:'metahuman',col:10,row:3},scene=native([item]);
  const saved=physicalColliders(scene),draft={...scene,layout:[{...item,col:3,row:1,rot:2,sx:1.3,flipX:true}],hardness:{fixed:[],colliders:saved}};
  const result=diagnosePassage(draft,{from,to:{col:8,row:4}});assertRoute(result);
  const geometry=navigation(result).obstacles.filter(b=>b.id==='geometry:metahuman');
  assert.equal(geometry.length,1);assert.ok(geometry[0].maxCol<6,'saved col10 envelope is gone');
  assert.deepEqual(geometry[0],physicalColliders({...draft,doorOpen:1}).find(b=>b.id==='geometry:metahuman'));
});

test('Hide preserves physical obstruction, Delete removes it, and fixed hardness remains causal',()=>{
  const blocker=wall('furniture',10),scene=native([blocker],{colliders:[{id:'geometry:furniture',minCol:10,maxCol:10.12,minRow:0,maxRow:8}]});
  assert.equal(diagnosePassage({...scene,layout:[{...blocker,hidden:true}]}).status,'blocked');
  assertRoute(diagnosePassage({...scene,layout:[]}));
  const fixed=native([],{hardness:{fixed:Array.from({length:8},(_,row)=>'10,'+row)}}),result=diagnosePassage(fixed);
  assert.equal(result.status,'blocked');assert.ok(result.blockers.length>=2);
  assert.ok(result.blockers.every(b=>b.kind==='hardness'&&b.itemId===null));
  const reopened={...fixed,hardness:{fixed:fixed.hardness.fixed.filter(cell=>!result.blockers.some(b=>b.id==='hardness:'+cell))}};
  assertRoute(diagnosePassage(reopened,{from:result.origin,to:result.target}));
});

test('an imported space without a configured operative entrance is explicitly unavailable',()=>{
  for(const scene of [native([],{roomId:'cafebreria'}),native([],{roomId:'other-import',imported:true}),native([],{imported:true,passageEntrance:{from:{col:2,row:3}}})]){
    const result=diagnosePassage(scene,{from,to});
    assert.equal(result.status,'unavailable');assert.equal(result.reason,'entrance_unconfigured');assert.equal(result.route,null);assert.deepEqual(result.blockers,[]);
  }
  const configured=native([],{roomId:'other-import',imported:true,passageEntrance:{from:{col:17.4,row:3.35},doorRow:3.35,doorHalfWidth:1,outsideDepth:3.5},colliders:[{id:'architecture:imported-wall',minCol:10,maxCol:10.1,minRow:0,maxRow:8}]});
  const result=diagnosePassage(configured);
  assert.equal(result.status,'blocked');assert.deepEqual(result.blockers.map(b=>b.id),['architecture:imported-wall']);
});

test('imported architecture linked to an inventory ID remains fixed in preview and Delete',()=>{
  const item={id:'pillar',type:'custom',col:10,row:0,fp:[.1,8],solid:false},scene=native([item],{imported:true,
    passageEntrance:{from:{col:17.4,row:3.35},doorRow:3.35,doorHalfWidth:1,outsideDepth:3.5},
    colliders:[{id:'architecture:pillar',itemId:'pillar',kind:'architecture',minCol:10,maxCol:10.1,minRow:0,maxRow:8}]});
  for(const layout of [[{...item,col:1,row:1}],[]]){
    const result=diagnosePassage({...scene,layout});
    assert.equal(result.status,'blocked');assert.ok(result.blockers.some(b=>b.id==='architecture:pillar'&&b.kind==='architecture'&&b.itemId===null));
  }
});

test('doorway dimensions distinguish human and Unitree without shrinking either body',()=>{
  const scene=native([],{imported:true,passageEntrance:{from:{col:17.4,row:3.35},doorRow:3.35,doorHalfWidth:.6,outsideDepth:3.5}});
  const human=diagnosePassage(scene,{actor:'human'}),robot=diagnosePassage(scene,{actor:'unitree'});
  assert.equal(human.status,'blocked');assert.equal(human.reason,'boundary_blocked');assert.equal(human.radius,.72);
  assert.ok(human.blockers.every(b=>b.kind==='boundary'));
  assertRoute(robot);assert.equal(robot.radius,.52);
});

test('a shallow vestibule never starts inside the room or claims a body fits its exterior origin',()=>{
  for(const outsideDepth of [.001,.05,.1,.5])for(const actor of ['human','unitree']){
    const result=diagnosePassage(native([],{outsideDepth}),{actor});
    assert.equal(result.status,'blocked');assert.equal(result.reason,'boundary_blocked');assert.equal(result.route,null);
    assert.ok(result.origin.col>=14,'even a blocked diagnostic keeps its origin outside');
    assert.ok(result.origin.col<=14+outsideDepth);
  }
  const robot=diagnosePassage(native([],{outsideDepth:.6}),{actor:'unitree'});assertRoute(robot);
  assert.ok(robot.origin.col-robot.radius>=14,'a configured exterior origin fits the complete body');
  assert.equal(diagnosePassage(native([],{outsideDepth:.6}),{actor:'human'}).status,'blocked');
  const imported=diagnosePassage(native([],{imported:true,passageEntrance:{from:{col:14.025,row:3.35},doorRow:3.35,doorHalfWidth:1,outsideDepth:.05}}));
  assert.equal(imported.status,'blocked');assert.equal(imported.reason,'boundary_blocked');assert.ok(imported.origin.col>=14);
});

test('invalid coordinates, absent targets and an inactive scene cannot claim a free passage',()=>{
  for(const [scene,options,reason] of [
    [null,{},'invalid_scene'],[native([],{active:false}),{},'invalid_scene'],[native([],{cols:NaN}),{},'invalid_scene'],
    [native([{id:'bad',type:'custom',col:NaN,row:2}]),{},'invalid_scene'],[native([],{hardness:{fixed:['not-a-cell']}}),{},'invalid_scene'],
    [native([],{colliders:'not-colliders'}),{},'invalid_scene'],[native([],{hardness:{colliders:'not-colliders'}}),{},'invalid_scene'],
    [native([]),{actor:'bird'},'invalid_actor'],[native([]),{targetId:'missing'},'target_missing'],
    [native([]),{from:{col:Infinity,row:3}},'invalid_origin'],[native([]),{from:{col:-2,row:3}},'invalid_origin'],
    [native([]),{to:{col:NaN,row:3}},'invalid_target'],[native([]),{to:{col:16,row:3.35}},'invalid_target']
  ]){
    const result=diagnosePassage(scene,options);assert.equal(result.status,'unavailable');assert.equal(result.reason,reason);assert.equal(result.route,null);assert.deepEqual(result.blockers,[]);
  }
});

test('cached results remain isolated from caller edits and retain current door state and labels',()=>{
  const scene=native([wall('wall',10)]),a=diagnosePassage(scene);a.blockers[0].label='mutated';a.origin.col=-999;
  const b=diagnosePassage({...scene,doorOpen:.8});assert.equal(b.actualDoorOpen,.8);assert.equal(b.blockers[0].label,'wall');assert.ok(b.origin.col>=scene.cols);
  const renamed=diagnosePassage({...scene,layout:[{...scene.layout[0],label:'Renamed fixture'}]});assert.equal(renamed.blockers[0].label,'Renamed fixture');
});

test('explanatory cache identity includes fixed geometry and collider classification metadata',()=>{
  const item=wall('cache-role',10),scene=native([item]),before=diagnosePassage(scene);
  assert.equal(before.blockers[0].kind,'furniture');assert.equal(before.blockers[0].itemId,item.id);
  for(const flag of ['nativeFixed','navigationSolid']){
    const after=diagnosePassage({...scene,layout:[{...item,[flag]:true}]});
    assert.equal(after.navigationKey,before.navigationKey,'physical geometry itself is unchanged');
    assert.equal(after.blockers[0].kind,'architecture');assert.equal(after.blockers[0].itemId,null);
  }
  const collider={id:'cache-surface-role',minCol:10,maxCol:10.1,minRow:0,maxRow:8},base=native([],{colliders:[collider]});
  const architecture=diagnosePassage(base),hardness=diagnosePassage({...base,colliders:[{...collider,kind:'hardness',itemId:'fixed-surface'}]});
  assert.equal(hardness.navigationKey,architecture.navigationKey);assert.equal(architecture.blockers[0].kind,'architecture');assert.equal(hardness.blockers[0].kind,'hardness');
});

test('actual venue and sixty-object diagnostics stay bounded and reuse unchanged results',()=>{
  const real=native(factoryLayout()),realStart=performance.now();diagnosePassage(real,{targetId:'counter'});const realMs=performance.now()-realStart;
  const layout=[wall('causal',12)];
  for(let n=0;n<60;n++)layout.push({id:'object-'+n,type:'custom',col:1+(n%12)*.8,row:.8+Math.floor(n/12)*1.3,fp:[.16,.16]});
  const scene=native(layout,{roomId:'verified-import',imported:true,passageEntrance:{from:{col:17.4,row:3.35},doorRow:3.35,doorHalfWidth:1,outsideDepth:3.5}});
  const begin=performance.now(),first=diagnosePassage(scene,{to:{col:8.2,row:6.7}}),coldMs=performance.now()-begin;
  assert.equal(first.status,'blocked');assert.ok(first.blockers.some(b=>b.itemId==='causal'));
  const cachedStart=performance.now();for(let i=0;i<25;i++)assert.equal(diagnosePassage(scene,{to:{col:8.2,row:6.7}}).status,'blocked');const cachedMs=(performance.now()-cachedStart)/25;
  assert.ok(realMs<1000,`real venue ${realMs.toFixed(1)} ms`);assert.ok(coldMs<1500,`sixty objects ${coldMs.toFixed(1)} ms`);assert.ok(cachedMs<50,`cached ${cachedMs.toFixed(1)} ms`);
  console.log(`passage cost: real ${realMs.toFixed(1)} ms · 61 imported objects ${coldMs.toFixed(1)} ms · cached ${cachedMs.toFixed(2)} ms`);
});
