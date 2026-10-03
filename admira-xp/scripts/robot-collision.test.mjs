import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildCustomerNavigation,ACTOR_BODY_RADIUS} from './customer-navigation.mjs';
import {physicalColliders,actorCollisionRadius} from './physical-colliders.mjs';
import {createLifeSnapshot} from './life-snapshot.mjs';

// Exercise the live Unitree simulation, rather than a second implementation of
// its state machine. Good owns this motion; Better and Best read the same actor.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const roomSource=readFileSync(new URL('./starbucks-room.js',import.meta.url),'utf8');
const room=vm.createContext({location:{search:'?loc=alsea-sbux-021'},URLSearchParams});
vm.runInContext(roomSource,room);
const starbucksLayout=JSON.parse(JSON.stringify(room.XpaceStarbucks.layout()));
// This test-only layout opens a real body-width aisle at the existing operational
// entrance. Keep the full measured cabinet geometry; never shrink the robot.
const openStarbucksLayout=starbucksLayout.map(item=>item.id==='sb-pastry'?{...item,row:item.row+1.25}:{...item});
function extractFunction(name){
  const start=html.indexOf(`function ${name}(`);assert.ok(start>=0,`Missing live function ${name}`);
  const body=/\)\s*\{/.exec(html.slice(start));assert.ok(body,name);
  const first=start+body.index+body[0].lastIndexOf('{');let braces=1,at=first+1;
  for(;braces;at++){if(html[at]==='{')braces++;else if(html[at]==='}')braces--;}
  return html.slice(start,at);
}
function simulation(layout=starbucksLayout,{seed=null,starbucks=true}={}){
  const customerStart=html.indexOf('let customerNavigationCache='),customerEnd=html.indexOf('// ── A* PATHFINDING',customerStart);
  const botStart=html.indexOf('// ── UNITREE BOT — visita robotica cartoon'),botEnd=html.indexOf('// Floats',botStart);
  const managerStart=html.indexOf('// ── PLAYER CONTROL: move manager'),managerEnd=html.indexOf('// ── FIESTA:',managerStart);
  const sacaStart=html.indexOf('// ── LA SACA — tobacco delivery event'),sacaEnd=html.indexOf('// ── THIEF EVENT',sacaStart);
  assert.ok(customerStart>=0&&customerEnd>customerStart&&botStart>=0&&botEnd>botStart);
  let randomSeed=Number(seed)>>>0;
  const random=seed===null?()=>.51:()=>{randomSeed=(Math.imul(1664525,randomSeed)+1013904223)>>>0;return randomSeed/2**32;};
  const sandbox=vm.createContext({console,URLSearchParams,window:{XpaceCustomerNavigation:{buildCustomerNavigation,ACTOR_BODY_RADIUS,physicalColliders,actorCollisionRadius},XpacePhysicalColliders:{physicalColliders,actorCollisionRadius},XpaceStarbucks:room.XpaceStarbucks,addEventListener(){}},Math:Object.assign(Object.create(Math),{random})});
  const names=['screenToIso','clampGridCol','clampGridRow','gridKey','isGridInside','getFurnitureFootprint','isTileBlocked','isGridWalkable','actorTile','buildDynamicOccupancy','isTileOccupiedByOther','canActorStepToTile','findNearestWalkableTile','canWalkTo','buildWalkGrid','astarPath','planActorPath','stepActorPath','moveActorTo','interiorCollisionActors','invalidateActorRoute','prepareActorCollisionFrame','enforceActorCollisionFrame','ensureUnitreeBot','resetUnitreeBotPosition','startUnitreeBot','setUnitreeBotState','sceneBinaryToggleArg','setUnitreeBotCommand','getDoorThresholdPos','getDoorOutsidePos','getCustomerExitPos','binaryToggleArg','ensureThief','setThiefCommand','ensureGuardiaCivil','setGuardiaCivilCommand','ensureOpinador','setOpinadorCommand','updateDoorAnimation'];
  vm.runInContext(`
    const ISO={cols:14,rows:8,ox:270,oy:185,tileW:80,tileH:28,wallH:165,doorRow:3.35};
    const RIGHT_WALL_FEATURE_ROW_OFFSET=.35;
    const ROBOT_PATH_SPEED_SCALE=.54,ACTOR_PATH_SPEED_SCALE=.78;
    const FURNITURE_SIZE={counter:[1,2],shelves:[1,2],metahuman:[1,1],djBooth:[2,1],cafeTable:[1,1]};
    let shopLayout=${JSON.stringify(layout)},shopFurnitureVisible=true,walkGrid=null;
    let G={unitreeBot:null,custs:[],staff:[],prods:[],doorOpen:0,doorAnim:1,dayEnded:false,fame:20,satisfaction:90,storeClosed:false,peopleVisibility:{staff:false,customers:false,passersby:false,specials:false}},lang='es',tt=0,keys={},monitorAlert=null,doorTarget=true;
    const SFX={eventChime(){},inspectionAlarm(){},doorBell(){},restockThud(){}},P={red:'#f00'};
    function needsGame(){return '';}
    function shouldDoorBeOpen(){return doorTarget;}
    function showEv(){}function setManagerSayBubble(){}function addFloat(){}
    function inventorySpace(){return 'starbucks_pg103';}
    function isStarbucksVenue(){return ${starbucks};}
    function isCafeteriaClient(){return ${starbucks};}
    function toIso(col,row){return{x:ISO.ox+(col-row)*40,y:ISO.oy+(col+row)*14};}
    function rightWallFeatureIso(row){return toIso(ISO.cols,row+RIGHT_WALL_FEATURE_ROW_OFFSET);}
    function actorPathSpeedScale(actor){return actor===G.unitreeBot?ROBOT_PATH_SPEED_SCALE:ACTOR_PATH_SPEED_SCALE;}
    ${html.slice(customerStart,customerEnd)}
    ${names.map(extractFunction).join('\n')}
    function tick(){tt++;const collisionPrevious=prepareActorCollisionFrame();${html.slice(botStart,botEnd)}enforceActorCollisionFrame(collisionPrevious);}
    globalThis.api={tick,start(){const bot=ensureUnitreeBot();startUnitreeBot(bot);return bot;},stop(){setUnitreeBotState(false);},get G(){return G;},get ISO(){return ISO;},get nav(){return typeof getActorNavigation==='function'?getActorNavigation(G.unitreeBot):getCustomerNavigation();},floor:customerFloorPoint,toIso,
      prepare:prepareActorCollisionFrame,enforce:enforceActorCollisionFrame,move:moveActorTo,plan:planActorPath,step:stepActorPath,navFor:getActorNavigation,actors:interiorCollisionActors,canWalk:canWalkTo,
      commands:{thief:setThiefCommand,guardiaCivil:setGuardiaCivilCommand,opinador:setOpinadorCommand,unitree:setUnitreeBotCommand},
      managerInput(value){keys=value;${html.slice(managerStart,managerEnd)}},
      sacaTick(){tt++;const previous=prepareActorCollisionFrame();${html.slice(sacaStart,sacaEnd)}enforceActorCollisionFrame(previous);},
      doorTick(open){doorTarget=open;updateDoorAnimation();},
      outside:getDoorOutsidePos,
      layout(value){shopLayout=value;buildWalkGrid();},place(bot,col,row){const p=toIso(col,row);bot.x=p.x-7;bot.y=p.y-20;}};
  `,sandbox);
  return sandbox.api;
}
function traceUntilIdle(sim,bot,{limit=18000}={}){
  const phases=new Set([bot.phase]);let previous=sim.floor(bot.x,bot.y),frames=0;
  assert.ok(sim.nav.isWalkable(previous),`Robot spawned in a solid or outside the door: ${JSON.stringify(previous)}`);
  for(;frames<limit&&bot.phase!=='idle';frames++){
    sim.tick();phases.add(bot.phase);const next=sim.floor(bot.x,bot.y);
    if(bot.phase!=='idle'){
      assert.ok(sim.nav.isWalkable(next),`Robot intersects a solid during ${bot.phase}, frame ${frames}: ${JSON.stringify(next)}`);
      assert.ok(sim.nav.segmentClear(previous,next),`Robot swept through a wall/cabinet during ${bot.phase}, frame ${frames}: ${JSON.stringify([previous,next])}`);
      assert.ok(Math.hypot(next.col-previous.col,next.row-previous.row)<.1,`Robot teleported during ${bot.phase}`);
    }
    previous=next;
  }
  assert.equal(bot.phase,'idle','A safe journey must finish, rather than just immobilising/hiding Unitree');
  assert.ok(frames<limit);return phases;
}

