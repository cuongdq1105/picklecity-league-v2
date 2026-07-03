import { json, adminOk, getOpenTournament } from '../_utils.js';
export async function onRequestGet({ request, env }) {
  if (!adminOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401);
  try {
    const tournament = await getOpenTournament(env);
    if (!tournament) return json({ ok: true, registrations: [], stats: { total: 0, confirmed: 0, pending: 0 } });
    const rs = await env.DB.prepare(`
      SELECT r.id AS registration_id, r.payment_status, r.payment_amount, r.note, r.created_at,
             m.id AS member_id, m.full_name, m.phone, m.gender, m.level_group, m.level_score
      FROM registrations r
      JOIN members m ON m.id = r.member_id
      WHERE r.tournament_id=?
      ORDER BY r.id DESC
    `).bind(tournament.id).all();
    const registrations = rs.results || [];
    const total = registrations.length;
    const confirmed = registrations.filter(x => x.payment_status === 'BTC_CONFIRMED').length;
    return json({ ok: true, tournament, registrations, stats: { total, confirmed, pending: total - confirmed } });
  } catch (e) {
    return json({ ok: false, error: e.message, registrations: [] }, 500);
  }
}
