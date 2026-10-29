-- =====================================================================
-- TTHome - sample operational data for the admin dashboard (dev database only)
-- Run AFTER tthome_schema.sql, every service's Flyway migrations and seed_sample_listings.sql.
-- Every row has a fixed id (prefix 5eed) or a natural key and is inserted only when missing,
-- so the file is safe to run again. Times are relative to now() so the dashboard always has recent data.
-- Nothing here updates or deletes existing rows.
-- =====================================================================

-- Partitioned tables only accept rows inside an existing monthly partition; seeded rows stay in the current month.
SELECT common.ensure_monthly_partitions('crm.interaction', 1);
SELECT common.ensure_monthly_partitions('report.event', 1);
SELECT common.ensure_monthly_partitions('report.audit_log', 1);

CREATE OR REPLACE FUNCTION pg_temp.seed_ts(back interval) RETURNS timestamptz
LANGUAGE sql STABLE AS $$ SELECT greatest(date_trunc('month', now()), now() - back) $$;

-- ---------------------------------------------------------------------
-- 1. Staff, landlords, collaborators and tenants (identity)
-- ---------------------------------------------------------------------
INSERT INTO identity.user_account (id, phone, email, full_name, user_type, status, phone_verified_at, last_login_at, created_at)
SELECT t.id::uuid, t.phone, t.email, t.full_name, t.user_type, t.status, now() - interval '60 days',
       now() - t.last_login, now() - t.created
FROM (VALUES
  ('5eed0001-0000-4000-8000-000000000001', '0901000001', 'quanly.seed@tthome.vn',   'Trần Minh Quân',   'admin',      'active', interval '2 hours',  interval '120 days'),
  ('5eed0001-0000-4000-8000-000000000002', '0901000002', 'tuvan.lan@tthome.vn',     'Nguyễn Thị Lan',   'consultant', 'active', interval '30 minutes', interval '90 days'),
  ('5eed0001-0000-4000-8000-000000000003', '0901000003', 'tuvan.hieu@tthome.vn',    'Lê Trung Hiếu',    'consultant', 'active', interval '5 hours',  interval '85 days'),
  ('5eed0001-0000-4000-8000-000000000004', '0901000004', 'tuvan.ngoc@tthome.vn',    'Phạm Bảo Ngọc',    'consultant', 'active', interval '1 day',    interval '40 days'),
  ('5eed0001-0000-4000-8000-000000000005', '0901000005', 'ctv.khoa@gmail.com',      'Võ Đăng Khoa',     'agent',      'active', interval '3 days',   interval '70 days'),
  ('5eed0001-0000-4000-8000-000000000006', '0901000006', 'ctv.thao@gmail.com',      'Huỳnh Phương Thảo','agent',      'active', interval '6 hours',  interval '50 days'),
  ('5eed0001-0000-4000-8000-000000000007', '0901000007', 'chunha.phuc@gmail.com',   'Đặng Hữu Phúc',    'landlord',   'active', interval '2 days',   interval '100 days'),
  ('5eed0001-0000-4000-8000-000000000008', '0901000008', 'chunha.mai@gmail.com',    'Trương Thị Mai',   'landlord',   'active', interval '9 days',   interval '65 days'),
  ('5eed0001-0000-4000-8000-000000000009', '0901000009', 'sv.anh@gmail.com',        'Ngô Tuấn Anh',     'tenant',     'active', interval '1 hour',   interval '12 days'),
  ('5eed0001-0000-4000-8000-000000000010', '0901000010', 'sv.vy@gmail.com',         'Lâm Tường Vy',     'tenant',     'locked', interval '20 days',  interval '30 days')
) AS t(id, phone, email, full_name, user_type, status, last_login, created)
WHERE NOT EXISTS (
  SELECT 1 FROM identity.user_account u
  WHERE u.id = t.id::uuid OR u.phone = t.phone OR lower(u.email) = lower(t.email)
);

INSERT INTO identity.user_role (user_id, role_id)
SELECT u.id, r.id
FROM identity.user_account u
JOIN identity.role r ON r.code = upper(u.user_type)
WHERE u.id::text LIKE '5eed0001-%'
ON CONFLICT DO NOTHING;

INSERT INTO identity.team (id, name, created_at)
SELECT '5eed0001-0000-4000-8000-0000000000a1'::uuid, 'Đội tư vấn Ninh Kiều', now() - interval '90 days'
WHERE NOT EXISTS (SELECT 1 FROM identity.team WHERE id = '5eed0001-0000-4000-8000-0000000000a1');

INSERT INTO identity.team_member (team_id, user_id, team_role)
SELECT '5eed0001-0000-4000-8000-0000000000a1'::uuid, u.id,
       CASE WHEN u.user_type = 'admin' THEN 'owner' ELSE 'member' END
FROM identity.user_account u
WHERE u.id IN ('5eed0001-0000-4000-8000-000000000001', '5eed0001-0000-4000-8000-000000000002',
               '5eed0001-0000-4000-8000-000000000003', '5eed0001-0000-4000-8000-000000000004')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Customers, consultation requests, tasks, notes, interactions, commissions (crm)
-- ---------------------------------------------------------------------
INSERT INTO crm.customer (id, full_name, phone, email, zalo, source, stage, lost_reason, owner_user_id,
                          referrer_user_id, tags, priority, last_contact_at, next_followup_at, created_at)
SELECT t.id::uuid, t.full_name, t.phone, t.email, t.phone, t.source, t.stage, t.lost_reason, t.owner::uuid,
       t.referrer::uuid, t.tags, t.priority, now() - t.last_contact, now() + t.followup, now() - t.created
