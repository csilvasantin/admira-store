import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrateReferenceLayout,referenceStorage,LAYOUT_REVISION} from './layout-reference.mjs';

const screen={id:'screen',col:.09,row:4.25,rot:0,sx:1,sy:1,hidden:true,locked:true};
const rear={id:'rack-rear-right',col:.04,row:10.2,rot:0,sx:1,sy:1};
test('existing browser defaults move LCD to left wall with visibility and records intact',()=>{
  const saved={version:1,layout:[screen],records:{screen:{nombre:'Mi LCD'}},ledger:{removed:{},added:{screen},undo:null}};
  const next=migrateReferenceLayout(saved,[rear]);
  assert.equal(next.layout[0].col,3.77);assert.equal(next.layout[0].row,6.45);
  assert.equal(next.layout[0].hidden,true);assert.equal(next.layout[0].locked,true);
  assert.deepEqual(next.records,saved.records);assert.equal(next.ledger.added.screen.col,3.77);
  assert.equal(next.layout[1].id,rear.id);assert.equal(saved.layout[0].col,.09);
});
test('explicit user moves and deletions survive reference correction',()=>{
  const saved={version:1,layout:[{...screen,col:.4}],ledger:{removed:{[rear.id]:rear},added:{}}};
  const next=migrateReferenceLayout(saved,[rear]);
  assert.equal(next.layout[0].col,.4);assert.equal(next.layout.length,1);
  assert.deepEqual(next.ledger.removed,saved.ledger.removed);
});
test('original layout is backed up once and migration does not repeat after editing',()=>{
  const map=new Map([['room:real-store-v2',JSON.stringify({version:1,layout:[screen]})]]);
  const store={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
  const storage=referenceStorage(store,[rear]),original=map.get('room:real-store-v2');
  const corrected=JSON.parse(storage.getItem('room'));
  assert.equal(corrected.layoutRevision,LAYOUT_REVISION);assert.equal(corrected.layout[0].col,3.77);
  assert.equal(map.get('room:real-store-v2:before-orientation-v3'),original);
  corrected.layout[0].col=.09;storage.setItem('room',JSON.stringify(corrected));
  assert.equal(JSON.parse(storage.getItem('room')).layout[0].col,.09);
  assert.equal(map.get('room:real-store-v2:before-orientation-v3'),original);
});
test('malformed saved data is left untouched for bridge recovery',()=>{
  const map=new Map([['room:real-store-v2','invalid']]);
  const storage=referenceStorage({getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v)},[]);
  assert.equal(storage.getItem('room'),'invalid');assert.equal(map.size,1);
});

test('v3 migration separates Jordan and LCD without reverting deliberate placements',()=>{
  const saved={version:1,layoutRevision:'door-to-rear-v3',layout:[{...screen,col:3.77},{id:'rack-1',col:3.46,row:8.1,rot:0,sx:1,sy:1}]};
  const next=migrateReferenceLayout(saved,[]);
  assert.equal(next.layout[0].row,6.45);assert.equal(next.layout[1].row,10.05);
  const edited=migrateReferenceLayout({...saved,layout:[{...screen,col:3.77,row:5.5}]},[]);
  assert.equal(edited.layout[0].row,5.5);
});
