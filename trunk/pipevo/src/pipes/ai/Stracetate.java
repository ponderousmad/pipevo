/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import pipes.root.Piece;
import pipes.root.Position;

public interface Stracetate {
	public Piece at( Position position );
	public boolean isEmpty( Position position );
	public int empties();
}
