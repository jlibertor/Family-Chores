# Architecture

Family Chores is a single-household, shared-screen application.

```text
Shared React + Vite SPA
        |
        | HTTPS
        v
Cloudflare Worker API
        |
        | DB binding
        v
Cloudflare D1
```

## Product surfaces

The frontend intentionally has three routes:

- `/aquarium`: always-on home screen and aquarium interaction
- `/record`: choose the family member, choose the chore, confirm, and return home
- `/parent`: PIN gate for reports and setup

Unknown and retired routes return to `/aquarium`. The application does not identify or remember the current person; a person is selected only while recording a completion.

Parent reports show recent completion totals, contribution breakdowns, common chores, and detailed activity. Parent setup also manages members, chore assignments, aquarium tuning, and exports.

## API

The shared flow uses:

- `GET /api/members`
- `GET /api/members/:id/chores`
- `POST /api/completions`
- `GET /api/aquarium`
- `GET /api/settings`

There are no session-selection or login endpoints. A completion accepts the member and chore being recorded; the Worker creates any internal audit metadata itself.

All `/api/admin/*` routes require `X-Parent-Pin`, including the completion history used by reports. The Worker fails closed when `PARENT_PIN` is missing.

## Deployment

- Cloudflare Pages hosts the static frontend.
- A Cloudflare Worker serves the API.
- D1 stores household data.
- Secrets belong in Worker secrets or local `.dev.vars`, never committed files.

This remains a single-household hobby app. Multi-tenant identity, OAuth, personal-device sessions, and enterprise infrastructure are explicit non-goals.
