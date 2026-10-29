# TTHome

Chạy các lệnh dưới đây tại thư mục gốc repo (cần Node ≥ 20.9; backend cần thêm Java 21).

| Lệnh | Việc làm |
|---|---|
| `npm run frontend` | Tự cài lại thư viện frontend nếu thiếu hoặc hỏng, rồi chạy cùng lúc web (http://localhost:3000) và admin (http://localhost:3001/admin) |
| `npm run frontend -- web` | Chỉ chạy web (hoặc `admin`) |
| `npm run frontend:check` | Kiểm tra giống CI: `npm ci`, lint, typecheck, test, build |
| `npm run backend` | Build backend (bỏ qua test), chạy migration Flyway của từng service, rồi bật cả 11 service |
| `npm run backend -- identity listing` | Như trên nhưng chỉ với service được chọn (tên ngắn, tên đầy đủ hoặc cổng) |
| `npm run backend:migrate` | Chỉ build và chạy migration, không bật service |
| `npm run backend:run` | Chỉ build và bật service (Spring vẫn tự migrate khi khởi động) |
| `npm run test:scripts` | Test các script trong `scripts/` |

Cờ thêm: `--skip-build`, `--skip-migrate`, `--dry-run` (in lệnh, không chạy). Ctrl+C dừng tất cả tiến trình.

## Trước khi chạy backend
1. Sao chép `backend/.env.example` thành `backend/.env` và điền thông tin (xem `backend/README.md`).
2. Mỗi service dùng một role database riêng (`identity_svc`, `inventory_svc`…). Nếu các role có mật khẩu khác nhau, đặt `<SERVICE>_DB_PASSWORD` trong `.env`, ví dụ `IDENTITY_DB_PASSWORD`, `MEEY_SYNC_DB_PASSWORD`; không đặt thì dùng `DB_PASSWORD`.
3. Migration chạy vào database trong `SUPABASE_DB_URL` (hoặc `FLYWAY_URL` nếu có). Chỉ trỏ vào database dev.

## Ghi chú
- Repo nằm trong OneDrive, có thể bị xóa bớt file trong `node_modules` làm `next dev` lỗi (`Cannot find module 'next/dist/pages/_error'`). `npm run frontend` tự phát hiện và cài lại. Muốn tránh hẳn: chọn "Always keep on this device" cho thư mục `frontend/node_modules`, hoặc chuyển repo ra khỏi OneDrive.
- Chi tiết frontend: `frontend/README.md`. Chi tiết backend: `backend/README.md`.
