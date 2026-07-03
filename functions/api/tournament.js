import { json, getOpenTournament } from './_utils.js';
export async function onRequestGet({ env }) {
  try {
    const tournament = await getOpenTournament(env);
    return json({ ok: true, tournament });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
