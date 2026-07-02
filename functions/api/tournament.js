import { json, getOpenTournament } from './_util.js';

const fallback = {
  id: 1,
  name: 'PickleCity Weekly Open #02 - Đôi Nam Random',
  fee: 150000,
  max_players: 40,
  start_time: '2026-07-05 08:00:00',
  register_deadline: '2026-07-03 20:30:00',
  first_prize: 2000000,
  second_prize: 1000000,
  third_prize: 500000,
  third_prize_count: 2,
  sponsor_note: 'PickleCity tài trợ cúp vô địch, huy chương và chi phí tổ chức giải.',
  event_name: 'Đôi nam'
};

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ ok: true, tournament: fallback, warning: 'Missing DB binding, using fallback' });
    const t = await getOpenTournament(env.DB);
    return json({ ok: true, tournament: t || fallback });
  } catch (e) {
    return json({ ok: false, tournament: fallback, error: e.message || String(e) });
  }
}
