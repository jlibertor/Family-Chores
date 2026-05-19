# Family Chores — Future Phases 10 Through 12

## Purpose

Phases 1–9 established:

- stable household workflows
- mounted kiosk support
- optional reminders
- lightweight household coordination
- long-term maintainability direction

These future phases explore careful expansion while preserving the app’s identity:

```text
small practical household utility
```

The project should still avoid becoming:

- a SaaS platform
- a productivity suite
- an enterprise workflow system

---

# Phase 10 — Household Intelligence and Simplification

## Goal

Reduce household friction through small intelligent behaviors.

The purpose is not AI hype.

The purpose is:

```text
making the app quietly more useful
```

---

## Suggested Features

### Smart Chore Visibility

Examples:

```text
Frequently skipped chores rise higher
Overdue chores become visually emphasized
Recently completed chores collapse lower
```

Keep implementation simple.

Avoid advanced scoring systems.

---

## Adaptive Household Suggestions

Examples:

```text
Trash usually completed around 8 PM
Bathroom cleaning overdue for 6 days
Laundry usually completed Sunday evenings
```

Suggestions should remain:

- informative
- non-intrusive
- lightweight

---

## Quick Household Actions

Examples:

```text
Mark all kitchen chores complete
Reset as-needed chores
Quick complete repeated chores
```

Only implement shortcuts that genuinely reduce friction.

---

## Household Activity Feed

Optional simplified activity stream:

```text
Emma completed dishes
Dad completed trash
Mom added grocery reminder
```

Keep visual design calm.

Avoid social-media style feeds.

---

## Acceptance Criteria

Phase 10 is complete when:

- household workflow becomes faster
- smart suggestions feel useful
- activity visibility improves
- app still feels lightweight

---

# Phase 11 — Device Experience and Household Hardware Integration

## Goal

Improve the app as a physical household object.

The app should begin feeling like:

```text
part of the house
```

rather than just another website.

---

## Suggested Features

### Enhanced Wall-Mounted Mode

Improve:

- always-on layouts
- kiosk readability
- glanceable information
- idle-state visibility
- burn-in protection behaviors

---

## Dedicated Kiosk Layout

Potential layout areas:

```text
Today's chores
Family quick-select grid
Recent completions
Overdue indicators
Current time
```

Optimized for:

- old iPads
- kitchen displays
- hallway screens

---

## Smart Wake / Sleep Behavior

Examples:

```text
dim overnight
wake during active hours
simplified low-light mode
```

Keep implementation practical.

Avoid building a smart-home platform.

---

## Tablet Hardware Optimization

Improve:

- large touch areas
- portrait mode support
- landscape mode support
- slower-device performance
- older Safari compatibility

The app should remain smooth on older hardware.

---

## Acceptance Criteria

Phase 11 is complete when:

- mounted tablet experience feels polished
- app behaves naturally in shared household spaces
- visibility and readability improve significantly
- older devices still perform well

---

# Phase 12 — Mature Household Utility Stabilization

## Goal

Transition the app from:

```text
ongoing project
```

into:

```text
stable mature household tool
```

This phase prioritizes restraint.

---

## Suggested Work

### Feature Audit

Review all existing functionality.

Remove or simplify features that:

- add friction
- confuse children
- rarely get used
- complicate maintenance

Prefer removing complexity over adding more.

---

## Long-Term Maintenance Cleanup

Review:

- schema simplicity
- component duplication
- API consistency
- stale documentation
- old handoff files
- unnecessary dependencies

Keep the codebase understandable.

---

## Lightweight Data Export

Optional exports:

```text
completion history JSON
family configuration export
chore configuration backup
```

Keep exports human-readable.

---

## Household Reliability Improvements

Improve:

- startup reliability
- tablet reconnect behavior
- local persistence
- graceful error recovery
- low-connectivity behavior

Avoid distributed/offline sync complexity.

---

## Documentation Finalization

Ensure:

- architecture docs remain current
- completed handoffs archived
- setup instructions verified
- deployment instructions verified
- repository remains easy for future AI agents to understand

---

## Acceptance Criteria

Phase 12 is complete when:

- app feels stable long-term
- maintenance burden stays low
- codebase remains understandable
- family usage remains smooth
- unnecessary complexity has been reduced

---

# Explicit Non-Goals

Still intentionally excluded:

- enterprise workflow systems
- corporate productivity tooling
- workforce management
- billing systems
- advanced AI orchestration
- native mobile apps
- social platform behavior
- complicated analytics systems
- excessive customization frameworks

---

# Codex Guidance

## Important

At this stage:

```text
simplicity preservation becomes the primary architectural goal
```

The project succeeds if:

- family members continue using it naturally
- maintenance remains easy
- mounted kiosk usage feels effortless
- future AI agents can still understand the repo quickly

The project fails if:

- complexity accumulates uncontrollably
- workflows become slower
- UI becomes cluttered
- maintenance becomes difficult

---

# Final Direction