/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

import pipes.ai.Discarder;
import pipes.ai.RandomDiscarder;
import pipes.root.GamePlay;

public class RandomAI implements PipeAI {
	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mDiscarder = new RandomDiscarder( game, seed );
	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	private GamePlay mGame;
	private Discarder mDiscarder;

	public Player player() {
		return Player.RANDOM;
	}
}
