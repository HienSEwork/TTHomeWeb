package vn.tthome.consignment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = { "vn.tthome.consignment", "vn.tthome.common.error" })
public class ConsignmentServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ConsignmentServiceApplication.class, args);
	}

}
