/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

public class SourcePiece implements Piece {
	public SourcePiece(Side outSide) {
		mOutSide = outSide;
		mFull = false;
	}

	public Side getFarSide(Side side) {
		return null;
	}

	public boolean isPipeAt(Side side) {
		if( side == mOutSide ) {
			return true;
		}
		return false;
	}

	public boolean fill(Side side) {
		if( side == null ) {
			mFull = true;
			return true;
		}
		return false;
	}

	public boolean isFull(Side side) {
		return mFull;
	}

	public Piece copyPrototype() {
		return null;
	}

	public PieceType type() {
		switch( mOutSide ) {
		case TOP:
			return PieceType.SOURCE_TOP;
		case BOTTOM:
			return PieceType.SOURCE_BOTTOM;
		case LEFT:
			return PieceType.SOURCE_LEFT;
		case RIGHT:
			return PieceType.SOURCE_RIGHT;
		}
		throw new RuntimeException( "Source has invalid type" );
	}

	public void accept(PieceVisitor viewer) {
		viewer.visitSource(mOutSide, mFull);
	}

	private Side mOutSide;
	private boolean mFull;
}
