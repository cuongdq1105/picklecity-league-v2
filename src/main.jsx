import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, CreditCard, Users, Shield, RefreshCw, CheckCircle, RotateCcw, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import './styles.css';

const API = '/api';
const ADMIN_PIN = 'PTC2026';
const LEVELS = ['UNRANKED', 'A+', 'A', 'B+', 'B', 'C'];

function money(n){ return Number(n||0).toLocaleString('vi-VN') + 'đ'; }
function genderLabel(g){ return g === 'female' ? 'Nữ' : 'Nam'; }

function App(){
  const [tab,setTab]=useState('register');
  const [tournament,setTournament]=useState(null);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({full_name:'', phone:'', gender:'male', marked_paid:true});
  const [publicList,setPublicList]=useState([]);
  const [adminAuthed,setAdminAuthed]=useState(localStorage.getItem('ptm_admin')==='1');
  const [pin,setPin]=useState('');
  const [admin,setAdmin]=useState({registrations:[], stats:{total:0,confirmed:0,pending:0}, loading:false});
  const [editing,setEditing]=useState(null);

  async function readJson(res){
    const text = await res.text();
    try { return JSON.parse(text); } catch { throw new Error('API không trả JSON. Kiểm tra deployment.'); }
  }
  async function api(path, opts){
    const res = await fetch(API+path, opts);
    const data = await readJson(res);
    if(!res.ok || data.ok === false) throw new Error(data.error || 'Có lỗi xảy ra');
    return data;
  }

  async function loadTournament(){
    try { const d=await api('/tournament'); setTournament(d.tournament); }
    catch(e){ setMsg(e.message); }
  }
  async function loadPublic(){
    try { const d=await api('/public-registrations'); setPublicList(d.registrations||[]); }
    catch(e){ setMsg(e.message); }
  }
  async function loadAdmin(){
    setAdmin(a=>({...a, loading:true}));
    try { const d=await api('/registrations'); setAdmin({registrations:d.registrations||[], stats:d.stats||{}, loading:false}); }
    catch(e){ setAdmin(a=>({...a, loading:false})); setMsg(e.message); }
  }

  useEffect(()=>{ loadTournament(); loadPublic(); },[]);
  useEffect(()=>{ if(tab==='public') loadPublic(); if(tab==='admin' && adminAuthed) loadAdmin(); },[tab,adminAuthed]);

  async function submit(e){
    e.preventDefault(); setMsg('Đang gửi đăng ký...');
    try {
      await api('/register', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form)});
      setMsg('Đăng ký thành công. BTC sẽ kiểm tra tài khoản và xác nhận thanh toán.');
      setForm({full_name:'', phone:'', gender:'male', marked_paid:true});
      await loadPublic();
      if(adminAuthed) await loadAdmin();
    } catch(e){ setMsg(e.message); }
  }
  function login(e){
    e.preventDefault();
    if(pin === ADMIN_PIN){ localStorage.setItem('ptm_admin','1'); setAdminAuthed(true); setPin(''); setMsg('Đã đăng nhập BTC.'); }
    else setMsg('Sai mật khẩu BTC.');
  }
  function logout(){ localStorage.removeItem('ptm_admin'); setAdminAuthed(false); setTab('register'); }

  async function setPayment(reg, status){
    try { await api('/confirm-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({registration_id:reg.registration_id,status})}); await loadAdmin(); await loadPublic(); }
    catch(e){ setMsg(e.message); }
  }
  async function cancelReg(reg){
    if(!confirm(`Xóa ${reg.full_name} khỏi danh sách đăng ký?`)) return;
    try { await api('/cancel-registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({registration_id:reg.registration_id})}); await loadAdmin(); await loadPublic(); setMsg('Đã xóa VĐV khỏi danh sách đăng ký.'); }
    catch(e){ setMsg(e.message); }
  }
  async function saveEdit(e){
    e.preventDefault();
    try { await api('/update-player',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(editing)}); setEditing(null); await loadAdmin(); await loadPublic(); setMsg('Đã cập nhật thông tin VĐV.'); }
    catch(e){ setMsg(e.message); }
  }

  const confirmed = admin.stats.confirmed || 0;
  const total = admin.stats.total || 0;
  const pending = admin.stats.pending || Math.max(0,total-confirmed);

  return <div className="app">
    <header className="hero">
      <div className="brand">PickleCity League</div>
      <h1>PickleCity Weekly Open</h1>
      <p>Đăng ký giải đấu • Thanh toán • BTC xác nhận</p>
    </header>

    <nav className="tabs">
      <button className={tab==='register'?'active':''} onClick={()=>setTab('register')}>Đăng ký</button>
      <button className={tab==='public'?'active':''} onClick={()=>setTab('public')}>Danh sách công khai</button>
      <button className={tab==='admin'?'active':''} onClick={()=>setTab('admin')}>BTC</button>
    </nav>

    {msg && <div className="notice">{msg}</div>}

    {tab==='register' && <main className="grid">
      <section className="card">
        <div className="card-title"><Trophy/> Giải đang mở</div>
        {tournament ? <>
          <h2>{tournament.name}</h2>
          <p><b>Nội dung:</b> {tournament.event_name || 'Đôi nam'}</p>
          <p><b>Lệ phí:</b> {money(tournament.fee)}</p>
          <p><b>Quy mô:</b> {tournament.max_players} VĐV</p>
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
        <div className="card-title"><CreditCard/> Thanh toán</div>
        <div className="qrbox"><img src="/qr-vcb.jpg" /></div>
        <p><b>STK:</b> 202.202.6868</p>
        <p><b>Chủ TK:</b> TRẦN THỊ HOÀI THANH</p>
        <p><b>Ngân hàng:</b> Vietcombank</p>
        <p><b>Nội dung:</b> Họ tên + SĐT</p>
      </section>

      <section className="card">
        <div className="card-title"><Users/> Form đăng ký</div>
        <form onSubmit={submit}>
          <label>Họ và tên<input required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
          <label>Số điện thoại<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Giới tính<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="male">Nam</option><option value="female">Nữ</option></select></label>
          <label className="check"><input type="checkbox" checked={form.marked_paid} onChange={e=>setForm({...form,marked_paid:e.target.checked})}/> Tôi đã chuyển khoản lệ phí</label>
          <button className="primary">Đăng ký tham gia</button>
        </form>
      </section>
    </main>}

    {tab==='public' && <main className="card wide">
      <div className="card-title"><Eye/> Danh sách công khai <button className="mini" onClick={loadPublic}><RefreshCw size={14}/> Tải lại</button></div>
      <p className="muted">Danh sách công khai không hiển thị phân hạng nội bộ của BTC.</p>
      <table><thead><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Giới tính</th><th>Thanh toán</th></tr></thead>
      <tbody>{publicList.map((x,i)=><tr key={x.registration_id}><td>{i+1}</td><td>{x.full_name}</td><td>{x.phone_masked}</td><td>{genderLabel(x.gender)}</td><td><PaymentBadge s={x.payment_status}/></td></tr>)}</tbody></table>
    </main>}

    {tab==='admin' && !adminAuthed && <main className="card login">
      <div className="card-title"><Shield/> Đăng nhập BTC</div>
      <form onSubmit={login}>
        <label>Mật khẩu BTC<input type="password" value={pin} onChange={e=>setPin(e.target.value)} autoFocus /></label>
        <button className="primary">Đăng nhập</button>
      </form>
      <p className="muted">Mật khẩu mặc định: PTC2026</p>
    </main>}

    {tab==='admin' && adminAuthed && <main className="card wide">
      <div className="topline">
        <div className="card-title"><Shield/> Dashboard BTC</div>
        <button className="mini" onClick={loadAdmin}><RefreshCw size={14}/> Tải lại</button>
        <button className="mini" onClick={logout}>Đăng xuất</button>
      </div>
      <div className="stats"><div><b>{total}</b><span>Tổng</span></div><div><b>{confirmed}</b><span>Đã xác nhận</span></div><div><b>{pending}</b><span>Chờ</span></div></div>
      {admin.loading ? <p>Đang tải...</p> :
      <div className="tablewrap"><table><thead><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>GT</th><th>Hạng nội bộ</th><th>Thanh toán</th><th>Thao tác</th></tr></thead>
      <tbody>{admin.registrations.map((x,i)=><tr key={x.registration_id}>
        <td>{i+1}</td><td>{x.full_name}</td><td>{x.phone}</td><td>{genderLabel(x.gender)}</td>
        <td><select value={x.level_group||'UNRANKED'} onChange={async e=>{ await api('/update-player',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...x, level_group:e.target.value})}); loadAdmin(); }} >{LEVELS.map(l=><option key={l}>{l}</option>)}</select></td>
        <td><PaymentBadge s={x.payment_status}/></td>
        <td className="actions">
          {x.payment_status==='BTC_CONFIRMED' ? <button onClick={()=>setPayment(x,'PLAYER_MARKED_PAID')}><RotateCcw size={14}/> Hoàn tác</button> : <button onClick={()=>setPayment(x,'BTC_CONFIRMED')}><CheckCircle size={14}/> Xác nhận</button>}
          <button onClick={()=>setEditing({...x})}><Pencil size={14}/> Sửa</button>
          <button className="danger" onClick={()=>cancelReg(x)}><Trash2 size={14}/> Xóa</button>
        </td>
      </tr>)}</tbody></table></div>}
    </main>}

    {editing && <div className="modalBackdrop">
      <form className="modal" onSubmit={saveEdit}>
        <h2>Sửa thông tin VĐV</h2>
        <label>Họ tên<input value={editing.full_name||''} onChange={e=>setEditing({...editing,full_name:e.target.value})}/></label>
        <label>SĐT<input value={editing.phone||''} onChange={e=>setEditing({...editing,phone:e.target.value})}/></label>
        <label>Giới tính<select value={editing.gender||'male'} onChange={e=>setEditing({...editing,gender:e.target.value})}><option value="male">Nam</option><option value="female">Nữ</option></select></label>
        <label>Hạng nội bộ<select value={editing.level_group||'UNRANKED'} onChange={e=>setEditing({...editing,level_group:e.target.value})}>{LEVELS.map(l=><option key={l}>{l}</option>)}</select></label>
        <label>Điểm trình<input type="number" value={editing.level_score||1000} onChange={e=>setEditing({...editing,level_score:e.target.value})}/></label>
        <div className="modalActions"><button type="button" onClick={()=>setEditing(null)}>Hủy</button><button className="primary">Lưu</button></div>
      </form>
    </div>}
  </div>
}

function PaymentBadge({s}) {
  if(s==='BTC_CONFIRMED') return <span className="ok">✓ Đã xác nhận</span>;
  if(s==='PLAYER_MARKED_PAID') return <span className="warn">VĐV báo đã CK</span>;
  return <span className="pending">Pending</span>;
}

createRoot(document.getElementById('root')).render(<App/>);
