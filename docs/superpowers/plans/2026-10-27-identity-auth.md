# Identity: authentication and accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase 1 of `identity-service`: phone OTP and email registration, password login with refresh-token rotation, lockout, password reset and change, contact change, and role-based authorization.

**Architecture:** Stateless JWT access tokens (HS256, 15 min) plus opaque refresh tokens stored hashed in `identity.refresh_token`; OTP challenges in `identity.otp_challenge`; a `MessageSender` port with a logging implementation for `dev` / `test` / `supabase`. Existing layered layout under `vn.tthome.identity` (`controllers`, `services`, `repos`, `models/*`, `config`). One shared JSON error shape in `tthome-common`.

**Tech Stack:** Java 21, Spring Boot 4.1.2 (Security, Web MVC, Data JPA, Validation, Flyway), PostgreSQL (Supabase), `de.mkammerer:argon2-jvm:2.12`, `io.jsonwebtoken:jjwt-*:0.13.0` (use `jjwt-gson` as the JSON backend: Boot 4 ships Jackson 3), JUnit 5, Testcontainers.

**Spec:** `docs/superpowers/specs/2026-10-27-identity-auth-design.md` (read it first; this plan does not repeat its rules).

## Global Constraints

- Branch per group, named exactly as in "Branch plan"; tasks inside a group are commits on that branch. Commits: Conventional Commits in **English**, `Refs: STT-<n>` footer, **no** AI attribution line. Never commit on `dev`/`main`.
- Per branch, finish with: `git fetch origin && git rebase origin/dev`, push, open the PR into `dev` (body in English with task code, summary, how it was checked, impact), wait for `gh pr checks <n>` all green and `mergeStateStatus` = `CLEAN`, then `gh pr merge <n> --squash` (never `--delete-branch`), `git push origin --delete <branch>`, delete the local branch with `git branch -D`, and `git checkout dev && git pull --ff-only`. Start the next branch from the updated `dev`.
- The developer machine has **no Docker**: only plain unit tests (`*Test`, no Spring context needing Testcontainers) run locally with `cd backend && ./mvnw -pl services/identity-service -am test -Dtest=<Class>`; `*Tests` integration classes run on CI through the PR. Run `./mvnw -B -ntp clean verify` locally only for compilation (`test-compile`).
- Tests never touch Supabase except `*SupabaseIT` (`@Tag("supabase")`), which run only on request with `-Psupabase` (section 5 of `.claude/CLAUDE.md`).
- No secret in code, logs, chat or commits. `JWT_SECRET` (>= 32 bytes) and `OTP_PEPPER` (>= 16 bytes) have no default; test profiles use dummy values.
- Never log an OTP outside profiles `dev`, `test`, `supabase`; with no `MessageSender` bean the `prod` profile must fail to start.
- Same 401 `INVALID_CREDENTIALS` for unknown account and wrong password. OTP request endpoints always answer `202` with an empty body, whether or not the target is registered.
- Plan decisions the spec leaves open (builder may not change them silently): phones are accepted as `0xxxxxxxxx`, `84xxxxxxxxx` or `+84xxxxxxxxx` (Vietnamese mobile, 10 digits after the leading 0) and stored as `+84xxxxxxxxx`; emails are trimmed and lower-cased; `jti` of an access token is the id of the `refresh_token` row backing it ("session id").
- Java style of the repo: tabs, Lombok allowed, package root `vn.tthome.identity`.

## Review Focus

1. Phone written as `0912345678`, `84912345678`, `+84 912 345 678` must resolve to one account and one unique value (no duplicate registration). Pinned in Task 6.
2. Email with upper case or spaces (`" Foo@Bar.com "`) must match the account registered as `foo@bar.com`. Pinned in Task 6.
3. Two concurrent verifications of the same OTP / two concurrent registrations of one contact create exactly one account (the second gets 409 `CONTACT_TAKEN` or 400 `OTP_INVALID`, never 500). Pinned in Task 9.
4. Reusing a rotated refresh token, and two concurrent refreshes of the same token: only one succeeds, the reuse revokes the user's sessions. Pinned in Task 11.
5. Empty body, missing fields, 129-character or non-ASCII password, malformed JSON: answer 400 `VALIDATION_ERROR`, never 500. Pinned in Task 2 and Task 10.

---

## Branch plan

| # | Branch | STT | Tasks |
|---|---|---|---|
| 1 | `feat/identity/foundation` | - | 1-5 |
| 2 | `feat/identity/otp-phone` | 11 | 6-9 |
| 3 | `feat/identity/email-signin` | 12 | 10-11 |
| 4 | `feat/identity/session` | 17 | 12 |
| 5 | `feat/identity/password-reset` | 14 | 13 |
| 6 | `feat/identity/change-credentials` | 15 | 14 |
| 7 | `feat/identity/roles` | 16 | 15 |

