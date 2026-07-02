# PickleCity League V2 Clean

Bản sạch dùng Cloudflare Pages + Pages Functions + D1 Database.

## Cấu hình Cloudflare Pages

- Git repository: `cuongdq1105/picklecity-league-v2`
- Build command: `npm install && npm run build`
- Build output directory: `dist`
- D1 Binding:
  - Variable name: `DB`
  - Database: `picklecity-db`

## Test API sau deploy

- `/api/ping`
- `/api/tournament`
- `/api/registrations`

## Lưu ý

Project này chỉ dùng `functions/`, không dùng `_worker.js` để tránh xung đột routing.
