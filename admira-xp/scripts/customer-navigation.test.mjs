import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildCustomerNavigation} from './customer-navigation.mjs';

const table={id:'table',type:'custom',col:3,row:2,fp:[2,2],sx:1,sy:1};
const scene={cols:10,rows:8,layout:[table]};
function assertRoute(nav,from,path){assert.ok(path);for(const next of path){assert.ok(nav.segmentClear(from,next),JSON.stringify([from,next]));from=next;}}

test('footprints follow the rendered origin, signed quarter turns and flip; sy is height',()=>{
  for(const rot of [0,1,2,3]){
    const item={id:'turn',type:'custom',col:5,row:5,fp:[1,2],sx:2,sy:7,rot};
    const nav=buildCustomerNavigation({cols:20,rows:20,layout:[item]},{radius:0});
    const expected=[[5,7,5,9],[1,5,5,7],[3,5,1,5],[5,9,3,5]][rot];
    const box=nav.obstacles[0];
    for(const [i,k]of ['minCol','maxCol','minRow','maxRow'].entries())assert.ok(Math.abs(box[k]-expected[i])<1e-7);
    assert.equal(box.id,'turn');
  }
  const nav=buildCustomerNavigation({layout:[{...table,flipX:true,sx:1.5}]});
  assert.equal(nav.obstacles[0].minCol,0);assert.equal(nav.obstacles[0].maxCol,3);
  assert.equal(nav.obstacles[0].maxRow,5);
});

test('rugs, wall equipment and door apertures are walkable; hidden items do not block',()=>{
  const nav=buildCustomerNavigation({layout:['rug','led','tft','aroma','door'].map(type=>({id:type,type,col:1,row:1})).concat({...table,hidden:true})});
  assert.deepEqual(nav.obstacles,[]);assert.ok(nav.isWalkable({col:1.5,row:1.5}));
});

test('full swept body catches intermediate furniture, diagonal corners and fast moves',()=>{
  const nav=buildCustomerNavigation(scene);
  assert.ok(nav.isWalkable({col:2,row:3}));assert.ok(nav.isWalkable({col:6,row:3}));
  assert.equal(nav.segmentClear({col:2,row:3},{col:6,row:3}),false);
  assert.equal(nav.segmentClear({col:2.7,row:2.1},{col:3.1,row:1.7}),false);
  assert.equal(nav.isWalkable({col:2.8,row:3}),false);
  assert.ok(nav.isWalkable({col:2.75,row:3}));
  assert.equal(nav.segmentClear({col:.25,row:3},{col:9.75,row:3}),false);
});

test('route bends around furniture with safe segments, excluding its start',()=>{
  const nav=buildCustomerNavigation(scene),from={col:1,row:3},to={col:8,row:3};
  const route=nav.route(from,to);assertRoute(nav,from,route);assert.deepEqual(route.at(-1),to);assert.notDeepEqual(route[0],from);assert.ok(route.length>1);
});

test('a closed aisle or a newly enclosed starting point never teleports to a different component',()=>{
  const nav=buildCustomerNavigation({cols:8,rows:6,layout:[{id:'wall',type:'custom',col:3,row:0,fp:[1,6]}]});
  assert.equal(nav.route({col:1,row:2},{col:6,row:2}),null);
  assert.equal(nav.route({col:3.5,row:2},{col:6,row:2}),null);
  assert.ok(nav.resolve({col:3.5,row:2}));
});

test('half tile routes preserve a usable narrow aisle while body radius rejects too small gaps',()=>{
  const layout=[{id:'left',type:'custom',col:0,row:0,fp:[3,6]},{id:'right',type:'custom',col:3.6,row:0,fp:[3,6]}];
  const nav=buildCustomerNavigation({cols:8,rows:6,layout});
  assert.ok(nav.segmentClear({col:3.3,row:.5},{col:3.3,row:5.5}));
  const tight=buildCustomerNavigation({cols:8,rows:6,layout:[layout[0],{...layout[1],col:3.4}]});
  assert.equal(tight.segmentClear({col:3.2,row:.5},{col:3.2,row:5.5}),false);
});

