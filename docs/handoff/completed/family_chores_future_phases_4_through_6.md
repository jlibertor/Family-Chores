# Family Chores — Future Phases 4 Through 6

## Purpose

Phases 1–3 established:

- working household workflows
- kiosk mode
- member mode
- parent management
- deployment
- stable household usage

These next phases are intentionally optional and should only be implemented if:

```text
the household genuinely uses the app regularly
```

The app should remain small and practical.

Do not transform the project into a large platform.

---

# Phase 4 — Household Convenience Features

## Goal

Improve daily convenience and household usefulness.

This phase focuses on:

- reducing friction
- improving visibility
- helping parents monitor chores more easily

without introducing major system complexity.

---

## Suggested Features

### Simple Notifications

Implement lightweight reminders.

Preferred options:

- browser notifications
- optional email reminders
- optional Discord/Telegram webhook notifications

Avoid SMS initially.

---

## Chore Reminders

Allow parents to mark certain chores as:

```text
important
needs reminder
```

Examples:

```text
Trash Night
Feed Pets
Wash Dishes
```

Do not build advanced scheduling systems.

---

## Better Today Dashboard

Improve visibility for:

- chores due today
- overdue chores
- recently completed chores
- who has completed chores recently

Still keep the interface simple.

Avoid analytics dashboards.

---

## Chore Notes

Allow optional notes on completions.

Examples:

```text
Dishwasher already running
Trash taken to curb
Dog already fed
```

Keep notes lightweight.

---

## Tablet Kiosk Improvements

Improve:

- idle screen
- family member grid
- touch spacing
- visibility from distance
- household status visibility

Possible additions:

- current time
- today's chores
- completion count

Still avoid clutter.

---

## Acceptance Criteria

Phase 4 is complete when:

- reminders work reliably
- household visibility improves
- parents can monitor chores more easily
- kiosk feels polished
- app remains lightweight and understandable

---

# Phase 5 — Optional Motivation and Engagement Features

## Goal

Experiment carefully with motivation systems.

This phase should remain optional.

The goal is:

```text
encourage participation
```

NOT:

```text
turn app into a video game
```

---

## Suggested Features

### Simple Streaks

Examples:

```text
Completed dishes 5 days in a row
```

Keep visuals simple.

Avoid giant reward systems.

---

## Lightweight Points

Optional completion points.

Examples:

```text
1 point per chore
weekly totals
```

Avoid:

- economies
- currencies
- stores
- complex balancing systems

---

## Positive Reinforcement

Examples:

```text
Great job!
Kitchen cleaned!
All chores completed today!
```

Small encouraging feedback only.

---

## Optional Household Stats

Simple household summaries:

- chores completed today
- weekly completion count
- most active helper this week

Avoid:

- advanced analytics
- competitive systems
- public shaming mechanics

---

## Important Guidance

This phase must remain:

```text
lightweight
optional
family-friendly
```

Do not let gamification dominate the app.

The app is still primarily:

```text
a household utility
```

---

## Acceptance Criteria

Phase 5 is complete when:

- motivation features feel positive
- children enjoy using app slightly more
- household workflow remains fast
- app still feels simple
- gamification does not overwhelm usability

---

# Phase 6 — Long-Term Polish and Smart Household Features

## Goal

Explore carefully selected “smart household” features only after the app has proven useful over time.

This phase should remain highly selective.

Do not add features simply because they are technically possible.

---

## Suggested Features

### Smart Suggestions

Examples:

```text
Trash usually completed around 7 PM
Dishes overdue since yesterday
Bathroom cleaning skipped this week
```

Keep suggestions simple and practical.

Avoid AI overengineering.

---

## Better Household Status Screen

Potential features:

- household completion percentage
- today's status
- overdue warning visibility
- simple weekly summaries

Still avoid enterprise dashboards.

---

## Chore Rotation

Optional rotating chore assignments.

Examples:

```text
alternate dish duty weekly
rotate trash responsibility
```

Keep implementation simple.

Avoid advanced scheduling engines.

---

## Calendar Awareness (Optional)

Potential future ideas:

- trash day reminders
- school-night reminders
- holiday-aware chores

Only implement if genuinely useful.

---

## Mounted Household Display Mode

Explore:

- dedicated always-on kiosk layout
- household command-center screen
- passive status display

Examples:

```text
Today's chores
Completed today
Overdue items
```

Designed for:

- old iPad
- kitchen wall tablet
- family hub display

---

## Acceptance Criteria

Phase 6 is complete when:

- smart features improve usability
- household visibility improves
- mounted display experience feels polished
- app remains fast and understandable
- complexity remains controlled

---

# Explicit Long-Term Non-Goals

Still intentionally excluded unless requirements drastically change:

- enterprise auth
- SaaS billing
- multi-tenant systems
- corporate task management
- employee management
- advanced AI orchestration
- social networking features
- native mobile apps
- large reporting systems
- complex workflow engines
- excessive customization systems

---

# Codex Guidance

## Important

As the app evolves:

```text
protect simplicity aggressively
```

The project succeeds if:

- the family actually uses it
- the workflow remains fast
- the code remains understandable
- maintenance stays low

The project fails if it becomes:

- bloated
- complicated
- over-architected
- slow to modify
- difficult for the household to use

---

# Final Direction

The ideal long-term outcome is:

```text
A simple household utility that quietly helps the family stay organized.
```

Not:

```text
a startup platform
```

Prefer:

```text
practical
simple
pleasant
maintainable
```

