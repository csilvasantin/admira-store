// La marca con la que se entra limita los proyectos del selector (Carlos, 15-oct-2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import {marcaQueLimita,proyectosPermitidos,PROYECTOS_DE_MARCA} from './marca-proyectos.mjs';

const P=['starbucks','starbucks-mexico','altadis','estancos','jti','cafebreria'].map(id=>({id}));
const ids=l=>l.map(p=>p.id);

test('only a brand set by hand (?marca= or /marca) limits; Admira, none or a project-applied brand do not',()=>{
 assert.equal(marcaQueLimita({marca:'starbucks',manual:'1'}),'starbucks');
 assert.equal(marcaQueLimita({marca:' Altadis ',manual:'1'}),'altadis');
 for(const c of [{marca:'starbucks'},{marca:'starbucks',manual:'off'},{marca:'admira',manual:'1'},{marca:'off',manual:'1'},{marca:'',manual:'1'},{marca:'../x',manual:'1'},{}])assert.equal(marcaQueLimita(c),'',JSON.stringify(c));
});

test('each brand opens its own projects; Altadis the tobacconists but not a competitor',()=>{
 assert.deepEqual(ids(proyectosPermitidos('starbucks',P)),['starbucks','starbucks-mexico']);
 assert.deepEqual(ids(proyectosPermitidos('altadis',P)),['altadis','estancos']);
 assert.ok(!PROYECTOS_DE_MARCA.altadis.includes('jti'));
 assert.deepEqual(ids(proyectosPermitidos('',P)),ids(P),'no limiting brand: all');
 assert.deepEqual(ids(proyectosPermitidos('cafebreria',P)),['cafebreria'],'a brand without an entry opens the project with its id');
 assert.deepEqual(ids(proyectosPermitidos('lumbre',P)),ids(P),'a demo brand with no project never empties the selector');
});
