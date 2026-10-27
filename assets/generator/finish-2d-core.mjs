// Browser-independent RGBA processing. All changes derive from the session master.
export const SPRITE_SCHEMA='admira.sprite/1';
export const FACING_ORDER=['front-right','front-left','back-left','back-right'];
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
export function validateSettings(value={}){
 const mode=value.mode??'auto',count=Number(value.count??16),width=Number(value.width??64),height=Number(value.height??64);
 if(!['original','auto','custom'].includes(mode))fail('invalid-palette');
 if(![8,16,32].includes(count))fail('invalid-count');
 if(![width,height].every(n=>Number.isInteger(n)&&n>=16&&n<=256))fail('invalid-size');
 const colors=Array.isArray(value.colors)?value.colors.map(c=>String(c).toLowerCase()):[];
 if(mode==='custom'&&(colors.length!==count||!colors.every(c=>/^#[0-9a-f]{6}$/.test(c))))fail('invalid-custom-palette');
 return {mode,count,width,height,colors};
}
export function validateSource(source){
 const {width,height,data}=source||{},frames=source?.frames??1;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16777216||!data||data.length!==width*height*4)fail('invalid-source');
 if(![1,4].includes(frames)||width%frames!==0||(source.frameW!==undefined&&source.frameW!==width/frames))fail('invalid-frames');
 return {width,height,frames,frameW:width/frames,data};
}
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const hex=rgb=>'#'+rgb.map(c=>Math.round(c).toString(16).padStart(2,'0')).join('');
export function automaticPalette(source,count=16){
 const s=validateSource(source);if(![8,16,32].includes(count))fail('invalid-count');
 // Five-bit histogram bounds memory even for a detailed imported photograph.
 const bins=new Map();
 for(let i=0;i<s.data.length;i+=4){const a=s.data[i+3];if(!a)continue;const [r,g,b]=s.data.subarray?s.data.subarray(i,i+3):s.data.slice(i,i+3),key=(r>>3)*1024+(g>>3)*32+(b>>3);let bin=bins.get(key);if(!bin){bin={weight:0,sum:[0,0,0]};bins.set(key,bin);}bin.weight+=a;bin.sum[0]+=r*a;bin.sum[1]+=g*a;bin.sum[2]+=b*a;}
 if(!bins.size)fail('empty-sprite');
 let boxes=[[...bins.values()].map(b=>({weight:b.weight,color:b.sum.map(n=>n/b.weight)}))];
 while(boxes.length<count){let chosen=-1,channel=0,best=-1;
  boxes.forEach((box,index)=>{if(box.length<2)return;const weight=box.reduce((sum,c)=>sum+c.weight,0);for(let k=0;k<3;k++){const values=box.map(c=>c.color[k]),range=Math.max(...values)-Math.min(...values),score=range*Math.sqrt(weight);if(score>best){best=score;chosen=index;channel=k;}}});
  if(chosen<0)break;
  const box=[...boxes[chosen]].sort((a,b)=>a.color[channel]-b.color[channel]),total=box.reduce((sum,c)=>sum+c.weight,0);let sum=0,split=1;
  for(let i=0;i<box.length-1;i++){sum+=box[i].weight;split=i+1;if(sum>=total/2)break;}
  boxes.splice(chosen,1,box.slice(0,split),box.slice(split));
 }
 return [...new Set(boxes.map(box=>{const total=box.reduce((sum,c)=>sum+c.weight,0);return hex([0,1,2].map(k=>box.reduce((sum,c)=>sum+c.color[k]*c.weight,0)/total));}))].sort((a,b)=>rgb(a).reduce((sum,c)=>sum+c,0)-rgb(b).reduce((sum,c)=>sum+c,0));
}
export function fitRect(sourceWidth,sourceHeight,width,height){
 const scale=Math.min(width/sourceWidth,height/sourceHeight),w=Math.max(1,Math.min(width,Math.round(sourceWidth*scale))),h=Math.max(1,Math.min(height,Math.round(sourceHeight*scale)));
 return {x:Math.floor((width-w)/2),y:height-h,width:w,height:h};
}
export function finishSprite(source,settings={}){
 const s=validateSource(source),options=validateSettings(settings);
 if(!s.data.some((a,i)=>i%4===3&&a>0))fail('empty-sprite');
 const palette=options.mode==='original'?null:options.mode==='custom'?[...options.colors]:automaticPalette(s,options.count),colors=palette?.map(rgb),cache=new Map();
 const width=options.width*s.frames,height=options.height,data=new Uint8ClampedArray(width*height*4),rect=fitRect(s.frameW,s.height,options.width,options.height);
 for(let frame=0;frame<s.frames;frame++)for(let y=0;y<rect.height;y++)for(let x=0;x<rect.width;x++){
  const sx=Math.min(s.frameW-1,Math.floor((x+.5)*s.frameW/rect.width)),sy=Math.min(s.height-1,Math.floor((y+.5)*s.height/rect.height)),si=(sy*s.width+frame*s.frameW+sx)*4,di=((y+rect.y)*width+frame*options.width+x+rect.x)*4,a=s.data[si+3];
  if(!a)continue;
  let color=[s.data[si],s.data[si+1],s.data[si+2]];
  if(colors){const key=color[0]*65536+color[1]*256+color[2];if(cache.has(key))color=cache.get(key);else{let nearest=colors[0],best=Infinity;for(const c of colors){const distance=(color[0]-c[0])**2+(color[1]-c[1])**2+(color[2]-c[2])**2;if(distance<best){best=distance;nearest=c;}}cache.set(key,nearest);color=nearest;}}
  data[di]=color[0];data[di+1]=color[1];data[di+2]=color[2];data[di+3]=a;
 }
 return {width,height,frameW:options.width,frameH:options.height,frames:s.frames,data,palette,options,contentRect:rect,source:{width:s.width,height:s.height,frames:s.frames,frameW:s.frameW}};
}
export function selectSpriteFrames(result,selected='all',face=0){
 if(selected==='all')return result;
 if(selected!=='current'||!Number.isInteger(face)||face<0||face>=result.frames)fail('invalid-frame-selection');
 const data=new Uint8ClampedArray(result.frameW*result.frameH*4);
 for(let y=0;y<result.frameH;y++){const start=(y*result.width+face*result.frameW)*4;data.set(result.data.subarray(start,start+result.frameW*4),y*result.frameW*4);}
 return {...result,width:result.frameW,frames:1,data,selectedFace:face};
}
export function spriteManifest(result,context={},filename='sprite.png'){
 const fp=context.fp,ph=context.ph;
 if(!Array.isArray(fp)||fp.length!==2||!fp.every(n=>Number.isFinite(n)&&n>0)||!Number.isFinite(ph)||ph<=0)fail('invalid-placement');
 const source={...result.source,...(context.sourceHash?{rgbaSha256:context.sourceHash}:{})};
 return {schema:SPRITE_SCHEMA,type:'furni',title:String(context.title||'Sprite').slice(0,200),image:{file:filename,mime:'image/png',width:result.width,height:result.height},frames:result.frames,frameW:result.frameW,frameH:result.frameH,facing:result.frames===4?[...FACING_ORDER]:[FACING_ORDER[result.selectedFace??0]],anchor:{x:.5,y:1},contentRect:{...result.contentRect},fp:[...fp],ph,source,palette:{mode:result.options.mode,limit:result.options.mode==='original'?null:result.options.count,colors:result.palette?[...result.palette]:null,transparency:'preserve-alpha'}};
}
export function spriteFilename(title,result){const name=String(title||'sprite').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'sprite';return name+'-'+result.frameW+'x'+result.frameH+(result.frames===4?'-4-caras':'');}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc32=bytes=>{let crc=0xffffffff;for(const n of bytes)crc=crcTable[(crc^n)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};
export function spriteZip(files){
 const encoder=new TextEncoder(),parts=[],central=[];let offset=0,centralSize=0;
 for(const {name,data} of files){if(typeof name!=='string'||!name||/[\\/]/.test(name)||!(data instanceof Uint8Array))fail('invalid-zip-file');const n=encoder.encode(name),crc=crc32(data),local=new Uint8Array(30+n.length),v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,n.length,true);local.set(n,30);parts.push(local,data);
  const c=new Uint8Array(46+n.length),d=new DataView(c.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,n.length,true);d.setUint32(42,offset,true);c.set(n,46);central.push(c);centralSize+=c.length;offset+=local.length+data.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);const arrays=[...parts,...central,end],output=new Uint8Array(arrays.reduce((sum,a)=>sum+a.length,0));let at=0;for(const a of arrays){output.set(a,at);at+=a.length;}return output;
}

// Encode straight RGBA bytes, avoiding canvas premultiplication rounding at partial alpha.
function bytesJoin(parts){const output=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const part of parts){output.set(part,at);at+=part.length;}return output;}
function pngChunk(type,data){const kind=new TextEncoder().encode(type),out=new Uint8Array(data.length+12),view=new DataView(out.buffer);view.setUint32(0,data.length);out.set(kind,4);out.set(data,8);view.setUint32(out.length-4,crc32(out.subarray(4,out.length-4)));return out;}
function storedZlib(raw){const blocks=[new Uint8Array([0x78,0x01])];for(let offset=0;offset<raw.length;offset+=65535){const n=Math.min(65535,raw.length-offset),block=new Uint8Array(n+5),v=new DataView(block.buffer);block[0]=offset+n===raw.length?1:0;v.setUint16(1,n,true);v.setUint16(3,(~n)&65535,true);block.set(raw.subarray(offset,offset+n),5);blocks.push(block);}let a=1,b=0;for(const n of raw){a=(a+n)%65521;b=(b+a)%65521;}const check=new Uint8Array(4);new DataView(check.buffer).setUint32(0,((b<<16)|a)>>>0);return bytesJoin([...blocks,check]);}
export async function spritePng(result){
 const s=validateSource(result),stride=s.width*4,raw=new Uint8Array((stride+1)*s.height);
 for(let y=0;y<s.height;y++)raw.set(s.data.subarray(y*stride,(y+1)*stride),y*(stride+1)+1);
 const deflated=typeof CompressionStream==='function'?new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()):storedZlib(raw);
 const header=new Uint8Array(13),view=new DataView(header.buffer);view.setUint32(0,s.width);view.setUint32(4,s.height);header[8]=8;header[9]=6;
 return bytesJoin([new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),pngChunk('IDAT',deflated),pngChunk('IEND',new Uint8Array())]);
}