test('only the door vestibule allows entry/exit, and entry bends around the default totem',()=>{
  const state={cols:14,rows:8,layout:[{id:'meta',type:'metahuman',col:13,row:3},{id:'dj',type:'djBooth',col:11,row:3}]};
  const nav=buildCustomerNavigation(state,{allowOutside:true}),start={col:14.92,row:3.53},end={col:8,row:5};
  assertRoute(nav,start,nav.route(start,end));assertRoute(nav,end,nav.route(end,start));
  assert.equal(nav.isWalkable({col:14.5,row:1}),false);
  assert.equal(nav.isWalkable({col:-.5,row:3.35}),false);
  assert.equal(buildCustomerNavigation(state).isWalkable(start),false);
});

test('inventory insertion/removal changes the route contract without changing the supplied scene',()=>{
  const original=structuredClone(scene),open=buildCustomerNavigation({...scene,layout:[]}),blocked=buildCustomerNavigation(scene);
  assert.notEqual(open.key,blocked.key);assert.equal(open.segmentClear({col:1,row:3},{col:8,row:3}),true);
  assert.equal(blocked.segmentClear({col:1,row:3},{col:8,row:3}),false);assert.deepEqual(scene,original);
});

// Execute the real customer branches and movement helpers from index.html. The
// checkout hook is a spy: its commerce behaviour is unchanged by navigation.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extractFunction(name){
  const start=html.indexOf(`function ${name}(`);assert.ok(start>=0,name);
  const first=html.indexOf('{',start);let braces=1,at=first+1;
  // These selected functions contain no unmatched braces in strings/comments.
  for(;braces;at++){if(html[at]==='{')braces++;else if(html[at]==='}')braces--;}
  return html.slice(start,at);
}
function simulation(layout){
  const helperStart=html.indexOf("let customerNavigationCache="),helperEnd=html.indexOf('// ── A* PATHFINDING',helperStart);
  const loopStart=html.indexOf("  for(let i=G.custs.length-1;i>=0;i--){"),loopEnd=html.indexOf('  // ── MEDICIÓN PLV',loopStart);
  const sandbox={window:{XpaceCustomerNavigation:{buildCustomerNavigation}},console,Math,Object,Number,WeakMap,JSON};
  vm.createContext(sandbox);
  vm.runInContext(`
    const ISO={cols:14,rows:8,ox:270,oy:185,tileW:80,tileH:28};
    let shopLayout=${JSON.stringify(layout)},shopFurnitureVisible=true;
    const FURNITURE_SIZE={counter:[1,2],shelves:[1,2],metahuman:[1,1],djBooth:[2,1]};
    let G={custs:[],staff:[],turns:{servingId:null},weather:null,doorOpen:0,look:{},custOut:0,sales:0,satisfaction:90,reviews:{positive:0,negative:0},fame:1};
    let tt=0,lang='es',tabletVote=null,CAM={lastApplied:null};
    function saveGame(){}
    const T=()=>({custBrowse:['hola']});
    const SFX={voteHappy(){},voteNeutral(){},voteSad(){}};
    const customerBalks=()=>false,queueSortWeight=c=>c.num,customerQueuePatience=()=>1000000;
    const clampGridCol=x=>Math.max(0,Math.min(ISO.cols-1,x)),clampGridRow=y=>Math.max(0,Math.min(ISO.rows-1,y));
    const customerMoveSpeed=(speed,c)=>speed*.74;
    const customerRenege=c=>startCustomerLeave(c),customerBalk=c=>startCustomerLeave(c);
    const assignCustomerTurn=c=>{c.queueNumber=c.num;};
    const getCustomerRoamAnchor=()=>null,isNearDoorSensor=()=>true;
    const getTabletPos=()=>({x:0,y:0}),addFloat=()=>{};
    function toIso(col,row){return{x:ISO.ox+(col-row)*40,y:ISO.oy+(col+row)*14};}
    function getDoorThresholdPos(){const p=toIso(14,3.35);return{x:p.x-7,y:p.y-20};}
    function getDoorOutsidePos(){const p=toIso(14.92,3.53);return{x:p.x-7,y:p.y-20};}
    function inventorySpace(){return 'xtanco';}
    ${html.slice(helperStart,helperEnd)}
    ${extractFunction('getCustomerExitPos')}
    ${extractFunction('getQueueTarget')}
    ${extractFunction('startCustomerLeave')}
    ${extractFunction('camForceExact')}
    function resolveCustomerCheckout(c){G.sales++;c.bought=true;startCustomerLeave(c);}
    function tick(){tt++;${html.slice(loopStart,loopEnd)}}
    globalThis.api={tick,get G(){return G;},get nav(){return getCustomerNavigation();},moveCustomerTo,customerFloorPoint,toIso,getQueueTarget,startCustomerLeave,ensureCustomerVisit,camForceExact,
      layout(value){shopLayout=value;},actor(col,row,state='walk'){
        const p=toIso(col,row),c={id:1,num:1,x:p.x-7,y:p.y-20,tx:0,ty:0,st:state,path:[],pathIdx:0,look:{age:'adulto'},persona:'loyal',dwellTicks:0,stayTargetTicks:100000,roamCooldown:100000,fr:0,ft:0,bTimer:0,bShown:true,ticketPicked:false,wantsTurn:true};G.custs.push(c);return c;}
    };
  `,sandbox);
  return sandbox.api;
}

