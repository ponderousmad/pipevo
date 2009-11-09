/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.functional;

import pipes.root.GamePlay;
import functional.BaseObj;

public class Game extends BaseObj {
	GamePlay mGame;

	public Game( GamePlay game ) {
		mGame = game;
	}

	public GamePlay value() {
		return mGame;
	}
}
