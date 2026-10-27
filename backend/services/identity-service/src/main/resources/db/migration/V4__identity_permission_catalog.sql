-- Permission catalog for the admin screens (one code per admin function). Grants to roles are managed through the
-- admin API, so none are seeded. Additive only; rerunning is harmless.
INSERT INTO identity.permission (id, code, description) VALUES
  (1,  'dashboard.view',      'View the admin dashboard'),
  (2,  'listing.manage',      'Manage rooms and projects'),
  (3,  'consignment.review',  'Review consignment requests'),
  (4,  'booking.manage',      'Manage viewing appointments'),
  (5,  'crm.manage',          'Manage customers and consultation requests'),
  (6,  'user.manage',         'Manage users and roles'),
  (7,  'cms.manage',          'Manage articles, banners, pages, FAQ and menus'),
  (8,  'catalog.manage',      'Manage areas, amenities and categories'),
  (9,  'collaborator.manage', 'Manage collaborators and commissions'),
  (10, 'report.view',         'View reports and statistics'),
  (11, 'audit.view',          'View the activity log')
ON CONFLICT DO NOTHING;
