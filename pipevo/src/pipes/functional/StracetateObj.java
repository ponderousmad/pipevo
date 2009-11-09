/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.functional;

import pipes.ai.Stracetate;
import pipes.ai.SubstrateWrapper;
import pipes.root.GamePlay;
import functional.BaseObj;

public class StracetateObj extends BaseObj {

	private GamePlay mGame;
	private Stracetate mStracetate;

	public StracetateObj( GamePlay game ) {
		mGame = game;
		mStracetate = new SubstrateWrapper( game.substrate() );
	}

	public StracetateObj( GamePlay game, Stracetate stracetate ) {
		mGame = game;
		mStracetate = stracetate;
	}

	public Stracetate stracetate() {
		return mStracetate;
	}

	public GamePlay game() {
		return mGame;
	}
}
