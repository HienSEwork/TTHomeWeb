package vn.tthome.cms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = { "vn.tthome.cms", "vn.tthome.common.error" })
public class CmsServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CmsServiceApplication.class, args);
	}

}
