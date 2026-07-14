# Data Model

This document describes the current household data model. The schema should evolve in small migrations and remain understandable.

Last verified against the code: **2026-07-13**.

## Family Member

Represents one person in the household.

Fields:

- `id`
- `display_name`
- `nickname`, nullable; public UI uses this when present and falls back to `display_name`
- `avatar_id`, nullable; selected SVG avatar id for UI display
- `member_type`, such as `adult` or `child`
- `sort_order`
- `active`
- `created_at`
- `updated_at`

## Chore

Represents a chore that can be completed.

Fields:

- `id`
- `name`
- `description`
- `frequency_type`, such as `daily`, `weekdays`, `weekends`, `weekly`, `monthly`, or `as_needed`
- `assignment_mode`: `household_anyone`, `assigned_individual`, or `per_person`
- `assigned_member_id`, nullable legacy convenience field for one-person assignment
- `alert_if_overdue`
- `active`
- `created_at`
- `updated_at`

Assignment modes:

- `household_anyone`: one household obligation; any active member may complete it once for the period.
- `assigned_individual`: one selected member is responsible.
- `per_person`: each selected member has an individual obligation.

## Chore Assignment

Represents the members responsible for `assigned_individual` and `per_person` chores.

Fields:

- `id`
- `chore_id`
- `family_member_id`
- `active`
- `created_at`
- `updated_at`

## Chore Completion

Represents one recorded completion event.

Fields:

- `id`
- `chore_id`
- `completed_by_member_id`
- `responsible_member_id`, nullable
- `device_session_id`, nullable
- `completed_at`
- `notes`, nullable

`completed_by_member_id` is the person who tapped complete. `responsible_member_id` is the person whose obligation was satisfied. Household-anyone chores use `responsible_member_id = null`.

## Earned Bug

Represents one temporary Bug Box reward earned from a successful chore completion.

Fields:

- `id`
- `family_member_id`
- `bug_id`, matching a static SVG bug definition in the frontend
- `chore_id`
- `completion_id`
- `earned_at`
- `expires_at`
- `removed_at`, nullable
- `removed_reason`, nullable

Each successful chore completion creates one earned bug for the completing member. Bugs are active while `expires_at` is in the future and `removed_at` is blank. They are hidden after 3 days or after removal. Duplicate bug types are allowed.

## Aquarium Creature

Represents one creature earned by the household aquarium.

Fields:

- `id`
- `species_id`
- `growth_stage`, such as `baby` or `adult`
- `taken_at`, nullable; set when a hook permanently removes this creature from the active tank
- `taken_reason`, nullable; currently `fish_hook` for an automatic hook capture
- `taken_hook_capture_id`, nullable link to the capture cycle that took it
- `created_at`
- `updated_at`

Rows with a blank `taken_at` are active creatures. A taken creature remains in
the database and household export so the capture has durable history; active
tank, growth, and species-discovery queries ignore it.

### Hook capture history and safety

An automatic hook attempt includes a stable cycle identifier. The server derives
the current valid identifier from its own clock and mood, rejects arbitrary keys,
performs the capture roll, and records the processed cycle and last successful
capture time. This makes a cycle idempotent across retries and enforces one
household-wide capture at most every 8 hours.

The server can only mark a surplus hookable fish as taken and must preserve at
least one active creature of each species. Candidate ordering prefers duplicate
pufferfish, then duplicate seahorses, then other eligible duplicate fish. The
client's animation reflects the server result; it does not decide which creature
is removed.

## Aquarium Hook Capture

Records one durable, idempotent result for each automatic hook cycle.

Fields:

- `id`
- `cycle_key`, unique
- `mood`
- `result`: `reserved`, `taken`, or `skipped`
- `reason`
- `creature_id`, nullable
- `message`, nullable
- `created_at`
- `updated_at`

## Device Session (legacy audit storage)

`device_sessions` predates the shared-only product model. New completions create an internal row using the historical `kiosk` database value and the label `Shared aquarium`. This is implementation compatibility, not a selectable application mode or identity session.

Historical rows may still contain `member` or `admin`; the application no longer creates personal-device sessions or exposes session APIs.

Fields:

- `id`
- `session_token_hash`, nullable for now
- `mode`
- `member_id`, nullable
- `device_label`, nullable
- `created_at`
- `last_seen_at`

## Important rule

The member chosen during the record flow is the person credited with the chore. The app does not infer that person from the browser or remember them after the completion.
