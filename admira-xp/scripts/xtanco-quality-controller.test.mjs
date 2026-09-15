import test from 'node:test';
import assert from 'node:assert/strict';
import {createQualityController} from './xtanco-quality-controller.mjs';
function fixture(options={}){
 const calls=[],ctx={setTransform(){},clearRect(){calls.push('clear-ops');}},world={width:800,height:500},operations={width:800,height:500,getContext:()=>ctx};
 const raw={active:true,iso:{cols:14,rows:8,tileW:80,tileH:28,ox:270,oy:185,wallH:165},projection:{width:800,height:500,tileW:80,tileH:28,ox:270,oy:185},layout:[],game:{custIn:12}};
 const renderer={resize(){calls.push('resize');},update(s){calls.push('update');assert.deepEqual(s.projection,raw.projection);assert.equal(s.entries,12);},render(){calls.push('render');},setMode(m){calls.push(m);},dispose(){calls.push('dispose');}};
 const controller=createQualityController({worldCanvas:world,operationsCanvas:operations,getState:()=>raw,loadRenderer:async()=>({createPremiumRenderer:o=>{assert.equal(o.integrated,true);assert.equal(o.controls,false);return renderer;}}),now:()=>100,...options});
 const context={save(){calls.push('save');},restore(){calls.push('restore');},setTransform(){},drawImage(image){calls.push(image===world?'world':'operations');}};
 return {controller,calls,ctx,raw,world,operations,renderer,context};
}
test('mode changes compose in the same coordinates without mutating the shop or creating input controls',async()=>{
 const f=fixture(),before=JSON.stringify(f.raw);assert.equal(f.controller.begin(f.context,f.world),false);
 await f.controller.choose('best');assert.equal(f.controller.begin(f.context,f.world),true);assert.equal(f.controller.operationContext(),f.ctx);
 f.controller.paint(f.context,100,()=>f.calls.push('screen-holes'));
 assert.deepEqual(f.calls.slice(-5),['save','world','screen-holes','operations','restore']);assert.equal(f.controller.operationContext(),null);
 await f.controller.choose('better');assert.equal(f.controller.begin(f.context,f.world),true);f.controller.paint(f.context,100);
 assert.equal(JSON.stringify(f.raw),before);assert.ok(f.calls.includes('better'));
 await f.controller.choose('good');assert.equal(f.controller.begin(f.context,f.world),false);
});
test('late GPU import cannot revive a quality mode the user has left',async()=>{
 let finish;const f=fixture({loadRenderer:()=>new Promise(resolve=>finish=resolve)});
 const loading=f.controller.choose('best');await f.controller.choose('good');
 finish({createPremiumRenderer:()=>{throw Error('must not create renderer');}});await loading;
 assert.equal(f.controller.mode,'good');assert.equal(f.controller.begin(f.context,f.world),false);
});
test('renderer failure returns to Good before moving any operational draw to the overlay',async()=>{
 const errors=[],f=fixture({onError:error=>errors.push(error.message)});await f.controller.choose('best');
 f.renderer.render=()=>{throw Error('GPU unavailable');};assert.equal(f.controller.begin(f.context,f.world),false);
 assert.equal(f.controller.operationContext(),null);assert.equal(f.controller.mode,'good');assert.deepEqual(errors,['GPU unavailable']);
});
test('a presentation failure still draws the already-computed operational layer exactly once',async()=>{
 const f=fixture();await f.controller.choose('best');f.controller.begin(f.context,f.world);
 f.context.drawImage=image=>{if(image===f.world)throw Error('present failed');f.calls.push('operations');};
 f.controller.paint(f.context,100);assert.equal(f.calls.filter(x=>x==='operations').length,1);assert.equal(f.controller.mode,'good');assert.equal(f.calls.at(-1),'restore');
});
test('page restoration reinitializes GPU resources without changing selected quality or the live session',async()=>{
 const f=fixture();await f.controller.choose('better');f.controller.begin(f.context,f.world);f.controller.suspend();
 assert.equal(f.controller.begin(f.context,f.world),false);assert.ok(f.calls.includes('dispose'));
 await f.controller.resume();assert.equal(f.controller.begin(f.context,f.world),true);assert.equal(f.controller.mode,'better');
});
