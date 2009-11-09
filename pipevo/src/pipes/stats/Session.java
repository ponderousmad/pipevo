/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.stats;

import java.util.ArrayList;
import java.util.List;

import pipes.ai.players.Player;

/**
 * Keeps track of the stats for a given session.
 */
public class Session {

	/**
	 * Construct with no results.
	 */
	public Session() {
		for( int i = 0; i < mResults.length; ++i ) {
			mResults[ i ] = new Results();
		}
	}

	/**
	 * Keep track of a set of results.
	 */
	class Results {
		/**
		 * Add a score/seed pair.
		 * @param score The game score for the run.
		 * @param seed The randomization seed for the run.
		 */
		void add( int score, long seed ) {
			mRuns.add( score );
			mSeeds.add( seed );
		}

		/**
		 * Gets the number of runs in this set of results.
		 */
		int count() {
			// runs and seeds should always be the same size.
			return mRuns.size();
		}

		List<Integer> mRuns = new ArrayList<Integer>();
		List<Long> mSeeds = new ArrayList<Long>();
	}
	Results[] mResults = new Results[ Player.values().length ];

	/**
	 * Add a run for the specified player
	 * @param player The player ID.
	 * @param score The game score for the run.
	 * @param seed The randomization seed for the run.
	 */
	public synchronized void addRun( Player player, int score, long seed ) {
		mResults[ player.ordinal() ].add( score, seed );
	}

	/**
	 * Gets the results for the player in this session.
	 */
	public synchronized Results results( Player player ) {
		return mResults[ player.ordinal() ];
	}
}
