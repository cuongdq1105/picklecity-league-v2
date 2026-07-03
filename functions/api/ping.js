import { json } from './_utils.js';
export async function onRequestGet() {
  return json({ ok: true, message: 'PickleCity Tournament Manager API running', version: '2.1.0' });
}
