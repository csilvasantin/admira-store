// Same-origin paid PA generation. The existing perimeter session is mandatory.
import {readSession,siteForHost} from '../_perimetro.js';
export const ANNOUNCEMENT_VOICES={male:'Nh2zY9kknu6z4pZy6FhD',female:'KHCvMklQZZo0O30ERnVn'};
const json=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function onRequest({request,env},fetchImpl=fetch){
  if(request.method!=='POST')return json('method_not_allowed',405);
  const url=new URL(request.url),site=siteForHost(url.hostname);
  if(!site||!await readSession(request,env,site,fetchImpl))return json('login_required',401);
  if(request.headers.get('Origin')!==url.origin)return json('invalid_origin',403);
  let body;try{body=await request.json();}catch(_){return json('invalid_json',400);}
  const text=typeof body?.text==='string'?body.text.trim():'';
  if(!text||text.length>1500||!['male','female'].includes(body?.voice))return json('invalid_announcement',400);
  if(!env.ANNOUNCEMENT_TTS?.generate)return json('tts_unavailable',503);
  try{
    const res=await env.ANNOUNCEMENT_TTS.generate({text,voice:body.voice});
    if(!res.ok||!String(res.headers.get('Content-Type')).startsWith('audio/'))return json('tts_generation_failed',502);
    return new Response(res.body,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store','X-Announcement-Model':'eleven_v4','X-Announcement-Format':'mp3_44100_192'}});
  }catch(_){return json('tts_generation_failed',502);}
}
