import { json, ensureRegistrationsColumns, getMemberTable, getRegistrationMemberCol, openTournament } from './_utils.js';

function maskPhone(phone='') {
  const s = String(phone);
  if (s.length <= 6) return s;
  return s.slice(0, 4) + '***' + s.slice(-3);
}

export async function onRequestGet({ env }) {
  try {
    await ensureRegistrationsColumns(env);
    const tournament = await openTournament(env);
    if (!tournament) return json({ ok: true, registrations: [] });

    const memberTable = await getMemberTable(env);
    const memberCol = await getRegistrationMemberCol(env);

    const rows = await env.DB.prepare(`
      SELECT
        r.id AS registration_id,
        r.payment_status,
        r.created_at,
        m.full_name,
        m.phone,
        m.gender
      FROM registrations r
      LEFT JOIN ${memberTable} m ON m.id = r.${memberCol}
      WHERE r.tournament_id = ?
        AND COALESCE(r.status, 'ACTIVE') != 'CANCELLED'
      ORDER BY r.id DESC
    `).bind(tournament.id).all();

    const registrations = (rows.results || []).map(x => ({
      registration_id: x.registration_id,
      full_name: x.full_name,
      phone_masked: maskPhone(x.phone),
      gender: x.gender,
      payment_status: x.payment_status,
      created_at: x.created_at
    }));

    return json({ ok: true, tournament, registrations });
  } catch (e) {
    return json({ ok: false, error: e.message, registrations: [] }, { status: 500 });
  }
}
