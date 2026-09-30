#!/usr/bin/env python3
"""shot.py <url> <out.png> [wait_s] [w h] [js_after]  — headless Chrome por CDP, recoge errores de consola."""
import sys, json, time, base64, subprocess, urllib.request, os, tempfile, websocket, shutil
url, out = sys.argv[1], sys.argv[2]
wait = float(sys.argv[3]) if len(sys.argv) > 3 else 8
w = sys.argv[4] if len(sys.argv) > 4 else "1440"; h = sys.argv[5] if len(sys.argv) > 5 else "900"
js_after = sys.argv[6] if len(sys.argv) > 6 else None
PORT = 9333
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
prof = tempfile.mkdtemp(prefix="cafeshot-")
p = subprocess.Popen([CHROME, "--headless=new", "--remote-debugging-port=0", f"--user-data-dir={prof}", "--no-first-run", "--lang=es-ES", "--accept-lang=es-ES",
    "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
    "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required",
    f"--window-size={w},{h}", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    port = None
    for _ in range(100):
        try:
            port = int(open(os.path.join(prof, "DevToolsActivePort")).read().split()[0]); break
        except Exception: time.sleep(0.2)
    for _ in range(60):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json")); break
        except Exception: time.sleep(0.3)
    pg = next(t for t in tabs if t.get("type") == "page")
    ws = websocket.create_connection(pg["webSocketDebuggerUrl"], suppress_origin=True, timeout=120)
    i = [0]; logs = []
    def call(m, params=None):
        i[0] += 1; ws.send(json.dumps({"id": i[0], "method": m, "params": params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get("id") == i[0]: return msg.get("result", {})
            handle(msg)
    def handle(msg):
        m = msg.get("method")
        if m == "Runtime.consoleAPICalled" and msg["params"]["type"] in ("error", "warning", "assert"):
            logs.append(msg["params"]["type"] + ": " + " ".join(str(a.get("value", a.get("description", "")))[:300] for a in msg["params"]["args"]))
        elif m == "Runtime.exceptionThrown":
            d = msg["params"]["exceptionDetails"]; logs.append("EXCEPTION: " + (d.get("exception", {}).get("description") or d.get("text", ""))[:400])
        elif m == "Log.entryAdded" and msg["params"]["entry"]["level"] == "error":
            e = msg["params"]["entry"]; logs.append("LOG " + e.get("text", "")[:200] + " " + e.get("url", "")[:150])
    call("Runtime.enable"); call("Log.enable"); call("Page.enable")
    call("Page.navigate", {"url": url})
    end = time.time() + wait
    ws.settimeout(0.5)
    while time.time() < end:
        try: handle(json.loads(ws.recv()))
        except websocket.WebSocketTimeoutException: pass
    ws.settimeout(120)
    if js_after:
        r = call("Runtime.evaluate", {"expression": js_after, "awaitPromise": True, "returnByValue": True})
        print("JS:", json.dumps(r.get("result", {}).get("value"), ensure_ascii=False)[:3000])
        end = time.time() + 2; ws.settimeout(0.5)
        while time.time() < end:
            try: handle(json.loads(ws.recv()))
            except websocket.WebSocketTimeoutException: pass
        ws.settimeout(120)
    r = call("Page.captureScreenshot", {"format": "png"})
    open(out, "wb").write(base64.b64decode(r["data"])); print("foto", out)
    print("CONSOLE (%d):" % len(logs)); [print("  ", l) for l in logs[:60]]
finally:
    p.terminate(); time.sleep(0.5); shutil.rmtree(prof, ignore_errors=True)
