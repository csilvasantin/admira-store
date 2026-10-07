import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {wallAvatarUrl,wallAvatarLevel,AVATAR_WALL_CONTEXT,AVATAR_WALL_RENDERERS} from './matrix-wall-avatar.mjs';

// Contexto de cliente del avatar en la pared Alsea (06-10-2026): habla de café en cada nivel.
test('wall avatar URL carries Starbucks Alsea context and the avatar tier',()=>{
  const good=new URL(wallAvatarUrl('good',{...AVATAR_WALL_CONTEXT,lang:'es'}));
  assert.equal(good.origin+good.pathname,'https://digitalavatar.ai/nube.html');
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
  assert.match(html,/\+avatar3dContextQS\(base\)\+'&lang='/);
  assert.match(html,/'embed=1&'\+avatar3dContextQS\(base\)/);
  // Good = Admirito (nube.html) en el tótem y la pared larga; una totemUrl configurada manda.
  assert.match(html,/AVATAR3D_TOTEM_GOOD='https:\/\/digitalavatar\.ai\/nube\.html\?kiosk=1'/);
  assert.match(html,/return \(!AVATAR3D\.totemFixed&&lv==='good'\)\?AVATAR3D_TOTEM_GOOD:AVATAR3D\.totemUrl/);
  assert.match(html,/\/\(nube\|better\)\\\.html\/\.test\(u\)\?'good'/);
  assert.match(html,/sector:avatar3dSector\(\),brand:avatar3dBrand\(\)\|\|undefined,question:clean/);
  assert.match(html,/avatarIdentityFromQuality\(\)\)\)\}/);
  assert.match(html,/if\(q==='better'\) return \{tier:'better', avatar:'alex'\}/);
  assert.match(html,/defineProperty\(window,'AdmiraAvatarContext'/);
  const panorama=fs.readFileSync(new URL('./matrix-panorama.mjs',import.meta.url),'utf8');
  assert.match(panorama,/mountWallAvatar\(surface,\{t,onChange:[^\n]*live:\(\)=>/,'the wall avatar receives the now-playing track');
});

// Assistant defaults to Good independently of Matrix quality or legacy saved level.
test('wall avatar level: explicit tab choice > Good; visual quality and legacy level do not select the assistant',()=>{
  assert.equal(wallAvatarLevel({tier:'best',stored:'good'}),'good');
  assert.equal(wallAvatarLevel({chosen:'better',tier:'best',stored:'good'}),'better');
  assert.equal(wallAvatarLevel({tier:'',stored:'better'}),'good');
  assert.equal(wallAvatarLevel({chosen:'x',tier:'matrix'}),'good');
  assert.equal(wallAvatarLevel(),'good');
  const src=fs.readFileSync(new URL('./matrix-panorama.mjs',import.meta.url),'utf8');
  assert.match(src,/addEventListener\('admira-avatar:open',e=>\{if\(disposed\)return;e\.preventDefault\(\);focusAvatar\(\);\}/);
  assert.match(src,/case 'avatar':focusAvatar\(\);break;/);
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/AVATAR3D_LEVEL_BY_VISUAL=\{good:'good',better:'better',best:'best',matrix:'best'\}/);
  assert.match(html,/tier='good',c=\{sector:avatar3dSector\(\),lang:avatar3dLang\(\)\}/);
});

test('music controls remain in toolbar with both scene hotspots removed',()=>{
 const source=fs.readFileSync(new URL('./matrix-panorama.mjs',import.meta.url),'utf8');
 assert.ok(!source.includes('matrix-speaker'));
 assert.ok(!source.includes('matrix-exit-next'));
 assert.match(source,/data-music-toggle type="button"/);
 assert.match(source,/data-music-next type="button"/);
});
