# Family Chores — Chore Assignment Model Handoff

## Purpose

The app needs a clearer distinction between different kinds of chores.

Some chores belong to one person.
Some chores belong to the household and only need to be done once by anyone.
Some chores need to be done individually by multiple people.

This handoff defines the assignment model Codex should implement.

---

# Core Problem

The current simple idea of:

```text
chore.assigned_member_id nullable
```

is not expressive enough.

It handles:

```text
one chore assigned to one person
```

but it does not cleanly handle:

```text
one household chore anyone can complete
```

or:

```text
one chore every selected person must complete individually
```

---

# Required Chore Types

## 1. Household Chore — Anyone Can Do It

A chore that needs to be completed once, and the family does not care who does it.

Examples:

```text
Wash Dishes
Unload Dishwasher
Take Out Trash
Clean Kitchen Countertops
Feed Pets
```

Behavior:

- chore appears as available to everyone
- any family member can complete it
- completion records who actually did it
- once completed for the period, it is considered done

Example:

```text
Feed Pets was completed by Emma at 7:15 AM
```

This is chore-centric.

The important question is:

```text
Was the chore done?
```

not:

```text
Did every person do it?
```

---

## 2. Individual Assigned Chore — Specific Person Must Do It

A chore assigned to one specific person.

Examples:

```text
Put on sunscreen — assigned to Child 1
Take medicine — assigned to Child 2
Practice piano — assigned to Child 3
```

Behavior:

- chore appears for assigned person
- kiosk may show it after that person is selected
- other family members should not normally see it as their chore
- completion records assigned person as the responsible member

The important question is:

```text
Did this person complete their task?
```

---

## 3. Per-Person Chore — Each Assigned Person Must Do It Individually

A chore template where multiple people each need their own completion.

Examples:

```text
Empty your bathroom trash before trash day
Brush teeth
Make your bed
Put away your laundry
```

Behavior:

- one logical chore definition exists
- selected members each have their own obligation
- each person must complete it separately
- one child completing it does not complete it for everyone else

Example:

```text
Empty Bathroom Trash
- Child 1: complete
- Child 2: incomplete
- Child 3: complete
- Child 4: incomplete
```

The important question is:

```text
Which people have completed their own instance?
```

---

# Recommended Data Model

Do not rely only on `chores.assigned_member_id`.

Use a chore-level assignment mode plus optional assignment rows.

---

## Chores Table

Add or support:

```text
assignment_mode
```

Allowed values:

```text
household_anyone
assigned_individual
per_person
```

Suggested table shape:

```text
chores
- id
- name
- description
- frequency_type
- assignment_mode
- active
- created_at
- updated_at
```

Do not use `assigned_member_id` as the primary assignment design anymore.

It is too limited.

---

## Chore Assignments Table

Create:

```text
chore_assignments
- id
- chore_id
- family_member_id
- active
- created_at
- updated_at
```

Usage:

### For `household_anyone`

No assignment rows required.

The chore is available to all active members.

### For `assigned_individual`

One assignment row expected.

Example:

```text
Put on Sunscreen → Child 1
```

### For `per_person`

Multiple assignment rows expected.

Example:

```text
Empty Bathroom Trash → Child 1
Empty Bathroom Trash → Child 2
Empty Bathroom Trash → Child 3
Empty Bathroom Trash → Child 4
```

---

## Chore Completions Table

Ensure completions record:

```text
chore_id
completed_by_member_id
responsible_member_id nullable
session_id nullable
completed_at
notes nullable
```

Why both members?

### `completed_by_member_id`

Who physically clicked/completed the chore.

### `responsible_member_id`

Whose obligation was satisfied.

For most cases these are the same.

But this allows future flexibility.

Examples:

```text
Household chore:
Wash Dishes completed_by Emma, responsible_member_id null
```

```text
Individual chore:
Sunscreen completed_by Child 1, responsible_member_id Child 1
```

```text
Per-person chore:
Empty Bathroom Trash completed_by Child 2, responsible_member_id Child 2
```

Do not overuse this flexibility yet, but the data model should support it.

---

# UI Behavior

## Member Mode

