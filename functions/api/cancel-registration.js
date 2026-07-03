import { json, ensureRegistrationsColumns } from './_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    await ensureRegistrationsColumns(env);
    const body = await request.json();
    const id = Number(body.registration_id);
    if (!id) return json({ ok: false, error: "Thiếu registration_id" }, { status: 400 });

    await env.DB.prepare(`
      UPDATE registrations
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, { status: 500 });
  }
}