test('Unitree starts inside the real exterior door corridor, rather than using screen x=820',()=>{
  const sim=simulation(),bot=sim.start(),p=sim.floor(bot.x,bot.y);
  assert.ok(sim.nav.isWalkable(p),JSON.stringify(p));
  assert.ok(p.col>sim.ISO.cols,JSON.stringify(p));
});

test('Starbucks Unitree completes an open physical layout with a clear swept body every frame',()=>{
  const sim=simulation(openStarbucksLayout),bot=sim.start(),identity=bot;
  const phases=traceUntilIdle(sim,bot);
  assert.equal(sim.G.unitreeBot,identity);
  for(const phase of ['entering','scanning','leaving','exiting','idle'])assert.ok(phases.has(phase),phase);
  assert.equal(sim.G.custs.length,0);assert.equal(sim.G.staff.length,0);
});

test('an active scan stays clear of the Starbucks pastry cabinet and corner at every step',()=>{
  const sim=simulation(openStarbucksLayout),bot=sim.start();sim.place(bot,9,3.35);
  Object.assign(bot,{phase:'scanning',scanTimer:500,path:null,pathIdx:0,pathMode:''});
  traceUntilIdle(sim,bot);
});

test('a robot leaving through a sealed room waits, then resumes when the partition is removed',()=>{
  const sim=simulation(openStarbucksLayout),bot=sim.start();sim.place(bot,9,3.35);
  Object.assign(bot,{phase:'scanning',scanTimer:500,path:null,pathIdx:0,pathMode:''});
  const wall={id:'closed-partition',type:'custom',col:11,row:0,fp:[1,8]};
  sim.layout([...openStarbucksLayout,wall]);sim.stop();
  let previous=sim.floor(bot.x,bot.y);
  for(let frame=0;frame<180;frame++){
    sim.tick();const next=sim.floor(bot.x,bot.y);
    assert.ok(sim.nav.segmentClear(previous,next),`Crossed sealed room at ${frame}`);
    assert.equal(bot.phase,'leaving','No route is not the same thing as reaching the door');
    assert.ok(next.col<11);previous=next;
  }
  sim.layout(openStarbucksLayout);traceUntilIdle(sim,bot);
});

