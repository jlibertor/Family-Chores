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

## Deploy Worker

```bash
npm run deploy:worker
```

## Deploy Frontend

Build and deploy the Vite app to Cloudflare Pages:

```bash
npm run build
npm run deploy:frontend
```

## Smoke Check

After deploying, run the smoke checks against the deployed Worker:

```bash
API_BASE_URL=https://your-worker.example.workers.dev PARENT_PIN=your-pin npm run smoke
```

## Notes

- The frontend uses relative `/api` paths.
- Local Vite dev proxies `/api` to `http://127.0.0.1:8787`.
- Production should route `/api/*` to the deployed Worker.
- A custom domain can be added later.