FROM (VALUES
  ('5eed0002-0000-4000-8000-000000000001', 'Nguyễn Hoàng Nam',   '0912000001', 'nam.nh@gmail.com',  'web',      'new',       NULL,                        '5eed0001-0000-4000-8000-000000000002', NULL,                                   ARRAY['sinh-vien','ctu'],    1, interval '3 hours',  interval '1 day',   interval '1 day'),
  ('5eed0002-0000-4000-8000-000000000002', 'Trần Thị Bích',      '0912000002', NULL,                'zalo',     'contacted', NULL,                        '5eed0001-0000-4000-8000-000000000002', NULL,                                   ARRAY['y-duoc'],             0, interval '1 day',    interval '2 days',  interval '4 days'),
  ('5eed0002-0000-4000-8000-000000000003', 'Lê Quốc Bảo',        '0912000003', 'bao.lq@gmail.com',  'facebook', 'viewing',   NULL,                        '5eed0001-0000-4000-8000-000000000003', NULL,                                   ARRAY['di-lam'],             2, interval '5 hours',  interval '6 hours', interval '6 days'),
  ('5eed0002-0000-4000-8000-000000000004', 'Phạm Thu Hà',        '0912000004', NULL,                'ctv',      'deposited', NULL,                        '5eed0001-0000-4000-8000-000000000003', '5eed0001-0000-4000-8000-000000000005', ARRAY['sinh-vien','fpt'],    1, interval '2 days',   interval '3 days',  interval '12 days'),
  ('5eed0002-0000-4000-8000-000000000005', 'Đỗ Minh Trí',        '0912000005', 'tri.dm@gmail.com',  'web',      'rented',    NULL,                        '5eed0001-0000-4000-8000-000000000002', NULL,                                   ARRAY['gia-dinh'],           0, interval '8 days',   interval '30 days', interval '20 days'),
  ('5eed0002-0000-4000-8000-000000000006', 'Huỳnh Gia Hân',      '0912000006', NULL,                'tiktok',   'new',       NULL,                        NULL,                                   NULL,                                   ARRAY['sinh-vien'],          0, interval '2 hours',  interval '4 hours', interval '2 hours'),
  ('5eed0002-0000-4000-8000-000000000007', 'Võ Thành Đạt',       '0912000007', NULL,                'hotline',  'contacted', NULL,                        '5eed0001-0000-4000-8000-000000000004', NULL,                                   ARRAY['di-lam','tay-do'],    1, interval '20 hours', interval '1 day',   interval '3 days'),
  ('5eed0002-0000-4000-8000-000000000008', 'Bùi Ngọc Ánh',       '0912000008', 'anh.bn@gmail.com',  'ctv',      'viewing',   NULL,                        '5eed0001-0000-4000-8000-000000000004', '5eed0001-0000-4000-8000-000000000006', ARRAY['y-duoc'],             2, interval '1 day',    interval '1 day',   interval '5 days'),
  ('5eed0002-0000-4000-8000-000000000009', 'Châu Văn Lộc',       '0912000009', NULL,                'meey',     'lost',      'Chọn phòng bên khác rẻ hơn', '5eed0001-0000-4000-8000-000000000003', NULL,                                   ARRAY['gia-re'],             0, interval '10 days',  interval '60 days', interval '18 days'),
  ('5eed0002-0000-4000-8000-000000000010', 'Mai Khánh Linh',     '0912000010', 'linh.mk@gmail.com', 'web',      'viewing',   NULL,                        '5eed0001-0000-4000-8000-000000000002', NULL,                                   ARRAY['ben-ninh-kieu'],      1, interval '4 hours',  interval '1 day',   interval '7 days'),
  ('5eed0002-0000-4000-8000-000000000011', 'Tạ Quang Vinh',      '0912000011', NULL,                'walk_in',  'rented',    NULL,                        '5eed0001-0000-4000-8000-000000000004', NULL,                                   ARRAY['di-lam'],             0, interval '15 days',  interval '45 days', interval '25 days'),
  ('5eed0002-0000-4000-8000-000000000012', 'Kiều Diễm My',       '0912000012', NULL,                'ctv',      'new',       NULL,                        NULL,                                   '5eed0001-0000-4000-8000-000000000005', ARRAY['sinh-vien','nam-ct'], 0, interval '1 hour',   interval '3 hours', interval '1 hour'),
  ('5eed0002-0000-4000-8000-000000000013', 'Lý Hoàng Phúc',      '0912000013', NULL,                'zalo',     'deposited', NULL,                        '5eed0001-0000-4000-8000-000000000002', NULL,                                   ARRAY['tam-vu'],             1, interval '1 day',    interval '2 days',  interval '9 days'),
  ('5eed0002-0000-4000-8000-000000000014', 'Dương Thị Kim',      '0912000014', 'kim.dt@gmail.com',  'facebook', 'lost',      'Không liên lạc được',        '5eed0001-0000-4000-8000-000000000003', NULL,                                   ARRAY[]::text[],             0, interval '12 days',  interval '90 days', interval '16 days'),
  ('5eed0002-0000-4000-8000-000000000015', 'Hồ Tấn Phát',        '0912000015', NULL,                'web',      'contacted', NULL,                        '5eed0001-0000-4000-8000-000000000004', NULL,                                   ARRAY['sinh-vien','ctu'],    0, interval '6 hours',  interval '1 day',   interval '2 days'),
  ('5eed0002-0000-4000-8000-000000000016', 'Quách Bảo Trân',     '0912000016', NULL,                'other',    'new',       NULL,                        NULL,                                   NULL,                                   ARRAY[]::text[],             0, interval '30 minutes', interval '2 hours', interval '30 minutes')
) AS t(id, full_name, phone, email, source, stage, lost_reason, owner, referrer, tags, priority, last_contact, followup, created)
WHERE NOT EXISTS (SELECT 1 FROM crm.customer c WHERE c.id = t.id::uuid OR c.phone = t.phone);

INSERT INTO crm.consult_request (id, customer_id, full_name, phone, area_text, ward_ids, budget_max, move_in_date,
                                 message, channel, status, assigned_to, created_at)
SELECT t.id::uuid, t.customer::uuid, t.full_name, t.phone, t.area_text, t.ward_ids, t.budget, current_date + t.move_in,
       t.message, t.channel, t.status, t.assigned::uuid, now() - t.created
FROM (VALUES
  ('5eed0003-0000-4000-8000-000000000001', '5eed0002-0000-4000-8000-000000000006', 'Huỳnh Gia Hân',  '0912000006', 'Gần ĐH Cần Thơ',     ARRAY[31147], 3000000, 7,  'Em cần phòng có gác, cho nuôi mèo.',            'web',  'new',       NULL,                                   interval '2 hours'),
  ('5eed0003-0000-4000-8000-000000000002', '5eed0002-0000-4000-8000-000000000012', 'Kiều Diễm My',   '0912000012', 'Nam Cần Thơ, Cái Răng', ARRAY[31174], 2500000, 14, 'Ở 2 người, cần chỗ để xe.',                    'web',  'new',       NULL,                                   interval '1 hour'),
  ('5eed0003-0000-4000-8000-000000000003', '5eed0002-0000-4000-8000-000000000016', 'Quách Bảo Trân', '0912000016', 'Ninh Kiều',          ARRAY[31141,31144], 5000000, 30, 'Tìm căn 1 phòng ngủ cho gia đình nhỏ.', 'zalo', 'new',       NULL,                                   interval '30 minutes'),
  ('5eed0003-0000-4000-8000-000000000004', '5eed0002-0000-4000-8000-000000000015', 'Hồ Tấn Phát',    '0912000015', 'Xuân Khánh',         ARRAY[31147], 2800000, 10, NULL,                                            'web',  'assigned',  '5eed0001-0000-4000-8000-000000000004', interval '2 days'),
  ('5eed0003-0000-4000-8000-000000000005', '5eed0002-0000-4000-8000-000000000007', 'Võ Thành Đạt',   '0912000007', 'Gần ĐH Tây Đô',      ARRAY[31171], 2000000, 5,  'Đi làm ca đêm, cần giờ giấc tự do.',            'web',  'contacted', '5eed0001-0000-4000-8000-000000000004', interval '3 days'),
  ('5eed0003-0000-4000-8000-000000000006', '5eed0002-0000-4000-8000-000000000001', 'Nguyễn Hoàng Nam','0912000001', 'Gần ĐH Cần Thơ',     ARRAY[31147,31148], 3200000, 20, 'Tân sinh viên K51.',                    'web',  'contacted', '5eed0001-0000-4000-8000-000000000002', interval '1 day'),
  ('5eed0003-0000-4000-8000-000000000007', '5eed0002-0000-4000-8000-000000000005', 'Đỗ Minh Trí',    '0912000005', 'Bến Ninh Kiều',      ARRAY[31141], 8000000, 0,  'Cần 2 phòng ngủ.',                              'web',  'done',      '5eed0001-0000-4000-8000-000000000002', interval '20 days'),
  ('5eed0003-0000-4000-8000-000000000008', NULL,                                   'Khách ẩn danh',  '0999999999', NULL,                 ARRAY[]::int[], NULL, NULL, 'Quảng cáo dịch vụ SEO giá rẻ.',               'web',  'spam',      NULL,                                   interval '4 days')
) AS t(id, customer, full_name, phone, area_text, ward_ids, budget, move_in, message, channel, status, assigned, created)
WHERE NOT EXISTS (SELECT 1 FROM crm.consult_request c WHERE c.id = t.id::uuid)
  AND (t.customer IS NULL OR EXISTS (SELECT 1 FROM crm.customer c WHERE c.id = t.customer::uuid));

