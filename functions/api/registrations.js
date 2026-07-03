import { json, ensureColumns, openTournament, memberColumn } from './_utils.js';
export async function onRequestGet({env}) {
  try {
    await ensureColumns(env);
    const t = await openTournament(env);
    if (!t) return json({ok:true,registrations:[],stats:{total:0,confirmed:0,pending:0}});
    const col = await memberColumn(env);
    const rs = await env.DB.prepare(`SELECT r.id AS registration_id,r.payment_status,r.payment_amount,r.status,r.created_at,m.id AS member_id,m.full_name,m.phone,m.gender,COALESCE(m.level_group,'UNRANKED') AS level_group,COALESCE(m.level_score,1000) AS level_score FROM registrations r LEFT JOIN members m ON m.id=r.${col} WHERE r.tournament_id=? AND COALESCE(r.status,'ACTIVE')!='CANCELLED' ORDER BY r.id DESC`).bind(t.id).all();
    const regs = rs.results || [];
    const confirmed = regs.filter(x=>x.payment_status==='BTC_CONFIRMED').length;
    return json({ok:true,registrations:regs,stats:{total:regs.length,confirmed,pending:regs.length-confirmed}});
  } catch(e) { return json({ok:false,error:e.message,registrations:[],stats:{total:0,confirmed:0,pending:0}},{status:500}); }
}
