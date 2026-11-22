"""启动本地预览：python3 preview.py。"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

if __name__ == "__main__":
    handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parent))
    print("Eager多场景筛选后台：http://127.0.0.1:8778/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8778), handler).serve_forever()
