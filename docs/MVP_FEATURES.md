# MVP Features

The app should be built in small phases. Each phase should remain reviewable and avoid adding heavy infrastructure.

## Phase 1: Project Foundation

Goal: make the repository understandable and locally runnable.

Included:

- Project README and documentation
- Vite React frontend scaffold
- Cloudflare Worker scaffold
- Draft D1 schema migration
- Local development commands

Not included:

- Real auth
- Admin screens
- Chore completion workflow
- Due date engine
- Alerts
- Allowance or reward system

## Phase 2: Technical Skeleton And Data Flow

Goal: prove the full path from React to Worker to D1.

Implemented foundation:

- Seed data for two adults, four children, and sample chores
- API endpoints for members, chores, completions, recent history, and simple session mode
- Basic pages for choose mode, member mode, kiosk mode, and history
- Completing a chore writes a database row
- History displays recent completions
- Basic daily and weekly due status is returned with chores

## Phase 3: Household Beta

Goal: make the app usable enough for a real household trial.

Planned features:

- Parent setup area with simple PIN
- Manage family members and chores
- Activate and deactivate chores
- Assign chores optionally
- Basic daily and weekly due or overdue behavior
- Today view
- Improved confirmation flow
- Cloudflare deployment guidance

## Deferred Features

- SMS, email, and push alerts
- Allowance tracking
- Advanced recurrence rules
- OAuth or serious authentication
- Multi-household support
- SaaS billing
