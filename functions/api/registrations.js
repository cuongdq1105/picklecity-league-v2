import { json, getMemberConfig, getOpenTournament } from './_util.js';

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'Missing DB binding', registrations: [] });

    const tournament = await getOpenTournament(env.DB);
    if (!tournament) return json({ ok: true, registrations: [] });

    const { memberTable, memberIdColumn } = await getMemberConfig(env.DB);

    const rs = await env.DB.prepare(`
      SELECT
        r.id AS registration_id,
        r.payment_status,
        r.payment_amount,
        r.created_at,
        m.full_name,
        m.phone,
        m.gender,
        COALESCE(m.level_group, 'UNRANKED') AS level_group
      FROM registrations r
      LEFT JOIN ${memberTable} m ON m.id = r.${memberIdColumn}
      WHERE r.tournament_id = ?
      ORDER BY r.id DESC
    `).bind(tournament.id).all();

    return json({ ok: true, registrations: rs.results || [] });
  } catch (e) {
    return json({ ok: false, error: e.message || String(e), registrations: [] });
  }
}
