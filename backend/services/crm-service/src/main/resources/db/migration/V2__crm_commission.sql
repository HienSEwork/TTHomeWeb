-- Commission owed to a collaborator for a customer they referred. One live commission per customer. Additive only.
CREATE TABLE IF NOT EXISTS crm.commission (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid NOT NULL REFERENCES crm.customer(id),
  referrer_user_id uuid NOT NULL,
  amount           numeric(12,0) NOT NULL CHECK (amount >= 0),
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  note             text,
  created_by       uuid,
  paid_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS commission_customer_uq ON crm.commission (customer_id) WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS commission_referrer_idx ON crm.commission (referrer_user_id, status);

DROP TRIGGER IF EXISTS trg_updated_at ON crm.commission;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON crm.commission
  FOR EACH ROW EXECUTE FUNCTION common.set_updated_at();
