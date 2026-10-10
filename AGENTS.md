# AGENTS.md

## Lint & Build

### Frontend (React 19 + Vite 8)
```bash
cd frontend
npx oxlint          # lint (bisa juga: npm run lint)
npx vite build      # production build
npx vite            # dev server
```

### Backend (Node/Express 5)
```bash
cd backend
node src/server.js  # start server
```

## Docker
```bash
docker compose up -d --build
```

## Frontend Path
Frontend source di: `frontend/src/`
Backend source di: `backend/src/`
