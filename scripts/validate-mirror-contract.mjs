// Fail before rsync can delete delivered UI contracts. Source must publish the same contract.
import {readFileSync,existsSync} from 'node:fs';import {join} from 'node:path';
import {createHash} from 'node:crypto';
const [source,target=process.cwd()]=process.argv.slice(2);
if(!source)throw Error('Usage: validate-mirror-contract.mjs SOURCE TARGET');
const read=root=>JSON.parse(readFileSync(join(root,'mcp/manifest.json'),'utf8'));
const current=read(target),incoming=read(source);
if(current.retained_ui_contract){
 const contract=current.retained_ui_contract;
 if(incoming.retained_ui_contract?.revision!==contract.revision)throw Error('Mirror stopped: source has not published the retained Alsea UI contract. Publish XpaceOS first.');
 for(const path of contract.files)if(!existsSync(join(source,path)))throw Error('Mirror stopped: delivered file missing: '+path);
}
const demos=current.store_demo_contract;
if(demos){
 if(incoming.store_demo_contract?.revision!==demos.revision)throw Error('Mirror stopped: publish the Store local demo contract in XpaceOS before syncing.');
 const hash=(root,path)=>createHash('sha256').update(readFileSync(join(root,path))).digest('hex');
 for(const path of demos.files)if(!existsSync(join(source,path))||hash(source,path)!==hash(target,path))throw Error('Mirror stopped: Store demo runtime/guide differs in source: '+path);
 const html=readFileSync(join(source,'admira-xp/index.html'),'utf8');
 for(const marker of demos.bootstrap_markers)if(!html.includes(marker))throw Error('Mirror stopped: Store avatar/composer bootstrap missing: '+marker);
 for(const path of demos.help_files)if(!readFileSync(join(source,path),'utf8').includes('id="store-local-demos"'))throw Error('Mirror stopped: Store local demo help missing: '+path);
 for(const path of ['mcp/manifest.json','mcp/funcionalidades.json']){
  const from=JSON.parse(readFileSync(join(source,path),'utf8')),to=JSON.parse(readFileSync(join(target,path),'utf8'));
  for(const key of ['demo_soluciones','demo_catalog'])if(JSON.stringify(from[key])!==JSON.stringify(to[key]))throw Error('Mirror stopped: Store demo catalog differs: '+path+'#'+key);
 }
}
console.log('Retained UI and Store demo contracts verified before mirroring.');