test('the original Starbucks entrance narrower than the robot body blocks entry without hiding Unitree',()=>{
  const sim=simulation(),bot=sim.start(),start=sim.floor(bot.x,bot.y);
  assert.ok(sim.nav.isWalkable(start));
  assert.ok(sim.nav.radius>=actorCollisionRadius({kind:'unitreeBot',robot:true}));
  for(let frame=0;frame<240;frame++){
    sim.tick();const next=sim.floor(bot.x,bot.y);
    assert.ok(sim.nav.isWalkable(next));assert.ok(sim.nav.segmentClear(start,next));
    assert.equal(bot.phase,'entering');assert.ok(next.col>=sim.ISO.cols-sim.nav.radius);
  }
});

test('switching Unitree off while it waits outside a blocked entrance returns it to base without entering',()=>{
  const sim=simulation(),bot=sim.start();for(let frame=0;frame<15;frame++)sim.tick();
  sim.stop();const start=sim.floor(bot.x,bot.y);
  for(let frame=0;frame<100&&bot.phase!=='idle';frame++){
    sim.tick();const next=sim.floor(bot.x,bot.y);
    assert.ok(sim.nav.segmentClear(start,next));assert.ok(next.col>=sim.ISO.cols-sim.nav.radius);
  }
  assert.equal(bot.phase,'idle');assert.equal(sim.G.unitreeBot,bot);
});

