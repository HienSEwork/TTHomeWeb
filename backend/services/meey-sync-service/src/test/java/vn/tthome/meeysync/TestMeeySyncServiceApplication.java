package vn.tthome.meeysync;

import org.springframework.boot.SpringApplication;

public class TestMeeySyncServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(MeeySyncServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
