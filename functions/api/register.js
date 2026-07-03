import { json, ensureRegistrationsColumns, getMemberTable, getRegistrationMemberCol, openTournament } from './_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    await ensureRegistrationsColumns(env);
    const body = await request.json();
    const fullName = String(body.full_name || '').trim();
    const phone = String(body.phone || '').trim();
    const gender = body.gender || 'male';

    if (!fullName || !phone) return json({ ok: false, error: "Thiếu họ tên hoặc số điện thoại" }, { status: 400 });

    const tournament = await openTournament(env);
    if (!tournament) return json({ ok: false, error: "Hiện chưa có giải đang mở" }, { status: 400 });

    const memberTable = await getMemberTable(env);
    const memberCol = await getRegistrationMemberCol(env);

    let member = await env.DB.prepare(`SELECT * FROM ${memberTable} WHERE phone = ?`).bind(phone).first();
    if (!member) {
      await env.DB.prepare(`
        INSERT INTO ${memberTable} (full_name, phone, gender, level_group, level_score)
        VALUES (?, ?, ?, 'UNRANKED', 1000)
      `).bind(fullName, phone, gender).run();
      member = await env.DB.prepare(`SELECT * FROM ${memberTable} WHERE phone = ?`).bind(phone).first();
    } else {
      await env.DB.prepare(`UPDATE ${memberTable} SET full_name=?, gender=? WHERE id=?`)
        .bind(fullName, gender, member.id).run();
    }

    const existing = await env.DB.prepare(`
      SELECT id FROM registrations
      WHERE tournament_id=? AND ${memberCol}=? AND COALESCE(status, 'ACTIVE') != 'CANCELLED'
      LIMIT 1
    `).bind(tournament.id, member.id).first();

    if (existing) return json({ ok: false, error: "Số điện thoại này đã đăng ký giải này rồi." }, { status: 409 });

    await env.DB.prepare(`
      INSERT INTO registrations (tournament_id, ${memberCol}, payment_amount, payment_status, status)
      VALUES (?, ?, ?, 'PLAYER_MARKED_PAID', 'ACTIVE')
    `).bind(tournament.id, member.id, tournament.fee || 150000).run();

    return json({ ok: true, message: "Đăng ký thành công" });
  } catch (e) {
    return json({ ok: false, error: e.message }, { status: 500 });
  }
}
