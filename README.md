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
│   ├── architecture/
│   ├── features/
│   ├── operations/
│   ├── history/
│   └── handoff/
│       ├── open/
│       └── completed/
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

See [docs/operations/SETUP.md](docs/operations/SETUP.md) for workspace-specific setup notes.

## Documentation

Project documentation lives in `docs/`, organized by topic:

- **Architecture**
  - [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) — system shape and deployment direction
  - [docs/architecture/DATA_MODEL.md](docs/architecture/DATA_MODEL.md) — database entities and relationships
- **Features**
  - [docs/features/MVP_FEATURES.md](docs/features/MVP_FEATURES.md) — phased feature scope
  - [docs/features/STORY_ENGINE.md](docs/features/STORY_ENGINE.md) — the chore-gated comic story engine
  - [docs/features/AQUARIUM_MOOD.md](docs/features/AQUARIUM_MOOD.md) — the chore → fish mood math
- **Operations**
  - [docs/operations/SETUP.md](docs/operations/SETUP.md) — local setup and development commands
  - [docs/operations/TESTING.md](docs/operations/TESTING.md) — lightweight validation checks
  - [docs/operations/DEPLOYMENT.md](docs/operations/DEPLOYMENT.md) — Cloudflare deployment notes
  - [docs/operations/CODEX_DEPLOYMENT_REFERENCE.md](docs/operations/CODEX_DEPLOYMENT_REFERENCE.md) — deployment quick reference for agents
- **History**
  - [docs/history/family_chores_codex_guardrails_and_direction.md](docs/history/family_chores_codex_guardrails_and_direction.md) — project philosophy and guardrails

Implementation handoffs live under `docs/handoff/` with only two states:

- `open/` for active or pending Codex work
- `completed/` for accepted historical handoffs

Move handoff files from `open` to `completed` after the work is reviewed and accepted. Do not duplicate handoff files between states.

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