test('real entry → kiosk → queue → purchase → exit keeps every frame outside furniture and completes once',()=>{
  const layout=[{id:'counter',type:'counter',col:1,row:2},{id:'blocker',type:'custom',col:5,row:3,fp:[2,2]},
    {id:'meta',type:'metahuman',col:13,row:3},{id:'dj',type:'djBooth',col:11,row:3}];
  const sim=simulation(layout),actor=sim.actor(14.92,3.53);actor.path=[{col:9,row:6}];
  const states=new Set();let previous=sim.customerFloorPoint(actor.x,actor.y),frames=0;
  for(;frames<16000&&sim.G.custs.length;frames++){
    sim.tick();states.add(actor.st);
    const next=sim.customerFloorPoint(actor.x,actor.y);
    assert.ok(sim.nav.segmentClear(previous,next),`crossed furniture in ${actor.st} frame ${frames}`);previous=next;
  }
  assert.deepEqual([...states],['walk','queue','buy','leave']);assert.equal(sim.G.sales,1);assert.equal(sim.G.custOut,1);assert.equal(sim.G.custs.length,0);assert.ok(frames<16000);
});

test('real queue and buy movement take a route around intermediate furniture rather than testing only their destination',()=>{
  for(const state of ['queue','buy']){
    const sim=simulation([{id:'counter',type:'counter',col:1,row:2},{...table,col:5,row:3}]);
    const actor=sim.actor(9,4,state);actor.queueNumber=1;actor.serviceTimer=100000;
    let previous=sim.customerFloorPoint(actor.x,actor.y),arrived=false;
    for(let i=0;i<8000;i++){
      sim.tick();const next=sim.customerFloorPoint(actor.x,actor.y);assert.ok(sim.nav.segmentClear(previous,next));previous=next;
      const target=sim.getQueueTarget(0);if(Math.hypot(next.col-target.col,next.row-target.row)<.02){arrived=true;break;}
    }
    assert.ok(arrived,state);
  }
});