test('Good motion and Better/Best snapshot use the same Unitree floor anchor and stable identity',()=>{
  const sim=simulation(openStarbucksLayout),bot=sim.start(),snapshot=createLifeSnapshot();
  for(let frame=0;frame<100;frame++){
    sim.tick();const scene=snapshot({active:true,game:sim.G,iso:sim.ISO,layout:openStarbucksLayout,hardness:{blocked:[]},venue:'alsea-sbux-021'});
    const robot=scene.actors.find(actor=>actor.kind==='unitreeBot'),p=sim.floor(bot.x,bot.y);
    assert.ok(robot);assert.equal(robot.robot,true);
    assert.ok(Math.abs(robot.col-p.col)<1e-9&&Math.abs(robot.row-p.row)<1e-9);
    assert.ok(sim.nav.isWalkable({col:robot.col,row:robot.row}));
  }
});

test('Good Unitree ground contact coincides with the floor anchor used by collision and 3D views',()=>{
  const shadows=[],bot={phase:'scanning',x:470,y:220,dir:1,aFrame:0,bTimer:0};
  const sandbox=vm.createContext({Math,tt:1,BTNS:{},cx:new Proxy({},{get:()=>()=>{}}),
    r(){},rx(){},tx(){},glow(){},nog(){},queueSpeechBubble(){},drawIsoShadow(x,y){shadows.push({x,y});}});
  vm.runInContext(`${extractFunction('drawIsoUnitreeBot')}\nglobalThis.draw=drawIsoUnitreeBot;`,sandbox);
  sandbox.draw(bot);
  assert.equal(shadows.length,1);assert.deepEqual(shadows[0],{x:bot.x+7,y:bot.y+20});
});

for(const kind of ['staff','customer','saca','thief','guardiaCivil','opinador','unitreeBot']){
  test(`the real collision guard rejects a direct cabinet bypass for ${kind}`,()=>{
    const sim=simulation(openStarbucksLayout),actor={id:'guard-'+kind,name:'Retained actor',path:[{col:7,row:2}],navPath:[{col:7,row:2}],pathMode:'legacy',
      ...(kind==='staff'?{hired:true,fired:false}:kind==='customer'?{st:'walk'}:{phase:'entering'})};
    if(kind==='staff')sim.G.staff.push(actor);else if(kind==='customer')sim.G.custs.push(actor);else sim.G[kind]=actor;
    sim.place(actor,9,3.35);const navigation=sim.navFor(actor),before=sim.floor(actor.x,actor.y),guard=sim.prepare();
    assert.ok(navigation.isWalkable(before));
    sim.place(actor,9,6.4);const after=sim.floor(actor.x,actor.y);
    assert.ok(navigation.isWalkable(after),'Both endpoints are clear; the intermediate cabinet must still block');
    assert.equal(navigation.segmentClear(before,after),false);
    sim.enforce(guard);
    assert.deepEqual(sim.floor(actor.x,actor.y),before);assert.equal(actor.id,'guard-'+kind);assert.equal(actor.name,'Retained actor');
    assert.equal(actor.path,null);assert.equal(actor.navPath,null);
    assert.ok(sim.actors().includes(actor),'The actor remains active instead of being removed');
  });
}

