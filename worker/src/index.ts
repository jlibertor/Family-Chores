interface Env {
  DB: D1Database;
}

type SessionMode = "member" | "kiosk" | "admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
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

const isSessionMode = (value: unknown): value is SessionMode =>
  value === "member" || value === "kiosk" || value === "admin";

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

async function listMembers(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT id, display_name, member_type, sort_order, active, created_at, updated_at
       FROM family_members
       WHERE active = 1
       ORDER BY sort_order, display_name`,
    )
    .all();

  return json({ ok: true, members: results });
}

async function listChores(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.frequency_type,
        c.assigned_member_id,
        c.alert_if_overdue,
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
       ORDER BY
        CASE c.frequency_type
          WHEN 'daily' THEN 1
          WHEN 'weekly' THEN 2
          ELSE 3
        END,
        c.name`,
    )
    .all();

  return json({ ok: true, chores: results });
}

async function recordCompletion(request: Request, db: D1Database) {
  const body = await readJson(request);
  const memberId = asPositiveInteger(body.memberId);
  const choreId = asPositiveInteger(body.choreId);
  const deviceSessionId = asPositiveInteger(body.deviceSessionId);
  const sessionMode = isSessionMode(body.sessionMode) ? body.sessionMode : "member";
  const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 80) : null;
  const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

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
        (chore_id, completed_by_member_id, device_session_id, notes)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(choreId, memberId, completionSessionId, notes)
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
       LIMIT 25`,
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "family-chores-api",
        phase: "phase-2-core-workflow",
      });
    }

    if (request.method === "GET" && url.pathname === "/api/members") {
      return listMembers(env.DB);
    }

    if (request.method === "GET" && url.pathname === "/api/chores") {
      return listChores(env.DB);
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

    return json({ ok: false, error: "Not found" }, { status: 404 });
  },
};
