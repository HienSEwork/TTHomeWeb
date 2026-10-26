# identity-service

Accounts, sign-in and roles (port 8081, schema `identity`). Design: `docs/superpowers/specs/2026-10-27-identity-auth-design.md`.

## Endpoints (`/api/v1`)

| Endpoint | Purpose |
|---|---|
| `POST /auth/register/phone/request`, `/register/phone/verify` | Register by phone and one-time code |
| `POST /auth/login/otp/request`, `/login/otp/verify` | Sign in by one-time code |
| `POST /auth/register/email`, `/register/email/verify` | Register by email and password, confirmed by a code |
| `POST /auth/login` | Sign in with a phone or an email and a password |
| `POST /auth/refresh`, `/logout`, `/logout-all` | Rotate a refresh token, end one session, end all sessions |
| `GET /auth/me` | The signed-in user and roles |
| `POST /auth/password/forgot`, `/password/reset` | Recover access with a one-time code |
| `POST /auth/password/change` | Change the password (signed in) |
| `POST /auth/contact/change/request`, `/confirm` | Change phone or email (signed in) |
| `PUT /admin/users/{id}/roles` | Replace the roles of a user (ADMIN only) |

## Configuration

Required environment variables (see `backend/.env.example`): `SUPABASE_PROJECT_REF`, `SUPABASE_DB_URL`, `DB_PASSWORD`,
`JWT_SECRET` (at least 32 bytes) and `OTP_PEPPER` (at least 16 bytes). Codes are only logged on the `dev`, `test` and
`supabase` profiles; the `prod` profile refuses to start until a real `MessageSender` bean (SMS / Zalo / email provider) exists.

## Promote the first admin

Nobody is an admin after a fresh install. Register the account normally, then run once in the Supabase SQL editor
(replace the email):

```sql
insert into identity.user_role (user_id, role_id)
select u.id, r.id from identity.user_account u, identity.role r
where lower(u.email) = lower('you@example.com') and r.code = 'ADMIN'
on conflict do nothing;

update identity.user_account set user_type = 'admin' where lower(email) = lower('you@example.com');
```

The user gets the role in new access tokens after the next sign-in. Later role changes go through
`PUT /admin/users/{id}/roles`.

## Tests

- `./mvnw -pl services/identity-service -am test`: unit tests plus Testcontainers integration tests (needs Docker; CI runs them).
- `./mvnw -pl services/identity-service -am -Psupabase test`: `*SupabaseIT` against the dev Supabase database, only on request
  (see section 5 of `.claude/CLAUDE.md`). Connection details come from the environment or `backend/.env`, never from the repository.
