package vn.tthome.identity.services.adminuser;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.AdminUserResponse;
import vn.tthome.identity.models.dtos.PageResponse;
import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.adminuser.impl.AdminUserServiceImpl;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;
import vn.tthome.identity.services.session.SessionService;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

	@Mock
	UserAccountRepository users;
	@Mock
	RoleRepository roles;
	@Mock
	SessionService sessions;
	@Mock
	ContactNormalizer normalizer;

	private AdminUserServiceImpl service() {
		return new AdminUserServiceImpl(users, roles, sessions, normalizer);
	}

	private static UserAccount account(UserStatus status) {
		UserAccount user = new UserAccount();
		user.setId(UUID.randomUUID());
		user.setEmail("someone@example.com");
		user.setStatus(status);
		return user;
	}

	private static AccessClaims admin(UUID id) {
		return new AccessClaims(id, UUID.randomUUID(), List.of("ADMIN"));
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void lockMovesAnActiveAccountToLockedAndRevokesItsSessions() {
		UserAccount target = account(UserStatus.ACTIVE);
		when(users.findById(target.getId())).thenReturn(Optional.of(target));

		service().lock(admin(UUID.randomUUID()), target.getId());

		assertThat(target.getStatus()).isEqualTo(UserStatus.LOCKED);
		verify(users).saveAndFlush(target);
		verify(sessions).logoutAll(target.getId());
	}

	@Test
	void lockingALockedAccountChangesNothing() {
		UserAccount target = account(UserStatus.LOCKED);
		when(users.findById(target.getId())).thenReturn(Optional.of(target));

		service().lock(admin(UUID.randomUUID()), target.getId());

		verify(users, never()).saveAndFlush(any());
		verifyNoInteractions(sessions);
	}

	@Test
	void lockRefusesDisabledAndPendingDeleteAccounts() {
		for (UserStatus status : List.of(UserStatus.DISABLED, UserStatus.PENDING_DELETE)) {
			UserAccount target = account(status);
			when(users.findById(target.getId())).thenReturn(Optional.of(target));

			assertThatThrownBy(() -> service().lock(admin(UUID.randomUUID()), target.getId()))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));

			assertThat(target.getStatus()).isEqualTo(status);
		}
		verify(users, never()).saveAndFlush(any());
		verifyNoInteractions(sessions);
	}

	@Test
	void anAdminCannotLockThemselves() {
		UUID self = UUID.randomUUID();

		assertThatThrownBy(() -> service().lock(admin(self), self))
				.satisfies(e -> assertApi(e, HttpStatus.FORBIDDEN, "FORBIDDEN"));

		verifyNoInteractions(users, sessions);
	}

	@Test
	void lockGetAndUnlockTreatUnknownAndDeletedUsersAsNotFound() {
		UserAccount deleted = account(UserStatus.ACTIVE);
		deleted.setDeletedAt(Instant.now());
		UUID unknown = UUID.randomUUID();
		when(users.findById(deleted.getId())).thenReturn(Optional.of(deleted));
		when(users.findById(unknown)).thenReturn(Optional.empty());

		for (UUID id : List.of(deleted.getId(), unknown)) {
			assertThatThrownBy(() -> service().lock(admin(UUID.randomUUID()), id))
					.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
			assertThatThrownBy(() -> service().get(id))
					.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
			assertThatThrownBy(() -> service().unlock(id))
					.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		}
		verifyNoInteractions(sessions);
	}

	@Test
	void unlockActivatesALockedAccountAndClearsTheFailedLoginState() {
		UserAccount target = account(UserStatus.LOCKED);
		target.setFailedLoginCount((short) 5);
		target.setLockedUntil(Instant.now().plusSeconds(600));
		when(users.findById(target.getId())).thenReturn(Optional.of(target));

		service().unlock(target.getId());

		assertThat(target.getStatus()).isEqualTo(UserStatus.ACTIVE);
		assertThat(target.getFailedLoginCount()).isZero();
		assertThat(target.getLockedUntil()).isNull();
		verify(users).saveAndFlush(target);
	}

	@Test
	void unlockingAnActiveAccountChangesNothingAndDisabledOnesAreRefused() {
		UserAccount active = account(UserStatus.ACTIVE);
		UserAccount disabled = account(UserStatus.DISABLED);
		when(users.findById(active.getId())).thenReturn(Optional.of(active));
		when(users.findById(disabled.getId())).thenReturn(Optional.of(disabled));

		service().unlock(active.getId());
		assertThatThrownBy(() -> service().unlock(disabled.getId()))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));

		verify(users, never()).saveAndFlush(any());
	}

	@Test
	void getReturnsTheAccountWithItsVerificationFlags() {
		UserAccount user = account(UserStatus.ACTIVE);
		user.setPhoneVerifiedAt(Instant.now());
		when(users.findById(user.getId())).thenReturn(Optional.of(user));

		AdminUserResponse response = service().get(user.getId());

		assertThat(response.id()).isEqualTo(user.getId());
		assertThat(response.status()).isEqualTo(UserStatus.ACTIVE);
		assertThat(response.phoneVerified()).isTrue();
		assertThat(response.emailVerified()).isFalse();
		assertThat(response.roles()).isEmpty();
	}

	@Test
	void listRejectsAnUnknownRole() {
		when(roles.findByCode("NOPE")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().list(null, "NOPE", null, 0, 20))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));

		verifyNoInteractions(users);
	}

	@Test
	void listIgnoresBlankFiltersAndPassesThePageRequest() {
		UserAccount user = account(UserStatus.ACTIVE);
		when(users.search(any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(user), PageRequest.of(2, 5), 11));

		PageResponse<AdminUserResponse> page = service().list("  ", " ", UserStatus.LOCKED, 2, 5);

		ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
		verify(users).search(eq(null), eq(null), eq(null), eq(UserStatus.LOCKED), pageable.capture());
		assertThat(pageable.getValue().getPageNumber()).isEqualTo(2);
		assertThat(pageable.getValue().getPageSize()).isEqualTo(5);
		verifyNoInteractions(normalizer, roles);
		assertThat(page.items()).extracting(AdminUserResponse::id).containsExactly(user.getId());
		assertThat(page.page()).isEqualTo(2);
		assertThat(page.size()).isEqualTo(5);
		assertThat(page.total()).isEqualTo(11);
	}

	@Test
	void listSearchesTheTextAndItsNormalizedPhone() {
		when(roles.findByCode("ADMIN")).thenReturn(Optional.of(new Role()));
		when(normalizer.phone("0912345678")).thenReturn("+84912345678");
		when(users.search(any(), any(), any(), any(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

		service().list(" 0912345678 ", "ADMIN", null, 0, 20);

		verify(users).search(eq("0912345678"), eq("+84912345678"), eq("ADMIN"), eq(null), any(Pageable.class));
	}

	@Test
	void listSearchesTheTextOnlyWhenItIsNotAPhoneNumber() {
		when(normalizer.phone("alice"))
				.thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid phone number"));
		when(users.search(any(), any(), any(), any(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

		service().list("alice", null, null, 0, 20);

		verify(users).search(eq("alice"), eq(null), eq(null), eq(null), any(Pageable.class));
	}

}
