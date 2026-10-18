"""Taller 3D · dónde va cada pieza y su alta ITIL (mejora 2 del Arquitecto automático, 18-10-2026).

La orden «detallar» de admira.biz/arquitecto coloca cada pieza en el plano del local (admira.xpacio-plano/1) y prepara
su CI de Yokup. La receta lo lleva en `colocacion` e `itil`. Este paso, sin dependencias, lo comprueba contra el plano
publicado en data/xpacios/<xpacio>.json antes de construir y deja escrito lo que hará el cierre automático:
  - la línea del layout del gemelo (col = x, row = y, fp = huella; origen en la esquina de la huella);
  - el CI para itil_ci_upsert (role de 120 caracteres como mucho).

Where each piece goes and its ITIL record: checked against the published floor plan before building; prints the twin
layout line and the Yokup CI the automatic close will use.

python3 colocacion.py RECETA [--repo RAIZ]      sale con 1 si algo no vale / exits 1 on any error
"""
import sys, re, json, pathlib

CODIGO = re.compile(r'^[A-Z0-9]{2,12}(-[A-Z0-9]{2,6}){1,3}$')
XPACIO = re.compile(r'^[a-z0-9][a-z0-9-]{1,80}$')
CAMPOS_CI = ('admira_store_id', 'itil_code', 'name', 'category', 'role', 'group_name', 'position')


def num(v):
    """Número como en starbucks-room.js: 2.04, 3.8, .64."""
    s = f'{round(v, 3):g}'
    return s[1:] if s.startswith('0.') else s


def revisar(receta, repo):
    errores, avisos, layout, cis, planos, codigos = [], [], [], [], {}, {}
    for p in receta.get('piezas', []):
        nombre = p.get('nombre') or p.get('id') or '?'
        c = p.get('colocacion')
        if c:
            xp = str(c.get('xpacio') or receta.get('local') or '')
            if not XPACIO.match(xp):
                errores.append(f'{nombre}: xpacio no válido «{xp}»'); continue
            if xp not in planos:
                f = repo / 'data' / 'xpacios' / f'{xp}.json'
                planos[xp] = json.loads(f.read_text(encoding='utf-8')) if f.exists() else None
            plano, (hx, hy) = planos[xp], (c.get('huella') or [p.get('huella', .64)] * 2)
            x, y = c.get('x'), c.get('y')
            if not all(isinstance(v, (int, float)) for v in (x, y, hx, hy)):
                errores.append(f'{nombre}: colocación sin x, y o huella'); continue
            if p.get('origen') != 'esquina':
                errores.append(f'{nombre}: una pieza colocada tiene el origen en la esquina de su huella')
            if abs(hx - p.get('huella', hx)) > 1e-6 or abs(hy - p.get('huella', hy)) > 1e-6:
                errores.append(f'{nombre}: la huella de la colocación no es la de la pieza')
            if plano is None:
                avisos.append(f'{nombre}: no hay data/xpacios/{xp}.json; sitio sin comprobar')
            else:
                ancho, fondo = plano['planta']['ancho'], plano['planta']['fondo']
                if not (x >= 0 and y >= 0 and x + hx <= ancho + 1e-6 and y + hy <= fondo + 1e-6):
                    errores.append(f'{nombre}: x {x}, y {y} queda fuera de la sala de {ancho} × {fondo} m')
                if c.get('plano') and plano.get('version') and c['plano'] != plano['version']:
                    avisos.append(f"{nombre}: colocada sobre el plano {c['plano']}; el publicado es {plano['version']}")
            tipo = str(p.get('id', '')).removeprefix('native:')
            layout.append(f"{{id:'{p.get('instancia')}',type:'{tipo}',inventoryAssetId:'{p.get('id')}',col:{num(x)},row:{num(y)},"
                          f"fp:[{num(hx)},{num(hy)}],label:{json.dumps(nombre, ensure_ascii=False)}}}")
        i = p.get('itil')
        if i:
            code = i.get('itil_code')
            if code is None: avisos.append(f'{nombre}: código ITIL por asignar')
            elif not CODIGO.match(str(code)): errores.append(f'{nombre}: código ITIL «{code}» sin el formato de Yokup')
            elif code in codigos: errores.append(f'{nombre}: código ITIL {code} repetido con {codigos[code]}')
            else: codigos[code] = nombre
            if len(str(i.get('role', ''))) > 120: errores.append(f'{nombre}: role de más de 120 caracteres (Yokup lo rechaza)')
            if i.get('position') and i['position'] != p.get('instancia'): errores.append(f'{nombre}: position no es la instancia de la pieza')
            if c and i.get('admira_store_id') and i['admira_store_id'] != (c.get('xpacio') or receta.get('local')):
                errores.append(f'{nombre}: el CI es de otro local que su colocación')
            cis.append({k: i.get(k) for k in CAMPOS_CI if i.get(k) is not None})
    return errores, avisos, layout, cis


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args: sys.exit(__doc__)
    receta_path = pathlib.Path(args[0])
    repo = pathlib.Path(args[args.index('--repo') + 1]) if '--repo' in args else pathlib.Path(__file__).resolve().parents[3]
    receta = json.loads(receta_path.read_text(encoding='utf-8'))
    errores, avisos, layout, cis = revisar(receta, repo)
    for a in avisos: print('colocación · aviso:', a)
    for l in layout: print('colocación · gemelo:', l)
    for ci in cis: print('colocación · yokup:', json.dumps(ci, ensure_ascii=False))
    if errores:
        for e in errores: print('colocación · error:', e, file=sys.stderr)
        sys.exit(1)
