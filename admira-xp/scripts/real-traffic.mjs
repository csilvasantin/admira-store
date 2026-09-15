// Display-only projection of confirmed Puerta Cam trajectories. Never owns game state.
export const TRAFFIC_TTL=1500;
export const TRAFFIC_SMOOTH_MS=120;
const KINDS=new Set(['person','car','motorcycle','bicycle','scooter']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function mapTrafficPoint(track,iso){
  // x follows the street; y preserves relative depth. This is a schematic ROI
  // projection, not a camera calibration or a measurement of real distances.
  const road=track.kind!=='person',col=iso.cols+(road?1.7:.65)+track.y*(road?.7:.5);
  const width=finite(iso.width)?iso.width:800,height=finite(iso.height)?iso.height:500;
  // Restrict the schematic street span to the visible exterior. The source
  // position still determines progress; a sprite never walks off on its own.
  const start=Math.max(.25,col-(width-24-iso.ox)/(iso.tileW/2),(40-iso.oy)/(iso.tileH/2)-col);
  const end=Math.min(iso.rows+.6,(height-10-iso.oy)/(iso.tileH/2)-col);
  const row=start+track.x*Math.max(0,end-start);
  return {col,row,x:iso.ox+(col-row)*iso.tileW/2,y:iso.oy+(col+row)*iso.tileH/2,visible:end>=start};
}
function validTrack(t,frameAt,now){
  return t&&t.confirmed===true&&(Number.isSafeInteger(t.id)||typeof t.id==='string')&&String(t.id).length<=80&&KINDS.has(t.kind)&&(t.kind!=='scooter'||t.manual===true)&&
    finite(t.x)&&finite(t.y)&&t.x>=0&&t.x<=1&&t.y>=0&&t.y<=1&&finite(t.observedAt)&&t.observedAt<=frameAt+1&&
    t.observedAt<=now+100&&now-t.observedAt<TRAFFIC_TTL;
}
export function createTrafficProjection({now=()=>Date.now()}={}){
  const tracks=new Map();let lastFrame=-Infinity,status='waiting',lastSource=null;
  function sample(record,time){const t=clamp((time-record.started)/TRAFFIC_SMOOTH_MS,0,1);return {x:record.from.x+(record.to.x-record.from.x)*t,y:record.from.y+(record.to.y-record.from.y)*t};}
  function update(snapshot){
    const time=now();
    if(!snapshot||snapshot.status!=='live'||!finite(snapshot.frameAt)||snapshot.frameAt>time+100||time-snapshot.frameAt>=TRAFFIC_TTL){tracks.clear();lastFrame=-Infinity;lastSource=null;status=snapshot?.status==='disconnected'?'disconnected':snapshot?.status==='waiting'?'waiting':'stale';return;}
    if(snapshot.source!=='puerta-cam'||!Array.isArray(snapshot.tracks)){tracks.clear();status='stale';return;}
    if(snapshot.frameAt<lastFrame)return;
    status='live';lastSource=snapshot;
    lastFrame=snapshot.frameAt;const current=new Set();
    for(const t of snapshot.tracks.slice(0,100)){
      if(!validTrack(t,snapshot.frameAt,time))continue;
      const key=String(t.id);if(current.has(key))continue;current.add(key);
      const previous=tracks.get(key),point={x:t.x,y:t.y};
      // Only a new measured observation can schedule interpolation. Repeating
      // a frame never extends a track lifetime or animates an invented path.
      if(previous&&t.observedAt<=previous.observedAt){if(t.observedAt===previous.observedAt){previous.kind=t.kind;previous.manual=t.manual===true;}continue;}
      const from=previous?sample(previous,time):point,dx=point.x-from.x;
      tracks.set(key,{key,id:t.id,kind:t.kind,manual:t.manual===true,observedAt:t.observedAt,from,to:point,started:time,
        heading:Math.abs(dx)>.001?(dx>0?-1:1):previous?.heading||1,appearance:hash(key),travel:(previous?.travel||0)+Math.hypot(point.x-from.x,point.y-from.y)});
    }
    for(const key of tracks.keys())if(!current.has(key))tracks.delete(key);
  }
  function read(iso){
    const time=now();if(!lastSource||time-lastSource.frameAt>=TRAFFIC_TTL){tracks.clear();if(status==='live')status='stale';return [];}
    const out=[];
    for(const [key,t]of tracks){if(time-t.observedAt>=TRAFFIC_TTL){tracks.delete(key);continue;}const p=sample(t,time),mapped=mapTrafficPoint({...t,...p},iso);if(mapped.visible)out.push({...t,...mapped,progress:p.x,depth:p.y,moving:time-t.started<TRAFFIC_SMOOTH_MS&&Math.hypot(t.to.x-t.from.x,t.to.y-t.from.y)>.002});}
    return out.sort((a,b)=>a.y-b.y||a.key.localeCompare(b.key));
  }
  return {update,read,clear(){tracks.clear();lastSource=null;lastFrame=-Infinity;status='waiting';},get status(){return status;}};
}

function sprite(ctx,actor,mode){
  const matrix=mode==='better',accent=matrix?'#65ff87':['#4cabb0','#e39459','#7b9dd6','#a3bd72'][actor.appearance%4];
  const dark=matrix?'#04200d':'#17262d',light=matrix?'#b8ffca':'#e5dac4',body=matrix?'#138c36':accent;
  const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const wheel=(x,y,size=3)=>{r(x-size,y-size,size*2+1,size*2+1,dark);r(x-1,y-1,3,3,matrix?'#56ff79':'#8c9da5');};
  const line=(x1,y1,x2,y2,color=accent,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1+.5,y1+.5);ctx.lineTo(x2+.5,y2+.5);ctx.stroke();};
  ctx.save();ctx.translate(Math.round(actor.x),Math.round(actor.y));ctx.imageSmoothingEnabled=false;
  if(actor.heading<0)ctx.scale(-1,1);
  ctx.globalAlpha=matrix?.24:.18;r(-9,-1,18,3,'#000');ctx.globalAlpha=1;
  if(actor.kind==='person'){
    const step=actor.moving?(Math.floor(actor.travel*45)%2?2:-2):0;
    r(-5,-13,4,12+step,dark);r(2,-13,4,12-step,dark);r(-6,-2+step,5,2,light);r(2,-2-step,5,2,light);
    r(-7,-23,14,12,dark);r(-5,-22,10,10,body);r(-9,-21,3,10,body);r(7,-21,3,10,body);
    r(-6,-34,12,12,dark);r(-5,-33,10,10,light);r(-6,-35,13,4,accent);r(2,-29,2,2,dark);
  }else if(actor.kind==='car'){
    r(-20,-10,40,9,dark);r(-19,-12,37,9,body);r(-11,-22,23,12,dark);r(-9,-21,19,10,accent);
    r(-8,-20,8,7,matrix?'#08170b':'#c0dce4');r(2,-20,7,7,matrix?'#08170b':'#c0dce4');
    r(-19,-10,3,3,light);r(17,-10,3,3,'#ffbf6b');wheel(-12,-2,4);wheel(12,-2,4);line(-18,-12,17,-12,light,1);
  }else{
    const scooter=actor.kind==='scooter',motor=actor.kind==='motorcycle';
    wheel(-11,-3,scooter?2:3);wheel(11,-3,scooter?2:3);
    if(scooter){line(-11,-4,9,-4);line(9,-4,6,-24);line(3,-24,10,-24);}
    else{line(-11,-3,-3,-14);line(-3,-14,11,-3);line(-11,-3,2,-3);line(2,-3,-3,-14);line(11,-3,6,-19);line(3,-19,9,-19);if(motor)r(-6,-14,14,7,body);}
    const riderX=scooter?-1:-3,riderY=scooter?-27:-22;
    r(riderX-3,riderY,7,12,body);r(riderX-3,riderY-8,8,8,light);r(riderX-4,riderY-9,10,3,accent);
    line(riderX+3,riderY+3,6,scooter?-23:-18,light);line(riderX,riderY+11,scooter?-2:3,-5,dark,3);
  }
  ctx.restore();
}
export function drawTrafficSprites(ctx,actors,{mode='good',width=800,height=500}={}){
  ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();for(const actor of actors)sprite(ctx,actor,mode);ctx.restore();
}

