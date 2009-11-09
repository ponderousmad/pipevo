/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

/**
 * Keeps track of a piece of pipe with only a single straight or bent section.
 */
public class SimplePiece implements Piece {
	public SimplePiece( PieceType.SingleType type ) {
		assert( type != null );
		mType = type;
	}

	public Side getFarSide( Side side ) {
		if( mType.start() == side ) {
			return mType.end();
		} else if( mType.end() == side ) {
			return mType.start();
		} else {
			return null;
		}
	}

	public boolean isPipeAt( Side side ) {
		if( side == mType.start() || side == mType.end() ) {
			return true;
		}
		return false;
	}

	public boolean fill(Side side) {
		if( side == mType.start() || side == mType.end() ) {
			mFull = true;
			return true;
		}
		return false;
	}

	public boolean isFull(Side side) {
		if( side == null || side == mType.start() || side == mType.end() ) {
			return mFull;
		}
		return false;
	}

	public void accept(PieceVisitor viewer) {
		viewer.visitSimple( mType, mFull );
	}

	public PieceType type() {
		return mType.type();
	}

	private PieceType.SingleType mType;
	private boolean mFull = false;
}
