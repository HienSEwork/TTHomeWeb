-- =====================================================================
-- TTHome - Seed Sample Listings & Search Data (TP. CẦN THƠ)
-- Sử dụng WHERE NOT EXISTS để an toàn tuyệt đối khi chạy lại nhiều lần
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DANH MỤC TIỆN NGHI (inventory.amenity)
-- Bỏ qua nếu đã tồn tại code hoặc id
-- ---------------------------------------------------------------------
INSERT INTO inventory.amenity (id, code, name, scope, icon, sort_order, is_filter)
SELECT t.id, t.code, t.name, t.scope, t.icon, t.sort_order, t.is_filter
FROM (VALUES
  (1::smallint, 'air_conditioner', 'Máy lạnh', 'room', 'snowflake', 1::smallint, true),
  (2::smallint, 'elevator', 'Thang máy', 'project', 'arrow-up-down', 2::smallint, true),
  (3::smallint, 'washing_machine', 'Máy giặt', 'both', 'washing-machine', 3::smallint, true),
  (4::smallint, 'balcony', 'Ban công', 'room', 'sun', 4::smallint, true),
  (5::smallint, 'window', 'Cửa sổ thoáng', 'room', 'maximize', 5::smallint, true),
  (6::smallint, 'fingerprint_lock', 'Khóa vân tay', 'both', 'fingerprint', 6::smallint, true),
  (7::smallint, 'pet_allowed', 'Cho nuôi thú cưng', 'both', 'dog', 7::smallint, true),
  (8::smallint, 'ev_charger', 'Sạc xe điện', 'project', 'zap', 8::smallint, true),
  (9::smallint, 'free_hours', 'Giờ giấc tự do', 'project', 'clock', 9::smallint, true),
  (10::smallint, 'private_wc', 'WC riêng', 'room', 'bath', 10::smallint, true),
  (11::smallint, 'refrigerator', 'Tủ lạnh', 'room', 'archive', 11::smallint, true),
  (12::smallint, 'security_247', 'Camera an ninh / Bảo vệ', 'project', 'shield-check', 12::smallint, true)
) AS t(id, code, name, scope, icon, sort_order, is_filter)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory.amenity a WHERE a.code = t.code OR a.id = t.id
);

-- ---------------------------------------------------------------------
-- 2. ĐỊA DANH HOT TẠI CẦN THƠ (inventory.landmark)
-- ---------------------------------------------------------------------
INSERT INTO inventory.landmark (id, code, name, kind, lat, lng, radius_m, sort_order)
SELECT t.id, t.code, t.name, t.kind, t.lat, t.lng, t.radius_m, t.sort_order
FROM (VALUES
  (1::smallint, 'ctu_khu2', 'Đại học Cần Thơ (Khu II - ĐHCT)', 'university', 10.0299, 105.7686, 3000, 1::smallint),
  (2::smallint, 'ctu_khu1', 'Đại học Cần Thơ (Khu I - 30/4)', 'university', 10.0345, 105.7790, 2500, 2::smallint),
  (3::smallint, 'ctump', 'Đại học Y Dược Cần Thơ', 'university', 10.0427, 105.7538, 3000, 3::smallint),
  (4::smallint, 'fpt_cantho', 'Đại học FPT Cần Thơ', 'university', 10.0094, 105.7516, 3500, 4::smallint),
  (5::smallint, 'nctu', 'Đại học Nam Cần Thơ (DNC)', 'university', 10.0125, 105.7275, 3500, 5::smallint),
  (6::smallint, 'taydo', 'Đại học Tây Đô', 'university', 10.0055, 105.7836, 3000, 6::smallint),
  (7::smallint, 'ninhkieu_wharf', 'Bến Ninh Kiều & Cầu Đi Bộ', 'other', 10.0337, 105.7876, 2500, 7::smallint),
  (8::smallint, 'vincom_xuan_khanh', 'Vincom Plaza Xuân Khánh (30/4)', 'mall', 10.0289, 105.7765, 2500, 8::smallint),
  (9::smallint, 'lotte_cantho', 'Lotte Mart Cần Thơ (Mậu Thân)', 'mall', 10.0450, 105.7675, 2500, 9::smallint)
) AS t(id, code, name, kind, lat, lng, radius_m, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory.landmark l WHERE l.code = t.code OR l.id = t.id
);

