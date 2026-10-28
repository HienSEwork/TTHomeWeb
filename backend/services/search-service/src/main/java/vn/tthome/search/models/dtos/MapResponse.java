package vn.tthome.search.models.dtos;

import java.util.List;

public record MapResponse(int totalPins, List<MapPinResponse> pins) {

}