export function installRealTraffic({window:win=window,document:doc=document}={}){
  const projection=createTrafficProjection(),status=doc.createElement('span');status.id='xtore-real-traffic-status';status.setAttribute('role','status');
  status.title='Trayectorias de Puerta Cam · posiciones proyectadas en la calle. Sprites sintéticos; sin identidad, edad ni género. Patinetes: trayectoria existente confirmada por un operador, nunca animación desde el contador manual.';
  status.style.cssText='font:10px/1.3 monospace;color:#8edeb0;max-width:210px;white-space:normal;padding:0 5px';
  doc.querySelector('#telegramDock .tg-actions')?.append(status);
  let previous='';
  function paintStatus(count,manualScooters=0){const enabled=!!win.__xtoreWindowPlayer;status.hidden=!enabled;const text=projection.status==='live'?`Puerta Cam · ${count} trayectorias${manualScooters?' · patinete confirmado manualmente':''}`:projection.status==='disconnected'?'Puerta Cam · desconectada':projection.status==='waiting'?'Puerta Cam · esperando trayectorias':'Puerta Cam · sin datos recientes';if(text!==previous){status.textContent=text;previous=text;}}
  const api={enabled:()=>!!win.__xtoreWindowPlayer,draw(ctx,iso,width,height){
    if(!api.enabled()){projection.clear();paintStatus(0);return;}
    projection.update(win.__xtoreWindowPlayer.traffic?.()||{status:'waiting'});const actors=projection.read({...iso,width,height});paintStatus(actors.length,actors.filter(a=>a.kind==='scooter'&&a.manual).length);
    drawTrafficSprites(ctx,actors,{mode:doc.body.dataset.xtancoVisual||'good',width,height});
  },clear(){projection.clear();paintStatus(0);}};
  win.__xtoreRealTraffic=api;paintStatus(0);return api;
}
if(typeof window!=='undefined'&&typeof document!=='undefined')installRealTraffic();
