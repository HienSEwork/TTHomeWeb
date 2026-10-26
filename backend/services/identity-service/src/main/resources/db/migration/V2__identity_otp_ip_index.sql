-- Speeds up the per-IP OTP request limit (count of rows for one IP in the last hour). Additive only.
CREATE INDEX IF NOT EXISTS otp_ip_idx ON identity.otp_challenge (ip, created_at DESC);
