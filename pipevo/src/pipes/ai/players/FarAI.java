/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

import pipes.ai.FarDiscarder;
import pipes.ai.Discarder;
import pipes.root.GamePlay;

public class FarAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		game.setInfiniteTimeToFlow();
		mGame = game;
		mDiscarder = new FarDiscarder( game );

	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	public Player player() {
		return Player.FAR;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}
