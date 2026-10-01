import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizePersonaStyle,keyChroma} from './pixeria-personas.mjs';

test('the Grok style card is normalised to the vocabulary Better and Best understand', () => {
  const s=normalizePersonaStyle({gender:'m',age:'senior',hairstyle:'bald',outfit:'suit',accessory:'bag',palette:{skin:'#d4b8a3',hair:'#d4d4d4',color:'#c8c8c8',pants:'nope',shoes:'#2a2a2a'}});
  assert.deepEqual({...s,palette:{...s.palette}},{gender:'m',age:'senior',hairstyle:'short',outfit:'jacket',accessory:'backpack',height:1,width:1,
    palette:{skin:'#d4b8a3',hair:'#d4d4d4',color:'#c8c8c8',pants:'#4a4a4a',shoes:'#2a2a2a'}});
  assert.equal(normalizePersonaStyle({gender:'f',age:'teen'}).age,'adult');
  assert.equal(normalizePersonaStyle(null),null);
});

test('chroma key drops the green background, keeps skin and cloth and despills the edge', () => {
  const px=new Uint8ClampedArray([0,255,0,255, 30,160,40,255, 200,150,120,255, 99,108,64,255]);
  keyChroma(px);
  assert.equal(px[3],0);                 // pure chroma → transparent
  assert.equal(px[7],0);                 // shadowed chroma → transparent
  assert.equal(px[11],255);              // skin stays opaque
  assert.equal(px[15],255);              // olive cloth (#636c40) stays opaque
  assert.ok(px[13]<=px[12]+6);           // despill: green no longer dominates
});

test('a Pixeria persona flows from the Good customer to every tier', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/c\.pixeriaPersonaId=entry&&entry\.persona&&entry\.id\?String\(entry\.id\):null;/);
  const snapshot=readFileSync(new URL('./life-snapshot.mjs',import.meta.url),'utf8');
  assert.match(snapshot,/visitorProfileId:'px:'\+pixeriaPersonaId,visitorStyle:pixeriaStyle/);
  const people=readFileSync(new URL('./best-live-people.mjs',import.meta.url),'utf8');
  assert.match(people,/pixeriaWalkSheet\(pxId\)/);
  const registry=readFileSync(new URL('./pixeria-personas.mjs',import.meta.url),'utf8');
  assert.match(registry,/LOCAL_WORKER=\/\^http:\\\/\\\/\(127\\\.0\\\.0\\\.1\|localhost\):\\d\+\$\//,'only local workers may override the production one');
});


test('a prepared demo loads its style without triggering generation', async () => {
  const oldFetch=globalThis.fetch,calls=[];
  globalThis.fetch=async (url)=>{calls.push(url);return new Response(JSON.stringify({demo:'visitor-green-v1',ready:true,body:'male',style:{gender:'m',age:'adult',outfit:'jacket',palette:{color:'#193d30'}}}));};
  try{
    const {pixeriaPersonaStyle,pixeriaPersonaState}=await import('./pixeria-personas.mjs?demo-test');
    assert.equal(pixeriaPersonaStyle('npc_demo1234'),null);
    await new Promise(r=>setTimeout(r,20));
    assert.equal(pixeriaPersonaState('npc_demo1234'),'ready');
    assert.equal(pixeriaPersonaStyle('npc_demo1234').palette.color,'#193d30');
    assert.equal(calls.length,1);assert.ok(!calls[0].includes('/build'));
  }finally{globalThis.fetch=oldFetch;}
});


test('late queue visibility retains the same five-minute receive window after startup',async()=>{
  const {runInNewContext}=await import('node:vm');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const body=html.slice(html.indexOf('  async function pollNpcQueue(){'),html.indexOf('  async function pollFeed(){'));
  const now=1000000,entry={id:'npc_late1234',img:'data:image/png;base64,AA==',ts:now-120000};let calls=0,spawned=0;
  const ctx={state:'game',S:{GAME:'game'},PIXER_WORKER:'https://api.admira.store',screenId:'test',__npcSeen:now-300000,__npcDone:new Set(),Date,encodeURIComponent,Math,
    fetch:async url=>({ok:true,json:async()=>({now,pending:++calls>1&&Number(new URL(url).searchParams.get('since'))<entry.ts?[entry]:[]})}),
    spawnCustomNpc:()=>{spawned++;return true},__npcMarkDone:id=>ctx.__npcDone.add(id)};
  runInNewContext(body+';globalThis.poll=pollNpcQueue;',ctx);
  await ctx.poll();await ctx.poll();await ctx.poll();assert.equal(spawned,1);
});