Foundation commits use `Refs: STT-11, STT-12, STT-14, STT-15, STT-16, STT-17`.

Work in `backend/` unless a path says otherwise. `IDENTITY` below means `services/identity-service/src/main/java/vn/tthome/identity`, `IDENTITY_TEST` the same under `src/test/java`.

---

# Branch 1: `feat/identity/foundation`

### Task 1: Dependencies, properties, environment

**Files:**
- Modify: `services/identity-service/pom.xml`, `services/identity-service/src/main/resources/application.yml`, `services/identity-service/src/test/resources/application-test.yml`, `.env.example`
- Create: `IDENTITY/config/AuthProperties.java`
- Test: `IDENTITY_TEST/config/AuthPropertiesTest.java`

**Interfaces:**
- Produces: `record AuthProperties(String jwtSecret, String otpPepper, Duration accessTtl, Duration refreshTtl, Duration refreshTtlRemember, int maxFailedLogins, Duration lockDuration, Duration otpTtl, int otpMaxAttempts, Duration otpResendCooldown, int otpMaxPerTargetPerHour, int otpMaxPerIpPerHour)` bound with `@ConfigurationProperties("tthome.auth")`, `@Validated`, registered via `@EnableConfigurationProperties` in `config/`. Defaults from the spec (15m, 24h, 30d, 5, 15m, 5m, 5, 60s, 5, 20).

- [ ] **Step 1: Write the failing test** `AuthPropertiesTest` (plain validator test, no Spring context): `rejectsJwtSecretShorterThan32Bytes`, `rejectsOtpPepperShorterThan16Bytes`, `acceptsValidSecretsWithDefaults` (assert `accessTtl` is `PT15M`, `maxFailedLogins` is 5).
- [ ] **Step 2: Run** `./mvnw -pl services/identity-service -am test -Dtest=AuthPropertiesTest` — expect FAIL (class missing).
- [ ] **Step 3: Implement.** Add dependencies `argon2-jvm 2.12`, `jjwt-api`/`jjwt-impl`/`jjwt-gson` `0.13.0` (versions as properties in `identity-service/pom.xml`). `application.yml`: `tthome.auth.jwt-secret: ${JWT_SECRET}`, `tthome.auth.otp-pepper: ${OTP_PEPPER}` (no defaults). `application-test.yml`: dummy 40-character secrets. `.env.example`: add `JWT_SECRET` and `OTP_PEPPER` with generation hint (`openssl rand -base64 48`) and placeholders only.
- [ ] **Step 4: Run** the same test — expect PASS; then `./mvnw -B -ntp -q test-compile` — expect no errors.
- [ ] **Step 5: Commit** `feat(identity): add auth dependencies and validated properties`.

### Task 2: Shared error model

**Files:**
- Create: `tthome-common/src/main/java/vn/tthome/common/error/{ApiError,ApiException,GlobalExceptionHandler}.java`
- Modify: `IDENTITY/IdentityServiceApplication.java` (scan `vn.tthome.common.error`)
- Test: `tthome-common/src/test/java/vn/tthome/common/error/GlobalExceptionHandlerTest.java`

**Interfaces:**
- Produces: `record ApiError(String code, String message)`; `class ApiException extends RuntimeException { ApiException(HttpStatus status, String code, String message); HttpStatus status(); String code(); }`; `@RestControllerAdvice GlobalExceptionHandler` mapping `ApiException` to its status with `ApiError`, `MethodArgumentNotValidException` / `HttpMessageNotReadableException` / `ConstraintViolationException` to 400 `VALIDATION_ERROR`, any other `Exception` to 500 `INTERNAL_ERROR` with a fixed message (no stack trace, no exception text). Error codes used across the plan: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_DISABLED`, `OTP_INVALID`, `OTP_RATE_LIMITED`, `CONTACT_TAKEN`, `TOKEN_INVALID`, `FORBIDDEN`, `INTERNAL_ERROR`.

- [ ] **Step 1: Write the failing test** with `MockMvcBuilders.standaloneSetup` and a throwaway controller: `apiExceptionBecomesItsStatusAndCode` (423 / `ACCOUNT_LOCKED`), `malformedJsonIs400ValidationError`, `missingRequiredFieldIs400ValidationError`, `unexpectedExceptionIs500WithoutDetails` (body contains neither the exception message nor `at `).
- [ ] **Step 2: Run** `./mvnw -pl tthome-common test -Dtest=GlobalExceptionHandlerTest` — expect FAIL.
- [ ] **Step 3: Implement** the three classes; common's web starter is `optional`, so identity picks it up through its own dependency.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(common): add shared API error model`.

