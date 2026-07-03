import { json } from './_utils.js';
export async function onRequestGet() {
  return json({ ok: true, message: "PickleCity League API running", version: "2.2" });
}
