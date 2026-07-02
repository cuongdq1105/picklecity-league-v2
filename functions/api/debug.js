import { json, getTables, tableColumns } from './_util.js';

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ ok: false, error: 'Missing DB binding' });
    const tables = await getTables(env.DB);
    const columns = {};
    for (const t of tables) columns[t] = await tableColumns(env.DB, t);
    return json({ ok: true, tables, columns });
  } catch (e) {
    return json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
