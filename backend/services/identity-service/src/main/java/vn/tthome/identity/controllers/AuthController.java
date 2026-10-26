package vn.tthome.identity.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import vn.tthome.identity.models.dtos.ChangeContactRequest;
import vn.tthome.identity.models.dtos.ChangePasswordRequest;
import vn.tthome.identity.models.dtos.ConfirmContactRequest;
import vn.tthome.identity.models.dtos.EmailRegisterRequest;
import vn.tthome.identity.models.dtos.EmailVerifyRequest;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.ForgotPasswordRequest;
import vn.tthome.identity.models.dtos.LoginRequest;
import vn.tthome.identity.models.dtos.LogoutRequest;
import vn.tthome.identity.models.dtos.MeResponse;
import vn.tthome.identity.models.dtos.OtpLoginVerifyRequest;
import vn.tthome.identity.models.dtos.PhoneRequest;
import vn.tthome.identity.models.dtos.PhoneVerifyRequest;
import vn.tthome.identity.models.dtos.RefreshRequest;
import vn.tthome.identity.models.dtos.ResetPasswordRequest;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.common.error.ApiException;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.contact.ContactService;
import vn.tthome.identity.services.emailauth.EmailAuthService;
import vn.tthome.identity.services.login.LoginService;
import vn.tthome.identity.services.password.PasswordService;
import vn.tthome.identity.services.phoneauth.PhoneAuthService;
import vn.tthome.identity.services.session.SessionService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final PhoneAuthService phoneAuth;
	private final EmailAuthService emailAuth;
	private final LoginService loginService;
	private final SessionService sessions;
	private final AccountService accounts;
	private final PasswordService passwords;
	private final ContactService contacts;

	public AuthController(PhoneAuthService phoneAuth, EmailAuthService emailAuth, LoginService loginService,
			SessionService sessions, AccountService accounts, PasswordService passwords,
			ContactService contacts) {
		this.phoneAuth = phoneAuth;
		this.emailAuth = emailAuth;
		this.loginService = loginService;
		this.sessions = sessions;
		this.accounts = accounts;
		this.passwords = passwords;
		this.contacts = contacts;
	}

	@PostMapping("/register/phone/request")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void registerPhoneRequest(@Valid @RequestBody PhoneRequest body, HttpServletRequest request) {
		phoneAuth.requestRegistration(body.phone(), request.getRemoteAddr());
	}

	@PostMapping("/register/phone/verify")
	public TokenPair registerPhoneVerify(@Valid @RequestBody PhoneVerifyRequest body, HttpServletRequest request) {
		return phoneAuth.verifyRegistration(body, request.getHeader("User-Agent"), request.getRemoteAddr());
	}

	@PostMapping("/login/otp/request")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void loginOtpRequest(@Valid @RequestBody PhoneRequest body, HttpServletRequest request) {
		phoneAuth.requestLogin(body.phone(), request.getRemoteAddr());
	}

	@PostMapping("/login/otp/verify")
	public TokenPair loginOtpVerify(@Valid @RequestBody OtpLoginVerifyRequest body, HttpServletRequest request) {
		return phoneAuth.verifyLogin(body, request.getHeader("User-Agent"), request.getRemoteAddr());
	}

	@PostMapping("/register/email")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void registerEmail(@Valid @RequestBody EmailRegisterRequest body, HttpServletRequest request) {
		emailAuth.register(body, request.getRemoteAddr());
	}

	@PostMapping("/register/email/verify")
	public TokenPair registerEmailVerify(@Valid @RequestBody EmailVerifyRequest body, HttpServletRequest request) {
		return emailAuth.verify(body, request.getHeader("User-Agent"), request.getRemoteAddr());
	}

	@PostMapping("/login")
	public TokenPair login(@Valid @RequestBody LoginRequest body, HttpServletRequest request) {
		return loginService.login(body, request.getHeader("User-Agent"), request.getRemoteAddr());
	}

	@PostMapping("/refresh")
	public TokenPair refresh(@Valid @RequestBody RefreshRequest body, HttpServletRequest request) {
		return sessions.refresh(body.refreshToken(), request.getHeader("User-Agent"), request.getRemoteAddr());
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(@Valid @RequestBody LogoutRequest body) {
		sessions.logout(body.refreshToken());
	}

	@PostMapping("/logout-all")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logoutAll(@AuthenticationPrincipal AccessClaims claims) {
		sessions.logoutAll(claims.userId());
	}

	@GetMapping("/me")
	public MeResponse me(@AuthenticationPrincipal AccessClaims claims) {
		return accounts.findById(claims.userId()).map(MeResponse::from)
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_INVALID", "Invalid or expired token"));
	}

	@PostMapping("/password/forgot")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest body, HttpServletRequest request) {
		passwords.forgot(body.identifier(), request.getRemoteAddr());
	}

	@PostMapping("/password/reset")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void resetPassword(@Valid @RequestBody ResetPasswordRequest body) {
		passwords.reset(body);
	}

	@PostMapping("/password/change")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(@AuthenticationPrincipal AccessClaims claims, @Valid @RequestBody ChangePasswordRequest body) {
		passwords.change(claims, body);
	}

	@PostMapping("/contact/change/request")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void requestContactChange(@AuthenticationPrincipal AccessClaims claims,
			@Valid @RequestBody ChangeContactRequest body, HttpServletRequest request) {
		contacts.requestChange(claims, body, request.getRemoteAddr());
	}

	@PostMapping("/contact/change/confirm")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void confirmContactChange(@AuthenticationPrincipal AccessClaims claims,
			@Valid @RequestBody ConfirmContactRequest body) {
		contacts.confirmChange(claims, body);
	}

}