INSERT INTO crm.task (id, title, description, customer_id, assignee_id, created_by, priority, status, due_at, done_at, created_at)
SELECT t.id::uuid, t.title, t.description, t.customer::uuid, t.assignee::uuid, '5eed0001-0000-4000-8000-000000000001'::uuid,
       t.priority, t.status, now() + t.due, CASE WHEN t.status = 'done' THEN now() - interval '1 day' END, now() - interval '3 days'
FROM (VALUES
  ('5eed0004-0000-4000-8000-000000000001', 'Gọi lại tư vấn phòng gác',          'Khách muốn xem phòng chiều nay.', '5eed0002-0000-4000-8000-000000000001', '5eed0001-0000-4000-8000-000000000002', 1, 'todo',  interval '4 hours'),
  ('5eed0004-0000-4000-8000-000000000002', 'Gửi ảnh phòng P.203 qua Zalo',      NULL,                              '5eed0002-0000-4000-8000-000000000002', '5eed0001-0000-4000-8000-000000000002', 0, 'doing', interval '1 day'),
  ('5eed0004-0000-4000-8000-000000000003', 'Dẫn khách xem phòng Riverside',     NULL,                              '5eed0002-0000-4000-8000-000000000003', '5eed0001-0000-4000-8000-000000000003', 2, 'todo',  interval '6 hours'),
  ('5eed0004-0000-4000-8000-000000000004', 'Soạn hợp đồng đặt cọc',             'Cọc 1 tháng, vào ở đầu tháng.',   '5eed0002-0000-4000-8000-000000000004', '5eed0001-0000-4000-8000-000000000003', 1, 'doing', interval '2 days'),
  ('5eed0004-0000-4000-8000-000000000005', 'Xác nhận lịch hẹn quá hạn',         NULL,                              '5eed0002-0000-4000-8000-000000000008', '5eed0001-0000-4000-8000-000000000004', 2, 'todo',  interval '-1 day'),
  ('5eed0004-0000-4000-8000-000000000006', 'Hỏi lại nhu cầu sau khi xem phòng', NULL,                              '5eed0002-0000-4000-8000-000000000010', '5eed0001-0000-4000-8000-000000000002', 0, 'todo',  interval '-6 hours'),
  ('5eed0004-0000-4000-8000-000000000007', 'Bàn giao phòng và chốt điện nước',  NULL,                              '5eed0002-0000-4000-8000-000000000005', '5eed0001-0000-4000-8000-000000000002', 0, 'done',  interval '-5 days'),
  ('5eed0004-0000-4000-8000-000000000008', 'Liên hệ khách mới từ TikTok',       NULL,                              '5eed0002-0000-4000-8000-000000000006', '5eed0001-0000-4000-8000-000000000004', 1, 'todo',  interval '3 hours')
) AS t(id, title, description, customer, assignee, priority, status, due)
WHERE NOT EXISTS (SELECT 1 FROM crm.task k WHERE k.id = t.id::uuid)
  AND EXISTS (SELECT 1 FROM crm.customer c WHERE c.id = t.customer::uuid);

INSERT INTO crm.note (id, author_id, customer_id, body, created_at)
SELECT t.id::uuid, t.author::uuid, t.customer::uuid, t.body, now() - t.created
FROM (VALUES
  ('5eed0005-0000-4000-8000-000000000001', '5eed0001-0000-4000-8000-000000000002', '5eed0002-0000-4000-8000-000000000001', 'Khách là tân sinh viên, bố mẹ sẽ đi cùng khi xem phòng.', interval '3 hours'),
  ('5eed0005-0000-4000-8000-000000000002', '5eed0001-0000-4000-8000-000000000003', '5eed0002-0000-4000-8000-000000000003', 'Thích view sông, ngân sách có thể lên 6 triệu.',            interval '5 hours'),
  ('5eed0005-0000-4000-8000-000000000003', '5eed0001-0000-4000-8000-000000000003', '5eed0002-0000-4000-8000-000000000004', 'Đã cọc phòng P.108, hẹn ký hợp đồng thứ Bảy.',             interval '2 days'),
  ('5eed0005-0000-4000-8000-000000000004', '5eed0001-0000-4000-8000-000000000002', '5eed0002-0000-4000-8000-000000000005', 'Đã nhận phòng, khách hài lòng.',                            interval '8 days'),
  ('5eed0005-0000-4000-8000-000000000005', '5eed0001-0000-4000-8000-000000000004', '5eed0002-0000-4000-8000-000000000008', 'Khách hỏi thêm về chính sách nuôi thú cưng.',               interval '1 day'),
  ('5eed0005-0000-4000-8000-000000000006', '5eed0001-0000-4000-8000-000000000003', '5eed0002-0000-4000-8000-000000000009', 'Khách đã thuê phòng bên khác, đóng hồ sơ.',                 interval '10 days')
) AS t(id, author, customer, body, created)
WHERE NOT EXISTS (SELECT 1 FROM crm.note n WHERE n.id = t.id::uuid)
  AND EXISTS (SELECT 1 FROM crm.customer c WHERE c.id = t.customer::uuid);

