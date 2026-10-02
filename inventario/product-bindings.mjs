export const BINDINGS_KEY='xpaceos:shelf-product-bindings:v1',PREVIEW_CHANNEL='xpaceos:shelf-screen-preview:v1';
export function validContent(input){
 let u;try{u=new URL(input.url);}catch{throw Error('Introduce una URL HTTPS válida');}
 if(u.protocol!=='https:'||u.username||u.password||u.href.length>4096||!['image','video'].includes(input.kind))throw Error('El contenido debe ser una imagen o vídeo HTTPS');
 return {surfaceId:'ds1',kind:input.kind,url:u.href,title:String(input.title||'Contenido del producto').slice(0,200),...(input.contentId?{contentId:String(input.contentId).slice(0,200)}:{}),updatedAt:Date.now()};
}
export function loadBindings(storage=localStorage){
 const empty={schema_version:1,context:'xtanco',bindings:{}};
 try{const d=JSON.parse(storage.getItem(BINDINGS_KEY)||'null');if(d?.schema_version!==1||d.context!=='xtanco'||!d.bindings||Array.isArray(d.bindings)||typeof d.bindings!=='object')return empty;for(const [ref,value]of Object.entries(d.bindings)){if(!/^A02-0[1-6]$/.test(ref)||value?.surfaceId!=='ds1')continue;try{empty.bindings[ref]={...validContent(value),updatedAt:value.updatedAt};}catch{}}return empty;}catch{return empty;}
}
export function saveBinding(reference,input,storage=localStorage){
 if(!/^A02-0[1-6]$/.test(reference))throw Error('Referencia de producto inválida');const d=loadBindings(storage);d.bindings[reference]=validContent(input);storage.setItem(BINDINGS_KEY,JSON.stringify(d));return d.bindings[reference];
}
export function removeBinding(reference,storage=localStorage){const d=loadBindings(storage);delete d.bindings[reference];storage.setItem(BINDINGS_KEY,JSON.stringify(d));}
export function sendPreview(action,part,content,{target=window,storage=localStorage,id=crypto.randomUUID()}={}){
 const message={schema_version:1,id,createdAt:Date.now(),context:'xtanco',surfaceId:'ds1',action,...(action==='preview'?{...validContent(content),productId:part.id}:{})};
 storage.setItem(PREVIEW_CHANNEL,JSON.stringify(message));target.dispatchEvent(new CustomEvent(PREVIEW_CHANNEL,{detail:message}));return message.id;
}
