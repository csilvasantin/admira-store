import test from 'node:test';import assert from 'node:assert/strict';
import {parseCapsulaArgs,pickCapsule,spokenText,capsulaHelp,handleCapsula,loadCapsulaBank,RECENT_KEY} from './capsula-demo.mjs';
import {parseVisualCommand} from './xtanco-visual-command.mjs';
const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
test('/demo capsula parses typology, quality, mute and help (ES/EN aliases, any order)',()=>{
 assert.deepEqual(parseVisualCommand('/demo capsula musica good'),{guided:'tour',action:'capsula',arg:'musica good'});
 assert.deepEqual(parseVisualCommand('/demo cápsula música good en'),{guided:'tour',action:'capsula',arg:'musica good',lang:'en'});
 assert.deepEqual(parseVisualCommand('/demo capsula help'),{guided:'tour',action:'capsula',arg:'help'});
 assert.deepEqual(parseCapsulaArgs('musical good'),{action:'show',tipo:'musica',calidad:'good',voice:true});
 assert.deepEqual(parseCapsulaArgs('best technology'),{action:'show',tipo:'tecnologia',calidad:'best',voice:true});
 assert.deepEqual(parseCapsulaArgs(''),{action:'show',tipo:'random',calidad:'good',voice:true});
 assert.equal(parseCapsulaArgs('cine good muda').voice,false);assert.equal(parseCapsulaArgs('help').action,'help');
 assert.equal(parseCapsulaArgs('astrologia good').action,'invalid');});
test('GOOD bank: 10 typologies × 10, ES+EN, short enough for 480×800 e-ink, zero cost',async()=>{
 const b=await loadCapsulaBank();assert.equal(b.quality,'good');assert.equal(b.cost_eur,0);assert.match(b.model,/nemotron/i);
 assert.equal(b.tipologias.length,10);for(const t of b.tipologias)assert.equal(t.count,10,t.id);
 for(const c of b.capsulas){for(const l of ['es','en']){assert.ok(c.titulo[l]&&c.texto[l],c.id);assert.ok(c.texto[l].length<=230,c.id);}assert.equal(c.verificacion.veredicto,'seguro');}
 assert.ok(!JSON.stringify(b).includes('nvapi-'),'no API key in the bank');});
test('pick avoids recently shown capsules and help lists typologies; better/best are pending',async()=>{
 const b=await loadCapsulaBank(),s=mem(),seen=new Set();for(let i=0;i<10;i++)seen.add(pickCapsule(b,'musica',{storage:s}).id);assert.equal(seen.size,10);
 assert.equal(JSON.parse(s.getItem(RECENT_KEY)).length,10);
 assert.match(spokenText(b.capsulas[0],'es'),/^¿Sabías que .+\?$/);assert.match(spokenText(b.capsulas[0],'en'),/^Did you know .+\?$/);
 assert.match(capsulaHelp(b),/musica · 10/);assert.match(capsulaHelp(b,{en:true}),/Typologies/);
 const r=await handleCapsula('historia better',{lang:'es',doc:null});assert.equal(r.pending,true);assert.match(r.message,/próximamente/);
 const e=await handleCapsula('history best',{lang:'en',doc:null});assert.match(e.message,/requires a commission/);});