INSERT INTO crm.interaction (id, customer_id, kind, direction, summary, actor_id, created_at)
SELECT t.id::uuid, t.customer::uuid, t.kind, t.direction, t.summary, t.actor::uuid, pg_temp.seed_ts(t.back)
FROM (VALUES
  ('5eed000c-0000-4000-8000-000000000001', '5eed0002-0000-4000-8000-000000000001', 'call',         'out', 'Gọi tư vấn lần đầu',             '5eed0001-0000-4000-8000-000000000002', interval '3 hours'),
  ('5eed000c-0000-4000-8000-000000000002', '5eed0002-0000-4000-8000-000000000002', 'zalo',         'out', 'Gửi danh sách phòng gần Y Dược', '5eed0001-0000-4000-8000-000000000002', interval '1 day'),
  ('5eed000c-0000-4000-8000-000000000003', '5eed0002-0000-4000-8000-000000000003', 'stage_change', NULL,  'contacted -> viewing',           '5eed0001-0000-4000-8000-000000000003', interval '5 hours'),
  ('5eed000c-0000-4000-8000-000000000004', '5eed0002-0000-4000-8000-000000000004', 'meeting',      NULL,  'Xem phòng P.108 tại Nam Cần Thơ','5eed0001-0000-4000-8000-000000000003', interval '3 days'),
  ('5eed000c-0000-4000-8000-000000000005', '5eed0002-0000-4000-8000-000000000004', 'stage_change', NULL,  'viewing -> deposited',           '5eed0001-0000-4000-8000-000000000003', interval '2 days'),
  ('5eed000c-0000-4000-8000-000000000006', '5eed0002-0000-4000-8000-000000000007', 'call',         'in',  'Khách gọi hotline hỏi giá',      '5eed0001-0000-4000-8000-000000000004', interval '20 hours'),
  ('5eed000c-0000-4000-8000-000000000007', '5eed0002-0000-4000-8000-000000000008', 'zalo',         'in',  'Hỏi chính sách thú cưng',        '5eed0001-0000-4000-8000-000000000004', interval '1 day'),
  ('5eed000c-0000-4000-8000-000000000008', '5eed0002-0000-4000-8000-000000000010', 'email',        'out', 'Gửi báo giá căn 1PN',            '5eed0001-0000-4000-8000-000000000002', interval '4 hours'),
  ('5eed000c-0000-4000-8000-000000000009', '5eed0002-0000-4000-8000-000000000013', 'stage_change', NULL,  'viewing -> deposited',           '5eed0001-0000-4000-8000-000000000002', interval '1 day'),
  ('5eed000c-0000-4000-8000-000000000010', '5eed0002-0000-4000-8000-000000000015', 'sms',          'out', 'Nhắc lịch hẹn xem phòng',        '5eed0001-0000-4000-8000-000000000004', interval '6 hours')
) AS t(id, customer, kind, direction, summary, actor, back)
WHERE NOT EXISTS (SELECT 1 FROM crm.interaction i WHERE i.id = t.id::uuid)
  AND EXISTS (SELECT 1 FROM crm.customer c WHERE c.id = t.customer::uuid);

INSERT INTO crm.commission (id, customer_id, referrer_user_id, amount, status, note, created_by, paid_at, created_at)
SELECT t.id::uuid, t.customer::uuid, t.referrer::uuid, t.amount, t.status, t.note,
       '5eed0001-0000-4000-8000-000000000001'::uuid, CASE WHEN t.status = 'paid' THEN now() - interval '2 days' END,
       now() - t.created
FROM (VALUES
  ('5eed000b-0000-4000-8000-000000000001', '5eed0002-0000-4000-8000-000000000004', '5eed0001-0000-4000-8000-000000000005', 500000, 'approved', 'Khách đã cọc phòng P.108', interval '2 days'),
  ('5eed000b-0000-4000-8000-000000000002', '5eed0002-0000-4000-8000-000000000008', '5eed0001-0000-4000-8000-000000000006', 300000, 'pending',  NULL,                       interval '1 day'),
  ('5eed000b-0000-4000-8000-000000000003', '5eed0002-0000-4000-8000-000000000012', '5eed0001-0000-4000-8000-000000000005', 300000, 'pending',  NULL,                       interval '1 hour')
) AS t(id, customer, referrer, amount, status, note, created)
WHERE NOT EXISTS (SELECT 1 FROM crm.commission m WHERE m.id = t.id::uuid OR (m.customer_id = t.customer::uuid AND m.status <> 'cancelled'))
  AND EXISTS (SELECT 1 FROM crm.customer c WHERE c.id = t.customer::uuid);

-- ---------------------------------------------------------------------
-- 3. Viewing appointments (booking); needs the projects from seed_sample_listings.sql
-- ---------------------------------------------------------------------
INSERT INTO booking.appointment (id, code, customer_id, project_id, room_id, mode, scheduled_at, duration_min, status,
                                 staff_id, contact_name, contact_phone, note, cancel_reason, created_at)
SELECT t.id::uuid, t.code, t.customer::uuid, p.id, r.id, t.mode, date_trunc('hour', now()) + t.at, 30, t.status,
       t.staff::uuid, c.full_name, c.phone, t.note, t.cancel_reason, now() - t.created
