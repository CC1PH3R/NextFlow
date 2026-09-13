# NextFlow

A simple dashboard for managing Next.js sites. 
## Setup

```bash
cp .env.example .env.local
```

Set `DATABASE_URL` (Postgres) and `AUTH_SECRET` (at least 32 characters; `openssl rand -base64 32`). The app will refuse to start if either is missing.

```bash
npm install
npm run dev
```

- `/` — home
- `/dashboard` — empty site list (the tool shell)

Prisma, Auth.js, and host adapters are not wired yet. See `nextflow-phase-1.md`.
