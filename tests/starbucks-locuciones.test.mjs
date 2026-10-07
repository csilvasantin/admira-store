// Altavoces de Starbucks (7-oct-2026, Carlos · presentación Alsea): el altavoz de música emite la locución en
// inglés y el de la pared del videowall la de castellano, las dos ya creadas en Stock a máxima calidad, DOS veces.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {SPEAKER_LOCUTIONS,mountSpeakerLocutions} from '../admira-xp/scripts/starbucks-locuciones.mjs';

const require=createRequire(import.meta.url);
const {createAnnouncements}=require('../admira-xp/scripts/announcements.js');

test('cada altavoz tiene su idioma, su audio de Stock y una sola lectura',()=>{
 assert.equal(SPEAKER_LOCUTIONS.altavoz.language,'en');assert.equal(SPEAKER_LOCUTIONS.videowall.language,'es');
 for(const L of Object.values(SPEAKER_LOCUTIONS)){assert.equal(L.times,1);assert.match(L.url,/^https:\/\/api\.admira\.store\/stock\/asset\/\d+-[a-z0-9]+$/);assert.ok(L.url.endsWith(L.stock));}
 assert.match(SPEAKER_LOCUTIONS.altavoz.text,/best coffee shop in the world/);assert.match(SPEAKER_LOCUTIONS.videowall.text,/refill de Chai Latte/);
});

test('el reproductor repite el audio las veces pedidas (2) y por defecto lo lee una sola vez',async()=>{
 for(const [times,expected] of [[2,2],[undefined,1]]){
  const audios=[],states=[];
  class FakeAudio{constructor(url){this.url=url;this.plays=0;audios.push(this);}play(){this.plays++;queueMicrotask(()=>{this.onplaying?.();this.onended?.();});return Promise.resolve();}pause(){}}
  const player=createAnnouncements({Audio:FakeAudio,generate:async()=>({url:'x.mp3'}),onState:s=>states.push(s),schedule:f=>{queueMicrotask(f);return 1;},unschedule(){},...(times?{times}:{})});
  assert.equal(player.play('hola',{voice:'female',language:'en'}),true);
  for(let i=0;i<60&&states.at(-1)?.phase!=='done';i++)await new Promise(r=>setTimeout(r,2));
  assert.equal(states.at(-1).phase,'done');assert.equal(states.at(-1).completed,expected);assert.equal(states.at(-1).total,expected);assert.equal(audios[0].plays,expected);
 }
});

function escena(){
 const calls=[],stops=[],boton=()=>{const l={},a={};return {addEventListener:(t,f)=>{l[t]=f;},setAttribute:(k,v)=>{a[k]=v;},attr:a,click:()=>l.click({stopPropagation(){}}),title:''};};
 const buttons={altavoz:boton(),videowall:boton()},status={textContent:''};let before=0;
 const win={document:{documentElement:{lang:'es'}},XpaceAnnouncements:{playStock:(url,text,opts)=>{calls.push({url,text,opts});return true;},stopStock:()=>stops.push(1)}};
 const api=mountSpeakerLocutions(buttons,{status,onBeforePlay:()=>{before++;},win});
 return {api,buttons,status,calls,stops,before:()=>before};
}

test('pulsar el altavoz emite la de inglés y el de la pared del videowall la de castellano, una vez cada una',()=>{
 const e=escena();
 e.buttons.altavoz.click();
 assert.equal(e.calls[0].url,SPEAKER_LOCUTIONS.altavoz.url);assert.equal(e.calls[0].opts.language,'en');assert.equal(e.calls[0].opts.times,1);
 assert.equal(e.buttons.altavoz.attr['aria-pressed'],'true');assert.equal(e.before(),1,'para antes el aviso de cierre');
 e.calls[0].opts.onState({phase:'speaking',completed:0});assert.match(e.status.textContent,/Emitiendo · Altavoz · inglés$/);
 e.calls[0].opts.onState({phase:'done',completed:1});assert.equal(e.buttons.altavoz.attr['aria-pressed'],'false');
 e.buttons.videowall.click();
 assert.equal(e.calls[1].url,SPEAKER_LOCUTIONS.videowall.url);assert.equal(e.calls[1].opts.language,'es');assert.equal(e.calls[1].opts.times,1);
 e.buttons.videowall.click();assert.equal(e.stops.length,1,'un segundo toque la detiene');assert.equal(e.api.state().active,'');
});

test('el panorama cablea los dos altavoces sin recuperar los iconos retirados',()=>{
 const source=fs.readFileSync(new URL('../admira-xp/scripts/matrix-panorama.mjs',import.meta.url),'utf8');
 assert.match(source,/mountSpeakerLocutions\(\{altavoz:speakerAnchor,videowall:announcementAnchor\}/);
 assert.match(source,/project\(STARBUCKS_SPEAKER\)/);assert.ok(!source.includes('matrix-speaker'));
});

test('con el tótem en modo quiosco Matrix no intercepta la apertura del avatar: /avatar best abre su panel',()=>{
 const source=fs.readFileSync(new URL('../admira-xp/scripts/matrix-panorama.mjs',import.meta.url),'utf8');
 assert.match(source,/addEventListener\('admira-avatar:open',e=>\{if\(disposed\)return;if\(wallAvatar\.mode==='kiosk'\)return;e\.preventDefault\(\);focusAvatar\(\);\}/);
});
