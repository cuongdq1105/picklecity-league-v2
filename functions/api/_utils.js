export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export function adminOk(request, env) {
  const expected = env.ADMIN_KEY || 'PTC2026';
  const got = request.headers.get('x-admin-key') || '';
  return got === expected;
}

export async function getOpenTournament(env) {
  return await env.DB.prepare(`
    SELECT t.*, e.name AS event_name, e.code AS event_code
    FROM tournaments t
    LEFT JOIN event_types e ON e.id = t.event_type_id
    WHERE t.status='OPEN'
    ORDER BY t.id DESC
    LIMIT 1
  `).first();
}
