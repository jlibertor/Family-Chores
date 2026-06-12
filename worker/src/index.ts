interface Env {
  DB: D1Database;
  PARENT_PIN?: string;
}

type SessionMode = "member" | "kiosk" | "admin";
type MemberType = "adult" | "child";
type FrequencyType = "daily" | "weekdays" | "weekends" | "weekly" | "monthly" | "as_needed";
type AssignmentMode = "household_anyone" | "assigned_individual" | "per_person";
type AquariumMood = "happy" | "content" | "hungry" | "very_hungry" | "sad";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Parent-Pin",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

const json = (body: unknown, init: ResponseInit = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init.headers,
    },
  });

const badRequest = (message: string) => json({ ok: false, error: message }, { status: 400 });
const unauthorized = () => json({ ok: false, error: "Parent PIN is required." }, { status: 401 });

const readJson = async (request: Request) => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const asPositiveInteger = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
};

const asInteger = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : fallback;
};

const asActiveFlag = (value: unknown, fallback = 1) => {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return fallback;
};

const asPositiveIntegerList = (value: unknown) =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => asPositiveInteger(item)).filter((item): item is number => item !== null))]
    : [];

const isSessionMode = (value: unknown): value is SessionMode =>
  value === "member" || value === "kiosk" || value === "admin";

const isMemberType = (value: unknown): value is MemberType => value === "adult" || value === "child";

const isFrequencyType = (value: unknown): value is FrequencyType =>
  value === "daily" ||
  value === "weekdays" ||
  value === "weekends" ||
  value === "weekly" ||
  value === "monthly" ||
  value === "as_needed";

const isAssignmentMode = (value: unknown): value is AssignmentMode =>
  value === "household_anyone" || value === "assigned_individual" || value === "per_person";

const requireParentPin = (request: Request, env: Env) => {
  const expectedPin = env.PARENT_PIN ?? "1234";
  return request.headers.get("X-Parent-Pin") === expectedPin;
};

const avatarIds = new Set([
  "boston-terrier",
  "black-cat",
  "white-bunny",
  "goldfish",
  "slime-green",
  "star-face",
  "crab",
  "rock-creature",
  "duck",
  "bat",
  "fox",
  "bee",
  "frog-wizard",
  "taco-face",
  "mushroom-person",
  "axolotl",
]);

const bugIds = [
  "blue-orb-bug",
  "red-scallop-bug",
  "yellow-triangle-bug",
  "starfish-bug",
  "blue-noodle-bug",
  "black-spike-bug",
  "blue-map-bug",
  "bubble-cluster-bug",
  "green-giggle-bug",
  "purple-fuzz-bug",
  "orange-beetle-bug",
  "pink-doodle-bug",
  "teal-goober-bug",
  "gold-speckle-bug",
  "red-wheel-bug",
  "tiny-wing-bug",
  "moon-blob-bug",
  "three-eye-bug",
  "long-leg-bug",
  "squiggle-shell-bug",
  "round-eye-bug",
  "jelly-dot-bug",
  "spotted-heart-bug",
  "tiny-horn-bug",
];

const aquariumSpeciesIds = ["clownfish", "angelfish", "seahorse", "crab", "pufferfish", "starfish"];

const publicMemberNameSql = (alias: string) => `COALESCE(NULLIF(TRIM(${alias}.nickname), ''), ${alias}.display_name)`;

const chooseRandomBugId = () => bugIds[crypto.getRandomValues(new Uint32Array(1))[0] % bugIds.length];
const chooseRandomAquariumSpeciesId = () =>
  aquariumSpeciesIds[crypto.getRandomValues(new Uint32Array(1))[0] % aquariumSpeciesIds.length];

const getActiveMember = (db: D1Database, id: number) =>
  db
    .prepare("SELECT id, display_name, nickname, avatar_id, member_type FROM family_members WHERE id = ? AND active = 1")
    .bind(id)
    .first<{ id: number; display_name: string; nickname: string | null; avatar_id: string | null; member_type: MemberType }>();

const getActiveChore = (db: D1Database, id: number) =>
  db
    .prepare("SELECT id, name, assignment_mode, COALESCE(feeds_aquarium, 1) AS feeds_aquarium FROM chores WHERE id = ? AND active = 1")
    .bind(id)
    .first<{ id: number; name: string; assignment_mode: AssignmentMode; feeds_aquarium: number }>();

type AquariumStateRow = {
  id: number;
  food_reserve: number;
  starting_food_reserve: number;
  max_food_reserve: number;
  daily_food_consumption: number;
  last_consumed_on: string;
  total_chore_completions: number;
  creature_unlock_interval: number;
  egg_incubation_minutes: number;
  growth_days: number;
  last_fed_at: string | null;
};

const aquariumMoodMessages: Record<AquariumMood, string> = {
  happy: "The aquarium is thriving. The fish were fed recently!",
  content: "Everyone is doing well, but the fish will be hungry soon.",
  hungry: "No one has fed the fish today. They are getting hungry.",
  very_hungry: "The fish are crying. No chores were done yesterday!",
  sad: "The fish are heartbroken. They have been ignored for days.",
};

// Mood is driven by how recently a chore fed the tank, so skipped days show
// up the very next morning instead of slowly draining a banked reserve.
const aquariumMoodHours = {
  happy: 10,
  content: 20,
  hungry: 32,
  very_hungry: 44,
} as const;

function hoursSinceAquariumFed(state: AquariumStateRow): number {
  if (!state.last_fed_at) return 999;
  const fedMs = Date.parse(`${state.last_fed_at.replace(" ", "T")}Z`);
  if (Number.isNaN(fedMs)) return 999;
  return Math.max(0, (Date.now() - fedMs) / 3_600_000);
}

function getAquariumMood(state: AquariumStateRow): AquariumMood {
  const hours = hoursSinceAquariumFed(state);
  let mood: AquariumMood;
  if (hours <= aquariumMoodHours.happy) mood = "happy";
  else if (hours <= aquariumMoodHours.content) mood = "content";
  else if (hours <= aquariumMoodHours.hungry) mood = "hungry";
  else if (hours <= aquariumMoodHours.very_hungry) mood = "very_hungry";
  else mood = "sad";

  // An empty food reserve still drags a recently fed tank down.
  if (state.food_reserve <= 0 && (mood === "happy" || mood === "content")) {
    mood = "hungry";
  }

  return mood;
}

