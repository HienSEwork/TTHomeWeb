# TTHome backend (Maven)

Sinh bởi tthome_init_backend.py từ Spring Initializr.

## Build
    ./mvnw clean verify                                          # toàn bộ
    ./mvnw -pl services/listing-service -am package              # một service + module nó phụ thuộc
    ./mvnw -pl services/listing-service spring-boot:run          # chạy một service

## Cần có trước khi chạy service (database = Supabase)
1. Chạy `db/tthome_schema.sql` trong Supabase SQL Editor, rồi `db/supabase_roles.sql` (đổi mật khẩu role).
2. Sao chép `infra/docker/.env.example` thành `.env`, điền SUPABASE_PROJECT_REF, SUPABASE_DB_URL, DB_PASSWORD.
3. Dùng **session pooler (cổng 5432)** cho service; transaction pooler (6543) không hỗ trợ prepared statement nên không hợp với JPA.
4. RabbitMQ (mặc định localhost:5672). Không có container Postgres trong Docker Compose.
5. JPA để `ddl-auto: validate`: thiếu bảng thì app dừng ngay khi khởi động.
6. Migration Flyway của từng service bắt đầu từ V2 (schema nền là V1).

## Việc còn lại phải làm tay (không có trên Initializr)
- identity-service: Argon2 (de.mkammerer:argon2-jvm), JWT (io.jsonwebtoken:jjwt-*)
- media-service: Cloudinary SDK (com.cloudinary:cloudinary-http5)
- report-service: Apache POI (org.apache.poi:poi-ooxml)
- *: Resilience4j khi service gọi service khác qua clients/

## Ghi chú
- Port: identity 8081, meey-sync 8082, listing 8083, search 8084, media 8085, crm 8086,
  booking 8087, consignment 8088, cms 8089, notification 8090, report 8091.
- tthome-common và tthome-events là thư viện: starter trong tthome-common để optional,
  mỗi service tự khai starter nó cần (Initializr đã khai sẵn).
- Phiên bản MapStruct và lombok-mapstruct-binding đặt trong backend/pom.xml; kiểm tra bản mới nhất.
