package vn.tthome.search.models.dtos;

import java.util.List;

public record NearbyResponse(int total, List<NearbyItemResponse> items) {

}
