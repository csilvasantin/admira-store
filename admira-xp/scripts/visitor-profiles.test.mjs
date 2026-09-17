import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VISITOR_PROFILES,visitorProfileById,visitorCategory,createVisitorRoster,visitorProfilesForGame} from './visitor-profiles.mjs';
import {createLifeSnapshot} from './life-snapshot.mjs';
const visitor=(id,gender='m',age='adult')=>({id,look:{gender,age}});

test('24 immutable fictional profiles have distinct IDs, valid appearances and isolated real image crops',async()=>{
  assert.equal(VISITOR_PROFILES.length,24);assert.equal(new Set(VISITOR_PROFILES.map(p=>p.id)).size,24);
  assert.deepEqual(VISITOR_PROFILES.reduce((sum,p)=>(sum[p.age]=(sum[p.age]||0)+1,sum),{}),{adult:16,senior:4,child:4});
  for(const p of VISITOR_PROFILES){
    assert.equal(visitorProfileById(p.id),p);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.style));
    for(const color of Object.values(p.style.palette))assert.match(color,/^#[0-9a-f]{6}$/);
    const s=p.sprite,png=await readFile(new URL('../'+s.atlas,import.meta.url));
    assert.equal(png.readUInt32BE(16),s.atlasWidth);assert.equal(png.readUInt32BE(20),s.atlasHeight);assert.equal(png[25],6);
    const [x,y,w,h]=s.crop,cw=s.atlasWidth/s.columns,ch=s.atlasHeight/s.rows;
    assert.ok(w>100&&h>300);assert.ok(x>=s.column*cw&&x+w<=(s.column+1)*cw);assert.ok(y>=s.row*ch&&y+h<=(s.row+1)*ch);
  }
  assert.equal(visitorProfileById('missing'),null);
});

test('a compatible first wave uses all 24 profiles once without changing simulation attributes',()=>{
  const actors=VISITOR_PROFILES.map((p,i)=>visitor(i,p.gender,p.age));
  const before=JSON.stringify(actors),roster=createVisitorRoster(),chosen=roster.assign(actors);
  assert.equal(new Set(chosen.values()).size,24);assert.equal(JSON.stringify(actors),before);
  for(const [actor,profile]of chosen){assert.equal(profile.gender,actor.look.gender);assert.equal(profile.age,actor.look.age);}
});

test('crowds larger than a compatible pool distribute new visitors evenly',()=>{
  const actors=Array.from({length:19},(_,i)=>visitor(i));
  const chosen=createVisitorRoster().assign(actors),counts=new Map();
  for(const p of chosen.values())counts.set(p.id,(counts.get(p.id)||0)+1);
  assert.equal(counts.size,8);assert.ok(Math.max(...counts.values())-Math.min(...counts.values())<=1);
});

test('sorting and ordinary churn preserve people; replacements prefer newly unused profiles',()=>{
  const roster=createVisitorRoster(),actors=Array.from({length:8},(_,i)=>visitor(i));
  const original=roster.assign(actors),survivors=actors.slice(2),replacement=[visitor(20),visitor(21)];
  const next=roster.assign([...replacement,...survivors.reverse()]);
  for(const actor of survivors)assert.equal(next.get(actor),original.get(actor));
  assert.equal(new Set(next.values()).size,8);
  assert.equal(roster.assign([]).size,0);
});

test('explicit simulation age or gender changes are respected without assigning incompatible profiles',()=>{
  const person=visitor(1,'female','nino'),roster=createVisitorRoster();
  const first=roster.assign([person]).get(person);assert.equal(first.age,'child');assert.equal(first.gender,'f');
  person.look={gender:'male',age:'senior'};
  const next=roster.assign([person]).get(person);assert.notEqual(first,next);assert.equal(next.age,'senior');assert.equal(next.gender,'m');
  assert.deepEqual(visitorCategory({look:{}}),{age:'adult',gender:null});
});

test('different scene adapters share a live game profile while preserving source palettes and counters',()=>{
  const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185};
  const person={...visitor(42,'f'),x:383,y:305,look:{gender:'f',age:'adult',shirt:2,skin:4}};
  const game={custs:[person],passersby:[],staff:[],custIn:19,gameTime:12},input={active:true,iso,game,layout:[]};
  const before=JSON.stringify(input),matrix=createLifeSnapshot(),better=createLifeSnapshot(),best=createLifeSnapshot();
  const views=[matrix(input),better(input),best(input)],actors=views.map(v=>v.actors[0]);
  assert.equal(new Set(actors.map(a=>a.visitorProfileId)).size,1);
  assert.equal(actors[0].visitorStyle,actors[1].visitorStyle);assert.equal(actors[0].color,'#44aa55');assert.equal(actors[0].skin,'#8d5524');
  for(const view of views){assert.equal(view.inside,1);assert.equal(view.entries,19);}
  assert.equal(JSON.stringify(input),before);
  assert.equal(visitorProfilesForGame(game).get(person).id,actors[0].visitorProfileId);
  assert.equal(visitorProfilesForGame(null).size,0);
});

test('staff uniforms and special visitors never receive a crowd costume',()=>{
  const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185},point={x:380,y:300};
  const game={custs:[],passersby:[],staff:[{...point,hired:true}],guardiaCivil:{...point,phase:'patrolling'},unitreeBot:{...point,phase:'active'}};
  const actors=createLifeSnapshot()({active:true,iso,game}).actors;
  assert.equal(actors.length,3);assert.ok(actors.every(a=>!a.visitorProfileId&&!a.visitorStyle));
  assert.equal(actors.find(a=>a.kind==='guardiaCivil').color,'#315f33');
});
