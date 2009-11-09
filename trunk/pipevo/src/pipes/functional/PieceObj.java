/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.functional;

import pipes.root.Piece;
import functional.BaseObj;

public class PieceObj extends BaseObj {

	private Piece mPiece;

	public PieceObj( Piece piece ) {
		mPiece = piece;
	}

	public Piece value() {
		return mPiece;
	}
}
