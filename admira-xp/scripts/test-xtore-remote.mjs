import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('  function remoteKind(item){');
const end = html.indexOf('  async function remoteJson(', start);
assert.ok(start > 0 && end > start, 'remote helpers must exist in the Xtore player');

const helpers = new Function(`${html.slice(start, end)}; return {remoteKind,remoteItem,remoteCanon};`)();

assert.equal(helpers.remoteCanon('#Música'), 'musica');
assert.equal(helpers.remoteCanon('  XTANCO Valencia '), 'xtanco-valencia');
assert.equal(helpers.remoteKind({ type: 'video/mp4' }), 'video');
assert.equal(helpers.remoteKind({ type: 'image/png' }), 'image');
assert.deepEqual(
  helpers.remoteItem({ id: 'asset-666', num: 666, title: 'Take My Breath Away', type: 'video', url: 'https://example.test/666.mp4', tags: ['música'] }),
  { id: 'asset-666', num: 666, title: 'Take My Breath Away', type: 'video', kind: 'video', url: 'https://example.test/666.mp4', thumb: '', dur: null, tags: ['música'] },
);

for (const contract of [
  "REMOTE_API+'/locations/cmd?id='",
  "REMOTE_API+'/locations/cmd/ack'",
  "REMOTE_PLAYLIST_API",
  "PIXER_WORKER+'/screen/cache'",
  "PIXER_WORKER+'/signage/now'",
  "const content=/^content-(\\d{1,6})$/",
  "const wanted=tag[1].split(/[,+]/)",
  "if(!remoteCmdState.init){ remoteCmdState.since=Number(d.seq)||0;",
  'pollRemoteCommands(); setInterval(pollRemoteCommands,2500)',
]) assert.ok(html.includes(contract), `missing remote contract: ${contract}`);

assert.ok(
  html.includes("await applyRemoteSelection(items,!!tag); return 'executed';"),
  'the command must publish its selection before reporting executed',
);

console.log('Xtore remote contracts: OK');
