# Family Chores

Family Chores is a shared household aquarium powered by completed chores. It is designed to stay open on one communal screen: a family member records a chore, the aquarium reacts, and the app returns to the tank.

There are only two operating states:

- Shared use: the aquarium and chore-recording flow are open to the household.
- Parent setup: reports and configuration are protected by the parent PIN.

There are no personal-device logins, remembered member profiles, or selectable kiosk/member modes.

## Core workflow

1. The aquarium remains on as the home screen.
2. Someone taps **Record chore**.
3. They choose who completed it and select the chore.
4. The completion is saved and the aquarium reacts.
5. After three minutes without activity, any open screen returns to the aquarium.

Parents can open **Parent**, enter the PIN, and review recent participation or manage family members, chores, aquarium settings, and backups.

## Stack

- React + Vite frontend
- Cloudflare Worker API
- Cloudflare D1 persistence
- npm workspaces and Wrangler tooling

## Local development

```bash
npm install
npm run dev:worker
npm run dev:frontend
```

Validation:

```bash
npm run build
npm run lint
npm --workspace frontend test
npm run smoke
```

The smoke test expects the local Worker at `http://127.0.0.1:8787` and uses `PARENT_PIN=1234` unless overridden.

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Data model](docs/architecture/DATA_MODEL.md)
- [Product scope](docs/features/MVP_FEATURES.md)
- [Aquarium mood](docs/features/AQUARIUM_MOOD.md)
- [Story engine](docs/features/STORY_ENGINE.md)
- [Local setup](docs/operations/SETUP.md)
- [Testing](docs/operations/TESTING.md)
- [Deployment](docs/operations/DEPLOYMENT.md)

Historical plans and accepted implementation handoffs remain under `docs/history/` and `docs/handoff/completed/`; they describe earlier stages and are not the current product contract.
