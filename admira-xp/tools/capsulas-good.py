#!/usr/bin/env python3
"""Batería GOOD de cápsulas «¿Sabías que…?» (Carlos, 10-oct-2026 16:2x).

GOOD = modelo abierto gratuito: NVIDIA Nemotron 3 Ultra en integrate.api.nvidia.com.
Se genera OFFLINE una vez (coste 0 en tiempo de ejecución): el navegador sólo lee
admira-xp/capsulas/capsulas-good.json. La clave sale de la bóveda al entorno
(NVIDIA_API_KEY) y nunca se imprime ni se guarda.

Dos pasadas por tipología: 1) Nemotron propone 14 datos muy conocidos en ES+EN;
2) Nemotron, como verificador, marca cada uno «seguro» o «dudoso»; los dudosos se
descartan y se quedan 10. Prompts, respuestas y uso de tokens → capsulas-good.log.json.

Uso:  NVIDIA_API_KEY=$(vault-get.sh NVIDIA_API_KEY) python3 tools/capsulas-good.py [tipo ...]
"""
import json, os, re, sys, time, urllib.request, hashlib, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'capsulas', 'capsulas-good.json')
LOG = os.path.join(HERE, '..', 'capsulas', 'capsulas-good.log.json')
URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
MODEL = os.environ.get('NEMOTRON_MODEL', 'nvidia/nemotron-3-ultra-550b-a55b')
PER = 10
TIPOS = {
 'musica':      ('Música', 'Music', 'music'),
 'tecnologia':  ('Tecnología', 'Technology', 'cpu'),
 'sociedad':    ('Sociedad', 'Society', 'users'),
 'ciencia':     ('Ciencia', 'Science', 'flask'),
 'deporte':     ('Deporte', 'Sport', 'trophy'),
 'arte':        ('Arte', 'Art', 'palette'),
 'gastronomia': ('Gastronomía', 'Food', 'utensils'),
 'naturaleza':  ('Naturaleza', 'Nature', 'leaf'),
 'historia':    ('Historia', 'History', 'landmark'),
 'cine':        ('Cine', 'Cinema', 'clapper'),
}

def call(messages, max_tokens=8000, temperature=0.3):
    key = os.environ.get('NVIDIA_API_KEY')
    if not key: sys.exit('✗ falta NVIDIA_API_KEY en el entorno (bóveda)')
    body = json.dumps({'model': MODEL, 'messages': messages, 'temperature': temperature,
                       'max_tokens': max_tokens, 'stream': False}).encode()
    for attempt in range(4):
        req = urllib.request.Request(URL, body, {'Authorization': 'Bearer ' + key,
              'Content-Type': 'application/json', 'Accept': 'application/json'})
        try:
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=600) as r:
                d = json.load(r)
            d['_elapsed_s'] = round(time.time() - t0, 1)
            return d
        except Exception as e:  # nunca se imprime la cabecera
            print(f'  · intento {attempt+1} falló: {type(e).__name__} {str(e)[:120]}', flush=True)
            time.sleep(8 * (attempt + 1))
    raise SystemExit('✗ Nemotron no responde')

def extract_json(txt):
    txt = re.sub(r'<think>.*?</think>', '', txt or '', flags=re.S)
    m = re.search(r'```(?:json)?\s*(.*?)```', txt, re.S)
    if m: txt = m.group(1)
    i = min([p for p in (txt.find('['), txt.find('{')) if p >= 0] or [0])
    j = max(txt.rfind(']'), txt.rfind('}'))
    return json.loads(txt[i:j + 1])

SYS = ('Eres el redactor de cápsulas de conocimiento GOOD de Admira para pantallas de tienda. '
       'Escribes datos curiosos VERDADEROS, ampliamente conocidos y fáciles de comprobar en una '
       'enciclopedia. Nunca inventas cifras, fechas ni citas. Si dudas, no lo incluyes. '
       'Respondes SOLO con JSON válido, sin comentarios.')

def gen_prompt(tipo, es, en, n):
    return (f'Tipología: {es} / {en}.\nDame {n} datos «¿Sabías que…?» distintos de esta tipología, '
            'aptos para todos los públicos, sin política partidista ni temas sensibles, sin marcas '
            'comerciales actuales. Cada dato debe ser un hecho muy conocido y verificable '
            '(evita récords que cambian, cifras dudosas o anécdotas apócrifas).\n'
            'Formato: array JSON de objetos {"titulo_es","texto_es","titulo_en","texto_en"}.\n'
            '- titulo: 2 a 6 palabras, sin «¿Sabías que?».\n'
            '- texto: UNA o DOS frases, máximo 190 caracteres, que empiecen por «…» continuando '
            '«¿Sabías que…?» en español y «Did you know…?» en inglés (ej. "…el pulpo tiene tres corazones.").\n'
            '- El texto debe entenderse SOLO, sin el título (se locuta suelto): nombra siempre la obra, '
            'persona, lugar o cosa de la que habla; nunca «él», «la obra», «el techo», «la técnica».\n'
            '- Evita mitos populares y exageraciones («nunca», «siempre») salvo que sean literalmente ciertos.\n'
            '- El inglés es la traducción natural del mismo dato.')