-- ---------------------------------------------------------------------
-- 3. ĐƠN VỊ HÀNH CHÍNH TP. CẦN THƠ (inventory.admin_unit)
-- ---------------------------------------------------------------------
INSERT INTO inventory.admin_unit (id, parent_id, level, scheme, name, slug, center_lat, center_lng)
SELECT t.id, t.parent_id, t.level, t.scheme, t.name, t.slug, t.center_lat, t.center_lng
FROM (VALUES
  (92, NULL::int, 1::smallint, 'pre_2025', 'TP. Cần Thơ', 'can-tho', 10.0452, 105.7469),
  -- Quận
  (916, 92, 2::smallint, 'pre_2025', 'Ninh Kiều', 'ninh-kieu', 10.0338, 105.7792),
  (918, 92, 2::smallint, 'pre_2025', 'Cái Răng', 'cai-rang', 10.0022, 105.7654),
  (917, 92, 2::smallint, 'pre_2025', 'Bình Thủy', 'binh-thuy', 10.0718, 105.7335),
  -- Phường
  (31147, 916, 3::smallint, 'pre_2025', 'Xuân Khánh', 'xuan-khanh', 10.0285, 105.7712),
  (31149, 916, 3::smallint, 'pre_2025', 'An Khánh', 'an-khanh', 10.0415, 105.7570),
  (31148, 916, 3::smallint, 'pre_2025', 'Hưng Lợi', 'hung-loi', 10.0190, 105.7650),
  (31141, 916, 3::smallint, 'pre_2025', 'Tân An', 'tan-an', 10.0340, 105.7865),
  (31144, 916, 3::smallint, 'pre_2025', 'An Hòa', 'an-hoa', 10.0440, 105.7690),
  (31174, 918, 3::smallint, 'pre_2025', 'Hưng Thạnh', 'hung-thanh', 10.0090, 105.7550),
  (31171, 918, 3::smallint, 'pre_2025', 'Lê Bình', 'le-binh', 10.0010, 105.7810),
  (31162, 917, 3::smallint, 'pre_2025', 'An Thới', 'an-thoi', 10.0550, 105.7510)
) AS t(id, parent_id, level, scheme, name, slug, center_lat, center_lng)
WHERE NOT EXISTS (
  SELECT 1 FROM inventory.admin_unit au WHERE au.id = t.id
);

-- ---------------------------------------------------------------------
-- 4. DỰ ÁN MẪU TẠI CẦN THƠ (inventory.project)
-- ID tự sinh (DEFAULT gen_random_uuid())
-- ---------------------------------------------------------------------
INSERT INTO inventory.project (
  code, name, slug, street_address, ward_id, district_id,
  lat, lng, is_exclusive, pet_policy, ev_parking, free_hours,
  fee_electric, fee_water, fee_service, fee_parking,
  vacant_count, total_rooms, min_price, room_types, status
) VALUES
  ('PRJ-NK-CTU-XUANKHANH', 'TTHome Minihouse Cổng B ĐH Cần Thơ', 'tthome-minihouse-cong-b-dh-can-tho',
   'Hẻm 51 Đường 3/2 (Hồ Bún Xáng)', 31147, 916, 10.0315, 105.7665, true, 'allowed', true, true,
   3500, 15000, 50000, 0, 4, 18, 2500000, ARRAY['studio','duplex'], 'active'),

  ('PRJ-NK-YDUOC-ANKHANH', 'TTHome Căn Hộ Y Dược Thới Nhựt', 'tthome-can-ho-y-duoc-thoi-nhut',
   'Khu Dân Cư Thới Nhựt 2, Đường Tô Hiến Thành', 31149, 916, 10.0435, 105.7525, false, 'cat', true, true,
   3800, 18000, 80000, 50000, 3, 14, 3200000, ARRAY['studio','duplex','1pn'], 'active'),

  ('PRJ-NK-BENNINHKIEU', 'TTHome Riverside Bến Ninh Kiều', 'tthome-riverside-ben-ninh-kieu',
   '38 Hai Bà Trưng', 31141, 916, 10.0345, 105.7860, true, 'small_pet', false, true,
   4000, 20000, 150000, 100000, 2, 8, 5500000, ARRAY['1pn','2pn'], 'active'),

  ('PRJ-CR-FPT-NAMCANTHO', 'TTHome Campus FPT & Nam Cần Thơ', 'tthome-campus-fpt-nam-can-tho',
   'Đường số 10, KĐT Nam Cần Thơ', 31174, 918, 10.0105, 105.7530, false, 'allowed', true, true,
   3500, 12000, 40000, 0, 5, 24, 2200000, ARRAY['duplex','room'], 'active'),

  ('PRJ-CR-TAYDO-LEBINH', 'TTHome Nhà Trọ Xanh ĐH Tây Đô', 'tthome-nha-tro-xanh-dh-tay-do',
   '68 Trần Chiên', 31171, 918, 10.0040, 105.7845, false, 'none', false, true,
   3200, 12000, 30000, 0, 3, 20, 1600000, ARRAY['duplex','room'], 'active'),

  ('PRJ-NK-TAMVU-HUNGLOI', 'TTHome Minihouse Bờ Kè Tầm Vu', 'tthome-minihouse-bo-ke-tam-vu',
   'Đường Tầm Vu, Bờ Kè Hưng Lợi', 31148, 916, 10.0210, 105.7670, true, 'allowed', true, true,
   3600, 15000, 60000, 0, 2, 12, 3000000, ARRAY['studio','duplex'], 'active')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  street_address = EXCLUDED.street_address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng;

