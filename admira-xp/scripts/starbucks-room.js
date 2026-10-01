/* Starbucks Pg. de Gràcia 103: interpretive cutaway from the Matrix panorama.
 * Coordinates are display grid units, NOT a measured survey. Same fixtures in
 * Good, Better and Best; Matrix remains the original photographic reference. */
(function(root){
  const ID='alsea-sbux-021';
  const active=()=>{try{return new URLSearchParams(root.location?.search||'').get('loc')===ID;}catch{return false;}};
  const layout=()=>[
    {id:'sb-backbar',type:'counter',col:3,row:0,fp:[10,1],label:'Barra de preparación · Espresso'},
    {id:'sb-pos',type:'counter',col:3,row:3,fp:[4,1],label:'Caja · TPV'},
    {id:'sb-pastry',type:'vending',col:7,row:3,fp:[6,1],label:'Vitrina · Bollería y bebidas'},
    {id:'sb-mugs',type:'shelves',col:0,row:3,fp:[1,3],label:'Tazas · Café en grano'},
    {id:'sb-pillar',type:'custom',col:2,row:3,fp:[1,1],label:'Pilar'},
    {id:'sb-table-a',type:'cafeTable',col:3,row:6,fp:[2,2],label:'Mesa redonda'},
    {id:'sb-table-b',type:'cafeTable',col:6,row:6,fp:[2,2],label:'Mesa redonda'}
  ];
  const C={wall:'#61544b',brick:'#79756a',floor:'#afa99c',wood:'#ad855b',slat:'#745640',stone:'#d3c7ae',steel:'#8f9693',black:'#181c1c',green:'#006241',cream:'#e6dbc5',glass:'#9eccc6',light:'#ffe2a0'};
  function build(items=layout(),{quality='good',moving=false}={}){
    const groups=[];let current;const begin=(id,depth)=>{current={id,depth,parts:[]};groups.push(current);};
    const box=(x,y,z,w,h,d,color,extra={})=>current.parts.push({x,y,z,w,h,d,color,...extra});
    const sign=(text,x,y,z,w,h,color=C.green)=>box(x,y,z,w,h,.028,color,{text});
    const cup=(x,y,z,color=C.cream)=>{box(x,y,z,.13,.21,.13,color,{round:true});box(x,y+.22,z,.15,.025,.15,C.black,{round:true});};
    begin('architecture',-1000);
    box(0,-.18,0,14,.18,8,C.stone);
    for(let x=0;x<14;x++)for(let z=0;z<8;z++)box(x,.001,z,.986,.012,.986,(x+z)%3?'#b3ada0':'#a9a398');
    box(0,0,-.18,14,3.3,.18,C.wall);box(-.18,0,0,.18,3.3,8,C.brick);
    // Masonry sidewall, warm bar light and ceiling ventilation grilles.
    for(let z=0;z<8;z+=.6)for(let y=.15;y<3.2;y+=.24)box(.002,y,z+(Math.round(y/.24)%2)*.15,.012,.012,.58,'#5e5b52');
    box(2.9,1.45,.02,10.7,.035,.1,C.light);box(0,3.21,0,14,.10,.22,C.cream);
    box(.01,3.12,0,.25,.18,8,C.cream);
    for(let x=3;x<13;x+=2){box(x,2.99,.06,1.5,.16,.07,C.black);for(let i=0;i<12;i++)box(x+.05+i*.12,3,.14,.024,.14,.02,C.steel);}
    if(!moving){
      // Six portrait menus: from the street entrance 1,2,3 / 4 / 5,6.
      [ {n:6,x:3.3},{n:5,x:4.22},{n:4,x:6.25},{n:3,x:9.05},{n:2,x:9.97},{n:1,x:10.89} ].forEach(({n,x})=>{
        box(x,1.75,.10,.86,1.1,.09,C.black,{device:n,group:n<=3?1:n>=5?2:null});
        box(x+.055,1.81,.202,.75,.97,.015,n<=3?'#bcdfd8':'#006241');
        sign(n<=3?'COFFEE':n===4?'COLD':'STARBUCKS',x+.07,2.57,.23,.72,.12,n<=3?'#d7eee4':C.green);
        for(let j=0;j<3;j++){cup(x+.12+j*.20,2.17,.25,n<=3?C.cream:'#be9b67');box(x+.12+j*.20,1.99,.24,.15,.015,.015,'#386f58');}
        for(let j=0;j<3;j++)box(x+.12,1.87+j*.025,.24,.58,.01,.015,'#478a70');
      });
    }
    // Street vestibule, steps and black balustrade on the sidewall.
    box(.015,.38,6.1,.055,2.36,1.65,C.black);box(.08,.52,6.21,.03,2.05,1.39,'#749593');
    box(.12,.54,6.87,.055,2.02,.04,C.black);box(.14,1.2,6.83,.035,.40,.055,C.stone);
    for(let i=0;i<4;i++)box(i*.34,0,6.08,.34,.42-i*.10,1.76,C.stone);
    box(1.4,.1,6.05,.055,1,.055,C.black);box(.15,.4,6.05,.055,1,.055,C.black);box(.15,1.2,6.05,1.32,.055,.055,C.black);
    sign('EXIT',.06,2.3,5.43,.02,.22,C.green);
    box(.08,2.53,5.12,.23,.38,.24,C.black);
    // Open ceiling: retain the rail and spots without hiding the cutaway.
    box(2.9,3.12,1.18,10.7,.055,.06,C.steel);
    for(let x=3.5;x<13;x+=1.5){box(x,2.93,1.15,.13,.2,.15,C.cream);box(x,2.9,1.14,.14,.035,.17,C.light);}
    if(moving)return groups;
    for(const item of items){
      if(!item.id?.startsWith('sb-'))continue;
      const x=item.col,z=item.row;begin(item.id,x+z+(item.fp?.[1]||1));current.item=item;
      if(item.id==='sb-backbar'){
        box(x,0,z,10,.87,.85,C.wood);box(x,.87,z,10,.09,1,C.steel);
        for(let i=0;i<8;i++)box(x+.1+i*1.23,.06,z+.86,1.14,.72,.035,C.wall);
        box(x+2.5,.98,z+.22,2,.49,.49,C.steel);box(x+2.55,1.10,z+.73,1.90,.17,.035,C.black);
        for(let i=0;i<3;i++){box(x+2.77+i*.52,.99,z+.79,.22,.06,.20,C.black);cup(x+2.77+i*.52,1.01,z+.77);}
        for(let i=0;i<2;i++){box(x+.5+i*.67,.97,z+.25,.43,.33,.43,C.black);box(x+.56+i*.67,1.3,z+.28,.29,.39,.29,'#624a36',{round:true});}
        for(let i=0;i<10;i++)cup(x+5.2+i*.3,.98,z+.27,i%2?C.green:C.cream);
        box(x+8,.98,z+.13,1,.66,.54,C.black);box(x+8.08,1.08,z+.68,.83,.42,.015,C.steel);
      }else if(item.id==='sb-pos'||item.id==='sb-pastry'){
        const w=item.id==='sb-pos'?4:6;box(x,0,z,w,.95,1,C.wood);
        for(let i=0;i<w*10;i++)box(x+i*.1,.05,z+1,.038,.86,.025,C.slat);
        box(x-.06,.96,z-.04,w+.12,.075,1.12,C.stone);
        box(x+.12,.45,z+1.04,w-.24,.13,.13,C.stone);
        if(item.id==='sb-pos'){
          box(x+1.6,1.04,z+.43,.5,.15,.37,C.black);box(x+1.58,1.16,z+.38,.54,.77,.075,C.black);
          box(x+1.625,1.21,z+.466,.445,.65,.012,'#70a4c9',{device:'pos'});
          sign('TPV',x+1.65,1.46,z+.49,.4,.12,'#426a84');
          for(let i=0;i<4;i++)cup(x+.3+i*.23,1.04,z+.23);
          box(x+2.7,1.04,z+.3,.67,.18,.43,C.black);
        }else{
          for(const y of [1.08,1.35,1.62]){
            box(x+.07,y,z+.03,w-.14,.045,.89,C.steel);
            for(let i=0;i<12;i++){box(x+.17+i*.47,y+.05,z+.25,.34,.07,.37,C.cream);box(x+.20+i*.47,y+.13,z+.27,.27,.14,.27,['#ca9852','#b8783c','#d9b46c','#754f36'][i%4],{round:true});if(quality==='best')box(x+.24+i*.47,y+.26,z+.30,.13,.025,.12,'#f2dab0');}
            box(x+.10,y+.04,z+.95,w-.2,.013,.02,C.light);
          }
          for(const xx of [x,x+2,x+4,x+6])box(xx,1.04,z+.98,.035,.86,.03,C.black);
          box(x,1.06,z+1,w,.82,.018,C.glass,{glass:true});
          box(x,1.94,z,6,.035,1.04,C.glass,{glass:true});
          box(x,1.94,z,6,.04,.035,C.black);box(x,1.94,z+1,6,.04,.035,C.black);
        }
      }else if(item.id==='sb-mugs'){
        box(x,0,z,.85,.48,3,C.wood);box(x,.48,z,.06,1.85,3,C.cream);
        for(let k=0;k<6;k++){let y=.49+k*.34;box(x,y,z,.93,.045,3,C.wood);for(let j=0;j<10;j++){
          if(k===5)box(x+.16,y+.06,z+.10+j*.28,.42,.28,.22,['#965333','#ccb183','#488e75'][j%3]);
          else cup(x+.52,y+.06,z+.08+j*.28,[C.green,C.cream,'#c07c37'][j%3]);
        }}
        for(const zz of [z,z+1.5,z+3])box(x+.85,0,zz,.06,2.34,.04,C.steel);
      }else if(item.id==='sb-pillar')box(x,0,z,.72,3.3,.72,C.cream);
      else if(item.type==='cafeTable'){
        box(x+.4,0,z+.4,.67,.06,.67,C.black,{round:true});box(x+.68,.05,z+.68,.1,.68,.1,C.black);
        box(x+.12,.74,z+.12,1.25,.085,1.25,C.wood,{round:true});cup(x+.70,.83,z+.5);
        for(const zz of [z-.12,z+1.48]){box(x+.47,.37,zz,.6,.07,.48,C.wood);box(x+.47,.42,zz+.39,.6,.47,.065,C.wood);for(const xx of [x+.52,x+1])box(xx,0,zz+.08,.05,.39,.27,C.black);}
      }
    }
    return groups;
  }
  // Quarter turns remain axis-aligned boxes in Good; use the same layout
  // origin and horizontal scale as the THREE group in Better/Best.
  function transformPart(part,item){
    if(!item)return part;
    const sx=item.sx??1,sy=item.sy??1,flip=item.flipX?-1:1,a=-(item.rot??0)*Math.PI/2,c=Math.cos(a),n=Math.sin(a);
    const corners=[[part.x,part.z],[part.x+part.w,part.z],[part.x,part.z+part.d],[part.x+part.w,part.z+part.d]].map(([x,z])=>{
      x=(x-item.col)*sx*flip;z=(z-item.row)*sx;
      return [item.col+c*x+n*z,item.row-n*x+c*z];
    });
    const xs=corners.map(p=>p[0]),zs=corners.map(p=>p[1]);
    return {...part,x:Math.min(...xs),z:Math.min(...zs),w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),y:part.y*sy,h:part.h*sy};
  }
  // Canvas follows the existing Good projection and pixel grid; no image backdrop.
  let cachedKey=null,cachedGroups=null;
  function draw(ctx,iso,project,items,actors=[],moving=false){
    const height=iso.tileW/Math.SQRT2*Math.cos(Math.asin(iso.tileH/iso.tileW));
    const p=(x,y,z)=>{const v=project(x,z);return [Math.round(v.x),Math.round(v.y-y*height)];};
    const shade=(hex,k)=>'#'+hex.slice(1).match(/../g).map(v=>Math.min(255,Math.round(parseInt(v,16)*k)).toString(16).padStart(2,'0')).join('');
    const poly=(points,color)=>{ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
    const key=JSON.stringify([items,moving]);if(key!==cachedKey){cachedGroups=build(items,{moving});cachedKey=key;}
    const groups=[...cachedGroups];for(const a of actors)groups.push({depth:a.depth,draw:a.draw});
    groups.sort((a,b)=>a.depth-b.depth);
    for(const g of groups){if(g.draw){g.draw();continue;}for(const raw of g.parts){const v=transformPart(raw,g.item),{x,y,z,w,h,d,color}=v;
      const a=p(x,y+h,z),b=p(x+w,y+h,z),c=p(x+w,y+h,z+d),e=p(x,y+h,z+d),f=p(x+w,y,z+d),j=p(x,y,z+d),k=p(x+w,y,z);
      ctx.globalAlpha=v.glass?.22:1;
      if(v.round){
        const ring=Array.from({length:10},(_,i)=>{const t=i*Math.PI/5;return [x+w/2+Math.cos(t)*w/2,z+d/2+Math.sin(t)*d/2];});
        for(let i=0;i<10;i++){const n=(i+1)%10;poly([p(ring[i][0],y,ring[i][1]),p(ring[n][0],y,ring[n][1]),p(ring[n][0],y+h,ring[n][1]),p(ring[i][0],y+h,ring[i][1])],shade(color,.78));}
        poly(ring.map(([xx,zz])=>p(xx,y+h,zz)),color);
      }else{poly([b,k,f,c],shade(color,.70));poly([e,c,f,j],shade(color,.88));poly([a,b,c,e],color);}
      if(v.text){ctx.save();ctx.transform((c[0]-e[0])/w,(c[1]-e[1])/w,0,height,e[0],e[1]);ctx.fillStyle='#f5eed9';ctx.font=`bold ${h*.72}px monospace`;ctx.textAlign='center';ctx.fillText(v.text,w/2,h*.78,w*.93);ctx.restore();}
    }}ctx.globalAlpha=1;
  }
  root.XpaceStarbucks={id:ID,active,layout,build,draw,transformPart};
})(globalThis);
