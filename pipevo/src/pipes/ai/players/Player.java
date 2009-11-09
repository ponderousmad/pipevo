/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

public enum Player {
	//The number in brackets is the version number of each AI
	HUMAN (1),
	BORDER (1),
	RANDOM (1),
	RANDOM_END (1),
	SUSAN (2),
	BOB (8),
	FAR (1);

	public final int version;

	Player (int ver) {
		version = ver;
	}

}





