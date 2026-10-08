"""shot.py BASE OUTDIR n:quality [n:quality ...] -> OUTDIR/visor-<n>-<quality>.png (headless Chromium, WebGL by SwiftShader)"""
import sys,asyncio
from playwright.async_api import async_playwright
BASE,OUT=sys.argv[1].rstrip('/'),sys.argv[2]; JOBS=[(a.split(':')+[''])[:3] for a in sys.argv[3:]]  # n:quality[:view+zoomclicks] e.g. 2:hiperreal:front+3
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path=__import__('os').environ.get('CHROME','/usr/bin/google-chrome'),args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for n,q,v in JOBS:
            pg=await br.new_page(viewport={'width':1280,'height':900},device_scale_factor=2 if v else 1); errs=[]
            pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e:errs.append(str(e)))
            bad=[]; pg.on('response',lambda r:bad.append(f'{r.status} {r.url}') if r.status>=400 else None)
            glbs=[]; pg.on('response',lambda r:glbs.append(f'{r.status} {r.url}') if '.glb' in r.url else None)
            await pg.goto(f'{BASE}/inventario/?asset={n}&quality={q}#mostrador',wait_until='domcontentloaded',timeout=60000)
            try: await pg.wait_for_function("()=>[...document.querySelectorAll('[data-asset-status]')].some(e=>e.dataset.assetStatus==='ready')",timeout=90000)
            except Exception as e: print('NOT READY',n,q,e)
            await pg.wait_for_timeout(4000)
            if v:
                view,_,k=v.partition('+')
                if view: await pg.evaluate(f"()=>document.querySelector('button[data-view={view}]').click()")
                for _ in range(int(k or 0)): await pg.evaluate("()=>document.querySelector('button[data-zoom=in]').click()")
                await pg.wait_for_timeout(2500)
            st=await pg.evaluate("()=>[...document.querySelectorAll('[data-status]')].map(e=>e.textContent).join(' | ')")
            sel=await pg.query_selector('#model-stages') or await pg.query_selector('#mostrador')
            f=f'{OUT}/visor-{n}-{q}'+(('-'+v.replace('+','z')) if v else '')+'.png'; await sel.screenshot(path=f)
            print(n,q,'->',f,'|',st[:160],'| glb:',glbs[-2:],'| errors:',errs[:3],'| 4xx:',bad[:3]); await pg.close()
        await br.close()
asyncio.run(main())
