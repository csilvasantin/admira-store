import {mediaAccess,mediaJson,requestId} from '../_media-access.js';
export async function onRequest({request,env},fetchImpl=fetch){
 if(request.method!=='GET')return mediaJson('method_not_allowed',405);
 const access=await mediaAccess(request,env,fetchImpl);if(access.response)return access.response;
 const id=requestId({requestId:new URL(request.url).searchParams.get('requestId')});if(!id)return mediaJson('invalid_media_request',400);
 if(!env.ANNOUNCEMENT_TTS?.getMedia)return mediaJson('media_unavailable',503);
 try{const res=await env.ANNOUNCEMENT_TTS.getMedia({owner:access.owner,requestId:id});return new Response(res.body,{status:res.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}catch(_){return mediaJson('media_status_unavailable',502);}
}
