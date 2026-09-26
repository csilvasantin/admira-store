import test from 'node:test';
import assert from 'node:assert/strict';
import {DoohHistoryState,selectDoohPeriod,madridDay,madridHour,renderDoohHistory} from './dooh-history.mjs';
const now=Date.parse('2026-10-25T12:00:00Z'),hour=3600000;
const row=(at,kind='person',total=1,source='detector')=>({hour:Date.parse(at),kind,total,source});
const packet=(rows=[])=>({schema:'admira.dooh-history.v1',site:'admira-xperience-santa-rosa-19',source:'puerta-cam',timezone:'Europe/Madrid',loaded:true,busy:false,error:null,updatedAt:now,from:now-31*24*hour,to:now+60000,pending:0,lost:0,expired:0,rows});
test('real periods use Madrid date and [start,end); manual observations never inflate detector counts',()=>{
 const value=packet([row('2026-10-24T21:00:00Z','person',10),row('2026-10-24T22:00:00Z','person',3),row('2026-10-24T23:00:00Z','car',2),row('2026-10-25T00:00:00Z','person',5),row('2026-10-25T00:00:00Z','scooter',4,'manual'),row('2026-10-25T00:00:00Z','person',9,'manual')]);
 const result=selectDoohPeriod(value,{day:'2026-10-25',start:0,end:2});
 assert.equal(result.counts.person,3);assert.equal(result.counts.car,2);assert.equal(result.manual,0);
 const all=selectDoohPeriod(value,{day:'2026-10-25'});assert.equal(all.counts.person,8);assert.equal(all.manual,13);
 assert.equal(selectDoohPeriod(value,{day:'2026-10-25',start:8,end:8}),null);
 assert.equal(selectDoohPeriod(value,{day:'2026-10-20'}).hasRecords,false);
 assert.equal(selectDoohPeriod(null,{day:'2026-10-25'}),null);
});
test('DST repeats retain both UTC buckets without double counting and spring gaps stay empty',()=>{
 const value=packet([row('2026-10-25T00:00:00Z','person',3),row('2026-10-25T01:00:00Z','person',4),row('2026-10-25T02:00:00Z','person',8)]);
 const selected=selectDoohPeriod(value,{day:'2026-10-25',start:2,end:3});
 assert.equal(selected.counts.person,7);assert.equal(selected.hours.length,2);
 assert.equal(madridDay(Date.parse('2026-10-24T22:00:00Z')),'2026-10-25');
 assert.equal(madridHour(Date.parse('2026-03-29T01:00:00Z')),3);
 assert.equal(selectDoohPeriod(packet([row('2026-03-29T00:00:00Z'),row('2026-03-29T01:00:00Z')]),{day:'2026-03-29',start:2,end:3}).hasRecords,false);
});
test('history validation rejects foreign sources, fabricated classifications, duplicate buckets and impossible times',()=>{
 const state=new DoohHistoryState({now:()=>now}),good=packet([row('2026-10-25T01:00:00Z')]);
 assert.equal(state.update(good),true);good.rows[0].total=999;assert.equal(state.read().rows[0].total,1);
 const invalid=[{rows:[null]},{site:'other'},{source:'simulation'},{updatedAt:now+120000},{from:0},{rows:[row('2026-10-25T01:00:00Z'),row('2026-10-25T01:00:00Z')]},{rows:[row('2026-10-25T01:00:00Z','scooter')]},{rows:[row('2026-10-25T01:01:00Z')]},{rows:[row('2026-10-25T01:00:00Z','person',-1)]},{rows:[row('2026-10-25T01:00:00Z','person',3,'virtual')]},{error:'access'}];
 for(const patch of invalid)assert.equal(state.update({...packet(),...patch}),false,JSON.stringify(patch));
 assert.equal(state.update({...packet(),loaded:false,error:'access',updatedAt:null,from:null,to:null}),true);assert.deepEqual(state.read().rows,[]);
 state.clear();assert.equal(state.read(),null);
});
// DOM fixture executes the actual renderer and its user event handlers.
function dom(){
 class Node{constructor(){this.listeners={};this.children=[];this.value='';this.textContent='';}addEventListener(t,fn){this.listeners[t]=fn;}replaceChildren(){this.children=[];}append(v){this.children.push(v);}}
 const nodes=new Map();let writes=0;
 const root={ownerDocument:{createElement:()=>new Node()},set innerHTML(value){writes++;for(const selector of ['day','start','end'])nodes.set(`[data-filter="${selector}"]`,new Node());nodes.get('[data-filter="start"]').value='0';nodes.get('[data-filter="end"]').value='24';for(const name of ['refresh','history-status','period-total','history-rows'])nodes.set(`[data-${name}]`,new Node());},querySelector:s=>nodes.get(s)};
 return {root,get:s=>nodes.get(s),writes:()=>writes};
}
test('filters survive live refresh, show confirmed values and clear on disconnect or authorization loss',()=>{
 const d=dom();let value=packet([row('2026-10-25T01:00:00Z','person',7)]),requests=0,at=now;
 const options={getSnapshot:()=>value,request:()=>requests++,now:()=>at};
 renderDoohHistory(d.root,options);assert.equal(requests,1);assert.match(d.get('[data-period-total]').textContent,/Personas: 7/);
 d.get('[data-filter="start"]').value='2';d.get('[data-filter="end"]').value='3';d.get('[data-filter="start"]').listeners.change();
 renderDoohHistory(d.root,options);assert.equal(d.writes(),1);assert.equal(d.get('[data-filter="start"]').value,'2');
 assert.match(d.get('[data-history-rows]').children[0].children[0].textContent,/02:00 · 01:00 UTC/);
 at+=30000;renderDoohHistory(d.root,options);assert.equal(requests,2);
 value=null;renderDoohHistory(d.root,options);assert.match(d.get('[data-period-total]').textContent,/Sin registros/);assert.equal(d.get('[data-history-rows]').children.length,0);
 value={...packet(),loaded:false,rows:[],error:'access',updatedAt:null};renderDoohHistory(d.root,options);assert.match(d.get('[data-history-status]').textContent,/requiere acceso/);
});
