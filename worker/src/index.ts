interface Env {
  DB: D1Database;
  PARENT_PIN?: string;
  SMS_ENABLED?: string;
  SMS_TEST_MODE?: string;
  SMS_TEST_NUMBER?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_API_KEY_SID?: string;
  TWILIO_API_KEY_SECRET?: string;
  ALERTING_FROM_PHONE_NUMBER?: string;
  ALERTING_TO_PHONE_NUMBERS?: string;
  FISH_MESSAGE_MODE?: string;
}

type SessionMode = "member" | "kiosk" | "admin";
type MemberType = "adult" | "child";
type FrequencyType = "daily" | "weekdays" | "weekends" | "weekly" | "monthly" | "as_needed";
type AssignmentMode = "household_anyone" | "assigned_individual" | "per_person";
type AquariumMood = "happy" | "content" | "peckish" | "hungry" | "very_hungry" | "sad";
type FishHungerMood = "happy" | "slightly_hungry" | "hungry" | "very_hungry" | "emergency_hunger";
type FishNotificationType = "hunger" | "new_fish" | "fish_birthday" | "fish_growth" | "tank_success" | "test" | "fish_reward_thank_you";
type FishMessageSelectionMode = "random" | "escalation";

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
  // Fail closed: if no PARENT_PIN is configured, admin endpoints are locked.
  // (Local dev: set PARENT_PIN in worker/.dev.vars — see docs/SETUP.md.)
  const expectedPin = env.PARENT_PIN;
  if (!expectedPin) return false;
  const providedPin = request.headers.get("X-Parent-Pin") ?? "";
  if (providedPin.length !== expectedPin.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedPin.length; i += 1) {
    mismatch |= providedPin.charCodeAt(i) ^ expectedPin.charCodeAt(i);
  }
  return mismatch === 0;
};

type AppSettings = {
  test_mode: 0 | 1;
};

const defaultAppSettings: AppSettings = {
  test_mode: 0,
};

async function getAppSettings(db: D1Database): Promise<AppSettings> {
  try {
    const { results } = await db
      .prepare("SELECT key, value FROM app_settings WHERE key = 'test_mode'")
      .all<{ key: string; value: string }>();
    const values = new Map(results.map((row) => [row.key, row.value]));
    const testModeValue = values.get("test_mode");

    return {
      test_mode: testModeValue === "1" || testModeValue?.toLowerCase() === "true" ? 1 : 0,
    };
  } catch (error) {
    console.warn("Could not load app settings", error);
    return defaultAppSettings;
  }
}

async function isTestModeEnabled(env: Env) {
  if (envFlag(env.SMS_TEST_MODE, false)) return true;
  const settings = await getAppSettings(env.DB);
  return settings.test_mode === 1;
}

async function listAppSettings(db: D1Database) {
  return json({ ok: true, settings: await getAppSettings(db) });
}

