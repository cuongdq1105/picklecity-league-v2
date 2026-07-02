import { json, getMemberConfig, getOpenTournament, normalizePhone } from './_util.js';

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'Missing DB binding' }, { status: 500 });

    const body = await request.json();
    const fullName = String(body.full_name || '').trim();
    const phone = normalizePhone(body.phone);
    const gender = body.gender || 'male';
    const markedPaid = !!body.marked_paid;

    if (!fullName || !phone) {
      return json({ ok: false, error: 'Vui lòng nhập họ tên và số điện thoại.' }, { status: 400 });
    }

    const tournament = await getOpenTournament(env.DB);
    if (!tournament) return json({ ok: false, error: 'Hiện chưa có giải đang mở đăng ký.' }, { status: 400 });

    const { memberTable, memberIdColumn } = await getMemberConfig(env.DB);

    let member = await env.DB.prepare(`SELECT * FROM ${memberTable} WHERE phone = ?`).bind(phone).first();

    if (!member) {
      await env.DB.prepare(`
        INSERT INTO ${memberTable} (full_name, phone, gender, level_group, level_score)
        VALUES (?, ?, ?, 'UNRANKED', 1000)
      `).bind(fullName, phone, gender).run();
      member = await env.DB.prepare(`SELECT * FROM ${memberTable} WHERE phone = ?`).bind(phone).first();
    } else {
      await env.DB.prepare(`UPDATE ${memberTable} SET full_name = ?, gender = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(fullName, gender, member.id).run().catch(async () => {
          await env.DB.prepare(`UPDATE ${memberTable} SET full_name = ?, gender = ? WHERE id = ?`).bind(fullName, gender, member.id).run();
        });
    }

    const existing = await env.DB.prepare(`
      SELECT * FROM registrations WHERE tournament_id = ? AND ${memberIdColumn} = ? LIMIT 1
    `).bind(tournament.id, member.id).first();

    const status = markedPaid ? 'PLAYER_MARKED_PAID' : 'PENDING';

    if (existing) {
      await env.DB.prepare(`UPDATE registrations SET payment_status = ?, payment_amount = ? WHERE id = ?`)
        .bind(status, tournament.fee || 150000, existing.id).run();
      return json({ ok: true, updated: true, registration_id: existing.id });
    }

    const result = await env.DB.prepare(`
      INSERT INTO registrations (tournament_id, ${memberIdColumn}, payment_amount, payment_status)
      VALUES (?, ?, ?, ?)
    `).bind(tournament.id, member.id, tournament.fee || 150000, status).run();

    return json({ ok: true, registration_id: result.meta?.last_row_id || null });
  } catch (e) {
    return json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
