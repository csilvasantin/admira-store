import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
// Desde la web pública, cualquier fetch a localhost dispara el permiso de Chrome «acceder a otras
// aplicaciones y servicios de este dispositivo». Todo sondeo local pasa por LOCAL_BRIDGE (Carlos, 30-sep-2026).
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('el puente local es opt-in: servido en local o ?local=1 recordado',()=>{
 assert.match(html,/var LOCAL_BRIDGE=\(\(\)=>\{/);
 assert.match(html,/get\('local'\)/);assert.match(html,/xpaceos\.localBridge/);
});
test('ninguna URL a localhost/127.0.0.1 se usa fuera del puente, de la página local o de http',()=>{
 const lines=html.split('\n');const offenders=[];
 lines.forEach((line,i)=>{
  if(!/(localhost|127\.0\.0\.1):\$?\{?[\w.]*\}?\d*/.test(line)||/^\s*(\/\/|\*)/.test(line))return;
  if(!/https?:\/\/(localhost|127\.0\.0\.1)/.test(line))return;
  const ctx=lines.slice(Math.max(0,i-8),i+1).join('\n');
  if(/function local(Telegram|Grok)BaseUrl|LOCAL_BRIDGE|isLocal\s*\?|location\.protocol==='http:'|protocol==='http:'|uiless\.html/.test(ctx))return;
  offenders.push((i+1)+': '+line.trim().slice(0,120));
 });
 assert.deepEqual(offenders,[]);
});
