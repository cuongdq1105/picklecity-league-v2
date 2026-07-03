import { json, getOpenTournament } from './_utils.js';
export async function onRequestGet({ env }) {
  try {
    const tournament = await getOpenTournament(env);
    if (!tournament) return json({ ok: true, tournament: null, registrations: [], stats: { total: 0, confirmed: 0, pending: 0 } });

    const rs = await env.DB.prepare(`
      SELECT r.id AS registration_id, r.payment_status, r.payment_amount, r.created_at,
             m.full_name, m.phone, m.gender
      FROM registrations r
      JOIN members m ON m.id = r.member_id
      WHERE r.tournament_id = ?
      ORDER BY r.id DESC
    `).bind(tournament.id).all();

    const registrations = (rs.results || []).map(x => ({
      ...x,
      phone_masked: x.phone ? x.phone.slice(0, 4) + '***' + x.phone.slice(-3) : ''
    }));
    const total = registrations.length;
    const confirmed = registrations.filter(x => x.payment_status === 'BTC_CONFIRMED').length;
    return json({ ok: true, tournament, registrations, stats: { total, confirmed, pending: total - confirmed } });
  } catch (e) {
    return json({ ok: false, error: e.message, registrations: [] }, 500);
  }
}