### Task 3: Password hashing

**Files:** Create `IDENTITY/services/PasswordHasher.java`; Test `IDENTITY_TEST/services/PasswordHasherTest.java`.

**Interfaces:**
- Produces: `@Service PasswordHasher { String hash(String raw); boolean verify(String hash, String raw); void verifyDummy(String raw); }` — Argon2id, 19 MiB memory, 2 iterations, 1 lane; `verifyDummy` verifies against a precomputed hash so unknown accounts cost the same time.

- [ ] **Step 1: Write the failing test:** `hashIsNotThePasswordAndVerifies`, `wrongPasswordFails`, `twoHashesOfSamePasswordDiffer`, `verifyDummyNeverThrowsAndReturnsNothing`, `unicodePasswordVerifies` (`"mật-khẩu-Việt-123"`).
- [ ] **Step 2: Run** `-Dtest=PasswordHasherTest` — expect FAIL.
- [ ] **Step 3: Implement** with `Argon2Factory.create(Argon2Types.ARGON2id)`; wipe the char array after use.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(identity): add Argon2id password hasher`.

### Task 4: JWT service

**Files:** Create `IDENTITY/services/JwtService.java`, `IDENTITY/models/dtos/AccessClaims.java`; Test `IDENTITY_TEST/services/JwtServiceTest.java`.

**Interfaces:**
- Consumes: `AuthProperties` (Task 1), `ApiException` (Task 2).
- Produces: `record AccessClaims(UUID userId, UUID sessionId, List<String> roles)`; `@Service JwtService { String issueAccessToken(UUID userId, UUID sessionId, Collection<String> roles); AccessClaims parse(String token); Instant expiresAt(String token); }`. HS256, claims `sub`, `jti` (= sessionId), `roles`, `iat`, `exp`. `parse` throws `ApiException(401, "TOKEN_INVALID", ...)` for expired, tampered, wrong-algorithm (`alg=none`) and malformed tokens.

- [ ] **Step 1: Write the failing test** (build the service with a fixed `Clock`): `roundTripKeepsUserSessionAndRoles`, `expiredTokenIsRejected` (clock +16 min), `tamperedSignatureIsRejected`, `algNoneTokenIsRejected`, `garbageStringIsRejected`, `tokenFromAnotherSecretIsRejected`.
- [ ] **Step 2: Run** `-Dtest=JwtServiceTest` — expect FAIL.
- [ ] **Step 3: Implement.** Inject a `Clock` bean (add `config/ClockConfig` returning `Clock.systemUTC()`) so tests control time.
- [ ] **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(identity): add JWT access token service`.

### Task 5: Persistence, migration V2, security filter, Supabase profile

**Files:**
- Create: `IDENTITY/models/enums/{UserType,UserStatus,OtpPurpose,OtpChannel}.java`; `IDENTITY/models/entities/{UserAccount,Role,OtpChallenge,RefreshToken}.java` (`UserAccount` holds `Set<Role> roles` through `identity.user_role`); `IDENTITY/repos/{UserAccountRepository,RoleRepository,OtpChallengeRepository,RefreshTokenRepository}.java`; `services/identity-service/src/main/resources/db/migration/V2__identity_otp_ip_index.sql`; `IDENTITY/config/{SecurityConfig,JwtAuthenticationFilter}.java`; `IDENTITY_TEST/IdentityIntegrationTestBase.java` (shared annotations + `InMemoryMessageSender` later); `IDENTITY_TEST/SupabaseMigrationIT.java`
- Modify: `IDENTITY_TEST/TestcontainersConfiguration.java` (initialise the PostgreSQL container with `db/tthome_schema.sql` as `/docker-entrypoint-initdb.d/01-schema.sql`, host path `../../../db/tthome_schema.sql`), `backend/pom.xml` (profile `supabase`); Create: `services/identity-service/src/test/resources/application-supabase.yml`
- Test: `IDENTITY_TEST/repos/RepositoriesTests.java`, `IDENTITY_TEST/config/SecurityConfigTests.java`

**Interfaces:**
- Produces (repositories):
  - `UserAccountRepository`: `Optional<UserAccount> findByPhoneAndDeletedAtIsNull(String phone)`, `Optional<UserAccount> findByEmailIgnoreCaseAndDeletedAtIsNull(String email)`.
  - `RoleRepository`: `Optional<Role> findByCode(String code)`.
  - `OtpChallengeRepository`: `Optional<OtpChallenge> findFirstByTargetAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(String target, OtpPurpose purpose)`, `long countByTargetAndCreatedAtAfter(String target, Instant since)`, `long countByIpAndCreatedAtAfter(String ip, Instant since)`.
  - `RefreshTokenRepository`: `Optional<RefreshToken> findByTokenHash(String hash)`, `@Modifying int revokeAllActive(UUID userId, Instant now)`, `@Modifying int revokeAllActiveExcept(UUID userId, UUID keepId, Instant now)`.