FROM (VALUES
  ('5eed0006-0000-4000-8000-000000000001', 'LH-SEED-01', '5eed0002-0000-4000-8000-000000000001', 'PRJ-NK-CTU-XUANKHANH', 'P.101', 'in_person', interval '3 hours',   'pending',     '5eed0001-0000-4000-8000-000000000002', 'Bố mẹ đi cùng',              NULL,                       interval '3 hours'),
  ('5eed0006-0000-4000-8000-000000000002', 'LH-SEED-02', '5eed0002-0000-4000-8000-000000000003', 'PRJ-NK-BENNINHKIEU',   'P.301', 'in_person', interval '5 hours',   'confirmed',   '5eed0001-0000-4000-8000-000000000003', NULL,                         NULL,                       interval '1 day'),
  ('5eed0006-0000-4000-8000-000000000003', 'LH-SEED-03', '5eed0002-0000-4000-8000-000000000008', 'PRJ-NK-YDUOC-ANKHANH', 'P.201', 'online',    interval '1 day',     'confirmed',   '5eed0001-0000-4000-8000-000000000004', 'Xem qua video call Zalo',    NULL,                       interval '1 day'),
  ('5eed0006-0000-4000-8000-000000000004', 'LH-SEED-04', '5eed0002-0000-4000-8000-000000000010', 'PRJ-NK-BENNINHKIEU',   'P.402', 'in_person', interval '1 day 2 hours', 'rescheduled', '5eed0001-0000-4000-8000-000000000002', 'Khách xin dời sang hôm sau', NULL,                    interval '3 days'),
  ('5eed0006-0000-4000-8000-000000000005', 'LH-SEED-05', '5eed0002-0000-4000-8000-000000000015', 'PRJ-NK-CTU-XUANKHANH', 'P.203', 'in_person', interval '2 days',    'pending',     NULL,                                   NULL,                         NULL,                       interval '6 hours'),
  ('5eed0006-0000-4000-8000-000000000006', 'LH-SEED-06', '5eed0002-0000-4000-8000-000000000007', 'PRJ-CR-TAYDO-LEBINH',  'P.204', 'in_person', interval '2 days 4 hours', 'pending', '5eed0001-0000-4000-8000-000000000004', NULL,                        NULL,                       interval '20 hours'),
  ('5eed0006-0000-4000-8000-000000000007', 'LH-SEED-07', '5eed0002-0000-4000-8000-000000000012', 'PRJ-CR-FPT-NAMCANTHO', 'P.205', 'in_person', interval '3 days',    'pending',     NULL,                                   NULL,                         NULL,                       interval '1 hour'),
  ('5eed0006-0000-4000-8000-000000000008', 'LH-SEED-08', '5eed0002-0000-4000-8000-000000000004', 'PRJ-CR-FPT-NAMCANTHO', 'P.108', 'in_person', interval '-3 days',   'completed',   '5eed0001-0000-4000-8000-000000000003', 'Khách chốt cọc tại chỗ',     NULL,                       interval '5 days'),
  ('5eed0006-0000-4000-8000-000000000009', 'LH-SEED-09', '5eed0002-0000-4000-8000-000000000005', 'PRJ-NK-BENNINHKIEU',   'P.402', 'in_person', interval '-9 days',   'completed',   '5eed0001-0000-4000-8000-000000000002', NULL,                         NULL,                       interval '12 days'),
  ('5eed0006-0000-4000-8000-000000000010', 'LH-SEED-10', '5eed0002-0000-4000-8000-000000000013', 'PRJ-NK-TAMVU-HUNGLOI', 'P.201', 'in_person', interval '-2 days',   'completed',   '5eed0001-0000-4000-8000-000000000002', NULL,                         NULL,                       interval '4 days'),
  ('5eed0006-0000-4000-8000-000000000011', 'LH-SEED-11', '5eed0002-0000-4000-8000-000000000009', 'PRJ-CR-TAYDO-LEBINH',  'P.102', 'in_person', interval '-11 days',  'cancelled',   '5eed0001-0000-4000-8000-000000000003', NULL,                         'Khách đã thuê nơi khác',   interval '14 days'),
  ('5eed0006-0000-4000-8000-000000000012', 'LH-SEED-12', '5eed0002-0000-4000-8000-000000000014', 'PRJ-NK-YDUOC-ANKHANH', 'P.305', 'in_person', interval '-12 days',  'no_show',     '5eed0001-0000-4000-8000-000000000003', NULL,                         NULL,                       interval '15 days'),
  ('5eed0006-0000-4000-8000-000000000013', 'LH-SEED-13', '5eed0002-0000-4000-8000-000000000011', 'PRJ-NK-TAMVU-HUNGLOI', 'P.302', 'in_person', interval '-16 days',  'completed',   '5eed0001-0000-4000-8000-000000000004', NULL,                         NULL,                       interval '20 days'),
  ('5eed0006-0000-4000-8000-000000000014', 'LH-SEED-14', '5eed0002-0000-4000-8000-000000000002', 'PRJ-NK-YDUOC-ANKHANH', 'P.201', 'online',    interval '-1 day',    'no_show',     '5eed0001-0000-4000-8000-000000000002', NULL,                         NULL,                       interval '3 days')
) AS t(id, code, customer, project_code, room_code, mode, at, status, staff, note, cancel_reason, created)
JOIN inventory.project p ON p.code = t.project_code
LEFT JOIN inventory.room r ON r.project_id = p.id AND r.code = t.room_code
JOIN crm.customer c ON c.id = t.customer::uuid
WHERE NOT EXISTS (SELECT 1 FROM booking.appointment a WHERE a.id = t.id::uuid OR a.code = t.code);

INSERT INTO booking.appointment_history (id, appointment_id, from_status, to_status, changed_by, note, created_at)
SELECT md5('seed-appt-' || a.code)::uuid, a.id, 'pending', a.status, a.staff_id,
       CASE a.status WHEN 'cancelled' THEN a.cancel_reason END, least(now(), a.scheduled_at)
FROM booking.appointment a
WHERE a.code LIKE 'LH-SEED-%' AND a.status <> 'pending'
  AND NOT EXISTS (SELECT 1 FROM booking.appointment_history h WHERE h.id = md5('seed-appt-' || a.code)::uuid);

-- ---------------------------------------------------------------------
-- 4. Landlord consignment requests (consignment)
-- ---------------------------------------------------------------------
INSERT INTO consignment.submission (id, code, landlord_id, landlord_name, landlord_phone, project_name, address_text, ward_id,
                                    lat, lng, room_count, rooms, expected_price_min, expected_price_max, note, status,
                                    reviewer_id, reject_reason, photo_scheduled_at, created_at)
SELECT t.id::uuid, t.code, t.landlord::uuid, t.landlord_name, t.landlord_phone, t.project_name, t.address, t.ward_id,
       t.lat, t.lng, t.room_count, t.rooms::jsonb, t.price_min, t.price_max, t.note, t.status,
       t.reviewer::uuid, t.reject_reason, now() + t.photo_at, now() - t.created
FROM (VALUES
  ('5eed0007-0000-4000-8000-000000000001', 'KG-SEED-01', '5eed0001-0000-4000-8000-000000000007', 'Đặng Hữu Phúc',  '0901000007', 'Nhà trọ Hẻm 132 3/2',        'Hẻm 132 Đường 3/2, Xuân Khánh, Ninh Kiều', 31147, 10.0290, 105.7690, 10, '[{"type":"duplex","area":22,"price":2400000}]',                                   2300000, 2600000, 'Mới xây, có chỗ để xe rộng.',     'submitted', NULL,                                   NULL,                                interval '2 days', interval '5 hours'),
  ('5eed0007-0000-4000-8000-000000000002', 'KG-SEED-02', '5eed0001-0000-4000-8000-000000000008', 'Trương Thị Mai', '0901000008', 'Căn hộ dịch vụ Mai House',   '15 Nguyễn Văn Cừ, An Hòa, Ninh Kiều',      31144, 10.0445, 105.7680, 6,  '[{"type":"studio","area":30,"price":3800000},{"type":"1pn","area":40,"price":4800000}]', 3600000, 5000000, NULL,                              'submitted', NULL,                                   NULL,                                NULL,              interval '1 day'),
  ('5eed0007-0000-4000-8000-000000000003', 'KG-SEED-03', NULL,                                   'Nguyễn Văn Tâm', '0933000003', NULL,                         'Đường số 7, KDC Hưng Phú, Cái Răng',        31174, 10.0120, 105.7600, 4,  '[{"type":"room","area":18,"price":1500000}]',                                       1400000, 1700000, 'Chủ nhà ở chung tầng trệt.',      'need_info', '5eed0001-0000-4000-8000-000000000001', NULL,                                NULL,              interval '3 days'),
  ('5eed0007-0000-4000-8000-000000000004', 'KG-SEED-04', '5eed0001-0000-4000-8000-000000000007', 'Đặng Hữu Phúc',  '0901000007', 'Minihouse Bờ Kè',            'Bờ Kè Tầm Vu, Hưng Lợi, Ninh Kiều',         31148, 10.0215, 105.7665, 8,  '[{"type":"studio","area":26,"price":3000000}]',                                     2900000, 3200000, NULL,                              'approved',  '5eed0001-0000-4000-8000-000000000001', NULL,                                interval '1 day',  interval '6 days'),
  ('5eed0007-0000-4000-8000-000000000005', 'KG-SEED-05', '5eed0001-0000-4000-8000-000000000008', 'Trương Thị Mai', '0901000008', 'Mai House Riverside',        '40 Hai Bà Trưng, Tân An, Ninh Kiều',        31141, 10.0348, 105.7858, 5,  '[{"type":"1pn","area":42,"price":5500000}]',                                        5200000, 5800000, NULL,                              'published', '5eed0001-0000-4000-8000-000000000001', NULL,                                NULL,              interval '20 days'),
  ('5eed0007-0000-4000-8000-000000000006', 'KG-SEED-06', NULL,                                   'Lê Thị Hồng',    '0933000006', NULL,                         'Hẻm 8 Trần Chiên, Lê Bình, Cái Răng',       31171, 10.0035, 105.7840, 3,  '[{"type":"room","area":14,"price":1000000}]',                                        900000, 1100000, 'Phòng không có cửa sổ.',          'rejected',  '5eed0001-0000-4000-8000-000000000001', 'Phòng không đạt tiêu chuẩn diện tích và ánh sáng.', NULL, interval '9 days'),
  ('5eed0007-0000-4000-8000-000000000007', 'KG-SEED-07', NULL,                                   'Phan Quốc Huy',  '0933000007', 'Nhà trọ An Thới',            'Lê Hồng Phong, An Thới, Bình Thủy',         31162, 10.0555, 105.7505, 12, '[{"type":"duplex","area":24,"price":2200000}]',                                     2000000, 2400000, NULL,                              'submitted', NULL,                                   NULL,                                NULL,              interval '40 minutes')
) AS t(id, code, landlord, landlord_name, landlord_phone, project_name, address, ward_id, lat, lng, room_count, rooms,
       price_min, price_max, note, status, reviewer, reject_reason, photo_at, created)
