import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {perimetro,readSession,siteForHost} from '../functions/_perimetro.js';
const env={PERIMETRO_SIGNING_KEY:'k'.repeat(64),WHITELIST_SITE_TOKEN:'t'.repeat(64)};
const ctx=(request,e=env)=>({request,env:e,next:async()=>new Response('<html>app</html>')});
const b64=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
const source=readFileSync(new URL('../admira-xp/scripts/session-access.js',import.meta.url),'utf8');

test('human app entry requests identity; embedded players and assets remain public',async()=>{
 const unavailable=async()=>{throw Error('unavailable');};
 for(const host of ['www.admira.store','www.xpaceos.com']){
  const page=await perimetro(ctx(new Request('https://'+host+'/admira-xp/?project=starbucks&lang=en',{headers:{'Sec-Fetch-Dest':'document'}})),unavailable);
  assert.equal(page.status,302);assert.ok(page.headers.get('location').includes('return_to=%2Fadmira-xp%2F%3Fproject%3Dstarbucks%26lang%3Den'));
  assert.equal((await perimetro(ctx(new Request('https://'+host+'/admira-xp/',{headers:{'Sec-Fetch-Dest':'iframe'}})),unavailable)).status,200);
  assert.equal((await perimetro(ctx(new Request('https://'+host+'/assets/logo.png')),unavailable)).status,200);
 }
});

test('verified Google session persists 30 days, renews on use, and still respects revocation',async()=>{
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'session-test',alg:'RS256'};
 const now=Math.floor(Date.now()/1000),nonce='n'.repeat(44),email='retained.session.test@admira.com';
 const input=b64({alg:'RS256',kid:jwk.kid})+'.'+b64({iss:'https://accounts.google.com',aud:'861856772040-e1ri6kpu6maagtb6crdfbb923hsaalgb.apps.googleusercontent.com',sub:'google-sub',email,email_verified:true,hd:'admira.com',nonce,exp:now+3600});
 const credential=input+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input))).toString('base64url');
 let allowed=true;
 const network=async url=>url.includes('/certs')?Response.json({keys:[jwk]}):Response.json({ok:true,allowed,superuser:false});
 const form=new FormData();form.set('credential',credential);
 const login=await perimetro(ctx(new Request('https://www.admira.store/auth/callback',{method:'POST',body:form,headers:{Origin:'https://accounts.google.com',Cookie:'__Host-perimetro_nonce='+nonce+'; __Host-perimetro_return=%2Fadmira-xp%2F'}})),network);
 assert.equal(login.status,302);assert.equal(login.headers.get('location'),'/admira-xp/');
 const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/Max-Age=2592000; HttpOnly; Secure; SameSite=Lax/);
 const request=new Request('https://www.admira.store/auth/session',{headers:{Cookie:cookie}});
 const originalNow=Date.now;
 try{
  Date.now=()=> (now+13*3600)*1000;
  const current=await perimetro(ctx(request),network);assert.equal(current.status,200);
  const renewed=current.headers.get('set-cookie');assert.match(renewed,/Max-Age=2592000/);assert.notEqual(renewed.split(';')[0],cookie);
  const decoded=JSON.parse(Buffer.from(renewed.split(';')[0].split('=')[1].split('.')[0],'base64url'));assert.equal(decoded.exp-decoded.iat,2592000);
  Date.now=()=> (now+13*3600+61)*1000;allowed=false;
  assert.equal((await perimetro(ctx(request),network)).status,401,'permission revocation still closes access');
  assert.equal(await readSession(new Request('https://www.xpaceos.com/auth/session',{headers:{Cookie:cookie}}),env,siteForHost('www.xpaceos.com'),network),null,'cookie is not shared across domains');
  Date.now=()=> (now+31*86400)*1000;assert.equal((await perimetro(ctx(request),network)).status,401,'inactive expired session does not reopen');
 }finally{Date.now=originalNow;}
});

test('Google auto sign-in is offered, explicit logout and login errors suppress it',async()=>{
 const noNetwork=async()=>{throw Error('network');};
 const login=await perimetro(ctx(new Request('https://www.admira.store/auth/login?return_to=%2Fadmira-xp%2F')),noNetwork);
 const html=await login.text();assert.match(html,/data-auto_select="true"/);assert.match(html,/data-hd="admira.com"/);assert.match(html,/30 días/);
 const logout=await perimetro(ctx(new Request('https://www.admira.store/auth/logout')),noNetwork);assert.equal(logout.headers.get('location'),'/auth/login?signed_out=1');
 const signedOut=await perimetro(ctx(new Request('https://www.admira.store'+logout.headers.get('location'))),noNetwork);assert.match(await signedOut.text(),/data-auto_select="false"/);
 const failed=await perimetro(ctx(new Request('https://www.admira.store/auth/callback',{method:'POST',body:new FormData()})),noNetwork);assert.match(await failed.text(),/data-auto_prompt="false"/);
});

test('static XpaceOS human route reaches the authenticated app without changing project or embedded players',()=>{
 for(const embedded of [false,true]){
  let redirected;const win={location:{hostname:'www.xpaceos.com',pathname:'/admira-xp/',search:'?project=starbucks&loc=sbux&lang=en',hash:'#desk',replace:url=>{redirected=url;}},document:{readyState:'loading',addEventListener(){}},addEventListener(){}};win.self=win;win.top=embedded?{}:win;
  vm.runInNewContext(source,{window:win,URL});
  assert.equal(redirected,embedded?undefined:'https://www.admira.store/admira-xp/?project=starbucks&loc=sbux&lang=en#desk');
 }
});

test('an existing 24-hour human session migrates immediately on a paid-generation request',async()=>{
 const now=Math.floor(Date.now()/1000),part=b64({v:1,aud:'admira-store',email:'legacy.session.test@admira.com',sub:'legacy-sub',iat:now-3600,exp:now+23*3600});
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.PERIMETRO_SIGNING_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('perimetro:'+part))).toString('base64url');
 const request=new Request('https://www.admira.store/admira-xp/advertising-image',{method:'POST',headers:{Cookie:'__Host-perimetro_session='+part+'.'+signature,Origin:'https://www.admira.store','Sec-Fetch-Dest':'empty'}});
 const response=await perimetro(ctx(request),async()=>Response.json({ok:true,allowed:true}));
 assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/Max-Age=2592000/);
});

test('XpaceOS routing retains saved language and quality without overwriting explicit choices or moving private data',()=>{
 const values=new Map([['xtanco_lang','es'],['xtanco_render','matrix'],['cli_history','private local history']]);let redirected;
 const win={location:{hostname:'xpaceos.com',pathname:'/admira-xp/',search:'?project=starbucks',hash:'',replace:url=>redirected=url},localStorage:{getItem:key=>values.get(key)},document:{}};win.self=win;win.top=win;
 vm.runInNewContext(source,{window:win,URL});const url=new URL(redirected);assert.equal(url.searchParams.get('lang'),'es');assert.equal(url.searchParams.get('quality'),'matrix');assert.equal(values.get('cli_history'),'private local history');assert.equal(url.searchParams.has('cli_history'),false);
});
