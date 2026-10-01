import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STARBUCKS_PLAYLIST,STARBUCKS_PUBLISHED_TRACKS} from './starbucks-playlist.mjs';
import {STARBUCKS_STORE,musicTracks} from './starbucks-music.mjs';

test('PlayerTaza public contract matches the playlist actually consumed by the speaker',async()=>{
  const published=JSON.parse(await readFile(new URL('../starbucks-playlist.json',import.meta.url),'utf8'));
  assert.deepEqual(published,STARBUCKS_PLAYLIST,'Run node admira-xp/scripts/export-starbucks-playlist.mjs');
  assert.equal(published.id,STARBUCKS_STORE);
  assert.deepEqual(musicTracks(published.tracks),musicTracks(STARBUCKS_PUBLISHED_TRACKS));
  assert.ok(published.tracks.length>0);
  for(const track of published.tracks){
    assert.ok(track.duration>0);
    assert.equal(track.mimeType,'video/mp4');
    assert.ok(new URL(track.url).pathname.includes(track.stockId));
  }
});
