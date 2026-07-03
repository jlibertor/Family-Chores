# Codex Deployment Reference

This project is a small home hobby app deployed on Cloudflare's free URLs. Keep deployment simple and cheap; no custom domain is currently used.

## Technology Stack

- Frontend: React + Vite + TypeScript
- API: Cloudflare Worker written in TypeScript
- Database: Cloudflare D1
- Hosting: Cloudflare Pages for the frontend
- Deployment tooling: Wrangler through npm scripts
- Package manager: npm workspaces

## Production URLs

- Frontend: https://family-chores-cta.pages.dev
- API: https://family-chores-api.jlibertor.workers.dev

The frontend is built with `VITE_API_BASE_URL=https://family-chores-api.jlibertor.workers.dev`, so production browser requests go directly to the Worker API.

## Important Files

- Root scripts: `package.json`
- Frontend app: `frontend/src/App.tsx`
- Frontend env typing: `frontend/src/vite-env.d.ts`
- Worker API: `worker/src/index.ts`
- Worker Cloudflare config: `worker/wrangler.toml`
- Database migrations: `database/migrations/`
- Production deploy helper: `scripts/deploy-prod.mjs`

## Normal Deploy

Use this from the repository root:

```bash
npm run deploy:prod
```

That command:

1. Deploys the Cloudflare Worker.
2. Builds the Vite frontend with the production Worker URL.
3. Deploys `frontend/dist` to Cloudflare Pages as the production branch.

## Verify Production

Run the API smoke test:

```bash
API_BASE_URL=https://family-chores-api.jlibertor.workers.dev PARENT_PIN=1234 npm run smoke
```

On Windows PowerShell, use:

```powershell
$env:API_BASE_URL='https://family-chores-api.jlibertor.workers.dev'
$env:PARENT_PIN='1234'
npm run smoke
```

Also check the frontend URL:

```powershell
Invoke-WebRequest -Uri 'https://family-chores-cta.pages.dev' -UseBasicParsing
```

## One-Time Cloudflare Setup Already Done

These steps have already been completed for the current production deployment:

1. Wrangler login was completed for the Cloudflare account.
2. D1 database `family-chores` was created.
3. `worker/wrangler.toml` was updated with the production D1 database ID.
4. All migrations in `database/migrations/` were applied remotely.
5. Worker secret `PARENT_PIN` was set to `1234`.
6. Worker `family-chores-api` was deployed.
7. Pages project `family-chores` was created and deployed.

## If Database Migrations Are Added

After adding a new migration file under `database/migrations/`, apply it remotely before or during deployment:

```bash
npx wrangler d1 migrations apply family-chores --remote --config worker/wrangler.toml
```

Then deploy:

```bash
npm run deploy:prod
```

## Notes For Future Codex Work

- Prefer small batches of changes, then run `npm run lint`, `npm run build`, and `npm run deploy:prod`.
- Do not add a custom domain unless explicitly requested.
- Do not change the API URL unless the Worker URL changes.
- Keep `PARENT_PIN` out of committed files; it belongs in Cloudflare Worker secrets.
- `PARENT_PIN` is now required everywhere: the Worker fails closed and admin endpoints return 401 without it (see `docs/operations/DEPLOYMENT.md`). Local dev uses `worker/.dev.vars`.
- The current PIN is intentionally simple for a home hobby app and can be rotated later with `npx wrangler secret put PARENT_PIN --config worker/wrangler.toml`.
- If Cloudflare Pages deploys a preview URL because the local branch is not `main`, use `--branch main` as done in `scripts/deploy-prod.mjs`.