-- Tiện nghi dự án
INSERT INTO inventory.project_amenity (project_id, amenity_id)
SELECT p.id, a.id FROM inventory.project p, inventory.amenity a
WHERE (p.code = 'PRJ-NK-CTU-XUANKHANH' AND a.code IN ('fingerprint_lock','pet_allowed','ev_charger','free_hours','security_247'))
   OR (p.code = 'PRJ-NK-YDUOC-ANKHANH' AND a.code IN ('elevator','fingerprint_lock','ev_charger','free_hours','security_247'))
   OR (p.code = 'PRJ-NK-BENNINHKIEU'   AND a.code IN ('elevator','fingerprint_lock','free_hours','security_247'))
   OR (p.code = 'PRJ-CR-FPT-NAMCANTHO' AND a.code IN ('fingerprint_lock','pet_allowed','ev_charger','free_hours'))
   OR (p.code = 'PRJ-CR-TAYDO-LEBINH'  AND a.code IN ('fingerprint_lock','free_hours'))
   OR (p.code = 'PRJ-NK-TAMVU-HUNGLOI' AND a.code IN ('fingerprint_lock','pet_allowed','ev_charger','free_hours'))
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. DANH SÁCH PHÒNG MẪU (inventory.room)
-- ID tự sinh (DEFAULT gen_random_uuid())
-- ---------------------------------------------------------------------
INSERT INTO inventory.room (
  project_id, code, title, slug, room_type, floor, area_m2,
  price, deposit, furniture, has_balcony, has_window, max_occupants,
  status, is_promo, promo_note
) VALUES
  -- Tòa 1: Minihouse ĐHCT Hẻm 51
  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-CTU-XUANKHANH'),
   'P.101', 'Minihouse Gác Cao Hẻm 51 Hồ Bún Xáng Cạnh ĐHCT', 'xuan-khanh-ninh-kieu-ctu-hem51-p101', 'duplex', 1, 24.0, 2600000, 2600000, 'basic', false, true, 2, 'available', true, 'Tặng 1 tháng tiền wifi và rác cho tân sinh viên K50'),

  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-CTU-XUANKHANH'),
   'P.203', 'Studio Ban Công Hẻm 51 View Hồ Bún Xáng Thoáng Mát', 'xuan-khanh-ninh-kieu-ctu-hem51-p203', 'studio', 2, 28.0, 3200000, 3200000, 'full', true, true, 2, 'available', false, NULL),

  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-CTU-XUANKHANH'),
   'P.302', 'Phòng Trọ Gác Đúc ĐH Cần Thơ Cổng B Đầy Đủ Tiện Nghi', 'xuan-khanh-ninh-kieu-ctu-hem51-p302', 'duplex', 3, 22.0, 2500000, 2500000, 'basic', false, true, 2, 'available', false, NULL),

  -- Tòa 2: Y Dược Thới Nhựt 2
  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-YDUOC-ANKHANH'),
   'P.201', 'Căn Hộ Mini Full Nội Thất Gần ĐH Y Dược Cần Thơ', 'an-khanh-ninh-kieu-yduoc-thoinhut-p201', 'studio', 2, 30.0, 3500000, 3500000, 'full', true, true, 2, 'available', true, 'Giảm 300k tháng đầu tiên'),

  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-YDUOC-ANKHANH'),
   'P.305', 'Căn Hộ 1 Phòng Ngủ Riêng KDC Thới Nhựt An Khánh', 'an-khanh-ninh-kieu-yduoc-thoinhut-p305', '1pn', 3, 38.0, 4200000, 4200000, 'full', true, true, 2, 'available', false, NULL),

  -- Tòa 3: Bến Ninh Kiều (Cao cấp)
  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-BENNINHKIEU'),
   'P.301', 'Căn Hộ Ban Công View Sông Hậu Bến Ninh Kiều', 'tan-an-ninh-kieu-riverside-p301', '1pn', 3, 42.0, 5500000, 5500000, 'full', true, true, 2, 'available', false, NULL),

  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-BENNINHKIEU'),
   'P.402', 'Căn Hộ 2 Phòng Ngủ Cao Cấp Trung Tâm Cần Thơ', 'tan-an-ninh-kieu-riverside-p402', '2pn', 4, 60.0, 7500000, 7500000, 'full', true, true, 4, 'available', false, NULL),

  -- Tòa 4: FPT & Nam Cần Thơ
  ((SELECT id FROM inventory.project WHERE code = 'PRJ-CR-FPT-NAMCANTHO'),
   'P.108', 'Phòng Trọ Gác Lửng Rộng Rãi Gần ĐH FPT & Nam Cần Thơ', 'hung-thanh-cai-rang-fpt-namcantho-p108', 'duplex', 1, 26.0, 2400000, 2400000, 'basic', false, true, 3, 'available', true, 'Cho nuôi thú cưng tự do'),

  ((SELECT id FROM inventory.project WHERE code = 'PRJ-CR-FPT-NAMCANTHO'),
   'P.205', 'Minihouse Cửa Sổ Thoáng Sinh Viên FPT Cần Thơ', 'hung-thanh-cai-rang-fpt-namcantho-p205', 'studio', 2, 25.0, 2800000, 2800000, 'full', false, true, 2, 'available', false, NULL),

  -- Tòa 5: Sinh Viên ĐH Tây Đô
  ((SELECT id FROM inventory.project WHERE code = 'PRJ-CR-TAYDO-LEBINH'),
   'P.102', 'Nhà Trọ Sinh Viên Giá Rẻ Ngay Cạnh ĐH Tây Đô', 'le-binh-cai-rang-taydo-p102', 'duplex', 1, 20.0, 1600000, 1600000, 'none', false, true, 2, 'available', false, NULL),

  ((SELECT id FROM inventory.project WHERE code = 'PRJ-CR-TAYDO-LEBINH'),
   'P.204', 'Phòng Có Máy Lạnh Sinh Viên ĐH Tây Đô', 'le-binh-cai-rang-taydo-p204', 'duplex', 2, 22.0, 1900000, 1900000, 'basic', false, true, 2, 'available', true, 'Miễn phí tiền nước tháng đầu'),

  -- Tòa 6: Bờ Kè Tầm Vu
  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-TAMVU-HUNGLOI'),
   'P.201', 'Minihouse Ban Công View Sông Bờ Kè Tầm Vu', 'hung-loi-ninh-kieu-tamvu-p201', 'duplex', 2, 28.0, 3000000, 3000000, 'full', true, true, 2, 'available', false, NULL),

  ((SELECT id FROM inventory.project WHERE code = 'PRJ-NK-TAMVU-HUNGLOI'),
   'P.302', 'Studio Hiện Đại Bờ Kè Tầm Vu Hưng Lợi', 'hung-loi-ninh-kieu-tamvu-p302', 'studio', 3, 26.0, 2900000, 2900000, 'full', false, true, 2, 'available', false, NULL)
