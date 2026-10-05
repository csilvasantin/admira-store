import {mediaPost} from '../_media-access.js';
export const onRequest=(context,fetchImpl=fetch)=>mediaPost(context,'video',fetchImpl);
