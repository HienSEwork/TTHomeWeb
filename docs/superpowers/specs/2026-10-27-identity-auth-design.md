# Identity: authentication and accounts (phase 1)

Date: 2026-10-27. Service: `identity-service` (port 8081, schema `identity`).
Source: feature group "Xác thực & tài khoản", STT 11-17 in `docs/chuc-nang-chinh-tthome.md`.

## Intent

Let tenants, landlords, agents, consultants and admins create an account, sign in, recover access and
manage their own credentials, so that the other services can trust who a caller is and what they may do.
It is the first backend feature: every later feature (saved rooms, viewing appointments, consignment,
admin tools) depends on it.

## Scope

Phase 1 delivers an HTTP API only (`frontend/` is empty).

| STT | Feature | Phase 1 |
|---|---|---|
| 11 | Register with phone number + OTP | yes (also sign-in by OTP) |
| 12 | Register / sign in with email + password, email verification, remember me | yes |
| 13 | Google sign-in | no (schema marks it phase 2; `oauth_identity` stays unused) |
| 14 | Forgot / reset password | yes, by OTP code |
| 15 | Change password, change phone / email | yes, re-verified by OTP |
| 16 | Role-based authorization | yes |
| 17 | Session management | yes: logout, logout everywhere, lockout after repeated failures |

### Non-goals

- Real SMS / Zalo / email delivery. Phase 1 ships a `MessageSender` port with a logging implementation that is
  only active on the `dev` and `test` profiles. No provider is chosen yet.
- Google sign-in, "list my devices" screen, CAPTCHA, two-factor authentication.
- Consent records (`identity.consent`) and data-protection flows (STT 80).
- Publishing RabbitMQ events (no consumer exists yet).
- Permission-level checks: `permission` / `role_permission` tables stay unused; checks are role-level.

### Anti-goals

- An OTP or token that can be guessed, replayed, or read from the database.
- A different error for "unknown account" and "wrong password", which would let anyone list registered users.
- Tests that touch production data.
- Logging an OTP outside the `dev` / `test` profiles. Without a real `MessageSender` the app must refuse to start
  under `prod`.

## Constraints

- Spring Boot 4.1 / Java 21, Maven monorepo, `identity-service` is currently an empty scaffold.
- The `identity` schema already exists (`db/tthome_schema.sql` = Flyway V1, applied by hand on Supabase).
  Migrations of the service start at V2, `baseline-on-migrate` with baseline 1. JPA runs `ddl-auto: validate`.
- Supabase through the **session pooler**; the service never uses the `postgres` superuser.
- The developer machine has no Docker. Container-based tests run on GitHub Actions only.
- Git rules of `.claude/CLAUDE.md`: one branch per task row, English commits, CI green before an automatic merge.
- No secret in the repository, in chat or in logs.

## Approaches considered

The `identity` schema already fixes the shape: `password_hash` (Argon2id), `refresh_token.token_hash`,
`otp_challenge.code_hash`. That leaves one sensible design; the rejected alternatives are listed so the choice is visible.

1. **Short-lived JWT access token + opaque refresh token stored hashed in `identity.refresh_token` (chosen).**
   Stateless checks for other services, revocable sessions through the refresh table.
2. Server-side sessions with a session cookie. Rejected: every service would call identity on every request, and
   the schema has no session table.
3. Long-lived JWT only. Rejected: logout and "log out everywhere" could not take effect.

For testing against Supabase the owner chose a **tagged test suite against the dedicated dev database**
(`@Tag("supabase")`, profile `supabase`, never in CI), see section 5 of `.claude/CLAUDE.md`.

## Design

### Tokens and sessions

- Access token: JWT, HS256, 15 minutes. Claims: `sub` = user id, `roles` = role codes, `iat`, `exp`, `jti`.
  Signing key from `JWT_SECRET` (at least 32 random bytes), validated at startup.
- Refresh token: 256 random bits (`SecureRandom`), returned once, stored as SHA-256 in `refresh_token.token_hash`.
  Lifetime 30 days with `rememberMe`, otherwise 24 hours.
- Rotation on every refresh: the old row gets `revoked_at`, a new one is issued. Presenting an already revoked token
  revokes every active token of that user (theft detection) and answers 401.
- Logout revokes the presented refresh token. Logout everywhere revokes all of the user's tokens.
  Access tokens already issued stay valid until they expire (at most 15 minutes).
- Passwords, OTP changes and lockouts revoke sessions as stated per flow below.

### Passwords

- Argon2id (`de.mkammerer:argon2-jvm`), OWASP-recommended parameters (19 MiB memory, 2 iterations, 1 lane).
- Length 8-128 characters, no composition rules. Stored in `user_account.password_hash`; null for OTP-only accounts.
- A login for an unknown account still verifies a dummy hash so timing does not reveal existence.

### OTP