ON CONFLICT (project_id, code) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  status = EXCLUDED.status;

-- Tiện nghi phòng
INSERT INTO inventory.room_amenity (room_id, amenity_id)
SELECT r.id, a.id FROM inventory.room r, inventory.amenity a
WHERE (r.slug = 'xuan-khanh-ninh-kieu-ctu-hem51-p101' AND a.code IN ('air_conditioner','window','pet_allowed','private_wc'))
   OR (r.slug = 'xuan-khanh-ninh-kieu-ctu-hem51-p203' AND a.code IN ('air_conditioner','washing_machine','balcony','window','pet_allowed','private_wc','refrigerator'))
   OR (r.slug = 'an-khanh-ninh-kieu-yduoc-thoinhut-p201' AND a.code IN ('air_conditioner','balcony','window','private_wc','refrigerator'))
   OR (r.slug = 'tan-an-ninh-kieu-riverside-p301'       AND a.code IN ('air_conditioner','washing_machine','balcony','window','private_wc','refrigerator'))
   OR (r.slug = 'hung-thanh-cai-rang-fpt-namcantho-p108' AND a.code IN ('air_conditioner','window','pet_allowed','private_wc'))
   OR (r.slug = 'le-binh-cai-rang-taydo-p102'          AND a.code IN ('window','private_wc'))
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. ĐỒNG BỘ SANG BẢNG PHẲNG TÌM KIẾM CẦN THƠ (search.listing_doc)
-- ---------------------------------------------------------------------
INSERT INTO search.listing_doc (
  room_id, project_id, project_code, room_slug, project_name, address,
  ward_id, district_id, lat, lng, room_type, price, price_incl_utility,
  area_m2, furniture, has_balcony, has_window, is_exclusive, is_promo,
  pet_policy, ev_parking, amenity_ids, cover_url, status, rank_score,
  doc_text, tsv, listed_at, updated_at
)
SELECT
  r.id AS room_id,
  p.id AS project_id,
  p.code AS project_code,
  r.slug AS room_slug,
  p.name AS project_name,
  concat_ws(', ', p.street_address, w.name, d.name, 'TP. Cần Thơ') AS address,
  p.ward_id,
  p.district_id,
  p.lat,
  p.lng,
  r.room_type,
  r.price,
  r.price_incl_utility,
  r.area_m2,
  r.furniture,
  r.has_balcony,
  r.has_window,
  p.is_exclusive,
  r.is_promo,
  p.pet_policy,
  p.ev_parking,
  coalesce(
    array_agg(DISTINCT ra.amenity_id) FILTER (WHERE ra.amenity_id IS NOT NULL),
    '{}'
  ) AS amenity_ids,
  CASE r.room_type
    WHEN 'studio' THEN 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
    WHEN 'duplex' THEN 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    WHEN '1pn'    THEN 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    WHEN '2pn'    THEN 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    ELSE 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'
  END AS cover_url,
  r.status,
  CASE WHEN r.is_promo THEN 90.0 WHEN p.is_exclusive THEN 80.0 ELSE 50.0 END AS rank_score,
  lower(common.f_unaccent(concat_ws(' ', r.title, p.name, p.street_address, w.name, d.name, 'Cần Thơ', r.room_type))) AS doc_text,
  to_tsvector('simple', lower(common.f_unaccent(concat_ws(' ', r.title, p.name, p.street_address, w.name, d.name, 'Cần Thơ', r.room_type)))) AS tsv,
  r.created_at,
  r.updated_at
