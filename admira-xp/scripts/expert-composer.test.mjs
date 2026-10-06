import test from 'node:test';import assert from 'node:assert/strict';import {completionFor,nextSyncCommand} from './expert-composer.mjs';
test('prefix chooses opposite sync state, including total',()=>{assert.equal(completionFor('/sin','individual'),'/sincro on');for(const mode of ['groups','total'])assert.equal(completionFor('/SIN',mode),'/sincro off');assert.equal(nextSyncCommand('groups'),'/sincro off');});
test('explicit arguments, longer commands and ordinary text are preserved',()=>{for(const s of ['/sincro off','/sincro on','/sincrototal','hello /sin','/s'])assert.equal(completionFor(s,'individual'),null);});
import {bindExpertComposer} from './expert-composer.mjs';
test('periodic refresh never turns /av into /sincro while typing an avatar command',()=>{
 const events={},c={value:'/av',selectionStart:3,selectionEnd:3,addEventListener:(k,f)=>events[k]=f,removeEventListener(){},setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}};
 const release=bindExpertComposer(c);events.input({inputType:'insertText'});assert.equal(c.value,'/aviso elevenlabs');globalThis.XpaceExpertComposer.refresh();assert.equal(c.value,'/aviso elevenlabs');
 c.value=c.value.slice(0,c.selectionStart)+'atar digital better';c.selectionStart=c.selectionEnd=c.value.length;events.input({inputType:'insertText'});globalThis.XpaceExpertComposer.refresh();assert.equal(c.value,'/avatar digital better');
 let blocked=false,prevented=false;events.keydown({key:'a',stopPropagation(){blocked=true;},preventDefault(){prevented=true;}});assert.equal(blocked,true);assert.equal(prevented,false);release();
});
