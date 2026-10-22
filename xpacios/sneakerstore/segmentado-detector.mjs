// Detector en el navegador: el mismo de Xtore (admira.tv/videoanalytics/xtore/{model-loader,detector}.mjs, 11-oct-2026):
// TensorFlow.js 4.22.0 + COCO-SSD 2.2.3 fijados con SRI y el postprocesado por clase (persona, bici, coche, moto)
// copiado tal cual para que este panel y Xtore vean lo mismo sobre la Puerta Cam. Sin red propia: solo el CDN y el modelo.
const SCORE_INDEX={person:0,bicycle:1,car:2,motorcycle:3};
const TF_URL='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.es2017.min.js',TF_SRI='sha384-ODzrY1mCTIRZRerZfDIqCoTQafA1St1OwLVc9SsTefnkCF1MeIaVSZ88wuK/NKfH';
const COCO_URL='https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js',COCO_SRI='sha384-7qLdgfEQyO9ZQi9ArRHigK+IBto4XPk468jAqc+fnsXaZIcMAhQeLwzggRK7aESl';
const MODEL_URL='https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2/model.json';

export function iou(a,b){const area=Math.max(0,Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));return area/(a[2]*a[3]+b[2]*b[3]-area)||0;}
export function decodeDetections(scores,boxes,count,classes,width,height,minScore=.25){
  if(classes!==90||scores.length!==count*classes||boxes.length!==count*4)throw new Error('COCO output contract changed');
  const result=[];
  for(const [category,index] of Object.entries(SCORE_INDEX)){
    const candidates=[];
    for(let i=0;i<count;i++){
      const score=scores[i*classes+index];if(!Number.isFinite(score)||score<minScore||score>1)continue;
      const values=Array.from(boxes.subarray(i*4,i*4+4));if(!values.every(Number.isFinite))continue;
      const [top,left,bottom,right]=values.map(v=>Math.min(1,Math.max(0,v)));
      const bbox=[left*width,top*height,(right-left)*width,(bottom-top)*height];
      if(bbox[2]<3||bbox[3]<3)continue;
      candidates.push({class:category,score,bbox});
    }
    const kept=[];
    for(const p of candidates.sort((a,b)=>b.score-a.score).slice(0,200)){if(!kept.some(previous=>iou(p.bbox,previous.bbox)>.45))kept.push(p);if(kept.length===20)break;}
    result.push(...kept);
  }
  return result.sort((a,b)=>b.score-a.score);
}
function loadScript(src,integrity){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.integrity=integrity;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(new Error('No se pudo cargar '+src));document.head.append(s);});}
function withDeadline(task,label,ms){let timer;return Promise.race([task(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+': no ha terminado en '+ms/1000+' s')),ms);})]).finally(()=>clearTimeout(timer));}

export function createDetector({onProgress=()=>{},minScore=.25}={}){
  let model=null,loading=null;
  async function load(){
    if(model)return model;
    loading??=(async()=>{
      if(typeof window.tf?.ready!=='function'){onProgress('1/4 · TensorFlow');await withDeadline(()=>loadScript(TF_URL,TF_SRI),'TensorFlow',30000);}
      if(typeof window.cocoSsd?.load!=='function'){onProgress('2/4 · COCO-SSD');await withDeadline(()=>loadScript(COCO_URL,COCO_SRI),'COCO-SSD',30000);}
      onProgress('3/4 · motor');await withDeadline(()=>window.tf.ready(),'Motor',15000);
      onProgress('4/4 · modelo (~20 MB)');model=await withDeadline(()=>window.cocoSsd.load({base:'mobilenet_v2',modelUrl:MODEL_URL}),'Modelo',180000);
      onProgress('');return model;
    })().catch(e=>{loading=null;throw e;});
    return loading;
  }
  async function detect(source){
    const m=await load(),tf=window.tf;
    if(!m.model?.executeAsync||!tf?.tidy)return m.detect(source,40,minScore);
    let batch,output;
    try{
      batch=tf.tidy(()=>tf.expandDims(tf.browser.fromPixels(source)));
      output=await m.model.executeAsync(batch);
      if(!Array.isArray(output)||output.length!==2||output[0].shape.length!==3||output[1].shape.at(-1)!==4)throw new Error('Unexpected COCO outputs');
      const [scores,boxes]=await Promise.all([output[0].data(),output[1].data()]);
      return decodeDetections(scores,boxes,output[0].shape[1],output[0].shape[2],batch.shape[2],batch.shape[1],minScore);
    }finally{if(output)tf.dispose(output);batch?.dispose();}
  }
  return {load,detect,get ready(){return !!model;},dispose(){model?.dispose?.();model=null;loading=null;}};
}