async function ensureAquarium(db: D1Database) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO aquarium_state
        (id, food_reserve, max_food_reserve, daily_food_consumption, last_consumed_on, total_chore_completions, creature_unlock_interval, growth_days, last_fed_at)
       VALUES
        (1, 14, 30, 2, date('now'), COALESCE((SELECT COUNT(*) FROM chore_completions), 0), 25, 7, datetime('now'))`,
    )
    .run();

  await db
    .prepare(
      `INSERT OR IGNORE INTO aquarium_creatures
        (id, species_id, growth_stage)
       VALUES
        (1, 'clownfish', 'baby')`,
    )
    .run();
}

async function applyAquariumMaintenance(db: D1Database) {
  await ensureAquarium(db);

  await db
    .prepare(
      `UPDATE aquarium_state
       SET food_reserve = MAX(
            0,
            food_reserve - CAST(MAX(0, julianday(date('now')) - julianday(last_consumed_on)) AS INTEGER) * daily_food_consumption
          ),
          last_consumed_on = date('now'),
          updated_at = datetime('now')
       WHERE id = 1
        AND last_consumed_on < date('now')`,
    )
    .run();

  await db
    .prepare(
      `UPDATE aquarium_creatures
       SET growth_stage = 'adult',
           updated_at = datetime('now')
       WHERE growth_stage = 'baby'
        AND julianday('now') - julianday(created_at) >= (SELECT growth_days FROM aquarium_state WHERE id = 1)
        AND (SELECT food_reserve * 1.0 / max_food_reserve FROM aquarium_state WHERE id = 1) >= 0.4`,
    )
    .run();

  const pendingEggs = await db
    .prepare(
      `SELECT id, species_id
       FROM aquarium_eggs
       WHERE hatched_at IS NULL
        AND datetime(hatch_after) <= datetime('now')
       ORDER BY hatch_after, id
       LIMIT 10`,
    )
    .all<{ id: number; species_id: string }>();

  for (const egg of pendingEggs.results) {
    const creatureResult = await db
      .prepare(
        `INSERT INTO aquarium_creatures (species_id, growth_stage)
         VALUES (?, 'baby')`,
      )
      .bind(egg.species_id)
      .run();

    const creatureId = Number(creatureResult.meta.last_row_id);
    const speciesName = aquariumSpeciesName(egg.species_id);
    await db.batch([
      db
        .prepare(
          `UPDATE aquarium_eggs
           SET hatched_at = datetime('now'),
               creature_id = ?,
               updated_at = datetime('now')
           WHERE id = ?`,
        )
        .bind(creatureId, egg.id),
      db
        .prepare(
          `INSERT INTO aquarium_events (event_type, message, creature_id)
           VALUES ('hatched', ?, ?)`,
        )
        .bind(`A baby ${speciesName} joined the aquarium!`, creatureId),
    ]);
  }
}

async function getAquariumState(db: D1Database) {
  await applyAquariumMaintenance(db);

  const state = await db
    .prepare(
      `SELECT
        id,
        food_reserve,
        starting_food_reserve,
        max_food_reserve,
        daily_food_consumption,
        last_consumed_on,
        total_chore_completions,
        creature_unlock_interval,
        egg_incubation_minutes,
        growth_days,
        last_fed_at
       FROM aquarium_state
       WHERE id = 1`,
    )
    .first<AquariumStateRow>();

  if (!state) {
    throw new Error("Aquarium state was not initialized.");
  }

  return state;
}

async function listAquarium(db: D1Database) {
  const state = await getAquariumState(db);
  const mood = getAquariumMood(state);

  const [creatures, eggs, events, todayLeaderboard, yesterdayLeaderboard, allTimeLeaderboard, yesterdayCompletions] = await Promise.all([
    db
      .prepare(
        `SELECT id, species_id, growth_stage, created_at, updated_at
         FROM aquarium_creatures
         ORDER BY created_at, id`,
      )
      .all(),
    db
      .prepare(
        `SELECT id, species_id, laid_at, hatch_after, hatched_at, creature_id, completion_id, created_at, updated_at
         FROM aquarium_eggs
         WHERE hatched_at IS NULL
         ORDER BY hatch_after, id
         LIMIT 5`,
      )
      .all(),
    db
      .prepare(
        `SELECT id, event_type, message, member_name, completion_id, creature_id, created_at
         FROM aquarium_events
         ORDER BY id DESC
         LIMIT 10`,
      )
      .all(),
    db
      .prepare(
        `SELECT
          fm.id AS member_id,
          ${publicMemberNameSql("fm")} AS member_name,
          fm.avatar_id AS member_avatar_id,
          COUNT(cc.id) AS completed_count
         FROM family_members fm
         LEFT JOIN chore_completions cc
          ON cc.completed_by_member_id = fm.id
          AND date(cc.completed_at, 'localtime') = date('now', 'localtime')
         WHERE fm.active = 1
         GROUP BY fm.id
         ORDER BY completed_count DESC, fm.sort_order, member_name`,
      )
      .all(),
    db
      .prepare(
        `SELECT
          fm.id AS member_id,
          ${publicMemberNameSql("fm")} AS member_name,
          fm.avatar_id AS member_avatar_id,
          COUNT(cc.id) AS completed_count
         FROM family_members fm
         LEFT JOIN chore_completions cc
          ON cc.completed_by_member_id = fm.id
          AND date(cc.completed_at, 'localtime') = date('now', 'localtime', '-1 day')
         WHERE fm.active = 1
         GROUP BY fm.id
         ORDER BY completed_count DESC, fm.sort_order, member_name`,
      )
      .all(),
    db
      .prepare(
        `SELECT
          fm.id AS member_id,
          ${publicMemberNameSql("fm")} AS member_name,
          fm.avatar_id AS member_avatar_id,
          COUNT(cc.id) AS completed_count
         FROM family_members fm
         LEFT JOIN chore_completions cc
          ON cc.completed_by_member_id = fm.id
         WHERE fm.active = 1
         GROUP BY fm.id
         ORDER BY completed_count DESC, fm.sort_order, member_name`,
      )
      .all(),
    db
      .prepare(
        `SELECT
          cc.id,
          ${publicMemberNameSql("fm")} AS member_name,
          c.name AS chore_name,
          cc.completed_at
         FROM chore_completions cc
         JOIN family_members fm ON fm.id = cc.completed_by_member_id
         JOIN chores c ON c.id = cc.chore_id
         WHERE date(cc.completed_at, 'localtime') = date('now', 'localtime', '-1 day')
         ORDER BY cc.completed_at`,
      )
      .all(),
  ]);

  return json({
    ok: true,
    aquarium: {
      state: {
        ...state,
        mood,
        mood_message: aquariumMoodMessages[mood],
        hours_since_fed: Math.round(hoursSinceAquariumFed(state)),
      },
      creatures: creatures.results,
      eggs: eggs.results,
      events: events.results,
      leaderboard: {
        today: todayLeaderboard.results,
        yesterday: yesterdayLeaderboard.results,
        allTime: allTimeLeaderboard.results,
      },
      yesterdayCompletions: yesterdayCompletions.results,
    },
  });
}

async function addAquariumFoodForCompletion(
  db: D1Database,
  completionId: number,
  memberName: string,
) {
  await applyAquariumMaintenance(db);

  await db
    .prepare(
      `UPDATE aquarium_state
       SET food_reserve = MIN(max_food_reserve, food_reserve + 1),
           total_chore_completions = total_chore_completions + 1,
           last_fed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = 1`,
    )
    .run();

  const fedMessage = `${memberName} fed the aquarium!`;
  await db
    .prepare(
      `INSERT INTO aquarium_events (event_type, message, member_name, completion_id)
       VALUES ('fed', ?, ?, ?)`,
    )
    .bind(fedMessage, memberName, completionId)
    .run();

  const state = await getAquariumState(db);
  let egg: Record<string, unknown> | null = null;

  if (state.total_chore_completions > 0 && state.total_chore_completions % state.creature_unlock_interval === 0) {
    const speciesId = chooseRandomAquariumSpeciesId();
    const eggResult = await db
      .prepare(
        `INSERT INTO aquarium_eggs (species_id, hatch_after, completion_id)
         VALUES (?, datetime('now', ?), ?)`,
      )
      .bind(speciesId, `+${state.egg_incubation_minutes} minutes`, completionId)
      .run();

    egg = await db
      .prepare(
        `SELECT id, species_id, laid_at, hatch_after, hatched_at, creature_id, completion_id, created_at, updated_at
         FROM aquarium_eggs
         WHERE id = ?`,
      )
      .bind(eggResult.meta.last_row_id)
      .first();
  }

  return {
    fedMessage,
    state: {
      ...state,
      mood: getAquariumMood(state),
      mood_message: aquariumMoodMessages[getAquariumMood(state)],
    },
    egg,
  };
}

function aquariumSpeciesName(speciesId: string) {
  if (speciesId === "clownfish") return "clownfish";
  if (speciesId === "angelfish") return "angelfish";
  if (speciesId === "seahorse") return "seahorse";
  if (speciesId === "crab") return "crab";
  if (speciesId === "pufferfish") return "pufferfish";
  if (speciesId === "starfish") return "starfish";
  return "aquarium friend";
}

async function getResponsibleMemberId(db: D1Database, choreId: number, memberId: number) {
  const chore = await getActiveChore(db, choreId);
  if (!chore) return { chore: null, responsibleMemberId: null };

  if (chore.assignment_mode === "household_anyone") {
    return { chore, responsibleMemberId: null };
  }

  const assignment = await db
    .prepare(
      `SELECT family_member_id
       FROM chore_assignments
       WHERE chore_id = ? AND family_member_id = ? AND active = 1`,
    )
    .bind(choreId, memberId)
    .first<{ family_member_id: number }>();

  return { chore, responsibleMemberId: assignment?.family_member_id ?? null };
}

async function createDeviceSession(
  db: D1Database,
  mode: SessionMode,
  memberId: number | null,
  deviceLabel: string | null,
) {
  const result = await db
    .prepare(
      `INSERT INTO device_sessions (mode, member_id, device_label, last_seen_at)
       VALUES (?, ?, ?, datetime('now'))`,
    )
    .bind(mode, memberId, deviceLabel)
    .run();

  return result.meta.last_row_id;
}

async function listMembers(db: D1Database, includeInactive = false) {
  const { results } = await db
    .prepare(
      `SELECT id, display_name, nickname, avatar_id, member_type, sort_order, active, created_at, updated_at
       FROM family_members
       ${includeInactive ? "" : "WHERE active = 1"}
       ORDER BY sort_order, display_name`,
    )
    .all();

  return json({ ok: true, members: results });
}

const choreSelect = `
  SELECT
    c.id,
    c.name,
    c.description,
    c.frequency_type,
    c.assignment_mode,
    c.assigned_member_id,
    ${publicMemberNameSql("assignee")} AS assigned_member_name,
    assignee.avatar_id AS assigned_member_avatar_id,
    c.alert_if_overdue,
    COALESCE(c.needs_reminder, 0) AS needs_reminder,
    COALESCE(c.feeds_aquarium, 1) AS feeds_aquarium,
    c.active,
    c.created_at,
    c.updated_at,
    obligations.responsible_member_id,
    ${publicMemberNameSql("responsible")} AS responsible_member_name,
    responsible.avatar_id AS responsible_member_avatar_id,
    lc.completed_at AS last_completed_at,
    ${publicMemberNameSql("fm")} AS last_completed_by,
    fm.avatar_id AS last_completed_by_avatar_id,
    CASE
      WHEN c.frequency_type = 'daily'
        THEN lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime')
      WHEN c.frequency_type = 'weekdays'
        THEN strftime('%w', 'now', 'localtime') BETWEEN '1' AND '5'
          AND (lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime'))
      WHEN c.frequency_type = 'weekends'
        THEN strftime('%w', 'now', 'localtime') IN ('0', '6')
          AND (lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime'))
      WHEN c.frequency_type = 'weekly'
        THEN lc.completed_at IS NULL OR strftime('%Y-%W', lc.completed_at, 'localtime') < strftime('%Y-%W', 'now', 'localtime')
      WHEN c.frequency_type = 'monthly'
        THEN lc.completed_at IS NULL OR strftime('%Y-%m', lc.completed_at, 'localtime') < strftime('%Y-%m', 'now', 'localtime')
      ELSE 0
    END AS is_due,
    CASE
      WHEN c.frequency_type IN ('daily', 'weekdays', 'weekends', 'weekly', 'monthly')
        AND c.alert_if_overdue = 1
        AND ((c.frequency_type = 'daily' AND (lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime')))
          OR (c.frequency_type = 'weekdays'
            AND strftime('%w', 'now', 'localtime') BETWEEN '1' AND '5'
            AND (lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime')))
          OR (c.frequency_type = 'weekends'
            AND strftime('%w', 'now', 'localtime') IN ('0', '6')
            AND (lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime')))
          OR (c.frequency_type = 'weekly' AND (lc.completed_at IS NULL OR strftime('%Y-%W', lc.completed_at, 'localtime') < strftime('%Y-%W', 'now', 'localtime')))
          OR (c.frequency_type = 'monthly' AND (lc.completed_at IS NULL OR strftime('%Y-%m', lc.completed_at, 'localtime') < strftime('%Y-%m', 'now', 'localtime'))))
      THEN 1
      ELSE 0
    END AS is_overdue
   FROM chores c
   JOIN (
    SELECT id AS chore_id, NULL AS responsible_member_id
    FROM chores
    WHERE assignment_mode = 'household_anyone'
    UNION ALL
    SELECT ca.chore_id, ca.family_member_id AS responsible_member_id
    FROM chore_assignments ca
    JOIN chores assigned_chore ON assigned_chore.id = ca.chore_id
    WHERE ca.active = 1
      AND assigned_chore.assignment_mode IN ('assigned_individual', 'per_person')
   ) obligations ON obligations.chore_id = c.id
   LEFT JOIN family_members assignee ON assignee.id = c.assigned_member_id
   LEFT JOIN family_members responsible ON responsible.id = obligations.responsible_member_id
   LEFT JOIN (
    SELECT chore_id, responsible_member_id, completed_by_member_id, MAX(completed_at) AS completed_at
    FROM chore_completions
    GROUP BY chore_id, responsible_member_id
   ) lc ON lc.chore_id = c.id
      AND (
        (obligations.responsible_member_id IS NULL AND lc.responsible_member_id IS NULL)
        OR lc.responsible_member_id = obligations.responsible_member_id
      )
   LEFT JOIN family_members fm ON fm.id = lc.completed_by_member_id
`;

async function listChores(db: D1Database, memberId: number | null = null) {
  const filters = ["c.active = 1"];
  const binds: number[] = [];

  if (memberId) {
    filters.push("(c.assignment_mode = 'household_anyone' OR obligations.responsible_member_id = ?)");
    binds.push(memberId);
  }

  const { results } = await db
    .prepare(
      `${choreSelect}
       WHERE ${filters.join(" AND ")}
       ORDER BY c.active DESC,
        CASE c.frequency_type
          WHEN 'daily' THEN 1
          WHEN 'weekdays' THEN 2
          WHEN 'weekends' THEN 3
          WHEN 'weekly' THEN 4
          WHEN 'monthly' THEN 5
          ELSE 6
        END,
        responsible.sort_order,
        c.name`,
    )
    .bind(...binds)
    .all();

  return json({ ok: true, chores: results });
}

async function listAdminChores(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.frequency_type,
        c.assignment_mode,
        c.assigned_member_id,
        legacy_assignee.display_name AS assigned_member_name,
        legacy_assignee.avatar_id AS assigned_member_avatar_id,
        c.alert_if_overdue,
        COALESCE(c.needs_reminder, 0) AS needs_reminder,
        COALESCE(c.feeds_aquarium, 1) AS feeds_aquarium,
        c.active,
        c.created_at,
        c.updated_at,
        GROUP_CONCAT(ca.family_member_id) AS assignment_member_ids,
        GROUP_CONCAT(fm.display_name) AS assignment_member_names,
        GROUP_CONCAT(fm.avatar_id) AS assignment_member_avatar_ids,
        NULL AS responsible_member_id,
        NULL AS responsible_member_name,
        NULL AS responsible_member_avatar_id,
        lc.completed_at AS last_completed_at,
        last_member.display_name AS last_completed_by,
        last_member.avatar_id AS last_completed_by_avatar_id,
        0 AS is_due,
        0 AS is_overdue
       FROM chores c
       LEFT JOIN family_members legacy_assignee ON legacy_assignee.id = c.assigned_member_id
       LEFT JOIN chore_assignments ca ON ca.chore_id = c.id AND ca.active = 1
       LEFT JOIN family_members fm ON fm.id = ca.family_member_id
       LEFT JOIN (
        SELECT chore_id, completed_by_member_id, MAX(completed_at) AS completed_at
        FROM chore_completions
        GROUP BY chore_id
       ) lc ON lc.chore_id = c.id
       LEFT JOIN family_members last_member ON last_member.id = lc.completed_by_member_id
       WHERE c.active = 1
       GROUP BY c.id
       ORDER BY
        CASE c.frequency_type
          WHEN 'daily' THEN 1
          WHEN 'weekdays' THEN 2
          WHEN 'weekends' THEN 3
          WHEN 'weekly' THEN 4
          WHEN 'monthly' THEN 5
          ELSE 6
        END,
        c.name`,
    )
    .all();

  return json({ ok: true, chores: results });
}

async function todayView(db: D1Database) {
  const choresResponse = await listChores(db);
  const choresBody = (await choresResponse.json()) as { chores: Array<Record<string, unknown>> };
  const chores = choresBody.chores;

  const { results: completedToday } = await db
    .prepare(
      `SELECT
        cc.id,
        ${publicMemberNameSql("fm")} AS member_name,
        fm.avatar_id AS member_avatar_id,
        ${publicMemberNameSql("responsible")} AS responsible_member_name,
        responsible.avatar_id AS responsible_member_avatar_id,
        c.name AS chore_name,
        cc.completed_at,
        ds.mode AS session_mode,
        ds.device_label
       FROM chore_completions cc
       JOIN family_members fm ON fm.id = cc.completed_by_member_id
       JOIN chores c ON c.id = cc.chore_id
       LEFT JOIN family_members responsible ON responsible.id = cc.responsible_member_id
       LEFT JOIN device_sessions ds ON ds.id = cc.device_session_id
       WHERE date(cc.completed_at, 'localtime') = date('now', 'localtime')
       ORDER BY cc.completed_at DESC
       LIMIT 30`,
    )
    .all();

  return json({
    ok: true,
    due: chores.filter((chore) => chore.is_due === 1 && chore.is_overdue !== 1),
    overdue: chores.filter((chore) => chore.is_overdue === 1),
    completedToday,
  });
}

async function householdStatus(db: D1Database) {
  const { results: weeklyRows } = await db
    .prepare(
      `SELECT
        fm.id AS member_id,
        ${publicMemberNameSql("fm")} AS member_name,
        fm.avatar_id AS member_avatar_id,
        COUNT(cc.id) AS completed_count,
        COALESCE(SUM(cc.points), COUNT(cc.id)) AS points
       FROM family_members fm
       LEFT JOIN chore_completions cc
        ON cc.completed_by_member_id = fm.id
        AND strftime('%Y-%W', cc.completed_at, 'localtime') = strftime('%Y-%W', 'now', 'localtime')
       WHERE fm.active = 1
       GROUP BY fm.id
       ORDER BY completed_count DESC, fm.sort_order`,
    )
    .all();

  const { results: reminderRows } = await db
    .prepare(
      `SELECT
        c.id,
        c.name,
        c.frequency_type,
        c.needs_reminder,
        c.alert_if_overdue,
        lc.completed_at AS last_completed_at,
        CAST(julianday('now') - julianday(lc.completed_at) AS INTEGER) AS days_since_completed,
        ${publicMemberNameSql("fm")} AS last_completed_by,
        fm.avatar_id AS last_completed_by_avatar_id,
        CASE
          WHEN c.frequency_type = 'daily'
            THEN lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime')
          WHEN c.frequency_type = 'weekdays'
            THEN strftime('%w', 'now', 'localtime') BETWEEN '1' AND '5'
              AND (lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime'))
          WHEN c.frequency_type = 'weekends'
            THEN strftime('%w', 'now', 'localtime') IN ('0', '6')
              AND (lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime'))
          WHEN c.frequency_type = 'weekly'
            THEN lc.completed_at IS NULL OR strftime('%Y-%W', lc.completed_at, 'localtime') < strftime('%Y-%W', 'now', 'localtime')
          WHEN c.frequency_type = 'monthly'
            THEN lc.completed_at IS NULL OR strftime('%Y-%m', lc.completed_at, 'localtime') < strftime('%Y-%m', 'now', 'localtime')
          ELSE 0
        END AS is_due
       FROM chores c
       LEFT JOIN (
        SELECT chore_id, completed_by_member_id, MAX(completed_at) AS completed_at
        FROM chore_completions
        GROUP BY chore_id
       ) lc ON lc.chore_id = c.id
       LEFT JOIN family_members fm ON fm.id = lc.completed_by_member_id
       WHERE c.active = 1
        AND (c.needs_reminder = 1 OR c.alert_if_overdue = 1)
       ORDER BY is_due DESC, c.name
       LIMIT 8`,
    )
    .all();

  const totalCompletedThisWeek = weeklyRows.reduce((total, row) => total + Number(row.completed_count ?? 0), 0);
  const mostActive = weeklyRows.find((row) => Number(row.completed_count ?? 0) > 0) ?? null;
  const suggestions = reminderRows
    .filter((row) => row.is_due === 1)
    .map((row) => ({
      chore_id: row.id,
      message: `${row.name} is due${
        row.last_completed_by
          ? `; last completed by ${row.last_completed_by}${
              Number(row.days_since_completed) > 0 ? ` ${row.days_since_completed} day(s) ago` : ""
            }`
          : ""
      }.`,
    }));

  return json({
    ok: true,
    weekly: {
      totalCompleted: totalCompletedThisWeek,
      byMember: weeklyRows,
      mostActive,
    },
    reminders: reminderRows,
    suggestions,
  });
}

async function recordCompletion(request: Request, db: D1Database) {
  const body = await readJson(request);
  const memberId = asPositiveInteger(body.memberId);
  const choreId = asPositiveInteger(body.choreId);
  const deviceSessionId = asPositiveInteger(body.deviceSessionId);
  const sessionMode = isSessionMode(body.sessionMode) ? body.sessionMode : "member";
  const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 80) : null;
  const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  const points = 1;

  if (!memberId || !choreId) {
    return badRequest("memberId and choreId are required.");
  }

  const [member, obligation] = await Promise.all([
    getActiveMember(db, memberId),
    getResponsibleMemberId(db, choreId, memberId),
  ]);

  if (!member) {
    return badRequest("Member was not found.");
  }

  if (!obligation.chore) {
    return badRequest("Chore was not found.");
  }

  if (obligation.chore.assignment_mode !== "household_anyone" && !obligation.responsibleMemberId) {
    return badRequest("That chore is not assigned to this member.");
  }

  const completionSessionId =
    deviceSessionId ?? (await createDeviceSession(db, sessionMode, sessionMode === "member" ? memberId : null, deviceLabel));

  const result = await db
    .prepare(
      `INSERT INTO chore_completions
        (chore_id, completed_by_member_id, responsible_member_id, device_session_id, notes, points)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(choreId, memberId, obligation.responsibleMemberId, completionSessionId, notes, points)
    .run();

  const completionId = Number(result.meta.last_row_id);
  const bugId = chooseRandomBugId();
  const earnedBugResult = await db
    .prepare(
      `INSERT INTO earned_bugs
        (family_member_id, bug_id, chore_id, completion_id, earned_at, expires_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now', '+3 days'))`,
    )
    .bind(memberId, bugId, choreId, completionId)
    .run();

  const earnedBug = await db
    .prepare(
      `SELECT
        id,
        family_member_id,
        bug_id,
        chore_id,
        completion_id,
        earned_at,
        expires_at
       FROM earned_bugs
       WHERE id = ?`,
    )
    .bind(earnedBugResult.meta.last_row_id)
    .first();

  const publicMemberName = member.nickname?.trim() || member.display_name;
  const aquariumEvent =
    member.member_type === "child" && obligation.chore.feeds_aquarium === 1
      ? await addAquariumFoodForCompletion(db, completionId, publicMemberName)
      : null;

  return json({
    ok: true,
    completion: {
      id: completionId,
      choreId,
      memberId,
      responsibleMemberId: obligation.responsibleMemberId,
      deviceSessionId: completionSessionId,
    },
    earnedBug,
    aquariumEvent,
  });
}

async function listMemberBugs(db: D1Database, memberId: number) {
  const member = await getActiveMember(db, memberId);
  if (!member) return badRequest("Member was not found.");

  const { results } = await db
    .prepare(
      `SELECT
        id,
        family_member_id,
        bug_id,
        chore_id,
        completion_id,
        earned_at,
        expires_at,
        removed_at,
        removed_reason
       FROM earned_bugs
       WHERE family_member_id = ?
        AND datetime(expires_at) > datetime('now')
        AND removed_at IS NULL
       ORDER BY earned_at DESC, id DESC
       LIMIT 50`,
    )
    .bind(memberId)
    .all();

  return json({ ok: true, bugs: results, truncated: results.length >= 50 });
}

async function removeEarnedBug(request: Request, db: D1Database, earnedBugId: number) {
  if (!earnedBugId || earnedBugId < 1) return badRequest("A valid earned bug id is required.");

  const body = await readJson(request);
  const reason = body.reason === "overclicked" ? "overclicked" : "removed";

  const result = await db
    .prepare(
      `UPDATE earned_bugs
       SET removed_at = datetime('now'), removed_reason = ?
       WHERE id = ?
        AND removed_at IS NULL
        AND datetime(expires_at) > datetime('now')`,
    )
    .bind(reason, earnedBugId)
    .run();

  if (!result.meta.changes) return badRequest("Earned bug was not found or is already removed.");

  const removedBug = await db
    .prepare(
      `SELECT
        id,
        family_member_id,
        bug_id,
        chore_id,
        completion_id,
        earned_at,
        expires_at,
        removed_at,
        removed_reason
       FROM earned_bugs
       WHERE id = ?`,
    )
    .bind(earnedBugId)
    .first();

  return json({ ok: true, bug: removedBug });
}

async function recentCompletions(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT
        cc.id,
        ${publicMemberNameSql("fm")} AS member_name,
        fm.avatar_id AS member_avatar_id,
        ${publicMemberNameSql("responsible")} AS responsible_member_name,
        responsible.avatar_id AS responsible_member_avatar_id,
        c.name AS chore_name,
        cc.completed_at,
        ds.mode AS session_mode,
        ds.device_label,
        cc.notes
       FROM chore_completions cc
       JOIN family_members fm ON fm.id = cc.completed_by_member_id
       JOIN chores c ON c.id = cc.chore_id
       LEFT JOIN family_members responsible ON responsible.id = cc.responsible_member_id
       LEFT JOIN device_sessions ds ON ds.id = cc.device_session_id
       ORDER BY cc.completed_at DESC
       LIMIT 50`,
    )
    .all();

  return json({ ok: true, completions: results });
}

async function selectMemberSession(request: Request, db: D1Database) {
  const body = await readJson(request);
  const memberId = asPositiveInteger(body.memberId);
  const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 80) : "Personal Device";

  if (!memberId) {
    return badRequest("memberId is required.");
  }

  const member = await getActiveMember(db, memberId);
  if (!member) {
    return badRequest("Member was not found.");
  }

  const id = await createDeviceSession(db, "member", memberId, deviceLabel);

  return json({
    ok: true,
    session: {
      id,
      mode: "member",
      memberId,
      deviceLabel,
    },
  });
}

async function kioskSession(request: Request, db: D1Database) {
  const body = await readJson(request);
  const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 80) : "Kitchen Tablet";
  const id = await createDeviceSession(db, "kiosk", null, deviceLabel);

  return json({
    ok: true,
    session: {
      id,
      mode: "kiosk",
      memberId: null,
      deviceLabel,
    },
  });
}

async function saveMember(request: Request, db: D1Database, id: number | null) {
  const body = await readJson(request);
  const displayName = typeof body.display_name === "string" ? body.display_name.trim().slice(0, 80) : "";
  const nickname = typeof body.nickname === "string" && body.nickname.trim() ? body.nickname.trim() : null;
  const avatarId = typeof body.avatar_id === "string" && avatarIds.has(body.avatar_id) ? body.avatar_id : null;
  const memberType = isMemberType(body.member_type) ? body.member_type : null;
  const sortOrder = asInteger(body.sort_order);
  const active = asActiveFlag(body.active);

  if (!displayName || !memberType) {
    return badRequest("Display name and member type are required.");
  }

  if (id) {
    await db
      .prepare(
        `UPDATE family_members
         SET display_name = ?, nickname = ?, avatar_id = ?, member_type = ?, sort_order = ?, active = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(displayName, nickname, avatarId, memberType, sortOrder, active, id)
      .run();

    return json({ ok: true, member: { id, display_name: displayName, nickname, avatar_id: avatarId, member_type: memberType, sort_order: sortOrder, active } });
  }

  const result = await db
    .prepare(
      `INSERT INTO family_members (display_name, nickname, avatar_id, member_type, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(displayName, nickname, avatarId, memberType, sortOrder, active)
    .run();

  return json({
    ok: true,
    member: { id: result.meta.last_row_id, display_name: displayName, nickname, avatar_id: avatarId, member_type: memberType, sort_order: sortOrder, active },
  });
}

async function deleteMember(db: D1Database, id: number) {
  const member = await db
    .prepare("SELECT id FROM family_members WHERE id = ?")
    .bind(id)
    .first<{ id: number }>();

  if (!member) {
    return badRequest("Member was not found.");
  }

  await db.batch([
    db
      .prepare(
        `UPDATE family_members
         SET active = 0, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(id),
    db
      .prepare(
        `UPDATE chores
         SET assigned_member_id = NULL, updated_at = datetime('now')
         WHERE assigned_member_id = ?`,
      )
      .bind(id),
    db
      .prepare(
        `UPDATE chore_assignments
         SET active = 0, updated_at = datetime('now')
         WHERE family_member_id = ?`,
      )
      .bind(id),
  ]);

  return json({ ok: true, member: { id, active: 0 } });
}

async function deleteChore(db: D1Database, id: number) {
  const chore = await db
    .prepare("SELECT id FROM chores WHERE id = ?")
    .bind(id)
    .first<{ id: number }>();

  if (!chore) {
    return badRequest("Chore was not found.");
  }

  await db
    .prepare(
      `UPDATE chores
       SET active = 0, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(id)
    .run();

  return json({ ok: true, chore: { id, active: 0 } });
}

async function saveChore(request: Request, db: D1Database, id: number | null) {
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 500) : null;
  const frequencyType = isFrequencyType(body.frequency_type) ? body.frequency_type : null;
  const assignmentMode = isAssignmentMode(body.assignment_mode) ? body.assignment_mode : "household_anyone";
  const assignmentMemberIds =
    assignmentMode === "household_anyone"
      ? []
      : asPositiveIntegerList(body.assignment_member_ids).length > 0
        ? asPositiveIntegerList(body.assignment_member_ids)
        : asPositiveInteger(body.assigned_member_id)
          ? [asPositiveInteger(body.assigned_member_id) as number]
          : [];
  const assignedMemberId = assignmentMode === "assigned_individual" ? assignmentMemberIds[0] ?? null : null;
  const alertIfOverdue = asActiveFlag(body.alert_if_overdue, 0);
  const needsReminder = asActiveFlag(body.needs_reminder, 0);
  const feedsAquarium = asActiveFlag(body.feeds_aquarium, 1);
  const active = asActiveFlag(body.active);

  if (!name || !frequencyType) {
    return badRequest("Chore name and frequency type are required.");
  }

  if (assignmentMode === "assigned_individual" && assignmentMemberIds.length !== 1) {
    return badRequest("Choose one assigned family member.");
  }

  if (assignmentMode === "per_person" && assignmentMemberIds.length === 0) {
    return badRequest("Choose at least one family member.");
  }

  for (const memberId of assignmentMemberIds) {
    const member = await getActiveMember(db, memberId);
    if (!member) return badRequest("Assigned member was not found.");
  }

  if (id) {
    await db
      .prepare(
        `UPDATE chores
         SET name = ?,
             description = ?,
             frequency_type = ?,
             assignment_mode = ?,
             assigned_member_id = ?,
             alert_if_overdue = ?,
             needs_reminder = ?,
             feeds_aquarium = ?,
             active = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(name, description, frequencyType, assignmentMode, assignedMemberId, alertIfOverdue, needsReminder, feedsAquarium, active, id)
      .run();

    await replaceChoreAssignments(db, id, assignmentMemberIds);

    return json({ ok: true, chore: { id, name, description, frequency_type: frequencyType, assignment_mode: assignmentMode, assigned_member_id: assignedMemberId, assignment_member_ids: assignmentMemberIds, alert_if_overdue: alertIfOverdue, needs_reminder: needsReminder, feeds_aquarium: feedsAquarium, active } });
  }

  const result = await db
    .prepare(
      `INSERT INTO chores
        (name, description, frequency_type, assignment_mode, assigned_member_id, alert_if_overdue, needs_reminder, feeds_aquarium, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(name, description, frequencyType, assignmentMode, assignedMemberId, alertIfOverdue, needsReminder, feedsAquarium, active)
    .run();

  const choreId = Number(result.meta.last_row_id);
  await replaceChoreAssignments(db, choreId, assignmentMemberIds);

  return json({
    ok: true,
    chore: { id: choreId, name, description, frequency_type: frequencyType, assignment_mode: assignmentMode, assigned_member_id: assignedMemberId, assignment_member_ids: assignmentMemberIds, alert_if_overdue: alertIfOverdue, needs_reminder: needsReminder, feeds_aquarium: feedsAquarium, active },
  });
}

async function replaceChoreAssignments(db: D1Database, choreId: number, memberIds: number[]) {
  await db
    .prepare(
      `UPDATE chore_assignments
       SET active = 0, updated_at = datetime('now')
       WHERE chore_id = ?`,
    )
    .bind(choreId)
    .run();

  for (const memberId of memberIds) {
    await db
      .prepare(
        `INSERT INTO chore_assignments (chore_id, family_member_id, active, updated_at)
         VALUES (?, ?, 1, datetime('now'))
         ON CONFLICT(chore_id, family_member_id)
         DO UPDATE SET active = 1, updated_at = datetime('now')`,
      )
      .bind(choreId, memberId)
      .run();
  }
}

async function listNotes(db: D1Database, includeInactive = false) {
  const { results } = await db
    .prepare(
      `SELECT id, note_type, text, active, created_at, updated_at
       FROM household_notes
       ${includeInactive ? "" : "WHERE active = 1"}
       ORDER BY active DESC, updated_at DESC, id DESC`,
    )
    .all();

  return json({ ok: true, notes: results });
}

async function saveNote(request: Request, db: D1Database, id: number | null) {
  const body = await readJson(request);
  const noteType =
    body.note_type === "shopping" || body.note_type === "reminder" || body.note_type === "note"
      ? body.note_type
      : "note";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 300) : "";
  const active = asActiveFlag(body.active);

  if (!text) {
    return badRequest("Note text is required.");
  }

  if (id) {
    await db
      .prepare(
        `UPDATE household_notes
         SET note_type = ?, text = ?, active = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(noteType, text, active, id)
      .run();

    return json({ ok: true, note: { id, note_type: noteType, text, active } });
  }

  const result = await db
    .prepare(
      `INSERT INTO household_notes (note_type, text, active)
       VALUES (?, ?, ?)`,
    )
    .bind(noteType, text, active)
    .run();

  return json({ ok: true, note: { id: result.meta.last_row_id, note_type: noteType, text, active } });
}

async function getAquariumConfig(db: D1Database) {
  const state = await getAquariumState(db);
  return json({ ok: true, config: state });
}

async function saveAquariumConfig(request: Request, db: D1Database) {
  await ensureAquarium(db);

  const body = await readJson(request);
  const current = await getAquariumState(db);
  const maxFoodReserve = Math.max(1, asInteger(body.max_food_reserve, current.max_food_reserve));
  const startingFoodReserve = Math.max(0, Math.min(maxFoodReserve, asInteger(body.starting_food_reserve, current.starting_food_reserve)));
  const dailyFoodConsumption = Math.max(0, asInteger(body.daily_food_consumption, current.daily_food_consumption));
  const creatureUnlockInterval = Math.max(1, asInteger(body.creature_unlock_interval, current.creature_unlock_interval));
  const eggIncubationMinutes = Math.max(0, asInteger(body.egg_incubation_minutes, current.egg_incubation_minutes));
  const growthDays = Math.max(0, asInteger(body.growth_days, current.growth_days));
  const foodReserve =
    typeof body.food_reserve === "number" || typeof body.food_reserve === "string"
      ? Math.max(0, Math.min(maxFoodReserve, asInteger(body.food_reserve, current.food_reserve)))
      : Math.min(current.food_reserve, maxFoodReserve);

  await db
    .prepare(
      `UPDATE aquarium_state
       SET food_reserve = ?,
           starting_food_reserve = ?,
           max_food_reserve = ?,
           daily_food_consumption = ?,
           creature_unlock_interval = ?,
           egg_incubation_minutes = ?,
           growth_days = ?,
           updated_at = datetime('now')
       WHERE id = 1`,
    )
    .bind(
      foodReserve,
      startingFoodReserve,
      maxFoodReserve,
      dailyFoodConsumption,
      creatureUnlockInterval,
      eggIncubationMinutes,
      growthDays,
    )
    .run();

  const updated = await getAquariumState(db);
  return json({ ok: true, config: updated });
}

async function exportData(db: D1Database) {
  const [members, chores, assignments, completions, sessions, notes, aquariumState, aquariumCreatures, aquariumEggs, aquariumEvents] = await Promise.all([
    db.prepare("SELECT * FROM family_members ORDER BY sort_order, id").all(),
    db.prepare("SELECT * FROM chores ORDER BY active DESC, id").all(),
    db.prepare("SELECT * FROM chore_assignments ORDER BY chore_id, family_member_id").all(),
    db.prepare("SELECT * FROM chore_completions ORDER BY completed_at DESC, id DESC LIMIT 1000").all(),
    db.prepare("SELECT id, mode, member_id, device_label, created_at, last_seen_at FROM device_sessions ORDER BY last_seen_at DESC LIMIT 500").all(),
    db.prepare("SELECT * FROM household_notes ORDER BY updated_at DESC, id DESC").all(),
    db.prepare("SELECT * FROM aquarium_state WHERE id = 1").all(),
    db.prepare("SELECT * FROM aquarium_creatures ORDER BY created_at, id").all(),
    db.prepare("SELECT * FROM aquarium_eggs ORDER BY created_at, id").all(),
    db.prepare("SELECT * FROM aquarium_events ORDER BY created_at DESC, id DESC LIMIT 500").all(),
  ]);

  return json({
    ok: true,
    exportedAt: new Date().toISOString(),
    members: members.results,
    chores: chores.results,
    choreAssignments: assignments.results,
    completions: completions.results,
    deviceSessions: sessions.results,
    notes: notes.results,
    aquariumState: aquariumState.results,
    aquariumCreatures: aquariumCreatures.results,
    aquariumEggs: aquariumEggs.results,
    aquariumEvents: aquariumEvents.results,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const memberMatch = url.pathname.match(/^\/api\/admin\/members\/(\d+)$/);
    const memberChoresMatch = url.pathname.match(/^\/api\/members\/(\d+)\/chores$/);
    const memberBugsMatch = url.pathname.match(/^\/api\/members\/(\d+)\/bugs$/);
    const earnedBugRemoveMatch = url.pathname.match(/^\/api\/bugs\/(\d+)\/remove$/);
    const choreMatch = url.pathname.match(/^\/api\/admin\/chores\/(\d+)$/);
    const noteMatch = url.pathname.match(/^\/api\/admin\/notes\/(\d+)$/);

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "family-chores-api",
        phase: "phase-3-household-beta",
      });
    }

    if (request.method === "GET" && url.pathname === "/api/members") {
      return listMembers(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/chores") {
      return listChores(env.DB);
    }

    if (request.method === "GET" && memberChoresMatch) {
      const member = await getActiveMember(env.DB, Number(memberChoresMatch[1]));
      if (!member) return badRequest("Member was not found.");
      return listChores(env.DB, Number(memberChoresMatch[1]));
    }

    if (request.method === "GET" && memberBugsMatch) {
      return listMemberBugs(env.DB, Number(memberBugsMatch[1]));
    }

    if (request.method === "POST" && earnedBugRemoveMatch) {
      return removeEarnedBug(request, env.DB, Number(earnedBugRemoveMatch[1]));
    }

    if (request.method === "GET" && url.pathname === "/api/today") {
      return todayView(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      return householdStatus(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/aquarium") {
      return listAquarium(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/notes") {
      return listNotes(env.DB);
    }

    if (request.method === "POST" && url.pathname === "/api/notes") {
      return saveNote(request, env.DB, null);
    }

    if (request.method === "POST" && url.pathname === "/api/completions") {
      return recordCompletion(request, env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/completions/recent") {
      return recentCompletions(env.DB);
    }

    if (request.method === "POST" && url.pathname === "/api/session/select-member") {
      return selectMemberSession(request, env.DB);
    }

    if (request.method === "POST" && url.pathname === "/api/session/kiosk") {
      return kioskSession(request, env.DB);
    }

    if (url.pathname.startsWith("/api/admin/") && !requireParentPin(request, env)) {
      return unauthorized();
    }

    if (request.method === "GET" && url.pathname === "/api/admin/members") {
      return listMembers(env.DB);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/members") {
      return saveMember(request, env.DB, null);
    }

    if (request.method === "PUT" && memberMatch) {
      return saveMember(request, env.DB, Number(memberMatch[1]));
    }

    if (request.method === "DELETE" && memberMatch) {
      return deleteMember(env.DB, Number(memberMatch[1]));
    }

    if (request.method === "GET" && url.pathname === "/api/admin/chores") {
      return listAdminChores(env.DB);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/chores") {
      return saveChore(request, env.DB, null);
    }

    if (request.method === "PUT" && choreMatch) {
      return saveChore(request, env.DB, Number(choreMatch[1]));
    }

    if (request.method === "DELETE" && choreMatch) {
      return deleteChore(env.DB, Number(choreMatch[1]));
    }

    if (request.method === "GET" && url.pathname === "/api/admin/notes") {
      return listNotes(env.DB, true);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/notes") {
      return saveNote(request, env.DB, null);
    }

    if (request.method === "PUT" && noteMatch) {
      return saveNote(request, env.DB, Number(noteMatch[1]));
    }

    if (request.method === "GET" && url.pathname === "/api/admin/aquarium-config") {
      return getAquariumConfig(env.DB);
    }

    if (request.method === "PUT" && url.pathname === "/api/admin/aquarium-config") {
      return saveAquariumConfig(request, env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/admin/export") {
      return exportData(env.DB);
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
  },
};
