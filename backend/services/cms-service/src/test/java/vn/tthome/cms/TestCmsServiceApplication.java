package vn.tthome.cms;

import org.springframework.boot.SpringApplication;

public class TestCmsServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(CmsServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
