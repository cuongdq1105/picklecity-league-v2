import { json, getMemberTable } from './_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const memberId = Number(body.member_id);
    if (!memberId) return json({ ok: false, error: "Thiếu member_id" }, { status: 400 });

    const memberTable = await getMemberTable(env);
    const fullName = String(body.full_name || '').trim();
    const phone = String(body.phone || '').trim();
    const gender = body.gender || 'male';
    const levelGroup = body.level_group || 'UNRANKED';
    const levelScore = Number(body.level_score || 1000);

    if (!fullName || !phone) return json({ ok: false, error: "Thiếu họ tên hoặc SĐT" }, { status: 400 });

    await env.DB.prepare(`
      UPDATE ${memberTable}
      SET full_name = ?, phone = ?, gender = ?, level_group = ?, level_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(fullName, phone, gender, levelGroup, levelScore, memberId).run();

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, { status: 500 });
  }
}
