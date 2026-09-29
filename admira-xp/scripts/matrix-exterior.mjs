// Matrix (64 bits) exterior over the Avenida Admira photograph: the Digital Out
// of Home half of Xtanco. Good paints grass, a rainy street and a city skyline
// around the shop; here the photo already carries the wet street and facade, so
// this adds, in image coordinates (the photo is drawn with object-fit:fill):
//   · ground layer (under furniture and people): distant city over the facade,
//     grass verges on both street corners, rain ripples on the paving;
//   · rain layer (over everything, clipped outside the room): streaks and the
//     lightning flash of Good's "Rain! They take shelter inside".
// Weather comes from the running game (window.__xtancoVisualState); nothing is simulated.

// Room silhouette measured on best-xtanco-avenida-admira-mudanza-20260915.png:
// wall tops, right wall edge and the stone plinth. Everything outside is street.
export const MATRIX_ROOM_SILHOUETTE=Object.freeze([
  [0,.195],[.346,-.01],[.993,.392],[.993,.735],[.578,.992],[0,.566]
].map(p=>Object.freeze(p)));
// Facade band above the back wall (city), and the two paved corners (grass verges).
const FACADE=[[.346,-.01],[.993,.392],[1,.392],[1,0]];
const VERGES=[[[0,.78],[0,1],[.25,1]],[[1,.8],[1,1],[.7,1]]];

const hash=seed=>{let x=seed>>>0||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};};

export function readMatrixWeather(state){
  try{return state?.game?.weather?.type==='rain'?'rain':'clear';}catch{return 'clear';}
}

