# Setup

This project uses npm workspaces for the frontend and Worker.

## Prerequisites

- Node.js
- npm
- A Cloudflare account later, when D1 and deployment are configured

## Install

From the repository root:

```bash
npm install
```

## Run Locally

Frontend:

```bash
npm run dev:frontend
```

Worker:

```bash
npm run dev:worker
```

The Worker exposes a Phase 1 health endpoint at:

```text
http://127.0.0.1:8787/api/health
```

## Local D1

Apply migrations to the local D1 database:

```bash
npx wrangler d1 migrations apply family-chores --local --config worker/wrangler.toml
```

The first migration creates the core tables and inserts starter family members and chores.
Later migrations add lightweight household convenience fields such as reminder flags, completion points, household notes, and export support.

During local frontend development, Vite proxies `/api` requests to the Worker at `http://127.0.0.1:8787`.

## Parent PIN

Parent setup uses a simple PIN gate. The Worker **fails closed**: if no `PARENT_PIN`
is configured, every `/api/admin/*` endpoint returns 401. There is no built-in
default PIN anymore (removed 2026-07-03).

For local development, create a `worker/.dev.vars` file (not committed) containing:

```text
PARENT_PIN=1234
```

For deployed environments, configure the PIN as a Cloudflare Worker secret:

```bash
npx wrangler secret put PARENT_PIN --config worker/wrangler.toml
```

## Checks

Build both workspaces:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

Run API smoke checks while the Worker is running locally:

```bash
npm run smoke
```

Use a different API URL or parent PIN when needed:

```bash
API_BASE_URL=https://your-worker.example.workers.dev PARENT_PIN=1234 npm run smoke
```

## Deployment

Build before deploying:

```bash
npm run build
```

Deploy the Worker after configuring the remote D1 database binding and `PARENT_PIN` secret:

```bash
npm run deploy:worker
```

Deploy the frontend to Cloudflare Pages:

```bash
npm run deploy:frontend
```

Do not commit Cloudflare credentials, database IDs for private environments, or secrets.

## Local Files To Keep Private

Do not commit secrets or local Cloudflare values. Use local-only files such as `.dev.vars` when needed. `worker/.dev.vars` now holds the required local `PARENT_PIN`.
