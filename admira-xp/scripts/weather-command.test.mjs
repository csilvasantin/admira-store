import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const ctx=vm.createContext({});vm.runInContext(source('weather-command.js'),ctx);
const parse=(s,current)=>JSON.parse(JSON.stringify(ctx.XpaceWeatherCommand.parse(s,current)));

test('Spanish and English rain commands default silent, including old aliases',()=>{
 for(const input of ['/tiempo lluvia','/weather rain','/weather storm','/lluvia on','/rain on'])assert.deepEqual(parse(input),{ok:true,type:'rain',sonora:false});
 assert.equal(parse('/music on'),null);
 assert.deepEqual(parse('/lluvia',{type:'rain'}),{ok:true,type:null,sonora:false});
});
test('explicit sound is reversible; invalid input never changes weather',()=>{
 for(const input of ['/tiempo lluvia sonora','/weather rain audible','/rain on sound yes'])assert.equal(parse(input).sonora,true);
 for(const input of ['/tiempo lluvia sonora off','/weather rain silent','/lluvia off sonora'])assert.equal(parse(input).sonora,false);
 for(const input of ['/tiempo lluvia sonroa','/weather rain audible maybe','/weather raim','/tiempo sol sonora'])assert.equal(parse(input).ok,false);
 assert.deepEqual(parse('/tiempo sol'),{ok:true,type:'sun',sonora:false});
 assert.deepEqual(parse('/weather normal'),{ok:true,type:null,sonora:false});
});

function audioFixture(weather={type:'rain'},ambient=false){
 const gains=[],oscillators=[];
 const parameter=()=>({value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 class AudioContext{
  currentTime=0;sampleRate=2;destination={};
  createGain(){const n={gain:parameter(),connect(){},disconnect(){}};gains.push(n);return n;}
  createOscillator(){const n={frequency:parameter(),connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};oscillators.push(n);return n;}
  createBuffer(){return {getChannelData:()=>new Float32Array(4)};}
  createBufferSource(){return {connect(){},start(){}};}
  createBiquadFilter(){return {frequency:parameter(),Q:parameter(),connect(){}};}
 }
 const window={G:{weather,sfxVolume:.7,ambient:{enabled:ambient,volume:.25}},AudioContext,ambientActive:()=>true};
 const context=vm.createContext({window,document:{hidden:false,addEventListener(){}},setInterval(){},setTimeout(){}});
 vm.runInContext(source('../assets/js/sfx.js'),context);vm.runInContext(source('../assets/js/ambient.js'),context);
 window.AMBIENT.init();window.AMBIENT.update();
 return {window,gains,oscillators};
}
test('silent rain gates both sound engines without muting unrelated effects or ambient rumor',()=>{
 const f=audioFixture({type:'rain'},true);
 f.window.SFX.rainLoop();f.window.SFX.thunder();assert.equal(f.oscillators.length,0);
 assert.equal(f.gains[2].gain.value,0);assert.ok(f.gains[1].gain.value>0);
 f.window.SFX.doorBell();assert.equal(f.oscillators.length,2);
});
test('audible rain works without enabling coffee ambiance; silent transition stops rain immediately',()=>{
 const f=audioFixture({type:'rain',sonora:true});
 assert.equal(f.gains[0].gain.value,0);assert.equal(f.gains[1].gain.value,0);assert.ok(f.gains[2].gain.value>0);
 f.window.SFX.rainLoop();assert.equal(f.oscillators.length,3);
 f.window.G.weather.sonora=false;f.window.SFX.stopWeather();f.window.AMBIENT.update();
 assert.ok(f.oscillators.every(o=>o.stopped));assert.equal(f.gains[2].gain.value,0);
});
test('rain sound respects SFX mute and pause',()=>{
 const f=audioFixture({type:'rain',sonora:true});f.window.G.sfxVolume=0;f.window.AMBIENT.update();
 f.window.SFX.thunder();assert.equal(f.oscillators.length,0);assert.equal(f.gains[2].gain.value,0);
 f.window.G.sfxVolume=.7;f.window.ambientActive=()=>false;f.window.AMBIENT.update();assert.equal(f.gains[2].gain.value,0);
});
