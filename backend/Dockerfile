# backend/Dockerfile
# Production backend with yt-dlp, gallery-dl, ffmpeg

FROM python:3.12-slim AS base

# Install ffmpeg, yt-dlp, gallery-dl, and build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
FROM node:20-slim AS node-base
COPY --from=base /usr/local/bin/python3 /usr/local/bin/python3
COPY --from=base /usr/local/bin/pip3 /usr/local/bin/pip3

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

# Install gallery-dl
RUN pip3 install --no-cache gallery-dl

FROM node:20-slim AS runtime

# Copy tools from base
COPY --from=base /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=base /usr/bin/ffprobe /usr/bin/ffprobe
COPY --from=node-base /usr/local/bin/yt-dlp /usr/local/bin/yt-dlp

# Install gallery-dl via pip
RUN pip3 install --no-cache gallery-dl

WORKDIR /app

# Copy package files first for caching
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source
COPY backend/src ./src
COPY backend/.env* ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
