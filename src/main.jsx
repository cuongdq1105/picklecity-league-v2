import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Users, CreditCard, Settings, CheckCircle, Clock, RefreshCw, ShieldCheck, ListChecks } from 'lucide-react';
import './styles.css';

const API = '/api';

function money(n) {
  return Number(n || 0).toLocaleString('vi-VN') + 'đ';
}

function cleanPhone(v) {
  return String(v || '').replace(/\s+/g, '').trim();
}

function App() {
  const [tab, setTab] = useState('register');
  const [tournament, setTournament] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', gender: 'male', marked_paid: true });
  const [message, setMessage] = useState('');
  const [admin, setAdmin] = useState({ items: [], loading: false, error: '' });
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(() => {
    const total = admin.items.length;
    const paid = admin.items.filter(x => x.payment_status === 'BTC_CONFIRMED').length;
    const marked = admin.items.filter(x => x.payment_status === 'PLAYER_MARKED_PAID').length;
    const pending = admin.items.filter(x => x.payment_status === 'PENDING').length;
    return { total, paid, marked, pending };
  }, [admin.items]);

  async function fetchJSON(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error('API trả về không đúng định dạng JSON. Kiểm tra Cloudflare Pages Functions.'); }
    if (!res.ok || data.ok === false) throw new Error(data.error || 'Có lỗi xảy ra.');
    return data;
  }

  async function loadTournament() {
    try {
      const data = await fetchJSON(`${API}/tournament`);
      setTournament(data.tournament);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function loadAdmin() {
    setAdmin(a => ({ ...a, loading: true, error: '' }));
    try {
      const data = await fetchJSON(`${API}/registrations`);
      setAdmin({ items: data.registrations || [], loading: false, error: '' });
    } catch (e) {
      setAdmin({ items: [], loading: false, error: e.message });
      setMessage(e.message);
    }
  }

  useEffect(() => { loadTournament(); }, []);
  useEffect(() => { if (tab === 'admin') loadAdmin(); }, [tab]);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    const payload = { ...form, phone: cleanPhone(form.phone) };
    if (!payload.full_name.trim() || !payload.phone) {
      setMessage('Vui lòng nhập đầy đủ họ tên và số điện thoại.');
      return;
    }
    setSubmitting(true);
    try {
      await fetchJSON(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setMessage('Đăng ký thành công. BTC sẽ kiểm tra tài khoản và xác nhận thanh toán.');
      setForm({ full_name: '', phone: '', gender: 'male', marked_paid: true });
    } catch (e2) {
      setMessage(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmPayment(id, status) {
    try {
      await fetchJSON(`${API}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: id, status })
      });
      await loadAdmin();
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">PickleCity League</div>
        <h1>PickleCity Weekly Open</h1>
        <p>Đăng ký giải đấu • Thanh toán • BTC xác nhận</p>
      </header>

      <nav className="tabs">
        <button className={tab === 'register' ? 'active' : ''} onClick={() => setTab('register')}>VĐV đăng ký</button>
        <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Dashboard BTC</button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Cài đặt giải</button>
      </nav>

      {message && <div className="notice">{message}</div>}

      {tab === 'register' && (
        <main className="grid">
          <section className="card">
            <div className="card-title"><Trophy /> Giải đang mở</div>
            {tournament ? (
              <>
                <h2>{tournament.name}</h2>
                <p><b>Nội dung:</b> {tournament.event_name || 'Đôi nam'}</p>
                <p><b>Lệ phí:</b> {money(tournament.fee)}</p>
                <p><b>Quy mô:</b> {tournament.max_players} VĐV</p>
                <p><b>Thời gian:</b> {tournament.start_time}</p>
                <p><b>Hạn đăng ký:</b> {tournament.register_deadline}</p>
                <hr />
                <p>🥇 Giải nhất: <b>{money(tournament.first_prize)}</b></p>
                <p>🥈 Giải nhì: <b>{money(tournament.second_prize)}</b></p>
                <p>🥉 Đồng giải ba: <b>{money(tournament.third_prize)}/đội</b></p>
                <p className="muted">{tournament.sponsor_note}</p>
              </>
            ) : <p>Đang tải thông tin giải...</p>}
          </section>

          <section className="card">
            <div className="card-title"><CreditCard /> Thanh toán</div>
            <div className="qrbox"><img src="/qr-vcb.jpg" alt="QR Vietcombank" /></div>
            <p><b>STK:</b> 2022026869</p>
            <p><b>Chủ TK:</b> TRẦN THỊ HOÀI THANH</p>
            <p><b>Ngân hàng:</b> Vietcombank</p>
            <p><b>Nội dung:</b> Họ tên + SĐT</p>
          </section>

          <section className="card formcard">
            <div className="card-title"><Users /> Form đăng ký</div>
            <form onSubmit={submit}>
              <label>Họ và tên
                <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Ví dụ: Nguyễn Văn A" />
              </label>
              <label>Số điện thoại
                <input required inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Ví dụ: 090xxxxxxx" />
              </label>
              <label>Giới tính
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </label>
              <label className="check"><input type="checkbox" checked={form.marked_paid} onChange={e => setForm({ ...form, marked_paid: e.target.checked })} /> Tôi đã chuyển khoản lệ phí</label>
              <button className="primary" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Đăng ký tham gia'}</button>
            </form>
          </section>
        </main>
      )}

      {tab === 'admin' && (
        <main className="card wide">
          <div className="card-title row-title"><Settings /> Dashboard BTC <button className="mini" onClick={loadAdmin}><RefreshCw size={14} /> Tải lại</button></div>
          <div className="stats">
            <div><ListChecks /> Tổng: <b>{summary.total}</b></div>
            <div><Clock /> VĐV báo CK: <b>{summary.marked}</b></div>
            <div><ShieldCheck /> BTC xác nhận: <b>{summary.paid}</b></div>
          </div>
          {admin.error && <div className="notice small">{admin.error}</div>}
          {admin.loading ? <p>Đang tải...</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Giới tính</th><th>Hạng</th><th>Thanh toán</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {admin.items.length === 0 && <tr><td colSpan="7" className="empty">Chưa có VĐV đăng ký.</td></tr>}
                  {admin.items.map((x, i) => (
                    <tr key={x.registration_id}>
                      <td>{i + 1}</td>
                      <td>{x.full_name}</td>
                      <td>{x.phone}</td>
                      <td>{x.gender === 'female' ? 'Nữ' : 'Nam'}</td>
                      <td>{x.level_group || 'UNRANKED'}</td>
                      <td><Status s={x.payment_status} /></td>
                      <td className="actions">
                        <button onClick={() => confirmPayment(x.registration_id, 'BTC_CONFIRMED')}>Xác nhận</button>
                        <button onClick={() => confirmPayment(x.registration_id, 'PENDING')}>Pending</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}

      {tab === 'settings' && (
        <main className="card wide">
          <div className="card-title"><Settings /> Cài đặt giải</div>
          <p>V1.0 Clean: cài đặt phí, thời gian và giải thưởng đang lưu trong D1. Bản tiếp theo sẽ thêm form chỉnh trực tiếp tại đây.</p>
          <p className="muted">Sau khi ổn định đăng ký và xác nhận thanh toán, mình sẽ thêm module bốc thăm, ghép cặp và chia bảng.</p>
        </main>
      )}
    </div>
  );
}

function Status({ s }) {
  if (s === 'BTC_CONFIRMED') return <span className="ok"><CheckCircle size={16} /> Đã xác nhận</span>;
  if (s === 'PLAYER_MARKED_PAID') return <span className="warn"><Clock size={16} /> VĐV báo đã CK</span>;
  return <span className="pending"><Clock size={16} /> Pending</span>;
}

createRoot(document.getElementById('root')).render(<App />);
