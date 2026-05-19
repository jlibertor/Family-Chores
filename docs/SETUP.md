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

## Checks

Build both workspaces:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Local Files To Keep Private

Do not commit secrets or local Cloudflare values. Use local-only files such as `.dev.vars` when needed.
