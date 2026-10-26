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
import vn.tthome.identity.models.dtos.EmailRegisterRequest;
import vn.tthome.identity.models.dtos.EmailVerifyRequest;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.LoginRequest;
import vn.tthome.identity.models.dtos.LogoutRequest;
import vn.tthome.identity.models.dtos.MeResponse;
import vn.tthome.identity.models.dtos.OtpLoginVerifyRequest;
import vn.tthome.identity.models.dtos.PhoneRequest;
import vn.tthome.identity.models.dtos.PhoneVerifyRequest;
import vn.tthome.identity.models.dtos.RefreshRequest;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.common.error.ApiException;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.emailauth.EmailAuthService;
import vn.tthome.identity.services.login.LoginService;
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

	public AuthController(PhoneAuthService phoneAuth, EmailAuthService emailAuth, LoginService loginService,
			SessionService sessions, AccountService accounts) {
		this.phoneAuth = phoneAuth;
		this.emailAuth = emailAuth;
		this.loginService = loginService;
		this.sessions = sessions;
		this.accounts = accounts;
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

}
