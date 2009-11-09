/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

import pipes.ai.PipeFollower;
import pipes.root.GamePlay;

public class RandomEndAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mRandom.setGame( game, seed );
	}

	public boolean performMove() {
		PipeFollower pipe = new PipeFollower( mGame );

		if( pipe.follow() ) {
			if( mGame.peek()[0].isPipeAt( pipe.outDirection().opposite() ) ) {
				mGame.placeNext( pipe.outPosition() );
			} else {
				return mRandom.performMove();
			}
			return true;
		}
		return false;
	}

	public Player player() {
		return Player.RANDOM_END;
	}

	GamePlay mGame = null;
	RandomAI mRandom = new RandomAI();
}
