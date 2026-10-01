import test from 'node:test';import assert from 'node:assert/strict';
import {createAnnouncement,ANNOUNCEMENT_QUALITIES,normalizeAnnouncementQuality} from './starbucks-announcement.mjs';
import {parseVisualCommand} from './xtanco-visual-command.mjs';
import {completionFor} from './expert-composer.mjs';
class Audio extends EventTarget{volume=1;currentTime=0;paused=true;play(){this.paused=false;return this.reject?Promise.reject(Error()):this.promise||Promise.resolve();}pause(){this.paused=true;}load(){}removeAttribute(){}}
function setup(){const audio=new Audio();let suppressed=0;const player=createAnnouncement({audio,music:{suppress(){suppressed++;let released=false;return()=>{if(!released)suppressed--;released=true;};}}});return {audio,player,count:()=>suppressed};}
test('announcement completion, cancellation and media failure always release music',async()=>{const {audio,player,count}=setup();await player.play();assert.equal(count(),1);assert.equal(player.state().playing,true);audio.dispatchEvent(new Event('ended'));assert.equal(count(),0);await player.play();player.toggle();assert.equal(count(),0);assert.ok(audio.paused);await player.play();audio.dispatchEvent(new Event('error'));assert.equal(count(),0);assert.equal(player.state().error,'media');player.dispose();});
test('blocked autoplay releases suppression and allows local retry',async()=>{const {audio,player,count}=setup();audio.reject=true;await player.play();assert.equal(count(),0);assert.equal(player.state().error,'play');audio.reject=false;await player.play();assert.ok(player.state().playing);player.dispose();assert.equal(count(),0);});
test('leaving during pending playback cannot resurrect announcement or leak suppression',async()=>{const {audio,player,count}=setup();let resolve;audio.promise=new Promise(r=>resolve=r);const pending=player.play();assert.equal(count(),1);player.dispose();resolve();await pending;assert.equal(count(),0);assert.equal(player.state().playing,false);assert.ok(audio.paused);});

test('dos calidades: Mónica (estándar) y ElevenLabs, recordadas y conmutables sin fuga de supresión',async()=>{
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const audio=new Audio();let suppressed=0;const music={suppress(){suppressed++;let r=false;return()=>{if(!r)suppressed--;r=true;};}};
 const a=createAnnouncement({audio,music,storage});assert.equal(a.quality,'estandar');assert.equal(audio.src,ANNOUNCEMENT_QUALITIES.estandar.url);
 await a.play();assert.equal(a.setQuality('ElevenLabs'),'elevenlabs');assert.equal(audio.src,ANNOUNCEMENT_QUALITIES.elevenlabs.url);assert.equal(suppressed,1);
 assert.equal(store.get('xpaceos.starbucks.announcementQuality'),'elevenlabs');a.dispose();assert.equal(suppressed,0);
 const b=createAnnouncement({audio:new Audio(),music,storage});assert.equal(b.quality,'elevenlabs');assert.equal(b.setQuality('nada'),null);b.dispose();
 assert.equal(normalizeAnnouncementQuality('premium'),'elevenlabs');assert.equal(normalizeAnnouncementQuality('Mónica'),'estandar');assert.equal(normalizeAnnouncementQuality('Estándar'),'estandar');
});
test('CLI experto: /aviso emite, /aviso estandar|elevenlabs elige y /av autocompleta la contraria',()=>{
 assert.deepEqual(parseVisualCommand('/aviso'),{announcement:{action:'toggle'}});
 assert.deepEqual(parseVisualCommand('/aviso elevenlabs'),{announcement:{action:'quality',quality:'elevenlabs'}});
 assert.deepEqual(parseVisualCommand('/announcement standard'),{announcement:{action:'quality',quality:'estandar'}});
 assert.deepEqual(parseVisualCommand('/aviso estado'),{announcement:{action:'status'}});
 assert.equal(completionFor('/avi','individual','estandar'),'/aviso elevenlabs');
 assert.equal(completionFor('/aviso','individual','elevenlabs'),'/aviso estandar');
 assert.equal(completionFor('/sin','individual','estandar'),'/sincro on');
});

test('los dos audios del aviso existen en el repositorio',async()=>{
 const {existsSync}=await import('node:fs');
 for(const q of Object.values(ANNOUNCEMENT_QUALITIES))assert.ok(existsSync(new URL(q.url)),q.url);
});
