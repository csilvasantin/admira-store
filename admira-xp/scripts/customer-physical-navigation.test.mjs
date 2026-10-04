import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {ACTOR_BODY_RADIUS,buildCustomerNavigation} from './customer-navigation.mjs';
import {createCustomerMotion} from './customer-motion.mjs';

const wall={id:'masonry',minCol:4,maxCol:4.15,minRow:0,maxRow:8};
const room={cols:12,rows:8,layout:[],colliders:[wall]};
const start={col:2,row:3},finish={col:9,row:3};
const circleDistance=(p,box)=>Math.hypot(Math.max(box.minCol-p.col,0,p.col-box.maxCol),Math.max(box.minRow-p.row,0,p.row-box.maxRow));

function assertSweptPath(nav,from,to){
  const route=nav.route(from,to);assert.ok(route,'free physical passage must be reachable');
  for(const next of route){
    assert.ok(nav.segmentClear(from,next),`unsafe segment ${JSON.stringify([from,next])}`);
    // This independent sampled-body check does not reuse navigation's slab
    // algorithm. It catches footprint/radius and intermediate-point errors.
    for(let n=0;n<=160;n++){
      const p={col:from.col+(next.col-from.col)*n/160,row:from.row+(next.row-from.row)*n/160};
      for(const box of nav.obstacles)assert.ok(circleDistance(p,box)>nav.radius-1e-8,`${JSON.stringify(p)} intersects ${box.id}`);
    }
    from=next;
  }
  assert.deepEqual(from,to);return route;
}

test('one full rendered body radius applies in every quality and blocks sub-body passages',()=>{
  assert.equal(ACTOR_BODY_RADIUS,.72);
  for(const quality of ['good','better','best']){
    const nav=buildCustomerNavigation({...room,quality});
    assert.equal(nav.radius,.72);
    assert.equal(nav.route(start,finish),null);
    assert.equal(nav.segmentClear(start,finish),false);
    const aisle=buildCustomerNavigation({cols:10,rows:8,quality,layout:[],colliders:[
      {id:'left',minCol:0,maxCol:4,minRow:2,maxRow:6},
      {id:'right',minCol:5.4,maxCol:10,minRow:2,maxRow:6}
    ]});
    assert.equal(aisle.route({col:2,row:1},{col:8,row:7}),null,'1.4 tiles cannot fit a 1.44-tile body');
  }
});

test('the real Xtanco doorway remains blocked by its totem for a body that does not fit',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const begin=html.indexOf('const FACTORY_LAYOUTS=')+'const FACTORY_LAYOUTS='.length;
  const factory=vm.runInNewContext('('+html.slice(begin,html.indexOf('// Helper: ¿estamos dentro',begin)).replace(/;\s*$/,'')+')');
  for(const quality of ['good','better','best'])for(const radius of [ACTOR_BODY_RADIUS,.52]){
    const nav=buildCustomerNavigation({cols:14,rows:8,layout:factory.xtanco,quality},{allowOutside:true,radius});
    const entrance={col:14.92,row:3.53},inside={col:8,row:5};
    assert.ok(nav.isWalkable(entrance));assert.ok(nav.isWalkable(inside));
    assert.equal(nav.route(entrance,inside),null,'changing quality cannot squeeze a human/robot past the physical totem');
  }
});

test('architecture and fixed hardness stay solid when their mesh or furniture layer is hidden',()=>{
  const copy=structuredClone(room);
  const hidden=buildCustomerNavigation({...room,furnitureVisible:false,colliders:[{...wall,hidden:true,solid:false}]});
  assert.equal(hidden.segmentClear(start,finish),false);
  const fixed=buildCustomerNavigation({cols:12,rows:8,layout:[],hardness:{fixed:Array.from({length:8},(_,row)=>'4,'+row)}});
  assert.equal(fixed.route(start,finish),null);
  assert.equal(fixed.isWalkable({col:4.5,row:3}),false);
  const opened=buildCustomerNavigation({...room,colliders:[]});
  assert.notEqual(hidden.key,opened.key);assert.ok(opened.segmentClear(start,finish));
  assert.deepEqual(room,copy,'physical scene data is never modified');
});