When a member opens their personal device, show:

1. household chores anyone can complete
2. chores assigned specifically to that member
3. per-person chores where that member has an active assignment

Do not show chores assigned only to other people.

---

## Kiosk Mode

Workflow remains:

```text
select family member
→ show chores relevant to that member
→ select chore
→ confirm
→ save completion
→ return to family grid
```

After selecting a member, show:

1. household-anyone chores
2. that member's assigned individual chores
3. that member's per-person chores

---

# Completion Logic

## Household Chore

A completion satisfies the chore for the household for that period.

Example:

```text
Feed Pets completed by Dad
```

Result:

```text
Feed Pets is done for the day
```

---

## Assigned Individual Chore

A completion satisfies the task for the assigned person.

Example:

```text
Child 1 completed Put on Sunscreen
```

Result:

```text
Child 1's sunscreen chore is done for the day
```

---

## Per-Person Chore

A completion satisfies only that selected person's obligation.

Example:

```text
Child 1 completed Empty Bathroom Trash
```

Result:

```text
Child 1 is complete
Child 2 still incomplete
Child 3 still incomplete
Child 4 still incomplete
```

---

# Due Logic

Due logic must account for assignment mode.

## Household Chore Due

Due if no completion exists for that chore in the current period.

```text
chore_id match
responsible_member_id is null or ignored for household mode
```

---

## Assigned Individual Due

Due if no completion exists for:

```text
chore_id
responsible_member_id = assigned member
current period
```

---

## Per-Person Due

Due separately for each assignment row.

For each active chore assignment:

```text
chore_id
family_member_id
```

check whether a completion exists for:

```text
chore_id
responsible_member_id = family_member_id
current period
```

---

# Admin / Setup UI

When creating or editing a chore, parent should choose:

```text
Who needs to do this?
```

Options:

```text
Anyone in the family can do it once
One specific person
Each selected person must do it individually
```

Map these to:

```text
household_anyone
assigned_individual
per_person
```

If `household_anyone`:

- do not require selecting members

If `assigned_individual`:

- require selecting one member

If `per_person`:

- allow selecting multiple members

---

# Example Seed Chores

## Household Anyone

```text
Wash Dishes
Unload Dishwasher
Take Out Trash
Feed Pets
Wipe Kitchen Counters
```

## Assigned Individual

```text
Put on Sunscreen — Child 1
Take Morning Medicine — Child 2
Practice Piano — Child 3
```

## Per-Person

```text
Make Bed — children
Empty Bathroom Trash — children
Put Away Laundry — children
Brush Teeth — children
```

---

# Codex Implementation Instructions

## Important

Update the data model before building more due/overdue logic.

Do not continue relying on a single nullable `assigned_member_id` field.

That model is too limited.

---

## Implementation Steps

1. Add `assignment_mode` to chores.
2. Add `chore_assignments` table.
3. Update seed data.
4. Update APIs to return relevant chores for selected member.
5. Update completion insert logic to set `responsible_member_id` correctly.
6. Update due logic to respect assignment mode.
7. Update admin/setup UI to select assignment mode.
8. Update history display to show who completed the chore.
9. Update documentation.

---

# API Guidance

Prefer a member-aware chore endpoint.

Example:

```text
GET /api/members/:memberId/chores
```

Returns chores relevant to that member:

- household-anyone chores
- assigned individual chores for that member
- per-person chores assigned to that member

Keep the existing general chore endpoint for admin/setup if useful.

---

# Acceptance Criteria

This implementation is complete when:

- household chores can be completed by anyone
- one person's household completion marks the chore done for the household period
- individual chores appear only for the assigned person
- per-person chores track each person's completion separately
- kiosk mode shows the correct chores after selecting a member
- member mode shows the correct chores for the remembered member
- history shows who actually completed each chore
- due/overdue logic respects assignment mode
- admin/setup supports choosing assignment type

---

# Non-Goals

Do not implement yet:

- chore quotas per child
- fairness balancing
- automatic rotation
- point systems
- allowance calculations
- gamification
- advanced recurrence rules

Those can be considered later.

For now, solve the assignment model cleanly and simply.

