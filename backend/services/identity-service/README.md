# identity-service

Accounts, sign-in and roles (port 8081, schema `identity`). Design: `docs/superpowers/specs/2026-10-27-identity-auth-design.md`.

## Endpoints (`/api/v1`)

| Endpoint | Purpose |
|---|---|
| `POST /auth/register/phone/request`, `/register/phone/verify` | Register by phone and one-time code |
| `POST /auth/login/otp/request`, `/login/otp/verify` | Sign in by one-time code |
| `POST /auth/register/email`, `/register/email/verify` | Register by email: the account (with the chosen password) is created only after the emailed code is confirmed |
| `POST /auth/login` | Sign in with a phone or an email and a password |
| `POST /auth/refresh`, `/logout`, `/logout-all` | Rotate a refresh token, end one session, end all sessions |
| `GET /auth/me` | The signed-in user and roles |
| `POST /auth/password/forgot`, `/password/reset` | Recover access with a one-time code |
| `POST /auth/password/change` | Change the password (signed in) |
| `POST /auth/contact/change/request`, `/confirm` | Change phone or email (signed in) |
| `PUT /admin/users/{id}/roles` | Replace the roles of a user (ADMIN only) |

## Configuration

Required environment variables (see `backend/.env.example`): `SUPABASE_PROJECT_REF`, `SUPABASE_DB_URL`, `DB_PASSWORD`,
`JWT_SECRET` (at least 32 bytes) and `OTP_PEPPER` (at least 16 bytes).

**Delivering codes.** With `MAIL_ENABLED=true` (plus `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
`MAIL_FROM`) email codes are sent through that SMTP server over STARTTLS, in the background so response time does not
reveal whether an address is registered. A failed send is logged without the code; the user requests a new one after the
60 s cooldown. There is no SMS provider yet: SMS codes are only logged on the `dev`, `test` and `supabase` profiles and are
refused with `503 CHANNEL_UNAVAILABLE` on `prod`. Without `MAIL_ENABLED=true` the `prod` profile refuses to start.

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
