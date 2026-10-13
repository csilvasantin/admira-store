import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeStarbucks5840,SBUX_5839_BASE} from './starbucks-5840-propuesta.mjs';
import {validMatrixState} from './matrix-remote.mjs';
const t=(id,extra={})=>({id,title:id,url:'https://stock.admira.store/stock/'+id+'/asset.mp4',...extra});
const vivo={schemaVersion:1,store:'starbucks-alsea-paseo-de-gracia',revision:43,controlRevision:{},musicNext:0,controls:{},previewCommand:null,
 playlists:{wall:{id:'w',managed:true,tracks:[t('w1'),t('w2')]},tpv:{id:'t',managed:true,tracks:[t('t1')]},music:{id:'m',managed:true,tracks:[t('m1'),t('m2')]},ipad:{id:'i',managed:true,tracks:[t('photo',{kind:'image'})]}}};
const V=['sbux-5839-tu-momento-es-1080x1920','sbux-5839-your-moment-en-1080x1920'],H=['sbux-5839-tu-momento-es-1920x1080','sbux-5839-your-moment-en-1920x1080'];
test('#5840: cada formato delante en su pantalla, sin tocar la música ni el resto de pistas',()=>{
 const p=proposeStarbucks5840(vivo);
 assert.deepEqual(p.playlists.wall.tracks.map(x=>x.id),[...V,'w1','w2']);
 assert.deepEqual(p.playlists.tpv.tracks.map(x=>x.id),[...V,'t1']);
 assert.deepEqual(p.playlists.ipad.tracks.map(x=>x.id),[...H,'photo']);
 assert.deepEqual(p.playlists.music,vivo.playlists.music);
 assert.equal(p.revision,44);assert.ok(validMatrixState(p));
 assert.ok(p.playlists.wall.tracks[0].url.startsWith(SBUX_5839_BASE)&&p.playlists.wall.tracks[0].url.endsWith('-1080x1920.mp4'));
 assert.ok(p.playlists.ipad.tracks[0].url.endsWith('-1920x1080.mp4'));
});
test('#5840: otra base de medios (vista previa) y sin duplicar si ya estaba aplicado',()=>{
 const base='https://sbux-5840-preview.admira-store.pages.dev/admira-xp/media/starbucks-5839/';
 const dos=proposeStarbucks5840(proposeStarbucks5840(vivo,base),base);
 assert.deepEqual(dos.playlists.wall.tracks.map(x=>x.id),[...V,'w1','w2']);
 assert.ok(dos.playlists.tpv.tracks.slice(0,2).every(x=>x.url.startsWith(base)));
 const sinIpad=proposeStarbucks5840({...vivo,playlists:{...vivo.playlists,ipad:undefined}});
 assert.deepEqual(sinIpad.playlists.ipad.tracks.map(x=>x.id),H);assert.ok(validMatrixState(sinIpad));
});
