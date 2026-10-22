import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,statSync} from 'node:fs';
import {SNEAKERS_LOC,SNEAKERS_SCREENS,SNEAKERS_AUDIENCE,SNEAKERS_SCENES,SNEAKERS_SEGMENTATION_URL,sneakersSurfaces,playableTracks,audienceLine} from './matrix-sneakers.mjs';
// FLT-102615 · Matrix de la Sneakers Store: su foto 360°, sus dos players y la cámara.
test('two virtual players with the playlists of the store contract',()=>{
  const contract=JSON.parse(readFileSync(new URL('../../xpacios/sneakerstore/contract.json',import.meta.url),'utf8'));
  assert.equal(SNEAKERS_LOC,contract.location_id);
  assert.deepEqual(SNEAKERS_SCREENS.map(s=>s.id),['sneakers-store-santa-rosa-19-screen','sneakers-store-santa-rosa-19-entry-display']);
  assert.deepEqual(SNEAKERS_SCREENS.map(s=>s.orientation),['horizontal','vertical']);
  if(contract.screen_formats){
    assert.equal(SNEAKERS_SCREENS[0].playlist,contract.screen_formats.horizontal.playlist_id);
    assert.equal(SNEAKERS_SCREENS[1].playlist,contract.screen_formats.vertical.playlist_id);
  }else assert.equal(SNEAKERS_SCREENS[0].playlist,contract.playlist_id);
  assert.deepEqual({...SNEAKERS_AUDIENCE},{loc:'sneakers-store-santa-rosa-19',screen:'sneakers-store-santa-rosa-19-screen'});
  assert.equal(SNEAKERS_SEGMENTATION_URL,'https://admira.tv/videoanalytics/xtore/');
});
test('the entrance capture maps the horizontal player on the LCD/rear LED and the vertical one on the entrance display',()=>{
  const surfaces=sneakersSurfaces('entrada');
  const portrait=surfaces.filter(s=>s.screen.endsWith('-entry-display')),landscape=surfaces.filter(s=>s.screen.endsWith('-screen'));
  assert.equal(portrait.length,1);assert.equal(portrait[0].installation,'portrait');
  assert.ok(landscape.some(s=>s.installation==='rear')&&landscape.some(s=>s.installation==='landscape'));
  for(const s of surfaces){assert.equal(s.quad.length,4);assert.equal(s.crop.length,4);assert.ok(s.crop.every(n=>n>=0&&n<=1));assert.ok(s.crop[0]+s.crop[2]<=1+1e-9&&s.crop[1]+s.crop[3]<=1+1e-9);}
  assert.equal(sneakersSurfaces('fondo-inexistente').length,0);
});
test('panoramas exist on disk for every scene offered',()=>{
  for(const s of Object.values(SNEAKERS_SCENES))assert.ok(statSync(new URL(s.url,import.meta.url)).size>100000,s.url);
});
test('only https video tracks are played; audience line names the venue screen',()=>{
  assert.deepEqual(playableTracks({tracks:[{url:'https://stock.admira.store/a.mp4?v=1'},{url:'http://x/a.mp4'},{url:'https://x/a.png'},{url:'https://x/b.webm'}]}).map(t=>t.url),['https://stock.admira.store/a.mp4?v=1','https://x/b.webm']);
  assert.deepEqual(playableTracks(null),[]);
  assert.match(audienceLine(null),/no disponible/);
  assert.match(audienceLine({active:false}),/apagada/);
  assert.match(audienceLine({active:true,ready:true,faces:1,gender:'female',ageBucket:'adulto',sending:true,loc:SNEAKERS_AUDIENCE.loc,screen:SNEAKERS_AUDIENCE.screen}),/1 cara · mujer · adulto · enviando a \/audience \(sneakers-store-santa-rosa-19 · sneakers-store-santa-rosa-19-screen\)/);
});
test('the twin wires the venue into the camera sender and the Matrix router',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),ui=readFileSync(new URL('./matrix-preview-ui.mjs',import.meta.url),'utf8');
  assert.match(html,/AUD_VENUE_DEFAULT=\(window\.__xpaceMatrixVenue\?\.\(\)==='sneakers-store-santa-rosa-19'\)\?\{loc:'sneakers-store-santa-rosa-19',screen:'sneakers-store-santa-rosa-19-screen'\}/);
  assert.match(html,/window\.__xpaceLiveCamera=\{/);
  assert.match(ui,/'sneakers-store-santa-rosa-19':\(\)=>import\('\.\/matrix-sneakers\.mjs/);
});
