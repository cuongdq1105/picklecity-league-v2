import { json, adminOk } from '../_utils.js';
export async function onRequestPost({ request, env }) {
  if (!adminOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const status = body.status === 'PENDING' ? 'PENDING' : 'BTC_CONFIRMED';
    await env.DB.prepare('UPDATE registrations SET payment_status=? WHERE id=?')
      .bind(status, body.registration_id).run();
    return json({ ok: true });
  } catch (e) { return json({ ok: false, error: e.message }, 500); }
}
