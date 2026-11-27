# SPINNER container — deploys to Google Cloud Run (or any Docker host).
# Cloud Run's free tier lets you configure ~1GB RAM, enough for numba/scipy/
# pandas + JIT, which Render's 512MB free tier could not fit.
FROM python:3.11-slim

# git is required so `pip install -e .` can fetch WIPER/WINNER from GitHub.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

RUN pip install --no-cache-dir -e .

# Cloud Run injects the port to listen on via $PORT (defaults to 8080).
# Shell form so ${PORT} is expanded at runtime.
ENV PORT=8080
EXPOSE 8080

CMD spinner-web --host 0.0.0.0 --port ${PORT:-8080}
