interface Env {
  DB: D1Database;
  PARENT_PIN?: string;
}

type SessionMode = "member" | "kiosk" | "admin";
type MemberType = "adult" | "child";
type FrequencyType = "daily" | "weekly" | "monthly" | "as_needed";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Parent-Pin",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
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

const isSessionMode = (value: unknown): value is SessionMode =>
  value === "member" || value === "kiosk" || value === "admin";

const isMemberType = (value: unknown): value is MemberType => value === "adult" || value === "child";

const isFrequencyType = (value: unknown): value is FrequencyType =>
  value === "daily" || value === "weekly" || value === "monthly" || value === "as_needed";

const requireParentPin = (request: Request, env: Env) => {
  const expectedPin = env.PARENT_PIN ?? "1234";
  return request.headers.get("X-Parent-Pin") === expectedPin;
};

const getActiveMember = (db: D1Database, id: number) =>
  db
    .prepare("SELECT id, display_name FROM family_members WHERE id = ? AND active = 1")
    .bind(id)
    .first<{ id: number; display_name: string }>();

const getActiveChore = (db: D1Database, id: number) =>
  db
    .prepare("SELECT id, name FROM chores WHERE id = ? AND active = 1")
    .bind(id)
    .first<{ id: number; name: string }>();

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
      `SELECT id, display_name, member_type, sort_order, active, created_at, updated_at
       FROM family_members
       ${includeInactive ? "" : "WHERE active = 1"}
       ORDER BY sort_order, display_name`,
    )
    .all();

  return json({ ok: true, members: results });
}

