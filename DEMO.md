# TTHome – bản demo (chỉ dữ liệu mẫu)

Bản này là demo độc lập để deploy lên Vercel. Nó **không cần backend, database hay API bên ngoài**: mọi dữ liệu đến từ gói `frontend/packages/data` (dữ liệu mẫu, cố định theo ngày 29/10/2026). Các thao tác như đặt lịch, ký gửi, đổi trạng thái trong trang quản trị chỉ chạy trên trình duyệt và không được lưu lại.

## Dữ liệu

- Toàn bộ dữ liệu nằm ở **TP. Cần Thơ**: Quận Ninh Kiều, Cái Răng, Bình Thủy, Ô Môn và Huyện Phong Điền, với phường/xã, địa chỉ và tọa độ thật (gần đúng).
- Mốc tìm kiếm: Đại học Cần Thơ, ĐH Y Dược Cần Thơ, ĐH FPT Cần Thơ, Vincom Xuân Khánh, Sense City, Bến Ninh Kiều, BV Đa khoa Trung ương, KCN Trà Nóc.
- Giá thuê theo mặt bằng Cần Thơ: từ khoảng 0,7 triệu (giường ký túc xá) đến khoảng 9 triệu/tháng (căn 2 phòng ngủ), phần lớn phòng quanh 2 – 4 triệu. Bản đồ sơ lược vẽ sông Hậu và sông Cần Thơ.
- Đường dẫn khu vực có dạng `/phong-tro/can-tho/<quan>/<phuong>`.

## Tài khoản demo

| App | Email | Mật khẩu | Ghi chú |
|---|---|---|---|
| Web công khai (người thuê) | `nguoidung@tthome.demo` | `Demo@2026` | Nguyễn Minh Anh. Có thể đăng nhập bằng số `0939 456 512` với mã `123456`. |
| Trang quản trị | `admin@tthome.demo` | `Demo@2026` | Quản trị TTHome. |

- Hai tài khoản được khai báo một chỗ trong `frontend/packages/data/src/accounts.ts` (`DEMO_ACCOUNTS`).
- Web: đăng nhập đúng sẽ đặt cookie `tthome_demo_user`; các trang `/tai-khoan/*` yêu cầu cookie này. Đăng xuất ở `/dang-xuat`.
- Quản trị: đăng nhập đúng sẽ đặt cookie httpOnly `tthome_demo_admin`; mọi trang quản trị yêu cầu cookie này.
- Sai email hoặc mật khẩu sẽ hiện thông báo lỗi. Trang đăng nhập của mỗi app có ô gợi ý tài khoản demo.

## Deploy lên Vercel (2 project từ cùng một repo)

| Thiết lập | Web công khai | Trang quản trị |
|---|---|---|
| Framework Preset | Next.js | Next.js |
| Root Directory | `frontend/apps/web` | `frontend/apps/admin` |
| Install Command | `cd ../.. && npm ci` | `cd ../.. && npm ci` |
| Build Command / Output | để mặc định | để mặc định |
| Node.js | 20.x trở lên | 20.x trở lên |

- Bật tùy chọn "Include files outside the Root Directory in the Build Step" (mặc định đã bật) vì app dùng các gói trong `frontend/packages`.
- Trang quản trị chạy dưới đường dẫn `/admin`; mở tên miền gốc của project quản trị sẽ tự chuyển sang `/admin`.
- **Không cần biến môi trường nào.** Các biến tùy chọn:
  - Web: `NEXT_PUBLIC_ADMIN_URL` – địa chỉ trang quản trị cho nút "Trang quản trị" ở header, ví dụ `https://tthome-admin.vercel.app/admin` (mặc định `/admin`, sẽ 404 nếu hai app ở hai tên miền khác nhau).
  - Quản trị: `NEXT_PUBLIC_SITE_URL` – địa chỉ web công khai cho nút "Xem trên web", ví dụ `https://tthome-web.vercel.app`.
  - Web: `GOOGLE_CLIENT_ID` – có giá trị thì nút "Tiếp tục với Google" được bật (bản demo không có luồng Google thật, nên để trống).

## Chạy ở máy

```sh
cd frontend
npm ci
npm run dev:web     # http://localhost:3000
npm run dev:admin   # http://localhost:3001/admin
npm run lint && npm run typecheck && npm test && npm run build
```

Thư mục `backend/`, `db/`, `infra/` và `docs/` giữ nguyên từ dự án gốc và không được dùng trong bản demo.
