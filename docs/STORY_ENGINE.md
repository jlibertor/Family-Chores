# Story Engine — Design & Architecture

Durable reference for the Family Chores "story" / comic feature: its purpose,
narrative design, mechanics, data model, and implementation. For the current
actionable tasks (e.g. applying migrations), see
[`handoff/open/story_engine_handoff.md`](handoff/open/story_engine_handoff.md).

---

## 1. Purpose & vision

Family Chores is a lightweight household chore tracker (React + Vite frontend,
Cloudflare Worker API, Cloudflare D1 database). It already has an **aquarium**: a
shared tank of fish that hatch from eggs as the household completes chores, with a
mood that warms or cools based on participation.

The **story engine** layers an *ambient, story-telling experience* on top of the
chores — inspired by **Johnny Castaway** (the 1992 "world's first story-telling
screensaver"). The goal: turn chore completion into the fuel that advances an ongoing
story, so kids do chores **to find out what happens next**.

Two layers of storytelling, by design:

- **Episodes / gags** — small, frequent, funny beats (the daily delight).
- **A long arc** — a serialized plot with characters, relationships, stakes, and a
  payoff, so people stay invested across weeks/months (the retention engine).

### The framing that makes it cheap to produce (IMPORTANT)

The fish are **bored, and they stage plays in their own tank.** Consequences:

- The **tank never changes** — same reef, same cast. We never redraw the set.
- Each story just adds **inexplicable props** that "appear" in the tank (a tiny
  Eiffel Tower, a toy plane, a treasure chest) plus restyled mood/lighting and
  dialogue. Scene changes = props + caption + dialogue. No animation required.
- The presentation is a **static, dialogue-driven comic panel** (visual-novel
  style): fixed character slots, speech bubbles, a narration caption, a prop line.

This is why new stories are nearly free to add: the engine is fixed and each
**season is pure data** (one migration). See
[Content-pack architecture](#5-content-pack-architecture).

---

## 2. The core mechanic: two clocks

The heart of the engine; must be preserved.

- **Global release frontier (calendar clock).** Each scene has a
  `release_offset_days`. A scene is "released" once that many days have passed since
  the series `start_date`. Nobody can read past the released frontier, so the story
  **cannot be binged**; it paces out over real time like a TV season.
- **Per-member playback pointer (chore clock).** Each member has an
  `unlocked_index`. **Every chore a member completes advances their pointer by one
  scene**, capped at the released frontier. Members can fall **behind** (skipped
  chores) and **catch up** (do several chores), but can **never run ahead** of the
  release frontier.

Net effect: the story only moves forward, paced sustainably, and **doing chores is
the only way to keep up** — manufacturing the intended social/FOMO moment ("wait,
what happened in scene 5?" → "do your chore and find out"). Everyone starts with scene
1 visible (`unlocked_index` defaults to 1); the first chore unlocks scene 2.

**Release pacing is "faster early, then slow"** per the user's preference: daily for
the first week, then every other day. Formula used (1-indexed scene `n`):

```
release_offset_days(n) = (n - 1)            if n <= 7      # days 0..6, one per day
                       = 6 + (n - 7) * 2    if n >= 8      # then every 2 days
```

---

## 3. Narrative design: seasons, episodes, beats

- **Beat** — one line of dialogue / one gag (a speech bubble).
- **Scene** — a single comic panel: a setting, an optional prop, narration, and an
  ordered list of beats. The unit that gets released + unlocked.
- **Season (series)** — an ordered set of scenes telling one story.
- **Series arc** — for long-form seasons, a multi-act structure with a payoff.

Each story is a homage with **serial numbers filed off** (reef-native names, not the
source IP) — safer to ship and more charming. Source referenced in parentheses for
shared understanding.

### The cast (reused across all seasons)

The seven aquarium species are the repertory company:

| Species (id) | Name | Archetype |
|---|---|---|
| `clownfish` | Pip | Anxious striver / everyman lead |
| `seahorse` | Coral | Dreamer / romantic (the seahorse broods the eggs — biology gift) |
| `angelfish` | Bianca | The diva; glamorous, scheming |
| `crab` | Mr. Pinch | Gruff curmudgeon; walks sideways; claws = "skills" |
| `pufferfish` | Otto | Comic relief; inflates under stress; secretly shrewd |
| `starfish` | Stella | Zen wise-fool / prophet; barely moves, knows everything |
| `clam` | The Clam | The enigma; stays shut; the long-mystery / twist vessel |

Plus the **bugs** (from the existing "Bug Box" earned-bug system) as the **outcasts /
wildlings**, and **non-species speakers** (e.g. a `stranger`) which render as a dark
**silhouette** (no portrait), used for villains/extras.

---

## 4. The seasons

### Season 1 — "Reef of Thrones" (mini *Game of Thrones*) — DRAFT / parked

`status = 'draft'` (a 5-scene prologue stub exists in migration `0025`). This is the
**long-arc flagship**. Full design intent:

- **Three acts:**
  1. **The Coral Throne** — fish houses squabble over an empty throne; an Act-1 shock
     death (the Ned Stark beheading analog); the bugs are only rumored.
  2. **Beyond the Reef** — the **bugs (wildlings/Free Folk)** cross over and become the
     antagonist; a "Red Wedding"-style betrayal; a forbidden fish↔bug romance
     foreshadows the eventual alliance.
  3. **The Long Cold** — fish and bugs must unite against the existential scourge.

- **The scourge: the "Hollow Tide," led by the "Pale Current"** (the Night King /
  White Walkers). It **advances when the household neglects chores and retreats when
  they don't** — wired conceptually to the existing aquarium mood engine
  (cold/grey = gains; warm = pushed back). Neglect = existential stakes; the strongest
  motivation hook in the design.

- **House mapping:** Pip/clownfish = House Anemone (Stark, frontier wardens);
  Bianca/angelfish = House Goldscale (Lannister); Coral/seahorse = House Tideborn
  (Targaryen, the prophesied egg-bearer); Otto/pufferfish = the Tyrion; Mr.
  Pinch/crab = the grizzled border lord (the Wall/Night's Watch); Stella/starfish =
  the prophet (Melisandre / Three-Eyed Raven); **the Clam = the great secret /
  twist**, opening a crack once per season and fully only at the finale.

- **Prophecy + born leader:** Stella speaks a prophecy in fragments. A grey "stone egg
  no fish laid" (Daenerys's petrified dragon eggs) hatches **only at the darkest
  moment when the household rallies** (a big collective chore push) into a new,
  luminous species — **"the Lumen"** (light/warmth reborn = engagement). Mechanically,
  the reward for the household saving itself.

- **OPEN DESIGN DECISIONS (needed before writing the full season):**
  1. **Death intensity** — gentle-but-real ("drifts to the Deep," memorialized via the
     existing bug-obituary system) vs. softer (always rescuable). Young kids watch.
  2. **Ending vs. evergreen** — a true finale ("The End") vs. a reset into a new age.

### Season 2 — "Taken" (homage to the film) — ACTIVE (the pilot)

Short and self-contained — ideal for testing the engine. Built in migration `0026` as
**24 scenes**, `status = 'active'` (so it is the series the `/story` page and the
scene-stepper show).

**Cast mapping:** Mr. Pinch (crab) = the retired-operative dad; Coral (seahorse) = the
daughter; Bianca (angelfish) = the friend who proposes the trip; Otto (pufferfish) =
the dad's old contact; Stella (starfish) = the clue-reader; **the bugs / a `stranger`
silhouette** = the trafficker gang; **the Clam** = the kingpin buyer.

| # | Title | Prop that "appears" | Beat summary |
|---|---|---|---|
| 1 | The Bored Tank | (none) | Pinch overprotective; Coral wants to see the world |
| 2 | A Plan Hatches | a tiny suitcase | Bianca proposes going abroad |
| 3 | One Rule | the toy phone | Pinch agrees: call me the second you land |
| 4 | In Transit | a toy airplane | The journey begins |
| 5 | The Bright City | a tiny Eiffel Tower | They arrive; Coral calls home |
| 6 | Watched | the light dims | A stranger marks them |
| 7 | Bad Feeling | a cracked porthole | Bianca dismisses Coral's worry |
| 8 | The Taking | shadows pour in | The gang grabs Bianca |
| 9 | The Call | the phone, ringing | Coral hides, calls Pinch |
| 10 | A Specific Set of Skills | a beam of light on the phone | The famous speech |
| 11 | Too Late | bubbles where she stood | "I will find you." |
| 12 | The Hunt Begins | water goes cold and grey | Pinch resolves to go |
| 13 | Crossing Over | the toy plane, reversed | Pinch travels to the city |
| 14 | An Old Friend | a tattered map | Otto offers help |
| 15 | Reading the Tide | a glowing clue | Stella reads the trail |
| 16 | Into the Den | stacked crates | Pinch infiltrates the gang |
| 17 | A Name | a cloud of sand | He extracts: "The Clam." |
| 18 | The Chase | motion streaks | Chase through the reef |
| 19 | Empty Crate | an open, empty crate | Finds Bianca; Coral was moved |
| 20 | The Trail Ends | an ornate throne-shell | Trail leads to the buyer |
| 21 | The Kingpin | the Clam, vast and silent | The confrontation |
| 22 | The Rescue | the tank shudders | Pinch reaches Coral |
| 23 | Reunited | warm light floods back | Father and daughter reunite |
| 24 | Curtain Call | props fade away | Tank is just a tank; cast already bored |

The "specific set of skills" speech is scene 10. The final scene closes the framing
loop (bored fish, empty tank, "what do we perform next?").

---

## 5. Content-pack architecture

The **engine is fixed; each season is data.** To add a season ("Friends," another
film, etc.) write **one migration** with:

1. An `INSERT` into `story_series` (slug, title, total_scenes, start_date, status).
2. `INSERT`s into `story_scenes` (one row per scene, with the `script` JSON).
3. Optionally flip the previously-active series to `status='draft'` and the new one to
   `'active'` (only one active series shows; the engine picks
   `WHERE status='active' ORDER BY id LIMIT 1`).

No application code changes are needed for new seasons. Non-species speakers render as
silhouettes automatically, so villains/extras need no new art.

### Scene `script` JSON schema

```jsonc
{
  "narration": "Optional caption shown above the dialogue.",
  "prop": "Optional sentence describing the inexplicable prop.",
  "beats": [
    {
      "speaker": "crab",          // one of the 7 species ids, OR any other string -> silhouette
      "name": "Mr. Pinch",        // display name
      "position": "left",         // 'left' | 'center' | 'right' (fixed stage slot)
      "expression": "hungry",     // AquariumMood: happy|content|peckish|hungry|very_hungry|sad (drives the face)
      "line": "I have a very specific set of skills."
    }
  ]
}
```

`expression` reuses the aquarium mood faces, so emotions render on existing fish art
with no new assets.

---

## 6. Technical implementation

### Data model (migration `0025_story_engine.sql`)

- **`story_series`** — `id, slug (unique), title, total_scenes, start_date,
  status ('active'|'draft'|'complete'), created_at, updated_at`.
- **`story_scenes`** — `id, series_id (FK), scene_order, release_offset_days, title,
  setting, script (TEXT = JSON), created_at`; unique `(series_id, scene_order)`.
- **`story_progress`** — `member_id, series_id, unlocked_index (default 1),
  last_unlocked_at`; PK `(member_id, series_id)`.

### Worker (`worker/src/index.ts`, `// ---- Story engine` section)

- Helpers: `getActiveStorySeries`, `getStorySceneRows`, `getMemberUnlockedIndex`,
  `parseSceneScript`, `countReleasedScenes`, `daysBetween`, `addDaysToDate`.
- **`getStoryForMember(db, memberId)`** — gated player payload `{ series, releasedCount,
  accessibleCount, totalScenes, nextReleaseDate, canUnlockMore, scenes[] }`;
  `accessibleCount = min(releasedCount, max(unlocked, 1))`.
- **`unlockNextStoryScene(db, memberId)`** — called in `recordCompletion` on every
  completion (wrapped in `.catch`, non-fatal); bumps `unlocked_index` by 1 capped at
  `releasedCount` via `INSERT ... ON CONFLICT` upsert.
- **`getAllStoryScenes(db, slug)`** — UNGATED; all scenes for a series (active by
  default, or `?slug=`). Powers the scene-stepper / storyboard preview.
- Endpoints: `GET /api/story?memberId=` (gated), `GET /api/story/scenes[?slug=]`
  (ungated), and the unlock hook inside `POST /api/completions` (response includes
  `storyUnlock`).

### Frontend (`frontend/src/components/story/`)

- **`ComicView.tsx`** exports `ComicScene` (the shared presentational panel — heading,
  prop line, fixed character slots reusing the now-`export`ed `CreatureArt`, narration,
  dialogue bubbles, silhouette fallback) and `ComicView` (the `/story` player; also
  supports a storyboard `previewMode`). Exported types: `StoryScene`, `StoryBeat`,
  `SceneScript`, `StoryData`, `BeatPosition`.
- **`SceneStepper.tsx`** — the hidden test tool: fetches `/api/story/scenes`, renders
  `ComicScene`, Prev/Next + range slider + **← / →** keys. Reached from the **Setup**
  screen (`🎬 Scene Stepper (test)`), gated by `canAccessSetup`.
- **`App.tsx`** — routes `/story` and `/scene-stepper`, the Story nav button, render
  blocks, and the Setup entry button. Dev: Vite proxies `/api` →
  `http://127.0.0.1:8787` (`frontend/vite.config.ts`).
- **`App.css`** — `.comic-*`, `.comic-prop`, `.comic-silhouette`, `.scene-stepper*`.

### Migrations

- `database/migrations/0025_story_engine.sql` — the 3 tables + a 5-scene "Reef of
  Thrones" stub.
- `database/migrations/0026_taken_season.sql` — Reef → `draft`; "Taken" → `active`
  with all 24 scenes.

---

## 7. Status & next steps

- **Built and typechecking clean** (worker + frontend, 0 errors).
- **Blocker:** migrations `0025`/`0026` not yet applied — see the actionable ticket at
  [`handoff/open/story_engine_handoff.md`](handoff/open/story_engine_handoff.md).
- **Backlog:** write "Reef of Thrones" in full (after the two open design decisions);
  optional inline-SVG props; more seasons (one migration each); deeper chore tie-ins
  (feature the completing child, scourge-on-neglect, hatch the "Lumen" on a rally);
  holiday easter eggs (date-keyed prop/dialogue overrides).