async function listChores(db: D1Database, includeInactive = false) {
  const { results } = await db
    .prepare(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.frequency_type,
        c.assigned_member_id,
        assignee.display_name AS assigned_member_name,
        c.alert_if_overdue,
        COALESCE(c.needs_reminder, 0) AS needs_reminder,
        c.active,
        c.created_at,
        c.updated_at,
        lc.completed_at AS last_completed_at,
        fm.display_name AS last_completed_by,
        CASE
          WHEN c.frequency_type = 'daily'
            THEN lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime')
          WHEN c.frequency_type = 'weekly'
            THEN lc.completed_at IS NULL OR strftime('%Y-%W', lc.completed_at, 'localtime') < strftime('%Y-%W', 'now', 'localtime')
          WHEN c.frequency_type = 'monthly'
            THEN lc.completed_at IS NULL OR strftime('%Y-%m', lc.completed_at, 'localtime') < strftime('%Y-%m', 'now', 'localtime')
          ELSE 0
        END AS is_due,
        CASE
          WHEN c.frequency_type IN ('daily', 'weekly', 'monthly')
            AND c.alert_if_overdue = 1
            AND (lc.completed_at IS NULL
              OR (c.frequency_type = 'daily' AND date(lc.completed_at, 'localtime') < date('now', 'localtime'))
              OR (c.frequency_type = 'weekly' AND strftime('%Y-%W', lc.completed_at, 'localtime') < strftime('%Y-%W', 'now', 'localtime'))
              OR (c.frequency_type = 'monthly' AND strftime('%Y-%m', lc.completed_at, 'localtime') < strftime('%Y-%m', 'now', 'localtime')))
          THEN 1
          ELSE 0
        END AS is_overdue
       FROM chores c
       LEFT JOIN family_members assignee ON assignee.id = c.assigned_member_id
       LEFT JOIN (
        SELECT chore_id, completed_by_member_id, MAX(completed_at) AS completed_at
        FROM chore_completions
        GROUP BY chore_id
       ) lc ON lc.chore_id = c.id
       LEFT JOIN family_members fm ON fm.id = lc.completed_by_member_id
       ${includeInactive ? "" : "WHERE c.active = 1"}
       ORDER BY c.active DESC,
        CASE c.frequency_type
          WHEN 'daily' THEN 1
          WHEN 'weekly' THEN 2
          WHEN 'monthly' THEN 3
          ELSE 4
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
        fm.display_name AS member_name,
        c.name AS chore_name,
        cc.completed_at,
        ds.mode AS session_mode,
        ds.device_label
       FROM chore_completions cc
       JOIN family_members fm ON fm.id = cc.completed_by_member_id
       JOIN chores c ON c.id = cc.chore_id
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
        fm.display_name AS member_name,
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
        fm.display_name AS last_completed_by,
        CASE
          WHEN c.frequency_type = 'daily'
            THEN lc.completed_at IS NULL OR date(lc.completed_at, 'localtime') < date('now', 'localtime')
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

  const [member, chore] = await Promise.all([
    getActiveMember(db, memberId),
    getActiveChore(db, choreId),
  ]);

  if (!member) {
    return badRequest("Member was not found.");
  }

  if (!chore) {
    return badRequest("Chore was not found.");
  }

  const completionSessionId =
    deviceSessionId ?? (await createDeviceSession(db, sessionMode, sessionMode === "member" ? memberId : null, deviceLabel));

  const result = await db
    .prepare(
      `INSERT INTO chore_completions
        (chore_id, completed_by_member_id, device_session_id, notes, points)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(choreId, memberId, completionSessionId, notes, points)
    .run();

  return json({
    ok: true,
    completion: {
      id: result.meta.last_row_id,
      choreId,
      memberId,
      deviceSessionId: completionSessionId,
    },
  });
}

async function recentCompletions(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT
        cc.id,
        fm.display_name AS member_name,
        c.name AS chore_name,
        cc.completed_at,
        ds.mode AS session_mode,
        ds.device_label,
        cc.notes
       FROM chore_completions cc
       JOIN family_members fm ON fm.id = cc.completed_by_member_id
       JOIN chores c ON c.id = cc.chore_id
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
         SET display_name = ?, member_type = ?, sort_order = ?, active = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(displayName, memberType, sortOrder, active, id)
      .run();

    return json({ ok: true, member: { id, display_name: displayName, member_type: memberType, sort_order: sortOrder, active } });
  }

  const result = await db
    .prepare(
      `INSERT INTO family_members (display_name, member_type, sort_order, active)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(displayName, memberType, sortOrder, active)
    .run();

  return json({
    ok: true,
    member: { id: result.meta.last_row_id, display_name: displayName, member_type: memberType, sort_order: sortOrder, active },
  });
}

async function saveChore(request: Request, db: D1Database, id: number | null) {
  const body = await readJson(request);
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 500) : null;
  const frequencyType = isFrequencyType(body.frequency_type) ? body.frequency_type : null;
  const assignedMemberId = asPositiveInteger(body.assigned_member_id);
  const alertIfOverdue = asActiveFlag(body.alert_if_overdue, 0);
  const needsReminder = asActiveFlag(body.needs_reminder, 0);
  const active = asActiveFlag(body.active);

  if (!name || !frequencyType) {
    return badRequest("Chore name and frequency type are required.");
  }

  if (assignedMemberId) {
    const member = await getActiveMember(db, assignedMemberId);
    if (!member) return badRequest("Assigned member was not found.");
  }

  if (id) {
    await db
      .prepare(
        `UPDATE chores
         SET name = ?,
             description = ?,
             frequency_type = ?,
             assigned_member_id = ?,
             alert_if_overdue = ?,
             needs_reminder = ?,
             active = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(name, description, frequencyType, assignedMemberId, alertIfOverdue, needsReminder, active, id)
      .run();

    return json({ ok: true, chore: { id, name, description, frequency_type: frequencyType, assigned_member_id: assignedMemberId, alert_if_overdue: alertIfOverdue, needs_reminder: needsReminder, active } });
  }

  const result = await db
    .prepare(
      `INSERT INTO chores
        (name, description, frequency_type, assigned_member_id, alert_if_overdue, needs_reminder, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(name, description, frequencyType, assignedMemberId, alertIfOverdue, needsReminder, active)
    .run();

  return json({
    ok: true,
    chore: { id: result.meta.last_row_id, name, description, frequency_type: frequencyType, assigned_member_id: assignedMemberId, alert_if_overdue: alertIfOverdue, needs_reminder: needsReminder, active },
  });
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

async function exportData(db: D1Database) {
  const [members, chores, completions, sessions, notes] = await Promise.all([
    db.prepare("SELECT * FROM family_members ORDER BY sort_order, id").all(),
    db.prepare("SELECT * FROM chores ORDER BY active DESC, id").all(),
    db.prepare("SELECT * FROM chore_completions ORDER BY completed_at DESC, id DESC LIMIT 1000").all(),
    db.prepare("SELECT id, mode, member_id, device_label, created_at, last_seen_at FROM device_sessions ORDER BY last_seen_at DESC LIMIT 500").all(),
    db.prepare("SELECT * FROM household_notes ORDER BY updated_at DESC, id DESC").all(),
  ]);

  return json({
    ok: true,
    exportedAt: new Date().toISOString(),
    members: members.results,
    chores: chores.results,
    completions: completions.results,
    deviceSessions: sessions.results,
    notes: notes.results,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const memberMatch = url.pathname.match(/^\/api\/admin\/members\/(\d+)$/);
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

    if (request.method === "GET" && url.pathname === "/api/today") {
      return todayView(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      return householdStatus(env.DB);
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
      return listMembers(env.DB, true);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/members") {
      return saveMember(request, env.DB, null);
    }

    if (request.method === "PUT" && memberMatch) {
      return saveMember(request, env.DB, Number(memberMatch[1]));
    }

    if (request.method === "GET" && url.pathname === "/api/admin/chores") {
      return listChores(env.DB, true);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/chores") {
      return saveChore(request, env.DB, null);
    }

    if (request.method === "PUT" && choreMatch) {
      return saveChore(request, env.DB, Number(choreMatch[1]));
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

    if (request.method === "GET" && url.pathname === "/api/admin/export") {
      return exportData(env.DB);
    }

    return json({ ok: false, error: "Not found" }, { status: 404 });
  },
};
