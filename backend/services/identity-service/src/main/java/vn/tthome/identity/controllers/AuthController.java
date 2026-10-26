package vn.tthome.identity.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import vn.tthome.identity.models.dtos.OtpLoginVerifyRequest;
import vn.tthome.identity.models.dtos.PhoneRequest;
import vn.tthome.identity.models.dtos.PhoneVerifyRequest;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.services.phoneauth.PhoneAuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final PhoneAuthService phoneAuth;

	public AuthController(PhoneAuthService phoneAuth) {
		this.phoneAuth = phoneAuth;
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

}
