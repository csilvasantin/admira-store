import {createSceneSnapshot} from './xtanco-scene-snapshot.mjs';

// A visual layer of the running shop. It never handles input, owns a clock,
// creates a player or advances the simulation.
export function createQualityController({worldCanvas,operationsCanvas,getState,
  loadRenderer=()=>import('./premium-renderer.mjs'),onChange=()=>{},onError=()=>{},now=()=>performance.now()}={}){
  const snapshot=createSceneSnapshot(),operations=operationsCanvas.getContext('2d');
  let mode='good',renderer=null,loading=null,lastFrame=-Infinity,active=false,worldReady=false,suspended=false;
  function announce(busy=false){onChange({mode,busy});}
  function fail(error){mode='good';worldReady=false;onError(error);announce();}
  function dispose(){renderer?.dispose();renderer=null;worldReady=false;lastFrame=-Infinity;}
  async function prepare(){
    if(renderer||suspended||mode==='good')return;
    if(loading)return loading;
    announce(true);
    loading=loadRenderer().then(({createPremiumRenderer})=>{
      if(suspended||mode==='good')return;
      renderer=createPremiumRenderer({canvas:worldCanvas,mode,integrated:true,controls:false});
      lastFrame=-Infinity;
    }).catch(fail).finally(()=>{loading=null;announce();});
    return loading;
  }
  async function choose(next){
    mode=['better','best'].includes(next)?next:'good';lastFrame=-Infinity;worldReady=false;
    renderer?.setMode(mode==='good'?'best':mode);announce();
    if(mode!=='good')await prepare();
  }
  function begin(_context,canvas){
    active=false;
    if(mode==='good'||suspended||!renderer)return false;
    const scene=snapshot(getState());
    if(!scene?.projection)return false;
    const width=canvas.width,height=canvas.height,time=now();
    if(operationsCanvas.width!==width||operationsCanvas.height!==height){operationsCanvas.width=width;operationsCanvas.height=height;lastFrame=-Infinity;}
    operations.setTransform(1,0,0,1,0,0);operations.clearRect(0,0,width,height);
    try{
      if(!worldReady||time-lastFrame>=1000/30||scene.editor){
        renderer.resize(width,height,1);renderer.update(scene);renderer.render(time);
        lastFrame=time;worldReady=true;
      }
      active=worldReady;return active;
    }catch(error){fail(error);dispose();return false;}
  }
  function paint(context,_time,punchScreens=()=>{}){
    if(!active)return;
    context.save();
    try{
      context.setTransform(1,0,0,1,0,0);context.globalAlpha=1;context.globalCompositeOperation='source-over';
      context.shadowBlur=0;context.shadowColor='transparent';context.filter='none';
      if(worldReady){
        try{context.drawImage(worldCanvas,0,0,operationsCanvas.width,operationsCanvas.height);punchScreens();}
        catch(error){fail(error);}
      }
      // The operational callbacks have already run. Preserve them even when
      // GPU presentation fails so a failed frame never loses controls/actors.
      context.drawImage(operationsCanvas,0,0);
    }finally{context.restore();active=false;}
  }
  return {choose,begin,paint,operationContext:()=>active?operations:null,
    get mode(){return mode;},get active(){return active;},
    suspend(){suspended=true;active=false;dispose();},
    resume(){suspended=false;return prepare();},
    contextLost(error=new Error('WebGL context lost')){fail(error);dispose();},
    dispose};
}
