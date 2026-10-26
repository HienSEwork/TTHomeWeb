package vn.tthome.crm;

import org.springframework.boot.SpringApplication;

public class TestCrmServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(CrmServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
