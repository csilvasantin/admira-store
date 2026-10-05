import {readSession,siteForHost} from './_perimetro.js';
export const mediaJson=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function mediaAccess(request,env,fetchImpl=fetch){
 const url=new URL(request.url),site=siteForHost(url.hostname);
 const session=site&&await readSession(request,env,site,fetchImpl);
 if(!session)return {response:mediaJson('login_required',401)};
 if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return {response:mediaJson('invalid_origin',403)};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(site.id+'|'+session.email));
 return {owner:Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('')};
}
export function requestId(body){return body?.requestId===undefined?crypto.randomUUID():/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.requestId)?body.requestId:null;}
export async function mediaPost({request,env},kind,fetchImpl=fetch){
 if(request.method!=='POST')return mediaJson('method_not_allowed',405);
 const access=await mediaAccess(request,env,fetchImpl);if(access.response)return access.response;
 let body;try{body=await request.json();}catch(_){return mediaJson('invalid_json',400);}
 const text=typeof body?.text==='string'?body.text.trim():'',language=body?.language===undefined?'es':body.language,id=requestId(body);
 if(!text||text.length>1500||!['es','en'].includes(language)||!id)return mediaJson('invalid_media_request',400);
 const method=kind==='video'?'startVideo':'generateImage';
 if(!env.ANNOUNCEMENT_TTS?.[method])return mediaJson('media_unavailable',503);
 try{const res=await env.ANNOUNCEMENT_TTS[method]({text,language,owner:access.owner,requestId:id});return new Response(res.body,{status:res.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}catch(_){return mediaJson('media_generation_failed',502);}
}