test('real leave waits at an impassable layout and resumes after inventory removal without teleporting',()=>{
  const wall={id:'partition',type:'custom',col:8,row:0,fp:[1,8]};
  const sim=simulation([wall]),actor=sim.actor(4,4,'leave');
  const outside=sim.toIso(14.92,3.53);Object.assign(actor,{tx:outside.x-7,ty:outside.y-20,exitTx:outside.x-7,exitTy:outside.y-20,voted:true,voteTimer:0,exitLeg:true});
  const start={x:actor.x,y:actor.y};for(let i=0;i<120;i++)sim.tick();
  assert.equal(actor.x,start.x);assert.equal(actor.y,start.y);assert.equal(sim.G.custOut,0);
  sim.layout([]);let previous=sim.customerFloorPoint(actor.x,actor.y);
  for(let i=0;i<3000&&sim.G.custs.length;i++){sim.tick();const next=sim.customerFloorPoint(actor.x,actor.y);assert.ok(sim.nav.segmentClear(previous,next));assert.ok(Math.hypot(next.col-previous.col,next.row-previous.row)<.05);previous=next;}
  assert.equal(sim.G.custOut,1);
});

test('an inserted object invalidates an ongoing route before the actor crosses it',()=>{
  const sim=simulation([]),actor=sim.actor(2,4,'browse'),destination=sim.toIso(10,4);
  for(let i=0;i<30;i++)sim.moveCustomerTo(actor,destination.x-7,destination.y-20,1.4);
  sim.layout([{...table,col:5,row:3}]);let previous=sim.customerFloorPoint(actor.x,actor.y),arrived=false;
  for(let i=0;i<3000;i++){
    const status=sim.moveCustomerTo(actor,destination.x-7,destination.y-20,1.4),next=sim.customerFloorPoint(actor.x,actor.y);
    assert.ok(sim.nav.segmentClear(previous,next));previous=next;
    if(status==='arrived'){arrived=true;break;}
  }
  assert.ok(arrived);
});

test('queue slots remain distinct beyond the old four-person limit',()=>{
  const sim=simulation([{id:'counter',type:'counter',col:1,row:2}]);
  const slots=Array.from({length:10},(_,i)=>sim.getQueueTarget(i));
  assert.equal(new Set(slots.map(p=>`${p.col},${p.row}`)).size,10);
  for(const p of slots)assert.ok(sim.nav.isWalkable(p));
});

test('visitors approaching one another give way without overlapping, and continue to their destinations',()=>{
  const sim=simulation([]),a=sim.actor(3,4,'browse'),b=sim.actor(9,4,'browse');b.id=2;b.num=2;
  const aTarget=sim.toIso(10,4),bTarget=sim.toIso(2,4);let arrivedA=false,arrivedB=false;
  for(let i=0;i<5000&&(!arrivedA||!arrivedB);i++){
    arrivedA=sim.moveCustomerTo(a,aTarget.x-7,aTarget.y-20,1.3)==='arrived';
    arrivedB=sim.moveCustomerTo(b,bTarget.x-7,bTarget.y-20,1.3)==='arrived';
    const pa=sim.customerFloorPoint(a.x,a.y),pb=sim.customerFloorPoint(b.x,b.y);
    assert.ok(Math.hypot(pa.col-pb.col,pa.row-pb.row)>=.47-1e-6);
  }
  assert.ok(arrivedA&&arrivedB);
});

test('standing customers stop their walking animation, including while a route is unavailable',()=>{
  const sim=simulation([{id:'partition',type:'custom',col:8,row:0,fp:[1,8]}]),actor=sim.actor(4,4,'walk');
  actor.path=[{col:11,row:4}];actor.fr=1;actor.ft=7;
  for(let i=0;i<12;i++)sim.tick();
  assert.equal(actor.isWalking,false);assert.equal(actor.fr,0);assert.equal(actor.ft,0);
});

