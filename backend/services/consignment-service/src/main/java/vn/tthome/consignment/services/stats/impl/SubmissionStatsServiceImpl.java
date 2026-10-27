package vn.tthome.consignment.services.stats.impl;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.consignment.models.dtos.SubmissionStats;
import vn.tthome.consignment.repos.submission.SubmissionRepository;
import vn.tthome.consignment.services.stats.SubmissionStatsService;

@Service
public class SubmissionStatsServiceImpl implements SubmissionStatsService {

	private final SubmissionRepository submissions;

	public SubmissionStatsServiceImpl(SubmissionRepository submissions) {
		this.submissions = submissions;
	}

	@Override
	@Transactional(readOnly = true)
	public SubmissionStats submissions() {
		Map<String, Long> byStatus = submissions.countByStatus();
		long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
		return new SubmissionStats(total, byStatus, byStatus.getOrDefault("submitted", 0L));
	}

}