FROM inventory.room r
JOIN inventory.project p ON p.id = r.project_id
LEFT JOIN inventory.admin_unit w ON w.id = p.ward_id
LEFT JOIN inventory.admin_unit d ON d.id = p.district_id
LEFT JOIN inventory.room_amenity ra ON ra.room_id = r.id
GROUP BY r.id, p.id, p.code, r.slug, p.name, p.street_address, w.name, d.name, p.ward_id, p.district_id,
         p.lat, p.lng, r.room_type, r.price, r.price_incl_utility, r.area_m2, r.furniture,
         r.has_balcony, r.has_window, p.is_exclusive, r.is_promo, p.pet_policy, p.ev_parking,
         r.status, r.created_at, r.updated_at
ON CONFLICT (room_id) DO UPDATE SET
  price = EXCLUDED.price,
  status = EXCLUDED.status,
  doc_text = EXCLUDED.doc_text,
  tsv = EXCLUDED.tsv,
  updated_at = now();

-- ---------------------------------------------------------------------
-- 7. THỐNG KÊ KHU VỰC CẦN THƠ (inventory.area_stats)
-- ---------------------------------------------------------------------
INSERT INTO inventory.area_stats (admin_unit_id, scheme, project_count, vacant_count, min_price, common_price, updated_at)
SELECT
  p.ward_id AS admin_unit_id,
  'pre_2025' AS scheme,
  count(DISTINCT p.id) AS project_count,
  count(r.id) FILTER (WHERE r.status = 'available') AS vacant_count,
  min(r.price) FILTER (WHERE r.status = 'available') AS min_price,
  round(avg(r.price) FILTER (WHERE r.status = 'available'), -5) AS common_price,
  now()
FROM inventory.project p
JOIN inventory.room r ON r.project_id = p.id
WHERE p.ward_id IS NOT NULL
GROUP BY p.ward_id
ON CONFLICT (admin_unit_id, scheme) DO UPDATE SET
  project_count = EXCLUDED.project_count,
  vacant_count = EXCLUDED.vacant_count,
  min_price = EXCLUDED.min_price,
  common_price = EXCLUDED.common_price,
  updated_at = now();
