export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {})
    }
  });
}

export async function getTables(DB) {
  const rs = await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  return (rs.results || []).map(r => r.name);
}

export async function tableColumns(DB, tableName) {
  const rs = await DB.prepare(`PRAGMA table_info(${tableName})`).all();
  return (rs.results || []).map(r => r.name);
}

export async function getMemberConfig(DB) {
  const tables = await getTables(DB);
  const memberTable = tables.includes('members') ? 'members' : (tables.includes('players') ? 'players' : 'members');
  const regCols = tables.includes('registrations') ? await tableColumns(DB, 'registrations') : [];
  const memberIdColumn = regCols.includes('member_id') ? 'member_id' : (regCols.includes('player_id') ? 'player_id' : 'member_id');
  return { tables, memberTable, memberIdColumn };
}

export async function getOpenTournament(DB) {
  return await DB.prepare(`
    SELECT t.*, e.name AS event_name
    FROM tournaments t
    LEFT JOIN event_types e ON e.id = t.event_type_id
    WHERE t.status='OPEN'
    ORDER BY t.id DESC
    LIMIT 1
  `).first();
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}
