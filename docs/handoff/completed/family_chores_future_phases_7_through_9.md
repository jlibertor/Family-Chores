# Family Chores — Future Phases 7 Through 9

## Purpose

Phases 1–6 established:

- stable household workflows
- parent management
- optional reminders
- optional motivation systems
- long-term polish direction

These future phases explore selective expansion while protecting the app from becoming bloated.

Every feature in these phases should justify itself through:

```text
real household usefulness
```

not novelty.

---

# Phase 7 — Household Automation and Ambient Experience

## Goal

Make the app feel more naturally integrated into the household.

This phase focuses on:

- passive visibility
- low-friction reminders
- ambient household awareness

without introducing large infrastructure complexity.

---

## Suggested Features

### Ambient Household Screen

Create a cleaner “always-on” household display mode.

Possible display sections:

```text
Today's chores
Completed chores
Overdue chores
Current time
Family activity summary
```

This should work well on:

- old iPad wall mount
- kitchen counter tablet
- hallway display

---

## Smart Idle Mode

Potential features:

- dimmed idle display
- rotating household status cards
- large readable status panels
- auto-refresh every few minutes

Avoid:

- video-heavy rendering
- complex animation systems

---

## Passive Reminder Prompts

Examples:

```text
Dishes overdue
Trash night tonight
Pets not fed yet
```

These should feel:

- gentle
- non-annoying
- easy to ignore if desired

Avoid aggressive notification behavior.

---

## Simple Sound Effects (Optional)

Examples:

```text
completion chime
success sound
soft reminder tone
```

Keep optional.

Avoid turning app into a game.

---

## Acceptance Criteria

Phase 7 is complete when:

- mounted display mode feels useful
- kiosk experience feels polished
- passive reminders help household awareness
- app still feels calm and lightweight

---

# Phase 8 — Household Operations and Routine Management

## Goal

Expand carefully beyond chores into lightweight household coordination.

This phase should remain extremely restrained.

The app is still:

```text
a household utility
```

not a life-management platform.

---

## Suggested Features

### Recurring Household Tasks

Examples:

```text
replace air filter
clean refrigerator
mow lawn
trash day
```

These may use:

```text
monthly
custom interval
```

But keep recurrence logic simple.

Avoid advanced scheduling engines.

---

## Household Notes

Optional shared notes area.

Examples:

```text
Need dishwasher pods
Dog food running low
Take recycling out Thursday
```

Keep lightweight.

Avoid collaborative document systems.

---

## Simple Shopping Reminders

Potential examples:

```text
milk
trash bags
paper towels
```

This should remain:

- minimal
- fast
- optional

Avoid building grocery-management software.

---

## Basic Household Calendar Awareness

Examples:

```text
school nights
trash pickup day
vacation mode
```

Only implement if genuinely useful.

Avoid full calendar platforms.

---

## Acceptance Criteria

Phase 8 is complete when:

- recurring household tasks work
- household notes are useful
- shopping reminders remain lightweight
- household coordination improves slightly
- app still feels focused and understandable

---

# Phase 9 — Long-Term Stability and Refinement

## Goal

Refine the application into a stable long-term household tool.

This phase focuses on:

- maintainability
- cleanup
- reliability
- simplicity preservation

rather than adding large new features.

---

## Suggested Work

### Cleanup and Refactoring

Review:

- duplicated components
- repeated API logic
- inconsistent styling
- unnecessary complexity
- outdated handoff docs

Refactor conservatively.

Avoid giant rewrites.

---

## Lightweight Backup and Export

Potential features:

- export chores
- export completion history
- lightweight backup JSON

Keep implementation simple.

Avoid enterprise backup systems.

---

## Performance Cleanup

Review:

- unnecessary renders
- oversized bundles
- slow tablet screens
- inefficient API calls

The app should remain fast even on older devices.

---

## Reliability Improvements

Improve:

- offline tolerance where practical
- retry behavior
- local persistence
- error handling

Avoid building distributed sync systems.

---

## Documentation Refresh

Ensure:

- docs remain accurate
- completed handoffs archived
- outdated plans removed
- setup documentation clean

The repository should remain understandable to a future AI agent or developer.

---

## Acceptance Criteria

Phase 9 is complete when:

- app feels stable long-term
- codebase remains understandable
- mounted tablet experience remains smooth
- performance remains strong on older devices
- project remains easy to maintain

---

# Explicit Non-Goals

Still intentionally excluded:

- enterprise task systems
- workforce management
- billing systems
- SaaS conversion
- social features
- native apps
- advanced AI orchestration
- advanced analytics
- complicated automation engines
- excessive customization systems

---

# Codex Guidance

## Important

At this stage, feature discipline matters more than feature quantity.

Every feature should answer:

```text
Does this genuinely help the household?
```

If not:

```text
Do not build it.
```

---

# Final Direction

The ideal long-term result is:

```text
A dependable household utility that quietly becomes part of the family's routine.
```

The app should feel:

```text
simple
fast
pleasant
low-maintenance
```

Even years later.

