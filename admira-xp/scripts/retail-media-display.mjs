// Temporary reaction on the POS display. Scheduled content underneath is retained.
export function createRetailMediaDisplay({host,document:doc,music,muted=false}){
 let element=null,primed=Promise.resolve(),generation=0,release=null,cancelReady=null;
 const listeners=new Set(),notify=value=>listeners.forEach(fn=>fn(value));
 function stop(){generation++;cancelReady?.();cancelReady=null;release?.();release=null;if(element){if(element.tagName==='VIDEO'){element.pause();element.muted=true;element.removeAttribute('src');element.load();}element.remove();element=null;}}
 function prepare(asset){stop();const token=generation,node=doc.createElement(asset.kind==='image'?'img':'video');element=node;node.className='matrix-player-media retail-reaction-media';node.dataset.retailReaction=asset.kind;node.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:10;pointer-events:none';node.alt=asset.title;node.addEventListener('error',()=>{if(token!==generation)return;stop();notify({error:'media'});});
  if(asset.kind==='video'){node.playsInline=true;node.loop=false;node.muted=true;node.volume=.35;node.addEventListener('ended',()=>{if(token!==generation)return;stop();notify({});});node.src=asset.url;node.load();try{primed=Promise.resolve(node.play()).then(()=>{if(token===generation)node.pause();},()=>{});}catch{primed=Promise.resolve();}}
  else{node.src=asset.url;primed=Promise.resolve();}
 }
 async function play(){const token=generation,node=element,destination=host();if(!node||!destination)throw Error('display');await primed;if(token!==generation)throw Error('cancelled');destination.append(node);
  if(node.tagName==='VIDEO'){node.currentTime=0;node.muted=muted;if(!muted)release=music.suppress();try{await node.play();}catch(e){if(token===generation)stop();throw e;}}
  else if(!(node.complete&&node.naturalWidth)){await new Promise((resolve,reject)=>{const finish=e=>{clearTimeout(timer);node.removeEventListener('load',done);node.removeEventListener('error',bad);cancelReady=null;e?reject(e):resolve();},done=()=>finish(),bad=()=>finish(Error('image')),timer=setTimeout(()=>bad(),20000);cancelReady=()=>finish(Error('cancelled'));node.addEventListener('load',done);node.addEventListener('error',bad);});}
  if(token!==generation)throw Error('cancelled');
 }
 return {prepare,play,stop,dispose:stop,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}};
}
