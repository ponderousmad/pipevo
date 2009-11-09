/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import pipes.root.Piece;
import pipes.root.Position;

public class Acetate implements Stracetate {
	private Stracetate mStracetate;
	private Piece mPiece;
	private Position mPosition;

	public Acetate( Stracetate stracetate, Piece piece, Position position ) {
		mStracetate = stracetate;
		mPiece = piece;
		mPosition = position;
	}

	public Piece at( Position position ) {
		if( !position.valid() ) {
			return null;
		}
		if( position.equals( mPosition ) ) {
			return mPiece;
		}
		return mStracetate.at( position );
	}

	public boolean isEmpty( Position position ) {
		return at( position ) == null;
	}

	public int empties() {
		return mStracetate.empties() - (isEmpty( mPosition ) ? 1 : 0);
	}
}
