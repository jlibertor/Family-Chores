# Architecture

Family Chores is a small single-household web app. The first beta should stay easy to understand, cheap to host, and simple to operate.

## Target Components

```text
React + Vite SPA
    |
    | HTTPS API calls
    v
Cloudflare Worker
    |
    | D1 binding
    v
Cloudflare D1 database
```

## Frontend

The frontend lives in `frontend/` and is a Vite React app. Phase 1 only provides a placeholder home page. Later phases will add member mode, kiosk mode, history, and parent setup views.

The frontend should remain mobile-first because the main devices are phones and a shared kiosk or tablet.

## API

The API lives in `worker/` and is implemented as a Cloudflare Worker. It uses a D1 binding named `DB`.

Current endpoints:

- `GET /api/members`
- `GET /api/chores`
- `POST /api/completions`
- `GET /api/completions/recent`
- `POST /api/session/select-member`
- `POST /api/session/kiosk`
- `GET /api/health`

## Database

Database migrations live in `database/migrations/`. The target database is Cloudflare D1, which uses SQLite-compatible SQL.

The initial migration creates and seeds:

- `family_members`
- `chores`
- `chore_completions`
- `device_sessions`

## Deployment Direction

The intended deployment model is:

- Cloudflare Pages for the static frontend
- Cloudflare Worker for the API
- Cloudflare D1 for persistence

No secrets should be committed. Environment-specific values should be configured through Cloudflare or local `.dev.vars` files.

## Documentation Structure

Project documentation stays under `docs/` and should remain concise:

- `ARCHITECTURE.md`: system shape and deployment direction
- `DATA_MODEL.md`: database entities and relationships
- `MVP_FEATURES.md`: phased feature scope
- `SETUP.md`: local setup and development commands
- `handoff/open/`: active Codex implementation handoffs
- `handoff/completed/`: accepted historical handoffs

The handoff system intentionally has only two states: `open` and `completed`.

## Explicit Non-Goals For Early Phases

- SQL Server, IIS, Docker, or dedicated VMs
- Enterprise authentication
- Multi-tenant SaaS architecture
- FactoryEdge or Factory AI dependencies
- Allowance tracking or complex gamification
