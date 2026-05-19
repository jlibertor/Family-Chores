# Family Chores — Phase 2 Seed Data and Core Workflow

## Purpose

Phase 1 established the project structure and technical foundation.

Phase 2 now focuses on:

- entering initial household data
- creating the first usable workflows
- proving end-to-end data flow
- building a minimally usable family beta

This phase should produce a working system where:

```text
family member → selects chore → completion saved → history visible
```

without overcomplicating the application.

---

# Phase 2 Scope

This phase includes:

- family member seed data
- initial chore seed data
- kiosk mode workflow
- member mode workflow
- completion history
- D1 persistence
- simple due logic foundation

This phase does NOT include:

- advanced alerts
- gamification
- allowance systems
- serious authentication
- complex recurrence engines
- push notifications

---

# Required Seed Data

## Family Members

Create six initial family members.

Use placeholders if real names are not yet available.

Example:

```text
Dad
Mom
Child 1
Child 2
Child 3
Child 4
```

Required fields:

```text
id
display_name
member_type
sort_order
active
created_at
updated_at
```

### Member Type Values

Use:

```text
adult
child
```

---

# Initial Chore Seed Data

Create a practical starter set of chores.

Do not overthink categorization.

Suggested initial chores:

```text
Wash Dishes
Unload Dishwasher
Take Out Trash
Feed Pets
Clean Bedroom
Vacuum Living Room
Wipe Kitchen Counters
Laundry
Clean Bathroom
Pick Up Toys
```

Required fields:

```text
id
name
description nullable
frequency_type
assigned_member_id nullable
active
created_at
updated_at
```

### Frequency Types

Support:

```text
daily
weekly
as_needed
```

Do not build complex recurring logic yet.

---

# Device Session Data

The app should support:

## Member Devices

Examples:

```text
Emma iPhone
Dad Phone
```

These devices remember the selected member.

---

## Kiosk Devices

Examples:

```text
Kitchen Tablet
Hallway iPad
```

Kiosk devices always start from the family member selection screen.

---

# Database Requirements

## Required Tables

Ensure D1 schema includes:

```text
family_members
chores
chore_completions
device_sessions
```

---

## Chore Completion Requirements

Every completion should record:

```text
which chore
which family member
which device/session
when completed
```

Example:

```text
Emma completed Wash Dishes from Kitchen Tablet
```

---

# API Requirements

## Required Endpoints

### Members

```text
GET /api/members
```

Returns active family members ordered by sort order.

---

### Chores

```text
GET /api/chores
```

Returns active chores.

---

### Record Completion

```text
POST /api/completions
```

Request body example:

```json
{
  "memberId": 2,
  "choreId": 5,
  "sessionMode": "kiosk"
}
```

The endpoint should:

- validate IDs exist
- insert completion row
- return success response

Do not overcomplicate validation.

---

### Recent History

```text
GET /api/completions/recent
```

Returns recent completion history.

Suggested fields:

```text
member_name
chore_name
completed_at
session_mode
```

---

### Session Selection

```text
POST /api/session/select-member
POST /api/session/kiosk
```

Purpose:

- store device mode
- remember member locally
- simplify future app launch

---

# Frontend Requirements

## Required Routes

```text
/choose-mode
/member
/kiosk
/history
```

---

# Choose Mode Screen

Simple first screen:

```text
This is my device
This is a shared kiosk
```

Large buttons.

Minimal text.

---

# Member Mode

Workflow:

```text
open app
→ remembered member
→ see chores
→ tap chore
→ confirm
→ success
→ return to chores
```

Requirements:

- remember selected member locally
- large touch buttons
- mobile-friendly layout
- quick interaction flow

---

# Kiosk Mode

Workflow:

```text
show family members
→ select member
→ select chore
→ confirm
→ success
→ return to member grid
```

Requirements:

- optimized for shared tablet
- very large buttons
- fast interaction cycle
- obvious member selection

---

# History Screen

The history page should show:

```text
who completed what
when it was completed
how it was submitted
```

Example:

```text
Emma — Wash Dishes — 6:42 PM — Kitchen Tablet
```

Keep layout simple.

No advanced filtering yet.

---

# UI Guidance

## Priorities

Prioritize:

- clarity
- speed
- touch usability
- readability from a distance
- minimal taps

Prefer:

- large buttons
- simple spacing
- minimal configuration
- clear success states

Avoid:

- animations
- dashboard clutter
- tiny controls
- complicated menus

---

# Due Logic (Simple Only)

Implement only basic due calculations.

## Daily Chore

A daily chore is due if:

```text
no completion exists today
```

## Weekly Chore

A weekly chore is due if:

```text
no completion exists this week
```

Do not implement:

- cron systems
- recurrence engines
- schedule builders
- timezone complexity

Keep it simple.

---

# Acceptance Criteria

Phase 2 is complete when:

- family members load from database
- chores load from database
- member mode works
- kiosk mode works
- chore completions save correctly
- recent history displays correctly
- app works on phone-sized layouts
- app works reasonably on tablet/kiosk layout
- data persists in D1

---

# Codex Instructions

## Important

Build only enough infrastructure to support the current workflow.

Do not introduce:

- advanced auth
- role systems
- Redux
- enterprise patterns
- unnecessary abstractions
- large component frameworks

Prefer:

- direct API calls
- readable React components
- simple state management
- small reviewable commits

---

# Suggested Branches

Examples:

```text
phase-2-seed