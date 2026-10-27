package vn.tthome.listing.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import vn.tthome.listing.models.dtos.InventoryStats;
import vn.tthome.listing.models.dtos.ProjectPerformance;
import vn.tthome.listing.services.stats.InventoryStatsService;

@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class InventoryStatsController {

	private final InventoryStatsService stats;

	public InventoryStatsController(InventoryStatsService stats) {
		this.stats = stats;
	}

	@GetMapping("/inventory")
	public InventoryStats inventory() {
		return stats.inventory();
	}

	@GetMapping("/projects")
	public List<ProjectPerformance> projects(@RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
		return stats.projects(size);
	}

}
