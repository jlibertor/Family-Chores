# Testing

Run the normal checks from the repository root:

```bash
npm run build
npm run lint
npm --workspace frontend test
```

For API smoke checks, start the local Worker, apply migrations when necessary, and run:

```bash
npm run dev:worker
npx wrangler d1 migrations apply family-chores --local --config worker/wrangler.toml
npm run smoke
```

The smoke script verifies public household data, parent PIN protection, setup mutations, a completion submitted without login/session metadata, the aquarium response, and recent history. It writes disposable test rows, so use a local or disposable database when a clean history matters.

Manual acceptance focuses on the shared happy path:

1. `/aquarium` loads without choosing a device mode or person.
2. **Record chore** opens `/record` and asks who finished it.
3. Selecting a person shows that person's relevant chores.
4. Confirming returns to the aquarium and shows the completion reaction.
5. **Parent** always shows the PIN gate until successfully unlocked.
6. Reports are unavailable before PIN unlock and show participation after unlock.
7. Retired URLs such as `/choose-mode`, `/member`, `/kiosk`, and `/history` fall back to the aquarium.

For aquarium mood QA, enable **Test mode** in Parent setup. The aquarium then shows controls for feeding, a hook drop, and the mood-appropriate mystery event. A test-only `tankMood` query parameter can preview any whole-tank state without changing household data, for example `/aquarium?tankMood=happy` or `/aquarium?tankMood=sad`. The override is ignored whenever Test mode is off.

For tank-tap QA, tap the same area six times at a relaxed one-to-two-second
rhythm. The first response should be a small flinch, the second a cautious
approach, and later taps should gather the fish progressively closer without an
alternating flee/return pattern. Pause for a few seconds and tap again; the fish
should retain some familiarity. Repeat in `happy` and `sad` previews to confirm
that mood changes response speed without changing the curiosity progression.
