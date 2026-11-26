# AdmiraDesk · conductor del gemelo de control para la prueba de paridad (Playwright + Chrome, sin cabeza).
# Lee órdenes JSON por stdin: {"click": "c,f"} · {"dump": true} · {"captura": ruta} · {"xl": [svg×32], "captura": ruta}
import asyncio, json, sys
from playwright.async_api import async_playwright

async def main(url):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1440, 'height': 860})
        await pg.goto(url); await pg.wait_for_function("window.__admiradesk && document.querySelector('.tecla[data-svg]')")
        xl = await b.new_page(viewport={'width': 8 * 96 + 9 * 12, 'height': 4 * 96 + 5 * 12})
        print(json.dumps({'listo': True}), flush=True)
        loop = asyncio.get_event_loop()
        while True:
            linea = await loop.run_in_executor(None, sys.stdin.readline)
            if not linea: break
            o = json.loads(linea); r = {'ok': True}
            if 'click' in o: await pg.click('button[data-pos="%s"]' % o['click'])
            elif o.get('dump'): r['svgs'] = await pg.evaluate("Object.fromEntries([...document.querySelectorAll('.tecla')].map(b=>[b.dataset.pos,b.dataset.svg||'']))")
            elif 'xl' in o:
                celdas = ''.join('<img src="data:image/svg+xml;charset=utf8,%s">' % __import__('urllib.parse').parse.quote(s) for s in o['xl'])
                await xl.set_content('<body style="margin:0;background:#000"><div style="display:grid;grid-template-columns:repeat(8,96px);gap:12px;padding:12px">%s</div>'
                                     '<style>img{width:96px;height:96px;border-radius:10px}</style></body>' % celdas)
                await xl.wait_for_timeout(200); await xl.screenshot(path=o['captura'])
            elif 'captura' in o: await pg.screenshot(path=o['captura'])
            print(json.dumps(r), flush=True)
        await b.close()

asyncio.run(main(sys.argv[1]))
