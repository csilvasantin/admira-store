// Same-origin paid PA generation. The existing perimeter session is mandatory.
import {mediaAccess,requestId} from '../_media-access.js';
export const ANNOUNCEMENT_VOICES={es:{male:'Nh2zY9kknu6z4pZy6FhD',female:'KHCvMklQZZo0O30ERnVn'},en:{male:'EkK5I93UQWFDigLMpZcX',female:'56AoDkrOh6qfVPDXZ7Pt'}};
const json=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function onRequest({request,env},fetchImpl=fetch){
  if(request.method!=='POST')return json('method_not_allowed',405);
  const access=await mediaAccess(request,env,fetchImpl);if(access.response)return access.response;
  let body;try{body=await request.json();}catch(_){return json('invalid_json',400);}
  const language=body?.language===undefined?'es':body.language,id=requestId(body);
  const text=typeof body?.text==='string'?body.text.trim():'';
  if(!id||!text||text.length>1500||!['male','female'].includes(body?.voice)||!['es','en'].includes(language))return json('invalid_announcement',400);
  if(!env.ANNOUNCEMENT_TTS?.generate)return json('tts_unavailable',503);
  try{
    const res=await env.ANNOUNCEMENT_TTS.generate({text,voice:body.voice,language,owner:access.owner,requestId:id,archive:true});
    if(String(res.headers.get('Content-Type')).includes('application/json'))return new Response(res.body,{status:res.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
    if(!res.ok||!String(res.headers.get('Content-Type')).startsWith('audio/'))return json('tts_generation_failed',502);
    return new Response(res.body,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store','X-Announcement-Model':'eleven_v4','X-Announcement-Format':'mp3_44100_192','X-Announcement-Language':language,...Object.fromEntries(['X-Stock-Id','X-Stock-Url','X-Stock-Num','X-Media-Job'].map(k=>[k,res.headers.get(k)||'']))}});
  }catch(_){return json('tts_generation_failed',502);}
}
