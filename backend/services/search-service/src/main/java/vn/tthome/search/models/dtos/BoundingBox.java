package vn.tthome.search.models.dtos;

/** Map viewport in degrees: west/south is the lower-left corner, east/north the upper-right. */
public record BoundingBox(double minLng, double minLat, double maxLng, double maxLat) {

}