test('a restored Unitree inside the pastry cabinet recovers before drawing while retaining its identity and phase',()=>{
  const sim=simulation(openStarbucksLayout),bot=sim.start();
  sim.place(bot,8,4.75);Object.assign(bot,{phase:'scanning',scanTimer:800,path:[{col:8,row:4}],navPath:[{col:8,row:4}],pathMode:'legacy'});
  assert.equal(sim.nav.isWalkable(sim.floor(bot.x,bot.y)),false);
  const guard=sim.prepare(),restored=sim.floor(bot.x,bot.y);
  assert.ok(sim.nav.isWalkable(restored));assert.equal(sim.G.unitreeBot,bot);assert.equal(bot.phase,'scanning');assert.equal(bot.scanTimer,800);
  assert.equal(bot.path,null);assert.equal(bot.navPath,null);assert.equal(bot._collisionPending,false);assert.ok(guard.has(bot));
});

test('keyboard manager control checks its actual feet +7/+20 and blocks a cabinet-facing step',()=>{
  const sim=simulation(openStarbucksLayout),manager={hired:true,role:0,aTimer:0,aFrame:0};sim.G.staff.push(manager);
  sim.place(manager,9,6.15);const before={x:manager.x,y:manager.y};
  assert.ok(sim.navFor(manager).isWalkable(sim.floor(manager.x,manager.y)));
  sim.managerInput({KeyP:true});assert.deepEqual({x:manager.x,y:manager.y},before);
  sim.place(manager,9,6.5);const free=sim.floor(manager.x,manager.y);
  sim.managerInput({KeyA:true});const next=sim.floor(manager.x,manager.y);
  assert.ok(sim.navFor(manager).segmentClear(free,next));assert.notDeepEqual(next,free,'Free movement remains usable');
});

for(const kind of ['thief','guardiaCivil','opinador']){
  test(`the real ${kind} command begins at the collision-safe exterior door position`,()=>{
    const sim=simulation(openStarbucksLayout);sim.commands[kind]('on');const actor=sim.G[kind],p=sim.floor(actor.x,actor.y);
    const outside=sim.outside();
    assert.ok(sim.navFor(actor).isWalkable(p));assert.ok(p.col>=sim.ISO.cols);assert.ok(Math.abs(actor.x-outside.x)<1e-9&&Math.abs(actor.y-outside.y)<1e-9);
    assert.ok(Math.abs(p.row-sim.ISO.doorRow)<1e-9);
  });
}

for(const seed of [1,7,43,2026,2147483647]){
  test(`seeded live scanning preserves physical clearance throughout its journey: seed ${seed}`,()=>{
    const sim=simulation(openStarbucksLayout,{seed}),bot=sim.start();const phases=traceUntilIdle(sim,bot);
    assert.ok(phases.has('scanning'));assert.ok(phases.has('idle'));assert.equal(sim.G.unitreeBot,bot);
  });
}

test('the real robot path step sweeps the full body at accelerated speed and never skips a corner',()=>{
  const sim=simulation(openStarbucksLayout),bot=sim.start();sim.place(bot,9,3.35);bot.phase='scanning';
  const path=sim.plan(bot,4,2);assert.ok(path?.length>1,'The cabinet requires a bent route');
  let previous=sim.floor(bot.x,bot.y),arrived=false;
  for(let frame=0;frame<1000;frame++){
    const result=sim.step(bot,'path','pathIdx',8),next=sim.floor(bot.x,bot.y);
    assert.ok(sim.nav.segmentClear(previous,next));assert.ok(sim.nav.isWalkable(next));
    assert.ok(Math.hypot(next.col-previous.col,next.row-previous.row)<.12);
    previous=next;if(result==='done'){arrived=true;break;}
  }
  assert.ok(arrived);assert.ok(Math.hypot(previous.col-4,previous.row-2)<1e-6);
});

