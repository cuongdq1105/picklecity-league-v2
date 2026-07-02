import { json } from './_util.js';

export async function onRequestGet() {
  return json({ ok: true, message: 'PickleCity League API running' });
}