WHERE NOT EXISTS (SELECT 1 FROM consignment.submission s WHERE s.id = t.id::uuid OR s.code = t.code);

INSERT INTO consignment.review_log (id, submission_id, from_status, to_status, reviewer_id, note, created_at)
SELECT md5('seed-review-' || s.code)::uuid, s.id, 'submitted', s.status, s.reviewer_id, s.reject_reason,
       s.created_at + interval '2 hours'
FROM consignment.submission s
WHERE s.code LIKE 'KG-SEED-%' AND s.status <> 'submitted'
  AND NOT EXISTS (SELECT 1 FROM consignment.review_log l WHERE l.id = md5('seed-review-' || s.code)::uuid);

-- ---------------------------------------------------------------------
-- 5. Content (cms)
-- ---------------------------------------------------------------------
INSERT INTO cms.category (id, locale, name, slug, sort_order)
SELECT t.id::uuid, 'vi', t.name, t.slug, t.sort_order
FROM (VALUES
  ('5eed0008-0000-4000-8000-0000000000c1', 'Kinh nghiệm thuê phòng', 'kinh-nghiem-thue-phong', 1::smallint),
  ('5eed0008-0000-4000-8000-0000000000c2', 'Khu vực Cần Thơ',        'khu-vuc-can-tho',        2::smallint),
  ('5eed0008-0000-4000-8000-0000000000c3', 'Tin TTHome',             'tin-tthome',             3::smallint)
) AS t(id, name, slug, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM cms.category c WHERE c.id = t.id::uuid OR (c.locale = 'vi' AND c.slug = t.slug));

INSERT INTO cms.tag (id, locale, name, slug)
SELECT t.id::uuid, 'vi', t.name, t.slug
FROM (VALUES
  ('5eed0008-0000-4000-8000-0000000000d1', 'Sinh viên',   'sinh-vien'),
  ('5eed0008-0000-4000-8000-0000000000d2', 'Ninh Kiều',   'ninh-kieu'),
  ('5eed0008-0000-4000-8000-0000000000d3', 'Hợp đồng',    'hop-dong'),
  ('5eed0008-0000-4000-8000-0000000000d4', 'Tiết kiệm',   'tiet-kiem')
) AS t(id, name, slug)
WHERE NOT EXISTS (SELECT 1 FROM cms.tag g WHERE g.id = t.id::uuid OR (g.locale = 'vi' AND g.slug = t.slug));

INSERT INTO cms.post (id, locale, category_id, author_id, author_name, title, slug, excerpt, content, read_minutes,
                      view_count, status, published_at, created_at)
SELECT t.id::uuid, 'vi', c.id, '5eed0001-0000-4000-8000-000000000001'::uuid, 'Ban biên tập TTHome', t.title, t.slug,
       t.excerpt, t.content, t.read_minutes, t.views, t.status,
       CASE WHEN t.status IN ('published', 'scheduled') THEN now() + t.publish END, now() - interval '30 days'
FROM (VALUES
  ('5eed0008-0000-4000-8000-000000000001', 'kinh-nghiem-thue-phong', '7 điều cần kiểm tra trước khi đặt cọc phòng trọ', '7-dieu-can-kiem-tra-truoc-khi-dat-coc',
   'Danh sách kiểm tra nhanh giúp bạn tránh mất cọc oan.', '<p>Kiểm tra giấy tờ chủ nhà, đồng hồ điện nước, hợp đồng và chính sách hoàn cọc trước khi chuyển tiền.</p>', 5::smallint, 1240, 'published', interval '-20 days'),
  ('5eed0008-0000-4000-8000-000000000002', 'khu-vuc-can-tho', 'Thuê phòng gần Đại học Cần Thơ: khu nào đáng ở?', 'thue-phong-gan-dai-hoc-can-tho',
   'So sánh Xuân Khánh, Hưng Lợi và An Khánh cho sinh viên.', '<p>Xuân Khánh gần cổng B, Hưng Lợi yên tĩnh hơn, An Khánh tiện cho sinh viên Y Dược.</p>', 7::smallint, 2310, 'published', interval '-12 days'),
  ('5eed0008-0000-4000-8000-000000000003', 'kinh-nghiem-thue-phong', 'Cách đọc hợp đồng thuê nhà trong 10 phút', 'cach-doc-hop-dong-thue-nha',
   'Những điều khoản cần đọc kỹ nhất.', '<p>Chú ý thời hạn, điều kiện chấm dứt, phí phát sinh và trách nhiệm sửa chữa.</p>', 6::smallint, 860, 'published', interval '-5 days'),
  ('5eed0008-0000-4000-8000-000000000004', 'tin-tthome', 'TTHome mở thêm 3 tòa minihouse tại Cái Răng', 'tthome-mo-them-3-toa-cai-rang',
   'Thêm hơn 40 phòng mới gần FPT và Nam Cần Thơ.', '<p>Các tòa mới có khóa vân tay, chỗ sạc xe điện và giờ giấc tự do.</p>', 3::smallint, 0, 'scheduled', interval '3 days'),
  ('5eed0008-0000-4000-8000-000000000005', 'khu-vuc-can-tho', 'Chi phí sinh hoạt hàng tháng ở Cần Thơ năm nay', 'chi-phi-sinh-hoat-can-tho',
   'Bản nháp đang chờ số liệu điện nước mới.', '<p>Bản nháp.</p>', 8::smallint, 0, 'draft', NULL)
) AS t(id, category_slug, title, slug, excerpt, content, read_minutes, views, status, publish)
LEFT JOIN cms.category c ON c.locale = 'vi' AND c.slug = t.category_slug
WHERE NOT EXISTS (SELECT 1 FROM cms.post p WHERE p.id = t.id::uuid OR (p.locale = 'vi' AND p.slug = t.slug));

