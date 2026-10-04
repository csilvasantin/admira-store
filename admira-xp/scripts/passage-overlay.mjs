import * as T from './premium-three.mjs';

const floor=.095;
const colors={route:'#72edb8',origin:'#69cfff',target:'#72edb8',blocker:'#ff906e'};
const point=value=>value&&Number.isFinite(value.col)&&Number.isFinite(value.row);

/** Presentation of a diagnostic only. No actor, layout or door is changed. */
export function appendPassageOverlay(group,result){
  if(!result||result.status==='unavailable')return;
  const radius=result.radius,height=result.actor==='unitree'?1.15:1.85;
  if(!(radius>0&&Number.isFinite(radius)))return;
  function add(geometry,material,role,position,rotation){
    const mesh=new T.Mesh(geometry,material);mesh.userData.passageRole=role;
    mesh.renderOrder=18;if(position)mesh.position.set(...position);if(rotation)mesh.rotation.set(...rotation);group.add(mesh);return mesh;
  }
  const material=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false,side:T.DoubleSide});
  function marker(p,role){
    if(!point(p))return;
    const color=colors[role];
    add(new T.RingGeometry(Math.max(0,radius-.025),radius+.025,48),material(color,.95),role,[p.col,floor+.01,p.row],[-Math.PI/2,0,0]);
    add(new T.CylinderGeometry(radius,radius,height,32,1,true),material(color,.13),role+':volume',[p.col,height/2,p.row]);
  }
  if(result.status==='clear'&&Array.isArray(result.route)){
    const route=result.route.filter(point);
    for(let i=1;i<route.length;i++){
      const a=route[i-1],b=route[i],length=Math.hypot(b.col-a.col,b.row-a.row);if(length<1e-8)continue;
      const angle=Math.atan2(b.col-a.col,b.row-a.row),position=[(a.col+b.col)/2,height/2,(a.row+b.row)/2];
      add(new T.BoxGeometry(radius*2,height,length),material(colors.route,.07),'route:volume',position,[0,angle,0]);
      const strip=add(new T.PlaneGeometry(radius*2,length),material(colors.route,.23),'route:floor',[position[0],floor,position[2]],[-Math.PI/2,0,0]);
      strip.rotation.z=angle;
    }
    // Circular joins show the entire swept body radius at bends and endpoints.
    for(const p of route){
      add(new T.CircleGeometry(radius,40),material(colors.route,.23),'route:join',[p.col,floor,p.row],[-Math.PI/2,0,0]);
      add(new T.CylinderGeometry(radius,radius,height,32,1,true),material(colors.route,.07),'route:join-volume',[p.col,height/2,p.row]);
    }
  }
  for(const blocker of result.blockers||[]){
    const {minCol,maxCol,minRow,maxRow}=blocker;if(![minCol,maxCol,minRow,maxRow].every(Number.isFinite))continue;
    const width=Math.max(.015,maxCol-minCol),depth=Math.max(.015,maxRow-minRow),position=[(minCol+maxCol)/2,height/2,(minRow+maxRow)/2];
    const mesh=add(new T.BoxGeometry(width,height,depth),material(colors.blocker,.2),'blocker',position);mesh.userData.blockerId=blocker.id;mesh.userData.itemId=blocker.itemId;
    const geometry=new T.EdgesGeometry(mesh.geometry),line=new T.LineSegments(geometry,new T.LineBasicMaterial({color:colors.blocker,transparent:true,opacity:.9,depthTest:false}));
    line.position.copy(mesh.position);line.renderOrder=19;line.userData.passageRole='blocker:outline';group.add(line);
  }
  marker(result.origin,'origin');marker(result.target,'target');
}