- Security: stateless; public: `/actuator/health`, `/api/v1/auth/register/**`, `/api/v1/auth/login/**`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/password/forgot`, `/api/v1/auth/password/reset`; everything else requires authentication; `JwtAuthenticationFilter` turns a valid `Authorization: Bearer` token into authorities `ROLE_<code>` and exposes `AccessClaims` as the principal; an invalid token answers 401 with `ApiError`.
- Maven profile `supabase` (in `backend/pom.xml`): surefire `groups=supabase` and `includes=**/*SupabaseIT.java`; the default build keeps `excludedGroups=supabase`. Run: `./mvnw -pl services/identity-service -am -Psupabase test`.

- [ ] **Step 1: Write the failing tests.** `RepositoriesTests` (Testcontainers, V1 + V2 applied): `flywayAppliedV2OnTopOfBaseline` (query `identity.flyway_schema_history`: versions 1 and 2 present), `rolesSeededByV1` (5 codes), `savesAndFindsUserByNormalizedPhoneAndEmail`, `phoneUniqueIndexRejectsDuplicate`, `refreshTokenRevokeAllActiveExceptKeepsOneRow`. `SecurityConfigTests` (MockMvc): `unauthenticatedRequestToProtectedPathIs401WithApiError`, `validTokenReachesTheController` (expect 404, not 401), `expiredTokenIs401`, `healthIsPublic`.
- [ ] **Step 2: Run** locally `./mvnw -B -ntp -q test-compile` — expect FAIL (missing types). ITs themselves are verified on CI.
- [ ] **Step 3: Implement** the entities with `@Column` names matching `db/tthome_schema.sql` exactly (`ddl-auto: validate`; `default_schema: identity`), `@Version` on `UserAccount.version`; `V2` = `CREATE INDEX IF NOT EXISTS otp_ip_idx ON identity.otp_challenge (ip, created_at DESC);`; `SupabaseMigrationIT` (`@Tag("supabase")`, `@SpringBootTest`, `@ActiveProfiles("supabase")`) asserts `flyway_schema_history` contains versions 1 and 2 after context start and the five seeded roles exist; `application-supabase.yml` excludes `RabbitAutoConfiguration` and sets dummy `tthome.auth.*` only when the env vars are absent (`${JWT_SECRET:...}` is NOT allowed: read the real env vars).
- [ ] **Step 4: Push the branch and let CI run** (`gh pr create`, `gh pr checks <n> --watch`); fix until green. If a `*Tests` class fails only on CI, read `gh run view <id> --log-failed`.
- [ ] **Step 5: Supabase check (only if the owner agreed to run it):** with `backend/.env` loaded without printing it, `./mvnw -pl services/identity-service -am -Psupabase test`; expect `SupabaseMigrationIT` PASS and V2 applied on the dev database. Report the result without echoing connection details.
- [ ] **Step 6: Commit** (in logical commits: persistence, security, migration, test infrastructure) `feat(identity): add persistence, security filter and V2 migration`; then run the branch finish routine from Global Constraints.

---

# Branch 2: `feat/identity/otp-phone` (STT 11)

### Task 6: Contact normalizer

**Files:** Create `IDENTITY/services/ContactNormalizer.java`; Test `IDENTITY_TEST/services/ContactNormalizerTest.java`.

**Interfaces:**
- Produces: `@Component ContactNormalizer { String phone(String raw); String email(String raw); boolean looksLikeEmail(String identifier); }` — invalid input throws `ApiException(400, "VALIDATION_ERROR", ...)`.

- [ ] **Step 1: Write the failing test:** `phoneForms0912345678And84912345678AndPlus84WithSpacesAllBecomePlus84912345678`, `phoneWithLettersOrTooShortIsRejected`, `landlinePrefixIsRejected` (`0281234567`), `emailIsTrimmedAndLowerCased` (`" Foo@Bar.com "` becomes `foo@bar.com`), `emailWithoutAtIsRejected`, `identifierWithAtSignLooksLikeEmail`.
- [ ] **Step 2: Run** `-Dtest=ContactNormalizerTest` — expect FAIL. **Step 3: Implement.** **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(identity): normalize phone numbers and emails` (`Refs: STT-11`).

### Task 7: OTP service and message sender

**Files:** Create `IDENTITY/services/{OtpService,MessageSender,LoggingMessageSender}.java`; Test `IDENTITY_TEST/services/OtpServiceTest.java` (Mockito for repos and sender, fixed `Clock`), `IDENTITY_TEST/InMemoryMessageSender.java` (test double, `@Primary` when imported).

**Interfaces:**
- Consumes: `OtpChallengeRepository`, `AuthProperties`, `Clock`, `ApiException`.
- Produces: `interface MessageSender { void send(OtpChannel channel, String target, OtpPurpose purpose, String code); }`; `@Profile({"dev","test","supabase"}) LoggingMessageSender`; `@Service OtpService { void request(String target, OtpPurpose purpose, OtpChannel channel, String ip); void verify(String target, OtpPurpose purpose, String code); }`. `request` enforces the limits of the spec (60 s resend cooldown, 5/target/hour, 20/ip/hour -> 429 `OTP_RATE_LIMITED`); `verify` consumes the newest unconsumed challenge, counts a wrong attempt, burns the challenge after 5 wrong attempts, rejects expired ones -> 400 `OTP_INVALID` (same code for wrong, expired, consumed, missing). Code = 6 digits from `SecureRandom`, stored as Base64 HMAC-SHA256(`otpPepper`, `target + ":" + purpose + ":" + code`).

- [ ] **Step 1: Write the failing test:** `requestStoresHashedCodeNotThePlainCode`, `requestSendsTheSixDigitCodeThroughTheSender`, `secondRequestWithin60SecondsIsRateLimited`, `sixthRequestInAnHourIsRateLimited`, `twentyFirstRequestFromOneIpIsRateLimited`, `verifyAcceptsCorrectCodeOnceThenRejectsReplay`, `fifthWrongAttemptBurnsTheChallengeEvenIfLaterCodeIsRight`, `expiredCodeIsRejected` (clock +5 min 1 s), `codeForAnotherPurposeIsRejected`.
- [ ] **Step 2: Run** `-Dtest=OtpServiceTest` — expect FAIL. **Step 3: Implement**; compare hashes with `MessageDigest.isEqual`. **Step 4: Run** — expect PASS.
- [ ] **Step 5: Commit** `feat(identity): add OTP service and message sender port` (`Refs: STT-11`).

### Task 8: Session issuing

**Files:** Create `IDENTITY/services/SessionService.java`, `IDENTITY/models/dtos/TokenPair.java`; Test `IDENTITY_TEST/services/SessionServiceTests.java` (Testcontainers, `@DataJpaTest`-style slice or `@SpringBootTest`).

**Interfaces:**
- Consumes: `RefreshTokenRepository`, `JwtService`, `AuthProperties`, `Clock`.
- Produces: `record TokenPair(String accessToken, Instant accessExpiresAt, String refreshToken, Instant refreshExpiresAt)`; `@Service SessionService { TokenPair issue(UserAccount user, boolean rememberMe, String deviceInfo, String ip); }`. The refresh token is `Base64URL(32 random bytes)`; only its SHA-256 (hex) is stored; the access token's `jti` is the saved row id; lifetime 24 h, or 30 days with `rememberMe`.

- [ ] **Step 1: Write the failing test:** `issueStoresOnlyTheHashOfTheRefreshToken`, `accessTokenJtiEqualsStoredSessionId`, `rememberMeExtendsRefreshLifetimeTo30Days`, `refreshLifetimeDefaultsTo24Hours`.
- [ ] **Step 2: Run** `./mvnw -B -ntp -q test-compile` — expect FAIL; ITs on CI. **Step 3: Implement.** **Step 4:** green on CI.
- [ ] **Step 5: Commit** `feat(identity): issue access and refresh tokens` (`Refs: STT-11`).

### Task 9: Phone registration and OTP sign-in endpoints

**Files:** Create `IDENTITY/controllers/AuthController.java`, `IDENTITY/services/AccountService.java`, `IDENTITY/services/PhoneAuthService.java`, `IDENTITY/models/dtos/{PhoneRequest,PhoneVerifyRequest,OtpLoginVerifyRequest}.java`; Test `IDENTITY_TEST/controllers/PhoneAuthTests.java` (`@SpringBootTest` + MockMvc + `InMemoryMessageSender`).

**Interfaces:**
- Consumes: `OtpService`, `ContactNormalizer`, `SessionService`, `UserAccountRepository`, `RoleRepository`, `PasswordHasher`.
- Produces: `AccountService.createPhoneAccount(String phone, String fullName, String passwordOrNull) -> UserAccount` (type `tenant`, role `TENANT`, `phone_verified_at` set, hashing the password when present; catches `DataIntegrityViolationException` and throws `ApiException(409, "CONTACT_TAKEN", ...)`); endpoints `POST /api/v1/auth/register/phone/request` (202), `POST /api/v1/auth/register/phone/verify` (200 `TokenPair`; body `phone, code, fullName?, password?, rememberMe?`), `POST /api/v1/auth/login/otp/request` (202), `POST /api/v1/auth/login/otp/verify` (200 `TokenPair`; unknown phone answers the same 400 `OTP_INVALID`).

- [ ] **Step 1: Write the failing test:** `registerRequestForNewPhoneSendsAnOtp`, `registerRequestForExistingPhoneAnswers202AndSendsNothing`, `verifyCreatesTenantAccountAndReturnsTokens`, `phoneInThreeFormatsRegistersOnlyOnce` (second format -> `OTP_INVALID` or `CONTACT_TAKEN`, one row), `twoConcurrentVerifiesCreateOneAccount` (two threads, same code: exactly one 200, the other 4xx, one row), `otpLoginWorksForExistingPhoneAndFailsForUnknownOne`, `wrongCodeIs400OtpInvalid`, `passwordLongerThan128IsValidationError`.
- [ ] **Step 2: Run** test-compile — expect FAIL. **Step 3: Implement** (controller thin, logic in services; client IP from `HttpServletRequest.getRemoteAddr()`). **Step 4:** green on CI.
- [ ] **Step 5: Commit** `feat(identity): register and sign in by phone OTP` (`Refs: STT-11`); run the branch finish routine.

---

# Branch 3: `feat/identity/email-signin` (STT 12)

### Task 10: Email registration, verification, password login

**Files:** Create `IDENTITY/services/EmailAuthService.java`, `IDENTITY/models/dtos/{EmailRegisterRequest,EmailVerifyRequest,LoginRequest}.java`; Modify `AuthController`, `AccountService`; Test `IDENTITY_TEST/controllers/EmailAuthTests.java`.

**Interfaces:**
- Consumes: Tasks 3, 6, 7, 8, 9.
- Produces: `AccountService.createEmailAccount(String email, String password, String fullName) -> UserAccount` (unverified, role `TENANT`, 409 `CONTACT_TAKEN` on duplicate); endpoints `POST /api/v1/auth/register/email` (202; body `email, password, fullName`; sends an OTP on channel `email`, purpose `register`), `POST /api/v1/auth/register/email/verify` (200 `TokenPair`; body `email, code, rememberMe?`), `POST /api/v1/auth/login` (body `identifier, password, rememberMe?`, 200 `TokenPair`). Login: an unknown identifier calls `PasswordHasher.verifyDummy` then 401 `INVALID_CREDENTIALS`; an unverified email account answers 403 `EMAIL_NOT_VERIFIED` only after the password matched; `locked` / `disabled` accounts answer 403 `ACCOUNT_DISABLED`.

- [ ] **Step 1: Write the failing test:** `registerThenVerifyThenLoginWithEmailInOtherCase`, `loginBeforeVerificationIs403EmailNotVerified`, `wrongPasswordAndUnknownAccountGiveIdenticalResponses` (same status and body), `duplicateEmailRegistrationAnswers202WithoutCreatingASecondAccount`, `rememberMeFlagChangesRefreshExpiry`, `emptyBodyIs400ValidationError`, `password129CharsIs400`, `identifierIsPhoneOrEmail` (login with the phone of a phone+password account works).
- [ ] **Step 2: Run** test-compile — expect FAIL. **Step 3: Implement.** **Step 4:** green on CI.
- [ ] **Step 5: Commit** `feat(identity): register and sign in by email and password` (`Refs: STT-12`).

### Task 11: Refresh with rotation and reuse detection

**Files:** Modify `SessionService`, `AuthController`; Create `IDENTITY/models/dtos/RefreshRequest.java`; Test `IDENTITY_TEST/services/SessionRefreshTests.java`.

**Interfaces:**
- Produces: `SessionService.refresh(String refreshToken, String deviceInfo, String ip) -> TokenPair`; `POST /api/v1/auth/refresh` (body `refreshToken`). Revokes the presented row and issues a new one in one transaction (rotation keeps the `rememberMe` lifetime of the old row). A revoked row presented again revokes all of the user's active rows and answers 401 `TOKEN_INVALID`; expired, unknown and non-active (`locked`/`disabled`) users answer 401 `TOKEN_INVALID`.

- [ ] **Step 1: Write the failing test:** `refreshReturnsNewPairAndRevokesTheOld`, `reusingARotatedTokenRevokesEverySessionOfTheUser`, `twoConcurrentRefreshesOfOneTokenYieldExactlyOneSuccess`, `expiredRefreshTokenIs401`, `refreshForLockedAccountIs401`.
- [ ] **Step 2: Run** test-compile — expect FAIL. **Step 3: Implement** (revoke with a conditional `UPDATE ... WHERE revoked_at IS NULL` and check the affected-row count, so concurrency has one winner). **Step 4:** green on CI.
- [ ] **Step 5: Commit** `feat(identity): rotate refresh tokens and detect reuse` (`Refs: STT-12`); run the branch finish routine.

---

# Branch 4: `feat/identity/session` (STT 17)

### Task 12: Logout, logout everywhere, lockout, current user

**Files:** Modify `SessionService`, `EmailAuthService` (login), `PhoneAuthService`, `AuthController`; Create `IDENTITY/models/dtos/{LogoutRequest,MeResponse}.java`; Test `IDENTITY_TEST/controllers/SessionTests.java`.

**Interfaces:**
- Produces: `SessionService.logout(String refreshToken)`, `SessionService.logoutAll(UUID userId)`, `SessionService.revokeOthers(UUID userId, UUID keepSessionId)`; `POST /api/v1/auth/logout` (body `refreshToken`, 204, idempotent), `POST /api/v1/auth/logout-all` (authenticated, 204), `GET /api/v1/auth/me` (authenticated, `MeResponse(id, phone, email, fullName, roles)`). Lockout: on a wrong password increment `failed_login_count`; at `maxFailedLogins` set `locked_until = now + lockDuration`; a locked account answers 423 `ACCOUNT_LOCKED` before checking the password; success resets the counter and sets `last_login_at`.

- [ ] **Step 1: Write the failing test:** `logoutRevokesThatRefreshTokenOnly`, `logoutTwiceStillReturns204`, `logoutAllRevokesEveryRefreshTokenOfTheUser`, `fifthWrongPasswordLocksTheAccountFor15Minutes`, `lockedAccountRejectsEvenTheCorrectPasswordWith423`, `lockExpiresAfter15Minutes` (fixed `Clock` +15 min 1 s), `successfulLoginResetsTheFailureCounter`, `meReturnsRolesOfTheAuthenticatedUser`, `meWithoutTokenIs401`.
- [ ] **Step 2: Run** test-compile — expect FAIL. **Step 3: Implement.** **Step 4:** green on CI.
- [ ] **Step 5: Commit** `feat(identity): add logout, lockout and current user` (`Refs: STT-17`); run the branch finish routine.

---

# Branch 5: `feat/identity/password-reset` (STT 14)

### Task 13: Forgot and reset password

**Files:** Create `IDENTITY/services/PasswordService.java`, `IDENTITY/models/dtos/{ForgotPasswordRequest,ResetPasswordRequest}.java`; Modify `AuthController`; Test `IDENTITY_TEST/controllers/PasswordResetTests.java`.

**Interfaces:**
- Produces: `POST /api/v1/auth/password/forgot` (body `identifier`, always 202; sends an OTP, purpose `reset_password`, channel `sms` for a phone or `email` for an email, only when the account exists), `POST /api/v1/auth/password/reset` (body `identifier, code, newPassword`, 204). Reset verifies the OTP, stores the new hash, resets `failed_login_count` / `locked_until`, sets the matching `*_verified_at` if null, and revokes all of the user's sessions.

- [ ] **Step 1: Write the failing test:** `forgotForUnknownIdentifierAnswers202AndSendsNothing`, `resetWithCorrectCodeChangesPasswordAndRevokesSessions`, `oldPasswordNoLongerWorksAfterReset`, `resetClearsAnActiveLockout`, `sixthOtpRequestInAnHourIs429`, `resetWithWrongCodeIs400OtpInvalid`, `resetWithTooShortPasswordIs400`.
- [ ] **Step 2: Run** test-compile — expect FAIL. **Step 3: Implement.** **Step 4:** green on CI.
- [ ] **Step 5: Commit** `feat(identity): add forgot and reset password` (`Refs: STT-14`); run the branch finish routine.

---

# Branch 6: `feat/identity/change-credentials` (STT 15)

### Task 14: Change password and change phone / email

**Files:** Create `IDENTITY/services/ContactService.java`, `IDENTITY/models/dtos/{ChangePasswordRequest,ChangeContactRequest,ConfirmContactRequest}.java`; Modify `PasswordService`, `AuthController`; Test `IDENTITY_TEST/controllers/ChangeCredentialsTests.java`.

**Interfaces:**
- Consumes: `SessionService.revokeOthers(UUID userId, UUID keepSessionId)`, `AccessClaims.sessionId()` as the current session.
- Produces: `POST /api/v1/auth/password/change` (authenticated; body `currentPassword, newPassword`; 204; wrong current password -> 401 `INVALID_CREDENTIALS` and counts toward lockout; revokes all other sessions), `POST /api/v1/auth/contact/change/request` (authenticated; body `type` = `PHONE|EMAIL`, `newValue`, `currentPassword` when the account has a password; 202; OTP goes to the new contact, purpose `change_contact`), `POST /api/v1/auth/contact/change/confirm` (authenticated; body `type, newValue, code`; 204; rechecks uniqueness, sets `*_verified_at`, revokes other sessions; 409 `CONTACT_TAKEN` if someone took it meanwhile).

- [ ] **Step 1: Write the failing test:** `changePasswordRevokesOtherSessionsButKeepsTheCurrentOne`, `changePasswordWithWrongCurrentPasswordIs401`, `changePhoneSendsOtpToTheNewNumberOnly`, `confirmChangeUpdatesPhoneAndMarksItVerified`, `confirmFailsWith409WhenAnotherAccountTookTheNumber`, `changeToAnAlreadyUsedEmailAnswers202ButNeverChangesAnything`, `changeContactWithoutTokenIs401`, `newPhoneInAnyFormatIsStoredNormalized`.
- [ ] **Step 2: Run** test-compile — expect FAIL. **Step 3: Implement.** **Step 4:** green on CI.
- [ ] **Step 5: Commit** `feat(identity): change password and contact details` (`Refs: STT-15`); run the branch finish routine.

---

# Branch 7: `feat/identity/roles` (STT 16)

### Task 15: Role-based authorization and admin role assignment

**Files:** Create `IDENTITY/controllers/AdminUserController.java`, `IDENTITY/services/AdminUserService.java`, `IDENTITY/models/dtos/SetRolesRequest.java`; Modify `SecurityConfig` (`@EnableMethodSecurity`); Create `services/identity-service/README.md` (document promoting the first admin by SQL); Test `IDENTITY_TEST/controllers/AdminUserTests.java`, `IDENTITY_TEST/services/SupabaseAuthFlowIT.java`.

**Interfaces:**
- Produces: `PUT /api/v1/admin/users/{id}/roles` (`@PreAuthorize("hasRole('ADMIN')")`, body `roles: List<String>` from the five codes, 204; unknown code -> 400 `VALIDATION_ERROR`; unknown user -> 404 `NOT_FOUND`; must keep at least one role; the caller cannot remove their own `ADMIN`). The change takes effect for new access tokens; the target's refresh tokens are revoked so the old roles do not live on.
- `SupabaseAuthFlowIT` (`@Tag("supabase")`): register by phone with random `+849…` number and random email account, verify through `InMemoryMessageSender`, login, refresh, logout; delete every created row (users by id, `otp_challenge` by target) in `@AfterEach`; never reads or modifies pre-existing rows.

- [ ] **Step 1: Write the failing test:** `adminCanReplaceRolesAndTargetSessionsAreRevoked`, `tenantCannotCallTheAdminEndpoint403`, `anonymousCallIs401`, `unknownRoleCodeIs400`, `adminCannotRemoveOwnAdminRole`, `roleClaimInTokenMatchesDatabaseAfterNextLogin`.
- [ ] **Step 2: Run** test-compile — expect FAIL. **Step 3: Implement.** **Step 4:** green on CI.
- [ ] **Step 5: Supabase check (if the owner agreed):** run `-Psupabase`; expect `SupabaseMigrationIT` and `SupabaseAuthFlowIT` PASS and no leftover test rows (count `identity.user_account` before and after through the test itself).
- [ ] **Step 6: Commit** `feat(identity): add role-based authorization and admin role assignment` (`Refs: STT-16`); run the branch finish routine, then report to the owner which STT numbers are done.

---

## Self-review

- **Spec coverage:** tokens/rotation/reuse (Tasks 4, 8, 11), passwords (3), OTP rules and limits (7), phone and email flows (9, 10), reset/change (13, 14), lockout/logout/me (12), roles/admin (15), V2 + Flyway baseline + Supabase profile (5), config and `.env.example` (1), error shape (2), sender profile rule (7, Global Constraints), non-goals untouched. `prod` refusing to start without a `MessageSender`: satisfied by the absence of a bean (Task 7); add a `ContextFailsWithoutMessageSender` assertion in `PhoneAuthTests` if the builder wants it pinned.
- **Type consistency:** `TokenPair`, `AccessClaims(userId, sessionId, roles)`, `SessionService.{issue,refresh,logout,logoutAll,revokeOthers}`, `OtpService.{request,verify}` and `MessageSender.send` have one definition each and are used with those names in every later task.
- **Proportion:** signatures, test names and values only; bodies are left to the implementer.
