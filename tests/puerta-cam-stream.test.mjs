// Directo de Puerta Cam sin abrir IEU (Carlos, 22-oct-2026): el servidor pide el enlace con el token de cámaras.
import test from 'node:test';import assert from 'node:assert/strict';
import {onRequest,streamUrlFrom,redact,streamRequest,cameraToken,relatedVariables,IEU,LOGIN_PATH} from '../functions/xpacios/sneakerstore/puerta-cam-stream.js';
import {siteForHost} from '../functions/_perimetro.js';

const origin='https://www.admira.store',site=siteForHost('www.admira.store'),path='/xpacios/sneakerstore/puerta-cam-stream';
const TOKEN='ieu-token-de-prueba-que-nunca-sale';
const CAMERA='{"site_id":"store","device_id":"puerta-cam"}';
const base={PERIMETRO_SIGNING_KEY:'test-signing-key'};
async function cookie(email){
  const now=Math.floor(Date.now()/1000),part=Buffer.from(JSON.stringify({v:1,aud:site.id,email,iat:now,exp:now+60})).toString('base64url');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(base.PERIMETRO_SIGNING_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return '__Host-perimetro_session='+part+'.'+Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('perimetro:'+part))).toString('base64url');
}
async function call({method='POST',query='',email='csilvasantin@gmail.com',originHeader=origin,env={},ieu=async()=>Response.json({url:IEU+'/hub/streams/T1/index.m3u8'})}={}){
  const calls=[];
  const fetcher=async(url,options={})=>{calls.push({url:String(url),options});if(String(url).startsWith(IEU))return ieu(String(url),options);return Response.json({ok:true,allowed:true,superuser:false});};
  const headers={Accept:'application/json',...(originHeader?{Origin:originHeader}:{}),...(email?{Cookie:await cookie(email)}:{})};
  const res=await onRequest({request:new Request(origin+path+query,{method,headers}),env:{...base,...env}},fetcher);
  return {res,body:await res.json(),calls,ieuCalls:calls.filter(c=>c.url.startsWith(IEU))};
}

test('el enlace firmado del directo se encuentra en cualquier forma de respuesta de IEU, y nada más se entrega',()=>{
  assert.equal(streamUrlFrom({stream:{url:IEU+'/hub/streams/T1/index.m3u8'}}),IEU+'/hub/streams/T1/index.m3u8');
  assert.equal(streamUrlFrom({path:'/hub/streams/T2/live.m3u8'}),IEU+'/hub/streams/T2/live.m3u8');
  assert.equal(streamUrlFrom([{x:1},{links:['https://evil.example/hub/streams/T/a.m3u8',IEU+'/hub/streams/T3/a.m3u8']}]),IEU+'/hub/streams/T3/a.m3u8');
  for(const bad of [{url:'https://evil.example/hub/streams/T/a.m3u8'},{url:IEU+'/api/other'},{url:IEU+'/hub/streams/'},'javascript:alert(1)',null])assert.equal(streamUrlFrom(bad),null);
  assert.deepEqual(redact({a:IEU+'/hub/streams/T1/index.m3u8',b:'texto'}),{a:'[enlace firmado]',b:'texto'});
  assert.deepEqual(streamRequest({IEU_PUERTA_CAM_STREAM:CAMERA}),{site_id:'store',device_id:'puerta-cam'});
  for(const raw of [undefined,'','[]','nope'])assert.equal(streamRequest({IEU_PUERTA_CAM_STREAM:raw}),null);
  // El cuerpo vive en el código (no es secreto); la variable de entorno lo sustituye sin desplegar.
  assert.deepEqual(streamRequest({},{camera_id:'c-1'}),{camera_id:'c-1'});assert.deepEqual(streamRequest({IEU_PUERTA_CAM_STREAM:CAMERA},{camera_id:'c-1'}),{site_id:'store',device_id:'puerta-cam'});
});