test('a thin architecture partition blocks high-speed and diagonal crossing with valid endpoints',()=>{
  const nav=buildCustomerNavigation({cols:12,rows:8,colliders:[{id:'glass-wall',minCol:5,maxCol:5.002,minRow:1,maxRow:7}]});
  assert.ok(nav.isWalkable(start));assert.ok(nav.isWalkable(finish));
  assert.equal(nav.segmentClear(start,finish),false);
  assert.equal(nav.segmentClear({col:3,row:1},{col:7,row:7}),false);
  const corner=buildCustomerNavigation({cols:12,rows:8,colliders:[{id:'corner',minCol:5,maxCol:7,minRow:3,maxRow:5}]});
  assert.equal(corner.segmentClear({col:4,row:3},{col:5,row:2}),false,'diagonal endpoints cannot clip an expanded corner');
  assertSweptPath(corner,{col:2,row:4},{col:10,row:4});
});

test('recovery of an invalid target stays in the actor reachable component',()=>{
  const nav=buildCustomerNavigation(room),invalid={col:4.1,row:3};
  const closest=nav.resolve(invalid);assert.ok(closest.col>wall.maxCol);
  const reachable=nav.resolve(invalid,{from:start});assert.ok(reachable.col<wall.minCol);
  assertSweptPath(nav,start,reachable);
  assert.equal(nav.resolve(finish,{from:start}),null,'a valid point beyond a wall remains unreachable');
  assert.equal(nav.resolve(invalid,{from:{col:4,row:3}}),null,'an invalid origin never invents a crossing');
});

test('a sealed entry never resolves an interior destination to an exterior fake arrival',()=>{
  const scene={cols:12,rows:8,doorRow:3.35,colliders:[
    {id:'sealed-front',minCol:11,maxCol:11.05,minRow:0,maxRow:8},
    {id:'counter-target',minCol:6,maxCol:8,minRow:3,maxRow:5}
  ]};
  const nav=buildCustomerNavigation(scene,{allowOutside:true}),outside={col:12.92,row:3.53},requested={col:7,row:4};
  assert.ok(nav.isWalkable(outside));assert.equal(nav.isWalkable(requested),false);
  // The legacy unconstrained correction finds the starting side of the wall.
  const wrongSide=nav.resolve(requested,{from:outside});assert.ok(wrongSide.col>=nav.cols);
  assert.equal(nav.resolve(requested,{from:outside,accept:p=>p.col<=nav.cols-nav.radius}),null);
  assert.equal(nav.resolve(requested,{from:outside,strict:true}),null);
  const opened=buildCustomerNavigation({...scene,colliders:[scene.colliders[1]]},{allowOutside:true});
  const destination=opened.resolve(requested,{from:outside,accept:p=>p.col<=opened.cols-opened.radius});
  assert.ok(destination);assert.ok(destination.col<=opened.cols-opened.radius);
  assertSweptPath(opened,outside,destination);
});

test('an obstructed exit requires an actual reachable exterior destination',()=>{
  const scene={cols:12,rows:8,doorRow:3.35,colliders:[{id:'exit-blocker',minCol:12.6,maxCol:13.3,minRow:2,maxRow:5}]};
  const nav=buildCustomerNavigation(scene,{allowOutside:true}),inside={col:9,row:3.35},requested={col:12.92,row:3.53};
  assert.ok(nav.isWalkable(inside));assert.equal(nav.isWalkable(requested),false);
  assert.equal(nav.resolve(requested,{from:inside,strict:true,accept:p=>p.col>=nav.cols}),null);
  const open=buildCustomerNavigation({...scene,colliders:[]},{allowOutside:true});
  const exact=open.resolve(requested,{from:inside,strict:true,accept:p=>p.col>=open.cols});
  assert.deepEqual(exact,requested);assertSweptPath(open,inside,exact);
});

