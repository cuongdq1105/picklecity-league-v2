import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, Trophy, Users, CreditCard, Lock, RefreshCw, CheckCircle, RotateCcw, Eye, EyeOff } from 'lucide-react';
import './styles.css';

const API = '/api';
const ADMIN_KEY_STORAGE = 'ptm_admin_key';
function money(n){ return Number(n||0).toLocaleString('vi-VN') + 'đ'; }
function genderLabel(g){ return g === 'female' ? 'Nữ' : 'Nam'; }
function paymentLabel(s){ return s === 'BTC_CONFIRMED' ? 'Đã xác nhận' : (s === 'PLAYER_MARKED_PAID' ? 'VĐV báo đã CK' : 'Pending'); }

function App(){
  const [tab,setTab]=useState('register');
  const [tournament,setTournament]=useState(null);
  const [publicRegs,setPublicRegs]=useState([]);
  const [publicStats,setPublicStats]=useState({total:0, confirmed:0, pending:0});
  const [form,setForm]=useState({full_name:'', phone:'', gender:'male', note:''});
  const [msg,setMsg]=useState('');
  const [adminKey,setAdminKey]=useState(localStorage.getItem(ADMIN_KEY_STORAGE)||'');
  const [adminInput,setAdminInput]=useState('');
  const [adminRegs,setAdminRegs]=useState([]);
  const [adminStats,setAdminStats]=useState({total:0, confirmed:0, pending:0});
  const [loading,setLoading]=useState(false);

  async function fetchJson(url, options){
    const r = await fetch(url, options);
    const text = await r.text();
    let d;
    try { d = JSON.parse(text); } catch { throw new Error('API trả về không đúng JSON.'); }
    if(!r.ok || d.ok === false) throw new Error(d.error || 'Có lỗi xảy ra.');
    return d;
  }

  async function loadPublic(){
    try{
      const t = await fetchJson(API + '/tournament');
      setTournament(t.tournament);
      const d = await fetchJson(API + '/registrations');
      setPublicRegs(d.registrations || []);
      setPublicStats(d.stats || {total:0, confirmed:0, pending:0});
    }catch(e){ setMsg(e.message); }
  }
  async function loadAdmin(){
    if(!adminKey) return;
    setLoading(true);
    try{
      const d = await fetchJson(API + '/admin/registrations', { headers: { 'x-admin-key': adminKey } });
      setAdminRegs(d.registrations || []);
      setAdminStats(d.stats || {total:0, confirmed:0, pending:0});
      setMsg('');
    }catch(e){ setMsg('Admin: ' + e.message); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ loadPublic(); },[]);
  useEffect(()=>{ if(tab==='admin') loadAdmin(); },[tab, adminKey]);

  async function submit(e){
    e.preventDefault();
    setMsg('Đang gửi đăng ký...');
    try{
      const d = await fetchJson(API + '/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      setMsg(d.message || 'Đăng ký thành công.');
      setForm({full_name:'', phone:'', gender:'male', note:''});
      loadPublic();
    }catch(err){ setMsg(err.message); }
  }
  function login(e){
    e.preventDefault();
    localStorage.setItem(ADMIN_KEY_STORAGE, adminInput);
    setAdminKey(adminInput);
    setAdminInput('');
  }
  function logout(){ localStorage.removeItem(ADMIN_KEY_STORAGE); setAdminKey(''); setAdminRegs([]); }
  async function updatePayment(registration_id, status){
    await fetchJson(API + '/admin/confirm-payment', { method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify({registration_id, status}) });
    loadAdmin(); loadPublic();
  }
  async function updateLevel(member_id, level_group){
    await fetchJson(API + '/admin/update-level', { method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify({member_id, level_group}) });
    loadAdmin();
  }

  const isFull = tournament?.max_players && publicStats.total >= tournament.max_players;
  return <div className="app">
    <header className="hero">
      <div className="pill">PickleCity Tournament Manager</div>
      <h1>PickleCity League</h1>
      <p>Đăng ký giải đấu • Thanh toán • BTC xác nhận</p>
    </header>
    <nav className="tabs">
      <button className={tab==='register'?'active':''} onClick={()=>setTab('register')}>Đăng ký</button>
      <button className={tab==='list'?'active':''} onClick={()=>{setTab('list'); loadPublic();}}>Danh sách công khai</button>
      <button className={tab==='admin'?'active':''} onClick={()=>setTab('admin')}>BTC</button>
    </nav>
    {msg && <div className="notice">{msg}</div>}

    {tab==='register' && <main className="grid">
      <section className="card span2">
        <div className="cardTitle"><Trophy/> Giải đang mở</div>
        {tournament ? <>
          <h2>{tournament.name}</h2>
          <div className="stats"><Stat label="Đã đăng ký" value={`${publicStats.total}/${tournament.max_players||'-'}`}/><Stat label="BTC xác nhận" value={publicStats.confirmed}/><Stat label="Chờ xác nhận" value={publicStats.pending}/></div>
          <p><b>Nội dung:</b> {tournament.event_name}</p>
          <p><b>Lệ phí:</b> {money(tournament.fee)}</p>
          <p><b>Thời gian:</b> {tournament.start_time}</p>
          <p><b>Hạn đăng ký:</b> {tournament.register_deadline}</p>
          <hr/>
          <p>🥇 Giải nhất: <b>{money(tournament.first_prize)}</b></p>
          <p>🥈 Giải nhì: <b>{money(tournament.second_prize)}</b></p>
          <p>🥉 Đồng giải ba: <b>{money(tournament.third_prize)}/đội</b></p>
          <p className="muted">{tournament.sponsor_note}</p>
        </> : <p>Đang tải...</p>}
      </section>
      <section className="card">
        <div className="cardTitle"><CreditCard/> Thanh toán</div>
        <div className="qrbox"><img src="/qr-vcb.jpg" alt="QR Vietcombank"/></div>
        <p><b>STK:</b> 202.202.6868</p>
        <p><b>Chủ TK:</b> TRẦN THỊ HOÀI THANH</p>
        <p><b>Ngân hàng:</b> Vietcombank</p>
        <p><b>Nội dung:</b> Họ tên + SĐT</p>
      </section>
      <section className="card span3">
        <div className="cardTitle"><Users/> Form đăng ký</div>
        {isFull ? <div className="closed">Giải đã đủ số lượng. Đăng ký tạm đóng.</div> : <form onSubmit={submit} className="formgrid">
          <label>Họ và tên<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
          <label>Số điện thoại<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Giới tính<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="male">Nam</option><option value="female">Nữ</option></select></label>
          <label>Ghi chú<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Không bắt buộc"/></label>
          <button className="primary">Tôi đã chuyển khoản và đăng ký tham gia</button>
        </form>}
      </section>
    </main>}

    {tab==='list' && <main className="card wide"><PublicList regs={publicRegs} stats={publicStats} reload={loadPublic}/></main>}

    {tab==='admin' && <main className="card wide">
      {!adminKey ? <form onSubmit={login} className="login"><div className="cardTitle"><Lock/> Đăng nhập BTC</div><input type="password" placeholder="Mật khẩu BTC" value={adminInput} onChange={e=>setAdminInput(e.target.value)}/><button className="primary">Đăng nhập</button><p className="muted">Mật khẩu mặc định: PTC2026. Sau này có thể đổi bằng biến ADMIN_KEY trên Cloudflare.</p></form>
      : <><div className="cardTitle"><ShieldCheck/> Dashboard BTC <button className="mini" onClick={loadAdmin}><RefreshCw size={14}/> Tải lại</button><button className="mini" onClick={logout}>Đăng xuất</button></div><div className="stats"><Stat label="Tổng" value={adminStats.total}/><Stat label="Đã xác nhận" value={adminStats.confirmed}/><Stat label="Chờ" value={adminStats.pending}/></div>{loading ? <p>Đang tải...</p> : <AdminTable regs={adminRegs} updatePayment={updatePayment} updateLevel={updateLevel}/>}</>}
    </main>}
  </div>
}
function Stat({label,value}){ return <div className="stat"><div>{value}</div><span>{label}</span></div> }
function PublicList({regs,stats,reload}){ return <><div className="cardTitle"><Eye/> Danh sách công khai <button className="mini" onClick={reload}><RefreshCw size={14}/> Tải lại</button></div><div className="stats"><Stat label="Đã đăng ký" value={stats.total}/><Stat label="BTC xác nhận" value={stats.confirmed}/><Stat label="Chờ xác nhận" value={stats.pending}/></div><table><thead><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Giới tính</th><th>Trạng thái</th></tr></thead><tbody>{regs.map((x,i)=><tr key={x.registration_id}><td>{i+1}</td><td>{x.full_name}</td><td>{x.phone_masked}</td><td>{genderLabel(x.gender)}</td><td><Badge s={x.payment_status}/></td></tr>)}</tbody></table><p className="muted"><EyeOff size={14}/> Danh sách công khai không hiển thị phân hạng A/B/C và điểm trình.</p></> }
function AdminTable({regs,updatePayment,updateLevel}){ return <table><thead><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>GT</th><th>Hạng nội bộ</th><th>Thanh toán</th><th>Thao tác</th></tr></thead><tbody>{regs.map((x,i)=><tr key={x.registration_id}><td>{i+1}</td><td>{x.full_name}</td><td>{x.phone}</td><td>{genderLabel(x.gender)}</td><td><select value={x.level_group||'UNRANKED'} onChange={e=>updateLevel(x.member_id,e.target.value)}><option>UNRANKED</option><option>A+</option><option>A</option><option>B+</option><option>B</option><option>C</option></select></td><td><Badge s={x.payment_status}/></td><td>{x.payment_status==='BTC_CONFIRMED'?<button onClick={()=>updatePayment(x.registration_id,'PENDING')}><RotateCcw size={14}/> Hoàn tác</button>:<button onClick={()=>updatePayment(x.registration_id,'BTC_CONFIRMED')}><CheckCircle size={14}/> Xác nhận</button>}</td></tr>)}</tbody></table> }
function Badge({s}){ const ok=s==='BTC_CONFIRMED'; return <span className={ok?'badge ok':'badge wait'}>{paymentLabel(s)}</span> }

createRoot(document.getElementById('root')).render(<App/>);