test('a group arriving together joins distinct queue places and completes each visit once',()=>{
  const sim=simulation([{id:'counter',type:'counter',col:1,row:2},{id:'meta',type:'metahuman',col:13,row:3},{id:'dj',type:'djBooth',col:11,row:3}]);
  for(let i=0;i<3;i++){
    const c=sim.actor(14.92,3.53);c.id=i+1;c.num=i+1;c.path=[{col:10,row:6}];
  }
  for(let frame=0;frame<18000&&sim.G.custs.length;frame++){
    const before=new Map(sim.G.custs.map(c=>[c,sim.customerFloorPoint(c.x,c.y)]));
    sim.tick();
    for(const c of sim.G.custs)assert.ok(sim.nav.segmentClear(before.get(c),sim.customerFloorPoint(c.x,c.y)),`${c.num}:${c.st}:${frame}`);
  }
  assert.equal(sim.G.sales,3);assert.equal(sim.G.custOut,3);assert.equal(sim.G.custs.length,0);
});

test('ten coincident arrivals complete the real Xtanco layout, yielding at the doorway without crossing furniture',()=>{
  const begin=html.indexOf('const FACTORY_LAYOUTS=')+'const FACTORY_LAYOUTS='.length;
  const end=html.indexOf('// Helper: ¿estamos dentro',begin);
  const factory=vm.runInNewContext('('+html.slice(begin,end).replace(/;\s*$/,'')+')');
  const sim=simulation(factory.xtanco);
  for(let i=0;i<10;i++){
    const c=sim.actor(14.92,3.53);c.id=i+1;c.num=i+1;c.path=[{col:11,row:6}];
  }
  let waitingObserved=false,frames=0;
  for(;frames<16000&&sim.G.custs.length;frames++){
    const before=new Map(sim.G.custs.map(c=>[c,sim.customerFloorPoint(c.x,c.y)]));
    sim.tick();
    for(const c of sim.G.custs){
      const previous=before.get(c),next=sim.customerFloorPoint(c.x,c.y);
      assert.ok(sim.nav.segmentClear(previous,next),`${c.num}:${c.st}:${frames}`);
      assert.ok(Math.hypot(next.col-previous.col,next.row-previous.row)<.065,'no position jump');
      if(c._waitingDoor)waitingObserved=true; // Waiting actors can clear the doorway toward a holding point.
    }
  }
  assert.ok(waitingObserved);assert.ok(frames<16000);
  assert.equal(sim.G.sales,10);assert.equal(sim.G.custOut,10);assert.equal(sim.G.custs.length,0);
});

test('a near-corner waypoint is reached before turning instead of skipping across a furniture corner',()=>{
  const sim=simulation([{id:'meta',type:'metahuman',col:13,row:3},{id:'dj',type:'djBooth',col:11,row:3}]);
  const actor=sim.actor(14.260003,4.239249),target=sim.toIso(11,6);let arrived=false;
  for(let i=0;i<3000;i++){
    const from=sim.customerFloorPoint(actor.x,actor.y);
    const status=sim.moveCustomerTo(actor,target.x-7,target.y-20,1.3);
    assert.ok(sim.nav.segmentClear(from,sim.customerFloorPoint(actor.x,actor.y)));
    if(status==='arrived'){arrived=true;break;}
  }
  assert.ok(arrived);
});

