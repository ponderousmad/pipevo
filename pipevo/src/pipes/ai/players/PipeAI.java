/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

import pipes.root.GamePlay;

public interface PipeAI {
	public void setGame( GamePlay game, long seed );
	public boolean performMove();
	public Player player();
}
