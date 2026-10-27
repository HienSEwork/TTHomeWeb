package vn.tthome.listing.repos.landmark;

/** Hand-written queries for landmarks; methods are added when a task needs an optimized query. */
public interface LandmarkRepositoryCustom {

	/** The next free id; the ids are small fixed numbers with no sequence behind them. */
	short nextId();

}
