/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import pipes.root.GamePlay;
import pipes.root.Position;


public class FarDiscarder implements Discarder {
	public FarDiscarder( GamePlay game ) {
		mGame = game;
		mStracetate = new SubstrateWrapper( mGame.substrate() );
	}

	public FarDiscarder( GamePlay game, Stracetate stracetate ) {
		mGame = game;
		mStracetate = stracetate;
	}

	public Position discard() {
		SubstrateExplorer explorer = SubstrateExplorer.buildExplorer( mGame, mStracetate );
		assert( explorer != null );

		return explorer.findEmptyPosFarFromOutput();
	}

	private GamePlay mGame;
	private Stracetate mStracetate;
}