export function mountMatrixExterior(container,{getState=()=>window.__xtancoVisualState?.(),now=()=>performance.now(),raf=cb=>requestAnimationFrame(cb),caf=id=>cancelAnimationFrame(id)}={}){
  const ground=document.createElement('canvas'),rain=document.createElement('canvas');
  ground.className='matrix-exterior matrix-exterior-ground';rain.className='matrix-exterior matrix-exterior-rain';
  for(const c of [ground,rain]){c.setAttribute('aria-hidden','true');Object.assign(c.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});}
  ground.style.zIndex='1';rain.style.zIndex='2040';
  const image=container.querySelector('img');
  if(image?.nextSibling)container.insertBefore(ground,image.nextSibling);else container.append(ground);
  container.append(rain);
  const g=ground.getContext('2d'),r=rain.getContext('2d');
  let width=1,height=1,frame=0,disposed=false,weather='clear',lastWeatherRead=-Infinity,flash=0,cooldown=240,last=null;
  const rnd=hash(6464);

  // Distant skyline (ten towers, lit windows), drawn once per size into an offscreen canvas.
  const towers=Array.from({length:22},(_,i)=>({x:.33+i*.031+rnd()*.012,w:.026+rnd()*.03,h:.09+rnd()*.12,hue:212+rnd()*22,lit:rnd(),far:rnd()<.45}));
  const blades=Array.from({length:900},()=>({u:rnd(),v:rnd(),l:.5+rnd()*.9,lean:(rnd()-.5)*.8,shade:rnd()}));
  const drops=Array.from({length:520},()=>({x:rnd(),y:rnd(),s:.9+rnd()*.8,l:.018+rnd()*.03,a:.25+rnd()*.45}));
  const ripples=Array.from({length:60},()=>({x:0,y:0,p:rnd()}));
  const P=([u,v])=>[u*width,v*height];
  const path=(ctx,points)=>{ctx.beginPath();points.forEach((p,i)=>{const [x,y]=P(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();};
  const insideRoom=(u,v)=>{let inside=false;const s=MATRIX_ROOM_SILHOUETTE;for(let i=0,j=s.length-1;i<s.length;j=i++){const [xi,yi]=s[i],[xj,yj]=s[j];if((yi>v)!==(yj>v)&&u<(xj-xi)*(v-yi)/(yj-yi)+xi)inside=!inside;}return inside;};
  function placeRipple(rp){
    // Paving only: below the plinth, outside the room and off the grass verges.
    for(let k=0;k<20;k++){const u=rnd(),v=.55+rnd()*.45;if(!insideRoom(u,v)&&v>.6){rp.x=u;rp.y=v;return;}}
    rp.x=.1;rp.y=.95;
  }
  ripples.forEach(placeRipple);

  function drawGround(t){
    g.clearRect(0,0,width,height);
    const raining=weather==='rain';
    // City: a rainy dusk sky and towers above the facade, fading into haze where
    // they meet the stone, so the photo's own street level stays untouched.
    g.save();path(g,FACADE);g.clip();
    const band=height*.30;
    const skyG=g.createLinearGradient(0,0,0,band);
    skyG.addColorStop(0,raining?'#2a3240':'#1d2440');skyG.addColorStop(.45,raining?'#46525fcc':'#51466acc');skyG.addColorStop(1,raining?'#46525f00':'#51466a00');
    g.fillStyle=skyG;g.fillRect(0,0,width,band);
    for(const far of [true,false])for(const tw of towers){
      if(tw.far!==far)continue;
      const x=tw.x*width,w=tw.w*width,h=(far?tw.h*.8:tw.h)*height,base=band*.95,top=base-h-(far?height*.04:0);
      const grad=g.createLinearGradient(0,top,0,base);
      const l=far?(raining?34:30):(raining?24:20);
      grad.addColorStop(0,`hsla(${tw.hue},20%,${l}%,1)`);grad.addColorStop(.6,`hsla(${tw.hue},20%,${l}%,.85)`);grad.addColorStop(1,`hsla(${tw.hue},20%,${l}%,0)`);
      g.fillStyle=grad;g.fillRect(x,top,w,base-top);
      g.fillStyle=`hsla(${tw.hue},25%,${l+12}%,.9)`;g.fillRect(x,top,w,Math.max(1,height*.003));
      const step=Math.max(4,height*.013),colStep=Math.max(4,width*.0065);
      for(let yy=top+step*.6;yy<top+(base-top)*.7;yy+=step)for(let xx=x+colStep*.4;xx<x+w-colStep*.5;xx+=colStep){
        const on=((xx*7+yy*13+tw.lit*97)|0)%7<3;if(!on)continue;
        g.fillStyle=`rgba(255,${far?200:214},${far?110:128},${(far?.45:.8)*(1-(yy-top)/(base-top))+.1*Math.sin(t*.0008+tw.lit*9)})`;
        g.fillRect(xx,yy,Math.max(1.5,width*.0024),Math.max(1.5,height*.0045));
      }
    }
    g.restore();
    // Grass verges with a stone kerb: dense blades, darker and glossy when wet.
    for(const verge of VERGES){
      g.save();path(g,verge);
      const [ax,ay]=P(verge[0]),[bx,by]=P(verge[2]);
      const base=g.createLinearGradient(ax,ay,bx,by);base.addColorStop(0,raining?'#2f5a2a':'#3f7331');base.addColorStop(1,raining?'#24461f':'#325e27');
      g.fillStyle=base;g.fill();g.clip();
      const xs=verge.map(p=>p[0]),ys=verge.map(p=>p[1]);
      const minU=Math.min(...xs),maxU=Math.max(...xs),minV=Math.min(...ys),maxV=Math.max(...ys);
      g.lineWidth=Math.max(1,width*.0012);
      for(const b of blades){
        const x=(minU+b.u*(maxU-minU))*width,y=(minV+b.v*(maxV-minV))*height,len=b.l*height*.018;
        g.strokeStyle=b.shade<.5?(raining?'#4d8a3e':'#6aa84f'):(raining?'#1d3a18':'#2a5022');
        g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+b.lean*len*.5,y-len*.6,x+b.lean*len,y-len);g.stroke();
      }
      if(raining){g.fillStyle='rgba(190,215,235,.08)';g.fill();}
      g.restore();
      g.save();g.strokeStyle='#b9b2a2';g.lineWidth=Math.max(2,width*.003);g.beginPath();const [p0,p1,p2]=verge.map(P);
      g.moveTo(p0[0],p0[1]);g.lineTo(p2[0],p2[1]);g.stroke();g.restore();
    }
    // Rain ripples on the paving.
    if(raining){
      g.save();g.lineWidth=1;
      for(const rp of ripples){
        const rad=(2+rp.p*10)*width/1500;
        g.strokeStyle=`rgba(225,236,245,${(1-rp.p)*.45})`;
        g.beginPath();g.ellipse(rp.x*width,rp.y*height,rad,rad*.42,0,0,Math.PI*2);g.stroke();
      }
      g.restore();
    }
  }
  function drawRain(dt){
    r.clearRect(0,0,width,height);
    if(weather!=='rain')return;
    r.save();
    // Outside the room only: even-odd between the full frame and the room silhouette.
    r.beginPath();r.rect(0,0,width,height);MATRIX_ROOM_SILHOUETTE.forEach((p,i)=>{const [x,y]=P(p);i?r.lineTo(x,y):r.moveTo(x,y);});r.closePath();r.clip('evenodd');
    r.fillStyle='rgba(22,32,44,.16)';r.fillRect(0,0,width,height);
    r.lineWidth=Math.max(1,width/1300);
    for(const d of drops){
      d.y+=d.s*dt*1.1;d.x-=d.s*dt*.08;
      if(d.y>1.05){d.y=-.05;d.x=rnd()*1.1;}
      const x=d.x*width,y=d.y*height,l=d.l*height;
      r.strokeStyle=`rgba(214,228,240,${d.a})`;r.beginPath();r.moveTo(x,y);r.lineTo(x-l*.08,y+l);r.stroke();
    }
    if(flash>0){r.fillStyle=`rgba(236,238,255,${flash/8*.55})`;r.fillRect(0,0,width,height);flash--;}
    else if(--cooldown<=0&&Math.random()<.004){flash=8;cooldown=300;}
    r.restore();
  }
  function resize(){
    const rect=container.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1);
    width=Math.max(1,Math.round(rect.width*dpr));height=Math.max(1,Math.round(rect.height*dpr));
    for(const c of [ground,rain]){c.width=width;c.height=height;}
  }
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(container);resize();
  function tick(){
    if(disposed)return;
    const t=now(),dt=last===null?0:Math.min(.1,(t-last)/1000);last=t;
    if(t-lastWeatherRead>1000){lastWeatherRead=t;weather=readMatrixWeather(getState());}
    if(weather==='rain')for(const rp of ripples){rp.p+=dt*1.5;if(rp.p>=1){rp.p-=1;placeRipple(rp);}}
    drawGround(t);drawRain(dt);
    frame=raf(tick);
  }
  frame=raf(tick);
  return {
    get weather(){return weather;},
    dispose(){disposed=true;caf(frame);observer?.disconnect();ground.remove();rain.remove();}
  };
}