async function saveAppSettings(request: Request, db: D1Database) {
  const body = await readJson(request);
  const testMode = asActiveFlag(body.test_mode, defaultAppSettings.test_mode);

  await db
    .prepare(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ('test_mode', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
    )
    .bind(String(testMode))
    .run();

  return json({ ok: true, settings: await getAppSettings(db) });
}

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

const aquariumSpeciesIds = ["clownfish", "seahorse", "angelfish", "crab", "pufferfish", "starfish", "clam"];

const publicMemberNameSql = (alias: string) => `COALESCE(NULLIF(TRIM(${alias}.nickname), ''), ${alias}.display_name)`;

const chooseRandomBugId = () => bugIds[crypto.getRandomValues(new Uint32Array(1))[0] % bugIds.length];
const randomInteger = (maxExclusive: number) => crypto.getRandomValues(new Uint32Array(1))[0] % maxExclusive;
const randomPercent = () => randomInteger(10_000) / 100;

const envFlag = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const householdTimeZone = "America/Los_Angeles";
const defaultFishTextStartTime = "09:00";
const defaultFishTextStopTime = "23:00";
const defaultEggIncubationMinutes = 3 * 24 * 60;

type HouseholdCalendar = {
  todayDate: string;
  todayStart: string;
  todayEnd: string;
  yesterdayStart: string;
  yesterdayEnd: string;
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEnd: string;
  weekday: number;
};

type HouseholdReminderRow = {
  id: number;
  name: string;
  frequency_type: FrequencyType;
  needs_reminder: number;
  alert_if_overdue: number;
  last_completed_at: string | null;
  days_since_completed: number | null;
  last_completed_by: string | null;
  last_completed_by_avatar_id: string | null;
  is_due: number;
};

function utcTimestamp(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function localDateParts(date: Date, timeZone = householdTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function localTimeOfDay(date = new Date(), timeZone = householdTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("hour")}:${value("minute")}`;
}

function offsetMsForTimeZone(date: Date, timeZone = householdTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return asUtc - date.getTime();
}

function localMidnightUtc(year: number, month: number, day: number, timeZone = householdTimeZone) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day));
  return new Date(utcGuess.getTime() - offsetMsForTimeZone(utcGuess, timeZone));
}

function addLocalDays(parts: { year: number; month: number; day: number }, days: number) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getHouseholdCalendar(now = new Date()): HouseholdCalendar {
  const today = localDateParts(now);
  const yesterday = addLocalDays(today, -1);
  const tomorrow = addLocalDays(today, 1);
  const firstOfMonth = { year: today.year, month: today.month, day: 1 };
  const firstOfNextMonth = today.month === 12 ? { year: today.year + 1, month: 1, day: 1 } : { year: today.year, month: today.month + 1, day: 1 };
  const weekday = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const weekStartParts = addLocalDays(today, mondayOffset);
  const weekEndParts = addLocalDays(weekStartParts, 7);

  return {
    todayDate: `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`,
    todayStart: utcTimestamp(localMidnightUtc(today.year, today.month, today.day)),
    todayEnd: utcTimestamp(localMidnightUtc(tomorrow.year, tomorrow.month, tomorrow.day)),
    yesterdayStart: utcTimestamp(localMidnightUtc(yesterday.year, yesterday.month, yesterday.day)),
    yesterdayEnd: utcTimestamp(localMidnightUtc(today.year, today.month, today.day)),
    weekStart: utcTimestamp(localMidnightUtc(weekStartParts.year, weekStartParts.month, weekStartParts.day)),
    weekEnd: utcTimestamp(localMidnightUtc(weekEndParts.year, weekEndParts.month, weekEndParts.day)),
    monthStart: utcTimestamp(localMidnightUtc(firstOfMonth.year, firstOfMonth.month, firstOfMonth.day)),
    monthEnd: utcTimestamp(localMidnightUtc(firstOfNextMonth.year, firstOfNextMonth.month, firstOfNextMonth.day)),
    weekday,
  };
}

function completionIsInPeriod(completedAt: unknown, start: string, end: string) {
  return typeof completedAt === "string" && completedAt >= start && completedAt < end;
}

function choreIsDue(frequency: unknown, completedAt: unknown, calendar: HouseholdCalendar) {
  if (frequency === "daily") return !completionIsInPeriod(completedAt, calendar.todayStart, calendar.todayEnd);
  if (frequency === "weekdays") {
    return calendar.weekday >= 1 && calendar.weekday <= 5 && !completionIsInPeriod(completedAt, calendar.todayStart, calendar.todayEnd);
  }
  if (frequency === "weekends") {
    return (calendar.weekday === 0 || calendar.weekday === 6) && !completionIsInPeriod(completedAt, calendar.todayStart, calendar.todayEnd);
  }
  if (frequency === "weekly") return !completionIsInPeriod(completedAt, calendar.weekStart, calendar.weekEnd);
  if (frequency === "monthly") return !completionIsInPeriod(completedAt, calendar.monthStart, calendar.monthEnd);
  return false;
}

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
  panic_mode: number;
  panic_chores_needed: number;
  panic_expires_at: string | null;
  everything_good_until: string | null;
};

const fishEmojiPools = {
  happy: ["🐟😊", "🐠✨", "🐟💙", "🐠🎉", "🐟😋", "🐠🌈", "🐟🥳"],
  slightly_hungry: ["🐟❓", "🐠🍽️", "🐟👀", "🐠⏰", "🐟🤔"],
  hungry: ["🐟🍽️", "🐠🥺", "🐟👉🍤", "🐠😟", "🐟🍴"],
  very_hungry: ["🐟😫🍽️", "🐠😭🍤", "🐟⚠️🍽️", "🐠🫧😵", "🐟💭🍤"],
  emergency_hunger: ["🐟💀🍽️", "🐠🪦🍤", "🐟📢📢📢", "🐠😱🍽️", "🐟🌊😭"],
  new_fish: ["🐠🎉🎉", "🐟➕🐠", "🐠🏠✨", "🐟🎂", "🐠🥳🌈", "🐟👋💙"],
  fish_birthday: ["🐠🎂", "🐟🎉", "🐠🎈🎈", "🐟🥳🎁", "🐠🍰✨"],
  fish_growth: ["🐟➡️🐠", "✨🐟✨", "🐠💪", "🐟🏆", "🐠⭐"],
  tank_success: ["🐟😍🏠", "🐠✨✨✨", "🐟💙🫧", "🐠🎉🏆", "🐟😎"],
  rare_humorous: ["🐟🚪🍤❓", "🐠📅😳", "🐟🔍🍤", "🐠☎️🍤", "🐟🛸🍤"],
} as const;

const rewardMessageTemplates = {
  tier1: ["🐟🙏🫧", "🐠✨🙏", "🐡💋🫧", "🐟🙏💖", "🐠🫧✨"],
  tier2: ["🐟🐠🙏✨🫧", "🐡🐟💋✨", "🐠💖🙏🫧", "🐟✨🐠✨🙏", "🐡🫧💖💋"],
  tier3: ["🐟🐠🐡✨✨🙏💋", "🐠🐟💖🫧✨😘", "🐡🐟🐠🎉🙏✨", "🐟💋🐠💋🐡✨", "🐠🫧✨💖🙏🌊"],
  tier4: ["🐟🐠🐡🎉✨💖💋🙏🫧", "🐠🐟🐡✨✨✨😘🌈", "🐟🐟🐠🐡🎉🫧💖🙏", "🐡🐠🐟💋💋✨🌊🎉", "🐟🐠🐡🥰✨🫧🌈🙏"],
} as const;

const fishEscalationSequence = ["🐟👀", "🐟⏰", "🐟🍽️", "🐟🥺🍤", "🐟😭🍤", "🐟⚠️🍽️", "🐟💀🍽️"] as const;

const hungerCooldownHours: Record<Exclude<FishHungerMood, "happy">, number> = {
  slightly_hungry: 24,
  hungry: 12,
  very_hungry: 6,
  emergency_hunger: 3,
};

// With no chores today, the tank can stay stable briefly after yesterday's work,
// but it should never report "happy" until today's chores actually start.
const aquariumMoodHours = {
  peckish: 20,
  hungry: 32,
  very_hungry: 44,
} as const;

const aquariumMoodRank: Record<AquariumMood, number> = {
  sad: 0,
  very_hungry: 1,
  hungry: 2,
  peckish: 3,
  content: 4,
  happy: 5,
};

type AquariumParticipation = {
  todayChildCount: number;
  todayDistinctChildCount: number;
  activeChildCount: number;
};

type AquariumMoodDebugCompletion = {
  id: number;
  member_id: number;
  member_name: string;
  member_type: MemberType;
  chore_name: string;
  feeds_aquarium: number;
  completed_at: string;
};

function hoursSinceAquariumFed(state: AquariumStateRow): number {
  if (!state.last_fed_at) return 999;
  const fedMs = Date.parse(`${state.last_fed_at.replace(" ", "T")}Z`);
  if (Number.isNaN(fedMs)) return 999;
  return Math.max(0, (Date.now() - fedMs) / 3_600_000);
}

function worseAquariumMood(a: AquariumMood, b: AquariumMood): AquariumMood {
  return aquariumMoodRank[a] <= aquariumMoodRank[b] ? a : b;
}

function getParticipationCeilingMood(distinctChildCount: number, activeChildCount: number): AquariumMood | null {
  if (distinctChildCount <= 0 || activeChildCount <= 0) return null;
  if (distinctChildCount >= activeChildCount) return "happy";
  if (distinctChildCount >= activeChildCount - 1) return "content";
  if (distinctChildCount >= Math.ceil(activeChildCount / 2)) return "peckish";
  // Any participation at all still earns acknowledgment: never cap below "peckish".
  // (One child cannot carry the tank to "happy", but their effort must be visible.)
  return "peckish";
}

function getBaseAquariumMood(state: AquariumStateRow, todayChildCount: number): AquariumMood {
  if (todayChildCount >= 3) return "happy";
  if (todayChildCount === 2) return "content";
  if (todayChildCount === 1) return "hungry";

  // No chores yet today — decay from last feeding time.
  const hours = hoursSinceAquariumFed(state);
  if (hours <= aquariumMoodHours.peckish) return "peckish";
  if (hours <= aquariumMoodHours.hungry) return "hungry";
  if (hours <= aquariumMoodHours.very_hungry) return "very_hungry";
  return "sad";
}

// Fish happiness is driven by how many child chores were completed today.
// One morning routine (brushing teeth) is not enough — we need real effort.
// 3+ chores = happy, 2 = content, 1 = hungry, 0 = time-based decay from yesterday.
// Distinct child participation caps that base mood so one child cannot carry the tank.
// Panic mode overrides everything and locks the tank to "sad" until enough chores are done.
function getAquariumMood(state: AquariumStateRow, participation: AquariumParticipation): AquariumMood {
  if (state.everything_good_until && Date.parse(`${state.everything_good_until.replace(" ", "T")}Z`) > Date.now()) {
    return "happy";
  }

  if (state.panic_mode === 1) return "sad";

  const baseMood = getBaseAquariumMood(state, participation.todayChildCount);
  const participationCeilingMood = getParticipationCeilingMood(
    participation.todayDistinctChildCount,
    participation.activeChildCount,
  );
  const cappedMood = participationCeilingMood
    ? worseAquariumMood(baseMood, participationCeilingMood)
    : baseMood;

  // Invariant: a completed chore must NEVER leave the tank worse than doing nothing
  // would. Without this floor, the first chore of the day could drop the mood from
  // time-decay "peckish" (0 chores, recently fed) to count-based "hungry" (1 chore),
  // which reads to a kid as punishment for helping.
  if (participation.todayChildCount > 0) {
    const zeroChoreMood = getBaseAquariumMood(state, 0);
    if (aquariumMoodRank[cappedMood] < aquariumMoodRank[zeroChoreMood]) {
      return zeroChoreMood;
    }
  }

  return cappedMood;
}

function getAquariumMoodDebug(
  state: AquariumStateRow,
  participation: AquariumParticipation,
  calendar: HouseholdCalendar,
  todayCompletions: AquariumMoodDebugCompletion[],
) {
  const nowMs = Date.now();
  const everythingGoodActive = Boolean(
    state.everything_good_until && Date.parse(`${state.everything_good_until.replace(" ", "T")}Z`) > nowMs,
  );
  const panicActive = state.panic_mode === 1;
  const baseMood = getBaseAquariumMood(state, participation.todayChildCount);
  const participationCeilingMood = getParticipationCeilingMood(
    participation.todayDistinctChildCount,
    participation.activeChildCount,
  );
  const uncappedMood = baseMood;
  const finalMood = getAquariumMood(state, participation);
  const countedCompletions = todayCompletions.filter(
    (completion) => completion.member_type === "child" && completion.feeds_aquarium === 1,
  );
  const ignoredCompletions = todayCompletions.filter(
    (completion) => completion.member_type !== "child" || completion.feeds_aquarium !== 1,
  );

  return {
    generated_at: utcTimestamp(new Date(nowMs)),
    time_zone: householdTimeZone,
    today: {
      date: calendar.todayDate,
      start: calendar.todayStart,
      end: calendar.todayEnd,
    },
    mood: {
      final: finalMood,
      base: baseMood,
      uncapped: uncappedMood,
      participation_ceiling: participationCeilingMood,
    },
    participation,
    counted_completions: countedCompletions,
    ignored_completions: ignoredCompletions,
    rules: {
      chore_count: [
        { min: 3, mood: "happy" },
        { count: 2, mood: "content" },
        { count: 1, mood: "hungry" },
        { count: 0, mood: "time_decay" },
      ],
      time_decay_hours: aquariumMoodHours,
      mood_rank: aquariumMoodRank,
      participation_cap_enabled: true,
    },
    overrides: {
      everything_good_active: everythingGoodActive,
      everything_good_until: state.everything_good_until,
      panic_active: panicActive,
      panic_chores_needed: state.panic_chores_needed,
      panic_expires_at: state.panic_expires_at,
    },
    last_fed_at: state.last_fed_at,
    hours_since_fed: Math.round(hoursSinceAquariumFed(state)),
  };
}

function getAquariumMoodMessage(
  mood: AquariumMood,
  todayChildCount: number,
  panic?: { active: boolean; choresNeeded: number },
) {
  // During panic, show progress toward rescue so every chore visibly counts.
  if (panic?.active) {
    const needed = Math.max(1, panic.choresNeeded);
    return `The fish are scared! ${needed} more ${needed === 1 ? "chore" : "chores"} to save them.`;
  }
  if (mood === "happy") return "The fish are well fed today.";
  if (mood === "content") return "The fish are doing okay today.";
  if (mood === "peckish") return "The fish could use a little more help today.";
  // From here down the tank is hungry/very_hungry/sad. Never claim "no chores"
  // when chores actually happened — always acknowledge the completed count.
  if (todayChildCount === 1) return "Only 1 chore completed today.";
  if (todayChildCount > 1) {
    return `${todayChildCount} chores done — the fish need more of the family to pitch in.`;
  }
  return "No chores completed today!";
}

type FishNotificationHistoryRow = {
  id: number;
  message_body: string | null;
  created_at: string;
};

type HungerObligationRow = {
  chore_id: number;
  chore_name: string;
  frequency_type: FrequencyType;
  responsible_member_id: number;
  member_name: string;
  last_completed_at: string | null;
};

type HungerObligationScore = HungerObligationRow & {
  points: number;
  period_start: string | null;
  period_end: string | null;
  completed_in_period: boolean;
  period_applies: boolean;
};

type HungerCalculation = {
  score: number;
  mood: FishHungerMood;
  allAssignedChoresComplete: boolean;
  obligations: HungerObligationScore[];
};

type SmsProviderResult = {
  recipient: string;
  providerMessageId: string | null;
  providerStatus: string | null;
};

type SmsConfigDiagnostics = {
  smsEnabled: boolean;
  testMode: boolean;
  hasAccountSid: boolean;
  hasAuthToken: boolean;
  hasApiKeySid: boolean;
  hasApiKeySecret: boolean;
  authMethod: "auth_token" | "api_key" | "missing";
  hasFromPhoneNumber: boolean;
  recipientCount: number;
  configuredFishTextRecipientCount: number;
  quietHoursBlockedRecipientCount: number;
  completedTodayBlockedRecipientCount: number;
  recipientTimeZone: string;
  recipientLocalTime: string;
  missingSettings: string[];
};

type SmsDiagnosticContext = {
  sms: SmsConfigDiagnostics;
  provider?: {
    recipient?: string;
    httpStatus?: number;
    twilioStatus?: string | null;
    twilioCode?: string | null;
    twilioMoreInfo?: string | null;
  };
};

type SmsFailureDetails = {
  errorMessage: string;
  providerStatus: string | null;
  providerStatusCode: number | null;
  providerErrorCode: string | null;
  providerErrorMessage: string | null;
  diagnosticContext: SmsDiagnosticContext | null;
};

type FishNotificationRecordOptions = {
  recipientMemberId?: number | null;
  choreDate?: string | null;
  completedChoresToday?: number | null;
  fishMoodAtSendTime?: AquariumMood | null;
  chorePoints?: number | null;
  fishMoodModifier?: number | null;
  finalRewardScore?: number | null;
  errorMessage?: string | null;
  providerStatus?: string | null;
  providerStatusCode?: number | null;
  providerErrorCode?: string | null;
  providerErrorMessage?: string | null;
  diagnosticContext?: unknown;
};

type FishNotificationResult = {
  sent: boolean;
  skipped: boolean;
  reason: string;
  type: FishNotificationType;
  mood: FishHungerMood | null;
  hungerScore: number;
  message: string | null;
  errorMessage?: string;
  diagnostics?: SmsDiagnosticContext | null;
};

type CurrentModeNotificationResult = FishNotificationResult & {
  aquariumMood: AquariumMood;
};

type ScheduledHungerNotificationResult = FishNotificationResult & {
  aquariumMood: AquariumMood;
  calculation: HungerCalculation;
  individualAccountability: IndividualHungerAccountabilityResult[];
};

type FishTextActiveRow = {
  active_until: string;
};

type HouseholdDayWindow = {
  date: string;
  start: string;
  end: string;
};

type IndividualZeroChoreRow = {
  member_id: number;
  member_name: string;
  day_0_count: number;
  day_1_count: number;
  day_2_count: number;
  day_3_count: number;
};

type IndividualHungerAccountabilityResult = FishNotificationResult & {
  memberId: number;
  memberName: string;
  zeroChoreStreak: number;
};

type RewardTier = keyof typeof rewardMessageTemplates;

type ChildRewardCandidate = {
  member_id: number;
  member_name: string;
  completed_chores_today: number;
};

type FishRewardThankYouResult = FishNotificationResult & {
  memberId: number;
  memberName: string;
  choreDate: string;
  completedChoresToday: number;
  aquariumMood: AquariumMood;
  chorePoints: number;
  fishMoodModifier: number;
  finalRewardScore: number;
  tier: RewardTier;
};

type ScheduledRewardNotificationResult = {
  ran: boolean;
  skipped: boolean;
  reason: string;
  choreDate: string;
  aquariumMood: AquariumMood | null;
  results: FishRewardThankYouResult[];
};

function parseDbTimestampMs(value: string) {
  return Date.parse(`${value.replace(" ", "T")}Z`);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFishHungerMood(score: number): FishHungerMood {
  if (score >= 11) return "emergency_hunger";
  if (score >= 8) return "very_hungry";
  if (score >= 5) return "hungry";
  if (score >= 3) return "slightly_hungry";
  return "happy";
}

function fishHungerMoodIsHungryOrWorse(mood: FishHungerMood) {
  return mood === "hungry" || mood === "very_hungry" || mood === "emergency_hunger";
}

function individualHungerMessageForZeroChoreStreak(streak: number) {
  if (streak === 2) return "🐟😐🍽️❓";
  if (streak === 3) return "🐟😟🍽️‼️";
  return "🐟💀🍽️🚨";
}

function getChorePoints(completedChoresToday: number) {
  if (completedChoresToday <= 0) return 0;
  return Math.min(completedChoresToday, 3);
}

function getFishMoodModifier(fishMood: AquariumMood) {
  if (fishMood === "happy") return 1;
  if (fishMood === "hungry" || fishMood === "very_hungry" || fishMood === "sad") return -1;
  return 0;
}

function getFinalRewardScore(completedChoresToday: number, fishMood: AquariumMood) {
  const chorePoints = getChorePoints(completedChoresToday);
  if (chorePoints === 0) return 0;
  return clamp(chorePoints + getFishMoodModifier(fishMood), 1, 4);
}

function rewardTierForScore(score: number): RewardTier {
  if (score >= 4) return "tier4";
  if (score === 3) return "tier3";
  if (score === 2) return "tier2";
  return "tier1";
}

function chooseRewardMessage(tier: RewardTier, lastMessage: string | null) {
  return chooseEmojiFromPool(rewardMessageTemplates[tier], lastMessage);
}

function isInsideRewardSendWindow(now = new Date()) {
  const minutes = timeOfDayMinutes(localTimeOfDay(now));
  return minutes >= 20 * 60 && minutes < 21 * 60;
}

function getHouseholdDayWindows(count: number, now = new Date()): HouseholdDayWindow[] {
  const today = localDateParts(now);

  return Array.from({ length: count }, (_, index) => {
    const day = addLocalDays(today, -index);
    const nextDay = addLocalDays(day, 1);
    return {
      date: `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`,
      start: utcTimestamp(localMidnightUtc(day.year, day.month, day.day)),
      end: utcTimestamp(localMidnightUtc(nextDay.year, nextDay.month, nextDay.day)),
    };
  });
}

function zeroChoreStreakFromCounts(row: IndividualZeroChoreRow) {
  const counts = [row.day_0_count, row.day_1_count, row.day_2_count, row.day_3_count];
  let streak = 0;

  for (const count of counts) {
    if (count > 0) break;
    streak += 1;
  }

  return streak;
}

function periodForFrequency(frequency: FrequencyType, calendar: HouseholdCalendar) {
  if (frequency === "daily") return { start: calendar.todayStart, end: calendar.todayEnd, applies: true };
  if (frequency === "weekdays") {
    return { start: calendar.todayStart, end: calendar.todayEnd, applies: calendar.weekday >= 1 && calendar.weekday <= 5 };
  }
  if (frequency === "weekends") {
    return { start: calendar.todayStart, end: calendar.todayEnd, applies: calendar.weekday === 0 || calendar.weekday === 6 };
  }
  if (frequency === "weekly") return { start: calendar.weekStart, end: calendar.weekEnd, applies: true };
  if (frequency === "monthly") return { start: calendar.monthStart, end: calendar.monthEnd, applies: true };
  return { start: null, end: null, applies: false };
}

function hungerPointsForObligation(row: HungerObligationRow, calendar: HouseholdCalendar, nowMs: number): HungerObligationScore {
  const period = periodForFrequency(row.frequency_type, calendar);

  if (!period.applies || !period.start || !period.end) {
    return {
      ...row,
      points: 0,
      period_start: period.start,
      period_end: period.end,
      completed_in_period: false,
      period_applies: false,
    };
  }

  const completedInPeriod = completionIsInPeriod(row.last_completed_at, period.start, period.end);
  if (completedInPeriod) {
    return {
      ...row,
      points: 0,
      period_start: period.start,
      period_end: period.end,
      completed_in_period: true,
      period_applies: true,
    };
  }

  const startMs = parseDbTimestampMs(period.start);
  const endMs = parseDbTimestampMs(period.end);
  const elapsedRatio = Math.max(0, (nowMs - startMs) / Math.max(1, endMs - startMs));
  const points = elapsedRatio >= 1 ? 3 : elapsedRatio >= 0.5 ? 2 : elapsedRatio >= 0.25 ? 1 : 0;

  return {
    ...row,
    points,
    period_start: period.start,
    period_end: period.end,
    completed_in_period: false,
    period_applies: true,
  };
}

async function calculateHungerScore(db: D1Database, now = new Date()): Promise<HungerCalculation> {
  const calendar = getHouseholdCalendar(now);
  const { results } = await db
    .prepare(
      `SELECT
        c.id AS chore_id,
        c.name AS chore_name,
        c.frequency_type,
        ca.family_member_id AS responsible_member_id,
        ${publicMemberNameSql("fm")} AS member_name,
        lc.completed_at AS last_completed_at
       FROM chores c
       JOIN chore_assignments ca ON ca.chore_id = c.id AND ca.active = 1
       JOIN family_members fm ON fm.id = ca.family_member_id
       LEFT JOIN (
        SELECT chore_id, responsible_member_id, MAX(completed_at) AS completed_at
        FROM chore_completions
        GROUP BY chore_id, responsible_member_id
       ) lc ON lc.chore_id = c.id AND lc.responsible_member_id = ca.family_member_id
       WHERE c.active = 1
        AND c.assignment_mode IN ('assigned_individual', 'per_person')
        AND COALESCE(c.feeds_aquarium, 1) = 1
        AND fm.active = 1
        AND fm.member_type = 'child'
       ORDER BY fm.sort_order, member_name, c.name`,
    )
    .all<HungerObligationRow>();

  const obligations = results.map((row) => hungerPointsForObligation(row, calendar, now.getTime()));
  const score = obligations.reduce((total, row) => total + row.points, 0);
  const activePeriodObligations = obligations.filter((row) => row.period_applies);
  const allAssignedChoresComplete =
    activePeriodObligations.length > 0 && activePeriodObligations.every((row) => row.completed_in_period);

  return {
    score,
    mood: getFishHungerMood(score),
    allAssignedChoresComplete,
    obligations,
  };
}

async function getLastSentNotification(
  db: D1Database,
  type: FishNotificationType | null = null,
  mood: FishHungerMood | null = null,
) {
  const filters = ["status = 'sent'", "message_body IS NOT NULL"];
  const binds: string[] = [];

  if (type) {
    filters.push("notification_type = ?");
    binds.push(type);
  }

  if (mood) {
    filters.push("mood = ?");
    binds.push(mood);
  }

  return db
    .prepare(
      `SELECT id, message_body, created_at
       FROM fish_notification_history
       WHERE ${filters.join(" AND ")}
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT 1`,
    )
    .bind(...binds)
    .first<FishNotificationHistoryRow>();
}

function getCooldownHours(type: FishNotificationType, mood: FishHungerMood | null) {
  if (type === "tank_success") return 24;
  if (type === "hunger" && mood && mood !== "happy") return hungerCooldownHours[mood];
  return 0;
}

function isInsideCooldown(lastSent: FishNotificationHistoryRow | null, cooldownHours: number) {
  if (!lastSent || cooldownHours <= 0) return false;
  const lastSentMs = parseDbTimestampMs(lastSent.created_at);
  return Date.now() - lastSentMs < cooldownHours * 3_600_000;
}

function escalationMessageForScore(score: number) {
  const index = score >= 11 ? 6 : score >= 8 ? 5 : score >= 5 ? 3 : score >= 3 ? 0 : 0;
  return fishEscalationSequence[index];
}

function chooseEmojiFromPool(pool: readonly string[], lastMessage: string | null) {
  const eligible = pool.length > 1 && lastMessage ? pool.filter((message) => message !== lastMessage) : [...pool];
  return eligible[randomInteger(eligible.length)];
}

function chooseFishMessage(
  type: FishNotificationType,
  mood: FishHungerMood | null,
  hungerScore: number,
  lastMessage: string | null,
  mode: FishMessageSelectionMode,
) {
  if (type === "hunger" && mode === "escalation") {
    const escalationMessage = escalationMessageForScore(hungerScore);
    if (escalationMessage !== lastMessage) return escalationMessage;
  }

  if (type === "hunger" && randomPercent() < 1.5) {
    return chooseEmojiFromPool(fishEmojiPools.rare_humorous, lastMessage);
  }

  if (type === "hunger" && mood && mood !== "happy") {
    return chooseEmojiFromPool(fishEmojiPools[mood], lastMessage);
  }

  if (type === "new_fish") return chooseEmojiFromPool(fishEmojiPools.new_fish, lastMessage);
  if (type === "fish_birthday") return chooseEmojiFromPool(fishEmojiPools.fish_birthday, lastMessage);
  if (type === "fish_growth") return chooseEmojiFromPool(fishEmojiPools.fish_growth, lastMessage);
  if (type === "tank_success") return chooseEmojiFromPool(fishEmojiPools.tank_success, lastMessage);
  return chooseEmojiFromPool(fishEmojiPools.happy, lastMessage);
}

function fishHungerMoodForAquariumMood(mood: AquariumMood): FishHungerMood {
  if (mood === "peckish") return "slightly_hungry";
  if (mood === "hungry") return "hungry";
  if (mood === "very_hungry") return "very_hungry";
  if (mood === "sad") return "emergency_hunger";
  return "happy";
}

function hungerScoreForAquariumMood(mood: AquariumMood) {
  if (mood === "peckish") return 3;
  if (mood === "hungry") return 5;
  if (mood === "very_hungry") return 8;
  if (mood === "sad") return 11;
  return 0;
}

function chooseCurrentAquariumModeMessage(mood: AquariumMood, lastMessage: string | null) {
  if (mood === "hungry") return chooseEmojiFromPool(fishEmojiPools.hungry, lastMessage);
  if (mood === "very_hungry") return chooseEmojiFromPool(fishEmojiPools.very_hungry, lastMessage);
  if (mood === "sad") return chooseEmojiFromPool(fishEmojiPools.emergency_hunger, lastMessage);
  return chooseEmojiFromPool(fishEmojiPools.happy, lastMessage);
}

function shouldTextOnlyMembersWithoutChoresToday(type: FishNotificationType, mood: FishHungerMood | null) {
  if (type === "hunger") return mood !== "happy";
  if (type === "test") return mood === "slightly_hungry" || mood === "hungry" || mood === "very_hungry" || mood === "emergency_hunger";
  return false;
}

function normalizePhoneNumber(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d]/g, "");

  if (trimmed.startsWith("+") && /^\+\d{8,15}$/.test(trimmed.replace(/[\s().-]/g, ""))) {
    return `+${digits}`;
  }

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function normalizeFishTextTime(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed) ? trimmed : fallback;
}

function timeOfDayMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
}

function isInsideFishTextWindow(localTime: string, startTime: string, stopTime: string) {
  const current = timeOfDayMinutes(localTime);
  const start = timeOfDayMinutes(startTime);
  const stop = timeOfDayMinutes(stopTime);

  if (start === stop) return true;
  if (start < stop) return current >= start && current < stop;
  return current >= start || current < stop;
}

type SmsRecipientState = {
  recipients: string[];
  configuredFishTextRecipientCount: number;
  quietHoursBlockedRecipientCount: number;
  completedTodayBlockedRecipientCount: number;
  localTime: string;
  timeZone: string;
};

type SmsRecipientOptions = {
  onlyMembersWithoutChoresToday?: boolean;
  onlyAdults?: boolean;
  targetMemberIds?: number[];
};

async function getMembersWithCompletionsToday(db: D1Database) {
  const calendar = getHouseholdCalendar();
  const { results } = await db
    .prepare(
      `SELECT DISTINCT completed_by_member_id
       FROM chore_completions
       WHERE completed_at >= ?
        AND completed_at < ?`,
    )
    .bind(calendar.todayStart, calendar.todayEnd)
    .all<{ completed_by_member_id: number }>();

  return new Set(results.map((row) => row.completed_by_member_id));
}

async function getSmsRecipientState(env: Env, options: SmsRecipientOptions = {}): Promise<SmsRecipientState> {
  const testMode = await isTestModeEnabled(env);
  const testNumber = env.SMS_TEST_NUMBER?.trim() || "+13105035221";
  const localTime = localTimeOfDay();

  if (testMode) {
    return {
      recipients: [testNumber],
      configuredFishTextRecipientCount: 1,
      quietHoursBlockedRecipientCount: 0,
      completedTodayBlockedRecipientCount: 0,
      localTime,
      timeZone: householdTimeZone,
    };
  }

  const targetMemberIds = options.targetMemberIds?.filter((id) => Number.isInteger(id) && id > 0) ?? [];
  const targetMemberFilter = targetMemberIds.length > 0 ? `AND id IN (${targetMemberIds.map(() => "?").join(", ")})` : "";
  const { results } = await env.DB
    .prepare(
      `SELECT id, phone_number, fish_text_start_time, fish_text_stop_time
       FROM family_members
       WHERE active = 1
        AND (? = 0 OR member_type = 'adult')
        ${targetMemberFilter}
        AND receives_fish_texts = 1
        AND phone_number IS NOT NULL
        AND TRIM(phone_number) <> ''
       ORDER BY sort_order, display_name`,
    )
    .bind(options.onlyAdults ? 1 : 0, ...targetMemberIds)
    .all<{ id: number; phone_number: string; fish_text_start_time: string | null; fish_text_stop_time: string | null }>();
  const configuredRecipients = new Set<string>();
  const eligibleRecipients = new Set<string>();
  const completedMemberIds = options.onlyMembersWithoutChoresToday ? await getMembersWithCompletionsToday(env.DB) : new Set<number>();
  let quietHoursBlockedRecipientCount = 0;
  let completedTodayBlockedRecipientCount = 0;

  for (const row of results) {
    const phoneNumber = normalizePhoneNumber(row.phone_number) ?? row.phone_number.trim();
    const startTime = normalizeFishTextTime(row.fish_text_start_time, defaultFishTextStartTime);
    const stopTime = normalizeFishTextTime(row.fish_text_stop_time, defaultFishTextStopTime);

    if (!phoneNumber) continue;

    configuredRecipients.add(phoneNumber);

    if (!isInsideFishTextWindow(localTime, startTime, stopTime)) {
      quietHoursBlockedRecipientCount += 1;
      continue;
    }

    if (completedMemberIds.has(row.id)) {
      completedTodayBlockedRecipientCount += 1;
      continue;
    }

    eligibleRecipients.add(phoneNumber);
  }

  if (configuredRecipients.size > 0) {
    return {
      recipients: [...eligibleRecipients],
      configuredFishTextRecipientCount: configuredRecipients.size,
      quietHoursBlockedRecipientCount,
      completedTodayBlockedRecipientCount,
      localTime,
      timeZone: householdTimeZone,
    };
  }

  if (options.onlyMembersWithoutChoresToday || options.onlyAdults) {
    return {
      recipients: [],
      configuredFishTextRecipientCount: 0,
      quietHoursBlockedRecipientCount: 0,
      completedTodayBlockedRecipientCount: 0,
      localTime,
      timeZone: householdTimeZone,
    };
  }

  const fallbackRecipients = [...new Set((env.ALERTING_TO_PHONE_NUMBERS ?? "")
    .split(",")
    .map((number) => number.trim())
    .filter((number) => number.length > 0))];

  return {
    recipients: fallbackRecipients,
    configuredFishTextRecipientCount: fallbackRecipients.length,
    quietHoursBlockedRecipientCount: 0,
    completedTodayBlockedRecipientCount: 0,
    localTime,
    timeZone: householdTimeZone,
  };
}

async function smsRecipients(env: Env) {
  return (await getSmsRecipientState(env)).recipients;
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

async function getSmsConfigDiagnostics(env: Env, options: SmsRecipientOptions = {}): Promise<SmsConfigDiagnostics> {
  const smsEnabled = envFlag(env.SMS_ENABLED, true);
  const testMode = await isTestModeEnabled(env);
  const hasAccountSid = Boolean(env.TWILIO_ACCOUNT_SID?.trim());
  const hasAuthToken = Boolean(env.TWILIO_AUTH_TOKEN?.trim());
  const hasApiKeySid = Boolean(env.TWILIO_API_KEY_SID?.trim());
  const hasApiKeySecret = Boolean(env.TWILIO_API_KEY_SECRET?.trim());
  const hasApiKeyCredentials = hasApiKeySid && hasApiKeySecret;
  const authMethod = hasApiKeyCredentials ? "api_key" : hasAuthToken ? "auth_token" : "missing";
  const hasFromPhoneNumber = Boolean(env.ALERTING_FROM_PHONE_NUMBER?.trim());
  const recipientState = await getSmsRecipientState(env, options);
  const recipientCount = recipientState.recipients.length;
  const missingSettings: string[] = [];

  if (!hasAccountSid) missingSettings.push("TWILIO_ACCOUNT_SID");
  if (!hasAuthToken && !hasApiKeyCredentials) {
    if (hasApiKeySid && !hasApiKeySecret) {
      missingSettings.push("TWILIO_API_KEY_SECRET");
    } else if (!hasApiKeySid && hasApiKeySecret) {
      missingSettings.push("TWILIO_API_KEY_SID");
    } else {
      missingSettings.push("TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID/TWILIO_API_KEY_SECRET");
    }
  }
  if (!hasFromPhoneNumber) missingSettings.push("ALERTING_FROM_PHONE_NUMBER");
  if (recipientCount === 0 && recipientState.configuredFishTextRecipientCount === 0) {
    missingSettings.push(testMode ? "SMS_TEST_NUMBER" : "fish text recipients");
  }

  return {
    smsEnabled,
    testMode,
    hasAccountSid,
    hasAuthToken,
    hasApiKeySid,
    hasApiKeySecret,
    authMethod,
    hasFromPhoneNumber,
    recipientCount,
    configuredFishTextRecipientCount: recipientState.configuredFishTextRecipientCount,
    quietHoursBlockedRecipientCount: recipientState.quietHoursBlockedRecipientCount,
    completedTodayBlockedRecipientCount: recipientState.completedTodayBlockedRecipientCount,
    recipientTimeZone: recipientState.timeZone,
    recipientLocalTime: recipientState.localTime,
    missingSettings,
  };
}

class SmsConfigurationError extends Error {
  readonly diagnostics: SmsDiagnosticContext;

  constructor(message: string, diagnostics: SmsDiagnosticContext) {
    super(message);
    this.name = "SmsConfigurationError";
    this.diagnostics = diagnostics;
  }
}

class SmsQuietHoursError extends Error {
  readonly diagnostics: SmsDiagnosticContext;

  constructor(message: string, diagnostics: SmsDiagnosticContext) {
    super(message);
    this.name = "SmsQuietHoursError";
    this.diagnostics = diagnostics;
  }
}

class SmsRecipientFilterError extends Error {
  readonly diagnostics: SmsDiagnosticContext;
  readonly reason: "completed_today";

  constructor(message: string, diagnostics: SmsDiagnosticContext, reason: "completed_today") {
    super(message);
    this.name = "SmsRecipientFilterError";
    this.diagnostics = diagnostics;
    this.reason = reason;
  }
}

class TwilioSmsError extends Error {
  readonly diagnostics: SmsDiagnosticContext;
  readonly httpStatus: number;
  readonly twilioStatus: string | null;
  readonly twilioCode: string | null;
  readonly twilioMessage: string | null;

  constructor(message: string, options: {
    diagnostics: SmsDiagnosticContext;
    httpStatus: number;
    twilioStatus: string | null;
    twilioCode: string | null;
    twilioMessage: string | null;
  }) {
    super(message);
    this.name = "TwilioSmsError";
    this.diagnostics = options.diagnostics;
    this.httpStatus = options.httpStatus;
    this.twilioStatus = options.twilioStatus;
    this.twilioCode = options.twilioCode;
    this.twilioMessage = options.twilioMessage;
  }
}

async function sendTwilioSms(env: Env, message: string, recipientOptions: SmsRecipientOptions = {}): Promise<SmsProviderResult[]> {
  const configDiagnostics = await getSmsConfigDiagnostics(env, recipientOptions);
  const baseDiagnostics: SmsDiagnosticContext = { sms: configDiagnostics };
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();
  const apiKeySid = env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = env.TWILIO_API_KEY_SECRET?.trim();
  const authUsername = apiKeySid && apiKeySecret ? apiKeySid : accountSid;
  const authPassword = apiKeySid && apiKeySecret ? apiKeySecret : authToken;
  const fromPhoneNumber = env.ALERTING_FROM_PHONE_NUMBER?.trim();
  const recipientState = await getSmsRecipientState(env, recipientOptions);
  const recipients = recipientState.recipients;

  if (!configDiagnostics.smsEnabled) {
    throw new SmsConfigurationError("SMS is disabled by configuration.", baseDiagnostics);
  }

  if (!accountSid || !authUsername || !authPassword || !fromPhoneNumber || (recipients.length === 0 && recipientState.configuredFishTextRecipientCount === 0)) {
    const missing = configDiagnostics.missingSettings.join(", ");
    throw new SmsConfigurationError(`SMS configuration is incomplete: missing ${missing}.`, baseDiagnostics);
  }

  if (recipients.length === 0) {
    if (recipientState.completedTodayBlockedRecipientCount > 0) {
      throw new SmsRecipientFilterError("No fish text recipients still need to do a chore today.", baseDiagnostics, "completed_today");
    }

    throw new SmsQuietHoursError("No fish text recipients are currently inside their allowed text window.", baseDiagnostics);
  }

  const authHeader = btoa(`${authUsername}:${authPassword}`);
  const results: SmsProviderResult[] = [];
  let firstSendError: TwilioSmsError | null = null;

  for (const recipient of recipients) {
    const form = new URLSearchParams();
    form.set("Body", message);
    form.set("From", fromPhoneNumber);
    form.set("To", recipient);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const responseBody = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const providerStatus = stringValue(responseBody?.status);
    const twilioCode = stringValue(responseBody?.code ?? responseBody?.error_code);
    const twilioMessage = stringValue(responseBody?.message ?? responseBody?.error_message);
    const twilioMoreInfo = stringValue(responseBody?.more_info);

    if (!response.ok) {
      // Do not abort the whole batch on one failed recipient: recipients that
      // were already texted would be re-texted on the next cron run because
      // the run would be recorded as "failed". Remember the error, keep going,
      // and only fail the run if nobody received the message.
      firstSendError ??= new TwilioSmsError(twilioMessage ?? `Twilio SMS failed with status ${response.status}.`, {
        diagnostics: {
          ...baseDiagnostics,
          provider: {
            recipient,
            httpStatus: response.status,
            twilioStatus: providerStatus,
            twilioCode,
            twilioMoreInfo,
          },
        },
        httpStatus: response.status,
        twilioStatus: providerStatus,
        twilioCode,
        twilioMessage,
      });
      continue;
    }

    results.push({
      recipient,
      providerMessageId: stringValue(responseBody?.sid),
      providerStatus,
    });
  }

  if (results.length === 0 && firstSendError) {
    throw firstSendError;
  }
  if (firstSendError) {
    console.error("Twilio SMS partial failure (some recipients skipped):", firstSendError.message);
  }

  return results;
}

function smsFailureDetails(error: unknown): SmsFailureDetails {
  const fallbackMessage = error instanceof Error ? error.message : "Unknown SMS error.";

  if (error instanceof SmsConfigurationError || error instanceof SmsQuietHoursError || error instanceof SmsRecipientFilterError) {
    return {
      errorMessage: fallbackMessage,
      providerStatus: null,
      providerStatusCode: null,
      providerErrorCode: null,
      providerErrorMessage: null,
      diagnosticContext: error.diagnostics,
    };
  }

  if (error instanceof TwilioSmsError) {
    return {
      errorMessage: fallbackMessage,
      providerStatus: error.twilioStatus,
      providerStatusCode: error.httpStatus,
      providerErrorCode: error.twilioCode,
      providerErrorMessage: error.twilioMessage ?? fallbackMessage,
      diagnosticContext: error.diagnostics,
    };
  }

  return {
    errorMessage: fallbackMessage,
    providerStatus: null,
    providerStatusCode: null,
    providerErrorCode: null,
    providerErrorMessage: null,
    diagnosticContext: null,
  };
}

function diagnosticContextJson(context: unknown) {
  if (context === undefined || context === null) return null;

  try {
    return JSON.stringify(context);
  } catch {
    return JSON.stringify({ error: "Could not serialize SMS diagnostic context." });
  }
}

async function recordFishNotification(
  db: D1Database,
  type: FishNotificationType,
  mood: FishHungerMood | null,
  hungerScore: number,
  message: string | null,
  recipient: string | null,
  providerMessageId: string | null,
  status: "sent" | "skipped" | "failed",
  reason: string,
  options: FishNotificationRecordOptions = {},
) {
  const diagnosticContext = diagnosticContextJson(options.diagnosticContext);

  await db
    .prepare(
      `INSERT INTO fish_notification_history
        (notification_type, mood, hunger_score, message_body, recipient_member_id, recipient_phone_number, provider_message_id, status, reason, error_message,
         provider_status, provider_status_code, provider_error_code, provider_error_message, diagnostic_context, chore_date, completed_chores_today,
         fish_mood_at_send_time, chore_points, fish_mood_modifier, final_reward_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      type,
      mood,
      hungerScore,
      message,
      options.recipientMemberId ?? null,
      recipient,
      providerMessageId,
      status,
      reason,
      options.errorMessage ?? null,
      options.providerStatus ?? null,
      options.providerStatusCode ?? null,
      options.providerErrorCode ?? null,
      options.providerErrorMessage ?? null,
      diagnosticContext,
      options.choreDate ?? null,
      options.completedChoresToday ?? null,
      options.fishMoodAtSendTime ?? null,
      options.chorePoints ?? null,
      options.fishMoodModifier ?? null,
      options.finalRewardScore ?? null,
    )
    .run();
}

async function sendFishNotification(
  env: Env,
  type: FishNotificationType,
  reason: string,
  hungerScore = 0,
  mood: FishHungerMood | null = null,
): Promise<FishNotificationResult> {
  const cooldownHours = getCooldownHours(type, mood);
  const lastSentForCooldown = await getLastSentNotification(env.DB, type, mood);

  if (isInsideCooldown(lastSentForCooldown, cooldownHours)) {
    await recordFishNotification(env.DB, type, mood, hungerScore, null, null, null, "skipped", "cooldown");
    return { sent: false, skipped: true, reason: "cooldown", type, mood, hungerScore, message: null };
  }

  const lastSentMessage = await getLastSentNotification(env.DB);
  const selectionMode: FishMessageSelectionMode = env.FISH_MESSAGE_MODE === "escalation" ? "escalation" : "random";
  const message = chooseFishMessage(type, mood, hungerScore, lastSentMessage?.message_body ?? null, selectionMode);
  const recipientOptions: SmsRecipientOptions = {
    onlyMembersWithoutChoresToday: type === "test" ? false : shouldTextOnlyMembersWithoutChoresToday(type, mood),
    onlyAdults: type === "test",
  };

  try {
    const results = await sendTwilioSms(env, message, recipientOptions);

    for (const result of results) {
      await recordFishNotification(
        env.DB,
        type,
        mood,
        hungerScore,
        message,
        result.recipient,
        result.providerMessageId,
        "sent",
        reason,
        {
          providerStatus: result.providerStatus,
          diagnosticContext: {
            sms: await getSmsConfigDiagnostics(env, recipientOptions),
            provider: {
              recipient: result.recipient,
              twilioStatus: result.providerStatus,
            },
          },
        },
      );
    }

    return { sent: true, skipped: false, reason, type, mood, hungerScore, message };
  } catch (error) {
    if (error instanceof SmsQuietHoursError) {
      await recordFishNotification(env.DB, type, mood, hungerScore, message, null, null, "skipped", "quiet_hours", {
        diagnosticContext: error.diagnostics,
      });
      return {
        sent: false,
        skipped: true,
        reason: "quiet_hours",
        type,
        mood,
        hungerScore,
        message,
        diagnostics: error.diagnostics,
      };
    }

    if (error instanceof SmsRecipientFilterError) {
      await recordFishNotification(env.DB, type, mood, hungerScore, message, null, null, "skipped", error.reason, {
        diagnosticContext: error.diagnostics,
      });
      return {
        sent: false,
        skipped: true,
        reason: error.reason,
        type,
        mood,
        hungerScore,
        message,
        diagnostics: error.diagnostics,
      };
    }

    const failure = smsFailureDetails(error);
    await recordFishNotification(env.DB, type, mood, hungerScore, message, null, null, "failed", reason, {
      errorMessage: failure.errorMessage,
      providerStatus: failure.providerStatus,
      providerStatusCode: failure.providerStatusCode,
      providerErrorCode: failure.providerErrorCode,
      providerErrorMessage: failure.providerErrorMessage,
      diagnosticContext: failure.diagnosticContext,
    });
    return {
      sent: false,
      skipped: false,
      reason: "failed",
      type,
      mood,
      hungerScore,
      message,
      errorMessage: failure.errorMessage,
      diagnostics: failure.diagnosticContext,
    };
  }
}

async function getIndividualZeroChoreStreaks(db: D1Database, now = new Date()) {
  const days = getHouseholdDayWindows(4, now);
  const { results } = await db
    .prepare(
      `SELECT
        fm.id AS member_id,
        ${publicMemberNameSql("fm")} AS member_name,
        SUM(CASE WHEN cc.completed_at >= ? AND cc.completed_at < ? THEN 1 ELSE 0 END) AS day_0_count,
        SUM(CASE WHEN cc.completed_at >= ? AND cc.completed_at < ? THEN 1 ELSE 0 END) AS day_1_count,
        SUM(CASE WHEN cc.completed_at >= ? AND cc.completed_at < ? THEN 1 ELSE 0 END) AS day_2_count,
        SUM(CASE WHEN cc.completed_at >= ? AND cc.completed_at < ? THEN 1 ELSE 0 END) AS day_3_count
       FROM family_members fm
       LEFT JOIN chore_completions cc
        ON cc.completed_by_member_id = fm.id
        AND cc.completed_at >= ?
        AND cc.completed_at < ?
       WHERE fm.active = 1
        AND fm.member_type = 'child'
       GROUP BY fm.id
       ORDER BY fm.sort_order, member_name`,
    )
    .bind(
      days[0].start,
      days[0].end,
      days[1].start,
      days[1].end,
      days[2].start,
      days[2].end,
      days[3].start,
      days[3].end,
      days[3].start,
      days[0].end,
    )
    .all<IndividualZeroChoreRow>();

  return results.map((row) => ({
    memberId: row.member_id,
    memberName: row.member_name,
    zeroChoreStreak: zeroChoreStreakFromCounts(row),
  }));
}

async function alreadySentIndividualHungerTextToday(db: D1Database, memberId: number, now = new Date()) {
  const [today] = getHouseholdDayWindows(1, now);
  const row = await db
    .prepare(
      `SELECT id
       FROM fish_notification_history
       WHERE notification_type = 'hunger'
        AND reason = 'individual_hunger_accountability'
        AND recipient_member_id = ?
        AND status = 'sent'
        AND created_at >= ?
        AND created_at < ?
       LIMIT 1`,
    )
    .bind(memberId, today.start, today.end)
    .first<{ id: number }>();

  return row !== null;
}

async function sendIndividualHungerAccountabilityText(
  env: Env,
  memberId: number,
  memberName: string,
  zeroChoreStreak: number,
  hungerScore: number,
  mood: FishHungerMood,
): Promise<IndividualHungerAccountabilityResult> {
  const message = individualHungerMessageForZeroChoreStreak(zeroChoreStreak);
  const recipientOptions: SmsRecipientOptions = { targetMemberIds: [memberId] };

  try {
    const results = await sendTwilioSms(env, message, recipientOptions);

    for (const result of results) {
      await recordFishNotification(
        env.DB,
        "hunger",
        mood,
        hungerScore,
        message,
        result.recipient,
        result.providerMessageId,
        "sent",
        "individual_hunger_accountability",
        {
          recipientMemberId: memberId,
          providerStatus: result.providerStatus,
          diagnosticContext: {
            sms: await getSmsConfigDiagnostics(env, recipientOptions),
            provider: {
              recipient: result.recipient,
              twilioStatus: result.providerStatus,
            },
          },
        },
      );
    }

    return { sent: true, skipped: false, reason: "individual_hunger_accountability", type: "hunger", mood, hungerScore, message, memberId, memberName, zeroChoreStreak };
  } catch (error) {
    if (error instanceof SmsQuietHoursError) {
      await recordFishNotification(env.DB, "hunger", mood, hungerScore, message, null, null, "skipped", "quiet_hours", {
        recipientMemberId: memberId,
        diagnosticContext: error.diagnostics,
      });
      return { sent: false, skipped: true, reason: "quiet_hours", type: "hunger", mood, hungerScore, message, memberId, memberName, zeroChoreStreak, diagnostics: error.diagnostics };
    }

    if (error instanceof SmsRecipientFilterError) {
      await recordFishNotification(env.DB, "hunger", mood, hungerScore, message, null, null, "skipped", error.reason, {
        recipientMemberId: memberId,
        diagnosticContext: error.diagnostics,
      });
      return { sent: false, skipped: true, reason: error.reason, type: "hunger", mood, hungerScore, message, memberId, memberName, zeroChoreStreak, diagnostics: error.diagnostics };
    }

    const failure = smsFailureDetails(error);
    await recordFishNotification(env.DB, "hunger", mood, hungerScore, message, null, null, "failed", "individual_hunger_accountability", {
      recipientMemberId: memberId,
      errorMessage: failure.errorMessage,
      providerStatus: failure.providerStatus,
      providerStatusCode: failure.providerStatusCode,
      providerErrorCode: failure.providerErrorCode,
      providerErrorMessage: failure.providerErrorMessage,
      diagnosticContext: failure.diagnosticContext,
    });
    return {
      sent: false,
      skipped: false,
      reason: "failed",
      type: "hunger",
      mood,
      hungerScore,
      message,
      memberId,
      memberName,
      zeroChoreStreak,
      errorMessage: failure.errorMessage,
      diagnostics: failure.diagnosticContext,
    };
  }
}

async function runIndividualHungerAccountabilityNotifications(
  env: Env,
  calculation: HungerCalculation,
): Promise<IndividualHungerAccountabilityResult[]> {
  if (!fishHungerMoodIsHungryOrWorse(calculation.mood)) return [];

  const streaks = await getIndividualZeroChoreStreaks(env.DB);
  const results: IndividualHungerAccountabilityResult[] = [];

  for (const streak of streaks) {
    if (streak.zeroChoreStreak < 2) continue;
    if (await alreadySentIndividualHungerTextToday(env.DB, streak.memberId)) continue;

    results.push(
      await sendIndividualHungerAccountabilityText(
        env,
        streak.memberId,
        streak.memberName,
        streak.zeroChoreStreak,
        calculation.score,
        calculation.mood,
      ),
    );
  }

  return results;
}

async function getChildRewardCandidates(db: D1Database, calendar: HouseholdCalendar) {
  const { results } = await db
    .prepare(
      `SELECT
        fm.id AS member_id,
        ${publicMemberNameSql("fm")} AS member_name,
        COUNT(cc.id) AS completed_chores_today
       FROM family_members fm
       JOIN chore_completions cc ON cc.completed_by_member_id = fm.id
       WHERE fm.active = 1
        AND fm.member_type = 'child'
        AND cc.completed_at >= ?
        AND cc.completed_at < ?
       GROUP BY fm.id
       HAVING completed_chores_today > 0
       ORDER BY fm.sort_order, member_name`,
    )
    .bind(calendar.todayStart, calendar.todayEnd)
    .all<ChildRewardCandidate>();

  return results;
}

async function alreadySentRewardTextForChoreDate(db: D1Database, memberId: number, choreDate: string) {
  const row = await db
    .prepare(
      `SELECT id
       FROM fish_notification_history
       WHERE notification_type = 'fish_reward_thank_you'
        AND recipient_member_id = ?
        AND chore_date = ?
        AND status = 'sent'
       LIMIT 1`,
    )
    .bind(memberId, choreDate)
    .first<{ id: number }>();

  return row !== null;
}

async function getLastRewardMessageForMember(db: D1Database, memberId: number, choreDate: string) {
  return db
    .prepare(
      `SELECT id, message_body, created_at
       FROM fish_notification_history
       WHERE notification_type = 'fish_reward_thank_you'
        AND recipient_member_id = ?
        AND chore_date <> ?
        AND status = 'sent'
        AND message_body IS NOT NULL
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT 1`,
    )
    .bind(memberId, choreDate)
    .first<FishNotificationHistoryRow>();
}

async function sendFishRewardThankYouText(
  env: Env,
  candidate: ChildRewardCandidate,
  choreDate: string,
  aquariumMood: AquariumMood,
): Promise<FishRewardThankYouResult> {
  const completedChoresToday = candidate.completed_chores_today;
  const chorePoints = getChorePoints(completedChoresToday);
  const fishMoodModifier = getFishMoodModifier(aquariumMood);
  const finalRewardScore = getFinalRewardScore(completedChoresToday, aquariumMood);
  const tier = rewardTierForScore(finalRewardScore);
  const mood = fishHungerMoodForAquariumMood(aquariumMood);
  const lastRewardMessage = await getLastRewardMessageForMember(env.DB, candidate.member_id, choreDate);
  const message = chooseRewardMessage(tier, lastRewardMessage?.message_body ?? null);
  const recipientOptions: SmsRecipientOptions = { targetMemberIds: [candidate.member_id] };
  const recordOptionsBase: FishNotificationRecordOptions = {
    recipientMemberId: candidate.member_id,
    choreDate,
    completedChoresToday,
    fishMoodAtSendTime: aquariumMood,
    chorePoints,
    fishMoodModifier,
    finalRewardScore,
  };

  try {
    const results = await sendTwilioSms(env, message, recipientOptions);

    for (const result of results) {
      await recordFishNotification(
        env.DB,
        "fish_reward_thank_you",
        mood,
        0,
        message,
        result.recipient,
        result.providerMessageId,
        "sent",
        "end_of_day_reward",
        {
          ...recordOptionsBase,
          providerStatus: result.providerStatus,
          diagnosticContext: {
            sms: await getSmsConfigDiagnostics(env, recipientOptions),
            provider: {
              recipient: result.recipient,
              twilioStatus: result.providerStatus,
            },
          },
        },
      );
    }

    return {
      sent: true,
      skipped: false,
      reason: "end_of_day_reward",
      type: "fish_reward_thank_you",
      mood,
      hungerScore: 0,
      message,
      memberId: candidate.member_id,
      memberName: candidate.member_name,
      choreDate,
      completedChoresToday,
      aquariumMood,
      chorePoints,
      fishMoodModifier,
      finalRewardScore,
      tier,
    };
  } catch (error) {
    if (error instanceof SmsQuietHoursError) {
      await recordFishNotification(env.DB, "fish_reward_thank_you", mood, 0, message, null, null, "skipped", "quiet_hours", {
        ...recordOptionsBase,
        diagnosticContext: error.diagnostics,
      });
      return {
        sent: false,
        skipped: true,
        reason: "quiet_hours",
        type: "fish_reward_thank_you",
        mood,
        hungerScore: 0,
        message,
        memberId: candidate.member_id,
        memberName: candidate.member_name,
        choreDate,
        completedChoresToday,
        aquariumMood,
        chorePoints,
        fishMoodModifier,
        finalRewardScore,
        tier,
        diagnostics: error.diagnostics,
      };
    }

    if (error instanceof SmsRecipientFilterError) {
      await recordFishNotification(env.DB, "fish_reward_thank_you", mood, 0, message, null, null, "skipped", error.reason, {
        ...recordOptionsBase,
        diagnosticContext: error.diagnostics,
      });
      return {
        sent: false,
        skipped: true,
        reason: error.reason,
        type: "fish_reward_thank_you",
        mood,
        hungerScore: 0,
        message,
        memberId: candidate.member_id,
        memberName: candidate.member_name,
        choreDate,
        completedChoresToday,
        aquariumMood,
        chorePoints,
        fishMoodModifier,
        finalRewardScore,
        tier,
        diagnostics: error.diagnostics,
      };
    }

    const failure = smsFailureDetails(error);
    await recordFishNotification(env.DB, "fish_reward_thank_you", mood, 0, message, null, null, "failed", "end_of_day_reward", {
      ...recordOptionsBase,
      errorMessage: failure.errorMessage,
      providerStatus: failure.providerStatus,
      providerStatusCode: failure.providerStatusCode,
      providerErrorCode: failure.providerErrorCode,
      providerErrorMessage: failure.providerErrorMessage,
      diagnosticContext: failure.diagnosticContext,
    });
    return {
      sent: false,
      skipped: false,
      reason: "failed",
      type: "fish_reward_thank_you",
      mood,
      hungerScore: 0,
      message,
      memberId: candidate.member_id,
      memberName: candidate.member_name,
      choreDate,
      completedChoresToday,
      aquariumMood,
      chorePoints,
      fishMoodModifier,
      finalRewardScore,
      tier,
      errorMessage: failure.errorMessage,
      diagnostics: failure.diagnosticContext,
    };
  }
}

async function runFishRewardThankYouNotifications(env: Env, reason = "scheduled", now = new Date()): Promise<ScheduledRewardNotificationResult> {
  const calendar = getHouseholdCalendar(now);

  if (reason === "scheduled" && !isInsideRewardSendWindow(now)) {
    return { ran: false, skipped: true, reason: "outside_reward_window", choreDate: calendar.todayDate, aquariumMood: null, results: [] };
  }

  const [aquariumMood, candidates] = await Promise.all([
    getCurrentAquariumMood(env.DB),
    getChildRewardCandidates(env.DB, calendar),
  ]);
  const results: FishRewardThankYouResult[] = [];

  for (const candidate of candidates) {
    if (await alreadySentRewardTextForChoreDate(env.DB, candidate.member_id, calendar.todayDate)) continue;

    results.push(await sendFishRewardThankYouText(env, candidate, calendar.todayDate, aquariumMood));
  }

  return {
    ran: true,
    skipped: false,
    reason,
    choreDate: calendar.todayDate,
    aquariumMood,
    results,
  };
}

async function runFishHungerNotification(env: Env, reason = "scheduled"): Promise<ScheduledHungerNotificationResult> {
  const [aquariumMood, calculation] = await Promise.all([
    getCurrentAquariumMood(env.DB),
    calculateHungerScore(env.DB),
  ]);
  const mood = fishHungerMoodForAquariumMood(aquariumMood);
  const hungerScore = hungerScoreForAquariumMood(aquariumMood);
  const notificationCalculation = { ...calculation, score: hungerScore, mood };

  if (mood === "happy") {
    return {
      sent: false,
      skipped: true,
      reason: "happy",
      type: "hunger",
      mood,
      hungerScore,
      message: null,
      aquariumMood,
      calculation: notificationCalculation,
      individualAccountability: [],
    };
  }

  if (mood === "slightly_hungry" && randomPercent() >= 20) {
    return {
      sent: false,
      skipped: true,
      reason: "slightly_hungry_probability",
      type: "hunger",
      mood,
      hungerScore,
      message: null,
      aquariumMood,
      calculation: notificationCalculation,
      individualAccountability: [],
    };
  }

  const result = await sendFishNotification(env, "hunger", reason, hungerScore, mood);
  const individualAccountability = await runIndividualHungerAccountabilityNotifications(env, notificationCalculation);
  return { ...result, aquariumMood, calculation: notificationCalculation, individualAccountability };
}

async function getTodayAquariumParticipation(db: D1Database, calendar: HouseholdCalendar): Promise<AquariumParticipation> {
  const [completionRow, childRow] = await Promise.all([
    db
      .prepare(
        `SELECT
          COUNT(*) AS todayChildCount,
          COUNT(DISTINCT cc.completed_by_member_id) AS todayDistinctChildCount
         FROM chore_completions cc
         JOIN family_members fm ON fm.id = cc.completed_by_member_id
         JOIN chores c ON c.id = cc.chore_id
         WHERE fm.member_type = 'child'
          AND COALESCE(c.feeds_aquarium, 1) = 1
          AND cc.completed_at >= ?
          AND cc.completed_at < ?`,
      )
      .bind(calendar.todayStart, calendar.todayEnd)
      .first<{ todayChildCount: number; todayDistinctChildCount: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS activeChildCount
         FROM family_members
         WHERE active = 1
          AND member_type = 'child'`,
      )
      .first<{ activeChildCount: number }>(),
  ]);

  return {
    todayChildCount: completionRow?.todayChildCount ?? 0,
    todayDistinctChildCount: completionRow?.todayDistinctChildCount ?? 0,
    activeChildCount: childRow?.activeChildCount ?? 0,
  };
}

async function getCurrentAquariumMood(db: D1Database) {
  const state = await getAquariumState(db);
  const calendar = getHouseholdCalendar();
  const participation = await getTodayAquariumParticipation(db, calendar);

  return getAquariumMood(state, participation);
}

async function getFishTextActiveUntil(db: D1Database) {
  const row = await db
    .prepare(
      `SELECT datetime(created_at, '+60 seconds') AS active_until
       FROM fish_notification_history
       WHERE status = 'sent'
        AND message_body IS NOT NULL
        AND datetime(created_at) >= datetime('now', '-60 seconds')
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT 1`,
    )
    .first<FishTextActiveRow>();

  return row?.active_until ?? null;
}

async function sendCurrentAquariumModeNotification(env: Env): Promise<CurrentModeNotificationResult> {
  const aquariumMood = await getCurrentAquariumMood(env.DB);
  const mood = fishHungerMoodForAquariumMood(aquariumMood);
  const lastCurrentModeText = await env.DB
    .prepare(
      `SELECT id, message_body, created_at
       FROM fish_notification_history
       WHERE notification_type = 'test'
        AND reason = 'current_mode_button'
        AND status = 'sent'
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT 1`,
    )
    .first<FishNotificationHistoryRow>();

  if (isInsideCooldown(lastCurrentModeText, 1 / 60)) {
    await recordFishNotification(env.DB, "test", mood, 0, null, null, null, "skipped", "current_mode_cooldown");
    return {
      sent: false,
      skipped: true,
      reason: "current_mode_cooldown",
      type: "test",
      mood,
      hungerScore: 0,
      message: null,
      aquariumMood,
    };
  }

  const lastSentMessage = await getLastSentNotification(env.DB);
  const message = chooseCurrentAquariumModeMessage(aquariumMood, lastSentMessage?.message_body ?? null);
  const recipientOptions: SmsRecipientOptions = {
    onlyAdults: true,
  };

  try {
    const results = await sendTwilioSms(env, message, recipientOptions);

    for (const result of results) {
      await recordFishNotification(
        env.DB,
        "test",
        mood,
        0,
        message,
        result.recipient,
        result.providerMessageId,
        "sent",
        "current_mode_button",
        {
          providerStatus: result.providerStatus,
          diagnosticContext: {
            sms: await getSmsConfigDiagnostics(env, recipientOptions),
            provider: {
              recipient: result.recipient,
              twilioStatus: result.providerStatus,
            },
          },
        },
      );
    }

    return {
      sent: true,
      skipped: false,
      reason: "current_mode_button",
      type: "test",
      mood,
      hungerScore: 0,
      message,
      aquariumMood,
    };
  } catch (error) {
    if (error instanceof SmsQuietHoursError) {
      await recordFishNotification(env.DB, "test", mood, 0, message, null, null, "skipped", "quiet_hours", {
        diagnosticContext: error.diagnostics,
      });
      return {
        sent: false,
        skipped: true,
        reason: "quiet_hours",
        type: "test",
        mood,
        hungerScore: 0,
        message,
        aquariumMood,
        diagnostics: error.diagnostics,
      };
    }

    if (error instanceof SmsRecipientFilterError) {
      await recordFishNotification(env.DB, "test", mood, 0, message, null, null, "skipped", error.reason, {
        diagnosticContext: error.diagnostics,
      });
      return {
        sent: false,
        skipped: true,
        reason: error.reason,
        type: "test",
        mood,
        hungerScore: 0,
        message,
        aquariumMood,
        diagnostics: error.diagnostics,
      };
    }

    const failure = smsFailureDetails(error);
    await recordFishNotification(env.DB, "test", mood, 0, message, null, null, "failed", "current_mode_button", {
      errorMessage: failure.errorMessage,
      providerStatus: failure.providerStatus,
      providerStatusCode: failure.providerStatusCode,
      providerErrorCode: failure.providerErrorCode,
      providerErrorMessage: failure.providerErrorMessage,
      diagnosticContext: failure.diagnosticContext,
    });
    return {
      sent: false,
      skipped: false,
      reason: "failed",
      type: "test",
      mood,
      hungerScore: 0,
      message,
      aquariumMood,
      errorMessage: failure.errorMessage,
      diagnostics: failure.diagnosticContext,
    };
  }
}

async function ensureAquarium(db: D1Database) {
  const calendar = getHouseholdCalendar();
  await db
    .prepare(
      `INSERT OR IGNORE INTO aquarium_state
        (id, food_reserve, max_food_reserve, daily_food_consumption, last_consumed_on, total_chore_completions, creature_unlock_interval, egg_incubation_minutes, growth_days, last_fed_at)
       VALUES
        (1, 14, 30, 2, ?, COALESCE((SELECT COUNT(*) FROM chore_completions), 0), 25, ?, 7, datetime('now'))`,
    )
    .bind(calendar.todayDate, defaultEggIncubationMinutes)
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

async function applyAquariumMaintenance(db: D1Database, env?: Env) {
  await ensureAquarium(db);
  const calendar = getHouseholdCalendar();

  await db
    .prepare(
      `UPDATE aquarium_state
       SET panic_mode = 0,
           panic_chores_needed = 0,
           panic_expires_at = NULL,
           updated_at = datetime('now')
       WHERE id = 1
        AND panic_mode = 1
        AND panic_expires_at IS NOT NULL
        AND datetime(panic_expires_at) <= datetime('now')`,
    )
    .run();

  await db
    .prepare(
      `UPDATE aquarium_state
       SET food_reserve = MAX(
            0,
            food_reserve - CAST(MAX(0, julianday(?) - julianday(last_consumed_on)) AS INTEGER) * daily_food_consumption
          ),
          last_consumed_on = ?,
          updated_at = datetime('now')
       WHERE id = 1
        AND last_consumed_on < ?`,
    )
    .bind(calendar.todayDate, calendar.todayDate, calendar.todayDate)
    .run();

  const growingCreatures = await db
    .prepare(
      `SELECT id
       FROM aquarium_creatures
       WHERE growth_stage = 'baby'
        AND julianday('now') - julianday(created_at) >= (SELECT growth_days FROM aquarium_state WHERE id = 1)
        AND (SELECT food_reserve * 1.0 / max_food_reserve FROM aquarium_state WHERE id = 1) >= 0.4`,
    )
    .all<{ id: number }>();

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

  await db
    .prepare(
      `UPDATE aquarium_state
       SET everything_good_until = NULL,
           last_fed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = 1
        AND everything_good_until IS NOT NULL
        AND datetime(everything_good_until) <= datetime('now')`,
    )
    .run();

  if (env && growingCreatures.results.length > 0) {
    await sendFishNotification(env, "fish_growth", "fish_growth");
  }

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

async function getAquariumState(db: D1Database, env?: Env) {
  await applyAquariumMaintenance(db, env);

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
        last_fed_at,
        panic_mode,
        panic_chores_needed,
        panic_expires_at,
        everything_good_until
       FROM aquarium_state
       WHERE id = 1`,
    )
    .first<AquariumStateRow>();

  if (!state) {
    throw new Error("Aquarium state was not initialized.");
  }

  return state;
}

async function listAquarium(db: D1Database, env?: Env) {
  const state = await getAquariumState(db, env);
  const calendar = getHouseholdCalendar();

  const [
    creatures,
    eggs,
    events,
    todayLeaderboard,
    yesterdayLeaderboard,
    allTimeLeaderboard,
    yesterdayCompletions,
    participation,
    fishTextActiveUntil,
    todayMoodCompletions,
  ] = await Promise.all([
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
          fm.member_type,
          COUNT(cc.id) AS completed_count
         FROM family_members fm
         LEFT JOIN chore_completions cc
          ON cc.completed_by_member_id = fm.id
          AND cc.completed_at >= ?
          AND cc.completed_at < ?
         WHERE fm.active = 1
         GROUP BY fm.id
         ORDER BY completed_count DESC, fm.sort_order, member_name`,
      )
      .bind(calendar.todayStart, calendar.todayEnd)
      .all(),
    db
      .prepare(
        `SELECT
          fm.id AS member_id,
          ${publicMemberNameSql("fm")} AS member_name,
          fm.avatar_id AS member_avatar_id,
          fm.member_type,
          COUNT(cc.id) AS completed_count
         FROM family_members fm
         LEFT JOIN chore_completions cc
          ON cc.completed_by_member_id = fm.id
          AND cc.completed_at >= ?
          AND cc.completed_at < ?
         WHERE fm.active = 1
         GROUP BY fm.id
         ORDER BY completed_count DESC, fm.sort_order, member_name`,
      )
      .bind(calendar.yesterdayStart, calendar.yesterdayEnd)
      .all(),
    db
      .prepare(
        `SELECT
          fm.id AS member_id,
          ${publicMemberNameSql("fm")} AS member_name,
          fm.avatar_id AS member_avatar_id,
          fm.member_type,
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
         WHERE cc.completed_at >= ?
          AND cc.completed_at < ?
         ORDER BY cc.completed_at`,
      )
      .bind(calendar.yesterdayStart, calendar.yesterdayEnd)
      .all(),
    getTodayAquariumParticipation(db, calendar),
    getFishTextActiveUntil(db),
    db
      .prepare(
        `SELECT
          cc.id,
          fm.id AS member_id,
          ${publicMemberNameSql("fm")} AS member_name,
          fm.member_type,
          c.name AS chore_name,
          COALESCE(c.feeds_aquarium, 1) AS feeds_aquarium,
          cc.completed_at
         FROM chore_completions cc
         JOIN family_members fm ON fm.id = cc.completed_by_member_id
         JOIN chores c ON c.id = cc.chore_id
         WHERE cc.completed_at >= ?
          AND cc.completed_at < ?
         ORDER BY cc.completed_at, cc.id`,
      )
      .bind(calendar.todayStart, calendar.todayEnd)
      .all<AquariumMoodDebugCompletion>(),
  ]);

  const mood = getAquariumMood(state, participation);

  return json({
    ok: true,
    aquarium: {
      state: {
        ...state,
        mood,
        mood_message: getAquariumMoodMessage(mood, participation.todayChildCount, {
          active: state.panic_mode === 1,
          choresNeeded: state.panic_chores_needed,
        }),
        panic_mode: state.panic_mode,
        panic_chores_needed: state.panic_chores_needed,
        everything_good_until: state.everything_good_until,
        hours_since_fed: Math.round(hoursSinceAquariumFed(state)),
        fish_text_active_until: fishTextActiveUntil,
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
      moodDebug: getAquariumMoodDebug(state, participation, calendar, todayMoodCompletions.results),
    },
  });
}

async function addAquariumFoodForCompletion(
  db: D1Database,
  completionId: number,
  memberName: string,
) {
  await applyAquariumMaintenance(db);
  const calendar = getHouseholdCalendar();

  await db
    .prepare(
      `UPDATE aquarium_state
       SET food_reserve = MIN(max_food_reserve, food_reserve + 1),
           total_chore_completions = total_chore_completions + 1,
           last_fed_at = datetime('now'),
           panic_chores_needed = MAX(0, panic_chores_needed - 1),
           panic_mode = CASE WHEN panic_chores_needed <= 1 THEN 0 ELSE panic_mode END,
           panic_expires_at = CASE WHEN panic_chores_needed <= 1 THEN NULL ELSE panic_expires_at END,
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

  const [state, participation] = await Promise.all([
    getAquariumState(db),
    getTodayAquariumParticipation(db, calendar),
  ]);
  let egg: Record<string, unknown> | null = null;

  if (state.total_chore_completions > 0 && state.total_chore_completions % state.creature_unlock_interval === 0) {
    const speciesId = await nextAquariumSpeciesId(db);
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

  const mood2 = getAquariumMood(state, participation);
  return {
    fedMessage,
    state: {
      ...state,
      mood: mood2,
      mood_message: getAquariumMoodMessage(mood2, participation.todayChildCount, {
        active: state.panic_mode === 1,
        choresNeeded: state.panic_chores_needed,
      }),
      panic_mode: state.panic_mode,
      panic_chores_needed: state.panic_chores_needed,
      everything_good_until: state.everything_good_until,
    },
    egg,
  };
}

// Panic mode: immediately saddens the fish and requires 3 new child chores to lift.
async function triggerAquariumPanic(db: D1Database) {
  await ensureAquarium(db);
  await db
    .prepare(
      `UPDATE aquarium_state
       SET panic_mode = 1,
           panic_chores_needed = 3,
           panic_expires_at = datetime('now', '+4 hours'),
           everything_good_until = NULL,
           updated_at = datetime('now')
       WHERE id = 1`,
    )
    .run();
  return json({ ok: true, message: "Panic mode activated. Fish need 3 new chores to cheer up." });
}

async function clearAquariumPanic(db: D1Database) {
  await db
    .prepare(
      `UPDATE aquarium_state
       SET panic_mode = 0,
           panic_chores_needed = 0,
           panic_expires_at = NULL,
           everything_good_until = datetime('now', '+4 hours'),
           last_fed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = 1`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO aquarium_events (event_type, message)
       VALUES ('mood_reset', 'A parent gave the fish a treat — they are happy again!')`,
    )
    .run();
  return json({ ok: true, message: "Panic cleared. The fish are thriving again!" });
}

async function triggerAquariumEverythingGood(db: D1Database) {
  await ensureAquarium(db);
  await db
    .prepare(
      `UPDATE aquarium_state
       SET panic_mode = 0,
           panic_chores_needed = 0,
           panic_expires_at = NULL,
           everything_good_until = datetime('now', '+4 hours'),
           last_fed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = 1`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO aquarium_events (event_type, message)
       VALUES ('mood_reset', 'Everything looked good, so a parent made the fish happy for a while.')`,
    )
    .run();
  return json({ ok: true, message: "Everything good. The fish will stay happy for 4 hours." });
}

async function nextAquariumSpeciesId(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT species_id FROM aquarium_creatures
       UNION
       SELECT species_id FROM aquarium_eggs
       WHERE hatched_at IS NULL`,
    )
    .all<{ species_id: string }>();
  const discoveredOrPending = new Set(results.map((row) => row.species_id));

  return aquariumSpeciesIds.find((speciesId) => !discoveredOrPending.has(speciesId)) ?? "seahorse";
}

function aquariumSpeciesName(speciesId: string) {
  if (speciesId === "clownfish") return "clownfish";
  if (speciesId === "angelfish") return "angelfish";
  if (speciesId === "seahorse") return "seahorse";
  if (speciesId === "crab") return "crab";
  if (speciesId === "pufferfish") return "pufferfish";
  if (speciesId === "starfish") return "starfish";
  if (speciesId === "clam") return "clam";
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

async function listMembers(db: D1Database, includeInactive = false, includeSmsPreferences = false) {
  const smsColumns = includeSmsPreferences ? ", phone_number, receives_fish_texts, fish_text_start_time, fish_text_stop_time" : "";
  const { results } = await db
    .prepare(
      `SELECT id, display_name, nickname, avatar_id, member_type, sort_order, active, created_at, updated_at${smsColumns}
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
    0 AS is_due,
    0 AS is_overdue
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
  const calendar = getHouseholdCalendar();
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

  const chores = results.map((chore) => {
    const isDue = choreIsDue(chore.frequency_type, chore.last_completed_at, calendar);
    return {
      ...chore,
      is_due: isDue ? 1 : 0,
      is_overdue: isDue && Number(chore.alert_if_overdue) === 1 ? 1 : 0,
    };
  });

  return json({ ok: true, chores });
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
  const calendar = getHouseholdCalendar();
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
       WHERE cc.completed_at >= ?
        AND cc.completed_at < ?
       ORDER BY cc.completed_at DESC
       LIMIT 30`,
    )
    .bind(calendar.todayStart, calendar.todayEnd)
    .all();

  return json({
    ok: true,
    due: chores.filter((chore) => chore.is_due === 1 && chore.is_overdue !== 1),
    overdue: chores.filter((chore) => chore.is_overdue === 1),
    completedToday,
  });
}

async function householdStatus(db: D1Database) {
  const calendar = getHouseholdCalendar();
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
        AND cc.completed_at >= ?
        AND cc.completed_at < ?
       WHERE fm.active = 1
       GROUP BY fm.id
       ORDER BY completed_count DESC, fm.sort_order`,
    )
    .bind(calendar.weekStart, calendar.weekEnd)
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
        0 AS is_due
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
    .all<HouseholdReminderRow>();

  const reminderRowsWithDue = reminderRows.map((row) => ({
    ...row,
    is_due: choreIsDue(row.frequency_type, row.last_completed_at, calendar) ? 1 : 0,
  }));

  const totalCompletedThisWeek = weeklyRows.reduce((total, row) => total + Number(row.completed_count ?? 0), 0);
  const mostActive = weeklyRows.find((row) => Number(row.completed_count ?? 0) > 0) ?? null;
  const suggestions = reminderRowsWithDue
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
    reminders: reminderRowsWithDue,
    suggestions,
  });
}

async function recordCompletion(request: Request, env: Env, ctx: ExecutionContext) {
  const db = env.DB;
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

  if (aquariumEvent?.egg) {
    ctx.waitUntil(
      sendFishNotification(env, "new_fish", "new_fish_unlocked").catch((error) => {
        console.error("Fish celebration SMS failed", error);
      }),
    );
  }

  const storyUnlock =
    member.member_type === "child"
      ? await advanceStoryProgressForCompletion(db, memberId).catch((error) => {
          console.error("Story unlock failed", error);
          return null;
        })
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
    storyUnlock,
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
  const phoneNumber = normalizePhoneNumber(body.phone_number);
  const receivesFishTexts = asActiveFlag(body.receives_fish_texts, 0);
  const fishTextStartTime = normalizeFishTextTime(body.fish_text_start_time, defaultFishTextStartTime);
  const fishTextStopTime = normalizeFishTextTime(body.fish_text_stop_time, defaultFishTextStopTime);

  if (!displayName || !memberType) {
    return badRequest("Display name and member type are required.");
  }

  if (receivesFishTexts === 1 && !phoneNumber) {
    return badRequest("A valid phone number is required for fish text messages.");
  }

  if (id) {
    await db
      .prepare(
        `UPDATE family_members
         SET display_name = ?, nickname = ?, avatar_id = ?, member_type = ?, sort_order = ?, active = ?, phone_number = ?, receives_fish_texts = ?, fish_text_start_time = ?, fish_text_stop_time = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(displayName, nickname, avatarId, memberType, sortOrder, active, phoneNumber, receivesFishTexts, fishTextStartTime, fishTextStopTime, id)
      .run();

    return json({
      ok: true,
      member: {
        id,
        display_name: displayName,
        nickname,
        avatar_id: avatarId,
        member_type: memberType,
        sort_order: sortOrder,
        active,
        phone_number: phoneNumber,
        receives_fish_texts: receivesFishTexts,
        fish_text_start_time: fishTextStartTime,
        fish_text_stop_time: fishTextStopTime,
      },
    });
  }

  const result = await db
    .prepare(
      `INSERT INTO family_members (display_name, nickname, avatar_id, member_type, sort_order, active, phone_number, receives_fish_texts, fish_text_start_time, fish_text_stop_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(displayName, nickname, avatarId, memberType, sortOrder, active, phoneNumber, receivesFishTexts, fishTextStartTime, fishTextStopTime)
    .run();

  return json({
    ok: true,
    member: {
      id: result.meta.last_row_id,
      display_name: displayName,
      nickname,
      avatar_id: avatarId,
      member_type: memberType,
      sort_order: sortOrder,
      active,
      phone_number: phoneNumber,
      receives_fish_texts: receivesFishTexts,
      fish_text_start_time: fishTextStartTime,
      fish_text_stop_time: fishTextStopTime,
    },
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
  const [
    members,
    chores,
    assignments,
    completions,
    sessions,
    notes,
    aquariumState,
    aquariumCreatures,
    aquariumEggs,
    aquariumEvents,
    appSettings,
  ] = await Promise.all([
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
    getAppSettings(db),
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
    appSettings,
  });
}

// ---- Story engine ------------------------------------------------------
// Comic scenes unlocked by chores, paced by a per-scene release calendar.

type StorySeriesRow = {
  id: number;
  slug: string;
  title: string;
  total_scenes: number;
  start_date: string;
  status: string;
};

type StorySceneRow = {
  id: number;
  scene_order: number;
  release_offset_days: number;
  title: string;
  setting: string;
  script: string;
};

function parseDateToUtc(dateStr: string): number {
  const [y, m, d] = String(dateStr).split("-").map((part) => Number(part));
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

function daysBetween(startDate: string, todayDate: string): number {
  const start = parseDateToUtc(startDate);
  const today = parseDateToUtc(todayDate);
  if (Number.isNaN(start) || Number.isNaN(today)) return 0;
  return Math.floor((today - start) / 86400000);
}

function addDaysToDate(dateStr: string, days: number): string {
  const next = new Date(parseDateToUtc(dateStr) + days * 86400000);
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getActiveStorySeries(db: D1Database): Promise<StorySeriesRow | null> {
  return await db
    .prepare(
      "SELECT id, slug, title, total_scenes, start_date, status FROM story_series WHERE status = 'active' ORDER BY id LIMIT 1",
    )
    .first<StorySeriesRow>();
}

async function getStorySceneRows(db: D1Database, seriesId: number): Promise<StorySceneRow[]> {
  const { results } = await db
    .prepare(
      "SELECT id, scene_order, release_offset_days, title, setting, script FROM story_scenes WHERE series_id = ? ORDER BY scene_order",
    )
    .bind(seriesId)
    .all<StorySceneRow>();
  return results ?? [];
}

async function getStorySeriesRows(db: D1Database): Promise<StorySeriesRow[]> {
  const { results } = await db
    .prepare("SELECT id, slug, title, total_scenes, start_date, status FROM story_series ORDER BY status = 'active' DESC, id")
    .all<StorySeriesRow>();
  return results ?? [];
}

// Story progress is shared by the whole household: the pointer is the MAX
// unlocked_index across all active children.
async function getHouseholdUnlockedIndex(db: D1Database, seriesId: number): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(MAX(sp.unlocked_index), 1) AS unlocked_index
       FROM story_progress sp
       JOIN family_members fm ON fm.id = sp.member_id
       WHERE sp.series_id = ?
        AND fm.member_type = 'child'
        AND fm.active = 1`,
    )
    .bind(seriesId)
    .first<{ unlocked_index: number }>();
  return Math.max(1, Number(row?.unlocked_index ?? 1));
}

function parseSceneScript(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return { narration: "", beats: [] };
  }
}

function countReleasedScenes(scenes: StorySceneRow[], daysSinceStart: number): number {
  return scenes.filter((scene) => scene.release_offset_days <= daysSinceStart).length;
}

// memberId is accepted for API compatibility; progress is household-shared.
async function getStoryForMember(db: D1Database, _memberId: number | null) {
  const series = await getActiveStorySeries(db);
  if (!series) {
    return {
      ok: true,
      series: null,
      releasedCount: 0,
      accessibleCount: 0,
      totalScenes: 0,
      nextReleaseDate: null,
      canUnlockMore: false,
      scenes: [],
    };
  }

  const calendar = getHouseholdCalendar();
  const scenes = await getStorySceneRows(db, series.id);
  // Two clocks: the release calendar gates the frontier (nobody can binge past it),
  // and the per-member chore clock gates how far each member has caught up to it.
  const daysSinceStart = daysBetween(series.start_date, calendar.todayDate);
  const releasedCount = Math.max(1, Math.min(scenes.length, countReleasedScenes(scenes, daysSinceStart)));
  // Progress is household-shared, so every member (and the communal aquarium
  // page) sees the same story position regardless of memberId.
  const unlocked = await getHouseholdUnlockedIndex(db, series.id);
  const accessibleCount = Math.min(releasedCount, Math.max(unlocked, 1));
  const nextScene = scenes.find((scene) => scene.release_offset_days > daysSinceStart);
  const nextReleaseDate = nextScene ? addDaysToDate(series.start_date, nextScene.release_offset_days) : null;

  const accessibleScenes = scenes.slice(0, accessibleCount).map((scene) => ({
    scene_order: scene.scene_order,
    title: scene.title,
    setting: scene.setting,
    script: parseSceneScript(scene.script),
  }));

  return {
    ok: true,
    series: { slug: series.slug, title: series.title, total_scenes: series.total_scenes || scenes.length },
    releasedCount,
    accessibleCount,
    totalScenes: scenes.length,
    nextReleaseDate,
    canUnlockMore: accessibleCount < releasedCount,
    scenes: accessibleScenes,
  };
}

// Story unlock rule: each UNIQUE child who completes at least one chore today
// unlocks one scene for the household. The trigger is the child's FIRST chore
// of the day — extra chores by the same child do not unlock more scenes. With
// N active children, at most N scenes can unlock per day, and the release
// calendar (frontier) still caps everything, so nobody can binge ahead.
// Progress is household-shared. (docs/features/STORY_ENGINE.md §mechanic)
async function advanceStoryProgressForCompletion(db: D1Database, memberId: number) {
  const series = await getActiveStorySeries(db);
  if (!series) return null;

  const calendar = getHouseholdCalendar();
  const scenes = await getStorySceneRows(db, series.id);
  if (scenes.length === 0) return null;

  const daysSinceStart = daysBetween(series.start_date, calendar.todayDate);
  const releasedCount = Math.max(1, Math.min(scenes.length, countReleasedScenes(scenes, daysSinceStart)));

  // This runs AFTER the completion insert, so a count of exactly 1 means this
  // was the member's first completed chore of the day.
  const todayCountRow = await db
    .prepare(
      `SELECT COUNT(*) AS completed_count
       FROM chore_completions
       WHERE completed_by_member_id = ?
        AND completed_at >= ?
        AND completed_at < ?`,
    )
    .bind(memberId, calendar.todayStart, calendar.todayEnd)
    .first<{ completed_count: number }>();
  const isFirstChoreToday = Number(todayCountRow?.completed_count ?? 0) === 1;

  const previousIndex = await getHouseholdUnlockedIndex(db, series.id);

  if (!isFirstChoreToday || previousIndex >= releasedCount) {
    return {
      seriesSlug: series.slug,
      unlockedIndex: Math.min(previousIndex, releasedCount),
      releasedCount,
      caughtUp: previousIndex >= releasedCount,
      newlyUnlocked: false,
    };
  }

  // Advance the household pointer by one scene. The new index is computed
  // inside the statement so two children unlocking near-simultaneously are
  // each counted (D1 serializes statements).
  await db
    .prepare(
      `INSERT INTO story_progress (member_id, series_id, unlocked_index, last_unlocked_at)
       VALUES (
         ?, ?,
         MIN(
           ?,
           1 + (SELECT COALESCE(MAX(sp.unlocked_index), 1)
                FROM story_progress sp
                JOIN family_members fm ON fm.id = sp.member_id
                WHERE sp.series_id = ?
                 AND fm.member_type = 'child'
                 AND fm.active = 1)
         ),
         datetime('now')
       )
       ON CONFLICT(member_id, series_id)
       DO UPDATE SET unlocked_index = MAX(story_progress.unlocked_index, excluded.unlocked_index),
                     last_unlocked_at = datetime('now')`,
    )
    .bind(memberId, series.id, releasedCount, series.id)
    .run();

  const unlockedIndex = await getHouseholdUnlockedIndex(db, series.id);

  return {
    seriesSlug: series.slug,
    unlockedIndex,
    releasedCount,
    caughtUp: unlockedIndex >= releasedCount,
    newlyUnlocked: unlockedIndex > previousIndex,
  };
}

async function getAllStoryScenes(db: D1Database, slug: string | null) {
  const seriesList = await getStorySeriesRows(db);
  const series = slug
    ? seriesList.find((storySeries) => storySeries.slug === slug) ?? null
    : seriesList.find((storySeries) => storySeries.status === "active") ?? seriesList[0] ?? null;
  if (!series) return { ok: true, series: null, seriesList: [], scenes: [] };
  const scenes = await getStorySceneRows(db, series.id);
  return {
    ok: true,
    series: { slug: series.slug, title: series.title, total_scenes: series.total_scenes || scenes.length, status: series.status },
    seriesList: seriesList.map((storySeries) => ({
      slug: storySeries.slug,
      title: storySeries.title,
      total_scenes: storySeries.total_scenes,
      status: storySeries.status,
    })),
    scenes: scenes.map((scene) => ({
      scene_order: scene.scene_order,
      title: scene.title,
      setting: scene.setting,
      script: parseSceneScript(scene.script),
    })),
  };
}

async function handleApiRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

    if (request.method === "GET" && url.pathname === "/api/settings") {
      return listAppSettings(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/aquarium") {
      return listAquarium(env.DB, env);
    }

    if (request.method === "GET" && url.pathname === "/api/notes") {
      return listNotes(env.DB);
    }

    if (request.method === "POST" && url.pathname === "/api/notes") {
      return saveNote(request, env.DB, null);
    }

    if (request.method === "POST" && url.pathname === "/api/fish-notifications/current-mode") {
      // Always require the parent PIN — test mode must not open an
      // unauthenticated SMS-sending endpoint to the internet.
      if (!requireParentPin(request, env)) {
        return unauthorized();
      }

      const result = await sendCurrentAquariumModeNotification(env);
      if (!result.sent && !result.skipped) {
        return json({ ok: false, error: result.errorMessage ?? "Text send failed.", result }, { status: 500 });
      }

      return json({ ok: true, result });
    }

    if (request.method === "POST" && url.pathname === "/api/completions") {
      return recordCompletion(request, env, ctx);
    }

    if (request.method === "GET" && url.pathname === "/api/completions/recent") {
      return recentCompletions(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/story/scenes") {
      return json(await getAllStoryScenes(env.DB, url.searchParams.get("slug")));
    }

    if (request.method === "GET" && url.pathname === "/api/story") {
      const memberIdParam = url.searchParams.get("memberId");
      const memberId = memberIdParam ? asPositiveInteger(memberIdParam) : null;
      return json(await getStoryForMember(env.DB, memberId));
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
      return listMembers(env.DB, true, true);
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

    if (request.method === "PUT" && url.pathname === "/api/admin/settings") {
      return saveAppSettings(request, env.DB);
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

    if (request.method === "POST" && url.pathname === "/api/admin/aquarium-panic") {
      return triggerAquariumPanic(env.DB);
    }

    if (request.method === "DELETE" && url.pathname === "/api/admin/aquarium-panic") {
      return clearAquariumPanic(env.DB);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/aquarium-everything-good") {
      return triggerAquariumEverythingGood(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/admin/fish-notifications/status") {
      const calculation = await calculateHungerScore(env.DB);
      return json({
        ok: true,
        sms: {
          enabled: envFlag(env.SMS_ENABLED, true),
          testMode: await isTestModeEnabled(env),
          recipients: await smsRecipients(env),
          diagnostics: await getSmsConfigDiagnostics(env),
        },
        hunger: calculation,
      });
    }

    if (request.method === "POST" && url.pathname === "/api/admin/fish-notifications/run") {
      const result = await runFishHungerNotification(env, "manual_run");
      return json({ ok: true, result });
    }

    if (request.method === "POST" && url.pathname === "/api/admin/fish-notifications/rewards/run") {
      const result = await runFishRewardThankYouNotifications(env, "manual_run");
      return json({ ok: true, result });
    }

    if (request.method === "POST" && url.pathname === "/api/admin/fish-notifications/test") {
      const result = await sendFishNotification(env, "test", "manual_test");
      return json({ ok: true, result });
    }

    if (request.method === "GET" && url.pathname === "/api/admin/export") {
      return exportData(env.DB);
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Catch-all so unhandled errors return JSON with CORS headers instead of
    // an opaque 500 the browser reports as a network failure.
    try {
      return await handleApiRequest(request, env, ctx);
    } catch (error) {
      console.error("Unhandled API error:", error);
      return json({ ok: false, error: "Internal server error." }, { status: 500 });
    }
  },
  // Hourly cron: fish hunger + reward thank-you notifications.
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        await runFishHungerNotification(env);
        await runFishRewardThankYouNotifications(env);
      })().catch((error) => {
        console.error("Scheduled fish SMS failed", error);
      }),
    );
  },
};