test('con sesión y configurado, pide el enlace a IEU con el token y lo entrega sin el token',async()=>{
  const r=await call({env:{IEU_CAMERA_TOKEN:TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA}});
  assert.equal(r.res.status,200);assert.deepEqual(r.body,{ok:true,url:IEU+'/hub/streams/T1/index.m3u8'});
  assert.equal(r.ieuCalls.length,1);const c=r.ieuCalls[0];
  assert.equal(c.url,IEU+'/hub/streams');assert.equal(c.options.method,'POST');assert.equal(c.options.headers.Authorization,'Bearer '+TOKEN);assert.equal(c.options.body,CAMERA);
  assert.equal(JSON.stringify(r.body).includes(TOKEN),false);assert.equal(r.res.headers.get('cache-control'),'no-store');
});

test('sin sesión, desde otra web, sin token o sin cámara configurada no se pide nada a IEU',async()=>{
  const sinSesion=await call({email:'',env:{IEU_CAMERA_TOKEN:TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA}});
  assert.equal(sinSesion.res.status,401);assert.deepEqual(sinSesion.body,{ok:false,error:'login_required',login:LOGIN_PATH});
  const ajena=await call({email:'alguien@example.com',env:{IEU_CAMERA_TOKEN:TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA}});assert.equal(ajena.res.status,401,'sin permiso en la lista');
  const otraWeb=await call({originHeader:'https://evil.example',env:{IEU_CAMERA_TOKEN:TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA}});assert.equal(otraWeb.res.status,403);
  const sinOrigen=await call({originHeader:'',env:{IEU_CAMERA_TOKEN:TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA}});assert.equal(sinOrigen.res.status,403);
  const sinToken=await call({env:{IEU_PUERTA_CAM_STREAM:CAMERA}});assert.equal(sinToken.res.status,503);assert.equal(sinToken.body.error,'not_configured');
  const sinCamara=await call({env:{IEU_CAMERA_TOKEN:TOKEN}});assert.equal(sinCamara.res.status,503);assert.equal(sinCamara.body.error,'camera_not_configured');
  for(const r of [sinSesion,ajena,otraWeb,sinOrigen,sinToken,sinCamara])assert.equal(r.ieuCalls.length,0);
  const metodo=await call({method:'PUT'});assert.equal(metodo.res.status,405);
});

test('si IEU rechaza o devuelve otra cosa, se dice sin pasar su respuesta',async()=>{
  const env={IEU_CAMERA_TOKEN:TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA};
  const rechazo=await call({env,ieu:async()=>Response.json({ok:false,error:'unauthorized'},{status:401})});assert.equal(rechazo.res.status,502);assert.deepEqual(rechazo.body,{ok:false,error:'ieu_401'});
  const otro=await call({env,ieu:async()=>Response.json({url:'https://evil.example/hub/streams/T/a.m3u8'})});assert.deepEqual(otro.body,{ok:false,error:'ieu_no_stream'});
  const caido=await call({env,ieu:async()=>{throw Error('red');}});assert.deepEqual(caido.body,{ok:false,error:'ieu_unreachable'});
});