test('off-grid narrow recovery uses exact surfaces rather than a different half-tile cell',()=>{
  const nav=buildCustomerNavigation({cols:8,rows:8,colliders:[
    {id:'left',minCol:0,maxCol:3.3,minRow:0,maxRow:8},
    {id:'right',minCol:4.77,maxCol:8,minRow:0,maxRow:8}
  ]});
  const from={col:4.035,row:4};assert.ok(nav.isWalkable(from));
  const corrected=nav.resolve({col:3.4,row:4},{from});
  assert.ok(corrected);assert.ok(corrected.col>4.02&&corrected.col<4.05);
  assertSweptPath(nav,from,corrected);
});

test('door opening dimensions and outside depth participate in collision and cache identity',()=>{
  const closed=buildCustomerNavigation({cols:8,rows:6,doorRow:2,doorHalfWidth:.7,outsideDepth:.6},{allowOutside:true});
  assert.equal(closed.isWalkable({col:8.5,row:2}),false,'a doorway narrower than the full body is closed');
  const nav=buildCustomerNavigation({cols:8,rows:6,doorRow:2,doorHalfWidth:1,outsideDepth:.6},{allowOutside:true});
  assert.notEqual(nav.key,closed.key);
  assert.ok(nav.isWalkable({col:8.5,row:2}));
  assert.equal(nav.isWalkable({col:8.7,row:2}),false);
  assert.equal(nav.segmentClear({col:6,row:1},{col:8.5,row:2}),false,'cannot cut a doorway side');
  assertSweptPath(nav,{col:6,row:1},{col:8.5,row:2});
});

test('isometric round trips preserve full-body routes through an exact doorway corner',()=>{
  const nav=buildCustomerNavigation({cols:14,rows:8,doorRow:3.35,doorHalfWidth:1},{radius:.72,allowOutside:true});
  const project=p=>({x:270+(p.col-p.row)*40-7,y:185+(p.col+p.row)*14-20});
  const unproject=p=>{const dx=(p.x+7-270)/40,dy=(p.y+20-185)/14;return {col:(dx+dy)/2,row:(dy-dx)/2};};
  const corner={col:nav.cols-nav.radius,row:nav.doorRow+nav.doorHalfWidth-nav.radius};
  const rounded=unproject(project(corner)),inside={col:13.03001,row:4.89001},outside={col:14.5,row:3.35};
  assert.ok(rounded.col>corner.col,'fixture reproduces a floating point boundary overshoot');
  assert.ok(nav.isWalkable(rounded));assert.ok(nav.segmentClear(rounded,inside));
  assert.ok(nav.segmentClear(inside,rounded));assert.ok(nav.segmentClear(outside,rounded));
  assert.ok(nav.segmentClear(rounded,outside));
  const low=nav.doorRow-nav.doorHalfWidth+nav.radius,edge=nav.cols-nav.radius;
  assert.equal(nav.segmentClear({col:edge-.01,row:low-.000002},{col:edge+.01,row:low+.000001}),false,'numerical tolerance must not open a real corner cut');
});

test('full-body motion waits through a sealed wall and resumes only after physical removal',()=>{
  const nav=buildCustomerNavigation(room),actor={id:'robot',kind:'staff',...start,heading:0,walking:true};
  const motion=createCustomerMotion(actor,{navigation:nav});
  motion.update({...actor,...finish},{navigation:nav,time:100});
  for(let time=116;time<5000;time+=16){
    const pose=motion.advance(time);assert.deepEqual({col:pose.col,row:pose.row},start);assert.equal(pose.blocked,true);assert.equal(pose.walking,false);
  }
  const clear=buildCustomerNavigation({...room,colliders:[]});
  motion.update({...actor,...finish},{navigation:clear,time:5000});
  let previous=motion.pose;
  for(let time=5016;time<20000;time+=16){
    const pose=motion.advance(time);assert.ok(clear.segmentClear(previous,pose));
    assert.ok(Math.hypot(pose.col-previous.col,pose.row-previous.row)<.15,'no resume jump');previous=pose;
  }
  assert.ok(Math.hypot(previous.col-finish.col,previous.row-finish.row)<.001);
});

