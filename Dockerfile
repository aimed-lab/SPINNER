# SPINNER on Hugging Face Spaces (Docker SDK).
# HF free CPU tier = 16GB RAM — ample headroom for numba/scipy/pandas + JIT,
# which Render's 512MB free tier could not fit.
FROM python:3.11-slim

# git is required so `pip install -e .` can fetch WIPER/WINNER from GitHub.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

RUN pip install --no-cache-dir -e .

# HF Spaces routes traffic to port 7860 by default.
ENV PORT=7860
EXPOSE 7860

CMD ["spinner-web", "--host", "0.0.0.0", "--port", "7860"]
