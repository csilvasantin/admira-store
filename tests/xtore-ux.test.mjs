import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRetailRulebook,createRetailRulePlayer,defaultRetailRule} from '../admira-xp/scripts/retail-rules.mjs';
const {create,KEY}=createRequire(import.meta.url)('../assets/day-summary.js');
const storage=()=>{const d=new Map();return {getItem:k=>d.get(k)??null,setItem:(k,v)=>d.set(k,v)};};
test('day summary defaults OFF, changes locally in both languages, persists, and disabling dismisses an open day',()=>{
 const s=storage();let closed=0;const p=create({storage:s,onDisable:()=>closed++});assert.equal(p.enabled(),false);assert.equal(p.handle('/anything'),null);assert.equal(p.handle('/resumen dia on').local,true);assert.equal(create({storage:s}).enabled(),true);assert.equal(p.handle('/summary day off').ok,true);assert.equal(closed,1);assert.equal(s.getItem(KEY),'off');assert.equal(p.handle('/resumen dia typo').ok,false);assert.equal(p.enabled(),false);
});
test('automatic daily close saves its history and advances without constructing a modal when OFF',()=>{
 const html=readFileSync(new URL('../admira-xp/index.html',import.meta.url),'utf8'),fn=html.slice(html.indexOf('function endDaySequence(){'),html.indexOf('// ── RANDOM EVENTS',html.indexOf('function endDaySequence(){')));
 let saves=0;const context={G:{custs:[1],passersby:[1],dayOffset:0,weekRevenue:100,weekExpenses:30},lang:'es',CFG:{WEEK_TICKS:999},window:{XpaceDaySummary:{enabled:()=>false}},document:{getElementById:()=>null,createElement:()=>{throw Error('modal interrupted');}},gameDateKey:()=> '2026-10-07',fetch:()=>{saves++;return Promise.resolve();},Date,clearInterval};vm.createContext(context);vm.runInContext(fn,context);vm.runInContext('endDaySequence()',context);assert.equal(saves,1);assert.equal(context.G.dayOffset,1);assert.equal(context.G.weekTimer,999);assert.equal(context.G.dayResultsOpen,false);
});
const assets=[{id:'voice',type:'locucion',title:'Voice',url:'https://stock.admira.store/stock/voice/asset.mp3'},{id:'video',type:'video',title:'Video',url:'https://stock.admira.store/stock/video/asset.mp4'}];
const audio=()=>{let ended;return {muted:true,src:'',pause(){},load(){},removeAttribute(){},remove(){},addEventListener(n,f){if(n==='ended')ended=f;},removeEventListener(){},end:()=>ended(),async play(){}};};
test('nested DO plays voice and one video on N screens once, keeps video silent, and restores all channels on stop',async()=>{
 const s=storage(),book=createRetailRulebook({storage:s,fetcher:async()=>Response.json({items:assets})});await book.refresh();const r=defaultRetailRule();r.do=[{id:'playVoice',value:'voice'},{id:'playVideo',value:'video',screens:['starbucks-wall-01','starbucks-tpv-01']}];book.save([r]);assert.equal(createRetailRulebook({storage:s}).state().rules[0].do.length,2);
 let ducks=0,releases=0;const calls=[],nodes=[];const p=createRetailRulePlayer({book,audio:audio(),audioFactory:audio,music:{suppress(){ducks++;return ()=>releases++;}},visualFactory:(id,{muted})=>{const node={subscribe:()=>()=>{},prepare(){},play:async()=>calls.push({id,muted}),dispose(){nodes.push(id);}};return node;}});p.prepare();await p.fire('muffinPicked');await p.fire('muffinPicked');assert.deepEqual(calls,[{id:'starbucks-wall-01',muted:true},{id:'starbucks-tpv-01',muted:true}]);assert.equal(p.state().actions.length,3);assert.equal(p.state().playing,true);assert.equal(ducks,1);p.stop();assert.equal(p.state().playing,false);assert.equal(releases,1);assert.deepEqual(nodes.sort(),['starbucks-tpv-01','starbucks-wall-01']);
 assert.throws(()=>book.save([{...r,do:[{id:'playVideo',value:'video',screens:[]}]}]));assert.throws(()=>book.save([{...r,do:[{id:'playVideo',value:'video',screens:['unknown-screen']}]}]));
});
test('overlapping screen destinations use the final visual DO; missing content keeps valid reactions playable',async()=>{
 const book=createRetailRulebook({storage:storage(),fetcher:async()=>Response.json({items:assets})});await book.refresh();const r=defaultRetailRule();r.do=[{id:'playVideo',value:'video',screens:['starbucks-wall-01']},{id:'playVideo',value:'video',screens:['starbucks-wall-01','starbucks-wall-02']},{id:'playVoice',value:'missing'}];book.save([r]);const ids=[];const p=createRetailRulePlayer({book,audio:audio(),music:{suppress:()=>()=>{}},visualFactory:(id,{muted})=>({prepare(){ids.push({id,muted});},play:async()=>{},dispose(){}})});p.prepare();assert.deepEqual(ids,[{id:'starbucks-wall-01',muted:false},{id:'starbucks-wall-02',muted:true}]);p.dispose();
});
test('binary button reflects confirmed state after clicks and outside CLI changes, with one command per click',async()=>{
 const code=readFileSync(new URL('../assets/expert-toggle.js',import.meta.url),'utf8');let tick,on=false;const root={setInterval:f=>(tick=f,1),clearInterval(){},addEventListener(){}};vm.runInNewContext(code,{window:root});const handlers={};const b={classList:{add(){}},dataset:{},setAttribute(k,v){this[k]=v;},addEventListener(n,f){handlers[n]=f;}};const requested=[];root.XpaceToggle.mount(b,{label:()=> 'Avatar',state:()=>on,run:async next=>{requested.push(next);on=next;}});assert.equal(b['aria-pressed'],'false');await handlers.click();assert.equal(b.dataset.state,'on');assert.equal(b.textContent,'Avatar · ON');await handlers.click();assert.deepEqual(requested,[true,false]);on=true;tick();assert.equal(b['aria-pressed'],'true');
});
