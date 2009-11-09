/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import java.util.Random;

import pipes.root.GamePlay;
import pipes.root.Position;

public class RandomDiscarder implements Discarder {
	public RandomDiscarder( GamePlay game, long seed ) {
		mGame = game;
		mStracetate = new SubstrateWrapper( game.substrate() );
		mRandom = new Random( seed );
	}

	public Position discard() {
		if( mStracetate.empties() == 0 ) {
			return null;
		}

		for(;;) {
			Position position = mGame.position(
				mRandom.nextInt( mGame.width() ),
				mRandom.nextInt( mGame.height() )
			);
			if( mStracetate.isEmpty( position ) ) {
				return position;
			}
		}
	}

	private GamePlay mGame;
	private Stracetate mStracetate;
	private Random mRandom;
}
