# frontend/Dockerfile
# Production build for React frontend

FROM node:20-slim AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN npm run build

FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
