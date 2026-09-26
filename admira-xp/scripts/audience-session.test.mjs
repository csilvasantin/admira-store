import test from 'node:test';
import assert from 'node:assert/strict';
import {AudienceSessionState,sessionStoreTarget,validAudience} from './audience-session.mjs';
const sample=(changes={})=>({schema:'admira.audience-session.v1',sessionId:'00000000-0000-0000-0000-000000000001',site:'admira-xperience-santa-rosa-19',source:'puerta-cam',screen:'xtore-virtual-zapatillas',metric:'cumulative-passages',startedAt:100,updatedAt:200,revision:1,state:'analyzing',counts:{person:9,car:1,motorcycle:0,bicycle:2,scooter:0},directions:{enter:4,exit:3,unknown:2},directionAxis:[[.5,0],[.5,1]],directionMeaning:{enter:'toward-camera',exit:'toward-street-end'},...changes});
test('real target uses session passages, never entry minus exit; rendering cap keeps exact total',()=>{
 assert.deepEqual(sessionStoreTarget(sample()),{total:9,rendered:9,overflow:0});
 const a=sample();a.counts.person=99;a.directions.unknown=92;assert.deepEqual(sessionStoreTarget(a),{total:99,rendered:80,overflow:19});
});
test('snapshot heartbeat does not inflate totals and expires after four seconds',()=>{
 let now=1000;const s=new AudienceSessionState(()=>now);assert.ok(s.update(sample(),now));assert.ok(s.update(sample(),now+1));assert.equal(s.read().counts.person,9);now=5001;assert.equal(s.read(),null);
});
test('regressions, conflicting revisions and malformed directions are rejected',()=>{
 const s=new AudienceSessionState(()=>1000);s.update(sample(),1000);
 assert.equal(s.update(sample({revision:0}),1001),false);
 const a=sample();a.counts.person=8;a.directions.unknown=1;assert.equal(s.update(a,1001),false);
 a.counts.person=10;a.directions.unknown=3;assert.equal(s.update(a,1001),false);
 a.revision=2;assert.equal(s.update(a,1001),true);
 assert.equal(validAudience(sample({directions:{enter:8,exit:8,unknown:0}})),false);
});
test('a new session explicitly replaces totals, stale or future packets cannot replace it',()=>{
 let now=1000;const s=new AudienceSessionState(()=>now);s.update(sample(),1000);
 const reset=sample({sessionId:'00000000-0000-0000-0000-000000000002',counts:{person:0,car:0,motorcycle:0,bicycle:0,scooter:0},directions:{enter:0,exit:0,unknown:0},revision:0});
 assert.ok(s.update(reset,1001));assert.equal(s.read().counts.person,0);assert.equal(s.update(sample(),999),false);assert.equal(s.update(sample(),5000),false);
});

test('actual game Real adapter drives session target independently of physical occupancy',async()=>{
 const {readFileSync}=await import('node:fs'),vm=await import('node:vm');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const body=html.slice(html.indexOf('function camApplyToStore(){'),html.indexOf('// EXACTO: en CADA sondeo'));
 let audience=sample(),linked=true;const applied=[];
 const context={manualAudienceTarget:()=>null,CAM:{mode:'real',connected:false,occupancy:700},xtoreSessionMode:()=>linked,xtoreSessionAudience:()=>audience,state:1,S:{GAME:1},G:{custs:[]},MAX_PEOPLE_OVERRIDE:80,camForceExact:n=>applied.push(n)};
 vm.runInNewContext(body,context);context.camApplyToStore();assert.equal(applied.at(-1),9);
 audience={...sample(),counts:{...sample().counts,person:99}};context.camApplyToStore();assert.equal(applied.at(-1),80);
 audience=null;context.camApplyToStore();assert.equal(applied.at(-1),0);
 linked=false;context.camApplyToStore();assert.equal(applied.length,3);
});

test('HUD shows all session categories from one snapshot and clears all on signal loss',async()=>{
 const {readFileSync}=await import('node:fs'),vm=await import('node:vm');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const body=html.slice(html.indexOf('function updateCamHud(){'),html.indexOf('function camApplyToStore(){'));
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',style:{},classList:{toggle(){}},hidden:false});return nodes.get(id);};
 let linked=true,a=sample();a.counts={person:36,car:5,motorcycle:2,bicycle:6,scooter:0};
 const context={document:{getElementById:node},xtoreSessionMode:()=>linked,xtoreSessionAudience:()=>a,CAM:{connected:true,occupancy:999,mode:'real'},MAX_PEOPLE_OVERRIDE:80,lang:'es'};
 vm.runInNewContext(body,context);context.updateCamHud();
 assert.deepEqual(['bbCamVal','bbCarVal','bbMotoVal','bbBikeVal'].map(id=>node(id).textContent),[36,5,2,6]);
 assert.match(node('bbCamLabel').textContent,/Pasos de sesión/);assert.equal(node('bbCarMetric').hidden,false);
 a=null;context.updateCamHud();assert.deepEqual(['bbCamVal','bbCarVal','bbMotoVal','bbBikeVal'].map(id=>node(id).textContent),['—','—','—','—']);
 linked=false;context.updateCamHud();assert.equal(node('bbCamVal').textContent,999);assert.equal(node('bbCarMetric').hidden,true);assert.equal(node('bbPersonLabel').hidden,true);
 linked=true;context.lang='en';context.updateCamHud();assert.match(node('bbCamLabel').textContent,/Session passages/);assert.equal(node('bbCarLabel').textContent,'Cars');
});