test('the real delivery branch spawns safely, replenishes once and exits through an open physical aisle',()=>{
  const sim=simulation(openStarbucksLayout),actor={phase:'idle',cooldown:0,x:820,y:0};sim.G.saca=actor;sim.G.prods=[{stock:1}];
  sim.sacaTick();assert.equal(actor.phase,'incoming');let previous=sim.floor(actor.x,actor.y);
  assert.ok(sim.navFor(actor).isWalkable(previous));const phases=new Set([actor.phase]);
  for(let frame=0;frame<3000&&actor.phase!=='idle';frame++){
    sim.sacaTick();const next=sim.floor(actor.x,actor.y);phases.add(actor.phase);
    assert.ok(sim.navFor(actor).segmentClear(previous,next));previous=next;
  }
  assert.equal(actor.phase,'idle',JSON.stringify({point:sim.floor(actor.x,actor.y),path:actor.path,goal:actor.pathGoal,index:actor.pathIdx}));assert.equal(sim.G.saca,actor);assert.equal(sim.G.prods[0].stock,9);
  for(const phase of ['incoming','unloading','outgoing','idle'])assert.ok(phases.has(phase));
});

test('requesting an already active Unitree again preserves its position, identity and ongoing scan',()=>{
  const sim=simulation(openStarbucksLayout),bot=sim.start();sim.place(bot,9,3.35);
  Object.assign(bot,{phase:'scanning',scanTimer:700,path:[{col:10,row:3.35}],pathMode:'roam'});
  const before={x:bot.x,y:bot.y,scanTimer:bot.scanTimer,path:bot.path};
  sim.commands.unitree('on');assert.equal(sim.G.unitreeBot,bot);assert.equal(bot.phase,'scanning');
  assert.equal(bot.x,before.x);assert.equal(bot.y,before.y);assert.equal(bot.scanTimer,before.scanTimer);assert.equal(bot.path,before.path);
  sim.start();assert.equal(bot.x,before.x);assert.equal(bot.y,before.y);assert.equal(bot.phase,'scanning');
});

for(const robot of [false,true]){
  test(`${robot?'robot':'person'} waiting outside permits a closed door to open fully before crossing`,()=>{
    const sim=simulation([],{starbucks:false}),actor=robot?sim.start():{hired:true};if(!robot)sim.G.staff.push(actor);
    const outside=sim.outside();Object.assign(actor,{x:outside.x,y:outside.y});sim.G.doorAnim=0;
    const before={x:actor.x,y:actor.y};assert.ok(sim.navFor(actor).isWalkable(sim.floor(actor.x,actor.y)));
    for(let frame=0;frame<100&&sim.G.doorAnim<1;frame++){
      sim.doorTick(true);assert.deepEqual({x:actor.x,y:actor.y},before);assert.ok(sim.navFor(actor).isWalkable(sim.floor(actor.x,actor.y)));
    }
    assert.equal(sim.G.doorAnim,1,'The waiting point must be outside the entire leaf sweep');
    const target=sim.toIso(10,3.35);let previous=sim.floor(actor.x,actor.y),arrived=false;
    for(let frame=0;frame<1000;frame++){
      const result=sim.move(actor,target.x-7,target.y-20,8),next=sim.floor(actor.x,actor.y);
      assert.ok(sim.navFor(actor).segmentClear(previous,next));previous=next;if(result==='done'){arrived=true;break;}
    }
    assert.ok(arrived);
  });

  test(`an opening or closing door waits for the ${robot?'robot':'person'} in its swept area without pushing it`,()=>{
    for(const opening of [false,true]){
      const sim=simulation([],{starbucks:false}),actor=robot?sim.start():{hired:true};if(!robot)sim.G.staff.push(actor);
      sim.G.doorAnim=opening?0:1;sim.place(actor,15,3.35);const before={x:actor.x,y:actor.y};
      assert.ok(sim.navFor(actor).isWalkable(sim.floor(actor.x,actor.y)));
      for(let frame=0;frame<40;frame++){
        sim.doorTick(opening);assert.deepEqual({x:actor.x,y:actor.y},before);assert.ok(sim.navFor(actor).isWalkable(sim.floor(actor.x,actor.y)));
      }
      assert.ok(opening?sim.G.doorAnim<1:sim.G.doorAnim>0,'The leaf stops before touching the waiting body');
      const outside=sim.outside();let previous=sim.floor(actor.x,actor.y),away=false;
      for(let frame=0;frame<1000;frame++){
        const result=sim.move(actor,outside.x,outside.y,8),next=sim.floor(actor.x,actor.y);
        assert.ok(sim.navFor(actor).segmentClear(previous,next));previous=next;if(result==='done'){away=true;break;}
      }
      assert.ok(away);for(let frame=0;frame<100;frame++)sim.doorTick(opening);assert.equal(sim.G.doorAnim,opening?1:0);
    }
  });
}

