# Testing

Keep testing lightweight while the app is small.

## Local Checks

Run the normal build and lint checks:

```bash
npm run build
npm run lint
```

## API Smoke Checks

Start the Worker:

```bash
npm run dev:worker
```

Apply local D1 migrations if needed:

```bash
npx wrangler d1 migrations apply family-chores --local --config worker/wrangler.toml
```

Run smoke checks:

```bash
npm run smoke
```

The smoke script verifies:

- health endpoint
- active members
- active chores
- today endpoint
- household status endpoint
- admin PIN gate
- kiosk session creation
- completion insert
- recent history

The smoke script inserts one chore completion row. Use a disposable local D1 database when a clean history matters.