INSERT INTO cms.post_tag (post_id, tag_id)
SELECT p.id, g.id
FROM (VALUES
  ('7-dieu-can-kiem-tra-truoc-khi-dat-coc', 'hop-dong'), ('7-dieu-can-kiem-tra-truoc-khi-dat-coc', 'sinh-vien'),
  ('thue-phong-gan-dai-hoc-can-tho', 'sinh-vien'), ('thue-phong-gan-dai-hoc-can-tho', 'ninh-kieu'),
  ('cach-doc-hop-dong-thue-nha', 'hop-dong'), ('chi-phi-sinh-hoat-can-tho', 'tiet-kiem')
) AS t(post_slug, tag_slug)
JOIN cms.post p ON p.locale = 'vi' AND p.slug = t.post_slug
JOIN cms.tag g ON g.locale = 'vi' AND g.slug = t.tag_slug
ON CONFLICT DO NOTHING;

INSERT INTO cms.banner (id, placement, title, image_url, link_url, sort_order, starts_at, ends_at, is_active)
SELECT t.id::uuid, t.placement, t.title, t.image_url, t.link_url, t.sort_order, now() - interval '7 days', now() + t.ends, t.active
FROM (VALUES
  ('5eed0008-0000-4000-8000-0000000000b1', 'home_hero', 'Mùa tân sinh viên: giảm 300k tháng đầu',
   'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600', '/tim-phong?khuyen-mai=1', 1::smallint, interval '30 days', true),
  ('5eed0008-0000-4000-8000-0000000000b2', 'home_mid', 'Ký gửi phòng cùng TTHome',
   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600', '/ky-gui', 1::smallint, interval '60 days', true),
  ('5eed0008-0000-4000-8000-0000000000b3', 'home_hero', 'Ưu đãi hè (đã kết thúc)',
   'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600', '/tim-phong', 2::smallint, interval '-1 day', false)
) AS t(id, placement, title, image_url, link_url, sort_order, ends, active)
WHERE NOT EXISTS (SELECT 1 FROM cms.banner b WHERE b.id = t.id::uuid);

INSERT INTO cms.faq (id, audience, question, answer, sort_order)
SELECT t.id::uuid, t.audience, t.question, t.answer, t.sort_order
FROM (VALUES
  ('5eed0008-0000-4000-8000-0000000000f1', 'tenant',   'Đặt lịch xem phòng có mất phí không?',    'Hoàn toàn miễn phí. Nhân viên sẽ gọi xác nhận trong 30 phút.', 1::smallint),
  ('5eed0008-0000-4000-8000-0000000000f2', 'tenant',   'Tiền cọc được hoàn lại khi nào?',          'Khi hết hợp đồng và bàn giao phòng đúng hiện trạng.',            2::smallint),
  ('5eed0008-0000-4000-8000-0000000000f3', 'tenant',   'Có cho nuôi thú cưng không?',              'Tùy tòa nhà; xem mục chính sách thú cưng trên trang phòng.',     3::smallint),
  ('5eed0008-0000-4000-8000-0000000000f4', 'landlord', 'Ký gửi phòng có tốn phí không?',           'Không thu phí đăng; chỉ thu phí khi cho thuê thành công.',       1::smallint),
  ('5eed0008-0000-4000-8000-0000000000f5', 'landlord', 'Bao lâu thì phòng ký gửi được đăng?',      'Thường trong 2 ngày làm việc sau khi đội vận hành chụp ảnh.',    2::smallint),
  ('5eed0008-0000-4000-8000-0000000000f6', 'all',      'TTHome hoạt động ở khu vực nào?',          'Hiện tại tại các quận Ninh Kiều, Cái Răng và Bình Thủy, Cần Thơ.', 1::smallint)
) AS t(id, audience, question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM cms.faq f WHERE f.id = t.id::uuid);

INSERT INTO cms.page (id, locale, slug, title, content, status)
SELECT t.id::uuid, 'vi', t.slug, t.title, t.content, 'published'
FROM (VALUES
  ('5eed0008-0000-4000-8000-0000000000e1', 've-chung-toi',        'Về chúng tôi',        '<p>TTHome là nền tảng thuê phòng minh bạch tại Cần Thơ.</p>'),
  ('5eed0008-0000-4000-8000-0000000000e2', 'chinh-sach/bao-mat',  'Chính sách bảo mật',  '<p>Chúng tôi chỉ dùng số điện thoại của bạn để liên hệ tư vấn.</p>'),
  ('5eed0008-0000-4000-8000-0000000000e3', 'chinh-sach/dieu-khoan','Điều khoản sử dụng',  '<p>Điều khoản sử dụng dịch vụ TTHome.</p>')
) AS t(id, slug, title, content)
WHERE NOT EXISTS (SELECT 1 FROM cms.page g WHERE g.id = t.id::uuid OR (g.locale = 'vi' AND g.slug = t.slug));

INSERT INTO cms.menu_item (id, location, label, url, sort_order)
SELECT t.id::uuid, t.location, t.label, t.url, t.sort_order
FROM (VALUES
  ('5eed0008-0000-4000-8000-000000000101', 'header',         'Tìm phòng',     '/tim-phong',          1::smallint),
  ('5eed0008-0000-4000-8000-000000000102', 'header',         'Ký gửi',        '/ky-gui',             2::smallint),
  ('5eed0008-0000-4000-8000-000000000103', 'header',         'Cẩm nang',      '/cam-nang',           3::smallint),
  ('5eed0008-0000-4000-8000-000000000104', 'footer_company', 'Về chúng tôi',  '/ve-chung-toi',       1::smallint),
  ('5eed0008-0000-4000-8000-000000000105', 'footer_company', 'Bảo mật',       '/chinh-sach/bao-mat', 2::smallint),
  ('5eed0008-0000-4000-8000-000000000106', 'footer_connect', 'Tuyển CTV',     '/tuyen-ctv',          1::smallint)
) AS t(id, location, label, url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM cms.menu_item m WHERE m.id = t.id::uuid);

INSERT INTO cms.partner_application (id, kind, full_name, phone, email, message, position, status, created_at)
SELECT t.id::uuid, t.kind, t.full_name, t.phone, t.email, t.message, t.position, t.status, now() - t.created
FROM (VALUES
  ('5eed0008-0000-4000-8000-000000000201', 'ctv', 'Trịnh Gia Bảo',   '0944000001', NULL,                'Sinh viên năm 3, quen nhiều bạn cần thuê phòng.', NULL,                   'new',       interval '4 hours'),
  ('5eed0008-0000-4000-8000-000000000202', 'ctv', 'Lưu Mỹ Duyên',    '0944000002', 'duyen.lm@gmail.com', NULL,                                              NULL,                   'contacted', interval '2 days'),
  ('5eed0008-0000-4000-8000-000000000203', 'job', 'Cao Thanh Sơn',   '0944000003', 'son.ct@gmail.com',  'Có 2 năm kinh nghiệm môi giới.',                  'Nhân viên tư vấn',     'approved',  interval '10 days'),
  ('5eed0008-0000-4000-8000-000000000204', 'job', 'Đinh Ngọc Hạnh',  '0944000004', NULL,                NULL,                                              'Cộng tác viên nội dung','rejected',  interval '15 days')
) AS t(id, kind, full_name, phone, email, message, position, status, created)
WHERE NOT EXISTS (SELECT 1 FROM cms.partner_application a WHERE a.id = t.id::uuid);

-- ---------------------------------------------------------------------
-- 6. Meey sync history (sync)
-- ---------------------------------------------------------------------
INSERT INTO sync.sync_run (id, kind, entity_type, started_at, finished_at, fetched, upserted, skipped, failed, status, note)
SELECT t.id::uuid, t.kind, t.entity_type, now() - t.back, now() - t.back + t.took, t.fetched, t.upserted, t.skipped, t.failed, t.status, t.note
FROM (VALUES
  ('5eed0009-0000-4000-8000-000000000001', 'incremental', 'property', interval '15 minutes', interval '40 seconds', 34,  30, 4,  0, 'ok',      NULL),
  ('5eed0009-0000-4000-8000-000000000002', 'incremental', 'customer', interval '1 hour',     interval '25 seconds', 18,  16, 1,  1, 'partial', '1 khách thiếu số điện thoại'),
  ('5eed0009-0000-4000-8000-000000000003', 'reconcile',   'property', interval '9 hours',    interval '6 minutes',  412, 12, 400, 0, 'ok',     'Đối soát hằng đêm'),
  ('5eed0009-0000-4000-8000-000000000004', 'push',        'appointment', interval '3 hours', interval '5 seconds',  5,   5,  0,  0, 'ok',      NULL),
  ('5eed0009-0000-4000-8000-000000000005', 'incremental', 'property', interval '1 day',      interval '2 minutes',  0,   0,  0,  0, 'failed',  'Meey API trả về 503'),
  ('5eed0009-0000-4000-8000-000000000006', 'import_file', 'property', interval '6 days',     interval '1 minute',   120, 118, 0, 2, 'partial', 'Nhập file Excel kho hàng')
) AS t(id, kind, entity_type, back, took, fetched, upserted, skipped, failed, status, note)
WHERE NOT EXISTS (SELECT 1 FROM sync.sync_run r WHERE r.id = t.id::uuid);

INSERT INTO sync.sync_error (id, run_id, entity_type, meey_id, stage, message, created_at)
SELECT t.id::uuid, t.run::uuid, t.entity_type, t.meey_id, t.stage, t.message, now() - t.back
FROM (VALUES
  ('5eed0009-0000-4000-8000-0000000000e1', '5eed0009-0000-4000-8000-000000000002', 'customer', 'MC-88213', 'map',   'Thiếu số điện thoại, không thể ghép khách.', interval '1 hour'),
  ('5eed0009-0000-4000-8000-0000000000e2', '5eed0009-0000-4000-8000-000000000005', 'property', NULL,       'fetch', 'HTTP 503 Service Unavailable',               interval '1 day'),
  ('5eed0009-0000-4000-8000-0000000000e3', '5eed0009-0000-4000-8000-000000000006', 'property', 'MP-10442', 'upsert','Giá thuê âm trong file nhập.',               interval '6 days')
) AS t(id, run, entity_type, meey_id, stage, message, back)
WHERE NOT EXISTS (SELECT 1 FROM sync.sync_error e WHERE e.id = t.id::uuid)
  AND EXISTS (SELECT 1 FROM sync.sync_run r WHERE r.id = t.run::uuid);

-- ---------------------------------------------------------------------
-- 7. Traffic events and audit log (report)
-- ---------------------------------------------------------------------
-- About 14 days of page views and a few conversion events, all tagged source = 'seed'.
INSERT INTO report.event (id, name, session_id, entity_type, source, props, created_at)
SELECT md5('seed-event-' || d || '-' || n)::uuid,
       CASE WHEN n % 23 = 0 THEN 'booking_submit' WHEN n % 11 = 0 THEN 'click_call' WHEN n % 7 = 0 THEN 'search' ELSE 'view' END,
       'seed-session-' || d || '-' || (n % 9), 'room', 'seed', '{}'::jsonb,
       pg_temp.seed_ts(make_interval(days => d, hours => n % 20))
FROM generate_series(0, 13) AS d
CROSS JOIN LATERAL generate_series(1, 30 + (d * 7) % 25) AS n
WHERE NOT EXISTS (SELECT 1 FROM report.event e WHERE e.source = 'seed');

INSERT INTO report.audit_log (id, actor_id, action, entity_type, entity_id, after, created_at)
SELECT t.id::uuid, '5eed0001-0000-4000-8000-000000000001'::uuid, t.action, t.entity_type, t.entity_id, t.after::jsonb, pg_temp.seed_ts(t.back)
FROM (VALUES
  ('5eed000a-0000-4000-8000-000000000001', 'consignment.approve', 'submission',  'KG-SEED-04', '{"status":"approved"}',   interval '5 days'),
  ('5eed000a-0000-4000-8000-000000000002', 'consignment.reject',  'submission',  'KG-SEED-06', '{"status":"rejected"}',   interval '8 days'),
  ('5eed000a-0000-4000-8000-000000000003', 'booking.confirm',     'appointment', 'LH-SEED-02', '{"status":"confirmed"}',  interval '20 hours'),
  ('5eed000a-0000-4000-8000-000000000004', 'user.lock',           'user',        '0901000010', '{"status":"locked"}',     interval '3 days'),
  ('5eed000a-0000-4000-8000-000000000005', 'cms.publish',         'post',        'cach-doc-hop-dong-thue-nha', '{"status":"published"}', interval '5 days'),
  ('5eed000a-0000-4000-8000-000000000006', 'room.update',         'room',        'P.203',      '{"price":3200000}',       interval '2 hours'),
  ('5eed000a-0000-4000-8000-000000000007', 'commission.approve',  'commission',  '5eed000b-0000-4000-8000-000000000001', '{"status":"approved"}',   interval '1 day')
) AS t(id, action, entity_type, entity_id, after, back)
WHERE NOT EXISTS (SELECT 1 FROM report.audit_log a WHERE a.id = t.id::uuid);
