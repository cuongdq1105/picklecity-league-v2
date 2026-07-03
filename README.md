# PickleCity League V2.1 Stable

## Tính năng
- STK hiển thị: 202.202.6868
- Danh sách công khai cho VĐV/khán giả, ẩn phân hạng
- Dashboard BTC có mật khẩu
- BTC xem/sửa phân hạng A+/A/B+/B/C
- BTC xác nhận thanh toán hoặc hoàn tác
- Chống đăng ký trùng trong cùng giải
- API Cloudflare Pages Functions, không dùng `_worker.js`, không dùng `_middleware.js`

## Cloudflare Pages
- Build command: `npm install && npm run build`
- Build output: `dist`
- D1 binding: `DB` -> `picklecity-db`
- Optional variable: `ADMIN_KEY` (nếu không đặt, mật khẩu mặc định là `PTC2026`)

## Test sau deploy
- `/api/ping`
- `/api/tournament`
- `/api/registrations`
