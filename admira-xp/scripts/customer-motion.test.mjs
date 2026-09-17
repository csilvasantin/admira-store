import test from 'node:test';
import assert from 'node:assert/strict';
import {createCustomerMotion} from './customer-motion.mjs';
import {buildCustomerNavigation} from './customer-navigation.mjs';

const scene={cols:14,rows:8,layout:[{id:'island',type:'counter',col:5,row:2,fp:[2,3],sx:1,sy:1,rot:0}]};
const actor={id:'visitor-1',kind:'customer',col:3,row:3,heading:Math.PI/2,walking:false};
test('customer pursuit goes around furniture and every displayed segment keeps body clearance',()=>{
  const nav=buildCustomerNavigation(scene),motion=createCustomerMotion(actor,{navigation:nav});
  const next={...actor,col:9,walking:true},before=JSON.stringify(next);motion.update(next,{navigation:nav,time:100});
  let previous=motion.pose,detoured=false;
  for(let now=116;now<10000;now+=16){
    const p=motion.advance(now);assert.ok(nav.isWalkable(p));assert.ok(nav.segmentClear(previous,p));
    if(p.row<1.8||p.row>5.2)detoured=true;previous=p;
  }
  assert.ok(detoured);assert.ok(Math.hypot(previous.col-9,previous.row-3)<.01);assert.equal(JSON.stringify(next),before);
});
test('closed passage stops pursuit instead of teleporting through the obstacle',()=>{
  const nav=buildCustomerNavigation({cols:8,rows:6,layout:[{id:'wall',type:'shelves',col:3,row:0,fp:[1,6]}]});
  const motion=createCustomerMotion({...actor,col:1,row:2},{navigation:nav});
  motion.update({...actor,col:6,row:2,walking:true},{navigation:nav,time:100});
  for(let time=116;time<2500;time+=16){const p=motion.advance(time);assert.equal(p.col,1);assert.equal(p.walking,false);assert.equal(p.blocked,true);}
});
test('gait phase advances with travelled distance and stays still during a pause',()=>{
  const nav=buildCustomerNavigation({cols:14,rows:8,layout:[]}),motion=createCustomerMotion(actor,{navigation:nav});
  const initial=motion.pose.phase;motion.update({...actor,col:4,walking:true},{navigation:nav,time:100});
  let distance=0;
  for(let time=116;time<2000;time+=16)distance+=motion.advance(time).distance;
  const stopped=motion.pose;assert.ok(Math.abs(distance-1)<.001);assert.ok(Math.abs(stopped.phase-(initial+distance/.78)%1)<.00001);
  for(let time=2016;time<3000;time+=16){const p=motion.advance(time);assert.equal(p.walking,false);assert.equal(p.phase,stopped.phase);}
});
test('turning is bounded and a long frame cannot run through several metres',()=>{
  const nav=buildCustomerNavigation({cols:14,rows:8,layout:[]}),motion=createCustomerMotion({...actor,heading:-Math.PI/2},{navigation:nav});
  motion.update({...actor,col:11,walking:true},{navigation:nav,time:100});
  const first=motion.advance(116);assert.ok(first.distance<.2);assert.ok(Math.abs(first.heading+Math.PI/2)<=4.6*.12+.001);
  const resumed=motion.advance(10000);assert.ok(resumed.distance<.4);
});
test('resuming a hidden view rebases the clock without replaying missing movement',()=>{
  const nav=buildCustomerNavigation({cols:14,rows:8,layout:[]}),motion=createCustomerMotion(actor,{navigation:nav});
  motion.update({...actor,col:10,walking:true},{navigation:nav,time:100});motion.advance(116);
  const before=motion.pose;motion.rebaseTime(60116);
  assert.equal(motion.pose.col,before.col);assert.equal(motion.pose.phase,before.phase);
  const resumed=motion.advance(60132);assert.ok(resumed.distance<.05);assert.ok(resumed.col>=before.col);
});
test('inventory changes recover a covered visitor once and never keep a stale route',()=>{
  const clear=buildCustomerNavigation({cols:14,rows:8,layout:[]});
  const motion=createCustomerMotion({...actor,col:5.5,row:3},{navigation:clear});
  const occupied=buildCustomerNavigation(scene);
  const p=motion.update({...actor,col:9,walking:true},{navigation:occupied,time:100});
  assert.ok(p.relocated);assert.ok(occupied.isWalkable(p));
  let previous=p;
  for(let time=116;time<2000;time+=16){const next=motion.advance(time);assert.ok(occupied.segmentClear(previous,next));previous=next;}
});
