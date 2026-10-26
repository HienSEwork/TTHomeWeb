-- Marks a refresh token that was rotated (replaced by a newer one). Reuse of a rotated token signals theft and
-- revokes the user's sessions; a token revoked by logout has no replacement and is simply invalid. Additive only.
ALTER TABLE identity.refresh_token ADD COLUMN IF NOT EXISTS replaced_by uuid;
