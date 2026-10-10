# backend/Dockerfile
# Production backend with yt-dlp, gallery-dl, ffmpeg

FROM node:20-slim

# Install system dependencies: ffmpeg, Python (for gallery-dl), curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp from latest release
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

# Install gallery-dl (pip on Debian 12 requires --break-system-packages)
RUN pip3 install --no-cache --break-system-packages gallery-dl

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src
COPY .env* ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
