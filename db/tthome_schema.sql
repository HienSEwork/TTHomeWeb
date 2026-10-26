-- =====================================================================
-- TTHome - PostgreSQL schema (mô phỏng cấu trúc Meey CRM, đồng bộ 2 chiều)
-- Stack: Spring Boot (microservice) + Next.js + Nginx gateway + RabbitMQ + Cloudinary + Docker
-- Yêu cầu: PostgreSQL 16+ (image postgres:17 đủ extension, không cần PostGIS)
-- Quy ước:
--   * Mỗi service sở hữu 1 schema, KHÔNG JOIN / FK chéo schema (chỉ lưu uuid tham chiếu).
--   * PK là uuid do ứng dụng sinh (UUIDv7); default gen_random_uuid() chỉ để dự phòng.
--   * Bảng ghi nhiều (log/lịch sử/sự kiện) phân vùng theo tháng.
--   * Cột meey_id = id bản ghi bên Meey CRM; attributes jsonb = trường tùy biến của Meey.
--   * Xóa mềm bằng deleted_at; khóa lạc quan bằng version.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;     -- tìm gần vị trí (thay PostGIS cho MVP)

CREATE SCHEMA IF NOT EXISTS common;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS search;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS booking;
CREATE SCHEMA IF NOT EXISTS consignment;
CREATE SCHEMA IF NOT EXISTS cms;
CREATE SCHEMA IF NOT EXISTS notify;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS sync;
CREATE SCHEMA IF NOT EXISTS report;

-- ---------------------------------------------------------------------
-- 0. Hàm dùng chung
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION common.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- unaccent không IMMUTABLE nên không dùng được trong index; bọc lại.
CREATE OR REPLACE FUNCTION common.f_unaccent(text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent', $1) $$;

-- Tạo partition theo tháng cho bảng cha (gọi bởi job hằng tháng; không cần pg_partman).
CREATE OR REPLACE FUNCTION common.ensure_monthly_partitions(
  parent regclass, months_ahead int DEFAULT 3) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  m date; part_name text; nsp text; rel text;
BEGIN
  SELECT n.nspname, c.relname INTO nsp, rel
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.oid = parent;
  FOR i IN 0..months_ahead LOOP
    m := date_trunc('month', now() + make_interval(months => i))::date;
    part_name := format('%s_%s', rel, to_char(m, 'YYYYMM'));
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I.%I PARTITION OF %s FOR VALUES FROM (%L) TO (%L)',
      nsp, part_name, parent, m, (m + interval '1 month')::date);
  END LOOP;
END $$;

-- Gắn trigger updated_at cho mọi bảng thường có cột updated_at (chạy cuối file).
CREATE OR REPLACE FUNCTION common.attach_updated_at_triggers() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.table_schema s, c.table_name t
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.column_name = 'updated_at' AND tb.table_type = 'BASE TABLE'
      AND c.table_schema IN ('identity','inventory','search','crm','booking',
                             'consignment','cms','notify','media','sync','report')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I.%I', r.s, r.t);
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I.%I
         FOR EACH ROW EXECUTE FUNCTION common.set_updated_at()', r.s, r.t);
  END LOOP;
END $$;

