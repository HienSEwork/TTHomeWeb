package vn.tthome.consignment.services.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.tthome.consignment.models.dtos.SubmissionStats;
import vn.tthome.consignment.repos.submission.SubmissionRepository;
import vn.tthome.consignment.services.stats.impl.SubmissionStatsServiceImpl;

@ExtendWith(MockitoExtension.class)
class SubmissionStatsServiceImplTest {

	@Mock
	SubmissionRepository submissions;

	@Test
	void theTotalIsTheSumAndPendingReviewIsTheSubmittedOnes() {
		when(submissions.countByStatus()).thenReturn(Map.of("submitted", 4L, "need_info", 1L, "approved", 2L));

		SubmissionStats stats = new SubmissionStatsServiceImpl(submissions).submissions();

		assertThat(stats.total()).isEqualTo(7);
		assertThat(stats.pendingReview()).isEqualTo(4);
		assertThat(stats.byStatus()).containsEntry("need_info", 1L);
	}

	@Test
	void noSubmissionsMeansZeros() {
		when(submissions.countByStatus()).thenReturn(Map.of());

		SubmissionStats stats = new SubmissionStatsServiceImpl(submissions).submissions();

		assertThat(stats.total()).isZero();
		assertThat(stats.pendingReview()).isZero();
	}

}
