import { json, adminOk } from '../_utils.js';
export async function onRequestPost({ request, env }) {
  if (!adminOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const allowed = ['UNRANKED','A+','A','B+','B','C'];
    const level = allowed.includes(body.level_group) ? body.level_group : 'UNRANKED';
    await env.DB.prepare('UPDATE members SET level_group=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(level, body.member_id).run();
    return json({ ok: true });
  } catch (e) { return json({ ok: false, error: e.message }, 500); }
}