-- =====================================================================
-- 1. IDENTITY  (tài khoản, OTP, 5 vai trò, nhóm/team như Meey CRM)
-- =====================================================================
CREATE TABLE identity.user_account (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone             text,
  email             text,
  password_hash     text,                         -- Argon2id; null nếu chỉ đăng nhập OTP/Google
  full_name         text,
  avatar_url        text,                         -- URL Cloudinary
  user_type         text NOT NULL DEFAULT 'tenant'
                    CHECK (user_type IN ('tenant','landlord','agent','consultant','admin')),
  status            text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','locked','disabled','pending_delete')),
  locale            text NOT NULL DEFAULT 'vi',
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  failed_login_count smallint NOT NULL DEFAULT 0,
  locked_until      timestamptz,
  last_login_at     timestamptz,
  meey_user_id      text,                         -- nhân viên tương ứng bên Meey
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  version           int NOT NULL DEFAULT 0,
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
CREATE UNIQUE INDEX user_phone_uq ON identity.user_account (phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE UNIQUE INDEX user_email_uq ON identity.user_account (lower(email)) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE UNIQUE INDEX user_meey_uq  ON identity.user_account (meey_user_id) WHERE meey_user_id IS NOT NULL;

CREATE TABLE identity.role (
  id          smallint PRIMARY KEY,
  code        text NOT NULL UNIQUE,               -- TENANT, LANDLORD, AGENT, CONSULTANT, ADMIN
  name        text NOT NULL
);
CREATE TABLE identity.permission (
  id          smallint PRIMARY KEY,
  code        text NOT NULL UNIQUE,               -- vd: room.update, consignment.approve
  description text
);
CREATE TABLE identity.role_permission (
  role_id       smallint NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
  permission_id smallint NOT NULL REFERENCES identity.permission(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE identity.user_role (
  user_id uuid NOT NULL REFERENCES identity.user_account(id) ON DELETE CASCADE,
  role_id smallint NOT NULL REFERENCES identity.role(id),
  PRIMARY KEY (user_id, role_id)
);

-- Đội nhóm nhiều cấp giống Meey CRM
CREATE TABLE identity.team (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid REFERENCES identity.team(id),
  name       text NOT NULL,
  meey_id    text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE TABLE identity.team_member (
  team_id   uuid NOT NULL REFERENCES identity.team(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES identity.user_account(id) ON DELETE CASCADE,
  team_role text NOT NULL DEFAULT 'member' CHECK (team_role IN ('owner','manager','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX team_member_user_idx ON identity.team_member (user_id);

CREATE TABLE identity.otp_challenge (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target      text NOT NULL,                      -- sđt hoặc email
  purpose     text NOT NULL CHECK (purpose IN ('register','login','reset_password','change_contact')),
  channel     text NOT NULL CHECK (channel IN ('sms','zalo','email')),
  code_hash   text NOT NULL,
  attempts    smallint NOT NULL DEFAULT 0,
  ip          inet,
  device_id   text,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_target_idx ON identity.otp_challenge (target, created_at DESC);

CREATE TABLE identity.refresh_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES identity.user_account(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  device_info text,
  ip          inet,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_user_idx ON identity.refresh_token (user_id) WHERE revoked_at IS NULL;

CREATE TABLE identity.oauth_identity (            -- đăng nhập Google (giai đoạn 2)
  provider     text NOT NULL,
  provider_uid text NOT NULL,
  user_id      uuid NOT NULL REFERENCES identity.user_account(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_uid)
);
CREATE TABLE identity.consent (                   -- đồng ý thu thập dữ liệu cá nhân
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES identity.user_account(id) ON DELETE CASCADE,
  phone      text,                                -- khách chưa có tài khoản
  purpose    text NOT NULL,
  policy_version text NOT NULL,
  granted    boolean NOT NULL,
  ip         inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consent_user_idx ON identity.consent (user_id);

INSERT INTO identity.role (id, code, name) VALUES
  (1,'TENANT','Khách thuê'),(2,'LANDLORD','Chủ nhà'),(3,'AGENT','Môi giới / CTV'),
  (4,'CONSULTANT','Nhân viên tư vấn'),(5,'ADMIN','Quản trị viên');

-- =====================================================================
-- 2. MEDIA  (Cloudinary: chỉ lưu metadata; biến thể ảnh sinh bằng URL transformation)
-- =====================================================================
CREATE TABLE media.asset (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id      text NOT NULL UNIQUE,            -- Cloudinary public_id
  resource_type  text NOT NULL DEFAULT 'image' CHECK (resource_type IN ('image','video','raw')),
  format         text,
  bytes          bigint,
  width          int,
  height         int,
  duration_sec   numeric(8,2),                    -- video
  cloud_version  bigint,                          -- version trong URL để bust cache
  secure_url     text NOT NULL,
  folder         text,                            -- vd: tthome/projects/PRJ-xxxx
  alt_text       text,
  uploaded_by    uuid,                            -- identity.user_account.id
  source         text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','meey','consignment')),
  meey_url       text,                            -- URL gốc nếu nhập từ Meey
  moderation     text NOT NULL DEFAULT 'approved' CHECK (moderation IN ('pending','approved','rejected')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE INDEX asset_folder_idx ON media.asset (folder);
CREATE UNIQUE INDEX asset_meey_url_uq ON media.asset (meey_url) WHERE meey_url IS NOT NULL;

-- =====================================================================
-- 3. INVENTORY  (quỹ hàng: dự án/tòa -> phòng; ánh xạ "nguồn hàng" Meey CRM)
-- =====================================================================
-- Hai hệ địa giới: trước và sau sáp nhập 2025
CREATE TABLE inventory.admin_unit (
  id         int PRIMARY KEY,
  parent_id  int REFERENCES inventory.admin_unit(id),
  level      smallint NOT NULL CHECK (level IN (1,2,3)),    -- 1 tỉnh/TP, 2 quận/huyện, 3 phường/xã
  scheme     text NOT NULL CHECK (scheme IN ('pre_2025','post_2025')),
  name       text NOT NULL,
  slug       text NOT NULL,
  center_lat double precision,
  center_lng double precision,
  UNIQUE (scheme, parent_id, slug)
);
CREATE INDEX admin_unit_parent_idx ON inventory.admin_unit (parent_id);
CREATE TABLE inventory.admin_unit_map (
  old_id int NOT NULL REFERENCES inventory.admin_unit(id),
  new_id int NOT NULL REFERENCES inventory.admin_unit(id),
  PRIMARY KEY (old_id, new_id)
);

CREATE TABLE inventory.stock_group (              -- "kho hàng" của Meey, dùng phân quyền xem
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  meey_id    text UNIQUE,
  team_id    uuid,                                -- identity.team.id
  is_public  boolean NOT NULL DEFAULT true,       -- true = được hiển thị lên web
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE inventory.amenity (
  id        smallint PRIMARY KEY,
  code      text NOT NULL UNIQUE,                 -- window, balcony, elevator, fingerprint_lock, ...
  name      text NOT NULL,
  scope     text NOT NULL CHECK (scope IN ('room','project','both')),
  icon      text,
  sort_order smallint NOT NULL DEFAULT 0,
  is_filter boolean NOT NULL DEFAULT true         -- hiện trong bộ lọc
);

CREATE TABLE inventory.project (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,          -- PRJ-xxxxxxxxxxxxxxxxxxxx (dùng trên URL)
  meey_id          text UNIQUE,
  stock_group_id   uuid REFERENCES inventory.stock_group(id),
  name             text NOT NULL,
  slug             text NOT NULL,
  street_address   text,
  ward_id          int REFERENCES inventory.admin_unit(id),  -- địa chỉ cũ
  ward_new_id      int REFERENCES inventory.admin_unit(id),  -- địa chỉ sau sáp nhập
  district_id      int REFERENCES inventory.admin_unit(id),
  lat              double precision,
  lng              double precision,
  owner_user_id    uuid,                          -- chủ nhà (identity.user_account.id)
  manager_user_id  uuid,                          -- nhân viên phụ trách
  is_exclusive     boolean NOT NULL DEFAULT false,
  pet_policy       text NOT NULL DEFAULT 'none'
                   CHECK (pet_policy IN ('none','cat','small_pet','ask_owner','allowed')),
  ev_parking       boolean NOT NULL DEFAULT false,
  free_hours       boolean,
  max_guests_note  text,
  house_rules      text,
  fee_electric     numeric(12,0),
  fee_water        numeric(12,0),
  fee_service      numeric(12,0),
  fee_parking      numeric(12,0),
  fee_note         text,
  description      text,
  cover_asset_id   uuid,                          -- media.asset.id
  video_asset_id   uuid,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','closed')),
  -- phi chuẩn hóa để vẽ thẻ dự án không cần GROUP BY
  vacant_count     int NOT NULL DEFAULT 0,
  total_rooms      int NOT NULL DEFAULT 0,
  min_price        numeric(12,0),
  room_types       text[] NOT NULL DEFAULT '{}',
  attributes       jsonb NOT NULL DEFAULT '{}',
  meey_updated_at  timestamptz,
  sync_hash        text,
  synced_at        timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  version          int NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX project_slug_uq ON inventory.project (slug) WHERE deleted_at IS NULL;
CREATE INDEX project_ward_idx     ON inventory.project (ward_id)     WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX project_ward_new_idx ON inventory.project (ward_new_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX project_district_idx ON inventory.project (district_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX project_owner_idx    ON inventory.project (owner_user_id);
CREATE INDEX project_geo_idx      ON inventory.project USING gist (ll_to_earth(lat, lng))
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX project_name_trgm_idx ON inventory.project
  USING gin (common.f_unaccent(lower(name || ' ' || coalesce(street_address,''))) gin_trgm_ops);
CREATE INDEX project_attr_idx     ON inventory.project USING gin (attributes jsonb_path_ops);

CREATE TABLE inventory.room (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES inventory.project(id),
  code               text NOT NULL,               -- số phòng / mã phòng
  meey_id            text UNIQUE,
  title              text NOT NULL,
  slug               text NOT NULL,
  room_type          text NOT NULL CHECK (room_type IN ('studio','duplex','1pn','2pn','3pn','shared','dorm','room')),
  floor              smallint,
  area_m2            numeric(6,1),
  price              numeric(12,0),
  price_incl_utility boolean NOT NULL DEFAULT false,
  deposit            numeric(12,0),
  furniture          text CHECK (furniture IN ('full','basic','none')),
  has_balcony        boolean,
  has_window         boolean,
  max_occupants      smallint,
  status             text NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available','reserved','rented','hidden')),
  available_from     date,
  is_promo           boolean NOT NULL DEFAULT false,
  promo_note         text,
  cover_asset_id     uuid,
  attributes         jsonb NOT NULL DEFAULT '{}',
  meey_updated_at    timestamptz,
  sync_hash          text,
  synced_at          timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  version            int NOT NULL DEFAULT 0,
  UNIQUE (project_id, code)
);
CREATE UNIQUE INDEX room_slug_uq ON inventory.room (slug) WHERE deleted_at IS NULL;
CREATE INDEX room_project_idx     ON inventory.room (project_id) WHERE deleted_at IS NULL;
CREATE INDEX room_avail_price_idx ON inventory.room (price)
  WHERE status = 'available' AND deleted_at IS NULL;
CREATE INDEX room_avail_type_idx  ON inventory.room (room_type, price)
  WHERE status = 'available' AND deleted_at IS NULL;
CREATE INDEX room_promo_idx       ON inventory.room (project_id) WHERE is_promo AND status = 'available';
CREATE INDEX room_attr_idx        ON inventory.room USING gin (attributes jsonb_path_ops);

CREATE TABLE inventory.project_amenity (
  project_id uuid NOT NULL REFERENCES inventory.project(id) ON DELETE CASCADE,
  amenity_id smallint NOT NULL REFERENCES inventory.amenity(id),
  PRIMARY KEY (project_id, amenity_id)
);
CREATE TABLE inventory.room_amenity (
  room_id    uuid NOT NULL REFERENCES inventory.room(id) ON DELETE CASCADE,
  amenity_id smallint NOT NULL REFERENCES inventory.amenity(id),
  PRIMARY KEY (room_id, amenity_id)
);
CREATE INDEX room_amenity_rev_idx ON inventory.room_amenity (amenity_id, room_id);

-- Ảnh/video của dự án & phòng (tham chiếu media.asset, không FK chéo schema)
CREATE TABLE inventory.media_link (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('project','room')),
  owner_id   uuid NOT NULL,
  asset_id   uuid NOT NULL,
  kind       text NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo','video','floorplan','360')),
  sort_order smallint NOT NULL DEFAULT 0,
  is_cover   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_type, owner_id, asset_id)
);
CREATE INDEX media_link_owner_idx ON inventory.media_link (owner_type, owner_id, sort_order);

CREATE TABLE inventory.landmark (                 -- trường ĐH, TTTM, khu công nghiệp
  id       smallint PRIMARY KEY,
  code     text NOT NULL UNIQUE,                  -- bachkhoa, ueh, rmit, landmark81 ...
  name     text NOT NULL,
  kind     text NOT NULL CHECK (kind IN ('university','mall','industrial','hospital','other')),
  lat      double precision,                      -- cần điền toạ độ thật trước khi bật "tìm gần"
  lng      double precision,
  radius_m int NOT NULL DEFAULT 3000,
  sort_order smallint NOT NULL DEFAULT 0
);

-- Lịch sử giá/trạng thái (Meey: lịch sử giao dịch) - phân vùng theo tháng
CREATE TABLE inventory.room_status_history (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id    uuid NOT NULL,
  status     text NOT NULL,
  price      numeric(12,0),
  source     text NOT NULL CHECK (source IN ('meey','admin','landlord','system')),
  changed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, changed_at)
) PARTITION BY RANGE (changed_at);
CREATE INDEX rsh_room_idx  ON inventory.room_status_history (room_id, changed_at DESC);
CREATE INDEX rsh_time_brin ON inventory.room_status_history USING brin (changed_at);

-- Thống kê theo phường: cập nhật theo sự kiện, phục vụ trang chủ + trang khu vực
CREATE TABLE inventory.area_stats (
  admin_unit_id int NOT NULL REFERENCES inventory.admin_unit(id),
  scheme        text NOT NULL,
  project_count int NOT NULL DEFAULT 0,
  vacant_count  int NOT NULL DEFAULT 0,
  min_price     numeric(12,0),
  common_price  numeric(12,0),                    -- mức giá phổ biến nhất
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_unit_id, scheme)
);

-- =====================================================================
-- 4. SEARCH  (bảng đọc phi chuẩn hóa: 1 dòng / phòng; chạy trên read replica)
-- =====================================================================
CREATE TABLE search.listing_doc (
  room_id        uuid PRIMARY KEY,
  project_id     uuid NOT NULL,
  project_code   text NOT NULL,
  room_slug      text NOT NULL,
  project_name   text NOT NULL,
  address        text,
  ward_id        int,
  ward_new_id    int,
  district_id    int,
  lat            double precision,
  lng            double precision,
  room_type      text NOT NULL,
  price          numeric(12,0),
  price_incl_utility boolean,
  area_m2        numeric(6,1),
  furniture      text,
  has_balcony    boolean,
  has_window     boolean,
  is_exclusive   boolean NOT NULL DEFAULT false,
  is_promo       boolean NOT NULL DEFAULT false,
  pet_policy     text,
  ev_parking     boolean,
  amenity_ids    smallint[] NOT NULL DEFAULT '{}',
  cover_url      text,
  status         text NOT NULL,
  rank_score     real NOT NULL DEFAULT 0,         -- độ phổ biến
  doc_text       text NOT NULL DEFAULT '',        -- đã bỏ dấu, lower
  tsv            tsvector,
  listed_at      timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ld_price_idx    ON search.listing_doc (price)        WHERE status = 'available';
CREATE INDEX ld_ward_idx     ON search.listing_doc (ward_id, price)     WHERE status = 'available';
CREATE INDEX ld_ward_new_idx ON search.listing_doc (ward_new_id, price) WHERE status = 'available';
CREATE INDEX ld_district_idx ON search.listing_doc (district_id, price) WHERE status = 'available';
CREATE INDEX ld_type_idx     ON search.listing_doc (room_type, price)   WHERE status = 'available';
CREATE INDEX ld_amenity_idx  ON search.listing_doc USING gin (amenity_ids);
CREATE INDEX ld_trgm_idx     ON search.listing_doc USING gin (doc_text gin_trgm_ops);
CREATE INDEX ld_tsv_idx      ON search.listing_doc USING gin (tsv);
CREATE INDEX ld_geo_idx      ON search.listing_doc USING gist (ll_to_earth(lat, lng))
  WHERE lat IS NOT NULL AND lng IS NOT NULL AND status = 'available';
CREATE INDEX ld_new_idx      ON search.listing_doc (listed_at DESC) WHERE status = 'available';
CREATE INDEX ld_rank_idx     ON search.listing_doc (rank_score DESC) WHERE status = 'available';

CREATE TABLE search.saved_search (                -- nút "Lưu tìm kiếm"
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  name       text,
  filters    jsonb NOT NULL,
  notify     boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saved_search_user_idx ON search.saved_search (user_id);

CREATE TABLE search.search_log (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid,
  session_id text,
  query      text,
  filters    jsonb,
  result_count int,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE INDEX search_log_time_brin ON search.search_log USING brin (created_at);

-- =====================================================================
-- 5. CRM  (khách hàng, nhu cầu, công việc, lịch sử tương tác - lõi Meey CRM)
-- =====================================================================
CREATE TABLE crm.customer_group (                 -- "kho khách" của Meey
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  meey_id    text UNIQUE,
  team_id    uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE crm.customer (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meey_id       text UNIQUE,
  user_id       uuid,                             -- nếu khách có tài khoản web
  group_id      uuid REFERENCES crm.customer_group(id),
  full_name     text,
  phone         text,
  email         text,
  zalo          text,
  source        text NOT NULL DEFAULT 'web'
                CHECK (source IN ('web','zalo','facebook','tiktok','ctv','meey','hotline','walk_in','other')),
  stage         text NOT NULL DEFAULT 'new'
                CHECK (stage IN ('new','contacted','viewing','deposited','rented','lost')),
  lost_reason   text,
  owner_user_id uuid,                             -- nhân viên phụ trách
  team_id       uuid,
  referrer_user_id uuid,                          -- CTV giới thiệu
  utm           jsonb,
  tags          text[] NOT NULL DEFAULT '{}',
  priority      smallint NOT NULL DEFAULT 0,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  attributes    jsonb NOT NULL DEFAULT '{}',
  meey_updated_at timestamptz,
  sync_hash     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  version       int NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX customer_phone_uq ON crm.customer (phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX customer_owner_stage_idx ON crm.customer (owner_user_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX customer_followup_idx    ON crm.customer (next_followup_at) WHERE deleted_at IS NULL AND next_followup_at IS NOT NULL;
CREATE INDEX customer_user_idx        ON crm.customer (user_id);
CREATE INDEX customer_tags_idx        ON crm.customer USING gin (tags);
CREATE INDEX customer_name_trgm_idx   ON crm.customer USING gin (common.f_unaccent(lower(coalesce(full_name,''))) gin_trgm_ops);

CREATE TABLE crm.demand (                         -- nhu cầu khách (Meey: tự khớp với quỹ hàng)
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES crm.customer(id) ON DELETE CASCADE,
  meey_id      text UNIQUE,
  budget_min   numeric(12,0),
  budget_max   numeric(12,0),
  ward_ids     int[] NOT NULL DEFAULT '{}',
  landmark_ids smallint[] NOT NULL DEFAULT '{}',
  room_types   text[] NOT NULL DEFAULT '{}',
  amenity_ids  smallint[] NOT NULL DEFAULT '{}',
  has_pet      boolean,
  has_ev       boolean,
  occupants    smallint,
  move_in_date date,
  note         text,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','closed')),
  attributes   jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demand_customer_idx ON crm.demand (customer_id);
CREATE INDEX demand_open_idx     ON crm.demand (budget_max) WHERE status = 'open';
CREATE INDEX demand_ward_idx     ON crm.demand USING gin (ward_ids);

CREATE TABLE crm.demand_match (
  demand_id  uuid NOT NULL REFERENCES crm.demand(id) ON DELETE CASCADE,
  room_id    uuid NOT NULL,                       -- inventory.room.id
  score      real NOT NULL,
  state      text NOT NULL DEFAULT 'suggested' CHECK (state IN ('suggested','sent','viewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (demand_id, room_id)
);
CREATE INDEX demand_match_room_idx ON crm.demand_match (room_id);

CREATE TABLE crm.consult_request (                -- form "Nhờ tư vấn"
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES crm.customer(id),
  full_name   text,
  phone       text NOT NULL,
  area_text   text,
  ward_ids    int[] NOT NULL DEFAULT '{}',
  budget_max  numeric(12,0),
  move_in_date date,
  message     text,
  channel     text NOT NULL DEFAULT 'web',
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','contacted','done','spam')),
  assigned_to uuid,
  utm         jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consult_status_idx ON crm.consult_request (status, created_at DESC);

CREATE TABLE crm.task (                           -- đầu việc + nhắc quá hạn
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meey_id     text UNIQUE,
  title       text NOT NULL,
  description text,
  customer_id uuid REFERENCES crm.customer(id) ON DELETE SET NULL,
  related_type text,                              -- room | project | appointment | consignment
  related_id  uuid,
  assignee_id uuid,
  created_by  uuid,
  priority    smallint NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done','cancelled')),
  due_at      timestamptz,
  done_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX task_assignee_idx ON crm.task (assignee_id, due_at) WHERE status IN ('todo','doing');
CREATE INDEX task_customer_idx ON crm.task (customer_id);

CREATE TABLE crm.note (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL,
  customer_id uuid REFERENCES crm.customer(id) ON DELETE CASCADE,
  task_id     uuid REFERENCES crm.task(id) ON DELETE CASCADE,
  body        text NOT NULL,
  is_private  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX note_customer_idx ON crm.note (customer_id, created_at DESC);

CREATE TABLE crm.interaction (                    -- gọi, gặp, Zalo, email, chuyển giai đoạn
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('call','meeting','zalo','sms','email','chat','stage_change','system')),
  direction   text CHECK (direction IN ('in','out')),
  summary     text,
  data        jsonb NOT NULL DEFAULT '{}',
  actor_id    uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE INDEX interaction_customer_idx ON crm.interaction (customer_id, created_at DESC);

CREATE TABLE crm.saved_item (                     -- tin đã lưu / yêu thích
  user_id     uuid NOT NULL,
  room_id     uuid NOT NULL,
  price_at_save numeric(12,0),
  notify_price_change boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, room_id)
);
CREATE INDEX saved_item_room_idx ON crm.saved_item (room_id);

CREATE TABLE crm.view_history (                   -- lịch sử xem (giai đoạn 2)
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid,
  session_id text,
  project_id uuid,
  room_id    uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE INDEX view_history_user_idx ON crm.view_history (user_id, created_at DESC);

-- =====================================================================
-- 6. BOOKING  (đặt lịch xem phòng)
-- =====================================================================
CREATE TABLE booking.staff_slot (                 -- lịch rảnh của nhân viên dẫn khách
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id  uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  is_free   boolean NOT NULL DEFAULT true,
  CHECK (ends_at > starts_at)
);
CREATE INDEX staff_slot_idx ON booking.staff_slot (staff_id, starts_at) WHERE is_free;

CREATE TABLE booking.appointment (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,              -- mã hiển thị cho khách
  meey_id      text UNIQUE,
  customer_id  uuid NOT NULL,                     -- crm.customer.id
  user_id      uuid,
  project_id   uuid NOT NULL,
  room_id      uuid,
  mode         text NOT NULL DEFAULT 'in_person' CHECK (mode IN ('in_person','online')),
  scheduled_at timestamptz NOT NULL,
  duration_min smallint NOT NULL DEFAULT 30,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','confirmed','rescheduled','completed','cancelled','no_show')),
  staff_id     uuid,
  contact_name  text,
  contact_phone text,
  note         text,
  cancel_reason text,
  reminded_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  version      int NOT NULL DEFAULT 0
);
CREATE INDEX appt_customer_idx ON booking.appointment (customer_id, scheduled_at DESC);
CREATE INDEX appt_user_idx     ON booking.appointment (user_id, scheduled_at DESC);
CREATE INDEX appt_staff_idx    ON booking.appointment (staff_id, scheduled_at) WHERE status IN ('pending','confirmed');
CREATE INDEX appt_remind_idx   ON booking.appointment (scheduled_at) WHERE status = 'confirmed' AND reminded_at IS NULL;
CREATE INDEX appt_status_idx   ON booking.appointment (status, scheduled_at);

CREATE TABLE booking.appointment_history (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES booking.appointment(id) ON DELETE CASCADE,
  from_status    text,
  to_status      text NOT NULL,
  changed_by     uuid,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appt_hist_idx ON booking.appointment_history (appointment_id, created_at);

-- =====================================================================
-- 7. CONSIGNMENT  (ký gửi phòng của chủ nhà)
-- =====================================================================
CREATE TABLE consignment.submission (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  landlord_id   uuid,                             -- identity.user_account.id
  landlord_name text NOT NULL,
  landlord_phone text NOT NULL,
  project_name  text,
  address_text  text NOT NULL,
  ward_id       int,
  lat           double precision,
  lng           double precision,
  room_count    int,
  rooms         jsonb NOT NULL DEFAULT '[]',      -- [{type, area, price, floor, ...}]
  expected_price_min numeric(12,0),
  expected_price_max numeric(12,0),
  amenities     jsonb NOT NULL DEFAULT '{}',
  note          text,
  status        text NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted','need_info','approved','rejected','published','withdrawn')),
  reviewer_id   uuid,
  reject_reason text,
  photo_scheduled_at timestamptz,                 -- đội vận hành đi chụp ảnh
  project_id    uuid,                             -- gán sau khi duyệt & đẩy sang Meey
  meey_pushed_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  version       int NOT NULL DEFAULT 0
);
CREATE INDEX submission_status_idx   ON consignment.submission (status, created_at DESC);
CREATE INDEX submission_landlord_idx ON consignment.submission (landlord_id);

CREATE TABLE consignment.submission_media (
  submission_id uuid NOT NULL REFERENCES consignment.submission(id) ON DELETE CASCADE,
  asset_id      uuid NOT NULL,                    -- media.asset.id
  sort_order    smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (submission_id, asset_id)
);
CREATE TABLE consignment.review_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES consignment.submission(id) ON DELETE CASCADE,
  from_status   text,
  to_status     text NOT NULL,
  reviewer_id   uuid,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX review_log_idx ON consignment.review_log (submission_id, created_at);

CREATE TABLE consignment.landlord_contract (      -- giai đoạn 2: hợp đồng + đối soát
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES consignment.submission(id),
  landlord_id   uuid NOT NULL,
  project_id    uuid,
  contract_no   text UNIQUE,
  start_date    date,
  end_date      date,
  fee_percent   numeric(5,2),
  fee_fixed     numeric(12,0),
  file_asset_id uuid,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','terminated')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 8. CMS  (nội dung; locale vi/en, dùng translation_group_id để nối bản dịch)
-- =====================================================================
CREATE TABLE cms.category (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  locale     text NOT NULL DEFAULT 'vi',
  parent_id  uuid REFERENCES cms.category(id),
  name       text NOT NULL,
  slug       text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  UNIQUE (locale, slug)
);
CREATE TABLE cms.tag (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL DEFAULT 'vi',
  name   text NOT NULL,
  slug   text NOT NULL,
  UNIQUE (locale, slug)
);
CREATE TABLE cms.post (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  locale       text NOT NULL DEFAULT 'vi',
  category_id  uuid REFERENCES cms.category(id),
  author_id    uuid,
  author_name  text,
  title        text NOT NULL,
  slug         text NOT NULL,
  excerpt      text,
  content      text NOT NULL,                     -- HTML hoặc markdown đã làm sạch
  toc          jsonb,                             -- mục lục sinh khi lưu
  cover_url    text,
  read_minutes smallint,
  view_count   int NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  published_at timestamptz,
  related_post_ids uuid[] NOT NULL DEFAULT '{}',
  faq          jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  UNIQUE (locale, slug)
);
CREATE INDEX post_list_idx ON cms.post (locale, published_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX post_cat_idx  ON cms.post (category_id, published_at DESC) WHERE status = 'published';
CREATE INDEX post_trgm_idx ON cms.post USING gin (common.f_unaccent(lower(title)) gin_trgm_ops);

CREATE TABLE cms.post_tag (
  post_id uuid NOT NULL REFERENCES cms.post(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES cms.tag(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE TABLE cms.banner (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale      text NOT NULL DEFAULT 'vi',
  placement   text NOT NULL,                      -- home_hero, home_mid, ...
  title       text,
  image_url   text NOT NULL,
  mobile_image_url text,
  link_url    text,
  sort_order  smallint NOT NULL DEFAULT 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_active   boolean NOT NULL DEFAULT true
);
CREATE TABLE cms.page (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  locale     text NOT NULL DEFAULT 'vi',
  slug       text NOT NULL,                       -- ve-chung-toi, lien-he, chinh-sach/bao-mat ...
  title      text NOT NULL,
  content    text,
  blocks     jsonb NOT NULL DEFAULT '[]',
  status     text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, slug)
);
CREATE TABLE cms.faq (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale     text NOT NULL DEFAULT 'vi',
  audience   text NOT NULL DEFAULT 'tenant' CHECK (audience IN ('tenant','landlord','all')),
  question   text NOT NULL,
  answer     text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);
CREATE TABLE cms.menu_item (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale     text NOT NULL DEFAULT 'vi',
  location   text NOT NULL CHECK (location IN ('header','footer_company','footer_connect')),
  parent_id  uuid REFERENCES cms.menu_item(id),
  label      text NOT NULL,
  url        text NOT NULL,
  is_external boolean NOT NULL DEFAULT false,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true
);
CREATE TABLE cms.seo_meta (                       -- SEO cho dự án/phòng/khu vực/trang tĩnh
  entity_type text NOT NULL CHECK (entity_type IN ('project','room','area','post','page','category')),
  entity_id   text NOT NULL,                      -- uuid hoặc id khu vực dạng chuỗi
  locale      text NOT NULL DEFAULT 'vi',
  title       text,
  description text,
  canonical   text,
  og_image    text,
  noindex     boolean NOT NULL DEFAULT false,
  extra       jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id, locale)
);
CREATE TABLE cms.partner_application (            -- form tuyển CTV / ứng tuyển
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL CHECK (kind IN ('ctv','job')),
  full_name  text NOT NULL,
  phone      text NOT NULL,
  email      text,
  message    text,
  position   text,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 9. NOTIFY
-- =====================================================================
CREATE TABLE notify.template (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code     text NOT NULL,                         -- booking_confirmed, otp, price_changed ...
  channel  text NOT NULL CHECK (channel IN ('sms','zalo','email','push')),
  locale   text NOT NULL DEFAULT 'vi',
  subject  text,
  body     text NOT NULL,
  provider_template_id text,                      -- mã mẫu ZNS
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (code, channel, locale)
);
CREATE TABLE notify.preference (
  user_id  uuid NOT NULL,
  channel  text NOT NULL,
  topic    text NOT NULL,
  enabled  boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, channel, topic)
);
CREATE TABLE notify.message (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid,
  recipient   text NOT NULL,
  channel     text NOT NULL,
  template_code text,
  payload     jsonb NOT NULL DEFAULT '{}',
  dedupe_key  text,                               -- chống gửi trùng
  status      text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed')),
  provider_msg_id text,
  error       text,
  attempts    smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE INDEX msg_status_idx ON notify.message (status, created_at) WHERE status IN ('queued','failed');
CREATE INDEX msg_user_idx   ON notify.message (user_id, created_at DESC);
CREATE INDEX msg_dedupe_idx ON notify.message (dedupe_key, created_at);

-- =====================================================================
-- 10. SYNC  (đồng bộ với Meey CRM)
-- =====================================================================
CREATE TABLE sync.meey_raw_record (               -- bản gốc, giữ nguyên để đối soát / ánh xạ lại
  entity_type  text NOT NULL,                     -- property | customer | demand | task | appointment | team | user
  meey_id      text NOT NULL,
  payload      jsonb NOT NULL,
  payload_hash text NOT NULL,
  meey_updated_at timestamptz,
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  mapped_at    timestamptz,
  missing_runs smallint NOT NULL DEFAULT 0,       -- số đêm đối soát không thấy
  PRIMARY KEY (entity_type, meey_id)
) PARTITION BY LIST (entity_type);
CREATE TABLE sync.meey_raw_property    PARTITION OF sync.meey_raw_record FOR VALUES IN ('property');
CREATE TABLE sync.meey_raw_customer    PARTITION OF sync.meey_raw_record FOR VALUES IN ('customer');
CREATE TABLE sync.meey_raw_other       PARTITION OF sync.meey_raw_record DEFAULT;
CREATE INDEX raw_unmapped_idx ON sync.meey_raw_record (entity_type) WHERE mapped_at IS NULL;

CREATE TABLE sync.id_map (
  entity_type text NOT NULL,
  meey_id     text NOT NULL,
  local_id    uuid NOT NULL,
  local_code  text,                               -- PRJ-...
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, meey_id)
);
CREATE UNIQUE INDEX id_map_local_uq ON sync.id_map (entity_type, local_id);

CREATE TABLE sync.sync_cursor (
  entity_type text NOT NULL,
  direction   text NOT NULL CHECK (direction IN ('pull','push')),
  cursor_at   timestamptz,
  cursor_token text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, direction)
);
CREATE TABLE sync.sync_run (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('incremental','reconcile','push','import_file')),
  entity_type text,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  fetched     int NOT NULL DEFAULT 0,
  upserted    int NOT NULL DEFAULT 0,
  skipped     int NOT NULL DEFAULT 0,
  failed      int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'running' CHECK (status IN ('running','ok','partial','failed')),
  note        text
);
CREATE INDEX sync_run_idx ON sync.sync_run (started_at DESC);
CREATE TABLE sync.sync_error (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid REFERENCES sync.sync_run(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  meey_id     text,
  stage       text NOT NULL CHECK (stage IN ('fetch','map','upsert','push')),
  message     text NOT NULL,
  payload     jsonb,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sync_error_open_idx ON sync.sync_error (created_at DESC) WHERE resolved_at IS NULL;

-- Hàng đợi đẩy ngược TTHome -> Meey (khách, lịch hẹn, phòng ký gửi)
CREATE TABLE sync.push_queue (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  local_id    uuid NOT NULL,
  operation   text NOT NULL CHECK (operation IN ('create','update')),
  payload     jsonb NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','failed')),
  attempts    smallint NOT NULL DEFAULT 0,
  next_try_at timestamptz NOT NULL DEFAULT now(),
  last_error  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_queue_idx ON sync.push_queue (next_try_at) WHERE status = 'pending';

-- =====================================================================
-- 11. REPORT
-- =====================================================================
CREATE TABLE report.event (                       -- sự kiện hành vi: view, search, click_call, booking_submit ...
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  user_id    uuid,
  session_id text,
  entity_type text,
  entity_id  uuid,
  source     text,
  props      jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE INDEX event_name_idx   ON report.event (name, created_at DESC);
CREATE INDEX event_entity_idx ON report.event (entity_type, entity_id, created_at DESC);
CREATE INDEX event_time_brin  ON report.event USING brin (created_at);

CREATE TABLE report.daily_metric (
  day        date NOT NULL,
  metric     text NOT NULL,
  dimension  text NOT NULL DEFAULT '',            -- vd: project:PRJ-.., source:web
  value      numeric(18,2) NOT NULL,
  PRIMARY KEY (day, metric, dimension)
);
CREATE TABLE report.audit_log (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id   uuid,
  actor_ip   inet,
  action     text NOT NULL,
  entity_type text,
  entity_id  text,
  before     jsonb,
  after      jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE INDEX audit_actor_idx  ON report.audit_log (actor_id, created_at DESC);
CREATE INDEX audit_entity_idx ON report.audit_log (entity_type, entity_id, created_at DESC);

-- =====================================================================
-- 12. OUTBOX + PROCESSED_EVENT cho mỗi schema (relay đẩy sang RabbitMQ)
--     Service ghi outbox cùng giao dịch nghiệp vụ; relay đọc theo id tăng dần,
--     publish lên exchange "tthome.events" (topic) với routing key = event_type.
-- =====================================================================
DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['identity','inventory','crm','booking','consignment',
                           'cms','notify','media','sync','report','search'] LOOP
    EXECUTE format($f$
      CREATE TABLE %1$I.outbox (
        id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        event_id     uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        aggregate_type text NOT NULL,
        aggregate_id text NOT NULL,
        event_type   text NOT NULL,               -- routing key, vd: listing.room.changed
        payload      jsonb NOT NULL,
        headers      jsonb NOT NULL DEFAULT '{}',
        created_at   timestamptz NOT NULL DEFAULT now(),
        published_at timestamptz,
        attempts     smallint NOT NULL DEFAULT 0
      )$f$, s);
    EXECUTE format(
      'CREATE INDEX outbox_pending_idx ON %I.outbox (id) WHERE published_at IS NULL', s);
    EXECUTE format($f$
      CREATE TABLE %1$I.processed_event (
        event_id     uuid NOT NULL,
        consumer     text NOT NULL,
        processed_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (event_id, consumer)
      )$f$, s);
  END LOOP;
END $$;

-- =====================================================================
-- 13. Tạo partition ban đầu + trigger updated_at
-- =====================================================================
SELECT common.ensure_monthly_partitions('inventory.room_status_history', 3);
SELECT common.ensure_monthly_partitions('search.search_log', 3);
SELECT common.ensure_monthly_partitions('crm.interaction', 3);
SELECT common.ensure_monthly_partitions('crm.view_history', 3);
SELECT common.ensure_monthly_partitions('notify.message', 3);
SELECT common.ensure_monthly_partitions('report.event', 3);
SELECT common.ensure_monthly_partitions('report.audit_log', 3);
SELECT common.attach_updated_at_triggers();

-- =====================================================================
-- 14. Dữ liệu danh mục mặc định
-- =====================================================================
INSERT INTO inventory.amenity (id, code, name, scope, sort_order) VALUES
  (1,'window','Cửa sổ','room',1),
  (2,'balcony','Ban công','room',2),
  (3,'full_furniture','Full nội thất','room',3),
  (4,'elevator','Thang máy','project',4),
  (5,'fingerprint_lock','Khóa vân tay','project',5),
  (6,'air_conditioner','Máy lạnh','room',6),
  (7,'private_wc','WC riêng','room',7),
  (8,'washing_machine','Máy giặt','both',8),
  (9,'pet_friendly','Cho nuôi thú cưng','project',9),
  (10,'ev_parking','Chỗ để xe điện','project',10),
  (11,'free_hours','Giờ giấc tự do','project',11),
  (12,'security_24h','Bảo vệ 24/7','project',12),
  (13,'parking','Chỗ để xe','project',13);

INSERT INTO inventory.landmark (id, code, name, kind, sort_order) VALUES
  (1,'rmit','RMIT Việt Nam','university',1),
  (2,'bachkhoa','ĐH Bách Khoa','university',2),
  (3,'ueh','ĐH Kinh tế TP.HCM (UEH)','university',3),
  (4,'yduoc','ĐH Y Dược TP.HCM','university',4),
  (5,'vanlang','ĐH Văn Lang','university',5),
  (6,'langdaihoc','Làng Đại học','university',6),
  (7,'landmark81','Landmark 81','mall',7),
  (8,'gigamall','Gigamall','mall',8);
