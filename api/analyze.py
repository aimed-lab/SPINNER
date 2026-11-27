"""Vercel serverless entry point for SPINNER's scoring API.

Open and free to everyone. Automated / agentic traffic is rate limited to
RATE_LIMIT requests per hour per client IP; exceeding it returns HTTP 429 with
a Retry-After header. Requests that carry a valid developer API key (lab members
and smartdrugdiscovery.org partners) bypass the limit entirely.

Developer keys live in the SPINNER_API_KEYS environment variable, comma
separated. Each entry is one of:

    key
    key:label
    key:label:YYYY-MM-DD      <- optional expiry date (enforced)

The label is for your own records (e.g. who holds the key). If a key has an
expiry date and today is past it, the key is rejected with HTTP 401 ("key
expired") — the holder falls back to the open, rate-limited tier by dropping the
header, or requests a renewed key. A malformed date is ignored (the key keeps
working) so a typo can never lock everyone out.

Configuration (Vercel environment variables, all optional):
  SPINNER_API_KEYS          Developer keys (see format above).
  SPINNER_RATE_LIMIT        Requests/hour for anonymous callers (default 100).
  UPSTASH_REDIS_REST_URL    Upstash Redis REST URL — enables rate limiting.
  UPSTASH_REDIS_REST_TOKEN  Upstash Redis REST token.

If the Upstash variables are not set, rate limiting is disabled (the service
stays open), so the app works before the store is provisioned. Any store error
fails OPEN.
"""

from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
import datetime
import hmac
import json
import os
import sys
import time
import urllib.request

# The scoring code lives in the repo's src/ package; make it importable.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from spinner.webapp import analyze_edges_text  # noqa: E402

WINDOW_MS = 3600 * 1000


def _rate_limit() -> int:
    try:
        return max(1, int(os.environ.get("SPINNER_RATE_LIMIT", "100")))
    except ValueError:
        return 100


def _key_registry() -> dict:
    """Map developer api_key -> expiry (datetime.date) or None (never expires)."""
    raw = os.environ.get("SPINNER_API_KEYS", "")
    reg = {}
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        fields = part.split(":")
        key = fields[0].strip()
        if not key:
            continue
        expiry = None
        if len(fields) >= 3 and fields[2].strip():
            try:
                expiry = datetime.date.fromisoformat(fields[2].strip())
            except ValueError:
                expiry = None  # malformed date -> ignore (never lock out)
        reg[key] = expiry
    return reg


def _request_key(headers) -> str:
    key = headers.get("X-API-Key", "").strip()
    if not key:
        auth = headers.get("Authorization", "").strip()
        if auth.lower().startswith("bearer "):
            key = auth[7:].strip()
    return key


def _key_status(headers):
    """Classify the request's developer key.

    Returns (status, expiry) where status is:
      "valid"   present, recognised, not expired -> bypass the rate limit
      "expired" present, recognised, past its expiry date -> reject (401)
      "absent"  no key, or an unrecognised key -> anonymous, rate limited
    """
    key = _request_key(headers)
    if not key:
        return "absent", None
    matched = None
    for known, expiry in _key_registry().items():
        if hmac.compare_digest(key, known):
            matched = expiry
            break
    else:
        return "absent", None  # unknown key -> treat as anonymous
    if matched is not None and datetime.date.today() > matched:
        return "expired", matched
    return "valid", matched


def _client_ip(headers) -> str:
    fwd = headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return headers.get("X-Real-IP", "") or "unknown"


# Sliding-window-log rate limiter run atomically inside Redis via one EVAL.
# Returns {allowed, count, reset_ms}. Trims the window, counts, and only records
# the request when it is allowed, so a rejected request is not counted.
_LUA = (
    "local k=KEYS[1] local now=tonumber(ARGV[1]) local win=tonumber(ARGV[2]) "
    "local lim=tonumber(ARGV[3]) local m=ARGV[4] "
    "redis.call('ZREMRANGEBYSCORE',k,0,now-win) "
    "local c=redis.call('ZCARD',k) "
    "if c>=lim then local o=redis.call('ZRANGE',k,0,0,'WITHSCORES') "
    "local r=win if o[2] then r=(tonumber(o[2])+win)-now end return {0,c,r} end "
    "redis.call('ZADD',k,now,m) redis.call('PEXPIRE',k,win) return {1,c+1,win}"
)


def _check_rate(ip: str, limit: int):
    """Return (allowed, remaining, reset_seconds). Fails OPEN on any problem."""
    url = os.environ.get("UPSTASH_REDIS_REST_URL", "").rstrip("/")
    token = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")
    if not url or not token:
        return True, limit, 0  # rate limiting disabled
    now = int(time.time() * 1000)
    member = f"{now}-{os.urandom(4).hex()}"
    body = json.dumps(
        ["EVAL", _LUA, "1", f"rl:{ip}", str(now), str(WINDOW_MS), str(limit), member]
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            res = json.loads(resp.read().decode("utf-8")).get("result") or [1, 0, 0]
        allowed = bool(int(res[0]))
        count = int(res[1])
        reset_s = max(1, int(int(res[2]) / 1000)) if len(res) > 2 else 60
        return allowed, max(0, limit - count), reset_s
    except Exception:
        return True, limit, 0  # fail open — never break the free service


class handler(BaseHTTPRequestHandler):
    server_version = "SpinnerVercel/0.3"

    def log_message(self, format, *args):  # noqa: A002
        return

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def _send_json(self, status, payload, extra_headers=None):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(int(status))
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors()
        for name, value in (extra_headers or {}).items():
            self.send_header(name, str(value))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(int(HTTPStatus.NO_CONTENT))
        self._cors()
        self.end_headers()

    def do_POST(self):
        limit = _rate_limit()
        status, expiry = _key_status(self.headers)
        headers = {}
        if status == "valid":
            headers["X-RateLimit-Bypass"] = "api-key"
        elif status == "expired":
            self._send_json(
                HTTPStatus.UNAUTHORIZED,
                {
                    "error": (
                        f"Developer API key expired on {expiry.isoformat()}. Request a "
                        "renewed key (lab members / smartdrugdiscovery.org partners), or "
                        "drop the key header to use the free rate-limited tier."
                    )
                },
                {"X-API-Key-Status": f"expired:{expiry.isoformat()}"},
            )
            return
        else:  # absent / unknown key -> anonymous, rate limited
            allowed, remaining, reset_s = _check_rate(_client_ip(self.headers), limit)
            headers = {
                "X-RateLimit-Limit": limit,
                "X-RateLimit-Remaining": remaining,
                "X-RateLimit-Reset": reset_s,
            }
            if not allowed:
                headers["Retry-After"] = reset_s
                self._send_json(
                    HTTPStatus.TOO_MANY_REQUESTS,
                    {
                        "error": (
                            f"Rate limit exceeded ({limit} requests/hour). Retry in "
                            f"{reset_s}s, or use a developer API key for unlimited "
                            "access (lab members and smartdrugdiscovery.org partners)."
                        )
                    },
                    headers,
                )
                return
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
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)}, headers)
            return
        self._send_json(HTTPStatus.OK, result, headers)
