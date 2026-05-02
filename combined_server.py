# dayk_chart.html — 改用本地 /dayk_proxy 代理（绕过CORS）
# combined_server.py = 静态服务 + 日K代理合二为一

import json, os, re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib import request as urllib_request
from urllib import parse as urllib_parse

PORT = 3030
WWW_DIR = os.path.dirname(os.path.abspath(__file__)) or "."
SINA_BASE = "https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData"

def guess_symbol(code):
    code = code.strip()
    if code.startswith(("sh", "sz", "bj")):
        return code
    if re.match(r"^(000|001|002|003)\d{4}$", code): return "sh" + code
    if re.match(r"^(300|301|002)\d{4}$", code): return "sz" + code
    if re.match(r"^(600|601|602|688|689)\d{4}$", code): return "sh" + code
    if code.startswith(("8", "43")): return "bj" + code
    return "sz" + code

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/dayk_proxy"):
            self._proxy_dayk()
            return
        path = self.path.split("?")[0]
        if path in ("/", ""): path = "/main.html"
        fpath = os.path.join(WWW_DIR, path.lstrip("/").replace("/", os.sep))
        if os.path.isfile(fpath):
            self._serve_file(fpath)
        else:
            self.send_error(404, f"not found: {path}")

    def _proxy_dayk(self):
        params = urllib_parse.parse_qs(urllib_parse.urlparse(self.path).query)
        code = (params.get("code") or [""])[0]
        datalen = (params.get("datalen") or ["240"])[0]
        if not code:
            self.send_error(400, "code required"); return
        sym = guess_symbol(code)
        url = f"{SINA_BASE}?symbol={sym}&scale=240&ma=5&datalen={datalen}"
        try:
            req = urllib_request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib_request.urlopen(req, timeout=15) as r:
                raw = r.read().decode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(raw.encode("utf-8"))
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def _serve_file(self, fpath):
        ext = os.path.splitext(fpath)[1].lower()
        ctype = {"html":"text/html","css":"text/css","js":"application/javascript",
                 "json":"application/json","png":"image/png","jpg":"image/jpeg",
                 "svg":"image/svg+xml","ico":"image/x-icon"}.get(ext.lstrip("."),"application/octet-stream")
        try:
            size = os.path.getsize(fpath)
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", size)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            with open(fpath, "rb") as f: self.wfile.write(f.read())
        except Exception as e:
            self.send_error(500, str(e))

    def log_message(self, fmt, *args):
        print(f"[combined_server] {fmt % args}")

if __name__ == "__main__":
    print(f"[combined_server] http://localhost:{PORT}  (static + /dayk_proxy)")
    HTTPServer(("", PORT), Handler).serve_forever()
