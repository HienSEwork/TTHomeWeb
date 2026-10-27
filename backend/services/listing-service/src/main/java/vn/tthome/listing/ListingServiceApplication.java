package vn.tthome.listing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = { "vn.tthome.listing", "vn.tthome.common.error" })
public class ListingServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ListingServiceApplication.class, args);
	}

}
