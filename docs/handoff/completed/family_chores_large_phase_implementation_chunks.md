# Family Chores — Large Implementation Chunks

## Purpose

The app is intentionally small and low complexity.

Rather than breaking work into dozens of tiny handoffs, implementation can move in larger practical chunks while still staying within Codex capabilities.

This document defines three large implementation chunks.

Each chunk should:

- produce visible progress
- remain reviewable
- avoid overengineering
- result in a usable improvement

---

# Chunk 1 — Working Household Core

## Goal

Build the first truly usable household workflow.

At the end of this chunk:

```text
family members can realistically use the app
```

---

## Required Work

### Data and Persistence

Implement and stabilize:

- D1 schema
- migrations
- seed data
- chore completion persistence
- family member persistence
- device session persistence

---

## API Endpoints

Implement:

```text
GET /api/members
GET /api/chores
POST /api/completions
GET /api/completions/recent
POST /api/session/select-member
POST /api/session/kiosk
```

Keep APIs simple.

Avoid unnecessary abstraction.

---

## Member Mode

Implement:

```text
remember member
show chores
record completion
show success state
```

Requirements:

- mobile friendly
- fast interaction
- minimal taps
- persistent remembered member

---

## Kiosk Mode

Implement:

```text
member grid
→ chore selection
→ confirmation
→ success
→ reset to member grid
```

Requirements:

- large touch targets
- optimized for old iPad/tablet
- very fast interaction cycle

---

## History View

Display:

- recent completions
- who completed chore
- completion time
- source/session

Keep layout simple.

---

## Acceptance Criteria

Chunk 1 is complete when:

- chores persist correctly
- kiosk mode works reliably
- member mode works reliably
- history is visible
- app works on phones
- app works on old iPads/tablets
- family could realistically begin testing app

---

# Chunk 2 — Parent Controls and Daily Operations

## Goal

Make the app manageable by parents without touching the database.

At the end of this chunk:

```text
the household can operate the app daily
```

---

## Admin Area

Implement simple parent/admin PIN.

This is not enterprise security.

Purpose:

- prevent accidental edits
- separate child workflow from setup workflow

---

## Family Member Management

Allow parents to:

- add members
- edit members
- activate/deactivate members
- reorder members

---

## Chore Management

Allow parents to:

- create chores
- edit chores
- activate/deactivate chores
- optionally assign chores
- set frequency type

Supported frequencies:

```text
daily
weekly
as_needed
```

Do not implement advanced recurrence systems.

---

## Due and Overdue Logic

Implement:

### Daily

Due if:

```text
not completed today
```

### Weekly

Due if:

```text
not completed this week
```

### As Needed

Always manually completable.

---

## Today View

Implement household dashboard showing:

- due chores
- overdue chores
- completed today
- who last completed chore

Keep layout practical.

Do not build analytics dashboards.

---

## UI Polish

Improve:

- spacing
- tablet layout
- phone layout
- loading states
- success states
- empty states
- error handling

Still keep the app visually simple.

---

## Acceptance Criteria

Chunk 2 is complete when:

- parents can manage app without database edits
- due chores display correctly
- overdue chores display correctly
- Today View works
- admin management works
- tablet UX feels good
- phone UX feels good
- app feels stable for household use

---

# Chunk 3 — Deployment, Stability, and Real Household Beta

## Goal

Move from “working prototype” to:

```text
stable household utility
```

This chunk focuses on deployment, polish, stability, and real-world usability.

---

## Cloudflare Deployment

Implement:

- Cloudflare Pages deployment
- Worker deployment
- D1 production binding
- Wrangler configuration
- environment variable guidance
- deployment documentation

App should deploy to:

```text
*.pages.dev
```

---

## Stability Improvements

Improve:

- API error handling
- loading behavior
- empty states
- failed submission handling
- reconnect/retry behavior where practical

Keep implementation lightweight.

---

## Session Improvements

Improve:

- remembered member behavior
- kiosk persistence
- device labeling
- session cleanup strategy if needed

Do not build enterprise auth.

---

## Household Workflow Refinement

Improve:

- speed of kiosk reset
- touch usability
- visibility from distance
- readability on mounted tablet
- confirmation UX
- history readability

The app should feel:

```text
fast
simple
obvious
```

---

## Lightweight Testing

Add:

- API smoke tests
- simple workflow validation
- basic regression checks

Avoid giant testing systems.

---

## Documentation Cleanup

Ensure:

- docs are current
- handoffs moved appropriately
- completed work archived
- setup instructions accurate
- deployment instructions accurate

---

## Acceptance Criteria

Chunk 3 is complete when:

- app is deployed and stable
- household uses app from real devices
- mounted/shared tablet workflow feels smooth
- parent management feels reliable
- app survives normal daily usage
- deployment process is understandable
- project remains simple and maintainable

---

# Explicit Non-Goals

Still intentionally excluded:

- gamification
- allowance systems
- XP/streak systems
- badges
- SMS alerts
- push notifications
- advanced recurrence
- SaaS support
- multi-household architecture
- billing systems
- enterprise auth
- native mobile apps
- advanced analytics

These may be evaluated later only if the core app proves genuinely useful.

---

# Codex Guidance

## Important

The project should remain:

```text
small
practical
maintainable
```

Do not introduce:

- enterprise architecture
- excessive abstractions
- complicated state systems
- large framework ecosystems
- speculative scalability systems

Prefer:

- readable React
- simple APIs
- understandable schema
- direct workflows
- small reviewable commits

If uncertain between:

```text
simple vs sophisticated
```

prefer:

```text
simple
```

