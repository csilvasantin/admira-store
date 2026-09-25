#!/usr/bin/env python3
"""Hornea las hojas de caminata de Matrix. Requiere un servidor estático en la raíz
del repo xpaceos (p.ej. python3 -m http.server 8812) y Chrome headless con
--remote-debugging-port=9222. Uso: bake.py [id ...]  (sin ids = los 24 perfiles)"""
import json,sys,base64,urllib.request,websocket,time,os
OUT=os.path.join(os.path.dirname(__file__),'..','..','assets','people','matrix-walk')
os.makedirs(OUT,exist_ok=True)
t=next(t for t in json.load(urllib.request.urlopen("http://127.0.0.1:9222/json")) if t["type"]=="page")
ws=websocket.create_connection(t["webSocketDebuggerUrl"],suppress_origin=True,timeout=600);i=0
def call(m,p=None):
    global i;i+=1;ws.send(json.dumps({"id":i,"method":m,"params":p or {}}))
    while True:
        r=json.loads(ws.recv())
        if r.get("id")==i:
            if "exceptionDetails" in r.get("result",{}):raise SystemExit(json.dumps(r["result"]["exceptionDetails"])[:1500])
            return r.get("result",{})
def ev(expr):return call("Runtime.evaluate",{"expression":expr,"awaitPromise":True,"returnByValue":True})["result"].get("value")
call("Page.navigate",{"url":"http://localhost:8812/admira-xp/tools/walk-sprites/bake.html"})
for _ in range(120):
    time.sleep(.5)
    if ev("window.__bakeReady===true"):break
else:raise SystemExit("bake.html no arrancó")
ids=sys.argv[1:] or ev("window.__bakeIds")
meta=ev("window.__bakeMeta");manifest={**meta,"profiles":{}}
for pid in ids:
    r=ev(f"window.__bakeOne({json.dumps(pid)})")
    for ext in ("webp",):
        data=base64.b64decode(r[ext].split(",",1)[1]);open(os.path.join(OUT,f"{pid}.{ext}"),"wb").write(data)
    manifest["profiles"][pid]={"label":r["label"],"sheet":f"{pid}.webp"}
    print(pid,r["label"],len(base64.b64decode(r["webp"].split(",",1)[1]))//1024,"KB webp",flush=True)
old=os.path.join(OUT,"manifest.json")
if os.path.exists(old) and len(ids)<24:
    prev=json.load(open(old));prev["profiles"].update(manifest["profiles"]);manifest=prev
json.dump(manifest,open(old,"w"),indent=1,ensure_ascii=False)
