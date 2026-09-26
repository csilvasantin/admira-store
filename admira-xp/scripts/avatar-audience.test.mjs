import test from 'node:test';
import assert from 'node:assert/strict';
import {avatarAgeBand,summarizeAvatarAudience,avatarAudienceMarkup} from './avatar-audience.mjs';

test('explicit avatar ages respect 17/18/60/61 boundaries; missing or invalid ages stay unknown',()=>{
  for(const [age,expected] of [[0,'under18'],[17,'under18'],[18,'18to60'],[60,'18to60'],[61,'over60']])assert.equal(avatarAgeBand(age),expected);
  for(const age of [null,undefined,-1,NaN,Infinity,'17','18–60','',{},true])assert.equal(avatarAgeBand(age),'unknown');
});

test('legacy fictional age metadata has an explicit band mapping, without interpreting appearance',()=>{
  for(const [age,expected] of [['nino','under18'],['joven','18to60'],['adulto','18to60'],['senior','over60']])assert.equal(avatarAgeBand(age),expected);
  assert.equal(avatarAgeBand('maduro'),'unknown');
  const data=summarizeAvatarAudience([{look:{skirt:true,hair:0,skin:2},npcSegment:{sex:'mujer',age:'senior'}}]);
  assert.deepEqual(data.gender,{man:0,woman:0,unknown:1});
  assert.deepEqual(data.age,{under18:0,'18to60':0,over60:0,unknown:1});
});

test('both distributions account for every present avatar once, without mutating state or retaining identity',()=>{
  const avatars=Object.freeze([
    Object.freeze({id:'private-a',look:Object.freeze({gender:'m',age:17})}),
    Object.freeze({look:Object.freeze({gender:'f',age:18})}),
    Object.freeze({look:Object.freeze({gender:'m',age:60})}),
    Object.freeze({look:Object.freeze({gender:'f',age:61})}),
    Object.freeze({look:Object.freeze({gender:'other',age:'joven'})}),
    Object.freeze({look:Object.freeze({gender:'female',age:-1})}),null,undefined
  ]);
  const data=summarizeAvatarAudience(avatars);
  assert.equal(data.source,'avatar-simulation');assert.equal(data.scope,'present');assert.equal(data.total,8);
  assert.deepEqual(data.gender,{man:2,woman:2,unknown:4});
  assert.deepEqual(data.age,{under18:1,'18to60':3,over60:1,unknown:3});
  assert.equal(Object.values(data.gender).reduce((a,b)=>a+b,0),data.total);
  assert.equal(Object.values(data.age).reduce((a,b)=>a+b,0),data.total);
  assert.doesNotMatch(JSON.stringify(data),/private-a|look|npcSegment/);
});

test('missing avatar list yields an empty simulation; displayed counts have the same denominator and source',()=>{
  for(const input of [undefined,null,{},[]])assert.equal(summarizeAvatarAudience(input).total,0);
  const markup=avatarAudienceMarkup([{look:{gender:'f',age:'senior'}},{}]);
  assert.match(markup,/data-audience-source="avatar-simulation"/);assert.match(markup,/SIMULACIÓN/);
  assert.match(markup,/data-avatar-total>2</);assert.match(markup,/data-avatar-gender="woman">1</);
  assert.match(markup,/data-avatar-age="unknown">1</);assert.match(markup,/Franja de edad asignada/);
  assert.match(avatarAudienceMarkup([],true),/SIMULATION/);
});


test('interactive cards expose left minus and right plus, disable zero/100 and label synthetic scope',()=>{
 const empty=avatarAudienceMarkup([],false,true);
 assert.equal((empty.match(/data-avatar-adjust="-1"/g)||[]).length,7);assert.equal((empty.match(/data-avatar-adjust="1"/g)||[]).length,7);
 assert.match(empty,/data-avatar-adjust="-1"[^>]+disabled/);assert.match(empty,/Volver a audiencia automática/);assert.match(empty,/El otro atributo empieza Sin dato/);
 const full=avatarAudienceMarkup(Array.from({length:100},()=>({look:{gender:'m',age:'adulto'}})),true,true);
 assert.equal((full.match(/data-avatar-adjust="1"[^>]+disabled/g)||[]).length,7);
 assert.doesNotMatch(avatarAudienceMarkup([],false,false),/data-avatar-adjust/);
});
