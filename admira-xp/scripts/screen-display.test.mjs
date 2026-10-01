import test from 'node:test';
import assert from 'node:assert/strict';
import {screenSlice,screenNumber,screenGroup,parseScreenLayoutCommand,setScreenNumbersVisible,getScreenNumbersVisible,SCREEN_DISPLAY_MODES,parseScreenDisplayCommand,subscribeScreenDisplay,setScreenDisplayMode,getScreenDisplayMode,SCREEN_DISPLAY_KEY} from './screen-display.mjs';
import {STARBUCKS_SCREEN_PLAYLIST} from './starbucks-screens.mjs';
test('group slices tile each canvas once without gaps, duplication or saved-map order dependency',()=>{
 for(const [mode,groups] of Object.entries(SCREEN_DISPLAY_MODES))for(const group of groups){
  const slices=group.map(n=>screenSlice('starbucks-wall-0'+(7-n),mode));
  assert.deepEqual(slices.map(s=>s.width),group.map(()=>100*group.length));
  assert.deepEqual(slices.map(s=>s.left),group.map((_,i)=>-100*(group.length-1-i)));
  assert.ok(slices.every(s=>s.fit===(group.length===1?'contain':'cover')));
 }
 assert.equal(screenSlice('custom-screen','total'),null);assert.equal(screenNumber('__proto__'),null);assert.equal(screenNumber('constructor'),null);
 assert.deepEqual(STARBUCKS_SCREEN_PLAYLIST.display.groups,SCREEN_DISPLAY_MODES.groups);
 assert.deepEqual(SCREEN_DISPLAY_MODES.groups,[[1,2,3],[4],[5,6]]);
});
test('English and Spanish commands reject extra tokens without falling through to remote bots',()=>{
 for(const cmd of ['/SINCRO@AdmiraXPBot','/sync ON'])assert.equal(parseScreenDisplayCommand(cmd).mode,'groups');
 for(const cmd of ['/sincrototal','/synctotal','/sync all'])assert.equal(parseScreenDisplayCommand(cmd).mode,'total');
 assert.equal(parseScreenDisplayCommand('/sincro off').mode,'individual');
 assert.equal(parseScreenDisplayCommand('/sincrototal off').invalid,true);
 assert.equal(parseScreenDisplayCommand('/sync off extra').invalid,true);
 assert.equal(parseScreenDisplayCommand('/syncing'),null);
 assert.equal(parseScreenDisplayCommand('/sync on\n/grok text').invalid,true);
});
test('layout changes persist, notify live views and dispose listeners; denied storage remains usable',()=>{
 const saved=new Map(),seen=[];globalThis.localStorage={setItem:(k,v)=>saved.set(k,v),getItem:k=>saved.get(k)};
 const unsub=subscribeScreenDisplay(mode=>seen.push(mode));
 setScreenDisplayMode('groups');assert.equal(saved.get(SCREEN_DISPLAY_KEY),'groups');assert.equal(getScreenDisplayMode(),'groups');
 unsub();setScreenDisplayMode('total');assert.deepEqual(seen,['groups']);
 globalThis.localStorage={setItem(){throw Error('denied')}};
 assert.doesNotThrow(()=>setScreenDisplayMode('individual'));assert.equal(getScreenDisplayMode(),'individual');
 assert.throws(()=>setScreenDisplayMode('typo'));delete globalThis.localStorage;
});

test('entrance numbering fixes physical triplet and pair without changing saved anchor IDs',()=>{
 const ids=Array.from({length:6},(_,i)=>'starbucks-wall-0'+(i+1));
 assert.deepEqual(ids.map(screenNumber),[6,5,4,3,2,1]);
 assert.deepEqual(ids.map(id=>screenGroup(screenNumber(id))),[2,2,0,1,1,1]);
 assert.deepEqual(ids.map(id=>screenSlice(id,'groups').width),[200,200,100,300,300,300]);
 assert.deepEqual(ids.map(id=>screenSlice(id,'groups').left),[-0,-100,-0,-0,-100,-200]);
 assert.deepEqual(ids.map(id=>screenSlice(id,'total').left),[-0,-100,-200,-300,-400,-500]);
});
test('layout aliases toggle labels and preserve explicit legacy furniture subcommands',()=>{
 assert.deepEqual(parseScreenLayoutCommand('/LAYOUT'),{visible:null});
 assert.deepEqual(parseScreenLayoutCommand('/layoiut on'),{visible:true});
 assert.deepEqual(parseScreenLayoutCommand('/layout off'),{visible:false});
 for(const cmd of ['/layout save','/layout factory','/layout xpacio load','/layout xml loc save'])assert.deepEqual(parseScreenLayoutCommand(cmd),{legacy:true});
 for(const cmd of ['/layout typo','/layoiut save','/layout on\n/grok text'])assert.deepEqual(parseScreenLayoutCommand(cmd),{invalid:true});
 setScreenNumbersVisible(false);setScreenNumbersVisible(null);assert.equal(getScreenNumbersVisible(),true);setScreenNumbersVisible(null);assert.equal(getScreenNumbersVisible(),false);
});
