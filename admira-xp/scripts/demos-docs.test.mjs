import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {renderDemosSection,TARGETS,START,END} from './demos-docs.mjs';
const root=new URL('../../',import.meta.url),reg=JSON.parse(readFileSync(new URL('admira-xp/demos.json',root),'utf8'));
test('help.html and /help/demos carry the Demos section generated from demos.json (run node admira-xp/scripts/demos-docs.mjs)',()=>{
 const section=renderDemosSection(reg);for(const t of TARGETS){const h=readFileSync(new URL(t.file,root),'utf8');const a=h.indexOf(START),b=h.indexOf(END);assert.ok(a>=0&&b>a,t.file);assert.equal(h.slice(a,b+END.length),section,t.file+' out of date');}
 for(const d of reg.demos)assert.ok(section.includes('id="demo-'+d.id+'"'));
 const f=JSON.parse(readFileSync(new URL('mcp/funcionalidades.json',root),'utf8')).demo_tour;assert.equal(f.count,reg.demos.length);assert.equal(f.tour_total_s,reg.tour.total_s);assert.deepEqual(f.demos.map(d=>d.id),reg.demos.map(d=>d.id));
});
