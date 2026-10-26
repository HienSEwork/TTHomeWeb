# Kế hoạch xây dựng TTHome (Microservice)

Oct 26, 2026 · @Phat

## 1. Tổng quan và mục tiêu

TTHome là sàn cho thuê phòng trọ, căn hộ dịch vụ tại TP.HCM, xây theo kiến trúc microservice và ra mắt bản MVP sau khoảng 16 tuần. Dữ liệu phòng vẫn do đội vận hành nhập trên Meey CRM; TTHome có PostgreSQL riêng, mô phỏng cấu trúc Meey CRM và được đồng bộ liên tục từ đó.

**Mục tiêu đo được**

- Giao diện, sơ đồ trang và luồng người dùng trùng khoảng 80% với [HiFriendz](https://hifriendz.com/) và [GoPlus](https://goplus.com.vn/); 20% còn lại là thương hiệu, nội dung và điểm khác biệt riêng của TTHome.
- Dữ liệu phòng trên web trễ so với Meey CRM không quá 5 phút (mục 6).
- Trang danh sách và chi tiết tải dưới 2,5 giây (LCP) trên 4G; đạt chuẩn SEO cơ bản để lên top theo từ khóa khu vực.
- Hệ thống chịu được 10 lần lưu lượng ban đầu mà chỉ cần thêm máy, không sửa code.

**Công nghệ chốt**

| Lớp | Công nghệ | Ghi chú |
| --- | --- | --- |
| Backend | Java 21 LTS, Spring Boot 4.x | Mỗi service một repo module, build bằng Maven |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS | SSR/ISR cho SEO; 2 app: web công khai và trang quản trị |
| Cổng vào | Nginx | API Gateway + reverse proxy: định tuyến, kiểm JWT (auth\_request), TLS, cache tĩnh, giới hạn tần suất |
| Dữ liệu | PostgreSQL 17+ (pg\_trgm, unaccent, earthdistance) | Primary + read replica, phân vùng bảng lớn |
| Bổ trợ | Redis, RabbitMQ, Cloudinary, Docker | Cache, message broker, ảnh/video qua CDN, đóng gói và chạy container |

**Phạm vi MVP** gồm mọi chức năng đánh dấu "Xác nhận cần thiết" trong file Excel (mục 2). Các chức năng không đánh dấu (chat, so sánh phòng, cổng cộng tác viên, đánh giá, push notification) để ở giai đoạn 2.

**Giả định**: Meey CRM là nơi nhập liệu gốc ít nhất trong năm đầu; TTHome chỉ phục vụ TP.HCM và vùng lân cận (Thủ Đức, Dĩ An, Thuận An) như hai đối thủ tham chiếu.

## 2. Chức năng theo module

File Excel có 68 chức năng trong 11 nhóm; 51 chức năng được đánh dấu bắt buộc và vào MVP. Bảng dưới gán mỗi nhóm cho service chịu trách nhiệm (mục 4).

| Nhóm (Excel) | MVP | Giai đoạn 2 | Service chính |
| --- | --- | --- | --- |
| Giao diện chung | UI/UX, layout, trang chủ, giới thiệu/liên hệ, chính sách, nút liên hệ nhanh, SEO | Đa ngôn ngữ Việt – Anh | web-frontend, cms-service |
| Xác thực & tài khoản | Đăng ký SĐT + OTP, email/mật khẩu, quên/đổi mật khẩu, đổi SĐT/email, phân quyền 5 vai trò | Đăng nhập Google, quản lý phiên nhiều thiết bị | identity-service |
| Tìm kiếm & lọc | Từ khóa + gợi ý, duyệt theo khu vực, bộ lọc nâng cao, tiện nghi/chính sách, tìm gần địa danh, lối tắt nhu cầu, sắp xếp, bản đồ | So sánh phòng | search-service |
| Danh sách & chi tiết | Thẻ phòng/dự án, trang chi tiết, phòng tương tự, chia sẻ | Báo tin sai | listing-service |
| Tương tác người thuê | Đặt lịch xem, yêu cầu tư vấn, tin đã lưu, lịch hẹn của tôi, hồ sơ | Lịch sử xem, đánh giá, chat | booking-service, crm-service, identity-service |
| Ký gửi (chủ nhà) | Form ký gửi, quản lý phòng của chủ nhà | Thống kê chủ nhà, hợp đồng/đối soát | consignment-service |
| Cộng tác viên | Trang tuyển CTV | Cổng CTV, hoa hồng | cms-service → partner-service |
| Nội dung | Cẩm nang/tin tức, FAQ | Tuyển dụng | cms-service |
| Thông báo & tích hợp | Email/SMS/Zalo, Google Maps, theo dõi chuyển đổi | Push app, Zalo OA/Facebook/TikTok | notification-service |
| Quản trị | Dashboard, quản lý phòng/dự án, duyệt ký gửi, lịch hẹn, khách & tư vấn, người dùng, nội dung, danh mục, báo cáo | Quản lý CTV, nhật ký hoạt động đầy đủ | admin-frontend + tất cả service |
| Kỹ thuật & bảo mật | HTTPS, sao lưu, hiệu năng, dữ liệu cá nhân, triển khai | — | hạ tầng (mục 8) |

Một điểm cần quyết: phần "Quản lý phòng, dự án" trong admin trùng vai trò với Meey CRM. Kế hoạch này để admin TTHome chỉ sửa các trường hiển thị web (SEO, ảnh bìa, nhãn ưu đãi); giá và trạng thái phòng luôn lấy từ Meey CRM.

## 3. Cấu trúc trang theo HiFriendz và GoPlus

Hai trang tham chiếu có chung bộ khung: menu gần như trùng nhau, cùng mẫu URL dự án `/du-an/PRJ-{mã}` và cùng trang `/dat-lich`. TTHome lấy khung chung này làm gốc, lấy trang chủ dạng carousel của HiFriendz và trang khu vực chuẩn SEO của GoPlus.

**Những gì giống (≈ 80%)**: menu và thứ tự trang, mẫu URL, bộ lọc, các trường trên thẻ phòng, thứ tự section trang chủ, luồng đặt lịch và ký gửi. **Những gì riêng (≈ 20%)**: logo, màu, font, ảnh, văn bản, tên nhãn; form ký gửi nội bộ thay cho Google Form; khu vực tài khoản người dùng và chủ nhà (hai trang tham chiếu chưa có).

**Sơ đồ trang TTHome**

| Trang | URL TTHome | Theo mẫu | Ghi chú |
| --- | --- | --- | --- |
| Trang chủ | `/` | HiFriendz + GoPlus | Thứ tự section bên dưới |
| Tìm phòng | `/tim-kiem?q=&landmark=&nearme=&exclusive=&group=pet\|ev\|promo&price=&type=` | [HiFriendz /tim-kiem](https://hifriendz.com/tim-kiem) | Danh sách + bản đồ toàn màn hình, nút "Lưu tìm kiếm" |
| Khu vực (SEO) | `/phong-tro/ho-chi-minh/{quan}/{phuong}` | [GoPlus](https://goplus.com.vn/phong-tro/ho-chi-minh/quan-12/an-phu-dong) | H1, tóm tắt số tòa/phòng trống/giá từ, FAQ, liên kết theo khoảng giá |
| Khu vực theo giá | `/phong-tro/ho-chi-minh/{quan}/duoi-3-5-trieu` (3,5–5; 5–7; trên 7 triệu) | GoPlus | Trang landing sinh tự động |
| Chi tiết dự án | `/du-an/{slug}-PRJ-{mã}` | Cả hai | Giữ mã PRJ từ CRM, thêm slug cho SEO; danh sách phòng kèm giá + trạng thái |
| Chi tiết phòng | `/phong/{phuong}-{quan}-{du-an}-{mã-phòng}` | GoPlus | Ảnh, video, giá đã gồm điện nước dịch vụ, ngày trống |
| Nhờ tư vấn / đặt lịch | `/dat-lich` | Cả hai | Khu vực, ngân sách, thời gian dọn vào, SĐT |
| Ký gửi phòng | `/ky-gui` | GoPlus | 4 bước: gửi thông tin → đội chụp ảnh → đăng tin → dẫn khách |
| Cộng tác viên | `/tuyen-ctv` | GoPlus (HiFriendz: `/doi-tac`) | Chính sách hoa hồng + form |
| Cẩm nang | `/tin-tuc`, `/tin-tuc/chuyen-muc/{slug}`, `/tin-tuc/tag/{slug}`, `/tin-tuc/{slug}` | [HiFriendz](https://hifriendz.com/tin-tuc/kinh-nghiem-thue-phong-tro-sinh-vien-2026) | Mục lục, tác giả, thời gian đọc, bài liên quan, CTA đặt lịch |
| Về chúng tôi | `/ve-chung-toi` (+ neo `#chinh-sach-bao-mat`) | Cả hai |  |
| Liên hệ, chính sách, FAQ | `/lien-he`, `/chinh-sach/{slug}`, `/hoi-dap` | Excel | Điều khoản, bảo mật, ký gửi, quy trình thuê |
| Tuyển dụng | `/tuyen-dung` | HiFriendz | Giai đoạn 2 |
| Tài khoản | `/tai-khoan/{ho-so\|da-luu\|lich-hen\|phong-ky-gui}` | Riêng TTHome | Người thuê và chủ nhà |
| Tiếng Anh | `/en/...` | GoPlus | Giai đoạn 2 |
|  |  |  |  |

**Thứ tự section trang chủ**

1. Header: logo, Tìm phòng, Ký gửi phòng, Tư vấn thuê phòng, Hợp tác & Tuyển dụng, Tin tức, Về chúng tôi, nút gọi hotline.
2. Hero: tiêu đề, ô tìm kiếm và chip lọc nhanh (Địa điểm, Giá, Loại phòng, Nội thất, Ban công, Cửa sổ, Độc quyền).
3. "Tìm gần": Gần đây, RMIT, Bách Khoa, UEH, Y Dược, Văn Lang, Làng Đại học, Landmark 81, Gigamall.
4. Bảy dải carousel ngang, mỗi dải có "Xem tất cả": Phổ biến, Dưới 5 triệu, Độc quyền, Nuôi thú cưng, Nhận xe điện, Đang ưu đãi, Studio.
5. Phòng trống theo khu vực: tên phường, số phòng trống, giá từ, sắp theo số phòng trống giảm dần.
6. Cẩm nang thuê phòng mới nhất.
7. Khối CTA ký gửi phòng và tuyển CTV.
8. Footer: thông tin doanh nghiệp, MST, tổng đài, mạng xã hội, cột Công ty và Kết nối; nút nổi Zalo/Messenger/gọi.

**Thẻ dự án** hiển thị: ảnh bìa hoặc video, nhãn "Dự án"/"Độc quyền", địa chỉ (đường, phường, quận), "N phòng trống", loại phòng (Studio, Duplex, 1PN, 2PN), nhãn thú cưng, tối đa 4 tiện nghi nổi bật, giá "Từ …" hoặc "Liên hệ".

## 4. Kiến trúc microservice

Hệ thống gồm 2 ứng dụng Next.js và 11 service Spring Boot, đứng sau Nginx, nơi vừa làm cổng vào vừa làm API Gateway. Service gọi nhau qua REST khi cần kết quả ngay, và qua RabbitMQ khi chỉ cần báo "đã có thay đổi". Mỗi service sở hữu một schema PostgreSQL riêng, không service nào đọc thẳng schema của service khác.

&#91;embedded content: kiến trúc · Nginx, 2 app Next.js, gateway, 11 service, dữ liệu chung\]

Trình duyệt chỉ nói chuyện với Nginx; Next.js gọi API qua gateway giống như trình duyệt, và chỉ meey-sync được nói chuyện với Meey CRM.

| Service | Trách nhiệm | Schema DB | Giao tiếp chính |
| --- | --- | --- | --- |
| identity-service | Tài khoản, OTP, JWT/refresh token, 5 vai trò + quyền chi tiết, nhóm (team) như Meey CRM | `identity` | REST; phát `identity.*` |
| meey-sync-service | Kéo/nhận dữ liệu Meey CRM, lưu bản gốc, ánh xạ sang mô hình TTHome, đối soát | `sync` | Phát `meey.*` |
| listing-service | Quỹ hàng: dự án, phòng, giá, trạng thái, tiện nghi, khu vực, địa danh | `inventory` | REST; nghe `meey.*`; phát `listing.*` |
| search-service | Tìm từ khóa, gợi ý, bộ lọc, tìm gần, bản đồ, phòng tương tự | `search` (bảng phẳng) | REST; nghe `listing.*` |
| media-service | Ký chữ ký upload Cloudinary, nhận webhook, lưu metadata ảnh/video, xóa và đổi tên asset | `media` | REST; phát `media.*` |
| crm-service | Khách hàng, nhu cầu, yêu cầu tư vấn, lịch sử chăm sóc, công việc, phân công; tin đã lưu | `crm` | REST; nghe `booking.*`; phát `crm.*` |
| booking-service | Đặt, đổi, hủy lịch xem phòng; lịch nhân viên; phân công | `booking` | REST; phát `booking.*` |
| consignment-service | Form ký gửi, quy trình duyệt, phòng của chủ nhà | `consignment` | REST; phát `consignment.*` |
| cms-service | Bài viết, chuyên mục, tag, banner, trang tĩnh, FAQ, menu, SEO meta | `cms` | REST; phát `cms.*` |
| notification-service | Email, SMS, Zalo ZNS, mẫu tin, nhắc lịch, chống gửi trùng | `notify` | Nghe mọi sự kiện cần báo |
| report-service | Dashboard, thống kê, xuất Excel, nhật ký hoạt động | `report` | Nghe mọi sự kiện; REST cho admin |

**Nguyên tắc kỹ thuật chung**

- Phát sự kiện bằng transactional outbox: ghi bảng `outbox` cùng giao dịch nghiệp vụ, một relay đọc bảng đó rồi publish lên RabbitMQ; không mất sự kiện khi service sập giữa chừng.
- Mọi consumer xử lý idempotent theo `event_id` (bảng `processed_event`).
- Gọi đồng bộ qua Spring HTTP Interface + Resilience4j (timeout 2 giây, retry 2 lần, circuit breaker).
- Cấu trúc thư mục và tên lớp của từng service: mục 4.1 và 4.2; migration bằng Flyway.
- Khởi đầu bằng monorepo Maven nhiều module (parent pom chung), thư viện chung `tthome-common` (lỗi chuẩn, phân trang, sự kiện, bảo mật).
- API theo OpenAPI 3, sinh client TypeScript cho Next.js từ spec.

**Gom khi triển khai giai đoạn đầu**: để đội nhỏ vận hành được, MVP có thể chạy media trong listing và report trong crm; ranh giới module và schema vẫn tách sẵn để cắt ra khi tải tăng.

### 4.1 Cấu trúc project backend

Mọi service dùng cùng một khung thư mục phân tầng `controllers → services → repos`, thêm `models` và `commons`. Ai mở service nào cũng tìm đúng chỗ; phần dùng chung giữa các service nằm trong thư viện `tthome-common`.

**Monorepo**

```text
tthome/
  backend/
    pom.xml (parent)            # khai báo các module
    mvnw, .mvn/                   # Maven Wrapper, dùng chung cả repo
    tthome-common/                 # thư viện dùng chung (mục 4.3)
    tthome-events/                 # hợp đồng sự kiện (record Java) cho RabbitMQ
    services/
      identity-service/  meey-sync-service/  listing-service/  search-service/
      media-service/  crm-service/  booking-service/  consignment-service/
      cms-service/  notification-service/  report-service/
  frontend/                        # mục 7
  infra/
    docker/compose.yml  compose.prod.yml
    nginx/nginx.conf  conf.d/*.conf  # Nginx làm API Gateway
    rabbitmq/definitions.json        # exchange, queue, binding, DLX
    postgres/init/                   # tạo schema, user DB theo service
  db/tthome_schema.sql  tthome.dbml
  .github/workflows/
```

`backend/pom.xml` kế thừa `spring-boot-starter-parent`, khai `<modules>`, quản lý version (MapStruct, Resilience4j, Cloudinary SDK, Testcontainers) trong `dependencyManagement`, và cấu hình `annotationProcessorPaths` (MapStruct, Lombok) cùng `jib-maven-plugin` trong `pluginManagement`. Mỗi service chỉ khai `<parent>` và các starter cần dùng. Build cả hệ thống bằng `./mvnw clean verify`; build một service kèm module nó phụ thuộc bằng `./mvnw -pl services/listing-service -am package`.

**Khung thư mục mỗi service**

```text
{name}-service/
  pom.xml                           # <parent> trỏ về backend/pom.xml
  Dockerfile                        # hoặc jib-maven-plugin
  src/main/java/vn/tthome/{name}/
    {Name}Application.java
    config/                         # SecurityConfig, RabbitConfig, OpenApiConfig, JacksonConfig
    controllers/                    # REST: nhận request, validate, gọi services; không chứa nghiệp vụ
    services/                       # nghiệp vụ, đặt @Transactional; interface + impl khi cần
    repos/                          # Spring Data JPA / JdbcClient cho truy vấn phức tạp
    models/
      entities/                     # @Entity ánh xạ bảng của schema service
      dtos/                         # request / response
      enums/
      mappers/                      # MapStruct: entity <-> dto
    messaging/
      publishers/                   # ghi outbox
      listeners/                    # @RabbitListener, idempotent theo event_id
    clients/                        # gọi service khác hoặc bên ngoài (HTTP Interface)
    jobs/                           # @Scheduled
    commons/                        # exception, constants, utils, validators riêng của service
  src/main/resources/
    application.yml  application-dev.yml  application-prod.yml
    db/migration/                   # Flyway V1__init.sql, chỉ schema của service
    messages_vi.properties  messages_en.properties
  src/test/java/vn/tthome/{name}/
    controllers/  services/  repos/ # repos test bằng Testcontainers PostgreSQL
```

**Quy tắc phụ thuộc**

- `controllers` chỉ gọi `services`; `services` gọi `repos`, `clients`, `messaging/publishers`; `repos` không gọi ngược lên trên.
- `entities` không được lộ ra ngoài `services`; controller chỉ nhận và trả `dtos`.
- Service này không đọc bảng của service khác: cần dữ liệu thì gọi qua `clients` hoặc nghe sự kiện rồi lưu bản sao nhỏ.
- `commons` trong service chỉ chứa thứ riêng của service đó; thứ hai service trở lên cùng cần thì chuyển sang `tthome-common`.
- Package đặt tên `vn.tthome.{service}` (ví dụ `vn.tthome.listing`); trên Nginx mỗi service nhận một tiền tố `/api/v1/...` riêng (mục 8).

### 4.2 Cấu trúc từng service

Mỗi dòng là một thư mục con của `src/main/java/vn/tthome/{name}/`. `controllers` ghi kèm tiền tố URL (Nginx định tuyến theo tiền tố này); `messaging` ghi routing key theo mẫu `<domain>.<aggregate>.<action>` (mục 4.3). Tên bảng đối chiếu với file `tthome_schema.sql`.

**identity-service**

```text
controllers/  AuthController (/api/v1/auth: register, otp, login, refresh, logout, forgot-password)
              MeController (/api/v1/me: hồ sơ, đổi mật khẩu, đổi SĐT/email, xóa tài khoản)
              AdminUserController (/api/v1/admin/users)  AdminRoleController (/admin/roles)  AdminTeamController (/admin/teams)
services/     AuthService  OtpService  TokenService  UserService  RoleService  TeamService  ConsentService
repos/        UserAccountRepo  RoleRepo  PermissionRepo  TeamRepo  TeamMemberRepo
              OtpChallengeRepo  RefreshTokenRepo  OAuthIdentityRepo  ConsentRepo
models/       entities/ UserAccount Role Permission Team TeamMember OtpChallenge RefreshToken OAuthIdentity Consent
              dtos/ RegisterRequest LoginRequest OtpVerifyRequest TokenResponse UserProfileResponse ...
              enums/ UserType  UserStatus  OtpPurpose  OtpChannel
messaging/    publishers/ identity.user.registered  identity.user.updated  identity.otp.requested
              listeners/  (không có)
clients/      (không có)
jobs/         ExpiredOtpCleanupJob  RevokedTokenCleanupJob
commons/      PasswordHasher (Argon2id)  JwtSigner (RS256)  OtpGenerator  RateLimitGuard (Redis)
```

**meey-sync-service**

```text
controllers/  SyncAdminController (/api/v1/admin/sync: chạy tay, trạng thái, danh sách lỗi, đối soát)
              MeeyWebhookController (/api/v1/webhooks/meey, chỉ bật khi Meey có webhook)
services/     MeeyPullService  MeeyPushService  ReconcileService  FileImportService
              mapping/ PropertyMapper  CustomerMapper  DemandMapper  TaskMapper  AddressNormalizer  AmenityNormalizer
repos/        RawRecordRepo  IdMapRepo  SyncRunRepo  SyncCursorRepo  SyncErrorRepo  PushQueueRepo
models/       entities/ MeeyRawRecord IdMap SyncRun SyncCursor SyncError PushQueueItem
              dtos/ meey/ (MeeyProperty, MeeyCustomer, ... theo đúng JSON của Meey)  SyncRunResponse
              enums/ EntityType  SyncKind  SyncStage
messaging/    publishers/ meey.property.upserted  meey.customer.upserted  meey.demand.upserted  meey.task.upserted
              listeners/  crm.lead.created  booking.appointment.created  consignment.submission.approved (đẩy ngược)
clients/      MeeyApiClient  (hoặc MeeyFileClient đọc file xuất từ thư mục nhập)
jobs/         PullJob (2 phút)  PushJob  ReconcileJob (ban đêm)
commons/      PayloadHasher  CursorUtils  RetryPolicy
```

**listing-service**

```text
controllers/  ProjectController (/api/v1/projects)  RoomController (/api/v1/rooms)  AreaController (/api/v1/areas)
              AmenityController (/amenities)  LandmarkController (/landmarks)
              AdminProjectController (/api/v1/admin/projects)  AdminRoomController (/admin/rooms)  AdminCatalogController
services/     ProjectService  RoomService  AreaStatsService  AmenityService  SlugService  ProjectUpsertService (nhận từ Meey)
repos/        ProjectRepo  RoomRepo  StockGroupRepo  AdminUnitRepo  AdminUnitMapRepo  AmenityRepo
              MediaLinkRepo  LandmarkRepo  RoomStatusHistoryRepo  AreaStatsRepo
models/       entities/ Project Room StockGroup AdminUnit Amenity ProjectAmenity RoomAmenity MediaLink Landmark RoomStatusHistory AreaStats
              dtos/ ProjectCardResponse ProjectDetailResponse RoomResponse AreaSummaryResponse ProjectDisplayUpdateRequest ...
              enums/ RoomStatus  RoomType  PetPolicy  Furniture
messaging/    publishers/ listing.room.changed  listing.project.changed  listing.area.changed
              listeners/  meey.property.upserted  media.asset.deleted
clients/      MediaClient (lấy URL ảnh khi cần)
jobs/         AreaStatsRebuildJob (mỗi đêm)
commons/      CodeGenerator (PRJ-...)  AddressResolver  PriceFormatter
```

**search-service**

```text
controllers/  SearchController (/api/v1/search)  SuggestController (/api/v1/suggest)  MapController (/api/v1/map)
              NearbyController (/api/v1/nearby)  SimilarController (/api/v1/rooms/{id}/similar)
              SavedSearchController (/api/v1/me/saved-searches)
services/     SearchService  SuggestService  NearbyService  SimilarRoomService  SavedSearchService  ListingDocProjector
repos/        ListingDocRepo (JdbcClient + bộ dựng WHERE động)  SavedSearchRepo  SearchLogRepo
models/       entities/ ListingDoc SavedSearch SearchLog
              dtos/ SearchRequest (khớp query string /tim-kiem)  SearchResponse  SuggestItem  MapPin
              enums/ SortOption (newest, price_asc, price_desc, nearest, popular)
messaging/    publishers/ (không có)
              listeners/  listing.room.changed  listing.project.changed  media.asset.uploaded
clients/      ListingClient (dựng lại toàn bộ listing_doc khi cần)
jobs/         RankScoreJob  SearchLogCleanupJob
commons/      QueryNormalizer (bỏ dấu, lower)  FilterSpec  GeoUtils
```

**media-service**

```text
controllers/  MediaController (/api/v1/media: POST /sign, POST /register, DELETE /{id})
              CloudinaryWebhookController (/api/v1/webhooks/cloudinary)
services/     UploadSignatureService  AssetService  ModerationService
repos/        AssetRepo
models/       entities/ Asset
              dtos/ SignatureResponse  RegisterAssetRequest  AssetResponse
              enums/ ResourceType  ModerationStatus  AssetSource
messaging/    publishers/ media.asset.uploaded  media.asset.deleted
              listeners/  (không có)
clients/      CloudinaryGateway (bọc SDK Cloudinary: ký upload, xoá, đổi tên, lấy thông tin)
jobs/         OrphanAssetCleanupJob
commons/      CloudinaryUrlBuilder (f_auto,q_auto, kích thước theo ngữ cảnh)  FolderNaming
```

**crm-service**

```text
controllers/  ConsultController (/api/v1/consults, công khai)  SavedItemController (/api/v1/me/saved)
              AdminCustomerController (/api/v1/admin/customers)  AdminDemandController (/admin/demands)
              AdminTaskController (/admin/tasks)  AdminConsultController (/admin/consults)  AdminNoteController
services/     CustomerService  LeadService (gộp khách theo SĐT)  DemandService  DemandMatchService  TaskService
              InteractionService  NoteService  SavedItemService  AssignmentService
repos/        CustomerRepo  CustomerGroupRepo  DemandRepo  DemandMatchRepo  ConsultRequestRepo
              TaskRepo  NoteRepo  InteractionRepo  SavedItemRepo  ViewHistoryRepo
models/       entities/ Customer CustomerGroup Demand DemandMatch ConsultRequest Task Note Interaction SavedItem ViewHistory
              dtos/ ConsultCreateRequest CustomerResponse DemandRequest TaskRequest ...
              enums/ CustomerStage  CustomerSource  TaskStatus  InteractionKind
messaging/    publishers/ crm.lead.created  crm.customer.stage_changed  crm.saved.price_changed
              listeners/  booking.appointment.*  identity.user.registered  meey.customer.upserted  meey.demand.upserted
                          listing.room.changed (báo giá đổi, khớp nhu cầu)
clients/      ListingClient (lấy thông tin phòng khi khớp nhu cầu)
jobs/         DemandMatchJob  OverdueTaskReminderJob  InteractionPartitionJob
commons/      PhoneNormalizer  DedupeKey  ScoreCalculator
```

**booking-service**

```text
controllers/  AppointmentController (/api/v1/appointments: tạo, đổi lịch, hủy, danh sách của tôi)
              AvailabilityController (/api/v1/appointments/slots)
              AdminAppointmentController (/api/v1/admin/appointments)  AdminStaffSlotController (/admin/staff-slots)
services/     BookingService  SlotService  AssignmentService  ReminderService
repos/        AppointmentRepo  AppointmentHistoryRepo  StaffSlotRepo
models/       entities/ Appointment AppointmentHistory StaffSlot
              dtos/ BookingRequest RescheduleRequest AppointmentResponse SlotResponse
              enums/ AppointmentStatus  VisitMode
messaging/    publishers/ booking.appointment.created  booking.appointment.changed  booking.appointment.cancelled
              listeners/  listing.room.changed (hủy lịch khi phòng đã thuê)
clients/      CrmClient (tạo/tìm khách theo SĐT)  ListingClient (kiểm tra phòng còn trống)
jobs/         AppointmentReminderJob  NoShowMarkerJob
commons/      CodeGenerator  OverlapChecker
```

**consignment-service**

```text
controllers/  ConsignmentController (/api/v1/consignments: gửi, xem, cập nhật, rút)
              LandlordRoomController (/api/v1/me/landlord/rooms: giá, còn trống/đã thuê)
              AdminConsignmentController (/api/v1/admin/consignments: duyệt, từ chối, yêu cầu bổ sung)
services/     SubmissionService  ReviewService  LandlordRoomService  ContractService (giai đoạn 2)
repos/        SubmissionRepo  SubmissionMediaRepo  ReviewLogRepo  LandlordContractRepo
models/       entities/ Submission SubmissionMedia ReviewLog LandlordContract
              dtos/ SubmissionRequest SubmissionResponse ReviewDecisionRequest ...
              enums/ SubmissionStatus  ContractStatus
messaging/    publishers/ consignment.submission.created  consignment.submission.approved  consignment.submission.rejected
              listeners/  meey.property.upserted (gán project_id sau khi Meey trả về)
clients/      MediaClient  ListingClient
jobs/         PhotoScheduleReminderJob
commons/      CodeGenerator  StatusMachine (luồng chuyển trạng thái hợp lệ)
```

**cms-service**

```text
controllers/  PostController (/api/v1/posts)  CategoryController (/categories)  PageController (/pages)
              FaqController (/faqs)  BannerController (/banners)  MenuController (/menus)  SeoController (/seo)
              PartnerApplicationController (/partner-applications: CTV, tuyển dụng)
              AdminCmsController (/api/v1/admin/cms/**)
services/     PostService  CategoryService  PageService  FaqService  BannerService  MenuService  SeoMetaService
              PartnerApplicationService  ContentSanitizer
repos/        PostRepo  CategoryRepo  TagRepo  PostTagRepo  BannerRepo  PageRepo  FaqRepo  MenuItemRepo
              SeoMetaRepo  PartnerApplicationRepo
models/       entities/ Post Category Tag PostTag Banner Page Faq MenuItem SeoMeta PartnerApplication
              dtos/ PostSummaryResponse PostDetailResponse PageResponse MenuResponse ...
              enums/ PostStatus  MenuLocation  Locale
messaging/    publishers/ cms.content.changed (Next.js nhận để revalidate)  cms.partner.applied
              listeners/  listing.project.changed (cập nhật SEO meta mặc định)
clients/      (không có)
jobs/         ScheduledPublishJob
commons/      SlugUtil (bỏ dấu tiếng Việt)  ReadingTime  TocBuilder
```

**notification-service**

```text
controllers/  NotificationController (/api/v1/me/notifications, /me/notification-preferences)
              AdminTemplateController (/api/v1/admin/notification-templates)
services/     DispatchService  TemplateRenderer  DedupeService  PreferenceService
              channel/ SmsSender  ZaloZnsSender  EmailSender  PushSender (giai đoạn 2)
repos/        TemplateRepo  MessageRepo  PreferenceRepo
models/       entities/ Template Message Preference
              dtos/ NotificationResponse TemplateRequest SendCommand
              enums/ Channel  MessageStatus
messaging/    publishers/ (không có)
              listeners/  identity.otp.requested  booking.appointment.*  consignment.submission.*  crm.saved.price_changed
clients/      SmsGatewayClient  ZaloZnsClient  (email qua SMTP)
jobs/         RetryFailedMessageJob  MessagePartitionJob
commons/      RecipientResolver  QuietHours  ProviderErrorMapper
```

**report-service**

```text
controllers/  EventIngestController (/api/v1/events, công khai, gộp theo lô)
              AdminDashboardController (/api/v1/admin/dashboard)  AdminReportController (/admin/reports: xuất Excel)
              AdminAuditController (/admin/audit-logs)
services/     EventIngestService  DashboardService  MetricAggregationService  ExportService (Apache POI)  AuditService
repos/        EventRepo  DailyMetricRepo  AuditLogRepo
models/       entities/ Event DailyMetric AuditLog
              dtos/ EventBatchRequest DashboardResponse ReportQuery AuditLogResponse
              enums/ MetricName  EventName
messaging/    publishers/ (không có)
              listeners/  #  (nghe tất cả sự kiện để ghi audit và đếm chỉ số)
clients/      (không có)
jobs/         DailyMetricJob  EventPartitionJob  RetentionJob
commons/      DateRangeUtils  ExcelStyles
```

### 4.3 `tthome-common`, `tthome-events` và RabbitMQ

```text
tthome-common/src/main/java/vn/tthome/common/
  web/         ApiResponse  PageResponse  GlobalExceptionHandler  RequestIdFilter
  error/       ErrorCode  BusinessException  NotFoundException  ForbiddenException
  security/    JwtClaims  CurrentUser  AuthHeaderFilter (đọc header do Nginx gắn sau auth_request)  RequirePermission
  persistence/ AuditableEntity (created_at, updated_at, deleted_at, version)  UuidV7Generator  SlugUtil
  outbox/      OutboxEntity  OutboxRepo  OutboxPublisher (ghi trong giao dịch)  OutboxRelay (đọc, publish RabbitMQ, đánh dấu published_at)
  messaging/   EventEnvelope  IdempotentListener (bảng processed_event)  RabbitTopology
  client/      HttpClientFactory (timeout, retry, circuit breaker Resilience4j)
  observability/ TraceConfig  MetricsConfig

tthome-events/src/main/java/vn/tthome/events/
  identity/  listing/  meey/  crm/  booking/  consignment/  cms/  media/   # mỗi sự kiện là một record, có số phiên bản
```

**Quy ước RabbitMQ**

- Một exchange `tthome.events` kiểu topic; routing key `<domain>.<aggregate>.<action>`, ví dụ `listing.room.changed`.
- Mỗi service tự khai báo queue của mình theo mẫu `{service}.{domain}` và bind theo routing key cần nghe; không dùng chung queue giữa hai service.
- Thông điệp lỗi sau 3 lần thử (backoff 5 giây, 30 giây, 5 phút) đẩy sang exchange `tthome.dlx` và queue `{service}.dlq`; có trang quản trị để phát lại.
- Queue định nghĩa trong `infra/rabbitmq/definitions.json` và dùng quorum queue; service chỉ đọc, không tự tạo trên production.
- Giao tiếp cần trả lời ngay (kiểm phòng còn trống khi đặt lịch, lấy thông tin phòng) dùng REST qua `clients/`, không dùng RabbitMQ.

## 5. Thiết kế PostgreSQL

Một cụm PostgreSQL (1 primary + 2 read replica) chia 11 schema theo service; các bảng nghiệp vụ đặt tên và quan hệ theo đúng đối tượng của Meey CRM để ánh xạ 1–1. Meey CRM không công bố schema hay API ([meeycrm.com](https://meeycrm.com/)), nên danh sách trường dưới đây dựa trên các đối tượng Meey mô tả công khai và phải chốt lại khi có file xuất hoặc API mẫu.

DDL đầy đủ nằm trong file `tthome_schema.sql` (66 bảng nghiệp vụ + 22 bảng `outbox`/`processed_event`), đã chạy thử trên PostgreSQL 16; sơ đồ quan hệ trong `tthome.dbml` (dán vào dbdiagram.io). Hai file là nguồn đúng, phần dưới chỉ tóm tắt.

**Ánh xạ đối tượng Meey CRM → TTHome**

| Đối tượng Meey CRM | Bảng TTHome | Ghi chú |
| --- | --- | --- |
| Quỹ hàng / nguồn hàng | `inventory.project`, `inventory.room` | Một nguồn hàng cho thuê = một dự án (tòa) có nhiều phòng |
| Kho hàng (nhóm quỹ hàng) | `inventory.stock_group` | Phân quyền xem theo kho |
| Khách hàng, kho khách | `crm.customer`, `crm.customer_group` | Gộp khách từ web và từ CRM theo SĐT |
| Nhu cầu | `crm.demand`, `crm.demand_match` | So khớp nhu cầu với phòng trống |
| Công việc | `crm.task` | Nhắc việc quá hạn |
| Lịch hẹn | `booking.appointment` | Lịch xem phòng từ web đẩy ngược về CRM nếu có API |
| Lịch sử tương tác (gọi, gặp, email) | `crm.interaction` | Phân vùng theo tháng |
| Ghi chú | `crm.note` | Ghi chú cá nhân và theo công việc |
| Nhóm, thành viên, phân quyền nhiều cấp | `identity.team`, `identity.team_member`, `identity.role`, `identity.permission` |  |
| Lịch sử giao dịch / trạng thái | `inventory.room_status_history` | Phân vùng theo tháng |
| Trường tùy biến | cột `attributes jsonb` trên mọi bảng đồng bộ | Meey thêm trường mới không cần migration |

**Schema và bảng chính**

| Schema | Bảng |
| --- | --- |
| `identity` | `user_account`, `role`, `permission`, `role_permission`, `user_role`, `team`, `team_member`, `otp_challenge`, `refresh_token`, `oauth_identity`, `consent` |
| `inventory` | `admin_unit`, `admin_unit_map`, `stock_group`, `amenity`, `project`, `room`, `project_amenity`, `room_amenity`, `media_link`, `landmark`, `room_status_history`, `area_stats` |
| `search` | `listing_doc` (1 dòng/phòng, đủ cột lọc), `saved_search`, `search_log` |
| `crm` | `customer_group`, `customer`, `demand`, `demand_match`, `consult_request`, `task`, `note`, `interaction`, `saved_item`, `view_history` |
| `booking` | `staff_slot`, `appointment`, `appointment_history` |
| `consignment` | `submission`, `submission_media`, `review_log`, `landlord_contract` |
| `cms` | `category`, `tag`, `post`, `post_tag`, `banner`, `page`, `faq`, `menu_item`, `seo_meta`, `partner_application` (mọi bảng nội dung có cột `locale`) |
| `notify` | `template`, `preference`, `message` |
| `media` | `asset` (metadata Cloudinary: `public_id`, `secure_url`, kích thước, version) |
| `sync` | `meey_raw_record`, `id_map`, `sync_cursor`, `sync_run`, `sync_error`, `push_queue` |
| `report` | `event`, `daily_metric`, `audit_log` |

Mỗi schema có thêm `outbox` và `processed_event` (mục 4).

**Cách mở rộng**

- Khóa chính UUIDv7 (tăng theo thời gian, không phụ thuộc sequence) để sau này tách schema sang cụm khác hoặc gộp dữ liệu không bị trùng khóa.
- `search.listing_doc` là bảng đọc phi chuẩn hóa: mỗi phòng một dòng chứa giá, loại, mảng tiện nghi, tọa độ, `tsvector`; trang tìm kiếm chỉ đọc một bảng này trên replica. Khi vượt khoảng 200.000 phòng hoặc p95 trên 300 ms, đổi sang OpenSearch mà không đổi API.
- `inventory.area_stats` (số phòng trống, giá từ, số tòa theo phường) cập nhật theo sự kiện, phục vụ trang chủ và trang khu vực không cần GROUP BY.
- Bảng chỉ ghi thêm (`room_status_history`, `interaction`, `notify.message`, `report.event`, `audit_log`, `outbox`) phân vùng theo tháng bằng hàm common.ensure\_monthly\_partitions (job hằng tháng, không cần pg\_partman), index BRIN trên cột thời gian, xóa partition cũ theo chính sách lưu trữ.
- PgBouncer (transaction pooling) trước cụm; mỗi service một user DB chỉ có quyền trên schema của mình.
- Patroni (hoặc PostgreSQL managed) cho failover tự động; pgBackRest backup full hằng ngày + WAL để khôi phục về bất kỳ thời điểm nào trong 14 ngày.
- Khi một schema tải nặng (thường là `report` hoặc `crm`), chuyển schema đó sang cụm riêng; vì không có JOIN chéo schema nên chỉ đổi connection string.

## 6. Đồng bộ với Meey CRM

meey-sync-service kéo thay đổi từ Meey CRM mỗi 2 phút, lưu bản gốc, ánh xạ rồi phát sự kiện để các service cập nhật; mỗi đêm chạy đối soát toàn bộ. Meey hiện không công bố API cho bên ngoài, nên việc đầu tiên là xin quyền truy cập dữ liệu từ Meey.

**Nguồn dữ liệu, theo thứ tự ưu tiên**

1. API hoặc webhook đối tác do Meey Land cấp: độ trễ dưới 1 phút, đẩy ngược được lịch hẹn và khách từ web về CRM.
2. File xuất định kỳ (Excel/CSV) từ Meey CRM: nhân viên hoặc job tải lên thư mục nhập (volume Docker hoặc SFTP), service tự nhận; độ trễ bằng chu kỳ xuất.
3. Không dùng cào dữ liệu (scraping) ứng dụng Meey: dễ vi phạm điều khoản và vỡ khi Meey đổi giao diện.

Nếu chỉ có cách 2, mục tiêu trễ 5 phút ở mục 1 không đạt được; khi đó nên cân nhắc chuyển việc nhập trạng thái phòng sang admin TTHome.

**Các bước xử lý**

1. **Kéo**: gọi API theo con trỏ `updated_at` lưu trong `sync.sync_cursor` (hoặc đọc file mới); mỗi lần chạy ghi `sync_run`.
2. **Lưu bản gốc**: upsert vào `sync.meey_raw_record`; nếu `payload_hash` không đổi thì bỏ qua.
3. **Ánh xạ**: MapStruct chuyển trường; chuẩn hóa địa chỉ về `admin_unit` (cũ và mới), tiện nghi về mã `amenity`; ghi `sync.id_map` (meey\_id ↔ uuid, mã PRJ). Lỗi ghi `sync_error`, không chặn cả lô.
4. **Phát sự kiện** `meey.property.upserted`, `meey.customer.upserted`, … qua outbox.
5. **Cập nhật**: listing-service upsert dự án/phòng, ghi `room_status_history`, phát `listing.room.changed`; search-service cập nhật `listing_doc` và `area_stats`; Next.js nhận webhook để làm mới đúng trang bị ảnh hưởng (on-demand revalidate theo tag `project:{code}`, `ward:{slug}`).
6. **Đối soát đêm**: so số lượng và hash từng bản ghi; bản ghi biến mất 2 đêm liên tiếp thì ẩn (soft delete), không xóa cứng.

**Ai là nguồn đúng cho trường nào**

| Dữ liệu | Nguồn đúng | Chiều đồng bộ |
| --- | --- | --- |
| Thông tin dự án, phòng, giá, trạng thái, ngày trống | Meey CRM | Meey → TTHome |
| Slug, SEO meta, ảnh bìa, thứ tự ảnh, nhãn ưu đãi, độc quyền hiển thị | TTHome admin | Chỉ TTHome |
| Khách hàng, nhu cầu tạo trên web | TTHome | TTHome → Meey (nếu có API ghi), nếu không thì xuất file hằng ngày |
| Lịch hẹn xem phòng | TTHome | TTHome → Meey, như trên |
| Phòng ký gửi đã duyệt | TTHome → nhập vào Meey | Sau khi có meey\_id thì Meey là nguồn đúng |

**Giám sát**: metric `sync_lag_seconds` và `sync_error_total` trên Grafana; cảnh báo khi trễ quá 10 phút hoặc lỗi ánh xạ vượt 1% một lô.

## 7. Frontend Next.js

Frontend là monorepo pnpm + Turborepo gồm 2 app (web công khai, admin) dùng chung thư viện giao diện và API client sinh từ OpenAPI. Trang công khai render trên server (ISR) để đạt SEO; trang tài khoản và admin render trên trình duyệt.

```text
frontend/
  apps/
    web/app/
      page.tsx                          # trang chủ
      tim-kiem/page.tsx
      phong-tro/[tinh]/[quan]/[[...slug]]/page.tsx   # phường hoặc khoảng giá
      du-an/[slug]/page.tsx             # {slug}-PRJ-{mã}
      phong/[slug]/page.tsx
      dat-lich/  ky-gui/  tuyen-ctv/  ve-chung-toi/  lien-he/  hoi-dap/
      chinh-sach/[slug]/page.tsx
      tin-tuc/  tin-tuc/[slug]/  tin-tuc/chuyen-muc/[slug]/  tin-tuc/tag/[slug]/
      tai-khoan/(protected)/{ho-so,da-luu,lich-hen,phong-ky-gui}/
      api/revalidate/route.ts           # webhook làm mới ISR theo tag
      api/auth/[...action]/route.ts     # BFF: đặt cookie httpOnly
      sitemap.ts  robots.ts
    admin/app/                          # dashboard, phòng, ký gửi, lịch hẹn, khách, CMS, báo cáo
  packages/
    ui/            # design system: Tailwind + shadcn/ui, thẻ dự án, bộ lọc, carousel
    api-client/    # sinh từ OpenAPI của gateway
    config/        # eslint, tsconfig, tailwind preset
```

| Trang | Cách render | Làm mới |
| --- | --- | --- |
| Trang chủ, khu vực, dự án, phòng | ISR | Theo tag khi có sự kiện `listing.*`; dự phòng mỗi 10 phút |
| Tìm kiếm | SSR trang đầu, sau đó gọi API phía client | Không cache HTML |
| Tin tức, trang tĩnh, FAQ | ISR | Theo tag khi sửa trong CMS |
| Tài khoản, admin | Client (TanStack Query) | — |

**Quy ước**

- Bộ lọc lưu trên URL (thư viện nuqs) để chia sẻ và để Google index được trang lọc phổ biến.
- SEO: `generateMetadata`, canonical, JSON-LD (`BreadcrumbList`, `FAQPage`, `Article`, `Accommodation`), sitemap chia nhỏ theo dự án/phòng/khu vực/bài viết.
- Ảnh qua `next/image` với loader Cloudinary (f\_auto, q\_auto); bản đồ Google Maps chỉ tải khi người dùng mở.
- Đăng nhập: access token 15 phút, refresh token 30 ngày, cả hai trong cookie httpOnly do route BFF đặt.
- Đa ngôn ngữ (giai đoạn 2) bằng next-intl: tiếng Việt không tiền tố, tiếng Anh dưới `/en`.
- Đo chuyển đổi qua Google Tag Manager (GA4, Meta Pixel) với các sự kiện `search`, `view_project`, `booking_submit`, `consign_submit`, `click_call`, `click_zalo`.

## 8. Hạ tầng, Nginx, CI/CD và bảo mật

Toàn bộ chạy container bằng Docker trên máy ảo của một nhà cung cấp cloud trong nước (Docker Compose; chuyển Kubernetes khi số container vượt khoảng 20) (dữ liệu cá nhân người thuê lưu tại Việt Nam), với 3 môi trường dev, staging, production. Nginx đứng ở biên (2 nút + keepalived), sau CDN/WAF.

**Cấu hình khởi đầu cho production**

| Thành phần | Cấu hình | Mở rộng bằng |
| --- | --- | --- |
| Nginx (cổng vào + API Gateway) | 2 VM × 2 vCPU / 4 GB | Thêm nút sau load balancer |
| Docker host (Compose) | 3 VM × 8 vCPU / 16 GB | Thêm VM, tăng số bản sao container; chuyển Kubernetes khi cần |
| PostgreSQL | Primary 8 vCPU / 32 GB + 2 replica, SSD | Thêm replica; tách schema nặng |
| RabbitMQ | 3 node, quorum queue | Thêm node; tách queue theo service |
| Redis | 1 primary + 1 replica (Sentinel) | Redis Cluster |
| Ảnh/video | Cloudinary (gói theo dung lượng và băng thông, có CDN) | Nâng gói |

Dev và staging chạy bản thu nhỏ (1 nút, PostgreSQL đơn, RabbitMQ 1 node). Chi phí thuê chốt sau khi chọn nhà cung cấp.

**Nginx làm API Gateway**

| Tiền tố URL | Service | Đăng nhập |
| --- | --- | --- |
| `/api/v1/auth` | identity | Không (OTP giới hạn 5 lần/phút/IP) |
| `/api/v1/projects`, `rooms`, `areas`, `amenities`, `landmarks` | listing | Không |
| `/api/v1/search`, `suggest`, `map`, `nearby` | search | Không |
| `/api/v1/consults` | crm | Không |
| `/api/v1/posts`, `categories`, `pages`, `faqs`, `banners`, `menus`, `seo`, `partner-applications` | cms | Không |
| `/api/v1/events` | report | Không |
| `/api/v1/appointments` | booking | Có |
| `/api/v1/consignments` | consignment | Có |
| `/api/v1/media` | media | Có |
| `/api/v1/me` | identity | Có |
| `/api/v1/me/saved` | crm | Có |
| `/api/v1/me/saved-searches` | search | Có |
| `/api/v1/me/notifications`, `me/notification-preferences` | notification | Có |
| `/api/v1/me/landlord` | consignment | Có |
| `/api/v1/admin/users`, `roles`, `teams` | identity | Có + quyền quản trị |
| `/api/v1/admin/projects`, `rooms`, `catalog` | listing | Có + quyền quản trị |
| `/api/v1/admin/customers`, `demands`, `tasks`, `consults`, `notes` | crm | Có + quyền quản trị |
| `/api/v1/admin/appointments`, `staff-slots` | booking | Có + quyền quản trị |
| `/api/v1/admin/consignments` | consignment | Có + quyền quản trị |
| `/api/v1/admin/cms` | cms | Có + quyền quản trị |
| `/api/v1/admin/notification-templates` | notification | Có + quyền quản trị |
| `/api/v1/admin/dashboard`, `reports`, `audit-logs` | report | Có + quyền quản trị |
| `/api/v1/admin/sync` | meey-sync | Có + quyền quản trị |
| `/api/v1/webhooks/cloudinary` | media | Chữ ký Cloudinary |
| `/` (còn lại), `/admin` | Next.js web, Next.js admin | Theo trang |

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=otp:10m rate=5r/m;
proxy_cache_path /var/cache/nginx/auth keys_zone=auth:5m max_size=20m;

upstream web      { server web:3000;              keepalive 32; }
upstream admin    { server admin:3001;            keepalive 16; }
upstream identity { server identity-service:8080; keepalive 32; }
upstream listing  { server listing-service:8080;  keepalive 32; }
upstream search   { server search-service:8080;   keepalive 32; }
# ... các upstream còn lại tương tự: media, crm, booking, consignment, cms, notification, report, meey_sync

server {
  listen 443 ssl;  http2 on;
  server_name tthome.vn www.tthome.vn;
  ssl_certificate     /etc/ssl/tthome/fullchain.pem;
  ssl_certificate_key /etc/ssl/tthome/privkey.pem;
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options nosniff always;
  gzip on;  gzip_types text/css application/javascript application/json image/svg+xml;

  # Nginx hỏi identity-service; kết quả cache 30 giây theo token
  location = /_auth {
    internal;
    proxy_pass http://identity/internal/auth/verify;
    proxy_pass_request_body off;  proxy_set_header Content-Length "";
    proxy_cache auth;  proxy_cache_key $http_authorization$cookie_access_token;  proxy_cache_valid 200 30s;
  }

  # route công khai
  location /api/v1/auth/otp { limit_req zone=otp burst=3 nodelay; include snippets/proxy_public.conf; proxy_pass http://identity; }
  location /api/v1/auth/    { include snippets/proxy_public.conf; proxy_pass http://identity; }
  location ~ ^/api/v1/(projects|rooms|areas|amenities|landmarks)(/|$) {
    limit_req zone=api burst=40;  include snippets/proxy_public.conf;  proxy_pass http://listing;
  }
  location ~ ^/api/v1/(search|suggest|map|nearby)(/|$) {
    limit_req zone=api burst=40;  include snippets/proxy_public.conf;  proxy_pass http://search;
  }

  # route cần đăng nhập: snippet gắn auth_request + X-User-Id, X-User-Roles (xóa header giả từ client)
  location /api/v1/me/saved-searches { include snippets/proxy_auth.conf; proxy_pass http://search; }
  location /api/v1/me/               { include snippets/proxy_auth.conf; proxy_pass http://identity; }
  location /api/v1/admin/projects    { include snippets/proxy_auth.conf; proxy_pass http://listing; }
  # ... các route admin và /me còn lại theo bảng trên

  location /admin { include snippets/proxy_web.conf; proxy_pass http://admin; }
  location /_next/static/ { proxy_pass http://web; expires 1y; add_header Cache-Control "public, immutable"; }
  location /              { include snippets/proxy_web.conf; proxy_pass http://web; }
}
server { listen 80; server_name tthome.vn www.tthome.vn; return 301 https://tthome.vn$request_uri; }
```

File `snippets/proxy_auth.conf` gồm `auth_request /_auth;`, `auth_request_set $uid $upstream_http_x_user_id;`, `proxy_set_header X-User-Id $uid;` (tương tự cho `X-User-Roles`), và `limit_req zone=api burst=40;`; `proxy_public.conf` chỉ đặt `proxy_set_header X-User-Id "";` rồi chuyển tiếp.

Nginx không chỉ chuyển tiếp mà còn hỏi identity-service (`auth_request`) trước mọi route cần đăng nhập, rồi gắn header `X-User-Id`, `X-User-Roles`; service đọc header này qua `AuthHeaderFilter` trong `tthome-common`. Kết quả xác thực được cache 30 giây theo token để không gọi identity ở mọi request. Nginx phải xóa mọi header `X-User-*` do trình duyệt gửi lên, nếu không người dùng có thể giả danh. Container của service chỉ nằm trong mạng Docker nội bộ, không mở port ra ngoài.

**CI/CD**

1. Mỗi pull request: lint, unit test, integration test với Testcontainers (PostgreSQL, RabbitMQ thật), kiểm tra hợp đồng OpenAPI.
2. Merge vào `main`: build image (jib-maven-plugin cho Java, Next.js `output: standalone`), quét lỗ hổng bằng Trivy, đẩy lên registry.
3. GitHub Actions triển khai staging tự động bằng docker compose pull + up -d qua SSH; production cần duyệt tay, khởi động lại từng container, rollback bằng tag image trước.
4. Migration Flyway chạy trước khi container mới nhận tải; chỉ cho phép thay đổi tương thích ngược (expand → migrate → contract).

**Giám sát**: OpenTelemetry trong mọi service → Prometheus (metric), Loki (log), Tempo (trace), xem trên Grafana; Sentry cho lỗi frontend; cảnh báo qua Telegram/Zalo khi lỗi 5xx vượt 1% hoặc p95 vượt 800 ms.

**Bảo mật và dữ liệu cá nhân**

- Mật khẩu băm Argon2id; JWT ký RS256, xoay khóa định kỳ; khóa tài khoản 15 phút sau 5 lần sai.
- OTP: 5 lần gửi/giờ/SĐT, mã hết hạn sau 5 phút, chặn theo IP và thiết bị để tránh đốt tiền SMS.
- Secret lưu trong Vault hoặc Sealed Secrets, không nằm trong repo.
- Ghi nhận đồng ý thu thập dữ liệu (`identity.consent`), cho phép xuất và xóa tài khoản theo yêu cầu, theo Luật Bảo vệ dữ liệu cá nhân.
- Kiểm thử theo OWASP ASVS cấp 1 trước khi ra mắt; diễn tập khôi phục backup mỗi tháng.

## 9. Lộ trình, nhân sự và ước lượng

MVP cần 16 tuần với đội 9 người, khoảng 36 người-tháng; giai đoạn 2 thêm khoảng 10 tuần. Mỗi giai đoạn kết thúc bằng một cổng kiểm soát; chưa qua cổng thì chưa sang giai đoạn sau.

&#91;embedded content: lộ trình · 5 giai đoạn MVP + giai đoạn 2\]

Cổng đầu tiên phụ thuộc Meey: nếu tuần 2 chưa có dữ liệu mẫu, giai đoạn 1 vẫn làm được với dữ liệu giả nhưng phần ánh xạ có thể phải làm lại.

| Vai trò | Số người | Thời gian | Việc chính |
| --- | --- | --- | --- |
| PM / BA | 1 | Tuần 1–16 | Đặc tả chức năng, làm việc với Meey, nghiệm thu |
| UI/UX | 1 | Tuần 1–10 | Wireframe theo mục 3, design system, giao diện web và admin |
| Backend Java | 3 | Tuần 2–16 | 11 service, sync Meey, DB, API |
| Frontend Next.js | 2 | Tuần 3–16 | Web công khai, admin, SEO |
| DevOps | 1 | Tuần 1–16 | Docker, Nginx, CI/CD, giám sát, backup |
| QA | 1 | Tuần 5–16 | Test tự động, kiểm thử tải, UAT |

## 10. Rủi ro và điểm cần xác nhận

Rủi ro lớn nhất là quyền truy cập dữ liệu Meey CRM và ngân sách; cả hai cần chốt trong 2 tuần đầu, trước khi viết code.

| Rủi ro | Ảnh hưởng | Cách xử lý |
| --- | --- | --- |
| Meey CRM không có API công khai | Không đồng bộ tự động được; dữ liệu web trễ | Xin API đối tác từ Meey Land ngay tuần 1; dự phòng nhập file xuất; cân nhắc chuyển quản lý trạng thái phòng sang admin TTHome |
| Ngân sách trong file Excel là 8,2 triệu đồng | Không đủ cho khoảng 36 người-tháng ở mục 9 | Chốt lại ngân sách; hoặc bắt đầu bằng modular monolith (Spring Modulith, cùng ranh giới module và schema như mục 4–5) rồi tách service khi tải tăng |
| Giống 80% HiFriendz/GoPlus | Tranh chấp sở hữu trí tuệ, cạnh tranh không lành mạnh | Chỉ theo cấu trúc trang, luồng và bộ lọc; tự thiết kế logo, màu, ảnh, văn bản, mã nguồn |
| Địa giới hành chính sau sáp nhập 2025 | Địa chỉ trên Meey lẫn cũ và mới, lọc khu vực sai | Bảng `admin_unit` hai hệ + `admin_unit_map`; bộ lọc "Địa chỉ sau sáp nhập" như HiFriendz |
| Spam OTP | Chi phí SMS tăng vọt | Giới hạn tần suất, captcha, ưu tiên Zalo ZNS |
| Đội nhỏ vận hành 11 service | Chậm sửa lỗi, tốn hạ tầng | Gom triển khai giai đoạn đầu (mục 4), template service chung, Helm chart chung |

**Cần xác nhận**

- [ ] Meey Land có cấp API/webhook không, có quyền ghi ngược (lịch hẹn, khách) không?
- [ ] File xuất mẫu từ Meey CRM (để chốt danh sách trường mục 5).
- [ ] Số dự án, số phòng và số khách hiện có trên Meey.
- [ ] Ngân sách và ngày ra mắt mong muốn.
- [ ] Có làm app di động không (file Excel nhắc "cột App")?
- [ ] Tên miền, nhà cung cấp cloud, nhà cung cấp SMS/Zalo ZNS.

## Nguồn

- [GoPlus — trang chủ](https://goplus.com.vn/), [trang khu vực An Phú Đông](https://goplus.com.vn/phong-tro/ho-chi-minh/quan-12/an-phu-dong), [chi tiết dự án](https://goplus.com.vn/du-an/PRJ-5f2b9683058b2e2b6559), [ký gửi](https://goplus.com.vn/ky-gui), [đặt lịch](https://goplus.com.vn/dat-lich)
- [HiFriendz — trang chủ](https://hifriendz.com/), [tìm kiếm](https://hifriendz.com/tim-kiem), [bài cẩm nang](https://hifriendz.com/tin-tuc/kinh-nghiem-thue-phong-tro-sinh-vien-2026)
- [Meey CRM — trang giới thiệu](https://meeycrm.com/), [Meey CRM - Plus trên App Store](https://apps.apple.com/us/app/id6469034524), [bài ra mắt Meey CRM](https://tapchitoaan.vn/ra-mat-ung-dung-quan-ly-khach-hang-va-nguon-hang-danh-rieng-cho-nha-moi-gioi-bat-dong-san-meey-crm)
- File "Các Chức Năng Chính TTHOME.xlsx" do bạn cung cấp
