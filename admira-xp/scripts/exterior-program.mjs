// A separate, silent program for the storefront. It consumes the same fresh
// trajectories as the synthetic street, never totals or simulated customers.
export const EXTERIOR_RULES=Object.freeze({
  person:{id:'1786533143983-n2y09e',label:'Personas'},
  car:{id:'1786532932584-a1412h',label:'Coches'},
  motorcycle:{id:'1786532932584-a1412h',label:'Motos'},
  bicycle:{id:'1789214248874-j6qqjo',label:'Bicicletas',startFraction:.5},
  scooter:{id:'1789214248874-j6qqjo',label:'Patinete confirmado',startFraction:.5},
});
const TTL=1500,INDEX='https://stock.admira.store/stock/index.json',LIMIT=2*1024*1024;
const recent=(at,now)=>Number.isFinite(at)&&at<=now+1000&&now-at<TTL;
export function exteriorChoice(snapshot,now=Date.now()){
  if(snapshot?.status!=='live'||snapshot.source!=='puerta-cam'||!recent(snapshot.frameAt,now)||!Array.isArray(snapshot.tracks))return null;
  const visible=snapshot.tracks.filter(t=>t?.confirmed===true&&recent(t.observedAt,now)&&(t.kind!=='scooter'||t.manual===true));
  const kind=['scooter','bicycle','motorcycle','car','person'].find(k=>visible.some(t=>t.kind===k));
  return kind?{kind,...EXTERIOR_RULES[kind]}:null;
}
export function resolveExteriorAssets(items){
  const wanted=new Set(Object.values(EXTERIOR_RULES).map(r=>r.id)),assets=new Map();
  for(const it of Array.isArray(items)?items:[]){
    if(!wanted.has(it?.id)||!['video','animation','image'].includes(it.type))continue;
    try{
      const url=new URL(it.url);
      if(url.protocol!=='https:'||url.hostname!=='stock.admira.store'||url.username||url.password||!url.pathname.startsWith('/stock/'))continue;
      assets.set(it.id,{id:it.id,title:String(it.title||it.id).slice(0,160),url:url.href,type:it.type==='image'?'image':'video'});
    }catch{}
  }
  return assets;
}
async function readCatalog(fetcher,signal){
  const response=await fetcher(INDEX,{credentials:'omit',redirect:'error',signal});
  if(!response.ok||!response.body||Number(response.headers.get('content-length'))>LIMIT)throw new Error('catalog');
  const reader=response.body.getReader(),chunks=[];let length=0;
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>LIMIT)throw new Error('catalog-size');chunks.push(value);}
  }catch(error){await reader.cancel().catch(()=>{});throw error;}
  const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  return resolveExteriorAssets(JSON.parse(new TextDecoder().decode(bytes)).items);
}
export function createExteriorProgram({document,onState=()=>{},fetcher=fetch,now=()=>Date.now()}){
  let snapshot=null,choice=null,assets=null,loading=null,retryAt=0,controller=null,element=null,key='',generation=0,destroyed=false,lastStatus='',mediaError=false;
  function report(value){if(value!==lastStatus){lastStatus=value;onState(value);}}
  function release(){
    generation++;if(element){element.pause?.();element.removeAttribute('src');element.load?.();}element=null;key='';mediaError=false;
  }
  function stillChosen(){return !destroyed&&choice&&exteriorChoice(snapshot,now())?.kind===choice.kind;}
  function ensureCatalog(){
    if(assets||loading||now()<retryAt||destroyed)return;
    controller=new AbortController();const active=controller,timer=setTimeout(()=>active.abort(),10000);
    loading=readCatalog(fetcher,active.signal).then(value=>{if(!destroyed)assets=value;}).catch(()=>{retryAt=now()+30000;}).finally(()=>{
      clearTimeout(timer);loading=null;if(controller===active)controller=null;if(!destroyed)update(snapshot);
    });
  }
  function update(value){
    if(destroyed)return;snapshot=value;
    const next=exteriorChoice(value,now());
    if(!next){choice=null;if(element)release();report(value?.status==='live'?'Exterior · sin presencia · espejo del player':'Exterior · sin trayectorias recientes · espejo del player');return;}
    choice=next;ensureCatalog();
    const asset=assets?.get(next.id);
    if(!asset){if(element)release();report(loading?'Exterior · cargando contenidos':'Exterior · contenido no disponible · espejo del player');return;}
    const nextKey=asset.id+'|'+(next.startFraction||0);
    if(nextKey!==key){
      release();key=nextKey;const token=generation,node=document.createElement(asset.type==='image'?'img':'video');element=node;
      node.crossOrigin='anonymous';node.referrerPolicy='no-referrer';node.muted=true;node.playsInline=true;node.loop=true;node.preload='auto';
      const current=()=>generation===token&&element===node&&stillChosen();
      node.addEventListener('error',()=>{if(current()){mediaError=true;report('Exterior · error de contenido · espejo del player');}});
      if(asset.type==='video')node.addEventListener('loadedmetadata',()=>{
        if(!current())return;
        if(next.startFraction&&Number.isFinite(node.duration)&&node.duration>0)node.currentTime=node.duration*next.startFraction;
        Promise.resolve(node.play()).catch(()=>{if(current()){mediaError=true;report('Exterior · reproducción no disponible · espejo del player');}});
      });
      node.src=asset.url;
    }
    const playing=!mediaError&&element&&(asset.type==='image'?element.complete&&element.naturalWidth>0:element.readyState>=2&&!element.paused);
    report(playing?`Exterior · ${next.label} → ${asset.title}`:mediaError?'Exterior · contenido no disponible · espejo del player':`Exterior · cargando ${asset.title}`);
  }
  function draw(ctx,w,h){
    if(!stillChosen()){if(element)release();return false;}
    if(!element||mediaError||!(w>0&&h>0))return false;
    const vw=element.videoWidth||element.naturalWidth,vh=element.videoHeight||element.naturalHeight;
    if(!vw||!vh||(element.tagName==='VIDEO'&&(element.readyState<2||element.paused)))return false;
    ctx.save();try{
      ctx.fillStyle='#071117';ctx.fillRect(0,0,w,h);const scale=Math.min(w/vw,h/vh);ctx.drawImage(element,(w-vw*scale)/2,(h-vh*scale)/2,vw*scale,vh*scale);
    }catch{mediaError=true;return false;}finally{ctx.restore();}
    return true;
  }
  return {update,draw,clear(){snapshot=null;choice=null;release();report('Exterior · espejo del player');},destroy(){destroyed=true;controller?.abort();snapshot=null;choice=null;release();}};
}
