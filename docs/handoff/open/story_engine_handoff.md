# Handoff — Story Engine: apply migrations & next build

> **Design/architecture reference:** [`docs/features/STORY_ENGINE.md`](../../features/STORY_ENGINE.md)
> (story bible, two-clock mechanic, data model, full Taken/Reef detail). This file is
> only the **actionable** work. Move it to `completed/` once the migrations below are
> applied and verified.

## State

The story engine + two seasons are built and **typecheck clean** (worker + frontend,
0 errors). "Taken" (24 scenes) is the active series; "Reef of Thrones" is a parked
draft. The only thing blocking the feature from running is the database migration.

## 1. Apply the migrations (the blocker)

`/api/story*` throws "no such table" until `0025` + `0026` are applied (symptom in the
UI: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`).

Local:

```
npx wrangler d1 migrations apply family-chores --local --config worker/wrangler.toml
```

Production (on deploy):

```
npx wrangler d1 migrations apply family-chores --remote --config worker/wrangler.toml
```

Then reload — no dev-server restart needed (same DB). Verify: the `/story` page and
**Setup → 🎬 Scene Stepper** load all 24 Taken scenes.

> The agent that built this could not run wrangler itself (its sandbox was Linux but
> the repo's `node_modules` holds the Windows `workerd` binary; the running dev server
> also held the local SQLite locked). An agent on the user's own machine just runs the
> command above.

## 2. Next build work

- **Write "Reef of Thrones" in full** — needs the two open design decisions from the
  user first (see `docs/features/STORY_ENGINE.md` §4): death intensity, and ending vs.
  evergreen. Then author it as one migration (content-pack model).
- Optional: inline-SVG props; more seasons; deeper chore tie-ins; holiday easter eggs
  (backlog in `docs/features/STORY_ENGINE.md` §7).

## 3. Cautions for whoever edits next

- **CRLF + large files.** The repo's source uses CRLF. A line-based edit tool
  previously **truncated** `worker/src/index.ts`, `App.tsx`, and `AquariumView.tsx`
  mid-file. They were recovered and typecheck clean, but prefer **byte-safe / full-file
  writes** over fragile line edits, and re-run `tsc` after.
- **Possible lost art (verify with user).** During recovery, the truncated tail of
  `AquariumView.tsx` (`Crab`/`Pufferfish`/`Starfish`/`Clam` SVGs) was restored from the
  last commit and `Clam` was rebuilt from scratch. The user had **redrawn the Seahorse**
  (uncommitted), so they may have had custom Pufferfish/Starfish/Clam art that reverted.
  Recommend restoring `AquariumView.tsx` from VS Code **Timeline / Local History**, then
  re-applying the one-line `export function CreatureArt`.
- **Verify:** `cd worker && npx tsc --noEmit`; `cd frontend && npx tsc --noEmit -p
  tsconfig.app.json`; dry-run every `database/migrations/*.sql` into a throwaway SQLite.
