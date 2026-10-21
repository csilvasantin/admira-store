// La marca del espejo (Carlos, 21-oct-2026): admira.store dice «admira.store» en título, cabecera, pie y tarjeta
// «estás aquí», y el shell común pinta ese nombre y esa etiqueta de versión. Se prueba ejecutando sello-y-verja.py
// sobre una copia FRESCA del origen (el clon de xpaceos), como hace sync-desde-xpaceos.sh, y una segunda vez
// sobre lo ya marcado (no debe romper ni duplicar).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=dirname(fileURLToPath(import.meta.url))+'/..';
const origen=process.env.XPACEOS_CLON||join(root,'..','xpaceos');
const hayOrigen=existsSync(join(origen,'index.html'))&&existsSync(join(origen,'assets','xpace-shell.js'));

function espejoDePrueba(desde){
 const dir=mkdtempSync(join(tmpdir(),'espejo-'));
 mkdirSync(join(dir,'assets'));
 copyFileSync(join(desde,'index.html'),join(dir,'index.html'));
 copyFileSync(join(desde,'assets','xpace-shell.js'),join(dir,'assets','xpace-shell.js'));
 return dir;
}
function sellar(dir){
 const r=spawnSync('python3',[join(root,'sello-y-verja.py')],{cwd:dir,env:{...process.env,SELLO:'v.21.10.2026.r1.00:00',ORIGEN_SHA:'abc1234'},encoding:'utf8'});
 return r;
}

test('sello-y-verja.py marca el espejo: título, cabecera, pie, tarjeta «estás aquí» y shell',{skip:!hayOrigen&&'sin clon de xpaceos al lado'},()=>{
 const dir=espejoDePrueba(origen);
 const r=sellar(dir);assert.equal(r.status,0,r.stderr+r.stdout);assert.match(r.stdout,/marca admira\.store/);
 const html=readFileSync(join(dir,'index.html'),'utf8'),shell=readFileSync(join(dir,'assets','xpace-shell.js'),'utf8');
 assert.match(html,/<title>admira\.store · El sistema operativo del comercio físico<\/title>/);
 assert.match(html,/<meta property="og:site_name" content="admira\.store">/);
 assert.match(html,/\n\s*es:\s*\{[\s\S]*?title: 'admira\.store · El sistema operativo del comercio físico'/,'título ES del diccionario (lo pone applyLanguage)');
 assert.match(html,/\n\s*en:\s*\{[\s\S]*?title: 'admira\.store · The operating system of physical retail'/,'título EN del diccionario');
 assert.doesNotMatch(html,/title: 'XpaceOS\.com the Operative System of Retailers'/);
 assert.match(html,/<a class="brand-logo" href="#top" aria-label="admira\.store"><span class="store-wordmark"/,'cabecera propia con la palabra admira.store');
 assert.match(html,/<a class="footer-logo" href="#top" aria-label="admira\.store"><span class="store-wordmark"/,'pie con la palabra');
 assert.match(html,/© 2026 ADmiraNeXT · admira\.store/);
 assert.match(html,/<h3>admira\.store<\/h3>\s*<div class="who dom"><span class="lbl" data-i18n="platform\.brand">marca<\/span> · <a href="https:\/\/www\.admira\.store\/">admira\.store<\/a>/,'tarjeta «estás aquí»');
 assert.match(html,/→ admira\.store<\/a>/);
 assert.doesNotMatch(html,/xpaceos-logo-transparent\.webp" alt="XpaceOS"/,'ni el logo de XpaceOS en cabecera ni en pie');
 assert.doesNotMatch(html,/xpace-shell\.js\?v=[A-Za-z0-9._-]+-store"/,'el sello de caché del shell no cambia: Pages sirve los assets con must-revalidate');
 assert.match(shell,/<span class="xs-brand-name">admira\.store<\/span>/);
 assert.match(shell,/version: release \? 'admira\.store ' \+ release : 'admira\.store'/);
 assert.doesNotMatch(shell,/XpaceOS · volver al inicio/);
 // Segunda pasada sobre lo ya marcado: ni rompe ni duplica.
 const r2=sellar(dir);assert.equal(r2.status,0,r2.stderr+r2.stdout);
 const html2=readFileSync(join(dir,'index.html'),'utf8');
 assert.equal((html2.match(/store-wordmark" aria-hidden/g)||[]).length,2);
 rmSync(dir,{recursive:true,force:true});
});

test('si el origen cambia y falta un ancla de la marca, el espejado para en vez de publicar a medias',{skip:!hayOrigen&&'sin clon de xpaceos al lado'},()=>{
 const dir=espejoDePrueba(origen);
 writeFileSync(join(dir,'index.html'),readFileSync(join(dir,'index.html'),'utf8').replace('<span>© 2026 ADmiraNeXT · XpaceOS</span>','<span>© 2026 otra cosa</span>'));
 const r=sellar(dir);assert.notEqual(r.status,0);assert.match(r.stderr+r.stdout,/Marca admira\.store: esperaba/);
 rmSync(dir,{recursive:true,force:true});
});
