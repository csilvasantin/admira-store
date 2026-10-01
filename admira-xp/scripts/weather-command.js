// Shared grammar for the Expert composer and xtAPI. No game or audio side effects.
(()=>{
  const fold=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const on=new Set(['on','si','yes','true','1']);
  const off=new Set(['off','no','false','0']);
  function parse(input,current){
    const parts=fold(input).trim().replace(/^\//,'').split(/\s+/);
    const category=parts.shift();
    if(!['tiempo','weather','lluvia','rain'].includes(category))return null;
    const en=['weather','rain'].includes(category);
    const invalid=()=>({ok:false,error:en?'Usage: /weather rain [audible [on|off]] | sun | normal':'Uso: /tiempo lluvia [sonora [on|off]] | sol | normal'});
    let type=['lluvia','rain'].includes(category)?'rain':parts.shift();
    type=({lluvia:'rain',tormenta:'rain',storm:'rain',sol:'sun',soleado:'sun',off:'normal'})[type]||type||'normal';
    if(!['rain','sun','normal'].includes(type))return invalid();
    if(type!=='rain')return parts.length?invalid():{ok:true,type:type==='normal'?null:type,sonora:false};
    let enabled=true,sonora=false;
    if(['lluvia','rain'].includes(category)&&!parts.length)enabled=current?.type!=='rain';
    if(parts.length&&(on.has(parts[0])||off.has(parts[0])))enabled=on.has(parts.shift());
    if(parts.length){
      const attribute=parts.shift();
      if(['sonora','audible','sound'].includes(attribute)){
        sonora=true;
        if(parts.length&&(on.has(parts[0])||off.has(parts[0])))sonora=on.has(parts.shift());
      }else if(!['silenciosa','silent','quiet'].includes(attribute))return invalid();
    }
    if(parts.length)return invalid();
    return {ok:true,type:enabled?'rain':null,sonora:enabled&&sonora};
  }
  globalThis.XpaceWeatherCommand={parse};
})();
