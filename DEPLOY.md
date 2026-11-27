# Deploying SPINNER to spinner.aimed-lab.org (Vercel)

SPINNER is served on Vercel as a static frontend (`src/spinner/web`) plus one
Python serverless function (`api/analyze.py`) that runs the WIPER/WINNER scoring.
It is **open and free**. Automated / agentic traffic is **rate limited to 100
requests/hour per IP** on `POST /api/analyze` (HTTP 429 when exceeded); requests
carrying a valid **developer API key** bypass the limit.

Do these steps **while logged into the Vercel account that owns `aimed-lab.org`**
(so the subdomain attaches natively).

## 1. Link the project
```bash
npm i -g vercel@latest
vercel login            # the lab account that owns aimed-lab.org
cd /path/to/SPINNER
vercel link             # create/select a project, e.g. "spinner"
```

## 2. Provision the rate-limit store (Upstash Redis — free tier)
Rate limiting needs a small shared counter store. Without it the app still runs,
just unlimited.
- Vercel dashboard → your project → **Storage** → **Marketplace** → **Upstash**
  → create a Redis database and **connect it to this project**.
- That auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as
  project env vars. (Rate limiting turns on automatically once they are present.)

## 3. Issue developer API keys (lab members + smartdrugdiscovery.org partners)
Generate one key per person/partner:
```bash
python3 -c "import secrets; print('spnr_'+secrets.token_urlsafe(24))"
```
Set them as a comma-separated list. Each entry is `key`, `key:label` (label is
for your own records), or `key:label:YYYY-MM-DD` to give the key an **enforced
expiry** — past that date it returns HTTP 401 (`X-API-Key-Status: expired`).
Keys with no date never expire; use that for the owner master key.
```bash
vercel env add SPINNER_API_KEYS production
# paste e.g.:
#   spnr_AbC...:jake-uab,                     <- owner, never expires
#   spnr_XyZ...:lab-member:2027-05-27,        <- expires in 6 months
#   spnr_QwE...:partner-sdd:2027-05-27
```
Optional: `vercel env add SPINNER_RATE_LIMIT production` to change the 100/hour
default for anonymous callers.

Holders call the API with either header:
```
X-API-Key: spnr_AbC...
# or
Authorization: Bearer spnr_AbC...
```
Add/revoke a key by editing `SPINNER_API_KEYS` and redeploying. Keys are secrets —
never commit them; they live only in Vercel env vars.

## 4. Deploy
```bash
vercel --prod
```
First build installs wiper-net/winner-net (+ numpy/pandas/scipy) from
`requirements.txt`; no numba is used.

## 5. Attach the domain
```bash
vercel domains add spinner.aimed-lab.org   # or: project → Settings → Domains
```
Then add the DNS record at the registrar (**hostmonster**, where aimed-lab.org's
nameservers live):
```
Type: CNAME   Host: spinner   Value: cname.vercel-dns.com
```
Vercel verifies and issues TLS automatically. (If the apex already lives in this
same Vercel account, the dashboard may offer to add the record for you.)

## 6. Verify
```bash
curl -s https://spinner.aimed-lab.org/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"text":"A\tB\t0.9\nB\tC\t0.8\nA\tC\t0.4","iterations":40}' | head -c 200
# response carries X-RateLimit-Limit / X-RateLimit-Remaining headers.

# A keyed request bypasses the limit (X-RateLimit-Bypass: api-key):
curl -s https://spinner.aimed-lab.org/api/analyze \
  -H 'X-API-Key: spnr_...' -H 'Content-Type: application/json' \
  -d '{"text":"A\tB\t0.9","iterations":40}' -D - -o /dev/null
```

## Notes
- The limiter is a Redis sliding-window log; a rejected request is not counted,
  and any store error **fails open** (never blocks the free service).
- Rate limiting lives in the Vercel function only. If you ever expose the
  persistent server (`spinner-web`) publicly, it is **not** limited.
- Python serverless cold starts (scipy/pandas) take a few seconds on the first
  request after idle; the frontend's client-side fallback keeps the UI responsive.
