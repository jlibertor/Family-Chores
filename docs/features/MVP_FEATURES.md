# Product scope

Last verified against the code: **2026-07-13**.

## Primary experience

Family Chores is an ambient shared aquarium with one short interaction:

1. View the aquarium.
2. Record who completed a chore and which chore they completed.
3. See the aquarium respond.

The household does not log in. The app does not have kiosk mode versus member mode; shared use is the product.

## Parent experience

The parent PIN unlocks one parent area containing:

- recent chore activity and 1-, 7-, and 30-day participation reports
- family member management
- chore creation, assignment, recurrence, and activation
- aquarium tuning and test settings
- household export and other operational setup

The PIN protects parent actions, not ordinary chore recording.

## Product constraints

- One household
- One shared display workflow
- Mobile/tablet-friendly controls, optimized for the mounted household screen
- Automatic return to the aquarium after inactivity
- No personal logins, remembered identities, device mode selection, or logout
- No allowance system, billing, OAuth, or multi-household administration

Aquarium mood drives the entire ambient tank, not just a status label: lighting,
sparkle or murk, swimming speed and responsiveness, happy or distressed sounds,
automatic hook frequency and danger, and short mood-appropriate mystery events.
The six states run from a dark, sluggish `sad`/panic tank to a literal-sparkle,
fast and joyful `happy` tank.

Aquarium creatures, rewards, mood, and stories may enrich the tank, but they
should not add competing top-level workflows. Mystery events happen inside the
tank and require no navigation. New work should make the aquarium → record →
reaction loop better or help a parent understand and configure that loop.
