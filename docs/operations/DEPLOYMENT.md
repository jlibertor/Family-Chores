# Deployment

The intended deployment target is Cloudflare Pages for the frontend, Cloudflare Workers for the API, and Cloudflare D1 for persistence.

## One-Time Cloudflare Setup

Create a D1 database:

```bash
npx wrangler d1 create family-chores --config worker/wrangler.toml
```

Copy the returned database ID into the deployment-specific Worker configuration before deploying. Do not commit private credentials.

Apply migrations remotely:

```bash
npx wrangler d1 migrations apply family-chores --remote --config worker/wrangler.toml
```

Set the parent setup PIN as a Worker secret:

```bash
npx wrangler secret put PARENT_PIN --config worker/wrangler.toml
```

**`PARENT_PIN` is required in production.** As of 2026-07-03 the Worker fails
closed: if the secret is missing, all `/api/admin/*` endpoints return 401. There
is no default PIN fallback. Set the secret before (or immediately after) the
first Worker deploy.

Set the Twilio account SID as a Worker secret:

```bash
npx wrangler secret put TWILIO_ACCOUNT_SID --config worker/wrangler.toml
```

Set the Twilio auth token as a Worker secret so aquarium text notifications can send:

```bash
npx wrangler secret put TWILIO_AUTH_TOKEN --config worker/wrangler.toml
```

Alternatively, create a Standard Twilio API Key and set both values as Worker secrets. When these are present, the Worker uses them instead of `TWILIO_AUTH_TOKEN`:

```bash
npx wrangler secret put TWILIO_API_KEY_SID --config worker/wrangler.toml
npx wrangler secret put TWILIO_API_KEY_SECRET --config worker/wrangler.toml
```

## Current Free Production URLs

- Frontend: <https://family-chores-cta.pages.dev>
- API: <https://family-chores-api.jlibertor.workers.dev>

## Deploy Everything

After the one-time setup is complete, deploy the Worker and frontend with:

```bash
npm run deploy:prod
```

This builds the frontend with `VITE_API_BASE_URL=https://family-chores-api.jlibertor.workers.dev` and deploys Pages as the production branch.

## Deploy Worker Only

```bash
npm run deploy:worker
```

## Deploy Frontend Only

Build and deploy the Vite app to Cloudflare Pages:

```bash
VITE_API_BASE_URL=https://family-chores-api.jlibertor.workers.dev npm --workspace frontend run build
npx wrangler pages deploy frontend/dist --project-name family-chores --branch main --commit-dirty=true
```

## Smoke Check

After deploying, run the smoke checks against the deployed Worker:

```bash
API_BASE_URL=https://family-chores-api.jlibertor.workers.dev PARENT_PIN=1234 npm run smoke
```

## Notes

- The frontend uses relative `/api` paths locally.
- Local Vite dev proxies `/api` to `http://127.0.0.1:8787`.
- Production uses `VITE_API_BASE_URL` to call the free Worker URL directly.
- No custom domain is required.
