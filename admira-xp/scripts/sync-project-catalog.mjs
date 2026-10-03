// Build-time snapshot of the public backoffice registry. No remote code execution.
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const sourceUrl='https://www.clearchannel.tv/expert-commands.js?v=20261001-shell-2';
const source=process.argv[2]?await readFile(process.argv[2],'utf8'):await (await fetch(sourceUrl)).text();
const literal=source.match(/const CLIENTS = (\[.*?\n  \]);/s)?.[1];if(!literal)throw Error('Backoffice registry format changed; review before publishing');
const json=literal.replace(/'([^']*)'/g,(_,value)=>JSON.stringify(value)).replace(/\b([a-z]+):/g,'"$1":').replace(/,\s*\]/g,']');
const projects=JSON.parse(json);
if(!Array.isArray(projects)||!projects.every(p=>typeof p.id==='string'&&typeof p.circuit==='string'&&typeof p.label==='string')||new Set(projects.map(p=>p.id)).size!==projects.length)throw Error('Invalid project registry');
await writeFile(new URL('./project-catalog.json',import.meta.url),JSON.stringify({source:sourceUrl,source_sha256:createHash('sha256').update(source).digest('hex'),checked_at:new Date().toISOString().slice(0,10),projects},null,2)+'\n');
console.log('Backoffice projects:',projects.length);
