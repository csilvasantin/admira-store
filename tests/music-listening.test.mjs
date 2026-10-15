import test from 'node:test';import assert from 'node:assert/strict';
import {toggleMusicFromGesture,mountMusicListeningButton} from '../admira-xp/scripts/music-listening.mjs';
test('music gesture is synchronous and respects global mute and higher-priority applications',()=>{let calls=0;const music={toggle(){calls++;}},win={dsMasterMute:true};assert.equal(toggleMusicFromGesture(music,{win}),false);win.dsMasterMute=false;assert.equal(toggleMusicFromGesture(music,{win,blocked:()=>true}),false);assert.equal(calls,0);assert.equal(toggleMusicFromGesture(music,{win}),true);assert.equal(calls,1);});
test('the native TPV button exposes audibility and disposes its subscription with the scene',()=>{
 class Node extends EventTarget{constructor(){super();this.dataset={};this.attrs={};this.children=[];}append(n){this.children.push(n);}setAttribute(k,v){this.attrs[k]=v;}remove(){this.removed=true;}}
 const host=new Node();host.ownerDocument={createElement:()=>new Node()};let state={started:true,muted:true,suppressed:false},listener,unsubscribed=0;const music={subscribe(fn){listener=fn;fn(state);return()=>unsubscribed++;},toggle(){state={...state,muted:!state.muted};listener(state);}},controls=new AbortController();
 const {button}=mountMusicListeningButton(host,{music,win:{},t:(_,en)=>en,signal:controls.signal});assert.equal(button.attrs['aria-pressed'],'false');assert.match(button.attrs['aria-label'],/^Listen/);button.dispatchEvent(new Event('click'));assert.equal(button.attrs['aria-pressed'],'true');assert.match(button.attrs['aria-label'],/^Mute/);
 state={...state,suppressed:true};listener(state);assert.equal(button.attrs['aria-pressed'],'false');controls.abort();assert.equal(unsubscribed,1);assert.equal(button.removed,true);
});
