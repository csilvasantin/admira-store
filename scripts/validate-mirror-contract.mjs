// Fail before rsync can delete delivered UI contracts. Source must publish the same contract.
import {readFileSync,existsSync} from 'node:fs';import {join} from 'node:path';
const [source,target=process.cwd()]=process.argv.slice(2);
if(!source)throw Error('Usage: validate-mirror-contract.mjs SOURCE TARGET');
const read=root=>JSON.parse(readFileSync(join(root,'mcp/manifest.json'),'utf8')).retained_ui_contract;
const current=read(target);if(!current)process.exit(0);
const incoming=read(source);if(!incoming||incoming.revision!==current.revision)throw Error('Mirror stopped: source has not published the retained Alsea UI contract. Publish XpaceOS first.');
for(const path of current.files)if(!existsSync(join(source,path)))throw Error('Mirror stopped: delivered file missing: '+path);
console.log('Retained Alsea UI contract verified before mirroring.');
