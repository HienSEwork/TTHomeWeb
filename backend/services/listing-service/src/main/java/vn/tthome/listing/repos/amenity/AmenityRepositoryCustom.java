package vn.tthome.listing.repos.amenity;

/** Hand-written queries for amenitys; methods are added when a task needs an optimized query. */
public interface AmenityRepositoryCustom {

	/** The next free id; the ids are small fixed numbers with no sequence behind them. */
	short nextId();

	/** True when a project or room uses the amenity. */
	boolean isUsed(short id);

}
