# Data Model

This document describes the current household data model. The schema should evolve in small migrations and remain understandable.

## Family Member

Represents one person in the household.

Fields:

- `id`
- `display_name`
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
- `frequency_type`, such as `daily`, `weekly`, `monthly`, or `as_needed`
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

## Device Session

Represents device or browser mode. It is not always the same as the person completing a chore.

Modes:

- `member`: a personal device remembered as one family member
- `kiosk`: a shared device that asks who is using it first
- `admin`: parent/setup mode, likely protected by a simple PIN later

Fields:

- `id`
- `session_token_hash`, nullable for now
- `mode`
- `member_id`, nullable
- `device_label`, nullable
- `created_at`
- `last_seen_at`

## Important Rule

A device session is not always a person. Chore completions must record both the actual family member who completed the chore and, when available, the device session that submitted it.

Examples:

- Emma completed Dishes from Kitchen Kiosk.
- Emma completed Dishes from Emma's phone.