test('el diagnóstico es solo para administradores y enseña lo que pide IEU sin token ni enlaces firmados',async()=>{
  const env={IEU_CAMERA_TOKEN:TOKEN};
  const ieu=async(url,options)=>{
    if(url===IEU+'/hub/streams')return Response.json({detail:[{loc:['body','site_id'],msg:'Field required'},{loc:['body','camera_id'],msg:'Field required'}]},{status:422});
    const msg=JSON.parse(options.body);
    if(msg.method==='initialize')return new Response(JSON.stringify({jsonrpc:'2.0',id:msg.id,result:{protocolVersion:'2025-06-18'}}),{headers:{'Content-Type':'application/json','Mcp-Session-Id':'s-1'}});
    if(msg.method==='notifications/initialized')return new Response(null,{status:202});
    assert.equal(options.headers['Mcp-Session-Id'],'s-1');
    if(msg.method==='tools/list')return new Response('event: message\ndata: '+JSON.stringify({jsonrpc:'2.0',id:msg.id,result:{tools:[{name:'list_cameras',description:'Cámaras',inputSchema:{type:'object',properties:{}}},{name:'camera_live_link',description:'Enlace al directo',inputSchema:{type:'object',required:['camera_id']}}]}})+'\n\n',{headers:{'Content-Type':'text/event-stream'}});
    if(msg.method==='tools/call'){assert.equal(msg.params.name,'list_cameras');return Response.json({jsonrpc:'2.0',id:msg.id,result:{content:[{type:'text',text:'Puerta Cam · cam-42 · '+IEU+'/hub/streams/T9/x.m3u8'}]}});}
    throw Error('inesperado '+msg.method);
  };
  const r=await call({method:'GET',query:'?diagnostico=1',env,ieu});
  assert.equal(r.res.status,200);assert.equal(r.body.configured,false);
  assert.deepEqual(r.body.diagnostico.streams.body.detail.map(d=>d.loc.at(-1)),['site_id','camera_id']);
  assert.deepEqual(r.body.diagnostico.mcp.tools.map(t=>t.name),['list_cameras','camera_live_link']);
  assert.deepEqual(Object.keys(r.body.diagnostico.mcp.listings),['list_cameras'],'solo herramientas de listado sin parámetros obligatorios');
  const text=JSON.stringify(r.body);assert.equal(text.includes(TOKEN),false);assert.equal(text.includes('/hub/streams/T9/'),false,'enlaces firmados tachados');
  const noAdmin=await call({method:'GET',query:'?diagnostico=1',email:'colaborador@admira.com',env:{...env,WHITELIST_SITE_TOKEN:'w'}});
  assert.equal(noAdmin.res.status,403);assert.equal(noAdmin.ieuCalls.length,0);
  const sinParam=await call({method:'GET',env});assert.equal(sinParam.res.status,404);
});

test('sin token, el diagnóstico de un administrador enseña qué variables de IEU llegan (solo nombres) y un nombre con espacios o minúsculas vale',async()=>{
  const env={' ieu_camera_token ':TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA,OTRA:'x',CAMARAS:{binding:true}};
  assert.equal(cameraToken(env),TOKEN);assert.equal(cameraToken({IEU_CAMERA_TOKEN:TOKEN}),TOKEN);assert.equal(cameraToken({IEU_TOKEN:TOKEN}),'');
  assert.deepEqual(relatedVariables(env),[' ieu_camera_token ','IEU_PUERTA_CAM_STREAM'],'solo cadenas; los bindings no');
  const ok=await call({env});assert.equal(ok.res.status,200);assert.equal(ok.ieuCalls[0].options.headers.Authorization,'Bearer '+TOKEN);
  const sinToken={IEU_TOKEN:TOKEN,IEU_PUERTA_CAM_STREAM:CAMERA};
  const diag=await call({method:'GET',query:'?diagnostico=1',env:sinToken});
  assert.equal(diag.res.status,503);assert.deepEqual(diag.body,{ok:false,error:'not_configured',variables:['IEU_PUERTA_CAM_STREAM','IEU_TOKEN']});
  assert.equal(JSON.stringify(diag.body).includes(TOKEN),false,'nunca valores');
  const post=await call({env:sinToken});assert.deepEqual(post.body,{ok:false,error:'not_configured'},'fuera del diagnóstico no se enseñan nombres');
  const noAdmin=await call({method:'GET',query:'?diagnostico=1',email:'colaboradora@admira.com',env:{...sinToken,WHITELIST_SITE_TOKEN:'w'}});
  assert.deepEqual(noAdmin.body,{ok:false,error:'not_configured'},'ni a quien no es administrador');
});
