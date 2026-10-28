package vn.tthome.report.services.audit.impl;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.report.models.dtos.AuditEntry;
import vn.tthome.report.models.dtos.AuditRecordRequest;
import vn.tthome.report.repos.auditlog.AuditLogRepository;
import vn.tthome.report.services.audit.AuditService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class AuditServiceImpl implements AuditService {

	private final AuditLogRepository log;

	public AuditServiceImpl(AuditLogRepository log) {
		this.log = log;
	}

	@Override
	@Transactional
	public void record(UUID actorId, AuditRecordRequest request) {
		log.record(actorId, literal(request.ip()), request.action().strip(), blank(request.entityType()), blank(request.entityId()));
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<AuditEntry> list(UUID actorId, String entityType, String text, Instant from, Instant to, int page, int size) {
		if (from != null && to != null && !from.isBefore(to)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "The period must end after it starts");
		}
		return PageResponse.of(log.search(actorId, blank(entityType), blank(text), from, to, PageRequest.of(page, size)), entry -> entry);
	}

	/** The address when it is an IPv4 or IPv6 literal (so no name lookup happens), otherwise null. */
	private static String literal(String ip) {
		if (ip == null || ip.isBlank() || !(ip.contains(".") || ip.contains(":"))) {
			return null;
		}
		try {
			return InetAddress.getByName(ip.strip()).getHostAddress();
		} catch (UnknownHostException e) {
			return null;
		}
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
