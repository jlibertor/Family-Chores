# Family Chores — Phase 3 Household Beta and Polish

## Purpose

Phase 2 established:

- working chore persistence
- member mode
- kiosk mode
- history tracking
- basic data flow

Phase 3 focuses on making the app genuinely usable by the household for daily use.

This phase should improve:

- usability
- parent visibility
- daily workflow quality
- tablet experience
- deployment readiness

without turning the app into a large platform.

---

# Phase 3 Goals

The app should now feel:

- stable
- convenient
- quick to use
- understandable by children
- useful for parents

At the end of this phase:

```text
the family should realistically use the app daily
```

---

# Phase 3 Scope

This phase includes:

- parent/admin setup screen
- chore management
- family member management
- active/inactive chores
- due and overdue visibility
- improved tablet UI
- improved phone UI
- better completion confirmations
- deployment polish
- basic household testing support

This phase does NOT include:

- gamification
- allowance systems
- SMS alerts
- advanced scheduling
- SaaS architecture
- complex permissions

---

# Parent/Admin Area

## Goal

Allow parents to manage the household without touching the database.

---

## Admin Protection

Use a very simple PIN system.

Example:

```text
4-digit parent PIN
```

This is NOT intended to be enterprise security.

It only prevents accidental edits by children.

Do not build:

- OAuth
- JWT systems
- MFA
- identity providers
- user accounts

---

# Required Admin Features

## Family Member Management

Parents should be able to:

- add family members
- edit family members
- activate/deactivate family members
- reorder family members

Suggested editable fields:

```text
display name
member type
active status
sort order
```

---

## Chore Management

Parents should be able to:

- create chores
- edit chores
- activate/deactivate chores
- assign chores optionally
- set frequency type

Supported frequency types:

```text
daily
weekly
as_needed
```

Do not build advanced recurrence systems yet.

---

# Today View

## Goal

Create a useful home screen for daily household operation.

The Today View should display:

- chores due today
- chores completed today
- overdue chores
- who last completed the chore
- approximate completion times

Example:

```text
Wash Dishes
Last completed by Emma at 6:42 PM yesterday
Status: Due
```

---

# Due Logic

Keep logic intentionally simple.

## Daily

A daily chore is due if:

```text
no completion exists today
```

## Weekly

A weekly chore is due if:

```text
no completion exists during the current week
```

## As Needed

As-needed chores:

- do not become overdue automatically
- remain manually completable

Do not introduce:

- cron systems
- recurrence builders
- custom schedules
- timezone complexity

---

# Improved Completion UX

## Goal

Make chore completion feel satisfying and obvious.

---

## Member Mode Flow

```text
Open App
→ My Chores
→ Tap Chore
→ Confirmation Screen
→ Success Message
→ Return to My Chores
```

Requirements:

- clear selected chore
- large confirm button
- clear success state
- fast return flow

---

## Kiosk Mode Flow

```text
Family Grid
→ Select Family Member
→ Select Chore
→ Confirmation Screen
→ Success Message
→ Return to Family Grid
```

Requirements:

- extremely touch friendly
- large family buttons
- large chore buttons
- fast reset after completion
- visible from a distance on tablet

---

# Tablet/Kiosk Optimization

## Goal

The app should work well on:

```text
shared kitchen tablet
wall-mounted tablet
old iPad
Android tablet
```

Prioritize:

- large touch targets
- quick visibility
- simple navigation
- kiosk friendliness

Avoid:

- hover interactions
- desktop-only assumptions
- dense data tables
- tiny controls

---

# History Improvements

Improve the history page slightly.

Suggested additions:

- today's completions
- recent completions
- grouped by day
- simple visual separation

Do not build:

- analytics dashboards
- charts
- exports
- reporting systems

---

# Cloudflare Deployment

## Goal

Deploy the app so the family can use it from real devices.

---

## Required Deployment Work

Configure:

- Cloudflare Pages
- Cloudflare Worker
- D1 binding
- Wrangler configuration
- environment variable guidance

The app should deploy to:

```text
something.pages.dev
```

A custom domain may be added later.

---

# Local Storage Guidance

Use local storage sparingly.

Acceptable uses:

- remembering selected member
- remembering kiosk mode
- remembering simple preferences

Do not store:

- secrets
- real authentication credentials

---

# UI Philosophy

## Priorities

The UI should feel:

- fast
- calm
- obvious
- readable
- touch-friendly

Prefer:

- whitespace
- big buttons
- simple colors
- clear text
- minimal clicks

Avoid:

- complex animation
- cluttered dashboards
- nested settings
- tiny icons
- over-designed interfaces

---

# Suggested Technical Improvements

These are acceptable in Phase 3:

- simple loading indicators
- basic error handling
- API error messages
- empty states
- reusable button components
- simple layout wrapper
- basic responsive layouts

These are NOT acceptable yet:

- giant component frameworks
- enterprise state management
- microservices
- websocket infrastructure
- advanced caching layers

---

# Testing Guidance

Add lightweight functional validation.

Useful tests:

- completion insertion works
- kiosk reset works
- member persistence works
- due logic works
- admin PIN gate works

Do not build an enterprise QA system.

---

# Acceptance Criteria

Phase 3 is complete when:

- parent can manage chores
- parent can manage family members
- due chores display correctly
- overdue chores display correctly
- member mode works reliably
- kiosk mode works reliably
- app works on phones
- app works on tablets
- app is deployed to Cloudflare
- household can realistically use app daily

---

# Explicit Non-Goals

Still intentionally excluded:

- allowance systems
- reward systems
- streaks
- XP systems
- badges
- AI scoring
- SMS notifications
- push notifications
- multi-household support
- enterprise auth
- billing systems
- advanced reporting

---

# Codex Instructions

## Important

The project is still intentionally small.

Do not:

- introduce enterprise architecture
- create excessive abstractions
- overbuild scheduling
- prematurely optimize scalability

Prefer:

- readable React
- simple Worker endpoints
- understandable D1 schema
- direct workflows
- small reviewable commits

---

# Suggested Branches

Examples:

```text
phase-3-admin-ui
phase-3-today-view
phase-3-due-logic
phase-3-tablet-polish
phase-3-cloudflare-deploy
```

Keep branches small and focused.

---

# Final Direction

The ideal outcome of Phase 3 is:

```text
A lightweight household app that actually gets used.
```

Not a platform.

Not a startup.

Not an enterprise system.

Just:

```text
fast
simple
dependable
useful
```

