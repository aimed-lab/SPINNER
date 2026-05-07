from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
import json

from spinner.webapp import analyze_edges_text


class handler(BaseHTTPRequestHandler):
    server_version = "SpinnerVercel/0.1"

    def log_message(self, format, *args):
        return

    def _send_json(self, status, payload):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(int(status))
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(int(HTTPStatus.NO_CONTENT))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_POST(self):
        size = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(size).decode("utf-8"))
            result = analyze_edges_text(
                str(payload.get("text", "")),
                iterations=int(payload.get("iterations", 80)),
                include_novel=bool(payload.get("includeNovel", False)),
                device=str(payload.get("device", "cpu")),
            )
        except Exception as exc:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
            return
        self._send_json(HTTPStatus.OK, result)
