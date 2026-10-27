package vn.tthome.consignment.services.submission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
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
import vn.tthome.consignment.models.dtos.ReviewRequest;
import vn.tthome.consignment.models.dtos.SubmissionResponse;
import vn.tthome.consignment.models.entities.ReviewLog;
import vn.tthome.consignment.models.entities.Submission;
import vn.tthome.consignment.repos.reviewlog.ReviewLogRepository;
import vn.tthome.consignment.repos.submission.SubmissionRepository;
import vn.tthome.consignment.services.submission.impl.SubmissionServiceImpl;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceImplTest {

	private static final UUID REVIEWER = UUID.randomUUID();

	@Mock
	SubmissionRepository submissions;
	@Mock
	ReviewLogRepository log;

	private SubmissionServiceImpl service() {
		return new SubmissionServiceImpl(submissions, log);
	}

	private Submission submission(String status) {
		Submission s = new Submission();
		s.setId(UUID.randomUUID());
		s.setCode("KG-1");
		s.setLandlordName("Chu Nha");
		s.setLandlordPhone("0912345678");
		s.setAddressText("12 Nguyen Hue");
		s.setStatus(status);
		s.setExpectedPriceMin(new BigDecimal("3000000"));
		when(submissions.findById(s.getId())).thenReturn(Optional.of(s));
		return s;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	private ReviewLog lastLog() {
		ArgumentCaptor<ReviewLog> row = ArgumentCaptor.forClass(ReviewLog.class);
		verify(log).saveAndFlush(row.capture());
		return row.getValue();
	}

	@Test
	void approvingIsLoggedWithTheReviewer() {
		Submission s = submission("submitted");

		SubmissionResponse response = service().review(REVIEWER, s.getId(), new ReviewRequest("approve", null));

		assertThat(response.status()).isEqualTo("approved");
		assertThat(response.reviewerId()).isEqualTo(REVIEWER);
		assertThat(response.rejectReason()).isNull();
		ReviewLog row = lastLog();
		assertThat(row.getFromStatus()).isEqualTo("submitted");
		assertThat(row.getToStatus()).isEqualTo("approved");
		assertThat(row.getReviewerId()).isEqualTo(REVIEWER);
		assertThat(row.getSubmissionId()).isEqualTo(s.getId());
		assertThat(row.getNote()).isNull();
	}

	@Test
	void rejectingKeepsTheReasonOnTheSubmissionAndInTheLog() {
		Submission s = submission("submitted");

		SubmissionResponse response = service().review(REVIEWER, s.getId(), new ReviewRequest("reject", " Not in our area "));

		assertThat(response.status()).isEqualTo("rejected");
		assertThat(response.rejectReason()).isEqualTo("Not in our area");
		assertThat(lastLog().getNote()).isEqualTo("Not in our area");
	}

	@Test
	void askingForInformationNeedsANoteAndKeepsTheSubmissionOpen() {
		Submission s = submission("submitted");

		SubmissionResponse response = service().review(REVIEWER, s.getId(), new ReviewRequest("need_info", "Send the floor plan"));

		assertThat(response.status()).isEqualTo("need_info");
		assertThat(response.rejectReason()).isNull();
		assertThat(lastLog().getNote()).isEqualTo("Send the floor plan");
	}

	@Test
	void aSubmissionWaitingForInformationCanBeDecidedAgain() {
		Submission waiting = submission("need_info");
		Submission again = submission("need_info");

		assertThat(service().review(REVIEWER, waiting.getId(), new ReviewRequest("approve", "Thanks")).status()).isEqualTo("approved");
		assertThat(service().review(REVIEWER, again.getId(), new ReviewRequest("need_info", "Still missing the deed")).status())
				.isEqualTo("need_info");
	}

	@Test
	void rejectingAndAskingNeedANote() {
		Submission s = submission("submitted");

		for (String decision : new String[] { "reject", "need_info" }) {
			for (String note : new String[] { null, "", "  " }) {
				assertThatThrownBy(() -> service().review(REVIEWER, s.getId(), new ReviewRequest(decision, note)))
						.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
			}
		}
		assertThat(s.getStatus()).isEqualTo("submitted");
		verify(log, never()).saveAndFlush(any());
	}

	@Test
	void everyOtherStatusIsFinalForTheReviewer() {
		for (String status : new String[] { "approved", "rejected", "published", "withdrawn" }) {
			Submission s = submission(status);

			assertThatThrownBy(() -> service().review(REVIEWER, s.getId(), new ReviewRequest("approve", null)))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
			assertThat(s.getStatus()).isEqualTo(status);
		}
		verify(submissions, never()).saveAndFlush(any());
	}

	@Test
	void getReturnsTheLogAndConvertsThePrices() {
		Submission s = submission("need_info");
		ReviewLog row = new ReviewLog();
		row.setFromStatus("submitted");
		row.setToStatus("need_info");
		row.setNote("floor plan");
		when(log.findBySubmissionIdOrderByCreatedAtAsc(s.getId())).thenReturn(List.of(row));

		SubmissionResponse response = service().get(s.getId());

		assertThat(response.reviewLog()).hasSize(1);
		assertThat(response.expectedPriceMin()).isEqualTo(3_000_000L);
		assertThat(response.expectedPriceMax()).isNull();
	}

	@Test
	void unknownSubmissionsAreNotFoundAndListIgnoresBlankFilters() {
		UUID unknown = UUID.randomUUID();
		when(submissions.findById(unknown)).thenReturn(Optional.empty());
		when(submissions.search(any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(new Submission()), PageRequest.of(1, 5), 6));

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().review(REVIEWER, unknown, new ReviewRequest("approve", null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		assertThat(service().list(" ", null, null, "", 1, 5).total()).isEqualTo(6);
		verify(submissions).search(eq(null), eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
	}

}
