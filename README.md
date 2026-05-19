# Family Chores

Family Chores is a lightweight household web app for tracking chores and chore completions across personal phones and a shared kiosk or tablet. It is intentionally small: React + Vite for the frontend, a Cloudflare Worker for the API, and Cloudflare D1 for persistence.

The project is currently in **Phase 1: Project Foundation**. This phase creates the local structure, documentation, frontend scaffold, Worker scaffold, and first database migration draft. It does not implement the full chore workflow yet.

## Stack

- Frontend: React + Vite
- API: Cloudflare Worker
- Database: Cloudflare D1
- Local tooling: npm workspaces and Wrangler
- Hosting target: Cloudflare Pages plus Cloudflare Workers

## Repository Layout

```text
Family-Chores/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   └── MVP_FEATURES.md
├── frontend/
│   └── React + Vite app
├── worker/
│   └── Cloudflare Worker API skeleton
├── database/
│   └── migrations/
│       └── 0001_initial_schema.sql
├── .gitignore
├── package.json
└── README.md
```

## Local Development

Install all workspace dependencies from the repository root:

```bash
npm install
```

Run the frontend:

```bash
npm run dev:frontend
```

Run the Worker locally:

```bash
npm run dev:worker
```

Build both workspaces:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Phase 1 Scope

Included:

- Documentation for architecture, data model, and MVP phases
- Vite React frontend placeholder
- Cloudflare Worker health endpoint
- Initial D1 migration draft

Not included yet:

- Authentication or PIN setup
- Full chore completion workflow
- Admin screens
- SMS, email, or push alerts
- Allowance tracking or gamification
- Production deployment
