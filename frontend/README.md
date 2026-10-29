# TTHome frontend (Next.js 16)

npm workspaces gồm 2 app và 2 thư viện dùng chung:

    apps/web        # trang công khai, cổng 3000
    apps/admin      # trang quản trị, basePath /admin, cổng 3001
    packages/ui     # design system: token màu/chữ (theme.css), Button, Plate, Badge, field, format giá/ngày
    packages/data   # kiểu dữ liệu theo db/tthome_schema.sql + dữ liệu mẫu, hàm tìm kiếm/lọc

## Chạy
Cách nhanh nhất là chạy `npm run frontend` ở thư mục gốc repo (xem README gốc). Còn chạy trực tiếp trong `frontend/` thì:

    npm ci
    npm run dev:web        # http://localhost:3000
    npm run dev:admin      # http://localhost:3001/admin

## Kiểm tra trước khi commit (giống CLAUDE.md mục 5)
    npm ci && npm run lint && npm run typecheck && npm test && npm run build

## Ghi chú
- Chưa nối API: mọi trang đọc `@tthome/data` (dữ liệu mẫu tất định, ngày gốc `TODAY` = 2026-10-29).
  Khi có client sinh từ OpenAPI, thay các hàm trong `packages/data/src/queries.ts` và `admin.ts`, giữ nguyên kiểu.
- Bộ lọc tìm kiếm nằm trên URL (`apps/web/lib/search-params.ts`), đúng mẫu `/tim-kiem?q=&landmark=&group=pet,ev,promo&price=&type=`.
- Bản đồ hiện là bản đồ sơ lược vẽ bằng SVG theo tọa độ thật; liên kết "Mở trên Google Maps" mở bản đồ thật.
- Ảnh mẫu lấy từ images.unsplash.com; production dùng Cloudinary (đã khai trong `images.remotePatterns`).
- Màu, font và bán kính chỉ khai một lần trong `packages/ui/src/styles/theme.css`; dùng class Tailwind
  sinh từ token (`bg-shutter`, `text-plate`, `rounded-card`…), không viết mã màu trực tiếp.