def ver_prompt(items):
    lst = '\n'.join(f'{i}. {it["texto_es"]}' for i, it in enumerate(items))
    return ('Actúa como verificador de datos estricto. Para cada afirmación indica si es un hecho '
            'ampliamente aceptado y comprobable («seguro») o si es falsa, exagerada, un mito popular, '
            'una cifra discutible, algo que no puedes confirmar o una frase que no se entiende sola porque no '
            'nombra de qué habla («dudoso»).\n'
            'Responde SOLO con un array JSON [{"i":0,"veredicto":"seguro|dudoso","motivo":"…"}].\n\n' + lst)

ART = re.compile(r'^(…\s*)(El|La|Los|Las|Un|Una|The|A|An)\b')
def tidy(t):
    t = t.strip()
    if not t.startswith('…'): t = '…' + t
    return ART.sub(lambda m: m.group(1) + m.group(2).lower(), t)

def main():
    want = sys.argv[1:] or list(TIPOS)
    bank = json.load(open(OUT)) if os.path.exists(OUT) else None
    log = json.load(open(LOG)) if os.path.exists(LOG) else {'model': MODEL, 'runs': []}
    caps = {c['id']: c for c in (bank or {}).get('capsulas', [])}
    import threading, concurrent.futures as cf
    lock = threading.Lock()
    def one(tipo):
        es, en, icon = TIPOS[tipo]
        print(f'→ {tipo}', flush=True)
        items = None
        for _ in range(3):
            msgs = [{'role': 'system', 'content': SYS}, {'role': 'user', 'content': gen_prompt(tipo, es, en, 14)}]
            g = call(msgs, temperature=0.5)
            txt = g['choices'][0]['message'].get('content') or ''
            with lock: log['runs'].append({'tipo': tipo, 'paso': 'generar', 'prompt': msgs, 'response': txt,
                                'usage': g.get('usage'), 'elapsed_s': g.get('_elapsed_s')})
            try:
                items = [x for x in extract_json(txt) if all(isinstance(x.get(k), str) and x[k].strip() for k in ('titulo_es','texto_es','titulo_en','texto_en'))]
                if len(items) >= PER: break
            except Exception as e:
                print('  · JSON inválido, reintento', e, flush=True)
        msgs = [{'role': 'system', 'content': 'Eres un verificador de datos riguroso. Respondes SOLO JSON.'},
                {'role': 'user', 'content': ver_prompt(items)}]
        v = call(msgs, max_tokens=16000, temperature=0.0)
        vt = v['choices'][0]['message'].get('content') or ''
        with lock: log['runs'].append({'tipo': tipo, 'paso': 'verificar', 'prompt': msgs, 'response': vt,
                            'usage': v.get('usage'), 'elapsed_s': v.get('_elapsed_s')})
        try: verd = {int(x['i']): x for x in extract_json(vt)}
        except Exception: verd = {}
        kept, dropped = [], []
        for i, it in enumerate(items):
            ok = verd.get(i, {}).get('veredicto', 'dudoso').lower().startswith('seguro')
            too_long = len(it['texto_es']) > 230 or len(it['texto_en']) > 230
            (kept if ok and not too_long else dropped).append((i, it))
        with lock:
            for c in [k for k in caps if caps[k]['tipo'] == tipo]: del caps[c]
            for n, (i, it) in enumerate(kept[:PER], 1):
                cid = f'{tipo}-{n:02d}'
                caps[cid] = {'id': cid, 'tipo': tipo, 'calidad': 'good',
                             'titulo': {'es': it['titulo_es'].strip(), 'en': it['titulo_en'].strip()},
                             'texto': {'es': tidy(it['texto_es']), 'en': tidy(it['texto_en'])},
                             'verificacion': {'veredicto': 'seguro', 'motivo': verd.get(i, {}).get('motivo', '')}}
        print(f'  ✓ {len(kept[:PER])} guardadas · {len(dropped)} descartadas (dudosas/largas)', flush=True)
        for i, it in dropped: print('    ✗', it['texto_es'][:110], '·', verd.get(i, {}).get('motivo', '')[:80], flush=True)
        with lock: save(caps, log)
    with cf.ThreadPoolExecutor(max_workers=5) as ex:
        list(ex.map(one, want))
    save(caps, log)

def save(caps, log):
    usage = {'prompt_tokens': 0, 'completion_tokens': 0, 'total_tokens': 0, 'calls': 0}
    for r in log['runs']:
        u = r.get('usage') or {}
        for k in ('prompt_tokens', 'completion_tokens', 'total_tokens'): usage[k] += int(u.get(k) or 0)
        usage['calls'] += 1
    order = list(TIPOS)
    lst = sorted(caps.values(), key=lambda c: (order.index(c['tipo']), c['id']))
    bank = {'schema_version': 1, 'title': 'Cápsulas «¿Sabías que…?» · GOOD / “Did you know…?” capsules · GOOD',
            'generated_at': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
            'quality': 'good', 'model': MODEL, 'provider': 'NVIDIA integrate.api.nvidia.com (gratuito / free)',
            'voices': {'es': 'Mónica', 'en': 'Daniel'}, 'cost_eur': 0, 'usage': usage,
            'format': {'eink': '480x800 BWRY (negro, blanco, amarillo, rojo)', 'max_chars': 230},
            'tipologias': [{'id': t, 'name': {'es': TIPOS[t][0], 'en': TIPOS[t][1]}, 'icon': TIPOS[t][2],
                            'count': sum(1 for c in lst if c['tipo'] == t)} for t in order],
            'capsulas': lst}
    json.dump(bank, open(OUT, 'w'), ensure_ascii=False, indent=1)
    log['model'] = MODEL; log['usage'] = usage
    json.dump(log, open(LOG, 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__': main()
