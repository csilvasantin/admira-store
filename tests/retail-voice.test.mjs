import test from 'node:test';
import assert from 'node:assert/strict';
import {createRetailRulebook,createRetailRulePlayer,defaultRetailRule,defaultWaterRule,waterOfferScreens,validRetailRule,RETAIL_RULES_KEY,RETAIL_EVENTS,WATER_OFFER_SCREENS} from '../admira-xp/scripts/retail-rules.mjs';
import {WATER_THANKS,voicePlan,createVoiceSpeaker,VOICE_CACHE} from '../admira-xp/scripts/retail-voice.mjs';
import fs from 'node:fs';
const memory=(init)=>{const m=new Map(init);return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),m};};
test('water rule: IF a bottle is left at the register → DO offer on iPad + walls and DO voiceover ES/EN',()=>{
 assert.ok(RETAIL_EVENTS.includes('waterDelivered'));
 const book=createRetailRulebook({storage:memory()}),water=book.state().rules.find(r=>r.id==='water-thanks');
 assert.deepEqual(water,defaultWaterRule());assert.deepEqual(water.do.map(a=>a.id),['showWaterOffer','sayText']);
 assert.deepEqual(water.do[1].text,{es:'Gracias por comprar agua de proximidad',en:'Thank you for buying locally sourced water'});
 assert.deepEqual(waterOfferScreens(book.state().rules),[...WATER_OFFER_SCREENS]);assert.ok(WATER_OFFER_SCREENS.includes('starbucks-ipad-01'));
 assert.deepEqual(book.selectActions('waterDelivered').map(a=>a.kind),['offer','tts']);assert.deepEqual(book.selectActions('muffinPicked').map(a=>a.kind).includes('tts'),false);
 book.save(book.state().rules.map(r=>r.id==='water-thanks'?{...r,enabled:false}:r));assert.deepEqual(waterOfferScreens(book.state().rules),[]);assert.deepEqual(book.selectActions('waterDelivered'),[]);
});
test('validation: the offer only belongs to the water event; voice mode and text length are bounded',()=>{
 assert.equal(validRetailRule(defaultWaterRule()),true);
 assert.equal(validRetailRule({...defaultRetailRule(),do:[{id:'showWaterOffer',value:'water-offer'}]}),false);
 assert.equal(validRetailRule({...defaultRetailRule(),do:[{id:'sayText',value:'Hola',text:{es:'Hola',en:'Hi'},voice:'both'}]}),true,'a muffin rule may speak too');
 const w=defaultWaterRule();w.do[1].voice='fr';assert.equal(validRetailRule(w),false);
 const w2=defaultWaterRule();w2.do[1].text.es='x'.repeat(201);assert.equal(validRetailRule(w2),false);
});
test('older rulebooks get the water rule once; a rule the user deleted stays deleted',()=>{
 const old=memory([[RETAIL_RULES_KEY,JSON.stringify({version:3,rules:[defaultRetailRule()],media:[]})]]);
 const a=createRetailRulebook({storage:old});assert.equal(a.state().rules.filter(r=>r.id==='water-thanks').length,1);
 a.save(a.state().rules.filter(r=>r.id!=='water-thanks'));assert.deepEqual(JSON.parse(old.getItem(RETAIL_RULES_KEY)).seeded,['water']);
 const b=createRetailRulebook({storage:old});assert.equal(b.state().rules.some(r=>r.id==='water-thanks'),false);assert.deepEqual(waterOfferScreens(b.state().rules),[]);
});
test('voice language: auto follows /idioma, both = Spanish then English, default texts use the pre-recorded Mónica files',()=>{
 const a=defaultWaterRule().do[1];
 assert.deepEqual(voicePlan(a,'es').map(p=>[p.language,p.text]),[['es',WATER_THANKS.es]]);
 assert.deepEqual(voicePlan(a,'en').map(p=>[p.language,p.text]),[['en',WATER_THANKS.en]]);
 assert.deepEqual(voicePlan({...a,voice:'both'},'en').map(p=>p.language),['es','en']);
 assert.match(voicePlan(a,'es')[0].url,/assets\/audio\/agua-proximidad-es\.m4a$/);assert.match(voicePlan(a,'en')[0].url,/agua-proximidad-en\.m4a$/);
 const edited=voicePlan({...a,text:{es:'Gracias por tu compra',en:WATER_THANKS.en}},'es')[0];assert.equal(edited.url,'');assert.equal(edited.voice,'browser');
 assert.equal(Object.keys(VOICE_CACHE).length,2);
});
test('speaker plays through the announcement channel in order and the player re-fires on every bottle without stopping the muffin song',async()=>{
 const calls=[];const win={document:{documentElement:{lang:'es'}},XpaceAnnouncements:{playStock(url,text,{language,onState}){calls.push([language,text,url.split('/').pop()]);setTimeout(()=>onState({phase:'done'}),5);return Promise.resolve(true);},stopStock(){calls.push(['stop']);}}};
 await createVoiceSpeaker({...defaultWaterRule().do[1],voice:'both'},{win}).play();
 assert.deepEqual(calls,[['es',WATER_THANKS.es,'agua-proximidad-es.m4a'],['en',WATER_THANKS.en,'agua-proximidad-en.m4a']]);
 const book=createRetailRulebook({storage:memory()});const spoken=[];
 const player=createRetailRulePlayer({book,audio:null,music:{suppress:()=>()=>{}},visual:null,speakerFactory:action=>({play:async()=>{spoken.push(action.text.es);},stop(){}})});
 await player.fire('waterDelivered');await player.fire('waterDelivered');assert.deepEqual(spoken,[WATER_THANKS.es,WATER_THANKS.es]);assert.equal(player.state().playing,false);
});
test('composer wiring: water event and text reactions are offered; demo 14 delivers and gives back a bottle',()=>{
 const src=fs.readFileSync(new URL('../admira-xp/scripts/retail-rule-composer.mjs',import.meta.url),'utf8');
 assert.match(src,/RETAIL_EVENTS/);assert.match(src,/data-?voice-?text|voiceText/);assert.match(src,/Probar locución/);
 const pos=fs.readFileSync(new URL('../admira-xp/scripts/matrix-pos-experience.mjs',import.meta.url),'utf8');
 assert.match(pos,/rulePlayer\.fire\('waterDelivered'\)/);assert.match(pos,/offerScreens\.includes\(id\)/);assert.match(pos,/giveBack\(\)/);
 const reg=JSON.parse(fs.readFileSync(new URL('../admira-xp/demos.json',import.meta.url),'utf8')),d=reg.demos.find(x=>x.id==='ifthendothat');
 assert.ok(d.steps.some(s=>s.water==='deliver'));assert.ok(d.cleanup.some(s=>s.water==='giveback'));
});
