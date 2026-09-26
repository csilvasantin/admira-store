import test from 'node:test';
import assert from 'node:assert/strict';
import {drawAnonymous,drawStatistics,drawStreet} from './xtore-demo.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=()=>{const calls=[];return {calls,save(){},restore(){},fillRect(...v){calls.push(['fill',...v]);},strokeRect(...v){calls.push(['box',...v]);},fillText(...v){calls.push(['text',...v]);},drawImage(...v){calls.push(['image',...v]);}};};
test('anonymous view is geometry-only for every category even if raw imagery exists',()=>{
 const c=context(),tracks=['person','car','motorcycle','bicycle','scooter'].map(kind=>({kind,box:[.1,.2,.3,.4]}));
 drawAnonymous(c,160,90,{status:'live',tracks,bitmap:{secret:'raw'}});
 assert.equal(c.calls.filter(x=>x[0]==='box').length,5);assert.equal(c.calls.some(x=>x[0]==='image'),false);
 assert.ok(c.calls.some(x=>x[1]==='Persona'));assert.ok(c.calls.some(x=>x[1]==='Bici'));
});
test('missing or stale traffic clears surface and shows no old boxes; empty live stream is distinct',()=>{
 for(const status of ['waiting','stale','disconnected']){const c=context();drawAnonymous(c,160,90,{status,tracks:[{kind:'person',box:[0,0,.5,.5]}]});assert.equal(c.calls[0][0],'fill');assert.equal(c.calls.some(x=>x[0]==='box'),false);}
 const c=context();drawAnonymous(c,160,90,{status:'live',tracks:[]});assert.ok(c.calls.some(x=>x[1]==='Sin objetos detectados'));
});
test('street draws only fresh camera frames while statistics never invent missing values',()=>{
 const c=context(),src={width:480,height:320};drawStreet(c,160,90,src,false);assert.equal(c.calls.some(x=>x[0]==='image'),false);drawStreet(c,160,90,src,true);assert.ok(c.calls.some(x=>x[0]==='image'));
 const s=context();drawStatistics(s,160,90,null);assert.ok(s.calls.some(x=>x[1]==='Esperando analizador'));
});
test('real corner-camera click toggles the demo instead of simulated CPM',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const start=html.indexOf("  if(id==='camCPMClick'){");const end=html.indexOf("  if(id==='specialClick_thief'",start);
 let calls=0;const context={id:'camCPMClick',window:{__xtoreWindowPlayer:{toggleDemo:()=>{calls++;return true;}}},showEv(){},G:{tftCPM:false}};
 vm.runInNewContext('(function(){'+html.slice(start,end)+'})()',context);assert.equal(calls,1);assert.equal(context.G.tftCPM,false);
});