- 6 digits from `SecureRandom`, stored as HMAC-SHA256 with a server-side pepper (`OTP_PEPPER`) in `code_hash`.
- Lifetime 5 minutes, 5 wrong attempts burn the challenge, one use only (`consumed_at`).
- Limits, counted from `otp_challenge` rows (no Redis): 1 per target per 60 seconds, 5 per target per hour,
  20 per IP per hour. Over the limit answers 429.
- Purposes already allowed by the schema: `register`, `login`, `reset_password`, `change_contact`.
  Email verification uses `register` on the `email` channel. Channels: `sms`, `zalo`, `email`; phase 1 maps the
  phone number to `sms`.
- Requests for an unknown or already registered target answer the same 202 as a normal request, so the endpoint
  does not reveal who is registered.

### Flows (all under `/api/v1/auth`, JSON)

| Flow | Endpoints | Rules |
|---|---|---|
| Register by phone | `POST /register/phone/request`, `POST /register/phone/verify` | Verify creates `user_account` (type `tenant`, role `TENANT`, `phone_verified_at`), returns tokens. Password optional. |
| Sign in by OTP | `POST /login/otp/request`, `POST /login/otp/verify` | Phone accounts only. |
| Register by email | `POST /register/email`, `POST /register/email/verify` | Creates the account unverified, sends an OTP by email; sign-in is refused (403 `EMAIL_NOT_VERIFIED`) until verified. |
| Sign in | `POST /login` `{identifier, password, rememberMe}` | Identifier is a phone or an email. Same 401 for unknown account and wrong password. |
| Refresh / logout | `POST /refresh`, `POST /logout`, `POST /logout-all` | See "Tokens and sessions". |
| Forgot password | `POST /password/forgot`, `POST /password/reset` | OTP to the account's phone or email. Reset sets the password, clears the lockout, revokes all sessions. |
| Change password | `POST /password/change` (authenticated) | Needs the current password. Revokes the user's other sessions. |
| Change phone / email | `POST /contact/change/request`, `POST /contact/change/confirm` (authenticated) | OTP goes to the **new** contact. Uniqueness is checked again at confirmation. Revokes other sessions. |
| Current user | `GET /me` (authenticated) | Id, phone, email, name, roles. |

### Lockout

Five consecutive wrong passwords set `locked_until` to now + 15 minutes (`failed_login_count` and `locked_until`
already exist). A locked account answers 423 without checking the password. A successful login or a password reset
resets the counter.

### Roles

- Role codes: `TENANT`, `LANDLORD`, `AGENT`, `CONSULTANT`, `ADMIN` (seeded by V1). Everyone registers as `TENANT`.
- Roles go into the JWT; endpoints are protected with `@PreAuthorize("hasRole('ADMIN')")` style checks.
- `PUT /api/v1/admin/users/{id}/roles` (ADMIN only) replaces a user's roles. There is no seeded admin; the first admin
  is promoted once by SQL on Supabase (documented in the service README).
- A locked / disabled account cannot sign in or refresh.

### Data changes

- `V2__identity_otp_ip_index.sql`: index `otp_challenge (ip, created_at DESC)` for the per-IP limit. Additive only.
- No other schema change is expected. If an entity needs a column, it is added as a new additive migration.

### Configuration (added to `backend/.env.example`)

`JWT_SECRET`, `OTP_PEPPER`, plus optional tuning for token lifetimes. Both secrets are required with no default.

### Testing

- Unit tests for services (hashing, OTP, token rotation, lockout) with mocks.
- Integration tests (`@SpringBootTest`, Testcontainers PostgreSQL) run on CI. The container is initialised with
  `db/tthome_schema.sql` (V1) before Flyway runs, so V2+ and `ddl-auto: validate` are exercised for real.
- `*SupabaseIT` (`@Tag("supabase")`, Maven profile `supabase`): Flyway migrates the dev Supabase database (baseline at
  V1, then V2), then a register -> verify -> login -> refresh -> logout run with random test accounts that are deleted
  afterwards. Run on request only.

## Delivery plan (one branch per task, in dependency order)

1. `feat/identity/foundation`: dependencies, V2, entities and repositories, error model, security configuration,
   JWT and password services, test infrastructure, Maven `supabase` profile, `.env.example` additions.
2. `feat/identity/otp-phone` (STT 11): OTP service, `MessageSender`, phone register and OTP sign-in.
3. `feat/identity/email-signin` (STT 12): email register / verify, password login, refresh, remember me.
4. `feat/identity/session` (STT 17): logout, logout everywhere, lockout, `/me`.
5. `feat/identity/password-reset` (STT 14).
6. `feat/identity/change-credentials` (STT 15).
7. `feat/identity/roles` (STT 16).

Each branch is merged (squash) before the next one starts, after CI is green.

## Left to the builder

Class and package naming inside the existing layout, exact DTO field names, validation messages, the Maven profile
wiring, response bodies of errors (a single JSON error shape in `tthome-common`), and the cleanup mechanics of the
Supabase test.

## Open points for the owner

- Which SMS / Zalo / email provider to use later (phase 1 does not need it).
- Whether the assistant may run the `supabase` profile itself by loading `backend/.env` into the process without
  printing it, or whether the owner runs it.
