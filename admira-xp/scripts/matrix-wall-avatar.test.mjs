import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {wallAvatarUrl,AVATAR_WALL_CONTEXT,AVATAR_WALL_RENDERERS} from './matrix-wall-avatar.mjs';

// Contexto de cliente del avatar en la pared Alsea (06-10-2026): habla de café en cada nivel.
test('wall avatar URL carries Starbucks Alsea context and the avatar tier',()=>{
  const good=new URL(wallAvatarUrl('good',{...AVATAR_WALL_CONTEXT,lang:'es'}));
  assert.equal(good.origin+good.pathname,'https://digitalavatar.ai/better.html');
  assert.equal(good.searchParams.get('dock'),'1');
  assert.equal(good.searchParams.get('loc'),'alsea-sbux-021');
  assert.equal(good.searchParams.get('sector'),'cafeteria');
  assert.equal(good.searchParams.get('tier'),'good');
  assert.equal(good.searchParams.get('lang'),'es');
  const best=new URL(wallAvatarUrl('best',{...AVATAR_WALL_CONTEXT,lang:'en',brand:'starbucks'}));
  assert.match(best.pathname,/metahuman\.html$/);
  assert.equal(best.searchParams.get('tier'),'best');
  assert.equal(best.searchParams.get('brand'),'starbucks');
  assert.equal(best.searchParams.get('kiosk'),null);
  assert.equal(new URL(wallAvatarUrl('better',{})).searchParams.get('kiosk'),'0');
  // Nivel desconocido → good; valores vacíos no viajan.
  const odd=new URL(wallAvatarUrl('ultra',{loc:'',sector:'cafeteria'}));
  assert.equal(odd.searchParams.get('tier'),'good');
  assert.equal(odd.searchParams.has('loc'),false);
  for(const level of Object.keys(AVATAR_WALL_RENDERERS))assert.ok(wallAvatarUrl(level,AVATAR_WALL_CONTEXT).startsWith(AVATAR_WALL_RENDERERS[level]));
});

test('twin avatar takes the sector from the project, not xtanco-generic',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/AVATAR3D_SECTOR_BY_VERTICAL=\{xtanco:'estanco',cafeteria:'cafeteria'/);
  assert.match(html,/project==='starbucks'\|\|project==='cafebreria'\) return 'cafeteria'/);
  assert.match(html,/\+avatar3dContextQS\(AVATAR3D\.totemUrl\)\+'&lang='/);
  assert.match(html,/'embed=1&'\+avatar3dContextQS\(AVATAR3D\.totemUrl\)/);
  assert.match(html,/sector:avatar3dSector\(\),brand:avatar3dBrand\(\)\|\|undefined,tier:'better'/);
  assert.match(html,/defineProperty\(window,'AdmiraAvatarContext'/);
  const panorama=fs.readFileSync(new URL('./matrix-panorama.mjs',import.meta.url),'utf8');
  assert.match(panorama,/mountWallAvatar\(surface,\{t,onChange:[^\n]*live:\(\)=>/,'the wall avatar receives the now-playing track');
});
