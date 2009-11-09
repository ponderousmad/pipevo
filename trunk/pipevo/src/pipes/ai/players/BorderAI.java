/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

import pipes.ai.BorderDiscarder;
import pipes.ai.Discarder;
import pipes.root.GamePlay;

public class BorderAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		game.setInfiniteTimeToFlow();
		mGame = game;
		mDiscarder = new BorderDiscarder( game );
	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	public Player player() {
		return Player.BORDER;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}
