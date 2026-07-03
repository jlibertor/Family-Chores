# Aquarium Mood — How Chores Become Fish Feelings

Definitive reference for the chore → fish mood math. The implementation lives in
`worker/src/index.ts` (`getBaseAquariumMood`, `getParticipationCeilingMood`,
`getAquariumMood`, `getAquariumMoodMessage`, `addAquariumFoodForCompletion`,
`applyAquariumMaintenance`, `triggerAquariumPanic`, `clearAquariumPanic`,
`triggerAquariumEverythingGood`). This doc is written to match that code exactly;
if they ever disagree, the code wins and this doc has a bug.

Last verified against the code: **2026-07-03** (which also shipped six behavior
fixes — see [Behavior fixes](#behavior-fixes-2026-07-03)).

---

## The moods

Six moods, ranked from worst to best. Lower rank = sadder fish.

| Rank | Mood | Fish face reads as |
|---|---|---|
| 0 | `sad` | Miserable; the tank has been neglected (or panic mode is on) |
| 1 | `very_hungry` | Distressed and begging |
| 2 | `hungry` | Clearly unfed |
| 3 | `peckish` | A little wanting; "could use more help" |
| 4 | `content` | Doing okay |
| 5 | `happy` | Well fed and thriving |

When two moods compete, the engine keeps the **worse** one (`worseAquariumMood`
picks the lower rank) — except where the mood floor invariant applies (below).

## What counts as a chore, and when is "today"?

Only completions that satisfy **all** of these feed the mood:

- Completed by a **child** member (`member_type = 'child'`). Adult chores never count.
- The chore has `feeds_aquarium = 1` (the default; a chore can be flagged to not feed).
- Completed during **today** in the household calendar.

**Timezone note:** "today" is computed in the hardcoded household timezone,
**`America/Los_Angeles`** (`householdTimeZone`, `worker/src/index.ts` ~line 214).
The day rolls over at Pacific midnight regardless of where a device is.

## Step 1 — Base mood from today's chore count

`getBaseAquariumMood` looks at how many qualifying chores were completed today
(`todayChildCount`, total completions — not distinct kids):

| Chores today | Base mood |
|---|---|
| 3 or more | `happy` |
| 2 | `content` |
| 1 | `hungry` |
| 0 | time-based decay (below) |

One morning routine is deliberately not enough — the tank wants real effort.

### Zero chores: time decay from `last_fed_at`

With no chores yet today, the mood decays from the last feeding time:

| Hours since last fed | Mood |
|---|---|
| ≤ 20 | `peckish` |
| ≤ 32 | `hungry` |
| ≤ 44 | `very_hungry` |
| > 44 (or `last_fed_at` missing/unparseable) | `sad` |

Note the tank never reports `happy` or `content` on decay alone — yesterday's work
buys stability, not celebration. Today's chores have to actually start.

## Step 2 — Participation ceiling

`getParticipationCeilingMood` caps the base mood so **one child cannot carry the
tank**. It compares distinct participating children today against active children:

| Distinct kids who did chores | Ceiling |
|---|---|
| everyone (≥ active count) | `happy` |
| all but one | `content` |
| at least half (ceil(active/2)) | `peckish` |
| fewer than half, but at least one | `peckish` (the floor — effort stays visible) |
| zero (or no active children) | no ceiling applied |

The final capped mood is the **worse** of the base mood and the ceiling.

> Fixed 2026-07-03: the ceiling now bottoms out at `peckish`. Previously a solo
> kid in a big family could grind chores all day and still watch the tank sulk in
> `hungry` — their effort is now always visible at `peckish` or better.

## Step 3 — Overrides and the mood floor

`getAquariumMood` applies everything in this order:

1. **"Everything good" override** — if `everything_good_until` is in the future,
   the mood is `happy`, full stop. (Set by a parent via `clearAquariumPanic` or
   `triggerAquariumEverythingGood`; lasts 4 hours.)
2. **Panic mode** — if `panic_mode = 1`, the mood is `sad`, full stop.
3. **Base mood capped by the participation ceiling** (steps 1–2 above).
4. **Mood floor invariant** — if at least one chore was completed today, the final
   mood can never be worse than what **zero** chores would produce right now.

> Fixed 2026-07-03 (the floor): without it, the first chore of the day could
> *lower* the mood — time-decay says `peckish` (0 chores, recently fed), but the
> count table says 1 chore = `hungry`. To a kid that reads as punishment for
> helping. Now a completed chore can never leave the tank worse than doing nothing.

## The mood banner (`getAquariumMoodMessage`)

| Situation | Message |
|---|---|
| Panic active | `The fish are scared! N more chore(s) to save them.` (N = `panic_chores_needed`, min 1) |
| `happy` | `The fish are well fed today.` |
| `content` | `The fish are doing okay today.` |
| `peckish` | `The fish could use a little more help today.` |
| worse, 1 chore done | `Only 1 chore completed today.` |
| worse, 2+ chores done | `N chores done — the fish need more of the family to pitch in.` |
| worse, 0 chores done | `No chores completed today!` |

> Fixed 2026-07-03: the banner always acknowledges the completed-chore count. It
> never claims "No chores completed today!" when chores actually happened, and
> during panic it shows progress so every chore visibly counts toward the rescue.

## Feeding: what one completion does (`addAquariumFoodForCompletion`)

Every qualifying completion:

- runs maintenance first (see below);
- adds **+1 food** to `food_reserve` (capped at `max_food_reserve`);
- increments `total_chore_completions`;
- sets `last_fed_at = now` (resets the decay clock);
- decrements `panic_chores_needed` by 1 (never below 0); when the countdown hits
  zero, panic mode clears itself;
- logs a `fed` event ("Name fed the aquarium!");
- every `creature_unlock_interval` completions (25), lays an **egg** for the next
  undiscovered species, hatching after `egg_incubation_minutes`.

## Maintenance (`applyAquariumMaintenance`)

Runs before any aquarium read or feed:

- **Expired panic** (`panic_expires_at` ≤ now) switches panic off and clears the
  countdown. It does **not** touch `last_fed_at`.
- **Daily food consumption** — the reserve drops by `daily_food_consumption` per
  elapsed household day.
- **Growth** — babies become adults after `growth_days` if the reserve is ≥ 40%.
- **Expired "everything good"** clears the override **and resets `last_fed_at`
  to now**, so the mood walks down gracefully through the decay table
  (peckish → hungry → …) instead of cliff-dropping to wherever a stale
  `last_fed_at` would land it. *(Fixed 2026-07-03.)*
- **Egg hatching** — due eggs hatch into baby creatures with a celebration event.

## Panic mode

- **`triggerAquariumPanic`** (parent action): sets `panic_mode = 1`,
  `panic_chores_needed = 3`, `panic_expires_at = now + 4 hours`, and clears any
  "everything good" override. The mood locks to `sad` and the banner counts down
  ("N more chores to save them"). Three new chores — or the 4-hour expiry — lift it.
  *(Fixed 2026-07-03: panic no longer backdates `last_fed_at`, so lifting panic
  returns the tank to its honest state instead of an artificially starved one.)*
- **`clearAquariumPanic`** (parent action): clears panic, grants 4 hours of
  "everything good" (`happy`), sets `last_fed_at = now`, and logs
  "A parent gave the fish a treat — they are happy again!"
- **`triggerAquariumEverythingGood`** (parent action): same effect without panic
  needing to be on — 4 hours of guaranteed `happy`, decay clock reset.

## Behavior fixes (2026-07-03)

For the record, all shipped together:

1. **Mood floor invariant** — a completed chore can never leave the tank worse
   than zero chores would (no more peckish→hungry drop on the first chore).
2. **Honest banner** — the mood message always acknowledges the completed-chore
   count; it never says "No chores completed" when chores happened.
3. **Participation ceiling floors at `peckish`** — a solo kid's effort stays visible.
4. **Panic shows progress** — "N more chores to save them."
5. **Panic no longer backdates `last_fed_at`.**
6. **"Everything good" expiry resets `last_fed_at`** — graceful decay, no cliff-drop.

---

## FAQ for parents: "Why didn't my kid's chore raise the mood?"

**An adult completed it.** Only child completions feed the mood. Dad doing dishes
warms hearts, not fish.

**The chore doesn't feed the aquarium.** Chores can be flagged
`feeds_aquarium = 0` in Setup; those never count.

**Only one kid has pitched in.** The participation ceiling caps the tank at
`peckish` until more kids join, no matter how many chores one kid does. Their
effort is visible (never below `peckish`), but the tank wants the whole crew.

**It's the first chore of the day.** The floor guarantees the mood won't *drop*,
but one chore alone maps to `hungry` — if decay was already at `peckish`, the
mood simply holds there. More chores (and more kids) move it up from there,
subject to the participation ceiling.

**Panic mode is on.** The tank stays `sad` until the countdown reaches zero
(3 chores from trigger). The banner tells you exactly how many are left.

**It's already at the ceiling.** During an "everything good" window the mood is
pinned at `happy`, so chores bank food and story progress but can't raise a mood
that's maxed.

**Timezone surprise.** "Today" is Pacific time (`America/Los_Angeles`,
hardcoded). A chore at 11:30 PM Central lands on the Pacific calendar day —
usually the same day, but late-night edge cases can differ from your wall clock.

**The mood updates on the next read.** Mood is computed when the aquarium is
fetched, so a stale screen may need a refresh to show the new state.
