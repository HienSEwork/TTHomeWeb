package vn.tthome.crm.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * The interaction history is partitioned by month and the base schema only creates the first months, so the coming
 * months are created at start-up and on the first of every month.
 */
@Component
public class PartitionMaintenance {

	private static final Logger log = LoggerFactory.getLogger(PartitionMaintenance.class);

	private final JdbcClient jdbc;

	public PartitionMaintenance(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Scheduled(cron = "0 0 3 1 * *")
	public void ensurePartitions() {
		try {
			jdbc.sql("select common.ensure_monthly_partitions('crm.interaction', 3)").query().listOfRows();
		} catch (RuntimeException e) {
			log.warn("Could not create the interaction partitions", e);
		}
	}

}
