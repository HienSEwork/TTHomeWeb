package vn.tthome.listing.services.stats.impl;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.listing.models.dtos.InventoryStats;
import vn.tthome.listing.models.dtos.ProjectPerformance;
import vn.tthome.listing.repos.project.ProjectRepository;
import vn.tthome.listing.repos.room.RoomRepository;
import vn.tthome.listing.services.stats.InventoryStatsService;

@Service
public class InventoryStatsServiceImpl implements InventoryStatsService {

	private final RoomRepository rooms;
	private final ProjectRepository projects;

	public InventoryStatsServiceImpl(RoomRepository rooms, ProjectRepository projects) {
		this.rooms = rooms;
		this.projects = projects;
	}

	@Override
	@Transactional(readOnly = true)
	public InventoryStats inventory() {
		return rooms.inventory();
	}

	@Override
	@Transactional(readOnly = true)
	public List<ProjectPerformance> projects(int size) {
		return projects.busiest(PageRequest.of(0, size)).stream()
				.map(p -> new ProjectPerformance(p.getId(), p.getName(), p.getTotalRooms(), p.getVacantCount(),
						1.0 - (double) p.getVacantCount() / p.getTotalRooms(),
						p.getMinPrice() == null ? null : p.getMinPrice().longValueExact()))
				.toList();
	}

}