test('malformed and non-finite observations cannot retain movement or draw an invalid stale pose',()=>{
  const clear=buildCustomerNavigation({...room,colliders:[]}),motion=createCustomerMotion({id:'visitor',...start,walking:true},{navigation:clear});
  motion.update({...finish,walking:true},{navigation:clear,time:100});motion.advance(116);
  const halted=motion.update({col:NaN,row:3},{navigation:clear,time:NaN});
  assert.equal(halted.walking,false);const position={col:halted.col,row:halted.row};
  for(let time=132;time<1000;time+=16){const pose=motion.advance(time);assert.deepEqual({col:pose.col,row:pose.row},position);}
  const covered=buildCustomerNavigation({...room,colliders:[{id:'new-wall',minCol:1,maxCol:3,minRow:0,maxRow:8}]});
  assert.equal(motion.update({col:NaN,row:3},{navigation:covered,time:1000}),null,'invalid observation cannot render body inside newly placed architecture');
});

test('a body hidden by a temporarily full map returns after a safe position becomes available',()=>{
  const open=buildCustomerNavigation({cols:8,rows:6}),actor={id:'visitor',col:2,row:3,walking:false};
  const motion=createCustomerMotion(actor,{navigation:open});assert.ok(motion.pose);
  const closed=buildCustomerNavigation({cols:8,rows:6,colliders:[{id:'whole-map',minCol:0,maxCol:8,minRow:0,maxRow:6}]});
  assert.equal(motion.update(actor,{navigation:closed,time:100}),null);
  assert.equal(motion.advance(116),null);
  const recovered=motion.update(actor,{navigation:open,time:200});assert.ok(recovered);
  assert.ok(open.isWalkable(recovered));assert.equal(recovered.walking,false);
  motion.update({...actor,col:6,walking:true},{navigation:open,time:300});
  let previous=motion.pose;
  for(let time=316;time<6000;time+=16){const next=motion.advance(time);assert.ok(open.segmentClear(previous,next));previous=next;}
  assert.ok(Math.hypot(previous.col-6,previous.row-3)<.001);
});

test('map recovery never moves an existing actor through a previously sealed wall',()=>{
  const oldMap=buildCustomerNavigation(room),actor={id:'visitor',...start,walking:false};
  const motion=createCustomerMotion(actor,{navigation:oldMap});assert.ok(motion.pose);
  const covered=buildCustomerNavigation({...room,colliders:[wall,{id:'filled-left-component',minCol:0,maxCol:4,minRow:0,maxRow:8}]});
  assert.equal(motion.update(actor,{navigation:covered,time:100}),null,'the only new free component lies beyond an older sealed wall');
  for(let time=116;time<1000;time+=16){
    assert.equal(motion.update(actor,{navigation:covered,time}),null,'a later snapshot cannot reinitialize in another component');
    assert.equal(motion.advance(time),null);
  }
  const restored=motion.update(actor,{navigation:oldMap,time:200});
  assert.ok(restored);assert.ok(restored.col<wall.minCol);assert.ok(oldMap.isWalkable(restored));
});

test('many physical bounds keep the cached graph reusable across moving targets',()=>{
  const colliders=Array.from({length:180},(_,i)=>({id:'model-part-'+i,minCol:3+(i%18)*.25,maxCol:3.2+(i%18)*.25,minRow:2+Math.floor(i/18)*.2,maxRow:2.16+Math.floor(i/18)*.2}));
  const nav=buildCustomerNavigation({cols:14,rows:10,colliders});
  for(let i=0;i<15;i++)assertSweptPath(nav,{col:1,row:3+i*.02},{col:12,row:3+i*.03});
});
