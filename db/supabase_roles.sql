-- Chạy trong Supabase SQL Editor SAU KHI nạp tthome_schema.sql.
-- Mỗi service một role, chỉ có quyền trên schema của nó. Đổi mật khẩu trước khi chạy.
-- Kết nối qua pooler: username = <role>.<PROJECT-REF>
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('identity_svc','identity'),('inventory_svc','inventory'),('search_svc','search'),
    ('crm_svc','crm'),('booking_svc','booking'),('consignment_svc','consignment'),
    ('cms_svc','cms'),('notify_svc','notify'),('media_svc','media'),
    ('sync_svc','sync'),('report_svc','report')) AS t(role_name, sch)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.role_name) THEN
      EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', r.role_name, 'CHANGE_ME_' || r.role_name);
    END IF;
    EXECUTE format('GRANT USAGE, CREATE ON SCHEMA %I TO %I', r.sch, r.role_name);
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO %I', r.sch, r.role_name);
    EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO %I', r.sch, r.role_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO %I', r.sch, r.role_name);
    -- dùng chung hàm tiện ích và extension
    EXECUTE format('GRANT USAGE ON SCHEMA common, public, extensions TO %I', r.role_name);
    -- khóa quyền truy cập qua Data API (PostgREST)
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM anon, authenticated', r.sch);
  END LOOP;
END $$;
-- Lưu ý: tên service trong code là "listing-service" nhưng schema là "inventory" => role inventory_svc.
-- Việc cần làm tay: ALTER ROLE ... PASSWORD '...' cho từng role; không expose các schema này ở Settings > Data API.
