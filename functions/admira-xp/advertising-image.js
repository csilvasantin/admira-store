// Authenticated, same-origin retail image preview via the existing private service.
import {readSession,siteForHost} from '../_perimetro.js';
const json=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function onRequest({request,env},fetchImpl=fetch){
  if(request.method!=='POST')return json('method_not_allowed',405);
  const url=new URL(request.url),site=siteForHost(url.hostname);
  if(!site||!await readSession(request,env,site,fetchImpl))return json('login_required',401);
  if(request.headers.get('Origin')!==url.origin)return json('invalid_origin',403);
  let body;try{body=await request.json();}catch(_){return json('invalid_json',400);}
  const text=typeof body?.text==='string'?body.text.trim():'';
  const language=body?.language===undefined?'es':body.language;
  if(!text||text.length>1500||!['es','en'].includes(language))return json('invalid_image_brief',400);
  if(!env.ANNOUNCEMENT_TTS?.generateImage)return json('image_unavailable',503);
  try{
    const res=await env.ANNOUNCEMENT_TTS.generateImage({text,language});
    if(!res.ok)return json('image_generation_failed',502);
    return new Response(res.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }catch(_){return json('image_generation_failed',502);}
}