function realLayout(){
 const begin=html.indexOf('const FACTORY_LAYOUTS=')+'const FACTORY_LAYOUTS='.length;
 return vm.runInNewContext('('+html.slice(begin,html.indexOf('// Helper: ¿estamos dentro',begin)).replace(/;\s*$/,'')+')').xtanco;
}
test('mixed incoming and outgoing visitors clear the door, with browsing missions inside',()=>{
 const sim=simulation(realLayout());
 for(let i=0;i<12;i++){
  const c=sim.actor(i<4?14.92:8+(i%3)*.7,i<4?3.53:5+(i%2)*.7,i<4?'walk':'browse');
  c.id=c.num=i+1;c.wantsTurn=false;c.path=[{col:8,row:5}];
  if(i>=8)sim.startCustomerLeave(c);
 }
 let frames=0;
 for(;frames<14000&&sim.G.custs.length;frames++){
  const before=new Map(sim.G.custs.map(c=>[c,sim.customerFloorPoint(c.x,c.y)]));sim.tick();
  for(const c of sim.G.custs)assert.ok(sim.nav.segmentClear(before.get(c),sim.customerFloorPoint(c.x,c.y)),`collision ${c.num}:${frames}: ${JSON.stringify([before.get(c),sim.customerFloorPoint(c.x,c.y)])}`);
 }
 assert.equal(sim.G.custs.length,0,JSON.stringify(sim.G.custs.map(c=>({id:c.id,st:c.st,p:sim.customerFloorPoint(c.x,c.y),visit:c.visit}))));
 assert.equal(sim.G.custOut,12);
});
test('a product visit inspects distinct fixtures briefly, then completes service and leaves',()=>{
 const sim=simulation(realLayout()),c=sim.actor(8,5,'browse');c.wantsTurn=false;c.persona='curious';
 const visit=sim.ensureCustomerVisit(c);let frames=0,maxStationary=0,stationary=0;
 for(;frames<8000&&sim.G.custs.length;frames++){sim.tick();stationary=c.isWalking?0:stationary+1;maxStationary=Math.max(maxStationary,stationary);}
 assert.equal(sim.G.custs.length,0);assert.equal(sim.G.sales,1);assert.equal(sim.G.custOut,1);
 assert.equal(new Set(visit.done).size,visit.done.length);assert.equal(visit.done.length,3);
 assert.ok(maxStationary<360,`stationary ${maxStationary}`);
});

test('unreachable fixtures are skipped once and an impossible layout never creates a sale',()=>{
 const sim=simulation([{id:'wall',type:'custom',col:5,row:0,fp:[1,8]},{id:'shelves',type:'shelves',col:1,row:1}]);
 const c=sim.actor(8,5,'browse');c.wantsTurn=false;
 for(let frame=0;frame<1500&&sim.G.custs.length;frame++)sim.tick();
 assert.equal(sim.G.sales,0);assert.equal(sim.G.custOut,1);
});

test('24 distributed visits complete instead of accumulating at the door',()=>{
 const sim=simulation(realLayout());let n=0;
 for(let col=.8;col<11.5&&n<24;col+=1.15)for(let row=.8;row<7.6&&n<24;row+=1.15){
  if(!sim.nav.isWalkable({col,row}))continue;
  const c=sim.actor(col,row,'browse');c.id=c.num=++n;c.wantsTurn=false;c.persona=n%3===0?'curious':'loyal';
 }
 assert.equal(n,24);let frames=0;
 for(;frames<18000&&sim.G.custs.length;frames++){
  const before=new Map(sim.G.custs.map(c=>[c,sim.customerFloorPoint(c.x,c.y)]));sim.tick();
  for(const c of sim.G.custs){const p=sim.customerFloorPoint(c.x,c.y);assert.ok(sim.nav.segmentClear(before.get(c),p));assert.ok(Math.hypot(p.col-before.get(c).col,p.row-before.get(c).row)<.065);}
 }
 assert.equal(sim.G.custs.length,0,JSON.stringify(sim.G.custs.map(c=>({id:c.id,st:c.st,p:sim.customerFloorPoint(c.x,c.y)}))));assert.equal(sim.G.custOut,24);
});

test('camera target reduction gives browsing visitors a complete exit route and no fake checkout',()=>{
 const sim=simulation(realLayout());
 const c=sim.actor(8,5,'browse');c.tx=1;c.ty=1;
 sim.camForceExact(0);assert.equal(c.st,'leave');assert.ok(Number.isFinite(c.exitTx));assert.notEqual(c.tx,1);
 for(let i=0;i<3000&&sim.G.custs.length;i++)sim.tick();
 assert.equal(sim.G.custOut,1);assert.equal(sim.G.sales,0);
});
