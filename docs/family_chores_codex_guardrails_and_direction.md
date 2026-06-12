# Family Chores — Codex Guardrails and Direction

## Purpose

This document defines the intended philosophy, scope, and implementation direction for the Family Chores project.

The goal is to help Codex make good architectural and implementation decisions without overbuilding the application.

---

# Project Identity

This is:

- a small household utility
- a lightweight web app
- intentionally low complexity
- intentionally low security
- optimized for simplicity and usability

This is NOT:

- an enterprise application
- a SaaS platform
- a multi-tenant architecture
- a production-grade security platform
- a monetized subscription system

The application is primarily for a single family household.

---

# Core Philosophy

The app should feel:

- fast
- lightweight
- mobile-friendly
- obvious to use
- low friction
- easy to maintain

Prefer:

- simple code
- readable code
- direct data flow
- minimal abstractions
- practical implementations

Avoid:

- unnecessary patterns
- excessive dependency injection
- framework complexity
- premature optimization
- enterprise ceremony

---

# Preferred Stack

## Frontend

- React
- Vite
- simple component structure
- mobile-first layouts

Do not introduce:

- Next.js
- Redux unless clearly justified
- large UI frameworks unless requested
- overly abstract component systems

## Backend

- Cloudflare Workers
- lightweight API endpoints
- minimal middleware

Do not introduce:

- Express servers
- ASP.NET
- NestJS
- large backend frameworks

## Persistence

- Cloudflare D1
- SQLite-style schema
- small understandable migrations

Do not introduce:

- SQL Server
- PostgreSQL clusters
- ORM complexity unless clearly useful

---

# Application Modes

The app supports two primary usage patterns.

## Member Mode

A personal device remembers a specific family member.

Example:

```text
Emma's iPhone
Dad's phone
```

The user opens the app and immediately sees their chore interface.

The app should remember the member locally.

---

## Kiosk Mode

A shared device such as a kitchen tablet.

Example:

```text
Kitchen iPad
Wall tablet
```

Workflow:

```text
show family member grid
→ choose member
→ choose chore
→ confirm
→ success
→ return to member grid
```

Kiosk mode should be optimized for:

- quick interactions
- large buttons
- visibility at a distance
- minimal taps

---

# Security Philosophy

Security is intentionally minimal.

This is a household utility app.

Do not introduce:

- OAuth
- identity providers
- complex auth systems
- MFA
- JWT ecosystems
- enterprise permission systems

A simple parent/admin PIN later is acceptable.

The goal is to prevent accidental edits, not defend against attackers.

---

# UI Philosophy

The UI should prioritize:

- clarity
- speed
- large touch targets
- mobile usability
- low cognitive load

Prefer:

- big buttons
- simple screens
- obvious navigation
- short workflows

Avoid:

- dashboard overload
- animation-heavy interfaces
- deep navigation hierarchies
- excessive settings

---

# Data Philosophy

The data model should remain small and understandable.

Core entities:

- FamilyMember
- Chore
- ChoreCompletion
- DeviceSession

Avoid premature entities.

Do not create:

- generic workflow engines
- complex recurrence systems
- notification rule builders
- role/permission matrices
- abstract plugin systems

If functionality can be expressed simply, prefer the simpler implementation.

---

# Documentation Expectations

The repository should remain understandable to both humans and AI agents.

Maintain:

```text
/docs
/docs/handoff/open
/docs/handoff/completed
```

Keep documentation:

- concise
- implementation-oriented
- practical
- current

Avoid large process documentation.

---

# Branching Guidance

Prefer small focused branches.

Examples:

```text
phase-1-foundation
kiosk-mode-ui
history-page
basic-d1-schema
```

Avoid giant mixed-purpose branches.

---

# Implementation Guidance

## Preferred Development Style

Implement in small reviewable slices.

Prefer:

- visible progress
- working increments
- simple commits
- phase-based implementation

Avoid:

- giant rewrites
- speculative systems
- adding future scalability before needed

---

# Testing Guidance

Testing should exist, but should remain proportional to project size.

Useful tests:

- API smoke tests
- basic UI flow validation
- database insert validation
- simple workflow verification

Avoid:

- enormous test frameworks early
- excessive mocking infrastructure
- enterprise QA systems

---

# Non-Goals (Current Scope)

The following are intentionally outside current scope:

- allowance systems
- gamification
- achievement systems
- AI chore scoring
- multi-family SaaS support
- billing systems
- advanced notification engines
- SMS alerts
- push notifications
- advanced recurring scheduling
- enterprise analytics
- heavy reporting systems
- FactoryEdge integration

These may be considered later only if the core app proves useful.

---

# Performance and Hosting Philosophy

The app should remain:

- cheap/free to host
- easy to deploy
- low maintenance
- serverless where practical

Preferred deployment target:

- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1

Avoid introducing infrastructure that requires:

- VM administration
- patch management
- dedicated database servers
- container orchestration

---

# Final Direction

The ideal first beta is:

- understandable in one sitting
- easy for children to use
- easy for parents to review
- deployable cheaply
- maintainable by one developer
- simple enough for Codex to safely extend

If there is uncertainty between:

```text
simple vs sophisticated
```

prefer:

```text
simple
```

