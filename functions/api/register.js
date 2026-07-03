import { json, getOpenTournament } from './_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const fullName = (body.full_name || '').trim();
    const phone = (body.phone || '').replace(/\s+/g, '').trim();
    const gender = body.gender || 'male';
    const note = (body.note || '').trim();

    if (!fullName || !phone) return json({ ok: false, error: 'Thiếu họ tên hoặc số điện thoại.' }, 400);

    const tournament = await getOpenTournament(env);
    if (!tournament) return json({ ok: false, error: 'Hiện chưa có giải đang mở đăng ký.' }, 400);

    const count = await env.DB.prepare('SELECT COUNT(*) AS c FROM registrations WHERE tournament_id=?').bind(tournament.id).first();
    if (tournament.max_players && count.c >= tournament.max_players) {
      return json({ ok: false, error: 'Giải đã đủ số lượng VĐV đăng ký.' }, 400);
    }

    let member = await env.DB.prepare('SELECT * FROM members WHERE phone=?').bind(phone).first();
    if (!member) {
      await env.DB.prepare(`
        INSERT INTO members (full_name, phone, gender, level_group, level_score, ranking_score, status)
        VALUES (?, ?, ?, 'UNRANKED', 1000, 0, 'ACTIVE')
      `).bind(fullName, phone, gender).run();
      member = await env.DB.prepare('SELECT * FROM members WHERE phone=?').bind(phone).first();
    } else {
      await env.DB.prepare('UPDATE members SET full_name=?, gender=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .bind(fullName, gender, member.id).run();
    }

    const existing = await env.DB.prepare('SELECT * FROM registrations WHERE tournament_id=? AND member_id=?')
      .bind(tournament.id, member.id).first();
    if (existing) {
      return json({ ok: true, duplicated: true, message: 'SĐT này đã đăng ký giải hiện tại.', registration_id: existing.id });
    }

    await env.DB.prepare(`
      INSERT INTO registrations (tournament_id, member_id, payment_amount, payment_status, note)
      VALUES (?, ?, ?, 'PLAYER_MARKED_PAID', ?)
    `).bind(tournament.id, member.id, tournament.fee || 150000, note).run();

    return json({ ok: true, message: 'Đăng ký thành công. Vui lòng chờ BTC xác nhận thanh toán.' });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
