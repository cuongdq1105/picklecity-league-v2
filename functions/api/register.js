import { json, ensureColumns, openTournament, memberColumn } from './_utils.js';
export async function onRequestPost({request,env}) {
  try {
    await ensureColumns(env);
    const b = await request.json();
    const fullName = String(b.full_name||'').trim(), phone=String(b.phone||'').trim(), gender=b.gender||'male';
    if(!fullName||!phone) return json({ok:false,error:'Thiếu họ tên hoặc số điện thoại'},{status:400});
    const t=await openTournament(env); if(!t) return json({ok:false,error:'Hiện chưa có giải đang mở'},{status:400});
    const col=await memberColumn(env);
    let m=await env.DB.prepare('SELECT * FROM members WHERE phone=?').bind(phone).first();
    if(!m){ await env.DB.prepare(`INSERT INTO members (full_name,phone,gender,level_group,level_score) VALUES (?,?,?,'UNRANKED',1000)`).bind(fullName,phone,gender).run(); m=await env.DB.prepare('SELECT * FROM members WHERE phone=?').bind(phone).first(); }
    const ex=await env.DB.prepare(`SELECT id FROM registrations WHERE tournament_id=? AND ${col}=? AND COALESCE(status,'ACTIVE')!='CANCELLED' LIMIT 1`).bind(t.id,m.id).first();
    if(ex) return json({ok:false,error:'Số điện thoại này đã đăng ký giải này rồi.'},{status:409});
    await env.DB.prepare(`INSERT INTO registrations (tournament_id,${col},payment_amount,payment_status,status) VALUES (?,?,?,'PLAYER_MARKED_PAID','ACTIVE')`).bind(t.id,m.id,t.fee||150000).run();
    return json({ok:true,message:'Đăng ký thành công'});
  } catch(e) { return json({ok:false,error:e.message},{status:500}); }
}
