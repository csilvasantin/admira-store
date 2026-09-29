import * as T from './premium-three.mjs';

// The street around the Xtanco: the Digital Out of Home half of the story.
// Good (8 bits) paints grass, street, rain and a city skyline around the shop;
// Better (16) and Best (32) rebuild that same exterior in 3D with the same
// layout as Good's Canvas2D: street and city behind the walls (row<0, col<0),
// grass in front and to the right of the entrance. Presentation only: weather
// is read from the running game's snapshot, never simulated here.
const HASH=seed=>{let x=seed>>>0||1;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};};

export function createLifeExterior({cols=14,rows=8,wallHeight=3.25,quality='better',canvasFactory=()=>document.createElement('canvas')}={}){
  const best=quality==='best';
  const root=new T.Group();root.name='life:exterior';
  const owned=new Set();
  const own=r=>{owned.add(r);return r;};
  const std=(color,extra={})=>own(new T.MeshStandardMaterial({color,roughness:.85,metalness:0,...extra}));
  const rand=HASH(best?3232:1616);
  let weather='clear',lighting='day',lastTime=null;

  function canvasTexture(w,h,draw,{nearest=false,repeat=null}={}){
    let canvas;try{canvas=canvasFactory();}catch{canvas=null;}
    const ctx=canvas?.getContext?.('2d');if(!canvas||!ctx)return null;
    canvas.width=w;canvas.height=h;
    try{draw(ctx,w,h);}catch{/* partial 2D contexts (tests, old GPUs): keep a plain texture */}
    const tex=own(new T.CanvasTexture(canvas));tex.colorSpace=T.SRGBColorSpace;
    if(nearest){tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;}
    else tex.anisotropy=4;
    if(repeat){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(repeat[0],repeat[1]);}
    return tex;
  }
  const plane=(w,d,material,x,y,z)=>{
    const m=new T.Mesh(own(new T.PlaneGeometry(w,d)),material);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;root.add(m);return m;
  };

  // ── Grass: Good's two-tone checker (#6a9a48 / #5e8e42), chunky in 16 bits, blades in 32 ──
  const grassMap=canvasTexture(best?256:16,best?256:16,(c,w,h)=>{
    if(!best){for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){c.fillStyle=((x+y)/8)%2?'#5e8e42':'#6a9a48';c.fillRect(x,y,8,8);}return;}
    for(let y=0;y<h;y+=128)for(let x=0;x<w;x+=128){c.fillStyle=((x+y)/128)%2?'#5a8a3f':'#65964a';c.fillRect(x,y,128,128);}
    const r=HASH(77);
    for(let i=0;i<2600;i++){const x=r()*w,y=r()*h,l=3+r()*6;c.strokeStyle=r()<.5?'#7fb05a66':'#3f6a2c55';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+(r()-.5)*2,y-l);c.stroke();}
  },{nearest:!best,repeat:[40,40]});
  const grassMaterial=std('#ffffff',{map:grassMap,roughness:.95});
  const grass=plane(120,120,grassMaterial,cols/2,-.47,rows/2);grass.name='life:exterior:grass';

  // ── Street behind the walls: sidewalk + road in both directions (an L) ──
  const asphaltMap=canvasTexture(best?256:32,best?256:32,(c,w,h)=>{
    c.fillStyle=best?'#4a4d52':'#5c5e62';c.fillRect(0,0,w,h);
    if(best){const r=HASH(5);for(let i=0;i<1400;i++){c.fillStyle=r()<.5?'#5a5d6340':'#35373b40';c.fillRect(r()*w,r()*h,2,2);}}
  },{nearest:!best,repeat:[30,30]});
  const road=std('#ffffff',{map:asphaltMap,roughness:.9});
  const sidewalk=std(best?'#a9a79b':'#8a8878',{roughness:.88});
  const curb=std('#c9c6b8');
  const L=-60,R=cols+60;
  plane(R-L,2.3,road,(L+R)/2,-.452,-2.15);            // road behind the back wall
  plane(2.3,R-L,road,-2.15,-.451,(L+R)/2);            // road behind the teal wall
  plane(R-L,.95,sidewalk,(L+R)/2,-.44,-.55);          // sidewalks hugging the shop
  plane(.95,R-L,sidewalk,-.55,-.439,(L+R)/2);
  plane(R-L,.9,sidewalk,(L+R)/2,-.445,-3.75);         // far sidewalk under the city
  plane(.9,R-L,sidewalk,-3.75,-.444,(L+R)/2);
  const block=std(best?'#8d8a80':'#7a786c',{roughness:.9});   // city blocks: paved, never grass
  plane(R-L,40,block,(L+R)/2,-.446,-24.2);plane(40,R-L,block,-24.2,-.445,(L+R)/2);
  for(const [x,z,w,d] of [[(L+R)/2,-1.02,R-L,.06],[-1.02,(L+R)/2,.06,R-L]]){const k=new T.Mesh(own(new T.BoxGeometry(w,.06,d)),curb);k.position.set(x,-.42,z);root.add(k);}
  // Lane markings (Good's street tiles carry none; a dashed line reads as "street" at any tier).
  const paint=std('#e9e3c8',{roughness:.6});
  for(let x=L;x<R;x+=1.4)plane(.7,.07,paint,x,-.448,-2.15);
  for(let z=-4;z<R;z+=1.4)plane(.07,.7,paint,-2.15,-.447,z);
  if(best){
    // Zebra crossing in front of the corner, like a real high street.
    for(let i=0;i<6;i++)plane(.9,.22,paint,cols*.62,-.446,-1.25-i*.38);
  }

  // ── City: Good's bluish towers (hsl 200-240), back row tall, front row lower ──
  const windowsMap=canvasTexture(best?128:32,best?256:64,(c,w,h)=>{
    c.fillStyle='#ffffff';c.fillRect(0,0,w,h);
    const cw=w/4,rh=h/8,r=HASH(best?91:19);
    for(let row=0;row<8;row++)for(let col=0;col<4;col++){
      const lit=r()<.55;
      c.fillStyle=lit?'#f7d65a':'#3b4b66';
      const px=col*cw+cw*.22,py=row*rh+rh*.22;c.fillRect(px,py,cw*.56,rh*.5);
      if(best){c.fillStyle='#ffffff55';c.fillRect(px,py,cw*.56,1);c.fillStyle='#00000030';c.fillRect(px+cw*.27,py,1,rh*.5);}
    }
  },{nearest:!best});
  const glowMap=canvasTexture(best?128:32,best?256:64,(c,w,h)=>{
    c.fillStyle='#000000';c.fillRect(0,0,w,h);
    const cw=w/4,rh=h/8,r=HASH(best?91:19);
    for(let row=0;row<8;row++)for(let col=0;col<4;col++){const lit=r()<.55;if(lit){c.fillStyle='#ffcf52';c.fillRect(col*cw+cw*.22,row*rh+rh*.22,cw*.56,rh*.5);}}
  },{nearest:!best});
  for(const t of [windowsMap,glowMap])if(t){t.wrapS=t.wrapT=T.RepeatWrapping;}
  const buildingMaterials=[];
  function building(x,z,w,d,h){
    const hue=205+rand()*35,sat=14+rand()*18,lit=34+rand()*16;
    const color=new T.Color().setHSL(hue/360,sat/100,lit/100);
    const m=std(color,{map:windowsMap,emissive:'#ffd36a',emissiveMap:glowMap,emissiveIntensity:.1,roughness:best?.55:.8,metalness:best?.08:0});
    buildingMaterials.push(m);
    const g=own(new T.BoxGeometry(w,h,d));
    // Scale UVs so one window bay ≈ .55 units wide and one floor ≈ .45 high, sharing one texture.
    const uv=g.attributes.uv;
    for(let face=0;face<6;face++){
      const faceW=face<2?d:face<4?w:w;
      for(let v=0;v<4;v++){
        const i=face*4+v;
        if(face===2||face===3){uv.setXY(i,.02,.02);continue;}   // roofs sample plain wall colour
        uv.setXY(i,uv.getX(i)*faceW/2.2,uv.getY(i)*h/3.6);
      }
    }
    uv.needsUpdate=true;
    const mesh=new T.Mesh(g,m);mesh.position.set(x,-.45+h/2,z);mesh.name='life:exterior:building';root.add(mesh);
    if(best){
      const roof=std(color.clone().offsetHSL(0,0,.08),{roughness:.7});
      const cap=new T.Mesh(own(new T.BoxGeometry(w+.08,.12,d+.08)),roof);cap.position.set(x,-.45+h+.06,z);root.add(cap);
      if(rand()<.55){const tank=new T.Mesh(own(new T.CylinderGeometry(.11,.11,.26,12)),std('#7b6a58'));tank.position.set(x+(rand()-.5)*w*.5,-.45+h+.25,z+(rand()-.5)*d*.5);root.add(tank);}
      if(rand()<.35){const mast=new T.Mesh(own(new T.CylinderGeometry(.018,.018,1.1,6)),std('#9aa3ad',{metalness:.6,roughness:.35}));mast.position.set(x,-.45+h+.6,z);root.add(mast);}
    }
  }
  // [from,to,step,zNear,zFar,hMin,hMax]: a far skyline and a lower near row, leaving sky above (Good keeps ~40%).
  const wh=wallHeight;
  // In the orthographic twin, farther means higher on screen: keep blocks close and low.
  const back=best?[[-9,cols+9,1.9,-6.4,-7.6,wh*.7,wh*1.25],[-7,cols+7,1.6,-4.5,-5.3,wh*.35,wh*.8]]:[[-8,cols+8,2.4,-6.4,-7.4,wh*.65,wh*1.1],[-6,cols+6,2.0,-4.6,-5.2,wh*.35,wh*.75]];
  for(const [from,to,step,zNear,zFar,hMin,hMax] of back){
    for(let x=from;x<to;x+=step*(.85+rand()*.3)){
      const w=step*(.6+rand()*.3),d=.9+rand()*1.1,z=zNear+(zFar-zNear)*rand();
      building(x,z,w,d,hMin+rand()*(hMax-hMin));
    }
    // The same rows turned 90°, so the skyline also rises behind the teal wall.
    for(let z=-2;z<rows+10;z+=step*(.85+rand()*.3)){
      const d=step*(.6+rand()*.3),w=.9+rand()*1.1,x=zNear+(zFar-zNear)*rand();
      building(x,z,w,d,hMin+rand()*(hMax-hMin));
    }
  }

  // ── Street furniture on the grass (Best adds lamps and trees; Better keeps low bushes) ──
  const lampHeads=[];
  const leaf=std(best?'#4f8a3c':'#4a7e36',{roughness:.9}),trunk=std('#6b4a2e');
  const trees=best?[[cols+3.4,rows*.15],[cols+3.6,rows*.7],[-1.2,rows+3.2],[cols*.35,rows+3.8],[cols+3.4,rows+3.4]]:[[cols+3.2,rows*.45],[-1,rows+3]];
  for(const [x,z] of trees){
    if(best){
      const t=new T.Mesh(own(new T.CylinderGeometry(.07,.1,1.1,8)),trunk);t.position.set(x,.1,z);t.castShadow=true;root.add(t);
      const c=new T.Mesh(own(new T.IcosahedronGeometry(.62,1)),leaf);c.position.set(x,.95,z);c.castShadow=true;root.add(c);
      const c2=new T.Mesh(own(new T.IcosahedronGeometry(.42,1)),leaf);c2.position.set(x+.25,1.3,z-.15);root.add(c2);
    }else{
      const b=new T.Mesh(own(new T.BoxGeometry(.7,.42,.7)),leaf);b.position.set(x,-.26,z);root.add(b);
      const top=new T.Mesh(own(new T.BoxGeometry(.42,.28,.42)),leaf);top.position.set(x+.08,.06,z-.05);root.add(top);
    }
  }
  if(best){
    const pole=std('#2f3b3a',{metalness:.5,roughness:.4}),head=std('#fff3cf',{emissive:'#ffd98a',emissiveIntensity:.2});
    for(let x=-1;x<cols+4;x+=3.6){
      const p=new T.Mesh(own(new T.CylinderGeometry(.035,.045,2.4,8)),pole);p.position.set(x,.75,-.9);root.add(p);
      const h=new T.Mesh(own(new T.SphereGeometry(.13,12,8)),head);h.position.set(x,1.98,-.9);root.add(h);lampHeads.push(h);
    }
  }

  // ── Rain: streaks everywhere outside the shop box, plus puddles and splashes in Best ──
  const dropCount=best?2600:1100,dropLength=best?.55:.7;
  const positions=new Float32Array(dropCount*6),speeds=new Float32Array(dropCount);
  const insideShop=(x,z)=>x>-.35&&x<cols+.35&&z>-.35&&z<rows+.35;
  function seedDrop(i,top){
    let x,z;do{x=-9+rand()*(cols+20);z=-9+rand()*(rows+18);}while(insideShop(x,z));
    // Behind the walls the city hides nothing, so rain falls from the sky. In front
    // of the open cutaway, tall streaks would project over the shop interior, so
    // they stay near the ground, as in Good where rain never enters the shop.
    const ceiling=(x<-.35||z<-.35)?9:1.3;
    const y=top?ceiling-.4+rand()*.4:-.45+rand()*(ceiling+.45);
    positions.set([x,y,z,x-.03,y-dropLength,z-.02],i*6);speeds[i]=(best?9:7)+rand()*4;
  }
  for(let i=0;i<dropCount;i++)seedDrop(i,false);
  const rainGeometry=own(new T.BufferGeometry());rainGeometry.setAttribute('position',new T.BufferAttribute(positions,3));
  const rainMaterial=own(new T.LineBasicMaterial({color:best?'#e6f0f8':'#d4e2ee',transparent:true,opacity:best?.7:.85,depthWrite:false,toneMapped:false}));
  const rain=new T.LineSegments(rainGeometry,rainMaterial);rain.name='life:exterior:rain';rain.frustumCulled=false;rain.visible=false;root.add(rain);
  const puddles=[],ripples=[];
  if(best){
    const puddleMaterial=std('#6f8aa3',{roughness:.08,metalness:.35,transparent:true,opacity:.0});
    for(const [x,z,s] of [[1.5,-2.0,1.1],[cols*.45,-2.4,.8],[cols*.8,-1.8,1.3],[-2.2,rows*.3,.9],[-1.9,rows*.8,1.2]]){
      const p=plane(s,s*.45,puddleMaterial,x,-.444,z);p.visible=false;puddles.push(p);
    }
    const rippleGeometry=own(new T.RingGeometry(.05,.075,20));
    for(let i=0;i<46;i++){
      const m=own(new T.MeshBasicMaterial({color:'#dfeaf3',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));
      const ring=new T.Mesh(rippleGeometry,m);ring.rotation.x=-Math.PI/2;ring.visible=false;ring.userData.phase=rand();root.add(ring);ripples.push(ring);
    }
  }
  const dryRoad=best?'#ffffff':'#ffffff';
  function placeRipple(ring){
    let x,z;do{x=-4+rand()*(cols+9);z=-4+rand()*(rows+8);}while(insideShop(x,z)||(x>cols+.3&&x<cols+1.85));
    ring.position.set(x,-.43,z);
  }
  ripples.forEach(placeRipple);

  // Sky: Good's vertical gradient (getSkyColors), darkened while it rains.
  const skies={day:['#6fa8dc','#a9cdea','#dbe9f2'],sunset:['#4b4f8a','#d98c6a','#f3c89a'],night:['#070d1e','#14233f','#2a3a58'],rain:['#4d5866','#6d7b89','#8e9aa6'],rainNight:['#060a12','#141c28','#222c3a']};
  const skyTextures={};
  for(const [name,stops] of Object.entries(skies))skyTextures[name]=canvasTexture(4,256,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,stops[0]);g.addColorStop(.55,stops[1]);g.addColorStop(1,stops[2]);c.fillStyle=g;c.fillRect(0,0,w,h);});
  function sky(){const raining=weather==='rain';return skyTextures[raining?(lighting==='night'?'rainNight':'rain'):lighting]||null;}
  function applyAppearance(){
    const raining=weather==='rain';
    rain.visible=raining;
    road.roughness=raining?(best?.22:.55):.9;road.metalness=raining&&best?.25:0;road.color.set(raining?'#c4ccd6':dryRoad);
    sidewalk.roughness=raining?(best?.35:.7):.88;
    grassMaterial.color.set(raining?'#d8e4d2':'#ffffff');
    for(const p of puddles){p.visible=raining;p.material.opacity=raining?.65:0;}
    for(const r of ripples)r.visible=raining;
    const glow=lighting==='night'?(best?1.35:1.1):lighting==='sunset'?.55:raining?.28:.1;
    for(const m of buildingMaterials)m.emissiveIntensity=glow;
    for(const h of lampHeads)h.material.emissiveIntensity=lighting==='night'?2.2:lighting==='sunset'?1.1:raining?.7:.2;
  }
  function setWeather(next){const w=next==='rain'?'rain':'clear';if(w!==weather){weather=w;applyAppearance();}}
  function setLighting(next){lighting=next;applyAppearance();}
  function animate(timeMs=0){
    const dt=lastTime===null?0:Math.min(.1,Math.max(0,(timeMs-lastTime)/1000));lastTime=timeMs;
    if(weather!=='rain'||!dt)return;
    for(let i=0;i<dropCount;i++){
      const o=i*6,fall=speeds[i]*dt;
      positions[o+1]-=fall;positions[o+4]-=fall;
      if(positions[o+4]<-.45)seedDrop(i,true);
    }
    rainGeometry.attributes.position.needsUpdate=true;
    for(const ring of ripples){
      ring.userData.phase+=dt*1.6;
      if(ring.userData.phase>=1){ring.userData.phase-=1;placeRipple(ring);}
      const p=ring.userData.phase;ring.scale.setScalar(1+p*4);ring.material.opacity=(1-p)*.55;
    }
  }
  function dispose(){for(const r of owned)r.dispose?.();owned.clear();root.clear();root.removeFromParent();}
  applyAppearance();
  return {root,setWeather,setLighting,animate,dispose,get weather(){return weather;},get sky(){return sky();}};
}
