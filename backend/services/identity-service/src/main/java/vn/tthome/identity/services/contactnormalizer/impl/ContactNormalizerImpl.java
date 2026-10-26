package vn.tthome.identity.services.contactnormalizer.impl;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;

@Service
public class ContactNormalizerImpl implements ContactNormalizer {

	// Mobile prefixes 03x, 05x, 07x, 08x, 09x: 9 digits after the country code.
	private static final Pattern PHONE = Pattern.compile("^(?:\\+84|84|0)([35789]\\d{8})$");
	private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s.]+(?:\\.[^@\\s.]+)+$");
	private static final int EMAIL_MAX_LENGTH = 254;

	@Override
	public String phone(String raw) {
		if (raw != null) {
			Matcher m = PHONE.matcher(raw.replaceAll("[\\s.\\-()]", ""));
			if (m.matches()) {
				return "+84" + m.group(1);
			}
		}
		throw invalid("Invalid phone number");
	}

	@Override
	public String email(String raw) {
		if (raw != null) {
			String value = raw.trim().toLowerCase(Locale.ROOT);
			if (value.length() <= EMAIL_MAX_LENGTH && EMAIL.matcher(value).matches()) {
				return value;
			}
		}
		throw invalid("Invalid email address");
	}

	@Override
	public boolean looksLikeEmail(String identifier) {
		return identifier != null && identifier.indexOf('@') >= 0;
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

}
