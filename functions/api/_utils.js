
export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export async function tableColumns(env, table) {
  const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  return (info.results || []).map(c => c.name);
}

export async function ensureRegistrationsColumns(env) {
  const cols = await tableColumns(env, "registrations");
  const needed = [
    ["status", "TEXT DEFAULT 'ACTIVE'"],
    ["note", "TEXT"],
    ["updated_at", "TEXT"]
  ];
  for (const [name, ddl] of needed) {
    if (!cols.includes(name)) {
      try { await env.DB.prepare(`ALTER TABLE registrations ADD COLUMN ${name} ${ddl}`).run(); } catch(e) {}
    }
  }
}

export async function getMemberTable(env) {
  const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const names = (tables.results || []).map(t => t.name);
  if (names.includes("members")) return "members";
  if (names.includes("players")) return "players";
  return "members";
}

export async function getRegistrationMemberCol(env) {
  const cols = await tableColumns(env, "registrations");
  if (cols.includes("member_id")) return "member_id";
  if (cols.includes("player_id")) return "player_id";
  return "member_id";
}

export async function openTournament(env) {
  return await env.DB.prepare(`
    SELECT t.*, e.name AS event_name
    FROM tournaments t
    LEFT JOIN event_types e ON e.id = t.event_type_id
    WHERE t.status='OPEN'
    ORDER BY t.id DESC
    LIMIT 1
  `).first();
}
