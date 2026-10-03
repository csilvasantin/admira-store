import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {expertCategories,createExpertDock} from './expert-workspace.mjs';
const shell=createRequire(import.meta.url)('./xpace-shell.js');
test('shared Expert retains CLI IDs and the native three-column category contract',()=>{
 const html=shell.markup({}, {lang:'en'}).expert;
 for(const id of ['xsCliForm','xsCli','xsLog','expertQuickIcons','expertCategoryDetail','expertControlsLabel','expertPreviewLabel'])assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
 assert.equal([...html.matchAll(/data-expert-divider=/g)].length,2);
 assert.match(html,/<textarea id="xsCli"/);assert.match(html,/CATEGORY OPTIONS/);assert.match(html,/PREVIEWS/);
 const defs=expertCategories({editor:{id:'changed',actions:[{command:'/distribuir'}]}});
 assert.deepEqual(defs.map(d=>d.id),['signage','admiralive','livecam','dvr','anonymizer','editor','avatar3d','impactos','inventory','perception']);
 assert.equal(defs[5].actions[0].command,'/distribuir');assert.equal(expertCategories()[5].actions[0].command,'/distribuir');
});
function harness(){
 class Node extends EventTarget{
  constructor(){super();this.children=[];this.parentNode=null;this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)};}
  get isConnected(){return this===root||!!this.parentNode?.isConnected;}
  append(node){node.remove();this.children.push(node);node.parentNode=this;}
  before(node){node.remove();const parent=this.parentNode;parent.children.splice(parent.children.indexOf(this),0,node);node.parentNode=parent;}
  remove(){if(this.parentNode){const parent=this.parentNode;parent.children.splice(parent.children.indexOf(this),1);this.parentNode=null;}}
  querySelector(){return null;}setAttribute(){}
 }
 const root=new Node(),original=new Node(),first=new Node(),second=new Node(),tool=new Node();root.append(original);root.append(first);root.append(second);original.append(tool);
 const doc={createComment:()=>new Node(),createElement:()=>new Node()};return{doc,original,first,second,tool};
}
test('same live tool transfers between dock hosts and returns to its original parent',()=>{
 const h=harness(),dock=createExpertDock(h);let calls=0;h.tool.addEventListener('edit',()=>calls++);
 assert.equal(dock.dock(h.tool,h.first,'Detach'),true);const anchor=h.original.children[0];
 h.tool.dispatchEvent(new Event('edit'));assert.equal(calls,1);assert.equal(h.tool.parentNode,h.first);
 assert.equal(dock.dock(h.tool,h.first,'Detach'),false);assert.equal(dock.dock(h.tool,h.second,'Detach'),true);
 assert.equal(h.original.children[0],anchor);assert.equal(h.tool.parentNode,h.second);assert.equal(h.tool.children.length,1);
 dock.releaseAll();assert.deepEqual(h.original.children,[h.tool]);assert.equal(h.tool.classList.contains('xs-expert-docked'),false);
 h.tool.dispatchEvent(new Event('edit'));assert.equal(calls,2);assert.equal(h.tool.children.length,0);
});
test('explicit detach suppresses redocking; disposed tools cannot be resurrected',()=>{
 const h=harness();let released=new WeakSet();const dock=createExpertDock({...h,accept:p=>!released.has(p)});
 dock.dock(h.tool,h.first,'Detach',p=>released.add(p));h.tool.children[0].dispatchEvent(new Event('click'));
 assert.equal(h.tool.parentNode,h.original);assert.equal(dock.dock(h.tool,h.first,'Detach'),false);
 released=new WeakSet();dock.dock(h.tool,h.first,'Detach');h.tool.remove();dock.prune();dock.releaseAll();assert.equal(h.tool.isConnected,false);assert.equal(h.original.children.length,0);
});

test('bilingual help and both MCP catalogues agree on the shared workspace and preserved history',async()=>{
 const {readFile}=await import('node:fs/promises');const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const manifest=JSON.parse(await read('mcp/manifest.json')),catalogue=JSON.parse(await read('mcp/funcionalidades.json'));
 assert.deepEqual(manifest.expert_workspace,catalogue.expert_workspace);
 assert.deepEqual(manifest.expert_workspace.category_ids,expertCategories().map(d=>d.id));
 assert.equal(manifest.expert_workspace.history_key,shell.HISTORY_KEY);assert.equal(manifest.expert_workspace.new_remote_tools,false);
 for(const file of ['admira-xp/help.html','help/index.html','help/cli/index.html']){const html=await read(file),section=html.match(/<section id="expert-workspace">([\s\S]*?)<\/section>/)?.[1];assert.ok(section,file);for(const text of ['lang="es"','lang="en"','32/38/30','Desacopla'.toLowerCase(),'/avatarDigital'])assert.ok(section.toLowerCase().includes(text.toLowerCase()),file+' '+text);}
});
