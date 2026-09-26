// Four explicit surfaces. Anonymous view consumes geometry ONLY, never pixels.
const labels={person:'Persona',car:'Coche',motorcycle:'Moto',bicycle:'Bici',scooter:'Patinete'};
const colors={person:'#70e5be',car:'#a9cfff',motorcycle:'#edb2ff',bicycle:'#ffd46d',scooter:'#f8ad83'};
function base(ctx,w,h,title){ctx.fillStyle='#06161e';ctx.fillRect(0,0,w,h);ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.font=`bold ${Math.max(4,h*.065)}px sans-serif`;ctx.fillStyle='#a7f1dc';ctx.fillText(title,w*.04,h*.11,w*.92);}
function empty(ctx,w,h,text){ctx.fillStyle='#b5c6cd';ctx.font=`${Math.max(4,h*.075)}px sans-serif`;ctx.textAlign='center';ctx.fillText(text,w/2,h*.56,w*.9);}
export function drawAnonymous(ctx,w,h,traffic){
  ctx.save();base(ctx,w,h,'CALLE · SOLO DETECCIONES');
  if(traffic?.status!=='live'){empty(ctx,w,h,'Sin detecciones recientes');ctx.restore();return;}
  if(!traffic.tracks.length)empty(ctx,w,h,'Sin objetos detectados');
  for(const t of traffic.tracks){
    if(!labels[t.kind]||!Array.isArray(t.box)||t.box.length!==4||!t.box.every(Number.isFinite))continue;
    const [x,y,bw,bh]=t.box;if(x<0||y<0||bw<=0||bh<=0||x+bw>1.001||y+bh>1.001)continue;
    const left=w*.04+x*w*.92,top=h*.2+y*h*.75;
    ctx.strokeStyle=colors[t.kind];ctx.lineWidth=Math.max(.5,h*.008);ctx.strokeRect(left,top,bw*w*.92,bh*h*.75);
    ctx.fillStyle=colors[t.kind];ctx.font=`${Math.max(4,h*.06)}px sans-serif`;ctx.fillText(labels[t.kind],left,Math.max(h*.18,top-1),Math.max(12,w-left));
  }
  ctx.restore();
}
export function drawStatistics(ctx,w,h,audience){
  ctx.save();base(ctx,w,h,'3 · ESTADÍSTICAS DE SESIÓN');
  if(!audience){empty(ctx,w,h,'Esperando analizador');ctx.restore();return;}
  const c=audience.counts,d=audience.directions;
  const rows=[['Personas que han pasado',c.person],['Entran / Salen',`${d.enter} / ${d.exit}`],['Sin dirección',d.unknown],['Coches / Motos',`${c.car} / ${c.motorcycle}`],['Bicis / Patinetes',`${c.bicycle} / ${c.scooter}`]];
  rows.forEach(([label,value],i)=>{const y=h*(.28+i*.13);ctx.textAlign='left';ctx.fillStyle='#afc2c9';ctx.font=`${h*.066}px sans-serif`;ctx.fillText(label,w*.04,y,w*.68);ctx.textAlign='right';ctx.fillStyle='#ffffff';ctx.font=`bold ${h*.09}px sans-serif`;ctx.fillText(String(value),w*.96,y,w*.28);});
  ctx.textAlign='left';ctx.fillStyle='#7e9da8';ctx.font=`${h*.052}px sans-serif`;ctx.fillText('Sentidos de calle · no aforo físico',w*.04,h*.96,w*.92);ctx.restore();
}
export function drawStreet(ctx,w,h,source,fresh){
  ctx.save();base(ctx,w,h,'2 · CALLE EN DIRECTO');
  if(fresh&&source?.width>1&&source?.height>1){const scale=Math.min(w/source.width,h*.83/source.height),sw=source.width*scale,sh=source.height*scale;ctx.drawImage(source,(w-sw)/2,h*.17+(h*.83-sh)/2,sw,sh);}
  else empty(ctx,w,h,'Cámara sin señal reciente');
  ctx.restore();
}
