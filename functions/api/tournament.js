import { json, openTournament } from './_utils.js';

export async function onRequestGet({ env }) {
  try {
    const tournament = await openTournament(env);
    return json({ ok: true, tournament });
  } catch (e) {
    return json({ ok: false, error: e.message, tournament: null }, { status: 500 });
  }
}
