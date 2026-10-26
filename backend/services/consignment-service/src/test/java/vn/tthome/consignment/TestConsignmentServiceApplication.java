package vn.tthome.consignment;

import org.springframework.boot.SpringApplication;

public class TestConsignmentServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(ConsignmentServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
