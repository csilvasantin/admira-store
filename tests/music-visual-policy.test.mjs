import test from 'node:test';import assert from 'node:assert/strict';
import {musicVisualPolicy} from '../admira-xp/scripts/music-artwork.mjs';
import {physicalMusicTracks} from '../admira-xp/scripts/physical-music-playlist.mjs';
import {musicTracks} from '../admira-xp/scripts/starbucks-music.mjs';
test('orientation policy is generic for future IDs and never allows horizontal, square or unknown video',()=>{
 const unknown={id:'future-stock',kind:'video',title:'Future song',url:'https://media.example/future.mp4',cover:'https://media.example/cover.jpg'};
 assert.equal(musicVisualPolicy(unknown).mode,'portrait-artwork');assert.equal(musicVisualPolicy(unknown,{width:1280,height:720}).mode,'portrait-artwork');assert.equal(musicVisualPolicy(unknown,{width:720,height:720}).mode,'portrait-artwork');
 assert.equal(musicVisualPolicy(unknown,{width:1080,height:1920}).mode,'portrait-video');assert.equal(musicVisualPolicy({...unknown,width:1080,height:1920}).orientation,'portrait');assert.equal(musicVisualPolicy({...unknown,kind:'audio',width:1080,height:1920}).mode,'portrait-artwork');assert.equal(musicVisualPolicy({...unknown,width:-1,height:0}).mode,'portrait-artwork');
});
test('source dimensions survive optional Stock metadata, proxy normalization and the shared music owner',()=>{
 const item={stockId:'future-stock',assetType:'video',asset:'https://media.example/future.mp4',title:'Future'};const tracks=physicalMusicTracks({ok:true,draft:{items:[item]},auto:[]},[{id:'future-stock',ancho:1280,alto:720}]);assert.equal(tracks[0].width,1280);assert.equal(tracks[0].height,720);assert.equal(musicTracks(tracks)[0].height,720);
 const roundtrip=physicalMusicTracks({ok:true,draft:{items:tracks},auto:[]});assert.equal(roundtrip[0].width,1280);assert.equal(musicVisualPolicy(roundtrip[0]).mode,'portrait-artwork');
});