test('native recovery retains the last connected floor component while it is temporarily covered',()=>{
  const partition={id:'full-partition',type:'custom',col:7,row:0,fp:[1,8]},sim=simulation([partition],{starbucks:false});
  const bot={phase:'scanning',scanTimer:700,name:'Retained robot'};sim.G.unitreeBot=bot;sim.place(bot,6.25,4);
  const initial=sim.floor(bot.x,bot.y),original=sim.nav;sim.prepare();
  sim.layout([partition,{id:'covered-left-component',type:'custom',col:0,row:0,fp:[6.49,8]}]);
  const pending=sim.prepare();assert.equal(bot._collisionPending,true);assert.equal(pending.has(bot),false);
  assert.deepEqual(sim.floor(bot.x,bot.y),initial);assert.equal(bot.phase,'scanning');assert.equal(bot.scanTimer,700);
  assert.ok(sim.nav.isWalkable({col:10,row:4}),'Another component is free, but must not be used for recovery');
  sim.layout([partition,{id:'covers-last-point',type:'custom',col:5.75,row:3,fp:[1,2]}]);
  const recovered=sim.prepare(),p=sim.floor(bot.x,bot.y);
  assert.ok(recovered.has(bot));assert.equal(bot._collisionPending,false);assert.ok(sim.nav.isWalkable(p));
  assert.ok(p.col<7-sim.nav.radius);assert.notEqual(original.route(initial,p),null);assert.equal(sim.G.unitreeBot,bot);
});

test('native preparation rejects a valid endpoint reached through an out-of-tick wall bypass',()=>{
  const sim=simulation([{id:'partition',type:'custom',col:7,row:0,fp:[1,8]}],{starbucks:false}),bot={phase:'scanning'};
  sim.G.unitreeBot=bot;sim.place(bot,4,4);sim.prepare();const initial=sim.floor(bot.x,bot.y);
  sim.place(bot,10,4);assert.ok(sim.nav.isWalkable(sim.floor(bot.x,bot.y)));
  sim.prepare();assert.deepEqual(sim.floor(bot.x,bot.y),initial);assert.equal(bot.phase,'scanning');assert.equal(bot._collisionPending,false);
});

for(const kind of ['staff','customer','unitreeBot']){
  test(`nonfinite restored ${kind} coordinates recover to a safe owned starting point before rendering`,()=>{
    const sim=simulation([],{starbucks:false}),actor={id:'nan-'+kind,name:'Restored identity',x:NaN,y:Infinity,
      ...(kind==='staff'?{hired:true,homeCol:4,homeRow:4.5}:kind==='customer'?{st:'walk'}:{phase:'scanning',scanTimer:500})};
    if(kind==='staff')sim.G.staff.push(actor);else if(kind==='customer')sim.G.custs.push(actor);else sim.G.unitreeBot=actor;
    const prepared=sim.prepare(),p=sim.floor(actor.x,actor.y);assert.ok(prepared.has(actor));assert.ok(sim.navFor(actor).isWalkable(p));
    assert.equal(actor._collisionPending,false);assert.equal(actor.id,'nan-'+kind);assert.equal(actor.name,'Restored identity');
    if(kind==='staff')assert.ok(Math.abs(p.col-4)<1e-9&&Math.abs(p.row-4.5)<1e-9);
    else assert.ok(p.col>=sim.ISO.cols);
  });
}
