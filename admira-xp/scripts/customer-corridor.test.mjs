import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCustomerNavigation} from './customer-navigation.mjs';

function corridor(left=3.3,width=.6){
  return {cols:8,rows:8,layout:[
    {id:'left',type:'custom',col:0,row:2,fp:[left,3]},
    {id:'right',type:'custom',col:left+width,row:2,fp:[8-left-width,3]}
  ]};
}
function assertSafe(nav,start,end){
  const path=nav.route(start,end);
  assert.ok(path,'an open passage needs a route');
  let previous=start;
  for(const waypoint of path){
    assert.ok(nav.isWalkable(waypoint));
    assert.ok(nav.segmentClear(previous,waypoint),JSON.stringify([previous,waypoint]));
    previous=waypoint;
  }
  assert.deepEqual(previous,end);
  return path;
}

test('a 0.6-tile off-grid passage remains reachable when both ends require a turn',()=>{
  const nav=buildCustomerNavigation(corridor());
  const start={col:1,row:1},end={col:6,row:6};
  assert.equal(nav.segmentClear(start,end),false);
  const path=assertSafe(nav,start,end);
  assert.ok(path.length>1);
  assertSafe(nav,end,start);
});

test('fractional furniture positions do not close valid narrow passages',()=>{
  for(const left of [2.93,3.07,3.3,3.47])for(const width of [.5,.6,.79]){
    const nav=buildCustomerNavigation(corridor(left,width));
    assertSafe(nav,{col:1,row:1},{col:6,row:6});
  }
});

test('the same graph still rejects gaps narrower than the full customer body',()=>{
  const nav=buildCustomerNavigation(corridor(3.3,.47));
  assert.equal(nav.route({col:1,row:1},{col:6,row:6}),null);
});

test('cached visibility connects different endpoints without retaining a previous destination',()=>{
  const nav=buildCustomerNavigation(corridor());
  for(let i=0;i<30;i++){
    const start={col:1+(i%5)*.2,row:1+(i%3)*.1};
    const end={col:6-(i%4)*.2,row:6+(i%2)*.15};
    assertSafe(nav,start,end);
  }
});

test('door boundary checks reject tiny corner cuts and route through the opening',()=>{
  const nav=buildCustomerNavigation({cols:14,rows:8,layout:[]},{allowOutside:true});
  const edge=14-.24,low=3.35-1.15+.24;
  const start={col:edge-.01,row:low-.000001},end={col:edge+.01,row:low+.0000005};
  assert.ok(nav.isWalkable(start));assert.ok(nav.isWalkable(end));
  assert.equal(nav.segmentClear(start,end),false);
  assertSafe(nav,start,end);
});

test('visibility along overlapping solids follows their union without crossing corners',()=>{
  const nav=buildCustomerNavigation({cols:12,rows:9,layout:[
    {id:'a',type:'custom',col:3,row:2,fp:[3,3]},
    {id:'b',type:'custom',col:5,row:4,fp:[3,3]},
    {id:'c',type:'custom',col:6,row:1,fp:[2,2]}
  ]});
  assertSafe(nav,{col:1,row:4},{col:10,row:5});
});
