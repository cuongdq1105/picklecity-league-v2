import { json } from './_util.js';

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'Missing DB binding' }, { status: 500 });
    const body = await request.json();
    const id = Number(body.registration_id);
    const status = body.status || 'BTC_CONFIRMED';
    if (!id) return json({ ok: false, error: 'Thiếu registration_id' }, { status: 400 });

    await env.DB.prepare('UPDATE registrations SET payment_status = ? WHERE id = ?')
      .bind(status, id).run();
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
