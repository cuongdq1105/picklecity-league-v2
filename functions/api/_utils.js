
export function json(data, init = {}) {
  return new Response(JSON.stringify(data), { ...init, headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) } });
}
export async function cols(env, table) {
  const r = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  return (r.results || []).map(x => x.name);
}
export async function ensureColumns(env) {
  const rc = await cols(env, "registrations");
  if (!rc.includes("status")) { try { await env.DB.prepare("ALTER TABLE registrations ADD COLUMN status TEXT DEFAULT 'ACTIVE'").run(); } catch(e) {} }
  if (!rc.includes("updated_at")) { try { await env.DB.prepare("ALTER TABLE registrations ADD COLUMN updated_at TEXT").run(); } catch(e) {} }
  const mc = await cols(env, "members");
  if (!mc.includes("updated_at")) { try { await env.DB.prepare("ALTER TABLE members ADD COLUMN updated_at TEXT").run(); } catch(e) {} }
  if (!mc.includes("level_score")) { try { await env.DB.prepare("ALTER TABLE members ADD COLUMN level_score INTEGER DEFAULT 1000").run(); } catch(e) {} }
  if (!mc.includes("level_group")) { try { await env.DB.prepare("ALTER TABLE members ADD COLUMN level_group TEXT DEFAULT 'UNRANKED'").run(); } catch(e) {} }
}
export async function openTournament(env) {
  return await env.DB.prepare(`SELECT t.*, e.name AS event_name FROM tournaments t LEFT JOIN event_types e ON e.id=t.event_type_id WHERE t.status='OPEN' ORDER BY t.id DESC LIMIT 1`).first();
}
export async function memberColumn(env) {
  const rc = await cols(env, "registrations");
  return rc.includes("member_id") ? "member_id" : "player_id";
}
