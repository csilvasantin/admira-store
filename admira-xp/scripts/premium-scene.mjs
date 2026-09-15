import * as T from './premium-three.mjs';
import {FOOTPRINTS,normalizeSnapshot,layoutSignature} from './premium-model.mjs';
import {legacyFurnitureTransform} from './premium-projection.mjs';

// Good draws these operational entities above the integrated architectural pass.
// Keep this list explicit: decorative furniture continues to receive the premium finish.
export const INTEGRATED_OPERATIONAL_TYPES=new Set(['counter','shelves','lottery','manager','floorLamp','djBooth','tablet','turnKiosk','aroma','metahuman','custom','tft','led']);

// One geometry graph, two material presentations. Shared source data remains outside.
export function createPremiumScene(raw,{canvasFactory=()=>document.createElement('canvas'),integrated=false}={}){
  let snapshot=normalizeSnapshot(raw),signature='',mode='best';
  const scene=new T.Scene(),world=new T.Group(),actors=new T.Group();
  scene.add(world,actors);
  const geometry=new Set(),materials=new Set(),textures=new Set(),actorMap=new Map();
  const mat=(color,roughness=.72,metalness=0,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness,metalness,...extra});materials.add(m);return m;};
  const palette={ivory:mat('#eee8dc'),limestone:mat('#d8d3c6'),wood:mat('#9a6543'),oak:mat('#bf9063'),darkWood:mat('#4c3428'),
    brass:mat('#c2a05e',.3,.72),steel:mat('#273a3f',.38,.7),black:mat('#101b20',.42,.25),white:mat('#f6f2e9',.5),
    green:mat('#416b4e'),leaf:mat('#648660'),terracotta:mat('#a86748'),blue:mat('#456e82'),pavement:mat('#bbbdb2'),
    glass:mat('#96c2bd',.12,.18,{transparent:true,opacity:.25,depthWrite:false}),light:mat('#f4dfad',.5,0,{emissive:'#ffcc78',emissiveIntensity:.8})};
  const wireMaterial=new T.MeshBasicMaterial({color:'#001508',toneMapped:false,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  const edgeMaterial=new T.LineBasicMaterial({color:'#37ff69',toneMapped:false,transparent:true,opacity:.88});materials.add(wireMaterial);materials.add(edgeMaterial);
  const boxGeometry=new T.BoxGeometry(1,1,1),cylinderGeometry=new T.CylinderGeometry(1,1,1,12),sphereGeometry=new T.SphereGeometry(1,12,8);
  for(const g of [boxGeometry,cylinderGeometry,sphereGeometry])geometry.add(g);
  const edgesByGeometry=new Map();
  function mesh(parent,g,m,pos,scale,wire=true){
    const o=new T.Mesh(g,m);o.position.set(...pos);if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;
    o.userData.bestMaterial=m;o.userData.wire=wire;parent.add(o);
    if(wire){let e=edgesByGeometry.get(g);if(!e){e=new T.EdgesGeometry(g,24);edgesByGeometry.set(g,e);geometry.add(e);}const edge=new T.LineSegments(e,edgeMaterial);edge.visible=mode==='better';edge.userData.premiumEdge=true;o.add(edge);if(mode==='better')o.material=wireMaterial;}
    return o;
  }
  const box=(p,x,y,z,w,h,d,m=palette.wood,wire=true)=>mesh(p,boxGeometry,m,[x,y,z],[w,h,d],wire);
  const cyl=(p,x,y,z,r,h,m=palette.steel)=>mesh(p,cylinderGeometry,m,[x,y,z],[r,h,r]);
  const ball=(p,x,y,z,r,m=palette.leaf)=>mesh(p,sphereGeometry,m,[x,y,z],[r,r,r]);
  function canvasTexture(text,{width=512,height=128,bg='#132f35',fg='#f1dfae',font=50}={}){
    const canvas=canvasFactory();if(!canvas)return null;canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');if(!c)return null;
    c.fillStyle=bg;c.fillRect(0,0,width,height);c.fillStyle=fg;c.font=`600 ${font}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,width/2,height/2,width-35);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);return texture;
  }
  function label(parent,text,x,y,z,w,h,{rotation=0,bg,fg,font}={}){
    const texture=canvasTexture(text,{bg,fg,font});if(!texture)return;
    const m=new T.MeshBasicMaterial({map:texture,toneMapped:false,side:T.DoubleSide});m.userData.premiumTransient=true;materials.add(m);
    const g=new T.PlaneGeometry(w,h);g.userData.premiumTransient=true;geometry.add(g);const o=mesh(parent,g,m,[x,y,z],null,false);o.rotation.y=rotation;o.castShadow=false;return o;
  }
  const videoCanvas=integrated?null:canvasFactory();let videoContext=null,videoTexture=null,screenMaterial=palette.black;
  if(videoCanvas){videoCanvas.width=512;videoCanvas.height=768;videoContext=videoCanvas.getContext('2d');videoTexture=new T.CanvasTexture(videoCanvas);videoTexture.colorSpace=T.SRGBColorSpace;videoTexture.minFilter=T.LinearFilter;textures.add(videoTexture);screenMaterial=new T.MeshBasicMaterial({map:videoTexture,toneMapped:false,side:T.DoubleSide});materials.add(screenMaterial);}
  function screen(parent,x,y,z,w,h,rotation=0){
    const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);
    box(g,0,0,0,w+.12,h+.12,.1,palette.black);box(g,0,0,.06,w,h,.012,screenMaterial,false);
    box(g,0,-h/2-.035,.065,w*.6,.012,.012,palette.brass);return g;
  }
  function cabinet(parent,w,d,h){
    box(parent,w/2,h/2,d/2,w,h,d,palette.oak);box(parent,w/2,.08,d/2,w+.025,.12,d+.025,palette.darkWood);
    box(parent,w/2,h+.045,d/2,w+.12,.09,d+.12,palette.limestone);
    for(let x=.1;x<w;x+=.12)box(parent,x,h*.5,d+.016,.027,h*.77,.025,palette.wood);
    box(parent,w/2,h*.8,d+.032,w*.82,.018,.02,palette.brass);
  }
  function plant(parent,x=.5,z=.5,size=1){
    const pot=cyl(parent,x,.2*size,z,.22*size,.4*size,palette.terracotta);pot.scale.x*=1.12;pot.scale.z*=1.12;
    cyl(parent,x,.22*size,z,.23*size,.035*size,palette.darkWood);
    cyl(parent,x,.62*size,z,.028*size,.8*size,palette.wood);
    for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(parent,x+Math.cos(a)*.23*size,(.64+i*.055)*size,z+Math.sin(a)*.23*size,.25*size,i%2?palette.green:palette.leaf);leaf.scale.y*=1.7;}
  }
  function furniture(item){
    const root=new T.Group();root.name=`furniture:${item.id}`;root.userData.layoutId=item.id;root.position.set(item.col,0,item.row);
    root.scale.set((item.flipX?-1:1)*item.sx,item.sy,item.sx);root.rotation.y=-item.rot*Math.PI/2;world.add(root);
    // Wall heights are already converted from the rendered legacy polygon.
    // Their absolute placement must not receive floor-furniture scaling a second time.
    if(item.type==='tft'||item.type==='aroma'){root.position.set(item.col,item.wallY,0);root.scale.set(1,1,1);root.rotation.set(0,0,0);}
    else if(snapshot.projection){root.matrixAutoUpdate=false;root.matrix.copy(legacyFurnitureTransform(snapshot.projection,item));}
    const [w,d]=item.fp||FOOTPRINTS[item.type]||[1,1];
    switch(item.type){
      case 'counter':
        cabinet(root,w,d,.95);box(root,w*.5,1.09,d*.32,.6,.045,.4,palette.black);cyl(root,w*.55,1.22,d*.27,.038,.24);
        box(root,w*.55,1.39,d*.27,.58,.34,.055,palette.black);label(root,'ADMIRA',w*.55,1.39,d*.305,.51,.28,{font:56});
        box(root,w*.18,1.03,d*.76,.2,.055,.3,palette.steel);break;
      case 'shelves':{
        const h=2.15;box(root,w/2,h/2,.055,w,h,.11,palette.darkWood);
        for(const x of [.035,w-.035])box(root,x,h/2,d/2,.07,h,d,palette.wood);
        for(let tier=0;tier<5;tier++){const y=.15+tier*.43;box(root,w/2,y,d/2,w,.06,d,palette.oak);
          for(let j=0;j<5;j++){const colors=[palette.ivory,palette.blue,palette.green,palette.terracotta,palette.brass];box(root,.14+j*(w-.28)/4,y+.19,d-.16,.12,.29,.22,colors[(tier+j)%5]);box(root,.14+j*(w-.28)/4,y+.19,d-.045,.1,.045,.006,palette.white);}}
        label(root,'SELECCIÓN',w/2,2.1,d+.012,w*.88,.16,{font:55});break;}
      case 'wineRack':
        cabinet(root,w,d,.42);for(let t=0;t<3;t++){const y=.65+t*.4;box(root,w/2,y,d/2,w,.05,d,palette.darkWood);
          for(let j=0;j<6;j++){const x=.17+j*(w-.34)/5;cyl(root,x,y+.16,d*.58,.07,.28,palette.green);cyl(root,x,y+.34,d*.58,.033,.12,palette.brass);box(root,x,y+.17,d*.655,.1,.11,.012,palette.ivory);}}
        for(const x of [.035,w-.035])box(root,x,.9,d/2,.07,1.7,d,palette.oak);break;
      case 'magazines':
        box(root,w/2,.06,d/2,w,.12,d,palette.darkWood);for(let t=0;t<3;t++){const y=.18+t*.3,z=d-.17-t*.22;
          box(root,w/2,y,z,w,.08,.25,palette.oak);for(let j=0;j<6;j++){const cover=box(root,.17+j*(w-.34)/5,y+.13,z-.03,.25,.3,.026,[palette.blue,palette.terracotta,palette.green,palette.ivory][(j+t)%4]);cover.rotation.x=-.24;}}
        break;
      case 'lottery':
        cabinet(root,w,d,.75);box(root,w/2,1.01,d*.35,.66,.48,.1,palette.black);label(root,'LOTERÍA',w/2,1.15,d*.41,.61,.15,{font:54});label(root,'00197',w/2,.96,d*.41,.6,.2,{fg:'#aadd8b',font:58});
        for(let j=0;j<5;j++)box(root,.15+j*.36,.83,d*.75,.27,.05,.3,[palette.blue,palette.ivory,palette.terracotta][j%3]);break;
      case 'vending':
        box(root,w/2,1.0,d/2,w,2,d,palette.white);box(root,w*.39,1.15,d+.01,w*.61,1.38,.03,palette.black);
        for(let t=0;t<4;t++)for(let j=0;j<3;j++)cyl(root,w*.17+j*.19,.62+t*.31,d+.035,.055,.2,[palette.terracotta,palette.green,palette.blue][j]);
        box(root,w*.85,1.05,d+.025,.17,.32,.025,palette.steel);box(root,w*.4,.22,d+.035,.58,.17,.04,palette.black);label(root,'SELECT',w/2,1.86,d+.03,.8,.14,{bg:'#eee8dc',fg:'#193f43'});break;
      case 'manager':
        for(const x of [.12,w-.12])for(const z of [.12,d-.12])box(root,x,.45,z,.07,.9,.07,palette.steel);
        box(root,w/2,.92,d/2,w,.08,d,palette.oak);box(root,w*.55,1.12,.32,.64,.38,.055,palette.steel);label(root,'ADMIRA',w*.55,1.12,.355,.59,.32,{font:53});box(root,w*.55,.98,.65,.61,.035,.2,palette.black);break;
      case 'djBooth':
        cabinet(root,w,d,.8);for(const x of [w*.25,w*.75]){cyl(root,x,.885,d*.55,.22,.035,palette.black);cyl(root,x,.91,d*.55,.07,.01,palette.terracotta);}box(root,w/2,.89,.2,.24,.07,.3,palette.steel);break;
      case 'plant':plant(root);break;
      case 'floorLamp':
        cyl(root,.5,.045,.5,.28,.09);cyl(root,.5,.93,.5,.025,1.8,palette.brass);{const geo=new T.CylinderGeometry(.24,.4,.42,16,1,true);geo.userData.premiumTransient=true;geometry.add(geo);mesh(root,geo,palette.ivory,[.5,1.72,.5]);}ball(root,.5,1.68,.5,.09,palette.light);break;
      case 'tablet':case 'turnKiosk':
        cyl(root,w/2,.06,d/2,.32,.12);box(root,w/2,.62,d/2,.11,1.13,.13,palette.steel);box(root,w/2,1.21,d/2,.69,.63,.12,palette.black);
        label(root,item.type==='tablet'?'HOLA :)':'TURNO',w/2,1.32,d/2+.07,.59,.18,{font:50});label(root,item.type==='tablet'?'★★★★★':'008',w/2,1.07,d/2+.07,.58,.22,{fg:'#e4c571'});break;
      case 'metahuman':
        box(root,.5,.06,.5,.76,.12,.52,palette.black);screen(root,.5,1.01,.5,.66,1.7);break;
      case 'aroma':
        box(root,.5,0,.18,.7,item.ph,.36,palette.ivory);for(let i=0;i<4;i++)box(root,.5,(i-1.5)*item.ph*.11,.365,.48,.018,.01,palette.steel);break;
      case 'rug':box(root,w/2,.012,d/2,w,.024,d,palette.green);break;
      case 'tft':{
        // Legacy TFT is 16:9 in its projected rectangle, spanning four wall cells.
        const width=item.ph*(16/9)*Math.SQRT2*Math.cos(snapshot.elevation);
        const start=Math.max(0,Math.min(snapshot.cols-width,Math.round(item.col+.5)-Math.round(width/2)));
        root.position.x=start;screen(root,width/2,0,.12,width,item.ph);break;}
      case 'led':break; // Shared architectural fascia is constructed once.
      default:
        cabinet(root,w,d,item.ph);if(item.label)label(root,item.label,w/2,item.ph*.65,d+.025,w*.85,.2,{font:46});
    }
  }
  let doorLeaf=null;
  function architecture(){
    const {cols:c,rows:r,wallHeight:h}=snapshot;
    box(world,c/2,-.22,r/2,c+.6,.42,r+.6,palette.limestone);
    box(world,c/2,-.055,r/2,c,.09,r,palette.ivory);
    // Stone joints preserve the editor grid in both presentations.
    for(let x=0;x<=c;x++)box(world,x,.002,r/2,.012,.006,r,palette.pavement);
    for(let z=0;z<=r;z++)box(world,c/2,.002,z,c,.006,.012,palette.pavement);
    box(world,c/2,h/2,-.09,c+.2,h,.18,palette.ivory);box(world,-.09,h/2,r/2,.18,h,r+.2,palette.limestone);
    for(let x=.6;x<c;x+=1.2)box(world,x,h*.43,.018,.024,h*.74,.04,palette.oak);
    for(let z=.6;z<r;z+=1.2)box(world,.018,h*.43,z,.04,h*.74,.024,palette.oak);
    box(world,c/2,.1,.035,c,.2,.08,palette.wood);box(world,.035,.1,r/2,.08,.2,r,palette.wood);
    box(world,c/2,h-.14,.04,c+.15,.28,.25,palette.darkWood);box(world,.04,h-.14,r/2,.25,.28,r+.15,palette.darkWood);
    if(!integrated){
      box(world,c/2,h-.3,.18,c,.025,.035,palette.light);box(world,.18,h-.3,r/2,.035,.025,r,palette.light);
      label(world,'ADMIRA  /  XTANCO',c*.68,h-.14,.18,c*.46,.19,{bg:'#4c3428',fg:'#f5d8a1',font:44});
      label(world,'DIGITAL EXPERIENCE',.18,h-.14,r*.56,r*.65,.19,{rotation:Math.PI/2,bg:'#4c3428',font:40});
    }
    // Two wall screens, matching the existing DS positions; primary media is shared with the window.
    if(!integrated){screen(world,.19,h*.56,r*.28,1.7,h*.54,Math.PI/2);screen(world,.19,h*.56,r*.72,1.7,h*.54,Math.PI/2);}
    // Window bays in the rear wall, with deep reveals and bronze mullions.
    for(const x of [c*.25,c*.65]){
      box(world,x,h*.64,.055,1.16,1.2,.06,palette.blue);box(world,x,h*.64,.10,.045,1.22,.06,palette.brass);box(world,x,h*.64,.10,1.18,.04,.06,palette.brass);
      box(world,x,h*.64-.62,.12,1.3,.06,.3,palette.limestone);
    }
    // Exterior: the short facade is cut away around the actual entrance, never an enclosing front wall.
    box(world,c+.01,h*.39,1.18,.16,h*.78,2.0,palette.darkWood).name='architectural:window-support';
    if(!integrated)screen(world,c+.105,h*.39,1.18,1.73,h*.69,Math.PI/2);
    box(world,c+.04,h*.79,2.63,.17,.12,1.15,palette.wood);
    for(const z of [2.08,3.18])box(world,c+.04,h*.4,z,.1,h*.8,.09,palette.brass);
    const hinge=new T.Group();hinge.name='architectural:door';hinge.position.set(c+.04,0,3.12);world.add(hinge);doorLeaf=hinge;
    box(hinge,0,h*.38,-.49,.035,h*.75,.96,palette.glass);box(hinge,.032,h*.37,-.82,.045,.38,.045,palette.brass);
    if(!integrated){const camera=new T.Group();camera.name='fixture:camera';camera.position.set(c+.2,h*.86,1.1);camera.rotation.z=.25;world.add(camera);
      box(camera,0,0,0,.34,.16,.18,palette.white);const lens=cyl(camera,.2,0,0,.058,.05,palette.black);lens.rotation.z=Math.PI/2;}
    // Raised stone sidewalk, roadside grove and bollards frame the cutaway rather than obscure it.
    box(world,c+1.03,-.11,r/2,1.55,.2,r+1,palette.pavement);
    for(let z=.1;z<r;z+=1.05)box(world,c+1.03,.001,z,1.55,.01,.015,palette.limestone);
    for(let z=.45;z<r;z+=1.8){cyl(world,c+1.65,.25,z,.045,.5,palette.steel);cyl(world,c+1.65,.51,z,.057,.025,palette.brass);}
    box(world,c+2.4,-.18,r/2,1.2,.09,r+1,palette.steel);
    // Architectural objects remain in the scene graph for exact wireframe/render correspondence.
    for(const [x,z] of [[c+1.12,r+.62],[-.7,r+.4]]){
      box(world,x,.18,z,.66,.38,.66,palette.limestone);cyl(world,x,.72,z,.06,1.1,palette.wood);
      for(let i=0;i<4;i++)ball(world,x+Math.sin(i*2.4)*.3,1.28+(i%2)*.2,z+Math.cos(i*2.4)*.3,.43,palette.green);
    }
  }
  function createActor(actor){
    const root=new T.Group();root.name=`actor:${actor.id}`;const cloth=mat(actor.color),skin=mat(actor.skin);cloth.userData.premiumTransient=true;skin.userData.premiumTransient=true;
    const legs=[];for(const x of [-.09,.09]){const leg=new T.Group();leg.position.set(x,.48,0);root.add(leg);box(leg,0,-.2,0,.115,.4,.13,palette.blue);box(leg,0,-.42,.035,.14,.075,.23,palette.black);legs.push(leg);}
    box(root,0,.69,0,.36,.43,.22,cloth);const head=ball(root,0,1.04,0,.155,skin);head.scale.y*=1.12;ball(root,0,1.15,-.022,.14,palette.darkWood);
    for(const x of [-.235,.235]){const arm=box(root,x,.69,0,.10,.42,.12,cloth);arm.rotation.z=x>0?-.1:.1;}
    if(actor.kind==='staff')box(root,0,.61,.12,.23,.37,.012,palette.ivory);
    root.userData.legs=legs;root.userData.actor=actor;actors.add(root);actorMap.set(actor.id,root);return root;
  }
  function updateActors(){
    if(integrated)return;
    const ids=new Set(snapshot.actors.map(a=>a.id));for(const [id,o]of actorMap)if(!ids.has(id)){releaseTransient(o);actors.remove(o);actorMap.delete(id);}
    for(const actor of snapshot.actors){let o=actorMap.get(actor.id);if(o&&(o.userData.actor.color!==actor.color||o.userData.actor.skin!==actor.skin||o.userData.actor.kind!==actor.kind)){releaseTransient(o);actors.remove(o);actorMap.delete(actor.id);o=null;}o=o||createActor(actor);o.position.set(actor.col,0,actor.row);o.rotation.y=actor.heading;o.userData.actor=actor;}
  }
  function releaseTransient(root){
    const usedMaterials=new Set(),usedGeometry=new Set();root.traverse(o=>{if(o.userData.bestMaterial?.userData.premiumTransient)usedMaterials.add(o.userData.bestMaterial);if(o.geometry?.userData.premiumTransient)usedGeometry.add(o.geometry);});
    for(const m of usedMaterials){if(m.map){m.map.dispose();textures.delete(m.map);}m.dispose();materials.delete(m);}
    for(const g of usedGeometry){const edge=edgesByGeometry.get(g);if(edge){edge.dispose();geometry.delete(edge);edgesByGeometry.delete(g);}g.dispose();geometry.delete(g);}
  }
  function setMode(value){mode=value==='better'?'better':'best';scene.background=new T.Color(mode==='better'?'#000502':'#e7e7df');scene.traverse(o=>{
    if(o.userData.premiumEdge)o.visible=mode==='better';
    if(o.isMesh&&o.userData.bestMaterial)o.material=mode==='better'&&o.userData.wire?wireMaterial:o.userData.bestMaterial;
  });}
  const hemi=new T.HemisphereLight('#f1f6ff','#77765b',2.25);scene.add(hemi);
  const sun=new T.DirectionalLight('#ffe6c7',3.0);sun.position.set(-3,12,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;scene.add(sun,sun.target);
  const fill=new T.DirectionalLight('#b9d7e7',1.0);fill.position.set(8,6,-4);scene.add(fill);
  function update(rawSnapshot){
    snapshot=normalizeSnapshot(rawSnapshot);const next=layoutSignature(snapshot);
    if(signature!==next){releaseTransient(world);world.clear();architecture();for(const item of snapshot.layout)if(!integrated||!INTEGRATED_OPERATIONAL_TYPES.has(item.type))furniture(item);signature=next;sun.target.position.set(snapshot.cols/2,0,snapshot.rows/2);setMode(mode);}
    if(doorLeaf)doorLeaf.rotation.y=snapshot.doorOpen*-Math.PI*.48;
    updateActors();return snapshot;
  }
  function animate(time=0){for(const root of actorMap.values()){const a=root.userData.actor;root.userData.legs.forEach((leg,i)=>{leg.rotation.x=a.walking?Math.sin(time*.008+i*Math.PI)*.36:0;});}}
  function refreshMedia(player){if(!videoContext)return;videoContext.clearRect(0,0,512,768);if(player?.draw)player.draw(videoContext,512,768);else{videoContext.fillStyle='#132f35';videoContext.fillRect(0,0,512,768);videoContext.fillStyle='#e6d7af';videoContext.textAlign='center';videoContext.font='500 40px sans-serif';videoContext.fillText('ADMIRA',256,330);videoContext.font='22px sans-serif';videoContext.fillText('PLAYER VIRTUAL',256,382);}videoTexture.needsUpdate=true;}
  function dispose(){for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();scene.clear();actorMap.clear();}
  update(snapshot);setMode(mode);
  return {scene,world,actors,update,setMode,animate,refreshMedia,dispose,get snapshot(){return snapshot;},get mode(){return mode;},get resources(){return {geometry:geometry.size,materials:materials.size,textures:textures.size};}};
}
